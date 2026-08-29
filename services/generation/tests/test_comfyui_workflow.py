import json
from pathlib import Path

import pytest

from imagen_construct.infrastructure.comfyui import ComfyUIError, prepare_workflow

FIXTURES = Path(__file__).parent / "fixtures" / "comfyui"


def test_prepare_workflow_binds_model_independent_inputs():
    prepared = prepare_workflow(
        FIXTURES / "manifest.json",
        {
            "prompt": "a transparent blue sofa",
            "seed": 123,
            "width": 768,
            "height": 512,
        },
    )

    assert prepared.workflow_id == "test-workflow"
    assert prepared.output_node_id == "9"
    assert prepared.output_kind == "rgba"
    assert prepared.graph["1"]["inputs"]["text"] == "a transparent blue sofa"
    assert prepared.graph["2"]["inputs"]["seed"] == 123
    assert prepared.graph["3"]["inputs"]["width"] == 768
    assert prepared.graph["3"]["inputs"]["height"] == 512


def test_prepare_workflow_does_not_modify_the_source_file():
    workflow_path = FIXTURES / "workflow.json"
    before = json.loads(workflow_path.read_text(encoding="utf-8"))

    prepare_workflow(
        FIXTURES / "manifest.json",
        {"prompt": "changed", "seed": 9, "width": 256, "height": 256},
    )

    after = json.loads(workflow_path.read_text(encoding="utf-8"))
    assert after == before


def test_prepare_workflow_rejects_unknown_runtime_values():
    with pytest.raises(ComfyUIError, match="unsupported bindings"):
        prepare_workflow(
            FIXTURES / "manifest.json",
            {
                "prompt": "test",
                "seed": 1,
                "width": 512,
                "height": 512,
                "checkpoint": "untrusted.safetensors",
            },
        )


def test_prepare_workflow_rejects_paths_outside_manifest_directory(tmp_path):
    outside = tmp_path / "outside.json"
    outside.write_text("{}", encoding="utf-8")
    manifest_dir = tmp_path / "manifest"
    manifest_dir.mkdir()
    manifest = manifest_dir / "manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "id": "unsafe",
                "version": "1",
                "name": "Unsafe",
                "workflowFile": "../outside.json",
                "outputNodeId": "9",
                "outputKind": "rgba",
                "bindings": {
                    "prompt": {"nodeId": "1", "input": "text"},
                    "seed": {"nodeId": "2", "input": "seed"},
                    "width": {"nodeId": "3", "input": "width"},
                    "height": {"nodeId": "3", "input": "height"}
                }
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ComfyUIError, match="remain inside"):
        prepare_workflow(
            manifest,
            {"prompt": "test", "seed": 1, "width": 512, "height": 512},
        )
