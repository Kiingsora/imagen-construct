import asyncio

from imagen_construct.application.generation_service import GenerationService
from imagen_construct.application.project_service import ProjectService
from imagen_construct.infrastructure.adapters.mock_adapter import MockGenerationAdapter
from imagen_construct.infrastructure.assets.file_asset_store import FileAssetStore
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository


async def wait_for_terminal_state(service: GenerationService, job_id: str):
    for _ in range(100):
        snapshot = service.get(job_id)
        if snapshot["status"] in {"completed", "failed", "cancelled"}:
            return snapshot
        await asyncio.sleep(0.03)
    raise AssertionError("Generation job did not reach a terminal state.")


def test_mock_adapter_generates_a_project_asset(tmp_path):
    async def scenario():
        repository = FileProjectRepository(tmp_path)
        project = ProjectService(repository).create_project("Mock generation")
        service = GenerationService(
            project_repository=repository,
            asset_store=FileAssetStore(tmp_path),
            adapters=[MockGenerationAdapter()],
        )
        await service.start()
        try:
            submitted = await service.submit(
                project_id=project["id"],
                prompt="A violet sofa",
                width=256,
                height=256,
                seed=42,
            )
            result = await wait_for_terminal_state(service, submitted["id"])
            assert result["status"] == "completed"
            assert result["progress"] == 100
            assert result["result"]["generation"]["seed"] == 42
            relative_path = result["result"]["asset"]["path"]
            assert (tmp_path / "projects" / project["id"] / relative_path).is_file()
        finally:
            await service.stop()

    asyncio.run(scenario())


def test_queued_job_can_be_cancelled(tmp_path):
    async def scenario():
        repository = FileProjectRepository(tmp_path)
        project = ProjectService(repository).create_project("Cancellation")
        service = GenerationService(
            project_repository=repository,
            asset_store=FileAssetStore(tmp_path),
            adapters=[MockGenerationAdapter()],
        )
        await service.start()
        try:
            first = await service.submit(project_id=project["id"], prompt="First")
            second = await service.submit(project_id=project["id"], prompt="Second")
            cancelled = service.cancel(second["id"])
            assert cancelled["status"] == "cancelled"
            assert (await wait_for_terminal_state(service, first["id"]))["status"] == "completed"
            assert service.get(second["id"])["status"] == "cancelled"
        finally:
            await service.stop()

    asyncio.run(scenario())
