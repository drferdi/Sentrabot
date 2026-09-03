import { expect, test } from "@playwright/test";
import {
  captureScreenshot,
  completeOnboarding,
  expectVisibleAfterRealtime,
  sendComposer,
  signup,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test("agent-attached files appear as downloadable cards", async ({ page }, testInfo) => {
  const stamp = Date.now();
  await signup(page, `artifact-card-${stamp}@sentrabot.test`, "password12", "Artifact Card");
  await completeOnboarding(page);

  await sendComposer(page, "write notes/result.txt and attach it to the thread");

  const fileCard = page.getByRole("button", { name: /result\.txt text\/plain/ });
  await expectVisibleAfterRealtime(page, fileCard, 30_000);
  await captureScreenshot(page, testInfo, "current-file-card");

  const downloadPromise = page.waitForEvent("download");
  await fileCard.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("result.txt");
});

test("agent-attached Markdown opens a rendered preview and can be downloaded", async ({
  page,
}, testInfo) => {
  const stamp = Date.now();
  await signup(page, `markdown-preview-${stamp}@sentrabot.test`, "password12", "Markdown Preview");
  await completeOnboarding(page);

  await sendComposer(
    page,
    "write path notes/preview.md and attach it to the thread says # Project preview",
  );

  const previewButton = page.getByRole("button", { name: "Preview preview.md" });
  await expectVisibleAfterRealtime(page, previewButton, 30_000);
  await captureScreenshot(page, testInfo, "markdown-file-card");
  await previewButton.click();

  const dialog = page.getByRole("dialog", { name: "preview.md" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Project preview" })).toBeVisible();
  const closeButton = dialog.getByRole("button", { name: "Close preview" });
  const downloadButton = dialog.getByRole("button", { name: "Download preview.md" });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(downloadButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(closeButton).toBeFocused();
  await captureScreenshot(page, testInfo, "markdown-preview-open");

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("preview.md");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(previewButton).toBeFocused();
});
