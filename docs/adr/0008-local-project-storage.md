# ADR 0008 — Use filesystem-backed local project storage for the MVP

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

The reference implementation is local-first and the first MVP does not require collaboration, remote synchronization, search across thousands of projects, or transactional multi-user access. Introducing a database before those needs exist would add operational and migration complexity without validating the core product hypothesis.

## Decision

The MVP stores projects in application-controlled directories on the local filesystem.

Reference layout:

```text
workspace/
└── projects/
    └── <project-id>/
        ├── project.json
        ├── assets/
        ├── masks/
        ├── previews/
        └── tmp/
```

The Python generation service owns filesystem access. The editor sends project identifiers and relative asset references rather than arbitrary operating-system paths.

A repository abstraction isolates storage from application use cases so another implementation can be introduced later without rewriting domain logic.

## Safety rules

- Resolve and validate all paths against the configured workspace root.
- Reject path traversal outside project directories.
- Write new files into `tmp/` first where practical.
- Decode and validate generated images before promoting them into `assets/`.
- Use atomic replacement for manifest updates where supported.
- Do not expose secrets through project manifests or logs.

## Consequences

### Positive

- no database server or migration framework is required for the MVP;
- project data is inspectable and easy to back up;
- ordinary image files work naturally with the layer model;
- development and debugging remain simple;
- persistence can later be swapped behind the repository port.

### Negative

- filesystem access needs careful path validation;
- concurrent editing of one project is intentionally unsupported;
- indexing many projects may require a future catalog or database;
- cloud synchronization will need a separate design.
