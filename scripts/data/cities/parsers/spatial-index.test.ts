// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildSpatialGrid, queryRadius, haversineKm } from "./spatial-index";

type P = { id: string; lat: number; lon: number };

const getLatLon = (p: P) => ({ lat: p.lat, lon: p.lon });

describe("spatial grid index", () => {
  it("returns nearby points and prunes far ones", () => {
    const pts: P[] = [
      { id: "near", lat: 41.0, lon: 29.0 },
      { id: "alsoNear", lat: 41.2, lon: 29.1 },
      { id: "far", lat: -33.0, lon: 151.0 },
    ];
    const grid = buildSpatialGrid(pts, getLatLon, 1);
    const got = queryRadius(grid, 41.0, 29.0, 50).map((p) => p.id);
    expect(got).toContain("near");
    expect(got).toContain("alsoNear");
    expect(got).not.toContain("far");
  });

  it("never misses an in-radius point (superset of brute-force), across a global lattice", () => {
    const pts: P[] = [];
    let i = 0;
    for (let lat = -70; lat <= 70; lat += 5) {
      for (let lon = -175; lon <= 175; lon += 5) {
        if (lat === 0 && lon === 0) continue; // index treats (0,0) as a null-island placeholder
        pts.push({ id: `p${i++}`, lat, lon });
      }
    }
    const grid = buildSpatialGrid(pts, getLatLon, 1);

    // Query points include a high-latitude case where longitude lines converge.
    const queries = [
      { lat: 0, lon: 0, r: 300 },
      { lat: 41, lon: 29, r: 250 },
      { lat: 64, lon: -21, r: 400 }, // high latitude
      { lat: -34, lon: 151, r: 300 },
    ];

    for (const q of queries) {
      const truth = new Set(
        pts.filter((p) => haversineKm(q.lat, q.lon, p.lat, p.lon) <= q.r).map((p) => p.id),
      );
      const candidates = new Set(queryRadius(grid, q.lat, q.lon, q.r).map((p) => p.id));
      // Every true in-radius point must appear in the candidate set (no misses).
      for (const id of truth) {
        expect(candidates.has(id), `missed ${id} for query ${JSON.stringify(q)}`).toBe(true);
      }
    }
  });

  it("ignores null-island (0,0) placeholder coordinates", () => {
    const grid = buildSpatialGrid(
      [
        { id: "real", lat: 0.1, lon: 0.1 },
        { id: "placeholder", lat: 0, lon: 0 },
      ],
      getLatLon,
      1,
    );
    const got = queryRadius(grid, 0, 0, 100).map((p) => p.id);
    expect(got).toContain("real");
    expect(got).not.toContain("placeholder");
  });
});
