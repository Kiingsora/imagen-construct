import type { Layer, LayerTransform, ProjectDocument } from "@imagen-construct/contracts";

import { DuplicateLayerIdError, LayerLockedError, LayerNotFoundError } from "../project/errors";

export type LayerTransformPatch = Partial<LayerTransform>;

function cloneProject(project: ProjectDocument): ProjectDocument {
  return structuredClone(project);
}

function findLayerIndex(project: ProjectDocument, layerId: string): number {
  const index = project.layers.findIndex((layer) => layer.id === layerId);
  if (index < 0) throw new LayerNotFoundError(layerId);
  return index;
}

function requireEditable(layer: Layer): void {
  if (layer.locked) throw new LayerLockedError(layer.id);
}

export function addLayer(project: ProjectDocument, layer: Layer, index = project.layers.length): ProjectDocument {
  if (project.layers.some((item) => item.id === layer.id)) throw new DuplicateLayerIdError(layer.id);
  if (!Number.isInteger(index) || index < 0 || index > project.layers.length) {
    throw new RangeError(`Layer insertion index ${index} is outside the valid range.`);
  }

  const next = cloneProject(project);
  next.layers.splice(index, 0, structuredClone(layer));
  return next;
}

export function removeLayer(project: ProjectDocument, layerId: string): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  requireEditable(project.layers[index]!);
  const next = cloneProject(project);
  next.layers.splice(index, 1);
  return next;
}

export function duplicateLayer(project: ProjectDocument, layerId: string, newId: string, name?: string): ProjectDocument {
  if (project.layers.some((layer) => layer.id === newId)) throw new DuplicateLayerIdError(newId);
  const index = findLayerIndex(project, layerId);
  const source = project.layers[index]!;
  const duplicate: Layer = structuredClone(source);
  duplicate.id = newId;
  duplicate.name = name ?? `${source.name} copy`;
  return addLayer(project, duplicate, index + 1);
}

export function reorderLayer(project: ProjectDocument, layerId: string, targetIndex: number): ProjectDocument {
  const sourceIndex = findLayerIndex(project, layerId);
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= project.layers.length) {
    throw new RangeError(`Layer target index ${targetIndex} is outside the valid range.`);
  }
  if (sourceIndex === targetIndex) return project;

  const next = cloneProject(project);
  const [layer] = next.layers.splice(sourceIndex, 1);
  next.layers.splice(targetIndex, 0, layer!);
  return next;
}

export function updateLayerTransform(
  project: ProjectDocument,
  layerId: string,
  patch: LayerTransformPatch,
): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  requireEditable(project.layers[index]!);
  if (patch.scaleX !== undefined && patch.scaleX <= 0) throw new RangeError("scaleX must be greater than zero.");
  if (patch.scaleY !== undefined && patch.scaleY <= 0) throw new RangeError("scaleY must be greater than zero.");

  const next = cloneProject(project);
  const layer = next.layers[index]!;
  layer.transform = { ...layer.transform, ...patch };
  return next;
}

export function setLayerVisibility(project: ProjectDocument, layerId: string, visible: boolean): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  const next = cloneProject(project);
  next.layers[index]!.visible = visible;
  return next;
}

export function setLayerLocked(project: ProjectDocument, layerId: string, locked: boolean): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  const next = cloneProject(project);
  next.layers[index]!.locked = locked;
  return next;
}

export function setLayerOpacity(project: ProjectDocument, layerId: string, opacity: number): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  requireEditable(project.layers[index]!);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new RangeError("Opacity must be between 0 and 1.");
  const next = cloneProject(project);
  next.layers[index]!.opacity = opacity;
  return next;
}

export function renameLayer(project: ProjectDocument, layerId: string, name: string): ProjectDocument {
  const index = findLayerIndex(project, layerId);
  const trimmed = name.trim();
  if (!trimmed) throw new RangeError("Layer name cannot be empty.");
  const next = cloneProject(project);
  next.layers[index]!.name = trimmed;
  return next;
}
