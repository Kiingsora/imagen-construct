# Imagen Construct desktop UX reference

Status: **Accepted for MVP 0 implementation**

The desktop editor follows five stable zones:

1. **Top bar** — project identity, save state, undo/redo, save, export, settings.
2. **Left toolbar** — direct manipulation and editing tools.
3. **Central canvas** — the composed image and layer transforms.
4. **Right inspector** — Layers, Properties, and History.
5. **Bottom contextual panel** — Generate, Edit, Enhance, and Style workspaces.

## MVP 0 enabled interactions

- create and reopen a local project;
- import PNG or WebP assets as independent layers;
- select a layer from the canvas or the layer list;
- move, scale, and rotate unlocked layers;
- reorder, rename, duplicate, hide, lock, and delete layers;
- undo and redo project mutations;
- save the project manifest;
- export the visible composition to PNG.

Tools and contextual actions that are visually present but disabled remain scheduled for later milestones. The first disabled feature group to become functional will be the deterministic mock generation workflow.
