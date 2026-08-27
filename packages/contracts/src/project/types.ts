export const CURRENT_PROJECT_FORMAT_VERSION = "0.2.0" as const;
export const LEGACY_PROJECT_FORMAT_VERSION_V0_1_0 = "0.1.0" as const;

export type ProjectFormatVersion = typeof CURRENT_PROJECT_FORMAT_VERSION;
export type LegacyProjectFormatVersionV010 = typeof LEGACY_PROJECT_FORMAT_VERSION_V0_1_0;
export type IsoDateTime = string;
export type RelativeAssetPath = string;
export type LayerKind = "background" | "generated" | "imported";
export type BlendMode = "normal";

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface LayerTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface AssetReference {
  path: RelativeAssetPath;
  mediaType: "image/png" | "image/webp";
  width: number;
  height: number;
  checksumSha256?: string;
  hasAlpha?: boolean;
}

export interface GenerationPrompt {
  positive?: string;
  negative?: string;
}

export interface GenerationMetadata {
  adapterId?: string;
  modelId?: string;
  workflowId?: string;
  seed?: number;
  prompt?: GenerationPrompt;
  generatedAt?: IsoDateTime;
  sourceJobId?: string;
}

export interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: BlendMode;
  transform: LayerTransform;
  asset: AssetReference;
  generation?: GenerationMetadata;
}

export interface GenerationDefaults {
  adapterId?: string;
  modelId?: string;
  previewWidth?: number;
  previewHeight?: number;
}

export interface ProjectDocument {
  formatVersion: ProjectFormatVersion;
  id: string;
  name: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  canvas: CanvasSettings;
  layers: Layer[];
  generationDefaults?: GenerationDefaults;
}

export interface LegacyLayerV010 extends Layer {
  zIndex: number;
}

export interface LegacyProjectDocumentV010 {
  formatVersion: LegacyProjectFormatVersionV010;
  id: string;
  name: string;
  createdAt?: IsoDateTime;
  updatedAt?: IsoDateTime;
  canvas: CanvasSettings;
  layers: LegacyLayerV010[];
  generationDefaults?: GenerationDefaults;
}
