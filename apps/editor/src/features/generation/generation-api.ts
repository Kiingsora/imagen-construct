import type { AssetReference, GenerationMetadata } from "@imagen-construct/contracts";

import { API_BASE_URL } from "../projects/project-api";

export type GenerationJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface GenerationAdapterCapabilities {
  id: string;
  name: string;
  textToImage: boolean;
  transparentOutput: boolean;
  deterministic: boolean;
  cancellable: boolean;
}

export interface GenerationJobResult {
  asset: AssetReference;
  generation: GenerationMetadata;
}

export interface GenerationJobSnapshot {
  id: string;
  projectId: string;
  adapterId: string;
  prompt: string;
  width: number;
  height: number;
  seed: number;
  replaceLayerId: string | null;
  status: GenerationJobStatus;
  progress: number;
  error: string | null;
  result: GenerationJobResult | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Generation request failed with status ${response.status}.`);
  }
  return (await response.json()) as T;
}

export function listGenerationAdapters(): Promise<GenerationAdapterCapabilities[]> {
  return requestJson<GenerationAdapterCapabilities[]>("/v1/adapters");
}

export function createGenerationJob(input: {
  projectId: string;
  prompt: string;
  adapterId?: string;
  width?: number;
  height?: number;
  seed?: number;
  replaceLayerId?: string | null;
}): Promise<GenerationJobSnapshot> {
  return requestJson<GenerationJobSnapshot>("/v1/jobs/generate-layer", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getGenerationJob(jobId: string): Promise<GenerationJobSnapshot> {
  return requestJson<GenerationJobSnapshot>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

export function cancelGenerationJob(jobId: string): Promise<GenerationJobSnapshot> {
  return requestJson<GenerationJobSnapshot>(`/v1/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: "POST",
  });
}

function websocketUrl(): string {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/v1/events";
  url.search = "";
  return url.toString();
}

export function connectGenerationEvents(
  onJob: (job: GenerationJobSnapshot) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  let disposed = false;
  let socket: WebSocket | null = null;
  let retryTimer: number | null = null;

  const connect = () => {
    if (disposed) return;
    socket = new WebSocket(websocketUrl());
    socket.addEventListener("open", () => onConnectionChange?.(true));
    socket.addEventListener("message", (event) => {
      try {
        onJob(JSON.parse(String(event.data)) as GenerationJobSnapshot);
      } catch {
        // Ignore malformed events; the HTTP job endpoint remains the fallback source of truth.
      }
    });
    socket.addEventListener("close", () => {
      onConnectionChange?.(false);
      if (!disposed) retryTimer = window.setTimeout(connect, 1000);
    });
    socket.addEventListener("error", () => socket?.close());
  };

  connect();

  return () => {
    disposed = true;
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    socket?.close();
  };
}
