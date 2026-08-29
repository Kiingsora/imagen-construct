# ADR 0004 — Use a modular monorepo with pnpm and uv

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

Imagen Construct combines a TypeScript editor, shared TypeScript domain contracts, a Python orchestration service, ComfyUI workflows, examples, and documentation. Splitting these concerns across multiple repositories would add release and contribution overhead before the product architecture is stable.

## Decision

The project will use one modular monorepo.

JavaScript and TypeScript workspaces will be managed with **pnpm workspaces**. Python dependency and environment management will use **uv** inside `services/generation`.

The repository will be organized around deployable applications and reusable domain packages rather than technical catch-all folders:

```text
apps/editor/
packages/core/
packages/contracts/
services/generation/
workflows/comfyui/
examples/
docs/
```

The first implementation will not introduce Nx, Turborepo, microservices, or a desktop wrapper. Root scripts will coordinate common tasks until repository scale demonstrates a need for additional orchestration.

## Dependency rules

- `apps/editor` may depend on `packages/core` and `packages/contracts`.
- `packages/core` must remain independent from React, Konva, FastAPI, ComfyUI, and filesystem APIs.
- `packages/contracts` contains machine-readable/shared contracts and generated client types.
- `services/generation` owns local persistence, job orchestration, adapters, and external inference integration.
- ComfyUI-specific code must not appear in the editor or TypeScript core.

## Consequences

### Positive

- one clone provides the complete development environment;
- changes spanning frontend and backend can be reviewed atomically;
- shared contracts are versioned with their consumers;
- project structure remains understandable for new contributors;
- tooling complexity stays proportional to the current project size.

### Negative

- JavaScript and Python tooling coexist in one repository;
- CI must validate both ecosystems;
- repository-wide scripts need clear conventions;
- a future large project may require stronger task orchestration.

## Revisit when

Reconsider this decision only if build times, contributor workflows, release independence, or repository size create measurable friction that root pnpm/uv scripts cannot solve cleanly.
