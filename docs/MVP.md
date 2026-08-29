# Minimum Viable Product

## Implementation status

| Checkpoint | Status | Evidence |
| --- | --- | --- |
| MVP 0 — interaction prototype | **Implemented** | Frontend, backend, and Playwright workflow checks pass in CI on PR #1 |
| MVP 0 — external usability validation | **Pending** | At least three people other than the primary developer must complete the reference scenario |
| MVP 1 — local generative proof | **Not started** | The next milestone begins with a deterministic mock adapter |

The automated MVP 0 scenario covers project creation, image import, property editing, duplication, undo/redo, visibility, save/reopen, and PNG export. Passing automation proves integration stability; it does not replace observation of real users.

## Objective

Validate one hypothesis:

> A layer-first generative workflow gives users more control than repeatedly regenerating a flattened image.

The MVP is intentionally split into two checkpoints. The first validates the editor workflow without AI. The second validates local generation with one backend.

## MVP 0 — Interaction prototype

MVP 0 uses imported or prepared RGBA image fixtures. It must prove that the editing workflow is understandable and useful before model integration adds cost and uncertainty.

### Required capabilities

| Area | Requirement | Acceptance criterion |
| --- | --- | --- |
| Canvas | Display a fixed-size scene | A 1024 × 1024 scene opens and can be panned and zoomed |
| Layers | Add an imported RGBA layer | A transparent PNG appears as a new selected layer |
| Selection | Select from canvas or panel | Both methods select the same layer |
| Transform | Move, resize, and rotate | The selected layer updates interactively |
| Ordering | Reorder layers | The visual stacking order follows the layer panel |
| Visibility | Hide and show | Hidden layers are excluded from preview and export |
| Locking | Lock a layer | Locked layers cannot be transformed accidentally |
| Duplication | Duplicate a layer | A new independent layer is created |
| Deletion | Delete a layer | Only the selected layer is removed |
| Persistence | Save and reopen | Scene structure and transforms are restored |
| Export | Export PNG | The final flattened PNG matches the canvas composition |

### Explicit non-goals

- image generation;
- masks and inpainting;
- depth, shadows, or perspective correction;
- character pose controls;
- mobile support;
- PSD import/export;
- multi-user collaboration.

### Exit test

A new user can create this composition using only the interface:

1. background;
2. sofa;
3. character;
4. table;
5. move the sofa;
6. place the table in front of the character;
7. hide and restore the character;
8. save, reopen, and export.

The usability test succeeds when the user completes it without developer guidance and understands that each item is independent.

## MVP 1 — Local generative proof

MVP 1 adds one local generation adapter while preserving every capability from MVP 0.

### Required capabilities

| Area | Requirement | Acceptance criterion |
| --- | --- | --- |
| Prompt | One prompt per generated layer | Prompt metadata remains attached to the layer |
| Generation | Create one local RGBA asset | The result is inserted as a new selected layer |
| Queue | Serialize jobs | Two requests do not compete for GPU memory |
| Progress | Show job state | Queued, running, complete, failed, and cancelled are visible |
| Regeneration | Regenerate selected layer only | Other layers and their files remain unchanged |
| Metadata | Store generation parameters | Adapter, workflow, model, seed, prompt, size, and timestamp are persisted |
| Failure recovery | Keep previous result | A failed regeneration does not destroy the prior layer asset |
| Cancellation | Cancel pending or active work | The editor remains usable after cancellation |

### Implementation order

1. Define model-independent generation contracts.
2. Implement job state, queue, cancellation, and progress events.
3. Implement a deterministic mock adapter.
4. Connect the editor prompt and generation panels.
5. Validate selective regeneration without a GPU.
6. Connect exactly one real local image pipeline.

### Candidate real generation paths

Choose exactly one after the mock workflow is stable:

1. **LayerDiffuse + SDXL** for native transparent text-to-image output.
2. **Generic generator + cutout model** for a model-agnostic proof.

Do not integrate both before one path works end to end.

### Exit test

The user creates a four-layer scene locally:

- generated background;
- generated transparent sofa;
- generated transparent character;
- generated transparent table.

The user then changes the sofa prompt and regenerates only that layer. The background, character, table, transforms, and project metadata remain unchanged.

## Definition of done for the complete MVP

The complete MVP, including the generative checkpoint, is finished only when all of the following are true:

- the reference scenario works from a clean install;
- no paid API is required;
- the application provides a useful error when the local generation backend is unavailable;
- projects can be reopened after application restart;
- generated assets are normal files, not opaque database blobs;
- no external model weights are committed to the repository;
- setup and hardware limits are documented;
- at least three people other than the primary developer have tested the workflow.

## What comes after the MVP

The next feature should be chosen from user evidence, not from technical novelty. Likely candidates are:

- brush masks for partial layer editing;
- import and automatic cutout;
- layer version history;
- low-resolution scene context during regeneration;
- image-to-layers decomposition.

Depth, lighting, pose mannequins, and mobile remain later-stage experiments.
