import { canRedo, canUndo } from "@imagen-construct/core";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useEditorStore, type EditorTool } from "../../store/editor-store";
import { CanvasStage } from "../canvas/CanvasStage";
import { Mvp0LayersPanel } from "../layers/Mvp0LayersPanel";
import { exportProjectPng } from "./export-project";

const TOOLS: Array<{
  id: EditorTool;
  label: string;
  icon: string;
  implemented: boolean;
  groupStart?: boolean;
}> = [
  { id: "select", label: "Select", icon: "⌁", implemented: true },
  { id: "move", label: "Move", icon: "✥", implemented: true },
  { id: "transform", label: "Transform", icon: "⌗", implemented: true },
  { id: "brush", label: "Brush", icon: "✎", implemented: false, groupStart: true },
  { id: "erase", label: "Erase", icon: "◇", implemented: false },
  { id: "mask", label: "Mask", icon: "▣", implemented: false },
  { id: "inpaint", label: "Inpaint", icon: "✣", implemented: false },
  { id: "crop", label: "Crop", icon: "⌑", implemented: false, groupStart: true },
  { id: "text", label: "Text", icon: "T", implemented: false },
  { id: "shapes", label: "Shapes", icon: "△", implemented: false },
  { id: "recolor", label: "Recolor", icon: "◉", implemented: false, groupStart: true },
  { id: "adjust", label: "Adjust", icon: "☷", implemented: false },
  { id: "effects", label: "Effects", icon: "✦", implemented: false },
  { id: "ai-tools", label: "AI Tools", icon: "✧", implemented: false, groupStart: true },
];

const BOTTOM_TABS = ["Generate", "Edit", "Enhance", "Style"] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function Mvp0Workspace() {
  const project = useEditorStore((state) => state.project);
  const history = useEditorStore((state) => state.history);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const activeTool = useEditorStore((state) => state.activeTool);
  const prompt = useEditorStore((state) => state.prompt);
  const initialized = useEditorStore((state) => state.initialized);
  const busy = useEditorStore((state) => state.busy);
  const dirty = useEditorStore((state) => state.dirty);
  const error = useEditorStore((state) => state.error);
  const initialize = useEditorStore((state) => state.initialize);
  const createProject = useEditorStore((state) => state.createProject);
  const renameProject = useEditorStore((state) => state.renameProject);
  const saveProject = useEditorStore((state) => state.saveProject);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const setPrompt = useEditorStore((state) => state.setPrompt);
  const setError = useEditorStore((state) => state.setError);
  const importLayer = useEditorStore((state) => state.importLayer);
  const removeSelectedLayer = useEditorStore((state) => state.removeSelectedLayer);
  const duplicateSelectedLayer = useEditorStore((state) => state.duplicateSelectedLayer);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  const [newProjectName, setNewProjectName] = useState("Untitled project");
  const [bottomTab, setBottomTab] = useState<BottomTab>("Generate");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (command && key === "s") {
        event.preventDefault();
        void saveProject();
        return;
      }

      if (command && key === "e") {
        event.preventDefault();
        const currentProject = useEditorStore.getState().project;
        if (currentProject) {
          void exportProjectPng(currentProject).catch((exportError: unknown) => {
            setError(exportError instanceof Error ? exportError.message : "Unable to export project.");
          });
        }
        return;
      }

      if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (command && key === "d") {
        event.preventDefault();
        duplicateSelectedLayer();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSelectedLayer();
      } else if (event.key === "Escape") {
        selectLayer(null);
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [duplicateSelectedLayer, redo, removeSelectedLayer, saveProject, selectLayer, setError, undo]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void createProject(newProjectName);
  }

  function openImportDialog() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importLayer(file);
  }

  async function handleExport() {
    if (!project) return;
    try {
      await exportProjectPng(project);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to export project.");
    }
  }

  if (!initialized) {
    return <main className="loading-screen">Loading Imagen Construct…</main>;
  }

  if (!project) {
    return (
      <main className="welcome-shell">
        <section className="welcome-card">
          <div className="brand-mark">IC</div>
          <p className="eyebrow">Layer-first image editor</p>
          <h1>Imagen Construct</h1>
          <p>Create a local project, then compose the image from independent editable layers.</p>
          <form onSubmit={handleCreate} className="project-form">
            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              maxLength={200}
              autoFocus
            />
            <button type="submit" disabled={busy || newProjectName.trim().length === 0}>
              {busy ? "Creating…" : "Create project"}
            </button>
          </form>
          {error && <p role="alert" className="error-message">{error}</p>}
        </section>
      </main>
    );
  }

  const undoAvailable = history ? canUndo(history) : false;
  const redoAvailable = history ? canRedo(history) : false;

  return (
    <main className="editor-shell" data-testid="editor-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark brand-mark--small">IC</div>
          <strong>Imagen Construct</strong>
        </div>
        <input
          className="project-name-input"
          aria-label="Project name"
          value={project.name}
          onChange={(event) => renameProject(event.target.value)}
          onBlur={(event) => {
            if (event.target.value.trim().length === 0) renameProject("Untitled project");
          }}
          maxLength={200}
        />
        <span className={`save-status${dirty ? " is-dirty" : ""}`} aria-live="polite">
          {busy ? "Working…" : dirty ? "Unsaved" : "Saved"}
        </span>
        <div className="topbar-history">
          <button type="button" onClick={undo} disabled={!undoAvailable} aria-label="Undo">↶ Undo</button>
          <button type="button" onClick={redo} disabled={!redoAvailable} aria-label="Redo">↷ Redo</button>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => void saveProject()} disabled={busy || !dirty}>Save</button>
          <button type="button" onClick={() => void handleExport()}>Export</button>
          <button type="button" disabled title="Settings will be added after MVP 0">Settings</button>
        </div>
      </header>

      <aside className="toolbar" aria-label="Editor tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`tool-button${activeTool === tool.id ? " is-active" : ""}${tool.groupStart ? " tool-group-start" : ""}`}
            onClick={() => setActiveTool(tool.id)}
            disabled={!tool.implemented}
            title={tool.implemented ? tool.label : `${tool.label} — planned`}
            aria-pressed={activeTool === tool.id}
          >
            <span aria-hidden="true">{tool.icon}</span>
            <small>{tool.label}</small>
          </button>
        ))}
      </aside>

      <CanvasStage />
      <Mvp0LayersPanel onAddLayer={openImportDialog} />

      <section className="prompt-panel" aria-label="AI and editing controls">
        <nav className="bottom-tabs" aria-label="Contextual panels">
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={bottomTab === tab ? "is-active" : ""}
              onClick={() => setBottomTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="prompt-content">
          <label htmlFor="generation-prompt">Prompt</label>
          <textarea
            id="generation-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe what you want to create…"
            rows={2}
          />
          <button type="button" className="generate-button" disabled title="Generation is introduced in MVP 1">
            ✦ Generate
          </button>
        </div>

        <div className="context-actions">
          <button type="button" onClick={openImportDialog}>＋ Add Layer</button>
          <button type="button" disabled={!selectedLayerId} title="Available in MVP 1">↻ Regenerate Layer</button>
          <button type="button" disabled title="Planned after MVP 1">◉ Recolor</button>
          <button type="button" disabled title="Planned after MVP 1">▧ Remove Background</button>
          <button type="button" disabled title="Planned after MVP 1">✣ Inpaint</button>
          <button type="button" disabled title="More tools will be added progressively">••• More</button>
        </div>
      </section>

      <input
        ref={fileInputRef}
        data-testid="asset-input"
        className="visually-hidden"
        type="file"
        accept="image/png,image/webp"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {error && (
        <div role="alert" className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}
    </main>
  );
}
