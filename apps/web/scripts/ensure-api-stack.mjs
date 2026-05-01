import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const healthUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/health`;
const waitTimeoutMs = 180_000;
const pollIntervalMs = 3_000;
const dockerBin = process.platform === "win32" ? "docker.exe" : "docker";
const apiStackServices = [
  "postgres",
  "redis",
  "minio",
  "minio-init",
  "mailpit",
  "api-migrate",
  "api-seed",
  "api",
];
const imagePullServices = ["postgres", "redis", "minio", "minio-init", "mailpit"];

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

async function dockerComposeWithRetry(args, label) {
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      const delayMs = attempt * 30_000;
      console.log(`[wavestream:e2e] Retrying ${label} in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }

    const result = spawnSync(dockerBin, ["compose", ...args], {
      cwd: repoRoot,
      stdio: "inherit",
    });

    if (result.status === 0) {
      return true;
    }
  }

  return false;
}

async function main() {
  if (await isHealthy()) {
    console.log(`[wavestream:e2e] API already healthy at ${healthUrl}`);
    return;
  }

  console.log("[wavestream:e2e] Starting Docker API stack for Playwright...");

  if (!(await dockerComposeWithRetry(["pull", ...imagePullServices], "Docker image pulls"))) {
    process.exitCode = 1;
    return;
  }

  if (!(await dockerComposeWithRetry(["up", "-d", ...apiStackServices], "Docker API stack"))) {
    process.exitCode = 1;
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
