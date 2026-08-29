# Generation service

Local Python service for Imagen Construct. Despite the name, MVP 0 currently provides project and asset infrastructure; model execution is the next milestone.

## Implemented in MVP 0

- FastAPI health endpoint;
- creation, retrieval, and atomic saving of projects;
- server-side project manifest validation;
- safe PNG/WebP upload and retrieval;
- file size, decoded pixel count, format, and path validation;
- checksum generation;
- configurable local project workspace;
- Ruff and pytest validation.

The service listens on `127.0.0.1` by default and stores normal JSON/image files rather than opaque database blobs.

Run from the repository root:

```bash
pnpm dev:api
```

See [Getting started](../../docs/development/GETTING_STARTED.md).
