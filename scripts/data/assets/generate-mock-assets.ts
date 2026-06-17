/**
 * DEV-ONLY mock asset generator.
 *
 * P0.2 (no-fabrication non-negotiable): this script used to write hand-typed placeholder assets
 * (incl. a fake NYC "data center" and an Istanbul "5G cluster" stamped `ookla`) DIRECTLY into the
 * real output dir `data/processed/assets/`, resetting the manifest and clobbering the output of the
 * real extractors. That is destructive and ships fabrication to the UI.
 *
 * It is now:
 *   1. A no-op unless ALLOW_MOCK_ASSETS=1 is set (so it can never run by accident in the pipeline).
 *   2. Non-destructive: even when enabled it writes to a clearly-separate sandbox dir
 *      (data/processed/assets-dev-mock/) that is NOT published to public/ and NOT read by the app.
 *
 * Mock fixtures here are for local UI smoke-testing only and must never be promoted to public/.
 */
import fs from "fs";
import path from "path";
import { AssetRecord } from "../../../src/domain/types";

const SANDBOX_DIR = "data/processed/assets-dev-mock";
const MANIFEST_PATH = path.join(SANDBOX_DIR, "manifest.json");

const mockAssets: AssetRecord[] = [
  {
    assetId: "pwr-tur-001",
    name: "Ataturk Dam",
    category: "energy",
    subtype: "hydro_plant",
    countryIso3: "TUR",
    admin1: "Sanliurfa",
    latitude: 37.598,
    longitude: 38.514,
    status: "active",
    capacity: 2400,
    capacityUnit: "MW",
    priority: "critical",
    sourceIds: ["manual-registry"],
    confidence: 1.0,
    freshness: "fresh",
    coverageState: "verified_exact",
  },
];

function generateMockAssets(): void {
  if (process.env.ALLOW_MOCK_ASSETS !== "1") {
    console.log(
      "[generate-mock-assets] Skipped. This is a DEV-ONLY fixture generator. " +
        "Set ALLOW_MOCK_ASSETS=1 to write fixtures to the sandbox dir (never published).",
    );
    return;
  }

  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }

  const manifest: Record<string, unknown> = {};
  const turAssets = mockAssets.filter((a) => a.countryIso3 === "TUR");
  fs.writeFileSync(path.join(SANDBOX_DIR, "tur.json"), JSON.stringify(turAssets, null, 2));
  manifest["TUR"] = {
    countryIso3: "TUR",
    categoryCounts: { energy: turAssets.length },
    totalAssets: turAssets.length,
    completenessScore: 0.0,
    lastUpdatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`[generate-mock-assets] Wrote dev fixtures to ${SANDBOX_DIR} (NOT published).`);
}

generateMockAssets();
