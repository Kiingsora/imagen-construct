# Contributing to Imagen Construct

Thank you for considering a contribution. Imagen Construct is currently in a design and proof-of-concept stage. Small, testable contributions are preferred over broad rewrites.

## Before contributing

Read:

1. [PROJECT_BRIEF.md](PROJECT_BRIEF.md)
2. [docs/MVP.md](docs/MVP.md)
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. [ROADMAP.md](ROADMAP.md)
5. [MODEL_LICENSES.md](MODEL_LICENSES.md)

A contribution that expands the product beyond the current phase should begin as an issue or discussion, not as a large pull request.

## Useful contribution areas

- critique of the layer-first workflow;
- desktop UX prototypes;
- scene domain types and migrations;
- canvas interactions;
- deterministic test fixtures;
- ComfyUI transport and workflow experiments;
- transparency and cutout benchmarks;
- documentation and translations;
- accessibility;
- Windows installation and diagnostics.

## Contribution workflow

1. Search existing issues.
2. Open or claim a focused issue.
3. Describe the expected behavior and how it will be tested.
4. Create a branch from `main`.
5. Keep the pull request limited to one concern.
6. Add or update tests and documentation.
7. Complete the pull request checklist.

## Commit style

Conventional Commits are recommended:

```text
feat(editor): add layer reordering
fix(generation): preserve previous asset after cancellation
docs: clarify LayerDiffuse limitations
test(core): add project migration fixture
```

## Architecture changes

A change that affects the project format, adapter contract, process boundaries, or core product principles should include an Architecture Decision Record in `docs/adr/`.

## Model and workflow contributions

Do not commit model weights.

Every adapter or workflow must document:

- official model source;
- exact model/checkpoint identifier;
- license and usage restrictions;
- expected VRAM and RAM;
- supported operating systems;
- installation steps;
- input and output assumptions;
- reproducibility limits;
- benchmark results on at least one machine.

A model with unclear or non-commercial terms cannot become the default reference backend.

## Assets

Example images must be:

- created specifically for this project;
- public domain;
- or distributed under a clearly compatible license.

Add attribution when required. Do not submit private client assets, unlicensed artwork, or generated assets whose model/output terms are unclear.

## Documentation language

English is the primary public language for code, issues, and core contributor documentation. French documentation is welcome and maintained for the project originator and French-speaking contributors.

## Testing expectations

Before opening a pull request, run:

```bash
python scripts/check_repo.py
```

When executable code is added, each module will document its own tests. Hardware-dependent model tests must be optional and clearly marked.

## Review principles

Review focuses on:

- scope discipline;
- failure safety;
- model independence;
- local-first behavior;
- clear user value;
- maintainable contracts;
- licensing clarity.

A technically impressive feature may be rejected if it bypasses the MVP or couples the project to one model without a clear reason.
