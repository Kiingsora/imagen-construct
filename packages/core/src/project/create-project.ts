import { assertProjectDocument, CURRENT_PROJECT_FORMAT_VERSION, type ProjectDocument } from "@imagen-construct/contracts";

export interface CreateProjectInput {
  id: string;
  name: string;
  now?: Date;
  canvas?: { width?: number; height?: number; backgroundColor?: string };
}

export function createProject(input: CreateProjectInput): ProjectDocument {
  const timestamp = (input.now ?? new Date()).toISOString();
  return assertProjectDocument({
    formatVersion: CURRENT_PROJECT_FORMAT_VERSION,
    id: input.id,
    name: input.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    canvas: {
      width: input.canvas?.width ?? 1024,
      height: input.canvas?.height ?? 1024,
      backgroundColor: input.canvas?.backgroundColor ?? "#00000000"
    },
    layers: []
  });
}
