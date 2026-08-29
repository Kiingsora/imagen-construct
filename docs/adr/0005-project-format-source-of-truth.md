# ADR 0005 — The project manifest is the source of truth

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

Imagen Construct must persist scenes that can be reopened reliably and migrated over time. The project includes canvas settings, ordered layers, transforms, asset references, and optional generation metadata. Storing overlapping representations in UI state, filesystem naming conventions, and generated files would create divergence.

## Decision

A versioned `project.json` manifest is the canonical source of truth for persistent scene state.

The manifest stores structured metadata only. Large assets remain ordinary files referenced with project-relative paths.

A development project directory follows this structure:

```text
my-project/
├── project.json
├── assets/
├── masks/
├── previews/
└── tmp/
```

The canonical JSON Schema is versioned in the repository and every manifest includes a `formatVersion`. Loading a project validates the manifest before it reaches application logic. Future format changes require an explicit migration.

## Persistent state

The manifest may persist:

- project identity and name;
- canvas dimensions and document background settings;
- ordered layers;
- layer visibility, lock state, opacity, and transforms;
- relative asset references and checksums;
- generation metadata required for reproducibility.

It must not persist:

- selected layer;
- canvas zoom;
- viewport/camera position;
- open panels or dialogs;
- transient job progress;
- API credentials or secrets;
- model weights or binary image data.

## Filesystem rules

- Asset references are relative to the project directory.
- Writes use temporary files followed by atomic replacement where supported.
- A manifest is updated only after newly generated assets have been validated.
- Existing assets remain referenced until replacement succeeds.

## Consequences

### Positive

- projects are inspectable and recoverable without a database;
- generated images remain normal files;
- migrations have an explicit boundary;
- autosave can update metadata without rewriting large images;
- a future packaged `.imagen` file can wrap the same directory structure.

### Negative

- filesystem integrity must be checked when files are moved or removed manually;
- migrations become a maintained responsibility;
- simultaneous writers would require coordination if collaboration is added later.
