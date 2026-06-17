// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ingestRegistry } from "./ingest-registry";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("ingestRegistry publishable backbone", () => {
  it("keeps admin seats and population-backed cities while capping aliases", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-ingest-registry-"));
    tempDirs.push(rootDir);

    const bulkDir = path.join(rootDir, "bulk");
    const rawDir = path.join(rootDir, "raw");
    const outDir = path.join(rootDir, "out");

    await fs.mkdir(bulkDir, { recursive: true });
    await fs.mkdir(rawDir, { recursive: true });
    await fs.mkdir(outDir, { recursive: true });

    const countryInfoFile = path.join(bulkDir, "countryInfo.txt");
    const admin1File = path.join(bulkDir, "admin1CodesASCII.txt");
    const admin2File = path.join(bulkDir, "admin2Codes.txt");
    const allCountriesFile = path.join(bulkDir, "allCountries.txt");
    const alternateNamesFile = path.join(bulkDir, "alternateNamesV2.txt");

    await fs.writeFile(countryInfoFile, "AD\tAND\t020\tAndorra\tAndorra la Vella\n");
    await fs.writeFile(admin1File, "AD.07\tAndorra la Vella\n");
    await fs.writeFile(admin2File, "");
    await fs.writeFile(
      allCountriesFile,
      [
        "3039154\tSant Julia de Loria\tSant Julia de Loria\t-\t42.46372\t1.49129\tP\tPPLA\tAD\t\t07\t\t\t\t0\t0\t0\tEurope/Andorra\t2024-02-01",
        "3041565\tAndorra la Vella\tAndorra la Vella\t-\t42.50779\t1.52109\tP\tPPL\tAD\t\t07\t\t\t\t22000\t0\t0\tEurope/Andorra\t2024-02-01",
        "9999999\tTiny Hamlet\tTiny Hamlet\t-\t42.50000\t1.50000\tP\tPPL\tAD\t\t07\t\t\t\t25\t0\t0\tEurope/Andorra\t2024-02-01",
      ].join("\n"),
    );
    await fs.writeFile(
      alternateNamesFile,
      [
        "1\t3041565\ten\tAndorra",
        "2\t3041565\tes\tAndorra la Vieja",
        "3\t3041565\tfr\tAndorre-la-Vieille",
        "4\t3041565\tca\tAndorra la Vella",
      ].join("\n"),
    );

    const registry = await ingestRegistry({
      bulkPaths: {
        admin1Codes: admin1File,
        admin2Codes: admin2File,
        allCountries: allCountriesFile,
        alternateNames: alternateNamesFile,
        countryInfo: countryInfoFile,
      },
      maxAliasesPerCity: 2,
      minPopulation: 1000,
      outputDir: outDir,
      rawDir,
    });

    expect(registry.map((city) => city.name)).toEqual([
      "Sant Julia de Loria",
      "Andorra la Vella",
    ]);
    expect(registry.find((city) => city.name === "Tiny Hamlet")).toBeUndefined();
    expect(registry[0]?.countryIso3).toBe("AND");
    expect(registry[1]?.aliases).toEqual(["Andorra", "Andorra la Vieja"]);
  });
});
