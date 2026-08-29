import type { Layer, LayerTransform } from "@imagen-construct/contracts";
import { useEffect, useMemo, useState, type DragEvent } from "react";

import { useEditorStore } from "../../store/editor-store";
import { buildProjectAssetUrl } from "../projects/project-api";

type PanelTab = "layers" | "properties" | "history";

interface LayersPanelProps {
  onAddLayer(): void;
}

function NumberField({
  label,
  value,
  disabled,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  step?: number;
  onChange(value: number): void;
}) {
  return (
    <label className="property-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </label>
  );
}

function LayerNameField({ layer }: { layer: Layer }) {
  const renameLayer = useEditorStore((state) => state.renameLayer);
  const [draft, setDraft] = useState(layer.name);

  useEffect(() => setDraft(layer.name), [layer.id, layer.name]);

  function commit() {
    const clean = draft.trim();
    if (!clean) {
      setDraft(layer.name);
      return;
    }
    if (clean !== layer.name) renameLayer(layer.id, clean);
  }

  return (
    <label className="property-field property-field--wide">
      <span>Name</span>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(layer.name);
        }}
      />
    </label>
  );
}

function LayerProperties({ layer }: { layer: Layer | null }) {
  const setLayerOpacity = useEditorStore((state) => state.setLayerOpacity);
  const setLayerTransform = useEditorStore((state) => state.setLayerTransform);

  if (!layer) {
    return <div className="panel-empty">Select a layer to edit its properties.</div>;
  }

  const disabled = layer.locked;
  const update = (patch: Partial<LayerTransform>) => setLayerTransform(layer.id, patch);

  return (
    <div className="properties-form">
      <LayerNameField layer={layer} />
      <div className="properties-grid">
        <NumberField label="X" value={layer.transform.x} disabled={disabled} onChange={(x) => update({ x })} />
        <NumberField label="Y" value={layer.transform.y} disabled={disabled} onChange={(y) => update({ y })} />
        <NumberField
          label="Scale X"
          value={layer.transform.scaleX}
          disabled={disabled}
          step={0.01}
          onChange={(scaleX) => update({ scaleX: Math.max(0.01, scaleX) })}
        />
        <NumberField
          label="Scale Y"
          value={layer.transform.scaleY}
          disabled={disabled}
          step={0.01}
          onChange={(scaleY) => update({ scaleY: Math.max(0.01, scaleY) })}
        />
        <NumberField
          label="Rotation"
          value={layer.transform.rotation}
          disabled={disabled}
          onChange={(rotation) => update({ rotation })}
        />
      </div>
      <label className="property-field property-field--wide">
        <span>Opacity {Math.round(layer.opacity * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={layer.opacity}
          disabled={disabled}
          onChange={(event) => setLayerOpacity(layer.id, Number(event.target.value))}
        />
      </label>
      <dl className="metadata-list">
        <div><dt>Type</dt><dd>{layer.kind}</dd></div>
        <div><dt>Asset</dt><dd>{layer.asset.width} × {layer.asset.height}</dd></div>
        <div><dt>Alpha</dt><dd>{layer.asset.hasAlpha ? "Yes" : "No"}</dd></div>
      </dl>
    </div>
  );
}

export function LayersPanel({ onAddLayer }: LayersPanelProps) {
  const project = useEditorStore((state) => state.project);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const history = useEditorStore((state) => state.history);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const reorderLayer = useEditorStore((state) => state.reorderLayer);
  const setLayerVisibility = useEditorStore((state) => state.setLayerVisibility);
  const setLayerLocked = useEditorStore((state) => state.setLayerLocked);
  const duplicateSelectedLayer = useEditorStore((state) => state.duplicateSelectedLayer);
  const removeSelectedLayer = useEditorStore((state) => state.removeSelectedLayer);
  const [tab, setTab] = useState<PanelTab>("layers");

  const selectedLayer = useMemo(
    () => project?.layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [project, selectedLayerId],
  );

  if (!project) return null;
  const currentProject = project;
  const visibleOrder = [...currentProject.layers].reverse();

  function dropLayer(event: DragEvent, targetLayerId: string) {
    event.preventDefault();
    const sourceLayerId = event.dataTransfer.getData("application/x-imagen-layer");
    if (!sourceLayerId || sourceLayerId === targetLayerId) return;
    const targetIndex = currentProject.layers.findIndex((layer) => layer.id === targetLayerId);
    if (targetIndex >= 0) reorderLayer(sourceLayerId, targetIndex);
  }

  return (
    <aside className="inspector-panel" aria-label="Layer inspector">
      <nav className="panel-tabs" aria-label="Inspector tabs">
        {(["layers", "properties", "history"] as const).map((item) => (
          <button
            type="button"
            key={item}
            className={tab === item ? "is-active" : ""}
            onClick={() => setTab(item)}
          >
            {item[0]!.toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "layers" && (
        <>
          <div className="layer-controls">
            <label>
              <span>Blend</span>
              <select value="normal" disabled><option>Normal</option></select>
            </label>
            <label>
              <span>Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedLayer?.opacity ?? 1}
                disabled={!selectedLayer || selectedLayer.locked}
                onChange={(event) => {
                  if (selectedLayer) useEditorStore.getState().setLayerOpacity(selectedLayer.id, Number(event.target.value));
                }}
              />
            </label>
          </div>

          <div className="layers-list" role="list">
            {visibleOrder.length === 0 && (
              <div className="panel-empty">Import an image to create the first layer.</div>
            )}
            {visibleOrder.map((layer) => {
              const selected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  role="listitem"
                  className={`layer-row ${selected ? "is-selected" : ""}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-imagen-layer", layer.id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropLayer(event, layer.id)}
                >
                  <span className="drag-handle" aria-hidden="true">⋮⋮</span>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                    onClick={() => setLayerVisibility(layer.id, !layer.visible)}
                  >
                    {layer.visible ? "◉" : "○"}
                  </button>
                  <button
                    type="button"
                    className="layer-main"
                    onClick={() => selectLayer(layer.id)}
                  >
                    <span
                      className="layer-thumbnail"
                      style={{ backgroundImage: `url(${buildProjectAssetUrl(currentProject.id, layer.asset.path)})` }}
                    />
                    <span className="layer-copy">
                      <strong>{layer.name}</strong>
                      <small>{layer.asset.width} × {layer.asset.height}</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-label={layer.locked ? `Unlock ${layer.name}` : `Lock ${layer.name}`}
                    onClick={() => setLayerLocked(layer.id, !layer.locked)}
                  >
                    {layer.locked ? "●" : "◇"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="layer-footer">
            <button type="button" className="primary-outline-button" onClick={onAddLayer}>＋ Add Layer</button>
            <button type="button" onClick={duplicateSelectedLayer} disabled={!selectedLayer}>Duplicate</button>
            <button
              type="button"
              onClick={removeSelectedLayer}
              disabled={!selectedLayer || selectedLayer.locked}
            >
              Delete
            </button>
          </div>
        </>
      )}

      {tab === "properties" && <LayerProperties layer={selectedLayer} />}

      {tab === "history" && (
        <div className="history-panel">
          <div className="history-summary">
            <strong>{history?.past.length ?? 0}</strong>
            <span>undoable changes</span>
          </div>
          <ol>
            {(history?.past ?? []).map((_, index) => (
              <li key={index}>Project state {index + 1}</li>
            ))}
            <li className="is-current">Current state</li>
          </ol>
        </div>
      )}
    </aside>
  );
}
