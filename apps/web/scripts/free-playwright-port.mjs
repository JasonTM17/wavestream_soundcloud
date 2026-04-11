import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.env.PLAYWRIGHT_PORT ?? "3101";
const protectedPids = new Set([String(process.pid), String(process.ppid)]);

function run(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function killPids(pids) {
  for (const pid of pids) {
    if (!pid || protectedPids.has(String(pid))) {
      continue;
    }

    if (process.platform === "win32") {
      run(`taskkill /PID ${pid} /T /F`);
    } else {
      run(`kill -9 ${pid}`);
    }
  }
}

function killLingeringAppProcesses() {
  if (process.platform === "win32") {
    const output = run(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'node.exe\' -and $_.CommandLine -match \'next build|next dev --hostname 127\\\\.0\\\\.0\\\\.1 --port 3101|next start --hostname 127\\\\.0\\\\.0\\\\.1 --port 3101|\\\\.next/standalone/apps/web/server\\\\.js|node server\\\\.js|@playwright\\\\\\\\test\\\\\\\\cli\\\\.js\' } | Select-Object -ExpandProperty ProcessId"',
    );
    killPids(output.split(/\r?\n/).filter(Boolean));
    return;
  }

  const output = run(
    "ps -ax -o pid= -o command= | grep -E 'next build|next dev --hostname 127.0.0.1 --port 3101|next start --hostname 127.0.0.1 --port 3101|\\.next/standalone/apps/web/server\\.js|node server\\.js|@playwright/test/cli\\.js' | grep -v grep",
  );
  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/, 2)[0] ?? "")
    .filter(Boolean);
  killPids(pids);
}

function removeNextArtifacts() {
  const nextPath = path.resolve(process.cwd(), ".next");

  try {
    fs.rmSync(nextPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures here; the build step will surface a real problem if one remains.
  }
}

killLingeringAppProcesses();

if (process.platform === "win32") {
  const output = run(`netstat -ano -p tcp | findstr :${port}`);
  const pids = Array.from(
    new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => /\bLISTENING\b/i.test(line))
        .map((line) => line.split(/\s+/).at(-1) ?? ""),
    ),
  );

  killPids(pids);
} else {
  const output = run(`lsof -ti tcp:${port}`);
  const pids = output.split(/\s+/).filter(Boolean);
  killPids(pids);
}

removeNextArtifacts();

await new Promise((resolve) => {
  setTimeout(resolve, 1_000);
});
