# Local development

## Prerequisites

- Node.js 22
- pnpm 10.15
- Python 3.12
- uv
- a Chromium-based browser for the reference development workflow

ComfyUI is **not** required for the current deterministic mock-generation workflow.

## Install

From the repository root:

```bash
corepack enable
pnpm install
uv sync --directory services/generation --dev
```

## Start the current editor

Use two terminals.

### Terminal 1 — local service

```bash
cd services/generation
uv run uvicorn imagen_construct.mvp1_main:app \
  --reload \
  --host 127.0.0.1 \
  --port 8000
```

On PowerShell, the same command can be written on one line:

```powershell
uv run uvicorn imagen_construct.mvp1_main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — editor

```bash
pnpm dev:editor
```

Open the Vite address shown in the terminal, normally:

```text
http://127.0.0.1:5173
```

Projects and generated assets are written below:

```text
services/generation/workspace/projects/
```

Set `IMAGEN_CONSTRUCT_WORKSPACE` before starting the service to use another directory.

## Current workflow

1. Create a project.
2. Enter a prompt in the lower Generate panel.
3. Generate a deterministic transparent test layer.
4. Move, resize, rotate, rename, hide, lock, duplicate, or reorder it.
5. Change the prompt and regenerate only the selected layer.
6. Save, reload, and export the composition.

The generated shapes are deliberately simple. Their purpose is to validate the product workflow without a GPU before selecting a real model.

## Checks

### Frontend and shared packages

```bash
pnpm typecheck
pnpm test:unit
pnpm build
```

### Python service

```bash
cd services/generation
uv run ruff check .
uv run pytest -q
```

### Mock-generation end-to-end test

Install Chromium once:

```bash
pnpm --filter @imagen-construct/mock-e2e exec playwright install chromium
```

Run the scenario:

```bash
pnpm --filter @imagen-construct/mock-e2e test:e2e
```

The test starts isolated backend and frontend processes automatically. It validates project creation, generation, selective regeneration, persistence, and reload.

## ComfyUI transport

The generic ComfyUI transport is tested without requiring a real ComfyUI installation. It is not registered in the app until one reviewed real workflow is selected.

See [COMFYUI_TRANSPORT.md](COMFYUI_TRANSPORT.md).
