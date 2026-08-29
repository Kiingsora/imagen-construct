import asyncio
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx


class ComfyUIError(RuntimeError):
    """Raised when the configured ComfyUI instance returns an invalid or failed response."""


@dataclass(frozen=True)
class ComfyUIOutputImage:
    filename: str
    subfolder: str
    storage_type: str


@dataclass(frozen=True)
class ComfyUIPromptSubmission:
    prompt_id: str
    queue_number: int | None


class ComfyUIClient:
    """Small, testable client for ComfyUI's documented local HTTP routes.

    The first implementation polls prompt history. Imagen Construct exposes its own
    WebSocket progress channel to the editor, so ComfyUI transport details remain
    isolated behind this client.
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:8188",
        *,
        timeout_seconds: float = 30.0,
        allow_remote: bool = False,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        normalized = base_url.rstrip("/")
        parsed = urlparse(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("ComfyUI URL must be an absolute HTTP or HTTPS URL.")
        local_hosts = {"127.0.0.1", "localhost", "::1"}
        if not allow_remote and parsed.hostname not in local_hosts:
            raise ValueError("Remote ComfyUI hosts require an explicit allow_remote opt-in.")

        self.base_url = normalized
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout_seconds),
            follow_redirects=False,
        )

    async def __aenter__(self) -> "ComfyUIClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def system_stats(self) -> dict[str, Any]:
        payload = await self._json_request("GET", "/system_stats")
        if not isinstance(payload, dict):
            raise ComfyUIError("ComfyUI system stats response must be an object.")
        return payload

    async def submit_prompt(
        self,
        workflow: Mapping[str, object],
        *,
        client_id: str,
    ) -> ComfyUIPromptSubmission:
        payload = await self._json_request(
            "POST",
            "/prompt",
            json={"prompt": workflow, "client_id": client_id},
        )
        if not isinstance(payload, dict):
            raise ComfyUIError("ComfyUI prompt response must be an object.")

        node_errors = payload.get("node_errors")
        if isinstance(node_errors, dict) and node_errors:
            raise ComfyUIError(f"ComfyUI rejected the workflow: {node_errors}")

        prompt_id = payload.get("prompt_id")
        if not isinstance(prompt_id, str) or not prompt_id:
            raise ComfyUIError("ComfyUI prompt response did not include a prompt_id.")

        queue_number = payload.get("number")
        if not isinstance(queue_number, int):
            queue_number = None
        return ComfyUIPromptSubmission(prompt_id=prompt_id, queue_number=queue_number)

    async def prompt_history(self, prompt_id: str) -> dict[str, Any] | None:
        payload = await self._json_request("GET", f"/history/{prompt_id}")
        if not isinstance(payload, dict):
            raise ComfyUIError("ComfyUI history response must be an object.")
        record = payload.get(prompt_id)
        if record is None:
            return None
        if not isinstance(record, dict):
            raise ComfyUIError("ComfyUI prompt history record must be an object.")
        return record

    async def wait_for_completion(
        self,
        prompt_id: str,
        *,
        timeout_seconds: float = 300.0,
        poll_interval_seconds: float = 0.35,
    ) -> dict[str, Any]:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + timeout_seconds

        while loop.time() < deadline:
            record = await self.prompt_history(prompt_id)
            if record is not None:
                status = record.get("status")
                if isinstance(status, dict):
                    completed = status.get("completed") is True
                    status_text = status.get("status_str")
                    if completed and status_text == "success":
                        return record
                    if completed or status_text in {"error", "failed"}:
                        raise ComfyUIError(f"ComfyUI prompt '{prompt_id}' failed: {status_text}")
                outputs = record.get("outputs")
                if isinstance(outputs, dict) and outputs:
                    return record
            await asyncio.sleep(poll_interval_seconds)

        raise TimeoutError(f"ComfyUI prompt '{prompt_id}' did not complete before the timeout.")

    def output_images(
        self,
        history_record: Mapping[str, object],
        *,
        output_node_id: str | None = None,
    ) -> list[ComfyUIOutputImage]:
        outputs = history_record.get("outputs")
        if not isinstance(outputs, Mapping):
            raise ComfyUIError("ComfyUI history did not contain an outputs object.")

        nodes: list[object]
        if output_node_id is not None:
            output = outputs.get(output_node_id)
            if output is None:
                raise ComfyUIError(f"ComfyUI output node '{output_node_id}' was not found.")
            nodes = [output]
        else:
            nodes = list(outputs.values())

        images: list[ComfyUIOutputImage] = []
        for node_output in nodes:
            if not isinstance(node_output, Mapping):
                continue
            raw_images = node_output.get("images")
            if not isinstance(raw_images, list):
                continue
            for raw_image in raw_images:
                if not isinstance(raw_image, Mapping):
                    continue
                filename = raw_image.get("filename")
                subfolder = raw_image.get("subfolder", "")
                storage_type = raw_image.get("type", "output")
                if (
                    isinstance(filename, str)
                    and filename
                    and isinstance(subfolder, str)
                    and isinstance(storage_type, str)
                ):
                    images.append(
                        ComfyUIOutputImage(
                            filename=filename,
                            subfolder=subfolder,
                            storage_type=storage_type,
                        )
                    )
        if not images:
            raise ComfyUIError("ComfyUI prompt completed without an image output.")
        return images

    async def download_image(self, image: ComfyUIOutputImage) -> bytes:
        response = await self._request(
            "GET",
            "/view",
            params={
                "filename": image.filename,
                "subfolder": image.subfolder,
                "type": image.storage_type,
            },
        )
        media_type = response.headers.get("content-type", "").lower()
        if not media_type.startswith("image/"):
            raise ComfyUIError("ComfyUI view endpoint did not return an image.")
        if not response.content:
            raise ComfyUIError("ComfyUI returned an empty image payload.")
        return response.content

    async def interrupt_current(self) -> None:
        await self._request("POST", "/interrupt")

    async def delete_queued(self, prompt_id: str) -> None:
        await self._request("POST", "/queue", json={"delete": [prompt_id]})

    async def _json_request(self, method: str, path: str, **kwargs: object) -> object:
        response = await self._request(method, path, **kwargs)
        try:
            return response.json()
        except ValueError as error:
            raise ComfyUIError(f"ComfyUI returned invalid JSON for {method} {path}.") from error

    async def _request(self, method: str, path: str, **kwargs: object) -> httpx.Response:
        try:
            response = await self._client.request(method, path, **kwargs)
            response.raise_for_status()
            return response
        except httpx.TimeoutException as error:
            raise TimeoutError(f"ComfyUI request timed out: {method} {path}.") from error
        except httpx.HTTPStatusError as error:
            detail = error.response.text[:500]
            raise ComfyUIError(
                f"ComfyUI returned HTTP {error.response.status_code} for {method} {path}: {detail}"
            ) from error
        except httpx.HTTPError as error:
            raise ComfyUIError(f"Unable to reach ComfyUI at {self.base_url}.") from error
