import asyncio
from pathlib import Path

from imagen_construct.infrastructure.adapters.comfyui_workflow_adapter import (
    ComfyUIWorkflowAdapter,
)
from imagen_construct.infrastructure.comfyui import (
    ComfyUIOutputImage,
    ComfyUIPromptSubmission,
)
from imagen_construct.ports.generation_adapter import GenerateImageRequest

FIXTURES = Path(__file__).parent / "fixtures" / "comfyui"


class FakeComfyUIClient:
    def __init__(self) -> None:
        self.workflow = None
        self.client_id = None
        self.deleted = []
        self.interrupted = False

    async def submit_prompt(self, workflow, *, client_id):
        self.workflow = workflow
        self.client_id = client_id
        return ComfyUIPromptSubmission(prompt_id="prompt-1", queue_number=1)

    async def wait_for_completion(self, prompt_id):
        assert prompt_id == "prompt-1"
        return {
            "status": {"status_str": "success", "completed": True},
            "outputs": {
                "9": {
                    "images": [
                        {"filename": "result.png", "subfolder": "", "type": "output"}
                    ]
                }
            },
        }

    def output_images(self, history, *, output_node_id=None):
        assert output_node_id == "9"
        return [ComfyUIOutputImage("result.png", "", "output")]

    async def download_image(self, image):
        assert image.filename == "result.png"
        return b"generated-image"

    async def delete_queued(self, prompt_id):
        self.deleted.append(prompt_id)

    async def interrupt_current(self):
        self.interrupted = True


def test_workflow_adapter_translates_a_model_independent_request():
    async def scenario():
        client = FakeComfyUIClient()
        adapter = ComfyUIWorkflowAdapter(
            adapter_id="fixture-comfyui",
            manifest_path=FIXTURES / "manifest.json",
            client=client,
        )

        result = await adapter.generate(
            GenerateImageRequest(
                prompt="a transparent chair",
                width=640,
                height=480,
                seed=77,
            )
        )

        assert adapter.capabilities()["transparentOutput"] is True
        assert client.workflow["1"]["inputs"]["text"] == "a transparent chair"
        assert client.workflow["2"]["inputs"]["seed"] == 77
        assert client.workflow["3"]["inputs"]["width"] == 640
        assert client.workflow["3"]["inputs"]["height"] == 480
        assert client.client_id.startswith("imagen-construct-")
        assert result.payload == b"generated-image"
        assert result.model_id == "test-model.safetensors"
        assert result.workflow_id == "test-workflow@1.0.0"
        assert result.seed == 77

    asyncio.run(scenario())
