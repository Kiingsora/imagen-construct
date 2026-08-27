import type { ProjectValidationIssue } from "@imagen-construct/contracts";

export class UnsupportedProjectFormatError extends Error {
  readonly formatVersion: string | undefined;

  constructor(formatVersion: string | undefined) {
    super(formatVersion ? `Unsupported project format version '${formatVersion}'.` : "Project document does not declare a formatVersion.");
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
