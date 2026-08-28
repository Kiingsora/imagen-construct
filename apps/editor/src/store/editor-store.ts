import type { Layer, LayerTransform, ProjectDocument } from "@imagen-construct/contracts";
import {
  addLayer,
  createHistory,
  duplicateLayer as duplicateProjectLayer,
  executeHistory,
  redoHistory,
  removeLayer as removeProjectLayer,
  renameLayer as renameProjectLayer,
  reorderLayer as reorderProjectLayer,
  setLayerLocked as setProjectLayerLocked,
  setLayerOpacity as setProjectLayerOpacity,
  setLayerVisibility as setProjectLayerVisibility,
  undoHistory,
  updateLayerTransform,
  type HistoryState,
} from "@imagen-construct/core";
import { create } from "zustand";

import {
  createRemoteProject,
  loadRemoteProject,
  saveRemoteProject,
  uploadProjectAsset,
} from "../features/projects/project-api";

const LAST_PROJECT_KEY = "imagen-construct:last-project-id";

export type EditorTool =
  | "select"
  | "move"
  | "transform"
  | "brush"
  | "erase"
  | "mask"
  | "inpaint"
  | "crop"
  | "text"
  | "shapes"
  | "recolor"
  | "adjust"
  | "effects"
  | "ai-tools";

interface EditorState {
  project: ProjectDocument | null;
  history: HistoryState<ProjectDocument> | null;
  selectedLayerId: string | null;
  activeTool: EditorTool;
  prompt: string;
  initialized: boolean;
  busy: boolean;
  dirty: boolean;
  error: string | null;
  initialize(): Promise<void>;
  createProject(name: string): Promise<void>;
  loadProject(projectId: string): Promise<void>;
  saveProject(): Promise<void>;
  renameProject(name: string): void;
  setActiveTool(tool: EditorTool): void;
  setPrompt(prompt: string): void;
  setError(error: string | null): void;
  selectLayer(layerId: string | null): void;
  importLayer(file: File): Promise<void>;
  duplicateSelectedLayer(): void;
  removeSelectedLayer(): void;
  reorderLayer(layerId: string, targetIndex: number): void;
  renameLayer(layerId: string, name: string): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerLocked(layerId: string, locked: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerTransform(layerId: string, patch: Partial<LayerTransform>): void;
  undo(): void;
  redo(): void;
}

function errorMessage(error: unknown, fallback = "Unexpected editor error."): string {
  return error instanceof Error ? error.message : fallback;
}

function rememberProject(projectId: string): void {
  try {
    window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
  } catch {
    // Persistence is optional when browser storage is unavailable.
  }
}

function forgetProject(): void {
  try {
    window.localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    // Persistence is optional when browser storage is unavailable.
  }
}

function getRememberedProject(): string | null {
  try {
    return window.localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

function applyMutation(
  state: EditorState,
  mutate: (project: ProjectDocument) => ProjectDocument,
  selectedLayerId = state.selectedLayerId,
): Partial<EditorState> {
  if (!state.project) return {};
  try {
    const nextProject = mutate(state.project);
    const history = executeHistory(state.history ?? createHistory(state.project), nextProject);
    return {
      project: history.present,
      history,
      selectedLayerId,
      dirty: true,
      error: null,
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

function keepValidSelection(project: ProjectDocument, selectedLayerId: string | null): string | null {
  if (!selectedLayerId) return null;
  return project.layers.some((layer) => layer.id === selectedLayerId) ? selectedLayerId : null;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  history: null,
  selectedLayerId: null,
  activeTool: "select",
  prompt: "",
  initialized: false,
  busy: false,
  dirty: false,
  error: null,

  async initialize() {
    if (get().initialized) return;
    const projectId = getRememberedProject();
    if (!projectId) {
      set({ initialized: true });
      return;
    }

    set({ busy: true, error: null });
    try {
      const project = await loadRemoteProject(projectId);
      set({ project, history: createHistory(project), selectedLayerId: null, dirty: false });
    } catch {
      forgetProject();
    } finally {
      set({ initialized: true, busy: false });
    }
  },

  async createProject(name) {
    set({ busy: true, error: null });
    try {
      const project = await createRemoteProject(name);
      rememberProject(project.id);
      set({ project, history: createHistory(project), selectedLayerId: null, dirty: false, initialized: true });
    } catch (error) {
      set({ error: errorMessage(error, "Unable to create project.") });
    } finally {
      set({ busy: false });
    }
  },

  async loadProject(projectId) {
    set({ busy: true, error: null });
    try {
      const project = await loadRemoteProject(projectId);
      rememberProject(project.id);
      set({ project, history: createHistory(project), selectedLayerId: null, dirty: false, initialized: true });
    } catch (error) {
      set({ error: errorMessage(error, "Unable to load project.") });
    } finally {
      set({ busy: false });
    }
  },

  async saveProject() {
    const project = get().project;
    if (!project) return;
    set({ busy: true, error: null });
    try {
      const savedProject = await saveRemoteProject(project);
      rememberProject(savedProject.id);
      set((state) => ({
        project: savedProject,
        history: state.history
          ? { ...state.history, present: savedProject }
          : createHistory(savedProject),
        dirty: false,
      }));
    } catch (error) {
      set({ error: errorMessage(error, "Unable to save project.") });
    } finally {
      set({ busy: false });
    }
  },

  renameProject(name) {
    const trimmed = name.slice(0, 200);
    set((state) => applyMutation(state, (project) => ({ ...project, name: trimmed })));
  },

  setActiveTool(tool) {
    set({ activeTool: tool });
  },

  setPrompt(prompt) {
    set({ prompt });
  },

  setError(error) {
    set({ error });
  },

  selectLayer(layerId) {
    set({ selectedLayerId: layerId });
  },

  async importLayer(file) {
    const project = get().project;
    if (!project) return;
    const projectId = project.id;
    set({ busy: true, error: null });
    try {
      const asset = await uploadProjectAsset(projectId, file);
      const fittedScale = Math.min(
        1,
        (project.canvas.width * 0.7) / asset.width,
        (project.canvas.height * 0.7) / asset.height,
      );
      const layerId = crypto.randomUUID();
      const layer: Layer = {
        id: layerId,
        name: file.name.replace(/\.[^.]+$/, "").trim() || "Imported image",
        kind: "imported",
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        transform: {
          x: (project.canvas.width - asset.width * fittedScale) / 2,
          y: (project.canvas.height - asset.height * fittedScale) / 2,
          scaleX: fittedScale,
          scaleY: fittedScale,
          rotation: 0,
        },
        asset,
      };

      set((state) => {
        if (!state.project || state.project.id !== projectId) return { busy: false };
        return {
          ...applyMutation(state, (current) => addLayer(current, layer), layerId),
          busy: false,
          activeTool: "select" as const,
        };
      });
    } catch (error) {
      set({ error: errorMessage(error, "Unable to import image."), busy: false });
    }
  },

  duplicateSelectedLayer() {
    set((state) => {
      if (!state.selectedLayerId) return {};
      const newId = crypto.randomUUID();
      return applyMutation(
        state,
        (project) => duplicateProjectLayer(project, state.selectedLayerId!, newId),
        newId,
      );
    });
  },

  removeSelectedLayer() {
    set((state) => {
      if (!state.selectedLayerId) return {};
      return applyMutation(
        state,
        (project) => removeProjectLayer(project, state.selectedLayerId!),
        null,
      );
    });
  },

  reorderLayer(layerId, targetIndex) {
    set((state) => applyMutation(state, (project) => reorderProjectLayer(project, layerId, targetIndex)));
  },

  renameLayer(layerId, name) {
    set((state) => applyMutation(state, (project) => renameProjectLayer(project, layerId, name)));
  },

  setLayerVisibility(layerId, visible) {
    set((state) => applyMutation(state, (project) => setProjectLayerVisibility(project, layerId, visible)));
  },

  setLayerLocked(layerId, locked) {
    set((state) => applyMutation(state, (project) => setProjectLayerLocked(project, layerId, locked)));
  },

  setLayerOpacity(layerId, opacity) {
    set((state) => applyMutation(state, (project) => setProjectLayerOpacity(project, layerId, opacity)));
  },

  setLayerTransform(layerId, patch) {
    set((state) => applyMutation(state, (project) => updateLayerTransform(project, layerId, patch)));
  },

  undo() {
    set((state) => {
      if (!state.history) return {};
      const history = undoHistory(state.history);
      return {
        history,
        project: history.present,
        selectedLayerId: keepValidSelection(history.present, state.selectedLayerId),
        dirty: true,
        error: null,
      };
    });
  },

  redo() {
    set((state) => {
      if (!state.history) return {};
      const history = redoHistory(state.history);
      return {
        history,
        project: history.present,
        selectedLayerId: keepValidSelection(history.present, state.selectedLayerId),
        dirty: true,
        error: null,
      };
    });
  },
}));
