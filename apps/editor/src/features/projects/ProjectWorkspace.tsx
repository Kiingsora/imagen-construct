import { type FormEvent, useState } from "react";

import { CanvasStage } from "../canvas/CanvasStage";
import { useEditorStore } from "../../store/editor-store";

export function ProjectWorkspace() {
  const project = useEditorStore((state) => state.project);
  const busy = useEditorStore((state) => state.busy);
  const error = useEditorStore((state) => state.error);
  const createProject = useEditorStore((state) => state.createProject);
  const renameProject = useEditorStore((state) => state.renameProject);
  const saveProject = useEditorStore((state) => state.saveProject);
  const [name, setName] = useState("Untitled project");

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void createProject(name);
  }

  if (!project) {
    return (
      <main className="welcome-shell">
        <section className="welcome-card">
          <p className="eyebrow">Layer-first editor</p>
          <h1>Imagen Construct</h1>
          <p>Create a local project, then build the image as independent layers.</p>
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

  return (
    <main className="editor-shell">
      <header className="topbar">
        <input aria-label="Project name" value={project.name} onChange={(event) => renameProject(event.target.value)} />
        <span className="project-id">{project.id}</span>
        <button type="button" onClick={() => void saveProject()} disabled={busy}>Save</button>
      </header>
      <aside className="toolbar">Tools</aside>
      <CanvasStage />
      <aside className="layers-panel">
        <h2>Layers</h2>
        <p>{project.layers.length === 0 ? "No layers yet" : `${project.layers.length} layers`}</p>
      </aside>
      <footer className="prompt-panel">Generation controls will live here.</footer>
      {error && <div role="alert" className="error-banner">{error}</div>}
    </main>
  );
}
