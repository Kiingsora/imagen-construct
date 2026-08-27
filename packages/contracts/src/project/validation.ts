import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import legacyProjectSchema from "../../schemas/project-0.1.0.schema.json";
import projectSchema from "../../schemas/project.schema.json";
import type { LegacyProjectDocumentV010, ProjectDocument } from "./types";

export interface ProjectValidationIssue {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
  params: Record<string, unknown>;
}

export type ProjectValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; issues: ProjectValidationIssue[] };

export class ProjectValidationError extends Error {
  readonly issues: ProjectValidationIssue[];

  constructor(message: string, issues: ProjectValidationIssue[]) {
    super(message);
    this.name = "ProjectValidationError";
    this.issues = issues;
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateCurrentSchema = ajv.compile<ProjectDocument>(projectSchema);
const validateLegacySchema = ajv.compile<LegacyProjectDocumentV010>(legacyProjectSchema);

function normalizeAjvErrors(errors: ErrorObject[] | null | undefined): ProjectValidationIssue[] {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? "Project document is invalid.",
    params: error.params as Record<string, unknown>,
  }));
}

function findDuplicateLayerIdIssues(project: ProjectDocument): ProjectValidationIssue[] {
  const seen = new Set<string>();
  const issues: ProjectValidationIssue[] = [];

  project.layers.forEach((layer, index) => {
    if (seen.has(layer.id)) {
      issues.push({
        instancePath: `/layers/${index}/id`,
        schemaPath: "#/x-domain/unique-layer-ids",
        keyword: "uniqueLayerId",
        message: `Layer id '${layer.id}' is duplicated.`,
        params: { layerId: layer.id },
      });
      return;
    }

    seen.add(layer.id);
  });

  return issues;
}

function validateWithSchema<T>(
  validator: ValidateFunction<T>,
  input: unknown,
): ProjectValidationResult<T> {
  if (!validator(input)) {
    return { valid: false, issues: normalizeAjvErrors(validator.errors) };
  }

  return { valid: true, value: input };
}

export function validateProjectDocument(input: unknown): ProjectValidationResult<ProjectDocument> {
  const schemaResult = validateWithSchema(validateCurrentSchema, input);
  if (!schemaResult.valid) {
    return schemaResult;
  }

  const domainIssues = findDuplicateLayerIdIssues(schemaResult.value);
  if (domainIssues.length > 0) {
    return { valid: false, issues: domainIssues };
  }

  return schemaResult;
}

export function validateLegacyProjectDocumentV010(
  input: unknown,
): ProjectValidationResult<LegacyProjectDocumentV010> {
  return validateWithSchema(validateLegacySchema, input);
}

export function isProjectDocument(input: unknown): input is ProjectDocument {
  return validateProjectDocument(input).valid;
}

export function assertProjectDocument(input: unknown): ProjectDocument {
  const result = validateProjectDocument(input);
  if (!result.valid) {
    throw new ProjectValidationError("Invalid Imagen Construct project document.", result.issues);
  }

  return result.value;
}
