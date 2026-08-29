import { describe, expect, it } from "vitest";

import {
  CURRENT_PROJECT_FORMAT_VERSION,
  validateProjectDocument,
  type ProjectDocument,
} from "../src";

function validProject(): ProjectDocument {
  return {
    formatVersion: CURRENT_PROJECT_FORMAT_VERSION,
    id: "project-1",
    name: "Validation fixture",
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    canvas: { width: 1024, height: 1024, backgroundColor: "#00000000" },
    layers: [
      {
        id: "layer-1",
        name: "Sofa",
        kind: "imported",
        visible: true,
        locked: false,
        opacity: 1,
        transform: { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 },
        asset: {
          path: "assets/sofa.png",
          mediaType: "image/png",
          width: 512,
          height: 512,
          hasAlpha: true,
        },
      },
    ],
  };
}

describe("validateProjectDocument", () => {
  it("accepts a valid current project", () => {
    expect(validateProjectDocument(validProject())).toEqual({
      valid: true,
      value: validProject(),
    });
  });

  it("rejects duplicate layer ids", () => {
    const project = validProject();
    project.layers.push({ ...project.layers[0]!, name: "Duplicate" });

    const result = validateProjectDocument(project);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues[0]?.keyword).toBe("uniqueLayerId");
    }
  });

  it.each([
    "C:\\images\\sofa.png",
    "/tmp/sofa.png",
    "assets/../sofa.png",
    "assets/nested/sofa.png",
    "other/sofa.png",
  ])("rejects unsafe asset path %s", (path) => {
    const project = validProject();
    project.layers[0]!.asset.path = path;

    expect(validateProjectDocument(project).valid).toBe(false);
  });

  it("rejects project identifiers unsupported by local storage", () => {
    const project = validProject();
    project.id = "../project";

    expect(validateProjectDocument(project).valid).toBe(false);
  });
});
