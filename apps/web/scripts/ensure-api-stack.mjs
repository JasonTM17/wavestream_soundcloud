import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const healthUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/health`;
const waitTimeoutMs = 180_000;
const pollIntervalMs = 3_000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isHealthy() {
  try {
    const response = await fetch(healthUrl, {
      headers: {
        accept: "application/json",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApiHealth() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < waitTimeoutMs) {
    if (await isHealthy()) {
      return true;
    }

    await sleep(pollIntervalMs);
  }

  return false;
}

async function main() {
  if (await isHealthy()) {
    console.log(`[wavestream:e2e] API already healthy at ${healthUrl}`);
    return;
  }

  console.log("[wavestream:e2e] Starting Docker API stack for Playwright...");

  const composeUp = spawnSync(
    process.platform === "win32" ? "docker.exe" : "docker",
    [
      "compose",
      "up",
      "-d",
      "postgres",
      "redis",
      "minio",
      "minio-init",
      "mailpit",
      "api-migrate",
      "api-seed",
      "api",
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  if (composeUp.status !== 0) {
    process.exitCode = composeUp.status ?? 1;
    return;
  }

  if (!(await waitForApiHealth())) {
    console.error(`[wavestream:e2e] API did not become healthy within ${waitTimeoutMs}ms.`);
    process.exitCode = 1;
    return;
  }

  console.log(`[wavestream:e2e] API is healthy at ${healthUrl}`);
}

await main();
