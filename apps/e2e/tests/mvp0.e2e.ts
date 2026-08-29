import { expect, test } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l9nkwAAAAABJRU5ErkJggg==",
  "base64",
);

test("creates, edits, saves, reopens, and exports a layered project", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Project name").fill("MVP 0 verification");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByTestId("editor-shell")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.getByTestId("asset-input").setInputFiles({
    name: "fixture-layer.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });

  const layerRow = page.getByTestId("layer-row").filter({ hasText: "fixture-layer" });
  await expect(layerRow).toBeVisible();
  await expect(page.getByText("Unsaved", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Hide fixture-layer" }).click();
  await expect(page.getByRole("button", { name: "Show fixture-layer" })).toBeVisible();
  await page.getByRole("button", { name: "Show fixture-layer" }).click();

  await layerRow.click();
  await page.getByRole("button", { name: "Properties" }).click();
  const layerName = page.locator(".properties-view input").first();
  await layerName.fill("Renamed layer");
  await layerName.press("Enter");
  await expect(page.getByText("Renamed layer", { exact: true })).toBeVisible();

  await page.keyboard.press("Control+d");
  await expect(page.getByTestId("layer-row")).toHaveCount(2);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("layer-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.getByTestId("layer-row")).toHaveCount(2);

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("editor-shell")).toBeVisible();
  await expect(page.getByText("Renamed layer", { exact: true })).toBeVisible();
  await expect(page.getByTestId("layer-row")).toHaveCount(2);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("MVP-0-verification.png");
  expect((await download.createReadStream()) !== null).toBe(true);
});
