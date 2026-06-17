// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseUnlocodeCsv } from "./unlocode-parser";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("parseUnlocodeCsv", () => {
  it("parses the shipped headerless UN/LOCODE csv format with latin1 names intact", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-unlocode-"));
    tempDirs.push(rootDir);

    const csvFile = path.join(rootDir, "unlocode.csv");
    await fs.writeFile(
      csvFile,
      Buffer.from(
        [
          ',\"AD\",,\".ANDORRA\",,,,,,,,',
          ',\"AD\",\"EAC\",\"Escàs\",\"Escas\",\"04\",\"--3-----\",\"RL\",\"1407\",,\"4233N 00131E\",\"\"',
          ',\"NL\",,\".NETHERLANDS\",,,,,,,,',
          ',\"NL\",\"RTM\",\"Rotterdam\",\"Rotterdam\",,\"1-------\",\"AI\",\"2601\",,\"5155N 00429E\",\"\"',
          ',\"TR\",,\".TURKEY\",,,,,,,,',
          ',\"TR\",\"IST\",\"Istanbul\",\"Istanbul\",,\"12-4----\",\"AI\",\"2601\",,\"4101N 02858E\",\"\"',
          ',\"TR\",\"AIR\",\"Airfield City\",\"Airfield City\",,\"---4----\",\"AI\",\"2601\",,\"4030N 03000E\",\"\"',
        ].join("\r\n"),
        "latin1",
      ),
    );

    const entities = await parseUnlocodeCsv(csvFile);

    expect(entities.length).toBeGreaterThan(0);
    // Istanbul "12-4----" => port(1) + rail(2) + airport(4)
    expect(entities.filter((entity) => entity.unlocode === "TRIST").map((entity) => entity.entityType).sort()).toEqual([
      "airport",
      "port",
      "rail_hub",
    ]);
    // Position 0 == '1' is a PORT (not an airport). This fails if port/airport are swapped.
    expect(entities.filter((entity) => entity.unlocode === "NLRTM").map((entity) => entity.entityType)).toEqual([
      "port",
    ]);
    // Position 3 == '4' is an AIRPORT (not a port). This fails if port/airport are swapped.
    expect(entities.filter((entity) => entity.unlocode === "TRAIR").map((entity) => entity.entityType)).toEqual([
      "airport",
    ]);
    expect(entities.find((entity) => entity.unlocode === "ADEAC")).toMatchObject({
      entityType: "logistics_hub",
      countryIso2: "AD",
      name: "Escàs",
    });
  });
});
