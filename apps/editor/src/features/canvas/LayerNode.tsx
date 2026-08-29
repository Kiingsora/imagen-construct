import type { Layer as LayerModel, LayerTransform } from "@imagen-construct/contracts";
import type Konva from "konva";
import { useEffect, useRef } from "react";
import { Group, Image as KonvaImage, Rect, Transformer } from "react-konva";

import type { EditorTool } from "../../store/editor-store";
import { useLayerImage } from "./use-layer-image";

interface LayerNodeProps {
  layer: LayerModel;
  source: string;
  selected: boolean;
  activeTool: EditorTool;
  viewportScale: number;
  onSelect(): void;
  onTransform(patch: Partial<LayerTransform>): void;
}

export function LayerNode({
  layer,
  source,
  selected,
  activeTool,
  viewportScale,
  onSelect,
  onTransform,
}: LayerNodeProps) {
  const image = useLayerImage(source);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const interactionEnabled = activeTool === "select" || activeTool === "transform";

  useEffect(() => {
    const transformer = transformerRef.current;
    const node = groupRef.current;
    if (!transformer) return;
    transformer.nodes(selected && node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selected, image]);

  function select(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!interactionEnabled) return;
    event.cancelBubble = true;
    onSelect();
  }

  function commitTransform() {
    const node = groupRef.current;
    if (!node) return;
    onTransform({
      x: node.x(),
      y: node.y(),
      scaleX: Math.max(0.01, node.scaleX()),
      scaleY: Math.max(0.01, node.scaleY()),
      rotation: node.rotation(),
    });
  }

  return (
    <>
      <Group
        ref={groupRef}
        id={`layer-${layer.id}`}
        x={layer.transform.x}
        y={layer.transform.y}
        scaleX={layer.transform.scaleX}
        scaleY={layer.transform.scaleY}
        rotation={layer.transform.rotation}
        opacity={layer.opacity}
        visible={layer.visible}
        draggable={interactionEnabled && !layer.locked}
        onMouseDown={select}
        onTouchStart={select}
        onDragEnd={commitTransform}
        onTransformEnd={commitTransform}
      >
        {image ? (
          <KonvaImage image={image} width={layer.asset.width} height={layer.asset.height} />
        ) : (
          <Rect
            width={layer.asset.width}
            height={layer.asset.height}
            fill="#20252d"
            stroke="#6f7784"
            strokeWidth={1 / Math.max(viewportScale, 0.01)}
          />
        )}
      </Group>
      {selected && interactionEnabled && !layer.locked && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          flipEnabled={false}
          keepRatio
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          anchorSize={10 / Math.max(viewportScale, 0.01)}
          anchorCornerRadius={2 / Math.max(viewportScale, 0.01)}
          borderStroke="#8b7cff"
          anchorFill="#f5f3ff"
          anchorStroke="#6254e8"
          borderStrokeWidth={1.5 / Math.max(viewportScale, 0.01)}
          boundBoxFunc={(oldBox, newBox) =>
            Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}
