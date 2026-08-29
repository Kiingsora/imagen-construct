import { expect, test } from "@playwright/test";

const PNG_FIXTURE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAYAAAChS3wfAAAAfElEQVR4nO3QQRHAIADAMMAsJpCFtr2RkccaBb3Os787fmzpAK0BOkBrgA7QGqADtAboAK0BOkBrgA7QGqADtAboAK0BOkBrgA7QGqADtAboAK0BOkBrgA7QGqADtAboAK0BOkBrgA7QGqADtAboAK0BOkBrgA7QGqADtAckYALtMilRtAAAAABJRU5ErkJggg==",
  "base64",
);

test("completes the MVP 0 project workflow", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Project name").fill("MVP 0 E2E");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByRole("strong").filter({ hasText: "Imagen Construct" })).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved");

  await page.getByRole("button", { name: /Add Layer/ }).first().click();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Import image/ }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: PNG_FIXTURE,
  });

  const sourceLayer = page.locator(".layer-row").filter({ hasText: "fixture" });
  await expect(sourceLayer).toHaveCount(1);
  await sourceLayer.locator(".layer-main").click();

  await page.getByRole("button", { name: "Properties" }).click();
  const xField = page.getByRole("spinbutton", { name: "X" });
  await xField.fill("160");
  await expect(xField).toHaveValue("160");

  await page.getByRole("button", { name: "Layers" }).click();
  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.locator(".layer-row").filter({ hasText: "fixture copy" })).toHaveCount(1);

  await page.getByRole("button", { name: /Undo/ }).click();
  await expect(page.locator(".layer-row").filter({ hasText: "fixture copy" })).toHaveCount(0);
  await page.getByRole("button", { name: /Redo/ }).click();

  await page.getByRole("button", { name: "Hide fixture copy" }).click();
  await page.getByRole("button", { name: /Save/ }).click();
  await expect(page.locator(".save-status")).toHaveText("Saved");

  await page.reload();
  await expect(page.locator(".layer-row")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Show fixture copy" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("MVP-0-E2E.png");

  await page.screenshot({ path: "test-results/mvp0-workspace.png", fullPage: true });
});
