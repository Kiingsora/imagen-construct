# Generation service

Planned local Python service responsible for:

- FastAPI endpoints;
- generation job queue;
- WebSocket progress events;
- adapter registry;
- ComfyUI communication;
- asset validation and atomic writes;
- system and capability diagnostics.

The service must remain usable with a deterministic mock adapter so editor development does not require a GPU.
