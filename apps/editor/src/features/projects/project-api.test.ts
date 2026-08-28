import { describe, expect, it } from "vitest";

import { buildProjectAssetUrl } from "./project-api";

describe("buildProjectAssetUrl", () => {
  it("builds an encoded URL for a project asset", () => {
    const url = buildProjectAssetUrl("project 1", "assets/my image.png");
    expect(url).toContain("/v1/projects/project%201/assets/my%20image.png");
  });

  it("rejects paths outside the assets directory", () => {
    expect(() => buildProjectAssetUrl("project-1", "../secret.png")).toThrow(
      "Unsupported project asset path",
    );
  });
});
