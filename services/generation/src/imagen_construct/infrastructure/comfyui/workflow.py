import json
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Mapping

from pydantic import BaseModel, ConfigDict, Field

from imagen_construct.infrastructure.comfyui.client import ComfyUIError


class WorkflowBinding(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    node_id: str = Field(alias="nodeId", min_length=1)
    input_name: str = Field(alias="input", min_length=1)


class ComfyUIWorkflowManifest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str = Field(min_length=1)
    version: str = Field(min_length=1)
    name: str = Field(min_length=1)
    workflow_file: str = Field(alias="workflowFile", min_length=1)
    output_node_id: str = Field(alias="outputNodeId", min_length=1)
    output_kind: Literal["rgba", "rgb"] = Field(alias="outputKind")
    bindings: dict[str, WorkflowBinding]
    required_models: list[str] = Field(default_factory=list, alias="requiredModels")
    required_custom_nodes: list[str] = Field(default_factory=list, alias="requiredCustomNodes")


@dataclass(frozen=True)
class PreparedWorkflow:
    workflow_id: str
    workflow_version: str
    output_node_id: str
    output_kind: Literal["rgba", "rgb"]
    graph: dict[str, Any]


def _load_json_object(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except OSError as error:
        raise ComfyUIError(f"Unable to read ComfyUI file '{path}'.") from error
    except json.JSONDecodeError as error:
        raise ComfyUIError(f"ComfyUI file '{path}' is not valid JSON.") from error
    if not isinstance(payload, dict):
        raise ComfyUIError(f"ComfyUI file '{path}' must contain a JSON object.")
    return payload


def load_workflow_manifest(manifest_path: Path) -> ComfyUIWorkflowManifest:
    payload = _load_json_object(manifest_path)
    try:
        return ComfyUIWorkflowManifest.model_validate(payload)
    except ValueError as error:
        raise ComfyUIError(f"Invalid ComfyUI workflow manifest '{manifest_path}'.") from error


def resolve_workflow_path(manifest_path: Path, manifest: ComfyUIWorkflowManifest) -> Path:
    base = manifest_path.resolve().parent
    workflow_path = (base / manifest.workflow_file).resolve()
    try:
        workflow_path.relative_to(base)
    except ValueError as error:
        raise ComfyUIError("Workflow file must remain inside the manifest directory.") from error
    if workflow_path.suffix.lower() != ".json":
        raise ComfyUIError("ComfyUI workflow file must use the .json extension.")
    return workflow_path


def _set_binding(
    workflow: dict[str, Any],
    binding_name: str,
    binding: WorkflowBinding,
    value: object,
) -> None:
    node = workflow.get(binding.node_id)
    if not isinstance(node, dict):
        raise ComfyUIError(
            f"Binding '{binding_name}' references missing node '{binding.node_id}'."
        )
    inputs = node.get("inputs")
    if not isinstance(inputs, dict):
        raise ComfyUIError(
            f"Binding '{binding_name}' references a node without an inputs object."
        )
    if binding.input_name not in inputs:
        raise ComfyUIError(
            f"Binding '{binding_name}' references missing input '{binding.input_name}'."
        )
    inputs[binding.input_name] = value


def prepare_workflow(
    manifest_path: Path,
    values: Mapping[str, object],
) -> PreparedWorkflow:
    manifest = load_workflow_manifest(manifest_path)
    workflow_path = resolve_workflow_path(manifest_path, manifest)
    workflow = deepcopy(_load_json_object(workflow_path))

    required_bindings = {"prompt", "seed", "width", "height"}
    missing = required_bindings.difference(manifest.bindings)
    if missing:
        raise ComfyUIError(
            f"Workflow manifest is missing required bindings: {', '.join(sorted(missing))}."
        )

    unknown_values = set(values).difference(manifest.bindings)
    if unknown_values:
        raise ComfyUIError(
            f"Workflow values contain unsupported bindings: {', '.join(sorted(unknown_values))}."
        )

    missing_values = required_bindings.difference(values)
    if missing_values:
        raise ComfyUIError(
            f"Workflow values are missing: {', '.join(sorted(missing_values))}."
        )

    for binding_name, value in values.items():
        _set_binding(workflow, binding_name, manifest.bindings[binding_name], value)

    if manifest.output_node_id not in workflow:
        raise ComfyUIError(
            f"Configured output node '{manifest.output_node_id}' is not present in the workflow."
        )

    return PreparedWorkflow(
        workflow_id=manifest.id,
        workflow_version=manifest.version,
        output_node_id=manifest.output_node_id,
        output_kind=manifest.output_kind,
        graph=workflow,
    )
