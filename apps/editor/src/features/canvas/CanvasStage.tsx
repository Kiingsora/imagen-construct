import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Layer as KonvaLayer, Rect, Stage } from "react-konva";

import { useEditorStore } from "../../store/editor-store";
import { buildProjectAssetUrl } from "../projects/project-api";
import { LayerNode } from "./LayerNode";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const CANVAS_PADDING = 72;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export function CanvasStage() {
  const project = useEditorStore((state) => state.project);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const activeTool = useEditorStore((state) => state.activeTool);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const setLayerTransform = useEditorStore((state) => state.setLayerTransform);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<Viewport>({ x: 80, y: 60, scale: 0.6 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitCanvas = useCallback(() => {
    if (!project) return;
    const availableWidth = Math.max(1, size.width - CANVAS_PADDING * 2);
    const availableHeight = Math.max(1, size.height - CANVAS_PADDING * 2);
    const scale = Math.min(
      1,
      availableWidth / project.canvas.width,
      availableHeight / project.canvas.height,
    );
    setViewport({
      scale,
      x: (size.width - project.canvas.width * scale) / 2,
      y: (size.height - project.canvas.height * scale) / 2,
    });
  }, [project, size]);

  useEffect(() => {
    fitCanvas();
  }, [fitCanvas, project?.id]);

  if (!project) return null;

  function zoomAtCenter(multiplier: number) {
    setViewport((current) => {
      const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.scale * multiplier));
      const center = { x: size.width / 2, y: size.height / 2 };
      const point = {
        x: (center.x - current.x) / current.scale,
        y: (center.y - current.y) / current.scale,
      };
      return {
        scale: nextScale,
        x: center.x - point.x * nextScale,
        y: center.y - point.y * nextScale,
      };
    });
  }

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const oldScale = viewport.scale;
    const point = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };
    const nextScale = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, oldScale * (event.evt.deltaY > 0 ? 0.9 : 1.1)),
    );
    setViewport({
      scale: nextScale,
      x: pointer.x - point.x * nextScale,
      y: pointer.y - point.y * nextScale,
    });
  }

  return (
    <section
      ref={containerRef}
      className={`canvas-stage canvas-stage--${activeTool}`}
      aria-label="Image canvas"
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={activeTool === "move"}
        onWheel={handleWheel}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) selectLayer(null);
        }}
        onDragEnd={(event) => {
          if (event.target === event.target.getStage()) {
            setViewport((current) => ({ ...current, x: event.target.x(), y: event.target.y() }));
          }
        }}
      >
        <KonvaLayer>
          <Group
            clipX={0}
            clipY={0}
            clipWidth={project.canvas.width}
            clipHeight={project.canvas.height}
          >
            <Rect
              x={0}
              y={0}
              width={project.canvas.width}
              height={project.canvas.height}
              fill={project.canvas.backgroundColor}
              listening={false}
            />
            {project.layers.map((layer) => (
              <LayerNode
                key={layer.id}
                layer={layer}
                source={buildProjectAssetUrl(project.id, layer.asset.path)}
                selected={selectedLayerId === layer.id}
                activeTool={activeTool}
                viewportScale={viewport.scale}
                onSelect={() => selectLayer(layer.id)}
                onTransform={(patch) => setLayerTransform(layer.id, patch)}
              />
            ))}
          </Group>
          <Rect
            x={0}
            y={0}
            width={project.canvas.width}
            height={project.canvas.height}
            stroke="#555d69"
            strokeWidth={1 / viewport.scale}
            listening={false}
            shadowColor="black"
            shadowBlur={24 / viewport.scale}
            shadowOpacity={0.3}
          />
        </KonvaLayer>
      </Stage>

      <div className="zoom-controls" aria-label="Canvas zoom controls">
        <button type="button" onClick={() => zoomAtCenter(0.9)} aria-label="Zoom out">−</button>
        <span>{Math.round(viewport.scale * 100)}%</span>
        <button type="button" onClick={() => zoomAtCenter(1.1)} aria-label="Zoom in">+</button>
        <button type="button" onClick={fitCanvas}>Fit</button>
      </div>
    </section>
  );
}
