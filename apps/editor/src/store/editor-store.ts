import type { ProjectDocument } from "@imagen-construct/contracts";
import { create } from "zustand";

import { createRemoteProject, loadRemoteProject, saveRemoteProject } from "../features/projects/project-api";

interface EditorState {
  project: ProjectDocument | null;
  selectedLayerId: string | null;
  busy: boolean;
  error: string | null;
  createProject(name: string): Promise<void>;
  loadProject(projectId: string): Promise<void>;
  saveProject(): Promise<void>;
  renameProject(name: string): void;
  selectLayer(layerId: string | null): void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  selectedLayerId: null,
  busy: false,
  error: null,
  async createProject(name) {
    set({ busy: true, error: null });
    try {
      const project = await createRemoteProject(name);
      set({ project, selectedLayerId: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to create project." });
    } finally {
      set({ busy: false });
    }
  },
  async loadProject(projectId) {
    set({ busy: true, error: null });
    try {
      const project = await loadRemoteProject(projectId);
      set({ project, selectedLayerId: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load project." });
    } finally {
      set({ busy: false });
    }
  },
  async saveProject() {
    const project = get().project;
    if (!project) return;
    set({ busy: true, error: null });
    try {
      set({ project: await saveRemoteProject(project) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to save project." });
    } finally {
      set({ busy: false });
    }
  },
  renameProject(name) {
    set((state) => state.project ? { project: { ...state.project, name } } : state);
  },
  selectLayer(layerId) {
    set({ selectedLayerId: layerId });
  },
}));
