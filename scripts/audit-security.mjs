import { spawnSync } from "node:child_process";

const ignoredAdvisories = new Set(["GHSA-w5hq-g745-h8pq"]);

const audit = spawnSync(
  "pnpm",
  ["audit", "--audit-level", "moderate", "--json"],
  {
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);

const output = audit.stdout.trim();

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
const actionable = advisories.filter((advisory) => {
  const advisoryIds = [
    advisory.github_advisory_id,
    ...(Array.isArray(advisory.cves) ? advisory.cves : []),
  ].filter(Boolean);

  return !advisoryIds.some((id) => ignoredAdvisories.has(id));
});

if (actionable.length > 0) {
  process.stderr.write(
    `Security audit failed with ${actionable.length} actionable advisory/advisories.\n`,
  );

  for (const advisory of actionable) {
    const id = advisory.github_advisory_id ?? advisory.id ?? "unknown";
    process.stderr.write(
      `- ${id} ${advisory.severity ?? "unknown"} ${advisory.module_name}: ${advisory.title}\n`,
    );
  }

  process.exit(1);
}

if (audit.status !== 0 && advisories.length > 0) {
  process.stdout.write(
    `Security audit passed with ${advisories.length} documented exception(s): ${[
      ...ignoredAdvisories,
    ].join(", ")}.\n`,
  );
  process.exit(0);
}

if (audit.status !== 0) {
  process.stderr.write(audit.stderr || "pnpm audit failed.\n");
  process.exit(audit.status ?? 1);
}

process.stdout.write("Security audit passed with no moderate-or-higher advisories.\n");
