# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and the project intends to use semantic versioning once executable releases begin.

## [Unreleased]

### Added

- Runnable React, TypeScript, Vite, Konva, and Zustand desktop editor.
- Local FastAPI project and asset service.
- Versioned project contracts, JSON Schema validation, and `0.1.0` to `0.2.0` migration.
- Independent image layers with move, resize, rotation, ordering, visibility, locking, opacity, rename, duplication, and deletion.
- Undo/redo history for persistent project changes.
- Safe PNG/WebP import with decoded-image limits, checksums, and atomic writes.
- Project creation, save, automatic reopen, and flattened PNG export.
- Layers, Properties, and History inspector panels.
- Approved five-zone desktop UX structure.
- Frontend, backend, repository, and Playwright end-to-end CI checks.
- Reproducible pnpm and uv lockfiles.
- Getting-started and local development documentation.
- Architecture decision records for the foundational design choices.

### Security

- Project identifiers, manifest fields, asset paths, media formats, file sizes, and decoded pixel counts are validated server-side.
- The local API binds to `127.0.0.1` and restricts CORS to the editor development origins.

### Not yet implemented

- Image generation and selective AI regeneration.
- Masks, inpainting, recoloring, enhancement, and style tools.
- ComfyUI integration.
- Desktop packaging and mobile support.
