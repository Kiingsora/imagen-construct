import { expect, test } from "@playwright/test";

test("generates and selectively regenerates one independent layer", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project name").fill("Mock generation verification");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByTestId("editor-shell")).toBeVisible();
  await expect(page.getByTestId("generation-panel")).toBeVisible();
  await expect(page.getByText("Local service connected", { exact: true })).toBeVisible();

  const prompt = page.getByLabel("Prompt");
  await prompt.fill("A violet sofa");
  const generate = page.getByTestId("generate-layer");
  await expect(generate).toBeEnabled();
  await generate.click();

  const generatedLayer = page.getByTestId("layer-row").filter({ hasText: "A violet sofa" });
  await expect(generatedLayer).toBeVisible();
  await expect(page.getByText(/completed · 100% · A violet sofa/)).toBeVisible();
  await expect(page.getByTestId("layer-row")).toHaveCount(1);

  await generatedLayer.click();
  await prompt.fill("A blue sofa");
  await page.getByRole("button", { name: "Regenerate Layer" }).click();
  await expect(page.getByText(/completed · 100% · A blue sofa/)).toBeVisible();
  await expect(page.getByTestId("layer-row")).toHaveCount(1);

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("layer-row")).toHaveCount(1);
});
