/**
 * Publishes a slim per-city enrichment artifact for the static site's data-backed routes
 * (country / rankings / compare). The full connectivity + environment enrichment lives in
 * src/data/generated/command-center/city-{connectivity,environment}-enrichment.json (keyed by
 * cityId, metrics under urbanIntel[]) but is only merged server-side today and never shipped to
 * public/. This extracts the few headline indicators into one small client-fetchable index.
 *
 * RUN: npx tsx scripts/data/cities/build-enrichment-slim.ts
 * OUT: public/data/command-center/enrichment.json  ({ [cityId]: { fixedMbps?, mobileMbps?, pm25? } })
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "data", "generated", "command-center");
const OUT_DIR = path.join(process.cwd(), "public", "data", "command-center");

type Metric = { indicatorId: string; value: number | null };
type CityEntry = { urbanIntel?: Metric[] };
type Enrichment = { cities?: Record<string, CityEntry> };

function read(file: string): Enrichment {
  const p = path.join(GEN, file);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8")) as Enrichment;
}

function indicator(entry: CityEntry | undefined, id: string): number | null {
  const m = entry?.urbanIntel?.find((x) => x.indicatorId === id);
  return m && typeof m.value === "number" ? m.value : null;
}

function main() {
  const conn = read("city-connectivity-enrichment.json").cities ?? {};
  const env = read("city-environment-enrichment.json").cities ?? {};
  const ids = new Set([...Object.keys(conn), ...Object.keys(env)]);

  const slim: Record<string, { fixedMbps?: number; mobileMbps?: number; pm25?: number }> = {};
  for (const id of ids) {
    const rec: { fixedMbps?: number; mobileMbps?: number; pm25?: number } = {};
    const fixed = indicator(conn[id], "fixed-download-mbps");
    const mobile = indicator(conn[id], "mobile-download-mbps");
    const pm25 = indicator(env[id], "pm25");
    if (fixed != null) rec.fixedMbps = fixed;
    if (mobile != null) rec.mobileMbps = mobile;
    if (pm25 != null) rec.pm25 = pm25;
    if (Object.keys(rec).length > 0) slim[id] = rec;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, "enrichment.json");
  fs.writeFileSync(out, JSON.stringify(slim));
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(
    `Wrote ${path.relative(process.cwd(), out)}: ${Object.keys(slim).length} cities (${kb} KB) ` +
      `[connectivity=${Object.keys(conn).length}, environment=${Object.keys(env).length}]`,
  );
}

main();
