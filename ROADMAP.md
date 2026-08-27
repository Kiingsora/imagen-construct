# Roadmap

This roadmap is ordered by risk reduction, not by spectacle. Dates are intentionally omitted until contributors and implementation capacity are known.

## Phase 0 — Foundation

- [x] Freeze the project statement.
- [x] Define the smallest credible MVP.
- [x] Document the initial architecture.
- [x] Create contribution and issue templates.
- [ ] Publish the repository.
- [ ] Collect product and technical criticism.

## Phase 1 — Interaction prototype without AI

- [ ] Build the editor shell.
- [ ] Implement canvas navigation.
- [ ] Implement layer creation, selection, ordering, visibility, lock, duplicate, and delete.
- [ ] Implement move, resize, and rotation.
- [ ] Use prepared RGBA fixtures instead of generation.
- [ ] Save/load the project manifest.
- [ ] Export the composed canvas to PNG.
- [ ] Validate the workflow with three users.

**Exit condition:** the layer-first workflow is useful before any model is connected.

## Phase 2 — Local generative proof

- [ ] Define the generation adapter interface.
- [ ] Implement a deterministic mock adapter.
- [ ] Connect a local ComfyUI server.
- [ ] Add one transparent-generation or cutout workflow.
- [ ] Display queue position and generation progress.
- [ ] Regenerate only the selected layer.
- [ ] Preserve prompt, seed, model, and workflow metadata.

**Exit condition:** a four-layer scene can be generated and revised locally without regenerating the complete image.

## Phase 3 — Editing and import

- [ ] Layer-level image-to-image editing.
- [ ] Brush mask for partial layer editing.
- [ ] Import PNG/JPEG/WebP.
- [ ] Optional background removal.
- [ ] Prompt history and per-layer versions.
- [ ] Undo/redo for editor operations.

## Phase 4 — Context awareness

- [ ] Pass a low-resolution composite as optional context.
- [ ] Protect unchanged layers with masks.
- [ ] Generate optional cast shadows on separate layers.
- [ ] Evaluate consistency after moving an object.
- [ ] Add explicit “fast transform” versus “contextual regenerate” modes.

## Phase 5 — Scene intelligence

- [ ] Click/box segmentation.
- [ ] Image-to-layers decomposition.
- [ ] Depth estimation and depth-aware ordering.
- [ ] Perspective guides.
- [ ] Optional pose control for characters.
- [ ] Lighting and color harmonization experiments.

## Phase 6 — Packaging and ecosystem

- [ ] Desktop packaging after the local web architecture stabilizes.
- [ ] Plugin/adaptor registry.
- [ ] Sample workflows and projects.
- [ ] Contributor documentation for new models.
- [ ] Evaluate a simplified mobile companion after desktop validation.

## Explicitly deferred

- real-time multi-model generation on one consumer GPU;
- multiplayer collaboration;
- hosted model inference;
- a proprietary model trained specifically for Imagen Construct;
- full PSD fidelity;
- complete 3D reconstruction of scenes.
