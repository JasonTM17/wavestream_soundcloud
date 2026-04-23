import { defineConfig, devices } from "@playwright/test";

const PORT = 3101;
const baseURL = `http://localhost:${PORT}`;
const cwd = __dirname;
const standaloneCwd = `${cwd}/.next/standalone/apps/web`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  workers: 1,
  use: {
    baseURL,
    trace: 'on-first-retry',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [{ name: 'wavestream_locale', value: 'en' }],
        },
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: "node server.js",
    cwd: standaloneCwd,
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: String(PORT),
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    },
    timeout: 120_000,
    url: baseURL,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
