import type { Layer, ProjectDocument } from "@imagen-construct/contracts";
import { addLayer, createHistory, executeHistory } from "@imagen-construct/core";

import { useEditorStore } from "../../store/editor-store";
import type { GenerationJobSnapshot } from "./generation-api";

const appliedJobs = new Set<string>();

function generatedLayerName(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean) return "Generated layer";
  return clean.length > 36 ? `${clean.slice(0, 33)}…` : clean;
}

function createGeneratedLayer(project: ProjectDocument, job: GenerationJobSnapshot): Layer {
  if (!job.result) throw new Error("Completed generation job has no result.");
  const { asset, generation } = job.result;
  const scale = Math.min(
    1,
    (project.canvas.width * 0.7) / asset.width,
    (project.canvas.height * 0.7) / asset.height,
  );
  return {
    id: crypto.randomUUID(),
    name: generatedLayerName(job.prompt),
    kind: "generated",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: {
      x: (project.canvas.width - asset.width * scale) / 2,
      y: (project.canvas.height - asset.height * scale) / 2,
      scaleX: scale,
      scaleY: scale,
      rotation: 0,
    },
    asset,
    generation,
  };
}

function replaceGeneratedLayer(project: ProjectDocument, layerId: string, job: GenerationJobSnapshot): ProjectDocument | null {
  if (!job.result) throw new Error("Completed regeneration job has no result.");
  const index = project.layers.findIndex((layer) => layer.id === layerId);
  if (index < 0) return null;

  const next = structuredClone(project);
  const layer = next.layers[index]!;
  layer.kind = "generated";
  layer.asset = structuredClone(job.result.asset);
  layer.generation = structuredClone(job.result.generation);
  return next;
}

export function applyCompletedGenerationJob(job: GenerationJobSnapshot): string | null {
  if (job.status !== "completed" || !job.result || appliedJobs.has(job.id)) return null;

  const state = useEditorStore.getState();
  const project = state.project;
  if (!project || project.id !== job.projectId) return null;

  let nextProject: ProjectDocument;
  let selectedLayerId: string;

  if (job.replaceLayerId) {
    const replacement = replaceGeneratedLayer(project, job.replaceLayerId, job);
    if (replacement) {
      nextProject = replacement;
      selectedLayerId = job.replaceLayerId;
    } else {
      const layer = createGeneratedLayer(project, job);
      nextProject = addLayer(project, layer);
      selectedLayerId = layer.id;
    }
  } else {
    const layer = createGeneratedLayer(project, job);
    nextProject = addLayer(project, layer);
    selectedLayerId = layer.id;
  }

  const history = executeHistory(state.history ?? createHistory(project), nextProject);
  appliedJobs.add(job.id);
  useEditorStore.setState({
    project: history.present,
    history,
    selectedLayerId,
    dirty: true,
    error: null,
  });
  return selectedLayerId;
}

export function resetAppliedGenerationJobsForTests(): void {
  appliedJobs.clear();
}
