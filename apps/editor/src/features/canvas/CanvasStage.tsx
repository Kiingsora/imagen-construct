import { useEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from "react";
import { Layer, Rect, Stage } from "react-konva";

import { useEditorStore } from "../../store/editor-store";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export function CanvasStage() {
  const project = useEditorStore((state) => state.project);
  const containerRef = useRef<HTMLDivElement>(null);
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

  if (!project) return null;

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setViewport((current) => ({
      ...current,
      scale: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.scale * (direction > 0 ? 1.1 : 0.9))),
    }));
  }

  return (
    <div ref={containerRef} className="canvas-stage" onWheel={handleWheel}>
      <Stage
        width={size.width}
        height={size.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable
        onDragEnd={(event) => setViewport((current) => ({ ...current, x: event.target.x(), y: event.target.y() }))}
      >
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={project.canvas.width}
            height={project.canvas.height}
            fill={project.canvas.backgroundColor}
            stroke="#545861"
            strokeWidth={1 / viewport.scale}
            shadowColor="black"
            shadowBlur={24 / viewport.scale}
            shadowOpacity={0.35}
          />
        </Layer>
      </Stage>
      <div className="zoom-indicator">{Math.round(viewport.scale * 100)}%</div>
    </div>
  );
}
