import asyncio
import secrets
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from imagen_construct.domain.errors import ProjectNotFoundError
from imagen_construct.ports.asset_store import AssetStore, StoredAsset
from imagen_construct.ports.generation_adapter import GenerationAdapter, GenerateImageRequest
from imagen_construct.ports.project_repository import ProjectRepository

JobStatus = Literal["queued", "running", "completed", "failed", "cancelled"]


def _now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


@dataclass
class GenerationJob:
    id: str
    project_id: str
    adapter_id: str
    prompt: str
    width: int
    height: int
    seed: int
    replace_layer_id: str | None = None
    status: JobStatus = "queued"
    progress: int = 0
    error: str | None = None
    asset: StoredAsset | None = None
    model_id: str | None = None
    workflow_id: str | None = None
    created_at: str = field(default_factory=_now)
    started_at: str | None = None
    completed_at: str | None = None
    cancel_requested: bool = False

    def snapshot(self) -> dict[str, object]:
        result: dict[str, object] | None = None
        if self.asset is not None:
            result = {
                "asset": self.asset,
                "generation": {
                    "adapterId": self.adapter_id,
                    "modelId": self.model_id,
                    "workflowId": self.workflow_id,
                    "seed": self.seed,
                    "prompt": {"positive": self.prompt},
                    "generatedAt": self.completed_at,
                    "sourceJobId": self.id,
                },
            }
        return {
            "id": self.id,
            "projectId": self.project_id,
            "adapterId": self.adapter_id,
            "prompt": self.prompt,
            "width": self.width,
            "height": self.height,
            "seed": self.seed,
            "replaceLayerId": self.replace_layer_id,
            "status": self.status,
            "progress": self.progress,
            "error": self.error,
            "result": result,
            "createdAt": self.created_at,
            "startedAt": self.started_at,
            "completedAt": self.completed_at,
        }


class GenerationJobNotFoundError(LookupError):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Generation job '{job_id}' was not found.")


class GenerationService:
    """Single-lane local job queue with adapter-independent job snapshots."""

    def __init__(
        self,
        project_repository: ProjectRepository,
        asset_store: AssetStore,
        adapters: list[GenerationAdapter],
    ) -> None:
        self._project_repository = project_repository
        self._asset_store = asset_store
        self._adapters = {adapter.id: adapter for adapter in adapters}
        self._jobs: dict[str, GenerationJob] = {}
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._subscribers: set[asyncio.Queue[dict[str, object]]] = set()
        self._worker: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if self._worker is None or self._worker.done():
            self._worker = asyncio.create_task(self._run_worker(), name="imagen-generation-worker")

    async def stop(self) -> None:
        if self._worker is None:
            return
        self._worker.cancel()
        with suppress(asyncio.CancelledError):
            await self._worker
        self._worker = None

    def adapters(self) -> list[dict[str, object]]:
        return [dict(adapter.capabilities()) for adapter in self._adapters.values()]

    def adapter(self, adapter_id: str) -> dict[str, object]:
        adapter = self._adapters.get(adapter_id)
        if adapter is None:
            raise KeyError(f"Generation adapter '{adapter_id}' is not available.")
        return dict(adapter.capabilities())

    async def submit(
        self,
        *,
        project_id: str,
        prompt: str,
        adapter_id: str = "mock-rgba",
        width: int = 512,
        height: int = 512,
        seed: int | None = None,
        replace_layer_id: str | None = None,
    ) -> dict[str, object]:
        clean_prompt = prompt.strip()
        if not clean_prompt:
            raise ValueError("Prompt cannot be empty.")
        if adapter_id not in self._adapters:
            raise KeyError(f"Generation adapter '{adapter_id}' is not available.")
        if width < 64 or height < 64 or width > 2048 or height > 2048:
            raise ValueError("Generation dimensions must be between 64 and 2048 pixels.")
        try:
            self._project_repository.get(project_id)
        except ProjectNotFoundError:
            raise

        job = GenerationJob(
            id=str(uuid4()),
            project_id=project_id,
            adapter_id=adapter_id,
            prompt=clean_prompt,
            width=width,
            height=height,
            seed=seed if seed is not None else secrets.randbelow(2**32),
            replace_layer_id=replace_layer_id,
        )
        self._jobs[job.id] = job
        await self._queue.put(job.id)
        self._publish(job)
        return job.snapshot()

    def get(self, job_id: str) -> dict[str, object]:
        return self._require_job(job_id).snapshot()

    def cancel(self, job_id: str) -> dict[str, object]:
        job = self._require_job(job_id)
        if job.status in {"completed", "failed", "cancelled"}:
            return job.snapshot()
        job.cancel_requested = True
        if job.status == "queued":
            job.status = "cancelled"
            job.completed_at = _now()
            job.progress = 0
        self._publish(job)
        return job.snapshot()

    def subscribe(self) -> asyncio.Queue[dict[str, object]]:
        queue: asyncio.Queue[dict[str, object]] = asyncio.Queue(maxsize=64)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict[str, object]]) -> None:
        self._subscribers.discard(queue)

    def _require_job(self, job_id: str) -> GenerationJob:
        job = self._jobs.get(job_id)
        if job is None:
            raise GenerationJobNotFoundError(job_id)
        return job

    def _publish(self, job: GenerationJob) -> None:
        snapshot = job.snapshot()
        for subscriber in tuple(self._subscribers):
            if subscriber.full():
                with suppress(asyncio.QueueEmpty):
                    subscriber.get_nowait()
            with suppress(asyncio.QueueFull):
                subscriber.put_nowait(snapshot)

    async def _set_progress(self, job: GenerationJob, progress: int) -> None:
        job.progress = progress
        self._publish(job)
        await asyncio.sleep(0.08)

    async def _run_worker(self) -> None:
        while True:
            job_id = await self._queue.get()
            try:
                job = self._require_job(job_id)
                if job.status == "cancelled" or job.cancel_requested:
                    continue

                adapter = self._adapters[job.adapter_id]
                job.status = "running"
                job.started_at = _now()
                await self._set_progress(job, 10)
                await self._set_progress(job, 35)

                generated = await adapter.generate(
                    GenerateImageRequest(
                        prompt=job.prompt,
                        width=job.width,
                        height=job.height,
                        seed=job.seed,
                    )
                )
                if job.cancel_requested:
                    job.status = "cancelled"
                    job.completed_at = _now()
                    self._publish(job)
                    continue

                await self._set_progress(job, 80)
                job.asset = self._asset_store.save_image(job.project_id, generated.payload)
                job.model_id = generated.model_id
                job.workflow_id = generated.workflow_id
                job.status = "completed"
                job.progress = 100
                job.completed_at = _now()
                self._publish(job)
            except asyncio.CancelledError:
                raise
            except Exception as error:  # Boundary: adapters may surface backend-specific errors.
                job = self._jobs.get(job_id)
                if job is not None:
                    job.status = "failed"
                    job.error = str(error) or error.__class__.__name__
                    job.completed_at = _now()
                    self._publish(job)
            finally:
                self._queue.task_done()
