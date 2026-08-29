import asyncio
import json

import httpx
import pytest

from imagen_construct.infrastructure.comfyui import (
    ComfyUIClient,
    ComfyUIError,
    ComfyUIOutputImage,
)

PNG_BYTES = b"\x89PNG\r\n\x1a\nfixture"


def test_client_submits_waits_and_downloads_an_output():
    history_calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal history_calls
        if request.url.path == "/system_stats":
            return httpx.Response(200, json={"system": {"os": "test"}})
        if request.url.path == "/prompt":
            payload = json.loads(request.content)
            assert payload["client_id"] == "client-1"
            assert payload["prompt"]["1"]["inputs"]["text"] == "a sofa"
            return httpx.Response(200, json={"prompt_id": "prompt-1", "number": 7, "node_errors": {}})
        if request.url.path == "/history/prompt-1":
            history_calls += 1
            if history_calls == 1:
                return httpx.Response(200, json={})
            return httpx.Response(
                200,
                json={
                    "prompt-1": {
                        "status": {"status_str": "success", "completed": True},
                        "outputs": {
                            "9": {
                                "images": [
                                    {
                                        "filename": "result.png",
                                        "subfolder": "",
                                        "type": "output",
                                    }
                                ]
                            }
                        },
                    }
                },
            )
        if request.url.path == "/view":
            assert request.url.params["filename"] == "result.png"
            return httpx.Response(200, content=PNG_BYTES, headers={"content-type": "image/png"})
        raise AssertionError(f"Unexpected request: {request.method} {request.url}")

    async def scenario():
        async with httpx.AsyncClient(
            base_url="http://127.0.0.1:8188",
            transport=httpx.MockTransport(handler),
        ) as http_client:
            client = ComfyUIClient(client=http_client)
            assert (await client.system_stats())["system"]["os"] == "test"
            submission = await client.submit_prompt(
                {"1": {"inputs": {"text": "a sofa"}, "class_type": "CLIPTextEncode"}},
                client_id="client-1",
            )
            assert submission.prompt_id == "prompt-1"
            assert submission.queue_number == 7
            history = await client.wait_for_completion(
                submission.prompt_id,
                timeout_seconds=1,
                poll_interval_seconds=0,
            )
            output = client.output_images(history, output_node_id="9")[0]
            assert output == ComfyUIOutputImage("result.png", "", "output")
            assert await client.download_image(output) == PNG_BYTES

    asyncio.run(scenario())


def test_client_rejects_remote_hosts_without_opt_in():
    with pytest.raises(ValueError, match="allow_remote"):
        ComfyUIClient("https://example.com")


def test_client_surfaces_workflow_validation_errors():
    async def scenario():
        def handler(_: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "prompt_id": None,
                    "node_errors": {"3": {"errors": ["missing model"]}},
                },
            )

        async with httpx.AsyncClient(
            base_url="http://127.0.0.1:8188",
            transport=httpx.MockTransport(handler),
        ) as http_client:
            client = ComfyUIClient(client=http_client)
            with pytest.raises(ComfyUIError, match="rejected the workflow"):
                await client.submit_prompt({}, client_id="client")

    asyncio.run(scenario())


def test_client_can_interrupt_and_delete_queued_prompts():
    seen: list[tuple[str, str, object]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content) if request.content else None
        seen.append((request.method, request.url.path, body))
        return httpx.Response(200, json={})

    async def scenario():
        async with httpx.AsyncClient(
            base_url="http://127.0.0.1:8188",
            transport=httpx.MockTransport(handler),
        ) as http_client:
            client = ComfyUIClient(client=http_client)
            await client.interrupt_current()
            await client.delete_queued("prompt-2")

    asyncio.run(scenario())
    assert seen == [
        ("POST", "/interrupt", None),
        ("POST", "/queue", {"delete": ["prompt-2"]}),
    ]
