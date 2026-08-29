import { describe, expect, it } from "vitest";
import { CURRENT_PROJECT_FORMAT_VERSION } from "@imagen-construct/contracts";
import { createProject } from "../src";

describe("createProject", () => {
  it("creates a valid empty project with deterministic timestamps", () => {
    const now = new Date("2026-08-27T12:00:00.000Z");
    const project = createProject({ id: "project-1", name: "My scene", now });
    expect(project).toMatchObject({ formatVersion: CURRENT_PROJECT_FORMAT_VERSION, id: "project-1", name: "My scene", createdAt: now.toISOString(), updatedAt: now.toISOString(), canvas: { width: 1024, height: 1024, backgroundColor: "#00000000" }, layers: [] });
  });
});
