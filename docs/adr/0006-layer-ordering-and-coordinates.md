# ADR 0006 — Layer array order and scene coordinates are canonical

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

The editor needs a stable stacking model and transformation convention. Keeping both an array order and independent `zIndex` values creates two sources of truth. Likewise, mixing viewport coordinates with document coordinates would make persistence and undo/redo unreliable.

## Decision

### Layer ordering

The order of `layers[]` in the project manifest is the canonical stacking order.

- Earlier entries are behind later entries.
- Reordering a layer changes the array position.
- Persistent `zIndex` is not required for the MVP.
- UI virtualization or rendering optimizations may derive temporary indices but must not persist a competing order.

### Scene coordinate system

Persistent transforms use document-space coordinates:

- origin: top-left of the canvas;
- X increases to the right;
- Y increases downward;
- translation units: canvas pixels;
- rotation units: degrees clockwise;
- scale is dimensionless;
- viewport zoom and pan never alter persisted transforms;
- source asset width and height are stored separately from transform scale.

Transforms are represented independently from the rendering library so Konva remains replaceable.

## Consequences

### Positive

- deterministic stacking;
- simpler reorder operations;
- no reconciliation between array order and `zIndex`;
- project files remain independent from the active viewport;
- canvas implementations can change without changing the domain format.

### Negative

- moving a layer across a very large list changes array position;
- grouping and nested layers will require a future extension of the ordering model;
- applications importing external formats with explicit z-values must normalize them.
