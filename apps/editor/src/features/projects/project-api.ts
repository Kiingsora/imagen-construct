import type { ProjectDocument } from "@imagen-construct/contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Request failed with status ${response.status}.`);
  }
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
