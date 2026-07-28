import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  cityAlertFeedSchema,
  cityIntelligenceIndexSchema,
} from "../../../src/domain/city-intelligence-schemas";
import { buildCityIntelligence } from "./build-city-intelligence";

const roots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-build-intel-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => fs.rm(root, { force: true, recursive: true })),
  );
});

describe("build-city-intelligence", () => {
  it("publishes observations, deltas, alerts, contracts, and an immutable snapshot", async () => {
    const root = await makeRoot();
    const rawDir = path.join(root, "data/raw/cities/intelligence");
    await fs.mkdir(rawDir, { recursive: true });
    await fs.writeFile(
      path.join(rawDir, "usgs-earthquakes.json"),
      JSON.stringify({
        sourceId: "usgs-earthquakes",
        generatedAt: "2026-07-28T00:00:00.000Z",
        observations: [
          {
            id: "geo-1:usgs:quake-1",
            cityId: "geo-1",
            topic: "hazard",
            metric: "earthquake",
            state: "observed",
            value: 5.2,
            unit: "magnitude",
            evidenceKind: "measured",
            geographyKind: "radius",
            observedAt: "2026-07-27T23:30:00.000Z",
            sourceId: "usgs-earthquakes",
            sourceUrl: "https://earthquake.usgs.gov/earthquakes/feed/",
            methodology: "USGS event matched within a published city radius.",
            confidence: "high",
          },
        ],
        geographies: [],
      }),
      "utf8",
    );

    const result = await buildCityIntelligence({
      rootDir: root,
      generatedAt: "2026-07-28T00:00:00.000Z",
      env: {},
    });

    expect(result).toMatchObject({
      cityCount: 1,
      observationCount: 1,
      deltaCount: 1,
      alertCount: 1,
    });

    const index = cityIntelligenceIndexSchema.parse(
      JSON.parse(
        await fs.readFile(
          path.join(root, "public/data/cities/intelligence.json"),
          "utf8",
        ),
      ),
    );
    const feed = cityAlertFeedSchema.parse(
      JSON.parse(
        await fs.readFile(
          path.join(root, "public/data/cities/alerts.json"),
          "utf8",
        ),
      ),
    );

    expect(index.cities["geo-1"].observations).toHaveLength(1);
    expect(index.cities["geo-1"].alerts[0].severity).toBe("warning");
    expect(feed.alerts).toHaveLength(1);
    expect(
      await fs.stat(
        path.join(
          root,
          "src/data/generated/city-intelligence/snapshots/2026-07-28.json",
        ),
      ),
    ).toBeTruthy();
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(root, "public/data/cities/source-contracts.json"),
          "utf8",
        ),
      ),
    ).toHaveLength(9);
  });

  it("retains prior history without emitting duplicate changes", async () => {
    const root = await makeRoot();
    const rawDir = path.join(root, "data/raw/cities/intelligence");
    await fs.mkdir(rawDir, { recursive: true });
    await fs.writeFile(
      path.join(rawDir, "usgs-earthquakes.json"),
      JSON.stringify({
        observations: [
          {
            id: "geo-1:usgs:quake-1",
            cityId: "geo-1",
            topic: "hazard",
            metric: "earthquake",
            state: "observed",
            value: 4.3,
            unit: "magnitude",
            evidenceKind: "measured",
            geographyKind: "radius",
            observedAt: "2026-07-27T20:00:00.000Z",
            sourceId: "usgs-earthquakes",
            sourceUrl: "https://earthquake.usgs.gov/earthquakes/feed/",
            methodology: "USGS event matched within a published city radius.",
            confidence: "high",
          },
        ],
      }),
      "utf8",
    );

    await buildCityIntelligence({
      rootDir: root,
      generatedAt: "2026-07-28T00:00:00.000Z",
      env: {},
    });
    const second = await buildCityIntelligence({
      rootDir: root,
      generatedAt: "2026-07-29T00:00:00.000Z",
      env: {},
    });

    expect(second).toMatchObject({ deltaCount: 1, alertCount: 1 });
  });
});
