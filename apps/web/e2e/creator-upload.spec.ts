import { expect, test, type Page } from "@playwright/test";

const creatorCredentials = {
  email: "solis@wavestream.demo",
  password: "DemoPass123!",
};

async function signIn(page: Page) {
  await page.goto("/sign-in?next=%2Fcreator");
  await page.getByLabel("Email").fill(creatorCredentials.email);
  await page.getByLabel("Password").fill(creatorCredentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/creator$/);
}

function createWavBuffer(durationSeconds = 1) {
  const sampleRate = 8_000;
  const bitsPerSample = 16;
  const channelCount = 1;
  const totalSamples = sampleRate * durationSeconds;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = totalSamples * channelCount * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
  buffer.writeUInt16LE(channelCount * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const tone = Math.sin(2 * Math.PI * 220 * time) * 0.3;
    buffer.writeInt16LE(Math.round(tone * 0x7fff), 44 + index * 2);
  }

  return buffer;
}

const COVER_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlAb8QAAAAASUVORK5CYII=",
  "base64",
);

test("creator can upload, edit, and delete a track from the dashboard", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const initialTitle = `Creator Upload ${suffix}`;
  const updatedTitle = `${initialTitle} Revised`;

  await signIn(page);
  await expect(page.getByRole("heading", { name: "Upload track" })).toBeVisible();

  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles({
    name: `${initialTitle}.wav`,
    mimeType: "audio/wav",
    buffer: createWavBuffer(),
  });
  await fileInputs.nth(1).setInputFiles({
    name: `${initialTitle}.png`,
    mimeType: "image/png",
    buffer: COVER_BUFFER,
  });

  await page.getByLabel("Title").fill(initialTitle);
  await page.getByLabel("Description").fill("Uploaded from Playwright to verify creator flow.");
  await page.getByLabel("Tags").fill("playwright, creator, upload");
  await page.getByRole("button", { name: "Publish track" }).click();

  const trackCard = page
    .getByText(initialTitle, { exact: true })
    .locator(
      "xpath=ancestor::div[contains(@class, 'rounded-3xl')][.//button[normalize-space()='Edit']][1]",
    )
    .first();
  await expect(trackCard).toBeVisible({ timeout: 20_000 });
  await trackCard.getByRole("button", { name: "Edit" }).click();

  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Title").fill(updatedTitle);
  await editDialog.getByLabel("Tags").fill("playwright, revised");
  await editDialog.getByRole("button", { name: "Save changes" }).click();

  const updatedTrackCard = page
    .getByText(updatedTitle, { exact: true })
    .locator(
      "xpath=ancestor::div[contains(@class, 'rounded-3xl')][.//button[normalize-space()='Delete']][1]",
    )
    .first();
  await expect(updatedTrackCard).toBeVisible({ timeout: 20_000 });
  await updatedTrackCard.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete track" }).click();

  await expect(page.getByText(updatedTitle, { exact: true })).toHaveCount(0, { timeout: 20_000 });
});
