import type { AssetReference, ProjectDocument } from "@imagen-construct/contracts";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function readRequestError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
  return new Error(payload?.detail ?? `Request failed with status ${response.status}.`);
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw await readRequestError(response);
  return (await response.json()) as T;
}

export function createRemoteProject(name: string): Promise<ProjectDocument> {
  return jsonRequest<ProjectDocument>("/v1/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function loadRemoteProject(projectId: string): Promise<ProjectDocument> {
  return jsonRequest<ProjectDocument>(`/v1/projects/${encodeURIComponent(projectId)}`);
}

export function saveRemoteProject(project: ProjectDocument): Promise<ProjectDocument> {
  return jsonRequest<ProjectDocument>(`/v1/projects/${encodeURIComponent(project.id)}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
}

export function buildProjectAssetUrl(projectId: string, assetPath: string): string {
  const parts = assetPath.split("/");
  if (parts.length !== 2 || parts[0] !== "assets" || !parts[1]) {
    throw new Error(`Unsupported project asset path: ${assetPath}`);
  }
  return `${API_BASE_URL}/v1/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(parts[1])}`;
}

function parseAssetReference(payload: unknown): AssetReference {
  if (!payload || typeof payload !== "object") throw new Error("Asset upload returned an invalid response.");
  const value = payload as Record<string, unknown>;
  const mediaType = value.mediaType;
  if (mediaType !== "image/png" && mediaType !== "image/webp") {
    throw new Error("Asset upload returned an unsupported media type.");
  }
  if (
    typeof value.path !== "string" ||
    typeof value.width !== "number" ||
    typeof value.height !== "number" ||
    typeof value.checksumSha256 !== "string" ||
    typeof value.hasAlpha !== "boolean"
  ) {
    throw new Error("Asset upload returned incomplete metadata.");
  }
  return {
    path: value.path,
    mediaType,
    width: value.width,
    height: value.height,
    checksumSha256: value.checksumSha256,
    hasAlpha: value.hasAlpha,
  };
}

export async function uploadProjectAsset(projectId: string, file: File): Promise<AssetReference> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_BASE_URL}/v1/projects/${encodeURIComponent(projectId)}/assets`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw await readRequestError(response);
  return parseAssetReference(await response.json());
}
