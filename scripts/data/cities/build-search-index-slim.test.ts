import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(
    workspaces.splice(0).map((workspace) =>
      fs.rm(workspace, { force: true, recursive: true }),
    ),
  );
});

describe("build-search-index-slim", () => {
  it("publishes canonical cities and excludes subordinate places from city search", async () => {
    const repositoryRoot = process.cwd();
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-search-slim-"));
    workspaces.push(workspace);

    const sourceDir = path.join(workspace, "src", "data", "generated", "cities");
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, "search-index.json"),
      JSON.stringify([
        {
          cityId: "geo-1",
          slug: "geo-1-kecioren",
          name: "Keçiören",
          aliases: ["Kecioren"],
          countryIso3: "TUR",
          population: 939_279,
          isMajorCity: false,
          placeClass: "subordinate_place",
          featureCode: "PPLX",
        },
        {
          cityId: "geo-2",
          slug: "geo-2-bursa",
          name: "Bursa",
          aliases: [],
          countryIso3: "TUR",
          population: 3_101_833,
          isMajorCity: true,
          placeClass: "city",
          featureCode: "PPLA",
        },
        {
          cityId: "geo-3",
          slug: "geo-3-small-city",
          name: "Small City",
          aliases: [],
          countryIso3: "TUR",
          population: 12_000,
          isMajorCity: false,
          placeClass: "city",
          featureCode: "PPL",
        },
      ]),
    );

    const tsxCli = path.join(
      repositoryRoot,
      "node_modules",
      "tsx",
      "dist",
      "cli.mjs",
    );
    execFileSync(
      process.execPath,
      [
        tsxCli,
        path.join(repositoryRoot, "scripts", "data", "cities", "build-search-index-slim.ts"),
      ],
      { cwd: workspace, stdio: "pipe" },
    );

    const published = JSON.parse(
      await fs.readFile(
        path.join(workspace, "public", "data", "cities", "search-index.json"),
        "utf8",
      ),
    );
    expect(published).toEqual([
      expect.objectContaining({
        cityId: "geo-2",
        placeClass: "city",
        featureCode: "PPLA",
      }),
      expect.objectContaining({
        cityId: "geo-3",
        placeClass: "city",
        featureCode: "PPL",
      }),
    ]);
  });
});
