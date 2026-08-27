# ADR 0002 — Model backends are connected through adapters

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

Image models, licenses, hardware requirements, and inference applications change quickly. Coupling the scene editor directly to one ComfyUI workflow or one checkpoint would make the project fragile.

## Decision

The editor communicates with a local orchestration service through model-independent requests. Backend-specific behavior is implemented by capability-aware adapters.

## Consequences

### Positive

- multiple models can coexist;
- cloud adapters remain optional;
- ComfyUI can be replaced or complemented later;
- the UI can hide unsupported controls;
- adapters can be contributed independently.

### Negative

- a common contract must represent different model capabilities;
- some advanced backend features may not fit the first abstraction;
- contract tests and versioning are required.
