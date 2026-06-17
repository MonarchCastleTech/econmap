// @vitest-environment node
// Node env so the browser-standard gunzip path (Blob.stream → DecompressionStream → Response) used by
// dossier-bundle-client interoperates with Node's web-streams; jsdom's Response can't consume them.
// These are pure data-loader tests with no DOM dependency.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadCommandCenterCityPanelClient,
  loadCommandCenterManifestClient,
} from "@/lib/command-center-client";
import { findCityBySlug } from "@/lib/city-data-client";

const source = {
  id: "geonames",
  name: "GeoNames",
  updatedAt: "2026-01-01",
  coverage: "global",
  methodology: "registry",
};

const city = {
  cityId: "geo-745044",
  slug: "geo-745044-istanbul",
  name: "Istanbul",
  countryIso3: "TUR",
  countrySlug: "turkey",
  latitude: 41.0,
  longitude: 29.0,
  registrySource: "GeoNames",
  population: 15000000,
  isMajorCity: true,
};

const workspace = {
  city,
  summary: "Largest city in Turkiye.",
  roleTags: ["port city"],
  coverage: {
    economicFactbook: "verified_exact",
    investorIntel: "not_covered_yet",
    urbanIntel: "not_covered_yet",
  },
  economicFactbook: [
    { indicatorId: "population", value: 15000000, unit: "people", status: "actual", source },
  ],
  investorIntel: [],
  urbanIntel: [],
  entityCounts: { airport: 2 },
  entityHighlights: [],
  mapLayerSummary: { availableLayers: ["airports"] },
  sources: [source],
};

const sourcesBundle = { cityId: "geo-745044", sources: [source] };
const coverageShell = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  cityId: "geo-745044",
  boundaryStatus: "point_only",
  sourceCount: 1,
  mappedCategoryCount: 1,
  documentedCategoryCount: 0,
  missingCategoryCount: 0,
  categories: [
    { id: "airports", label: "Airports", state: "mapped", count: 2, detail: "2 airports", sourceLabels: ["OurAirports"] },
  ],
};
const entitiesBundle = { cityId: "geo-745044", entities: [], sources: [source] };

const realManifest = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "data", "command-center", "manifest.json"), "utf-8"),
);

// The 4 per-city files now come from one Range-addressable gzip bundle (dossier-bundle-client.ts):
// mock the index + a single-blob shard so loadDossier resolves {w,e,s,c} for istanbul-tr.
const dossierBlob = zlib.gzipSync(
  Buffer.from(JSON.stringify({ w: workspace, e: entitiesBundle, s: sourcesBundle, c: coverageShell })),
);
const dossierIndex = {
  format: "gzip-json-v1",
  shardCount: 1,
  shards: [{ file: "shard-0.dossierbin", bytes: dossierBlob.length }],
  entries: { "geo-745044": [0, 0, dossierBlob.length] },
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}
function notFound(): Response {
  return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
}
function rangeResponse(buf: Buffer): Response {
  return {
    ok: true,
    status: 206,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  } as unknown as Response;
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/data/cities/registry.json") return jsonResponse([city]);
      if (url === "/data/cities/dossiers/index.json") return jsonResponse(dossierIndex);
      if (url === "/data/cities/dossiers/shard-0.dossierbin") return rangeResponse(dossierBlob);
      if (url === "/data/command-center/manifest.json") return jsonResponse(realManifest);
      return notFound();
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("P0.3 city dossier static-export path", () => {
  it("resolves a known city by slug from the published registry (no 'City not found')", async () => {
    const found = await findCityBySlug("geo-745044-istanbul");
    expect(found).not.toBeNull();
    expect(found?.cityId).toBe("geo-745044");
  });

  it("returns null for an unknown slug", async () => {
    expect(await findCityBySlug("atlantis")).toBeNull();
  });

  it("assembles a full city panel (workspace + sources + coverage) end-to-end", async () => {
    const panel = await loadCommandCenterCityPanelClient({ slug: "geo-745044-istanbul" });
    expect(panel).not.toBeNull();
    expect(panel?.city.cityId).toBe("geo-745044");
    expect(panel?.workspace).not.toBeNull();
    expect(panel?.sources?.sources?.[0]?.name).toBe("GeoNames");
    expect(panel?.coverageShell?.categories[0]?.state).toBe("mapped");
  });

  it("keeps the workspace rich (real economicFactbook preserved, intel arrays defaulted — not hollow)", async () => {
    const panel = await loadCommandCenterCityPanelClient({ slug: "geo-745044-istanbul" });
    expect(panel?.workspace?.economicFactbook).toHaveLength(1);
    expect(panel?.workspace?.entityCounts).toEqual({ airport: 2 });
    // command-center extensions default to [] rather than being dropped/undefined
    expect(panel?.workspace?.economicIntel).toEqual([]);
    expect(panel?.workspace?.sourceCoverageSummary).toEqual([]);
  });

  it("loads and validates the REAL command-center manifest from the correct path", async () => {
    const manifest = await loadCommandCenterManifestClient();
    expect(manifest).not.toBeNull();
    expect(Array.isArray(manifest?.datasetInventory)).toBe(true);
    expect(typeof manifest?.defaultViewId).toBe("string");
  });
});
