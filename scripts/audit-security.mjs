import { spawnSync } from "node:child_process";

const auditCommand =
  process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "pnpm";
const auditArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm audit --audit-level moderate --json"]
    : ["audit", "--audit-level", "moderate", "--json"];

const audit = spawnSync(auditCommand, auditArgs, {
  encoding: "utf8",
});

if (audit.error) {
  process.stderr.write(`Unable to run pnpm audit: ${audit.error.message}\n`);
  process.exit(1);
}

const output = audit.stdout?.trim() ?? "";

if (!output) {
  process.stderr.write(audit.stderr || "pnpm audit did not return JSON output.\n");
  process.exit(audit.status ?? 1);
}

let report;

try {
  report = JSON.parse(output);
} catch (error) {
  process.stderr.write("Unable to parse pnpm audit JSON output.\n");
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.stderr.write(audit.stderr || "");
  process.exit(audit.status ?? 1);
}

const advisories = Object.values(report.advisories ?? {});
if (advisories.length > 0) {
  process.stderr.write(
    `Security audit failed with ${advisories.length} moderate-or-higher advisory/advisories.\n`,
  );

  for (const advisory of advisories) {
    const id = advisory.github_advisory_id ?? advisory.id ?? "unknown";
    process.stderr.write(
      `- ${id} ${advisory.severity ?? "unknown"} ${advisory.module_name}: ${advisory.title}\n`,
    );
  }

  process.exit(1);
}

if (audit.status !== 0) {
  process.stderr.write(audit.stderr || "pnpm audit failed.\n");
  process.exit(audit.status ?? 1);
}

process.stdout.write("Security audit passed with no moderate-or-higher advisories.\n");
