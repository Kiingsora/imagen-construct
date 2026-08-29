# Architecture decision records

Architecture decision records (ADRs) capture structural choices that should not be rediscovered implicitly in implementation code.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-layer-first-domain.md) | Layer is the primary domain object | Accepted |
| [0002](0002-model-adapters.md) | Model backends use capability-aware adapters | Accepted |
| [0003](0003-local-first.md) | Reference implementation is local-first | Accepted |
| [0004](0004-monorepo-and-tooling.md) | Modular pnpm/uv monorepo | Accepted |
| [0005](0005-project-format-source-of-truth.md) | `project.json` is the persistent source of truth | Accepted |
| [0006](0006-layer-ordering-and-coordinates.md) | Array order and document coordinates are canonical | Accepted |
| [0007](0007-command-history-model.md) | Persistent edits use commands and undo/redo history | Accepted |
| [0008](0008-local-project-storage.md) | MVP projects use filesystem-backed storage | Accepted |

## Adding a decision

1. Copy the structure of an existing ADR.
2. Use the next sequential number.
3. Describe context, decision, consequences, and revisit conditions where relevant.
4. Submit the ADR with or before the implementation that depends on it.
5. Supersede an accepted ADR with a new record rather than silently rewriting history.
