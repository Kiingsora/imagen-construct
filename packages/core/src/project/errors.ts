import type { ProjectValidationIssue } from "@imagen-construct/contracts";

export class ProjectFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectFormatError";
  }
}

export class UnsupportedProjectFormatError extends Error {
  readonly formatVersion: string | undefined;

  constructor(formatVersion: string | undefined) {
    super(
      formatVersion
        ? `Unsupported project format version '${formatVersion}'.`
        : "Project document does not declare a formatVersion.",
    );
    this.name = "UnsupportedProjectFormatError";
    this.formatVersion = formatVersion;
  }
}

export class ProjectMigrationError extends Error {
  readonly issues: ProjectValidationIssue[];

  constructor(message: string, issues: ProjectValidationIssue[]) {
    super(message);
    this.name = "ProjectMigrationError";
    this.issues = issues;
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
