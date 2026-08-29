import { useCallback, useEffect, useMemo, useState } from "react";

import { useEditorStore } from "../../store/editor-store";
import { applyCompletedGenerationJob } from "./apply-generated-job";
import {
  cancelGenerationJob,
  connectGenerationEvents,
  createGenerationJob,
  getGenerationJob,
  listGenerationAdapters,
  type GenerationAdapterCapabilities,
  type GenerationJobSnapshot,
} from "./generation-api";

const TABS = ["Generate", "Edit", "Enhance", "Style"] as const;
type PanelTab = (typeof TABS)[number];

function isTerminal(job: GenerationJobSnapshot): boolean {
  return job.status === "completed" || job.status === "failed" || job.status === "cancelled";
}

export function MockGenerationPanel() {
  const project = useEditorStore((state) => state.project);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const prompt = useEditorStore((state) => state.prompt);
  const setPrompt = useEditorStore((state) => state.setPrompt);
  const setError = useEditorStore((state) => state.setError);

  const [tab, setTab] = useState<PanelTab>("Generate");
  const [adapters, setAdapters] = useState<GenerationAdapterCapabilities[]>([]);
  const [selectedAdapterId, setSelectedAdapterId] = useState("mock-rgba");
  const [jobs, setJobs] = useState<Record<string, GenerationJobSnapshot>>({});
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const activeJob = activeJobId ? jobs[activeJobId] ?? null : null;
  const running = activeJob ? !isTerminal(activeJob) : false;

  const handleJob = useCallback((job: GenerationJobSnapshot) => {
    setJobs((current) => ({ ...current, [job.id]: job }));
    setActiveJobId((current) => current ?? job.id);
    if (job.status === "completed") applyCompletedGenerationJob(job);
    if (job.status === "failed") setError(job.error ?? "Generation failed.");
  }, [setError]);

  useEffect(() => {
    if (!project) return;
    void listGenerationAdapters()
      .then((available) => {
        setAdapters(available);
        if (available.length > 0 && !available.some((adapter) => adapter.id === selectedAdapterId)) {
          setSelectedAdapterId(available[0]!.id);
        }
      })
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : "Local generation service is unavailable.");
      });
    return connectGenerationEvents(handleJob, setConnected);
  }, [handleJob, project?.id, selectedAdapterId, setError]);

  useEffect(() => {
    if (!activeJobId || !running) return;
    const timer = window.setInterval(() => {
      void getGenerationJob(activeJobId).then(handleJob).catch(() => {
        // WebSocket reconnect and the next polling cycle may recover the job state.
      });
    }, 600);
    return () => window.clearInterval(timer);
  }, [activeJobId, handleJob, running]);

  const orderedJobs = useMemo(
    () => Object.values(jobs).sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 4),
    [jobs],
  );

  async function submit(replaceLayerId: string | null) {
    if (!project || running || !prompt.trim()) return;
    try {
      const job = await createGenerationJob({
        projectId: project.id,
        prompt: prompt.trim(),
        adapterId: selectedAdapterId,
        width: 512,
        height: 512,
        replaceLayerId,
      });
      setJobs((current) => ({ ...current, [job.id]: job }));
      setActiveJobId(job.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to start generation.");
    }
  }

  async function cancelActiveJob() {
    if (!activeJob || isTerminal(activeJob)) return;
    try {
      handleJob(await cancelGenerationJob(activeJob.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to cancel generation.");
    }
  }

  function openImportDialog() {
    document.querySelector<HTMLInputElement>('[data-testid="asset-input"]')?.click();
  }

  if (!project) return null;

  return (
    <section className="generation-overlay" aria-label="Generation controls" data-testid="generation-panel">
      <nav className="bottom-tabs generation-tabs" aria-label="Generation modes">
        {TABS.map((item) => (
          <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
        <span className={`generation-connection${connected ? " is-connected" : ""}`}>
          {connected ? "Local service connected" : "Connecting…"}
        </span>
      </nav>

      {tab === "Generate" ? (
        <>
          <div className="generation-main-row">
            <label className="generation-prompt-field" htmlFor="mock-generation-prompt">
              <span>Prompt</span>
              <textarea
                id="mock-generation-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the next independent layer…"
                rows={2}
              />
            </label>

            <label className="adapter-field">
              <span>Adapter</span>
              <select value={selectedAdapterId} onChange={(event) => setSelectedAdapterId(event.target.value)} disabled={running}>
                {adapters.length === 0 && <option value="mock-rgba">Mock RGBA</option>}
                {adapters.map((adapter) => <option key={adapter.id} value={adapter.id}>{adapter.name}</option>)}
              </select>
            </label>

            <button
              type="button"
              className="generate-button generation-submit"
              data-testid="generate-layer"
              disabled={running || !prompt.trim() || adapters.length === 0}
              onClick={() => void submit(null)}
            >
              {running ? `${activeJob?.progress ?? 0}%` : "✦ Generate"}
            </button>
          </div>

          <div className="context-actions generation-actions">
            <button type="button" onClick={openImportDialog}>＋ Import Layer</button>
            <button type="button" disabled={!selectedLayerId || running || !prompt.trim()} onClick={() => void submit(selectedLayerId)}>
              ↻ Regenerate Layer
            </button>
            <button type="button" disabled title="Planned after a real image adapter is selected">◉ Recolor</button>
            <button type="button" disabled title="Planned after MVP 1">▧ Remove Background</button>
            <button type="button" disabled title="Planned after MVP 1">✣ Inpaint</button>
            {running && <button type="button" className="cancel-generation" onClick={() => void cancelActiveJob()}>Cancel</button>}
          </div>

          <div className="generation-status" aria-live="polite">
            {orderedJobs.length === 0 ? (
              <span>No generation jobs yet. The mock adapter validates the workflow without using a GPU.</span>
            ) : (
              orderedJobs.map((job) => (
                <span key={job.id} className={`job-pill job-pill--${job.status}`}>
                  {job.status} · {job.progress}% · {job.prompt.slice(0, 28)}
                </span>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="future-panel">
          <strong>{tab}</strong>
          <span>This workspace will be activated after the generation workflow is validated.</span>
        </div>
      )}
    </section>
  );
}
