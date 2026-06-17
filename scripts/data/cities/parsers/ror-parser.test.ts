// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseRorCsv } from "./ror-parser";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("parseRorCsv", () => {
  it("reads the shipped flattened ROR columns into normalized research entities", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-ror-"));
    tempDirs.push(rootDir);

    const csvFile = path.join(rootDir, "ror.csv");
    await fs.writeFile(
      csvFile,
      [
        "id,locations.geonames_details.country_code,locations.geonames_details.country_name,locations.geonames_details.country_subdivision_name,locations.geonames_details.lat,locations.geonames_details.lng,locations.geonames_details.name,names.types.acronym,names.types.alias,names.types.ror_display,types",
        'https://ror.org/05example1,TR,Turkey,Istanbul,41.0082,28.9784,Istanbul,"[""BRC""]","[""en: Bosphorus Research Center""]",Bosphorus Research Center,education; funder',
      ].join("\n"),
    );

    const entities = await parseRorCsv(csvFile);

    expect(entities.length).toBeGreaterThan(0);
    expect(entities[0]?.countryIso2).toBe("TR");
    expect(entities[0]?.countryName).toBe("Turkey");
    expect(entities[0]?.city).toBe("Istanbul");
    expect(entities[0]?.latitude).toBe(41.0082);
    expect(entities[0]?.entitySubtype).toBe("university");
    expect(entities[0]?.aliases).toEqual(["Bosphorus Research Center", "BRC"]);
    expect(entities[0]?.types).toEqual(["education", "funder"]);
  });
});
