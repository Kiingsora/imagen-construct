# ADR 0003 — The reference implementation is local-first

- **Status:** Accepted
- **Date:** 2026-08-27

## Context

The project is intended as an open alternative that does not require recurring API expenditure. Local execution also protects private creative material and supports experimentation.

## Decision

The reference setup will run the editor, orchestration service, assets, and inference locally. Paid APIs may be supported only through optional adapters.

## Consequences

### Positive

- no mandatory usage fees;
- user data can remain on the machine;
- contributors can inspect the complete workflow;
- vendor lock-in is reduced.

### Negative

- setup is harder;
- hardware varies substantially;
- models consume disk, RAM, and VRAM;
- packaging and diagnostics become important product work.
