/**
 * Globe vector layers → a single PMTiles archive (Task #23).
 *
 * WHY: the served globe geojson is the largest data category (out/data/globe ≈ 351 MB). The 2D map
 * (tactical-map-2d.tsx) renders each operational layer as a maplibre `geojson` source, fetching whole
 * region shards. Packing every layer into one range-addressable `layers.pmtiles` lets maplibre fetch
 * only the visible tiles, and tippecanoe thins dense points at low zoom — cutting the deploy by
 * hundreds of MB while keeping every point available when zoomed in.
 *
 * The `cities` layer is intentionally EXCLUDED: tactical-map-2d never fetches cities/shards (the map's
 * city points come from reference/city-footprints/selectable.geojson). Its layer geojson is dead weight
 * pruned at deploy time by scripts/deploy/assemble-pages.ts — converting it would produce an unused
 * tile layer.
 *
 * TOOLCHAIN: Felt's tippecanoe (writes .pmtiles natively) built into a local Docker image — see
 * scripts/tools/tippecanoe/Dockerfile. Build once:  docker build -t econmap/tippecanoe scripts/tools/tippecanoe
 *
 * RUN:  npx tsx scripts/data/globe/generate-pmtiles.ts
 * OUTPUT: public/data/globe/layers.pmtiles  (+ manifest.json gets pmtilesPath + per-layer sourceLayer)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DOCKER_IMAGE = "econmap/tippecanoe";
const REPO_ROOT = process.cwd();
const GLOBE_DIR = path.join(REPO_ROOT, "public", "data", "globe");
const MANIFEST_PATH = path.join(GLOBE_DIR, "manifest.json");
const PMTILES_REL = "/data/globe/layers.pmtiles";
const OUTPUT_HOST = path.join(GLOBE_DIR, "layers.pmtiles");
const EXCLUDED_LAYER_IDS = new Set(["cities"]);

type ManifestLayer = {
  id: string;
  assetPath: string;
  bootAssetPath?: string;
  sourceLayer?: string;
  [key: string]: unknown;
};
type Manifest = { generatedAt: string; layers: ManifestLayer[]; pmtilesPath?: string; [key: string]: unknown };

/** The authoritative full feature set for a layer: shards/world.geojson (sharded) else vectors/current.geojson. */
function resolveLayerInput(layerId: string): string | null {
  const layerDir = path.join(GLOBE_DIR, "layers", layerId);
  const candidates = [
    path.join(layerDir, "shards", "world.geojson"),
    path.join(layerDir, "vectors", "current.geojson"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/** Host absolute path → the path inside the container (GLOBE_DIR is bind-mounted at /work). */
function toContainerPath(hostPath: string): string {
  const rel = path.relative(GLOBE_DIR, hostPath).split(path.sep).join("/");
  return `/work/${rel}`;
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as Manifest;

  const tilableLayers = manifest.layers.filter((l) => !EXCLUDED_LAYER_IDS.has(l.id));
  const namedInputs: string[] = [];
  for (const layer of tilableLayers) {
    const input = resolveLayerInput(layer.id);
    if (!input) {
      console.error(`  ! no source geojson for layer "${layer.id}" — aborting (would silently drop a layer)`);
      process.exit(1);
    }
    const sizeMb = (fs.statSync(input).size / 1048576).toFixed(1);
    console.log(`  + ${layer.id.padEnd(22)} ${path.relative(GLOBE_DIR, input)} (${sizeMb} MB)`);
    // tippecanoe shorthand: -L <layername>:<file> reads file into a named vector layer.
    namedInputs.push("-L", `${layer.id}:${toContainerPath(input)}`);
  }
  console.log(`\nTiling ${tilableLayers.length} layers → ${PMTILES_REL} (cities excluded — never fetched)\n`);

  // -Z0..-zg: min zoom 0, guess a max zoom from point density.
  // --drop-densest-as-needed: thin dense points at low zoom to keep tiles small (the shrink).
  // --extend-zooms-if-still-dropping: push max zoom until NO points are dropped at the top — so every
  //   point is present when fully zoomed in (the map caps at zoom 10).
  const tippecanoeArgs = [
    "-o", "/work/layers.pmtiles",
    "--force",
    "-Z0", "-zg",
    "--drop-densest-as-needed",
    "--extend-zooms-if-still-dropping",
    "--name", "econmap-globe-layers",
    "--attribution", "EconMap",
    ...namedInputs,
  ];

  const dockerArgs = [
    "run", "--rm",
    "-v", `${GLOBE_DIR}:/work`,
    DOCKER_IMAGE,
    "tippecanoe",
    ...tippecanoeArgs,
  ];

  console.log(`docker ${dockerArgs.join(" ")}\n`);
  const result = spawnSync("docker", dockerArgs, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\ntippecanoe failed (exit ${result.status}). Is the image built? ` +
      `docker build -t ${DOCKER_IMAGE} scripts/tools/tippecanoe`);
    process.exit(result.status ?? 1);
  }
  if (!fs.existsSync(OUTPUT_HOST)) {
    console.error(`\ntippecanoe reported success but ${OUTPUT_HOST} is missing.`);
    process.exit(1);
  }

  // Wire the manifest: a top-level pmtilesPath + per-layer sourceLayer (= layer id). The client reads a
  // single vector source from pmtilesPath and one source-layer per tiled layer. Excluded layers keep
  // their geojson assetPath untouched.
  manifest.pmtilesPath = PMTILES_REL;
  for (const layer of manifest.layers) {
    if (EXCLUDED_LAYER_IDS.has(layer.id)) continue;
    layer.sourceLayer = layer.id;
  }
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  const outMb = (fs.statSync(OUTPUT_HOST).size / 1048576).toFixed(1);
  console.log(`\n✓ wrote ${PMTILES_REL} (${outMb} MB) and updated manifest.json (pmtilesPath + ${tilableLayers.length} sourceLayers).`);
}

main();
