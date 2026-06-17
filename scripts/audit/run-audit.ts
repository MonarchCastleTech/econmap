import fs from "node:fs";
import path from "node:path";

import { ALL_CHECKS, type CheckResult } from "./checks";

/**
 * `npm run audit:data` — runs every data-integrity check, writes a dated machine-readable report to
 * docs/audits/, prints a human summary, and exits non-zero if any check FAILS (so it can gate CI).
 * Warnings do not fail the run.
 */
function main() {
  const results: CheckResult[] = ALL_CHECKS.map((check) => {
    try {
      return check();
    } catch (err) {
      return {
        id: check.name,
        title: check.name,
        status: "fail" as const,
        failures: [`threw: ${(err as Error).message}`],
        warnings: [],
        metrics: {},
      };
    }
  });

  const failed = results.filter((r) => r.status === "fail");
  const warned = results.filter((r) => r.status === "warn");

  const stamp = new Date().toISOString().slice(0, 10);
  const reportDir = path.join(process.cwd(), "docs", "audits");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${stamp}-data-audit.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), overall: failed.length ? "fail" : warned.length ? "warn" : "pass", results },
      null,
      2,
    ),
  );

  const icon = (s: string) => (s === "pass" ? "PASS" : s === "warn" ? "WARN" : "FAIL");
  console.log("\n=== EconMap data audit ===");
  for (const r of results) {
    console.log(`[${icon(r.status)}] ${r.title}  ${JSON.stringify(r.metrics)}`);
    for (const f of r.failures) console.log(`        x ${f}`);
    for (const w of r.warnings) console.log(`        ! ${w}`);
  }
  console.log(`\nReport: ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Overall: ${failed.length ? "FAIL" : warned.length ? "WARN" : "PASS"} (${results.length - failed.length - warned.length} pass, ${warned.length} warn, ${failed.length} fail)\n`);

  process.exit(failed.length ? 1 : 0);
}

main();
