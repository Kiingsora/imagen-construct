from pathlib import Path
from uuid import uuid4

from imagen_construct.infrastructure.comfyui import (
    ComfyUIClient,
    ComfyUIWorkflowManifest,
    load_workflow_manifest,
    prepare_workflow,
)
from imagen_construct.ports.generation_adapter import (
    AdapterCapabilities,
    GenerateImageRequest,
    GeneratedImage,
)


class ComfyUIWorkflowAdapter:
    """Adapter for one reviewed, versioned ComfyUI API workflow.

    It is intentionally not registered in the application until a real workflow and
    its model licenses have been selected and tested. The editor therefore remains
    independent from ComfyUI node identifiers.
    """

    def __init__(
        self,
        *,
        adapter_id: str,
        manifest_path: Path,
        client: ComfyUIClient,
    ) -> None:
        self.id = adapter_id
        self._manifest_path = manifest_path.resolve()
        self._manifest: ComfyUIWorkflowManifest = load_workflow_manifest(self._manifest_path)
        self._client = client
        self._active_prompt_id: str | None = None

    def capabilities(self) -> AdapterCapabilities:
        return {
            "id": self.id,
            "name": self._manifest.name,
            "textToImage": True,
            "transparentOutput": self._manifest.output_kind == "rgba",
            "deterministic": True,
            # Cancellation exists at transport level. It remains hidden from the UI
            # until job-scoped cancellation is wired into the adapter contract.
            "cancellable": False,
        }

    async def generate(self, request: GenerateImageRequest) -> GeneratedImage:
        prepared = prepare_workflow(
            self._manifest_path,
            {
                "prompt": request.prompt,
                "seed": request.seed,
                "width": request.width,
                "height": request.height,
            },
        )
        submission = await self._client.submit_prompt(
            prepared.graph,
            client_id=f"imagen-construct-{uuid4()}",
        )
        self._active_prompt_id = submission.prompt_id
        try:
            history = await self._client.wait_for_completion(submission.prompt_id)
            output = self._client.output_images(
                history,
                output_node_id=prepared.output_node_id,
            )[0]
            payload = await self._client.download_image(output)
            model_id = self._manifest.required_models[0] if self._manifest.required_models else "comfyui-workflow"
            return GeneratedImage(
                payload=payload,
                model_id=model_id,
                workflow_id=f"{prepared.workflow_id}@{prepared.workflow_version}",
                seed=request.seed,
            )
        finally:
            self._active_prompt_id = None

    async def cancel_active(self) -> None:
        """Best-effort transport cancellation for the current single-lane prompt."""
        prompt_id = self._active_prompt_id
        if prompt_id is None:
            return
        await self._client.delete_queued(prompt_id)
        await self._client.interrupt_current()
