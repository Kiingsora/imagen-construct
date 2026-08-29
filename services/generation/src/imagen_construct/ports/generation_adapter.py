from dataclasses import dataclass
from typing import Protocol, TypedDict


class AdapterCapabilities(TypedDict):
    id: str
    name: str
    textToImage: bool
    transparentOutput: bool
    deterministic: bool
    cancellable: bool


@dataclass(frozen=True)
class GenerateImageRequest:
    prompt: str
    width: int
    height: int
    seed: int


@dataclass(frozen=True)
class GeneratedImage:
    payload: bytes
    model_id: str
    workflow_id: str
    seed: int


class GenerationAdapter(Protocol):
    id: str

    def capabilities(self) -> AdapterCapabilities: ...

    async def generate(self, request: GenerateImageRequest) -> GeneratedImage: ...
