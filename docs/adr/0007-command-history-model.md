# ADR 0007 — Persistent scene changes use explicit commands and undo/redo history

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

Imagen Construct is a non-destructive editor. Layer transforms, ordering, visibility, duplication, deletion, and asset replacement need predictable undo/redo behavior. If each UI component mutates scene state directly, history becomes inconsistent and domain logic leaks into React and Konva code.

## Decision

All persistent scene mutations are expressed as explicit domain commands implemented in `packages/core`.

Representative commands include:

```text
AddLayer
DeleteLayer
DuplicateLayer
MoveLayer
ResizeLayer
RotateLayer
ReorderLayer
SetLayerVisibility
SetLayerLocked
SetLayerOpacity
ReplaceLayerAsset
RenameProject
```

A command must be testable without React, Konva, FastAPI, or filesystem access.

The history engine records only persistent document edits. It supports:

```text
execute
undo
redo
canUndo
canRedo
clearHistory
```

High-frequency interactive transforms may update a temporary preview state while the pointer is moving, but they commit one logical command when the interaction finishes. This prevents hundreds of undo entries for one drag gesture.

## Excluded from document history

The following are editor-session state and are not recorded in project undo/redo:

- current selection;
- viewport pan;
- viewport zoom;
- hovered elements;
- active tool;
- open panels or dialogs;
- generation progress indicators.

## Failure semantics

Commands are applied atomically at the domain level. A command that cannot produce a valid next state must fail without partially mutating the previous state.

Asset replacement is committed only after the generation/persistence layer has validated the replacement asset. Failed or cancelled generation therefore leaves the previous layer asset intact.

## Consequences

### Positive

- predictable undo/redo;
- domain operations are unit-testable;
- UI components remain thin;
- keyboard shortcuts and future scripting can invoke the same operations;
- interactive canvas libraries remain replaceable.

### Negative

- command design adds initial code compared with direct state mutation;
- coalescing continuous transforms requires explicit handling;
- asynchronous operations need a clear boundary between side effects and committed commands.
