# Initial Backlog

This backlog is ordered to validate the workflow before integrating a real model. Each item is intended to become one focused GitHub issue.

## Milestone: MVP 0 — Interaction prototype

### 1. Define TypeScript scene types and commands

**Goal:** represent projects, layers, transforms, and assets independently from the UI.

**Acceptance:** create, update, reorder, duplicate, hide, lock, and delete commands are unit-testable.

**Suggested labels:** `area:core`, `type:feature`, `good first architecture issue`

### 2. Build the editor shell

**Goal:** create the top bar, tools area, canvas area, layer panel, and bottom prompt/job area.

**Acceptance:** responsive desktop layout with empty-state guidance.

**Suggested labels:** `area:ui`, `type:feature`

### 3. Implement canvas selection and transforms

**Goal:** select an RGBA asset, then move, resize, and rotate it.

**Acceptance:** canvas and layer panel selection remain synchronized.

**Suggested labels:** `area:canvas`, `type:feature`

### 4. Implement layer panel operations

**Goal:** ordering, visibility, locking, duplication, deletion, and renaming.

**Acceptance:** every operation updates the canvas without page reload.

**Suggested labels:** `area:layers`, `type:feature`, `good first issue`

### 5. Add project persistence

**Goal:** save and load the draft JSON format with relative asset paths.

**Acceptance:** the four-layer reference scene reopens with identical transforms.

**Suggested labels:** `area:core`, `type:feature`

### 6. Export flattened PNG

**Goal:** export the visible composition at canvas resolution.

**Acceptance:** hidden layers are excluded and alpha is preserved where applicable.

**Suggested labels:** `area:canvas`, `type:feature`, `good first issue`

### 7. Create deterministic RGBA fixtures

**Goal:** provide a background, sofa, character, and table for tests and demos.

**Acceptance:** assets are original or safely licensed and small enough for Git.

**Suggested labels:** `area:examples`, `type:content`

## Milestone: MVP 1 — Local generative proof

### 8. Define generation adapter contracts

**Goal:** model-independent capabilities, request, progress, result, error, and cancellation types.

**Acceptance:** a mock adapter passes contract tests.

**Suggested labels:** `area:generation`, `type:architecture`

### 9. Implement the Python service skeleton

**Goal:** FastAPI health endpoint, adapter registry, job state, and event channel.

**Acceptance:** editor can discover a deterministic mock adapter.

**Suggested labels:** `area:backend`, `type:feature`

### 10. Implement a deterministic mock generation adapter

**Goal:** simulate queued progress and return fixture assets.

**Acceptance:** complete UI flow works without GPU or ComfyUI.

**Suggested labels:** `area:generation`, `type:feature`, `good first issue`

### 11. Implement the ComfyUI transport

**Goal:** submit a workflow, monitor WebSocket events, obtain output, interrupt, and report errors.

**Acceptance:** integration test passes against a documented local ComfyUI setup.

**Suggested labels:** `area:comfyui`, `type:feature`

### 12. Add one transparent-generation workflow

**Goal:** generate an isolated RGBA object through LayerDiffuse/SDXL or the chosen fallback.

**Acceptance:** sofa, person, and table test prompts produce usable alpha assets on the reference machine.

**Suggested labels:** `area:model`, `area:comfyui`, `type:experiment`

### 13. Regenerate the selected layer safely

**Goal:** replace a layer asset only after a new result is validated.

**Acceptance:** failure or cancellation keeps the previous asset and metadata intact.

**Suggested labels:** `area:generation`, `type:feature`

### 14. Add generation metadata and reproducibility

**Goal:** persist adapter, model, workflow, prompt, seed, size, timestamp, and job id.

**Acceptance:** metadata survives save/load and is visible in an advanced panel.

**Suggested labels:** `area:core`, `area:generation`, `type:feature`

## Documentation and project health

### 15. Create the first real demo recording

**Goal:** replace conceptual visuals with a short product capture.

**Acceptance:** under thirty seconds, no editing trick that hides latency, shows selective regeneration clearly.

### 16. Benchmark the reference pipeline

**Goal:** measure VRAM, RAM, preview time, final time, and alpha quality.

**Acceptance:** results and exact versions are published in the repository.

### 17. Review the working project name

**Goal:** assess discoverability and confusion with Google Imagen before a public release.

**Acceptance:** retain with rationale or record a rename in an ADR.
