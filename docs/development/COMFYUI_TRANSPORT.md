# ComfyUI transport boundary

## Status

The generic transport is implemented but no real model workflow is registered yet.

This separation is deliberate: Imagen Construct can validate its editor, queue, persistence, and selective-regeneration workflow before committing to one model family or a set of custom ComfyUI nodes.

## Supported ComfyUI routes

The transport currently uses the local ComfyUI HTTP API:

```text
GET  /system_stats
POST /prompt
GET  /history/{prompt_id}
GET  /view
POST /interrupt
POST /queue
```

The editor never calls these routes directly. It talks only to the Imagen Construct local service.

```text
Editor
  │
  │ Imagen Construct REST + WebSocket
  ▼
Local generation service
  │
  │ ComfyUI HTTP transport
  ▼
ComfyUI
```

## Security defaults

- `http://127.0.0.1:8188` is the default ComfyUI address.
- Only `localhost`, `127.0.0.1`, and `::1` are accepted by default.
- A remote host requires an explicit `allow_remote` opt-in.
- Redirects are not followed automatically.
- Workflow files must remain inside their manifest directory.
- Runtime requests may modify only declared manifest bindings.
- The frontend never receives raw ComfyUI node identifiers.
- Model weights and user-generated outputs are not committed to Git.

## Workflow package

Each supported workflow is stored as a reviewed package:

```text
workflows/comfyui/<workflow-id>/
├── manifest.json
├── workflow.json
├── README.md
└── LICENSES.md
```

`workflow.json` must be an API-format ComfyUI graph, not the full browser workflow export.

`manifest.json` maps model-independent inputs to graph inputs:

```json
{
  "id": "transparent-layer-sdxl",
  "version": "1.0.0",
  "name": "Transparent Layer — SDXL",
  "workflowFile": "workflow.json",
  "outputNodeId": "42",
  "outputKind": "rgba",
  "bindings": {
    "prompt": {"nodeId": "6", "input": "text"},
    "negativePrompt": {"nodeId": "7", "input": "text"},
    "seed": {"nodeId": "3", "input": "seed"},
    "width": {"nodeId": "5", "input": "width"},
    "height": {"nodeId": "5", "input": "height"}
  },
  "requiredModels": ["MODEL_FILE_TO_BE_SELECTED.safetensors"],
  "requiredCustomNodes": [],
  "licenseNotes": "Document every checkpoint and custom-node license in LICENSES.md."
}
```

The canonical JSON Schema is located at:

```text
workflows/comfyui/manifest.schema.json
```

## Transport lifecycle

```text
1. Load and validate the manifest.
2. Load the API workflow JSON.
3. Apply only declared bindings.
4. Submit the graph through POST /prompt.
5. Receive a prompt_id.
6. Poll GET /history/{prompt_id} until completion.
7. Find the configured output node.
8. Download its image through GET /view.
9. Normalize and validate the image in the Imagen Construct asset store.
10. Replace or add the project layer only after the asset is valid.
```

The local service continues to expose progress to the editor through its own `/v1/events` WebSocket. This keeps ComfyUI-specific messages out of the public editor contract.

## Cancellation

The transport supports both:

- deleting a queued prompt with `POST /queue`;
- interrupting an active prompt with `POST /interrupt`.

Job-scoped adapter cancellation will be enabled when the first real workflow is registered. Until then, the generic ComfyUI adapter reports cancellation as unavailable so the UI does not promise behavior that has not been proven against a real backend.

## Test strategy

The transport is tested with `httpx.MockTransport` and deterministic workflow fixtures. Tests cover:

- prompt submission;
- workflow validation errors;
- history polling;
- output extraction;
- image download;
- local-host restrictions;
- queued deletion and interruption;
- safe workflow binding;
- prevention of path traversal;
- translation from the model-independent adapter request.

Real hardware tests will be marked separately because they require ComfyUI, model files, sufficient VRAM, and potentially custom nodes.

## Remaining decision

The next step cannot be completed responsibly without selecting one real local workflow and verifying its licenses and resource requirements.

The two practical starting paths are:

1. native transparent generation, such as LayerDiffuse with an SDXL workflow;
2. a smaller general-purpose generator followed by a dedicated cutout/background-removal model.

Only one path should be integrated for the first real proof.
