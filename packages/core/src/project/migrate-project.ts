import { assertProjectDocument, CURRENT_PROJECT_FORMAT_VERSION, LEGACY_PROJECT_FORMAT_VERSION_V0_1_0, type Layer, type ProjectDocument, validateLegacyProjectDocumentV010, validateProjectDocument } from "@imagen-construct/contracts";
import { ProjectMigrationError, UnsupportedProjectFormatError } from "./errors";

export interface MigrateProjectOptions { now?: Date }

function readFormatVersion(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null || !("formatVersion" in input)) return undefined;
  const value = (input as { formatVersion?: unknown }).formatVersion;
  return typeof value === "string" ? value : undefined;
}

export function migrateProjectDocument(input: unknown, options: MigrateProjectOptions = {}): ProjectDocument {
  const formatVersion = readFormatVersion(input);
  if (formatVersion === CURRENT_PROJECT_FORMAT_VERSION) {
    const result = validateProjectDocument(input);
    if (!result.valid) throw new ProjectMigrationError("Current project document failed validation.", result.issues);
    return result.value;
  }
  if (formatVersion !== LEGACY_PROJECT_FORMAT_VERSION_V0_1_0) throw new UnsupportedProjectFormatError(formatVersion);
  const legacy = validateLegacyProjectDocumentV010(input);
  if (!legacy.valid) throw new ProjectMigrationError("Legacy project document failed validation before migration.", legacy.issues);
  const timestamp = (options.now ?? new Date()).toISOString();
  const layers: Layer[] = legacy.value.layers
    .map((layer, originalIndex) => ({ layer, originalIndex }))
    .sort((a, b) => a.layer.zIndex - b.layer.zIndex || a.originalIndex - b.originalIndex)
    .map(({ layer }) => { const { zIndex: _zIndex, ...current } = layer; return current; });
  return assertProjectDocument({ ...legacy.value, formatVersion: CURRENT_PROJECT_FORMAT_VERSION, createdAt: legacy.value.createdAt ?? timestamp, updatedAt: timestamp, layers });
}
