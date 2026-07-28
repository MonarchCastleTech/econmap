// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveEntities } from "./resolve-entities";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("resolveEntities", () => {
  it("resolves canonical cities without warning about subordinate fact files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-resolve-"));
    tempDirs.push(root);
    const registryFile = path.join(root, "registry.json");
    const factsDir = path.join(root, "facts");
    const resolvedDir = path.join(root, "resolved");
    await fs.mkdir(factsDir, { recursive: true });
    await fs.writeFile(
      registryFile,
      JSON.stringify([
        {
          cityId: "geo-city",
          placeClass: "city",
          slug: "city",
          name: "City",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkiye",
          latitude: 1,
          longitude: 2,
        },
        {
          cityId: "geo-district",
          placeClass: "subordinate_place",
          slug: "district",
          name: "District",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkiye",
          latitude: 1,
          longitude: 2,
        },
        {
          cityId: "geo-city-without-entities",
          placeClass: "city",
          slug: "city-without-entities",
          name: "City Without Entities",
          countryIso2: "TR",
          countryIso3: "TUR",
          countrySlug: "turkiye",
          latitude: 3,
          longitude: 4,
        },
      ]),
    );
    await fs.writeFile(
      path.join(factsDir, "geo-city.json"),
      JSON.stringify({
        cityId: "geo-city",
        fetchedAt: "2026-07-27",
        economic: { gdp: null, population: 1000 },
        entities: [],
        sources: ["GeoNames"],
      }),
    );
    const logger = { log: vi.fn(), warn: vi.fn() };

    await resolveEntities({
      registryFile,
      factsDir,
      resolvedDir,
      forceRebuild: true,
      logger,
    });

    expect(await fs.readdir(resolvedDir)).toEqual(["geo-city.json"]);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      "Entity resolution completed: 1 cities resolved, 0 skipped (already cached), 1 without entity facts.",
    );
  });
});
