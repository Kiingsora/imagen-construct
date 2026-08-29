import type { Layer, LayerTransform } from "@imagen-construct/contracts";
import { useMemo, useState, type KeyboardEvent } from "react";

import { useEditorStore } from "../../store/editor-store";
import { buildProjectAssetUrl } from "../projects/project-api";

type InspectorTab = "layers" | "properties" | "history";

interface Mvp0LayersPanelProps {
  onAddLayer(): void;
}

function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.currentTarget.blur();
}

function NumberField({
  label,
  value,
  step = 1,
  onCommit,
}: {
  label: string;
  value: number;
  step?: number;
  onCommit(value: number): void;
}) {
  return (
    <label className="property-field">
      <span>{label}</span>
      <input
        type="number"
        defaultValue={value}
        step={step}
        onKeyDown={commitOnEnter}
        onBlur={(event) => {
          const next = Number(event.currentTarget.value);
          if (Number.isFinite(next)) onCommit(next);
          else event.currentTarget.value = String(value);
        }}
      />
    </label>
  );
}

function PropertiesView({ layer }: { layer: Layer | null }) {
  const renameLayer = useEditorStore((state) => state.renameLayer);
  const setLayerOpacity = useEditorStore((state) => state.setLayerOpacity);
  const setLayerTransform = useEditorStore((state) => state.setLayerTransform);

  if (!layer) {
    return <div className="panel-empty">Select a layer to inspect its properties.</div>;
  }

  function patchTransform(patch: Partial<LayerTransform>) {
    setLayerTransform(layer.id, patch);
  }

  return (
    <div className="properties-view">
      <label className="property-field property-field--wide">
        <span>Name</span>
        <input
          key={layer.id}
          defaultValue={layer.name}
          maxLength={200}
          onKeyDown={commitOnEnter}
          onBlur={(event) => {
            const name = event.currentTarget.value.trim();
            if (name) renameLayer(layer.id, name);
            else event.currentTarget.value = layer.name;
          }}
        />
      </label>

      <div className="property-grid">
        <NumberField label="X" value={layer.transform.x} onCommit={(value) => patchTransform({ x: value })} />
        <NumberField label="Y" value={layer.transform.y} onCommit={(value) => patchTransform({ y: value })} />
        <NumberField
          label="Scale X"
          value={layer.transform.scaleX}
          step={0.01}
          onCommit={(value) => value > 0 && patchTransform({ scaleX: value })}
        />
        <NumberField
          label="Scale Y"
          value={layer.transform.scaleY}
          step={0.01}
          onCommit={(value) => value > 0 && patchTransform({ scaleY: value })}
        />
        <NumberField
          label="Rotation"
          value={layer.transform.rotation}
          step={0.1}
          onCommit={(value) => patchTransform({ rotation: value })}
        />
        <NumberField
          label="Opacity %"
          value={Math.round(layer.opacity * 100)}
          onCommit={(value) => setLayerOpacity(layer.id, Math.min(1, Math.max(0, value / 100)))}
        />
      </div>

      <section className="metadata-card">
        <h3>Asset</h3>
        <dl>
          <div><dt>Type</dt><dd>{layer.asset.mediaType}</dd></div>
          <div><dt>Size</dt><dd>{layer.asset.width} × {layer.asset.height}</dd></div>
          <div><dt>Alpha</dt><dd>{layer.asset.hasAlpha ? "Yes" : "No"}</dd></div>
        </dl>
      </section>

      {layer.generation && (
        <section className="metadata-card">
          <h3>Generation</h3>
          <dl>
            <div><dt>Adapter</dt><dd>{layer.generation.adapterId ?? "Unknown"}</dd></div>
            <div><dt>Model</dt><dd>{layer.generation.modelId ?? "Unknown"}</dd></div>
            <div><dt>Seed</dt><dd>{layer.generation.seed ?? "—"}</dd></div>
          </dl>
        </section>
      )}
    </div>
  );
}

export function Mvp0LayersPanel({ onAddLayer }: Mvp0LayersPanelProps) {
  const project = useEditorStore((state) => state.project);
  const history = useEditorStore((state) => state.history);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const setLayerVisibility = useEditorStore((state) => state.setLayerVisibility);
  const setLayerLocked = useEditorStore((state) => state.setLayerLocked);
  const setLayerOpacity = useEditorStore((state) => state.setLayerOpacity);
  const duplicateSelectedLayer = useEditorStore((state) => state.duplicateSelectedLayer);
  const removeSelectedLayer = useEditorStore((state) => state.removeSelectedLayer);
  const reorderLayer = useEditorStore((state) => state.reorderLayer);

  const [tab, setTab] = useState<InspectorTab>("layers");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [openMenuLayerId, setOpenMenuLayerId] = useState<string | null>(null);

  const selectedLayer = useMemo(
    () => project?.layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [project, selectedLayerId],
  );

  if (!project) return null;
  const displayLayers = [...project.layers].reverse();

  return (
    <aside className="inspector-panel" aria-label="Project inspector">
      <nav className="panel-tabs" aria-label="Inspector tabs">
        {(["layers", "properties", "history"] as const).map((item) => (
          <button
            key={item}
            type="button"
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
              Blend
              <select value="normal" disabled aria-label="Blend mode">
                <option value="normal">Normal</option>
              </select>
            </label>
            <label>
              Opacity {selectedLayer ? `${Math.round(selectedLayer.opacity * 100)}%` : "—"}
              <input
                aria-label="Selected layer opacity"
                type="range"
                min="0"
                max="100"
                value={selectedLayer ? Math.round(selectedLayer.opacity * 100) : 100}
                disabled={!selectedLayer || selectedLayer.locked}
                onChange={(event) => {
                  if (selectedLayer) setLayerOpacity(selectedLayer.id, Number(event.target.value) / 100);
                }}
              />
            </label>
          </div>

          <div className="layers-list" data-testid="layers-list">
            {displayLayers.length === 0 && (
              <div className="panel-empty">Import an image to create the first layer.</div>
            )}

            {displayLayers.map((layer) => {
              const source = buildProjectAssetUrl(project.id, layer.asset.path);
              const actualIndex = project.layers.findIndex((item) => item.id === layer.id);
              const selected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  className={`layer-row${selected ? " is-selected" : ""}`}
                  data-testid="layer-row"
                  data-layer-name={layer.name}
                  draggable={!layer.locked}
                  onDragStart={() => setDraggedLayerId(layer.id)}
                  onDragEnd={() => setDraggedLayerId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedLayerId && draggedLayerId !== layer.id) {
                      reorderLayer(draggedLayerId, actualIndex);
                    }
                    setDraggedLayerId(null);
                  }}
                  onClick={() => selectLayer(layer.id)}
                >
                  <span className="drag-handle" title="Drag to reorder" aria-hidden="true">⠿</span>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setLayerVisibility(layer.id, !layer.visible);
                    }}
                  >
                    {layer.visible ? "◉" : "○"}
                  </button>
                  <img className="layer-thumbnail" src={source} alt="" />
                  <div className="layer-summary">
                    <strong>{layer.name}</strong>
                    <span>{layer.asset.width} × {layer.asset.height}</span>
                  </div>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-label={`${layer.locked ? "Unlock" : "Lock"} ${layer.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setLayerLocked(layer.id, !layer.locked);
                    }}
                  >
                    {layer.locked ? "▣" : "□"}
                  </button>
                  <button
                    type="button"
                    className="layer-icon-button"
                    aria-label={`Layer menu for ${layer.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectLayer(layer.id);
                      setOpenMenuLayerId(openMenuLayerId === layer.id ? null : layer.id);
                    }}
                  >
                    •••
                  </button>

                  {openMenuLayerId === layer.id && (
                    <div className="layer-menu" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          duplicateSelectedLayer();
                          setOpenMenuLayerId(null);
                        }}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        disabled={actualIndex >= project.layers.length - 1}
                        onClick={() => {
                          reorderLayer(layer.id, actualIndex + 1);
                          setOpenMenuLayerId(null);
                        }}
                      >
                        Move forward
                      </button>
                      <button
                        type="button"
                        disabled={actualIndex <= 0}
                        onClick={() => {
                          reorderLayer(layer.id, actualIndex - 1);
                          setOpenMenuLayerId(null);
                        }}
                      >
                        Move backward
                      </button>
                      <button
                        type="button"
                        className="danger-action"
                        disabled={layer.locked}
                        onClick={() => {
                          removeSelectedLayer();
                          setOpenMenuLayerId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button" className="add-layer-button" onClick={onAddLayer}>＋ Add Layer</button>
        </>
      )}

      {tab === "properties" && <PropertiesView layer={selectedLayer} />}

      {tab === "history" && (
        <div className="history-view">
          <h3>Project history</h3>
          <p>{history?.past.length ?? 0} actions available to undo.</p>
          <p>{history?.future.length ?? 0} actions available to redo.</p>
          <small>Detailed named history entries are planned after the MVP workflow is validated.</small>
        </div>
      )}
    </aside>
  );
}
