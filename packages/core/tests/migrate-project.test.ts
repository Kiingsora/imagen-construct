import { describe, expect, it } from "vitest";
import { CURRENT_PROJECT_FORMAT_VERSION, LEGACY_PROJECT_FORMAT_VERSION_V0_1_0 } from "@imagen-construct/contracts";
import { migrateProjectDocument, UnsupportedProjectFormatError } from "../src";

const baseLayer = { visible: true, locked: false, opacity: 1, transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, asset: { path: "assets/layer.png", mediaType: "image/png" as const, width: 256, height: 256 } };

describe("migrateProjectDocument", () => {
  it("migrates v0.1.0 by sorting layers and removing zIndex", () => {
    const now = new Date("2026-08-27T13:00:00.000Z");
    const migrated = migrateProjectDocument({ formatVersion: LEGACY_PROJECT_FORMAT_VERSION_V0_1_0, id: "legacy-project", name: "Legacy scene", canvas: { width: 1024, height: 1024, backgroundColor: "#00000000" }, layers: [ { ...baseLayer, id: "front", name: "Front", kind: "imported", zIndex: 10 }, { ...baseLayer, id: "back", name: "Back", kind: "background", zIndex: 0 } ] }, { now });
    expect(migrated.formatVersion).toBe(CURRENT_PROJECT_FORMAT_VERSION);
    expect(migrated.layers.map((layer) => layer.id)).toEqual(["back", "front"]);
    expect(migrated.layers.some((layer) => "zIndex" in layer)).toBe(false);
    expect(migrated.createdAt).toBe(now.toISOString());
    expect(migrated.updatedAt).toBe(now.toISOString());
  });
  it("rejects unsupported versions", () => {
    expect(() => migrateProjectDocument({ formatVersion: "9.9.9" })).toThrow(UnsupportedProjectFormatError);
  });
});
