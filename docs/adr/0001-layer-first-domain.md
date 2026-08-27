# ADR 0001 — The layer is the primary domain object

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

A conventional image generator treats the final flattened image as the main result. Imagen Construct aims to preserve control over individual generated elements.

## Decision

The project model will treat each generated or imported visual element as a persistent layer with its own transform, asset, prompt, and generation metadata.

## Consequences

### Positive

- selective regeneration is natural;
- scene state remains editable;
- model backends can change without changing the editor concept;
- history can be stored per layer;
- open project formats are possible.

### Negative

- compositing coherence becomes the application's responsibility;
- layer boundaries can be ambiguous;
- users must understand stacking order;
- shadows, reflections, and occlusion require explicit strategies.
