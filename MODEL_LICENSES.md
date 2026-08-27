# Model and Dependency Licensing Policy

The source code in this repository is licensed under Apache License 2.0. That license does **not** automatically apply to external model weights, datasets, checkpoints, workflows, fonts, or third-party applications.

## Rules

1. Model weights must not be committed to this repository.
2. Every model adapter must document:
   - the official source;
   - the exact model or checkpoint identifier;
   - the model license;
   - hardware expectations;
   - known usage restrictions;
   - whether commercial use is permitted.
3. Installation helpers may download a model only from its official or explicitly approved source.
4. Users must remain able to run the editor without accepting unrelated model licenses.
5. Project files must record which adapter and model created each generated asset.
6. A model with a non-commercial or unclear license cannot become the default reference backend.

## Initial candidates

- LayerDiffuse code: Apache License 2.0.
- Qwen-Image-Layered: Apache License 2.0.
- FLUX.1-schnell: Apache License 2.0.
- SDXL weights: CreativeML Open RAIL++-M.
- SAM 2: Apache License 2.0 for the main code and checkpoints, with third-party components retaining their own terms.

This document is an engineering policy, not legal advice. Licenses must be rechecked before each public release.
