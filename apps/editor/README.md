# Editor application

React + TypeScript desktop-first editor for Imagen Construct.

## Implemented in MVP 0

- project creation, saving, and automatic reopening;
- Konva canvas with pan, zoom, and fit controls;
- PNG/WebP layer import through the local API;
- synchronized selection between canvas and layer panel;
- move, resize, rotate, reorder, hide, lock, rename, duplicate, and delete;
- undo and redo;
- layer properties and history panels;
- flattened PNG export;
- Playwright coverage for the complete MVP 0 workflow.

## Boundaries

The editor owns visual composition and transient UI state. It does not load model weights, write project files directly, or contain ComfyUI-specific code.

Run from the repository root:

```bash
pnpm dev:editor
```

See [Getting started](../../docs/development/GETTING_STARTED.md).
