export class ProjectFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectFormatError";
  }
}

export class LayerNotFoundError extends Error {
  constructor(readonly layerId: string) {
    super(`Layer '${layerId}' was not found.`);
    this.name = "LayerNotFoundError";
  }
}

export class DuplicateLayerIdError extends Error {
  constructor(readonly layerId: string) {
    super(`Layer id '${layerId}' already exists.`);
    this.name = "DuplicateLayerIdError";
  }
}

export class LayerLockedError extends Error {
  constructor(readonly layerId: string) {
    super(`Layer '${layerId}' is locked.`);
    this.name = "LayerLockedError";
  }
}
