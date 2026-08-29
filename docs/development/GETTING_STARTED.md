# Getting started

This guide runs the current **MVP 0** editor locally. MVP 0 validates the layer-based editing workflow with imported PNG or WebP assets. It does not yet run an image-generation model.

## Prerequisites

Install:

- Git;
- Node.js 22 or newer;
- pnpm 10.15.0;
- Python 3.12;
- uv 0.12.7 or newer.

The repository locks both JavaScript and Python dependencies. Use the frozen installation commands below unless you are intentionally changing dependencies.

## Clone and install

```bash
git clone https://github.com/Kiingsora/imagen-construct.git
cd imagen-construct
git switch feat/mvp0-editor

corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --frozen-lockfile
uv --directory services/generation sync --frozen --dev
```

After the MVP 0 pull request is merged, the `git switch` command will no longer be necessary.

## Start the application

Open two terminals from the repository root.

### Terminal 1 — local API

```bash
pnpm dev:api
```

The API listens only on `127.0.0.1:8000`.

### Terminal 2 — editor

```bash
pnpm dev:editor
```

Open `http://127.0.0.1:5173`.

## Windows PowerShell

The same commands work in PowerShell. To use a custom project workspace for the current session:

```powershell
$env:IMAGEN_WORKSPACE_DIR = "D:\ImagenConstructWorkspace"
pnpm dev:api
```

By default, local projects are written under:

```text
services/generation/workspace/projects/<project-id>/
```

Each project contains an inspectable `project.json` file and normal image files under `assets/`.

## Current workflow

1. Create a project.
2. Select **Add Layer → Import image**.
3. Import a PNG or WebP file.
4. Select the layer from the canvas or layer panel.
5. Move, resize, rotate, rename, hide, lock, duplicate, reorder, or delete it.
6. Use Undo and Redo.
7. Save the project.
8. Reload the page to verify restoration.
9. Export the visible composition as PNG.

## Validation commands

### Frontend and shared TypeScript packages

```bash
pnpm typecheck
pnpm test
pnpm build
```

### Python service

```bash
pnpm lint:backend
pnpm test:backend
```

### Browser workflow

Install Chromium once:

```bash
pnpm --filter @imagen-construct/editor exec playwright install chromium
```

Then run:

```bash
pnpm test:e2e
```

The Playwright configuration starts both the FastAPI service and Vite automatically.

## Configuration

### Editor API URL

Copy `apps/editor/.env.example` to `apps/editor/.env` when the API is not available at the default URL.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Project workspace

Set `IMAGEN_WORKSPACE_DIR` before starting the API. Do not place credentials or model weights inside project folders.

## Supported files and limits

MVP 0 accepts:

- PNG;
- WebP;
- files up to 32 MB;
- decoded images up to 64 million pixels.

Uploads are decoded and validated before being stored. Project manifests are validated server-side before saving.

## Common problems

### The editor reports a network error

Confirm that `pnpm dev:api` is running and that `http://127.0.0.1:8000/health` returns an `ok` response.

### The editor opens but no image appears

Confirm that the uploaded file is a valid PNG or WebP. Unsupported or unsafe images are rejected by the service.

### Port 5173 or 8000 is already in use

Stop the conflicting process. The current CORS policy intentionally allows only the standard local editor origins.

### A project no longer loads

Inspect its `project.json`. The service refuses malformed manifests rather than loading partially valid state.

## Next milestone

The next implementation milestone is a deterministic mock generation adapter with a visible queue and progress events. It will exercise the complete generative workflow without requiring a GPU or ComfyUI.
