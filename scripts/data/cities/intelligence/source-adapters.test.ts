import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  INTELLIGENCE_SOURCE_CONTRACTS,
  assessIntelligenceSources,
} from "./source-adapters";

const roots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-intel-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => fs.rm(root, { force: true, recursive: true })),
  );
});

describe("city intelligence source adapters", () => {
  it("catalogs every approved source with evidence and gap contracts", () => {
    expect(INTELLIGENCE_SOURCE_CONTRACTS.map((source) => source.id)).toEqual([
      "ookla-open-data",
      "mlab-ndt",
      "ripe-atlas",
      "fcc-bdc",
      "gsma-coverage",
      "ghsl-urban-centres",
      "openaq",
      "nasa-firms",
      "usgs-earthquakes",
    ]);

    for (const source of INTELLIGENCE_SOURCE_CONTRACTS) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.methodology.length).toBeGreaterThan(20);
      expect(source.gapReason.length).toBeGreaterThan(20);
    }
  });

  it("marks a local normalized snapshot available", async () => {
    const root = await makeRoot();
    const snapshot = path.join(
      root,
      "data/raw/cities/intelligence/usgs-earthquakes.json",
    );
    await fs.mkdir(path.dirname(snapshot), { recursive: true });
    await fs.writeFile(snapshot, '{"observations":[]}', "utf8");

    const statuses = await assessIntelligenceSources({
      rootDir: root,
      env: {},
      checkedAt: "2026-07-28T00:00:00.000Z",
    });

    expect(
      statuses.find((status) => status.sourceId === "usgs-earthquakes"),
    ).toMatchObject({ status: "available" });
  });

  it("distinguishes licensed, credential-required, and unavailable inputs", async () => {
    const root = await makeRoot();
    const statuses = await assessIntelligenceSources({
      rootDir: root,
      env: {},
      checkedAt: "2026-07-28T00:00:00.000Z",
    });

    expect(statuses.find((status) => status.sourceId === "gsma-coverage"))
      .toMatchObject({ status: "licensed" });
    expect(statuses.find((status) => status.sourceId === "nasa-firms"))
      .toMatchObject({ status: "credential_required" });
    expect(statuses.find((status) => status.sourceId === "ghsl-urban-centres"))
      .toMatchObject({ status: "unavailable" });
  });

  it("recognizes configured API-backed sources without claiming observations", async () => {
    const root = await makeRoot();
    const statuses = await assessIntelligenceSources({
      rootDir: root,
      env: { FIRMS_MAP_KEY: "configured", OPENAQ_API_KEY: "configured" },
      checkedAt: "2026-07-28T00:00:00.000Z",
    });

    expect(statuses.find((status) => status.sourceId === "nasa-firms"))
      .toMatchObject({ status: "not_configured" });
    expect(statuses.find((status) => status.sourceId === "openaq"))
      .toMatchObject({ status: "not_configured" });
  });
});
