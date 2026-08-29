import { useEffect, useRef, useState, type FormEvent } from "react";

import { CanvasStage } from "../canvas/CanvasStage";
import { LayersPanel } from "../layers/LayersPanel";
import { useEditorStore, type EditorTool } from "../../store/editor-store";
import { exportProjectPng } from "./export-project";

const TOOLS: Array<{ id: EditorTool; label: string; glyph: string; implemented: boolean; separator?: boolean }> = [
  { id: "select", label: "Select", glyph: "⌗", implemented: true },
  { id: "move", label: "Move", glyph: "✥", implemented: true },
  { id: "transform", label: "Transform", glyph: "⌖", implemented: true },
  { id: "brush", label: "Brush", glyph: "╱", implemented: false, separator: true },
  { id: "erase", label: "Erase", glyph: "◇", implemented: false },
  { id: "mask", label: "Mask", glyph: "▣", implemented: false },
  { id: "inpaint", label: "Inpaint", glyph: "✣", implemented: false },
  { id: "crop", label: "Crop", glyph: "⌑", implemented: false, separator: true },
  { id: "text", label: "Text", glyph: "T", implemented: false },
  { id: "shapes", label: "Shapes", glyph: "○", implemented: false },
  { id: "recolor", label: "Recolor", glyph: "◉", implemented: false, separator: true },
  { id: "adjust", label: "Adjust", glyph: "≛", implemented: false },
  { id: "effects", label: "Effects", glyph: "✦", implemented: false },
  { id: "ai-tools", label: "AI Tools", glyph: "✧", implemented: false, separator: true },
];

type BottomTab = "generate" | "edit" | "enhance" | "style";

export function ProjectWorkspace() {
  const project = useEditorStore((state) => state.project);
  const history = useEditorStore((state) => state.history);
  const initialized = useEditorStore((state) => state.initialized);
  const busy = useEditorStore((state) => state.busy);
  const dirty = useEditorStore((state) => state.dirty);
  const error = useEditorStore((state) => state.error);
  const activeTool = useEditorStore((state) => state.activeTool);
  const prompt = useEditorStore((state) => state.prompt);
  const initialize = useEditorStore((state) => state.initialize);
  const createProject = useEditorStore((state) => state.createProject);
  const renameProject = useEditorStore((state) => state.renameProject);
  const saveProject = useEditorStore((state) => state.saveProject);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const setPrompt = useEditorStore((state) => state.setPrompt);
  const setError = useEditorStore((state) => state.setError);
  const importLayer = useEditorStore((state) => state.importLayer);
  const duplicateSelectedLayer = useEditorStore((state) => state.duplicateSelectedLayer);
  const removeSelectedLayer = useEditorStore((state) => state.removeSelectedLayer);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [name, setName] = useState("Untitled project");
  const [bottomTab, setBottomTab] = useState<BottomTab>("generate");
  const [addLayerOpen, setAddLayerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target;
      const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const command = event.ctrlKey || event.metaKey;

      if (command && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProject();
        return;
      }
      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (command && event.key.toLowerCase() === "d" && !isEditing) {
        event.preventDefault();
        duplicateSelectedLayer();
        return;
      }
      if (command && event.key.toLowerCase() === "e" && !isEditing && project) {
        event.preventDefault();
        void handleExport();
        return;
      }
      if (!isEditing && event.key === "Delete") removeSelectedLayer();
      if (!isEditing && event.key === "Escape") selectLayer(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicateSelectedLayer, project, redo, removeSelectedLayer, saveProject, selectLayer, undo]);

  async function handleExport() {
    if (!project) return;
    setError(null);
    try {
      await exportProjectPng(project);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to export project.");
    }
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void createProject(name);
  }

  function selectImportFile() {
    setAddLayerOpen(false);
    fileInputRef.current?.click();
  }

  if (!initialized) {
    return <main className="loading-screen">Loading Imagen Construct…</main>;
  }

  if (!project) {
    return (
      <main className="welcome-shell">
        <section className="welcome-card">
          <div className="brand-mark">IC</div>
          <p className="eyebrow">Layer-first AI image editor</p>
          <h1>Imagen Construct</h1>
          <p>Create a local project, then compose the image from independent editable layers.</p>
          <form onSubmit={handleCreate} className="project-form">
            <label htmlFor="project-name">Project name</label>
            <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
            <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</button>
          </form>
          {error && <p role="alert" className="error-message">{error}</p>}
        </section>
      </main>
    );
  }

  const canUndo = (history?.past.length ?? 0) > 0;
  const canRedo = (history?.future.length ?? 0) > 0;

  return (
    <main className="editor-shell">
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
        />
        <span className={`save-status ${dirty ? "is-dirty" : ""}`}>
          {busy ? "Working…" : dirty ? "Unsaved" : "Saved"}
        </span>
        <div className="topbar-history">
          <button type="button" onClick={undo} disabled={!canUndo}>↶ Undo</button>
          <button type="button" onClick={redo} disabled={!canRedo}>↷ Redo</button>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => void saveProject()} disabled={busy}>▣ Save</button>
          <button type="button" onClick={() => void handleExport()}>⇧ Export</button>
          <button type="button" disabled title="Settings arrive after MVP 0">⚙ Settings</button>
        </div>
      </header>

      <aside className="toolbar" aria-label="Editor tools">
        {TOOLS.map((tool) => (
          <div key={tool.id} className={tool.separator ? "tool-group-start" : undefined}>
            <button
              type="button"
              className={`tool-button ${activeTool === tool.id ? "is-active" : ""}`}
              onClick={() => tool.implemented && setActiveTool(tool.id)}
              disabled={!tool.implemented}
              title={tool.implemented ? tool.label : `${tool.label} is planned after MVP 0`}
            >
              <span aria-hidden="true">{tool.glyph}</span>
              <small>{tool.label}</small>
            </button>
          </div>
        ))}
      </aside>

      <CanvasStage />
      <LayersPanel onAddLayer={() => setAddLayerOpen(true)} />

      <footer className="prompt-panel">
        <nav className="bottom-tabs" aria-label="Context panel tabs">
          {(["generate", "edit", "enhance", "style"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={bottomTab === tab ? "is-active" : ""}
              onClick={() => setBottomTab(tab)}
            >
              {tab[0]!.toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {bottomTab === "generate" ? (
          <div className="generate-panel">
            <label className="prompt-field">
              <span>Prompt</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe what you want to generate on the selected layer…"
              />
            </label>
            <button type="button" className="generate-button" disabled title="Mock generation is the next milestone">
              ✦ Generate
            </button>
            <div className="context-actions">
              <button type="button" onClick={() => setAddLayerOpen(true)}>＋ Add Layer</button>
              <button type="button" disabled>⟳ Regenerate Layer</button>
              <button type="button" disabled>◉ Recolor</button>
              <button type="button" disabled>▧ Remove Background</button>
              <button type="button" disabled>✣ Inpaint</button>
              <button type="button" disabled>… More</button>
            </div>
          </div>
        ) : (
          <div className="panel-placeholder">
            <strong>{bottomTab[0]!.toUpperCase() + bottomTab.slice(1)}</strong>
            <span>This workspace is reserved for the next milestones.</span>
          </div>
        )}
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importLayer(file);
          event.currentTarget.value = "";
        }}
      />

      {addLayerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAddLayerOpen(false)}>
          <section
            className="add-layer-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-layer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">New layer</p>
                <h2 id="add-layer-title">Add to the composition</h2>
              </div>
              <button type="button" onClick={() => setAddLayerOpen(false)} aria-label="Close">×</button>
            </header>
            <button type="button" className="layer-type-card is-enabled" onClick={selectImportFile}>
              <strong>Import image</strong>
              <span>PNG or WebP, up to 32 MB</span>
            </button>
            <button type="button" className="layer-type-card" disabled>
              <strong>Generate image</strong>
              <span>Available with the mock generation milestone</span>
            </button>
            <button type="button" className="layer-type-card" disabled>
              <strong>Text, shape or paint layer</strong>
              <span>Planned after the interaction MVP</span>
            </button>
          </section>
        </div>
      )}

      {error && (
        <div role="alert" className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}

      {busy && <div className="busy-indicator">Processing…</div>}
    </main>
  );
}
