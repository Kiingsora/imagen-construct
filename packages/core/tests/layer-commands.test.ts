import type { Layer, ProjectDocument } from "@imagen-construct/contracts";
import { describe, expect, it } from "vitest";

import {
  addLayer,
  duplicateLayer,
  removeLayer,
  reorderLayer,
  setLayerLocked,
  updateLayerTransform,
} from "../src";

function layer(id: string): Layer {
  return {
    id,
    name: id,
    kind: "imported",
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    asset: { path: `assets/${id}.png`, mediaType: "image/png", width: 100, height: 100 },
  };
}

function project(): ProjectDocument {
  return {
    formatVersion: "0.2.0",
    id: "project",
    name: "Project",
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    canvas: { width: 1024, height: 1024, backgroundColor: "#00000000" },
    layers: [layer("a"), layer("b")],
  };
}

describe("layer commands", () => {
  it("keeps commands immutable", () => {
    const original = project();
    const next = updateLayerTransform(original, "a", { x: 42 });
    expect(original.layers[0]!.transform.x).toBe(0);
    expect(next.layers[0]!.transform.x).toBe(42);
  });

  it("uses array order as layer order", () => {
    const next = reorderLayer(project(), "a", 1);
    expect(next.layers.map(({ id }) => id)).toEqual(["b", "a"]);
  });

  it("duplicates directly above the source", () => {
    const next = duplicateLayer(project(), "a", "copy");
    expect(next.layers.map(({ id }) => id)).toEqual(["a", "copy", "b"]);
  });

  it("supports insertion and removal", () => {
    const withLayer = addLayer(project(), layer("c"), 1);
    expect(withLayer.layers.map(({ id }) => id)).toEqual(["a", "c", "b"]);
    expect(removeLayer(withLayer, "c").layers.map(({ id }) => id)).toEqual(["a", "b"]);
  });

  it("blocks transforms on locked layers", () => {
    const locked = setLayerLocked(project(), "a", true);
    expect(() => updateLayerTransform(locked, "a", { x: 2 })).toThrow("is locked");
  });
});
