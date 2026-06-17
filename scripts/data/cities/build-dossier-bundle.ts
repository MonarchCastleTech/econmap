import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

/**
 * Pack the ~351K per-city dossier files (workspaces/entities/sources/coverage, 4 per city) into a few
 * Range-addressable, gzip-compressed shard files + a small offset index. The browser then fetches a
 * single byte-range per opened city (~1.5 KB) instead of 4 files, and the static export ships ~4 files
 * instead of 351K. GitHub Pages (Fastly) serves HTTP Range; shards are kept < 94 MB to stay under the
 * 100 MB git hard limit. NO data is altered — the 4 source objects are stored verbatim under {w,e,s,c}
 * (missing inputs become explicit null), so every source label / provenance field is preserved.
 *
 * Output: public/data/cities/dossiers/{index.json, shard-<i>.dossierbin, trim-manifest.json}
 * Run: npx tsx scripts/data/cities/build-dossier-bundle.ts
 */
const SRC = path.join(process.cwd(), "src", "data", "generated", "cities");
const OUT_DIR = path.join(process.cwd(), "public", "data", "cities", "dossiers");
const SHARD_COUNT = 4; // ~129MB gzip total / 4 ≈ ~32MB/shard, well under the 94MB ceiling
const SHARD_CEILING = 94 * 1024 * 1024;

function readJsonOrNull(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function main() {
  const wsDir = path.join(SRC, "workspaces");
  const ids = fs.readdirSync(wsDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  console.log(`Packing ${ids.length} city dossiers into ${SHARD_COUNT} shards...`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const shardChunks: Buffer[][] = Array.from({ length: SHARD_COUNT }, () => []);
  const shardOffsets = new Array<number>(SHARD_COUNT).fill(0);
  const entries: Record<string, [number, number, number]> = {}; // cityId -> [shard, offset, length]

  let missingEntities = 0;
  let missingSources = 0;
  let missingCoverage = 0;
  let rawBytes = 0;
  let packedBytes = 0;
  let maxRaw = 0;
  let maxRawId = "";

  for (const cityId of ids) {
    const w = readJsonOrNull(path.join(wsDir, `${cityId}.json`));
    if (w === null) continue; // workspace is required to be a valid dossier
    const e = readJsonOrNull(path.join(SRC, "entities", `${cityId}.json`));
    const s = readJsonOrNull(path.join(SRC, "sources", `${cityId}.json`));
    const c = readJsonOrNull(path.join(SRC, "coverage", `${cityId}.json`));
    if (e === null) missingEntities += 1;
    if (s === null) missingSources += 1;
    if (c === null) missingCoverage += 1;

    const raw = Buffer.from(JSON.stringify({ w, e, s, c }));
    rawBytes += raw.length;
    if (raw.length > maxRaw) {
      maxRaw = raw.length;
      maxRawId = cityId;
    }
    const blob = zlib.gzipSync(raw, { level: 9 });
    packedBytes += blob.length;

    const shard = parseInt(crypto.createHash("sha1").update(cityId).digest("hex").slice(0, 4), 16) % SHARD_COUNT;
    entries[cityId] = [shard, shardOffsets[shard], blob.length];
    shardChunks[shard].push(blob);
    shardOffsets[shard] += blob.length;
  }

  const shards: Array<{ file: string; bytes: number }> = [];
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const buf = Buffer.concat(shardChunks[i]);
    if (buf.length > SHARD_CEILING) {
      throw new Error(`shard-${i} is ${(buf.length / 1048576).toFixed(1)}MB > 94MB ceiling — raise SHARD_COUNT.`);
    }
    const file = `shard-${i}.dossierbin`;
    fs.writeFileSync(path.join(OUT_DIR, file), buf);
    shards.push({ file, bytes: buf.length });
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify({ format: "gzip-json-v1", shardCount: SHARD_COUNT, shards, entries }),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "trim-manifest.json"),
    JSON.stringify(
      {
        generatedFrom: "src/data/generated/cities/{workspaces,entities,sources,coverage}",
        cities: Object.keys(entries).length,
        missingEntities,
        missingSources,
        missingCoverage,
        largestRawCityId: maxRawId,
        largestRawBytes: maxRaw,
        rawBytes,
        packedBytes,
        shards,
      },
      null,
      2,
    ),
  );

  console.log(
    `Done: ${Object.keys(entries).length} dossiers, raw ${(rawBytes / 1048576).toFixed(0)}MB -> packed ${(packedBytes / 1048576).toFixed(0)}MB across ${SHARD_COUNT} shards (max raw dossier ${(maxRaw / 1024).toFixed(0)}KB @ ${maxRawId}). missing e/s/c: ${missingEntities}/${missingSources}/${missingCoverage}.`,
  );
}

main();
