// @vitest-environment node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseOurAirportsCsv } from "./ourairports-parser";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe("parseOurAirportsCsv", () => {
  it("parses airport and runway rows from streamed CSV files", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-ourairports-"));
    tempDirs.push(rootDir);

    const airportsFile = path.join(rootDir, "airports.csv");
    const runwaysFile = path.join(rootDir, "runways.csv");

    await fs.writeFile(
      airportsFile,
      [
        "ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,gps_code,iata_code,local_code,home_link,wikipedia_link,keywords",
        "AD-001,small_airport,Andorra Test Airport,42.5,1.5,3000,EU,AD,AD-07,Andorra la Vella,no,AD001,AD1,LOC1,,,mountain",
      ].join("\n"),
    );

    await fs.writeFile(
      runwaysFile,
      [
        "id,airport_ref,airport_ident,length_ft,width_ft,surface,lighted,closed,le_ident,he_ident",
        "1,1,AD-001,5000,100,ASP,1,0,01,19",
        "2,1,AD-001,3000,80,GRS,0,0,02,20",
      ].join("\n"),
    );

    const airports = await parseOurAirportsCsv(airportsFile);

    expect(airports).toHaveLength(1);
    expect(airports[0]?.entityId).toBe("airport-AD-001");
    expect(airports[0]?.runwayCount).toBe(2);
    expect(airports[0]?.municipality).toBe("Andorra la Vella");
  });

  it("derives icaoCode from the icao_code column, falling back to gps_code", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-ourairports-icao-"));
    tempDirs.push(rootDir);

    const airportsFile = path.join(rootDir, "airports.csv");
    await fs.writeFile(
      airportsFile,
      [
        "id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,icao_code,iata_code,gps_code,local_code,home_link,wikipedia_link,keywords",
        // explicit icao_code present -> used (not gps_code)
        "1,LFPG,large_airport,Paris CDG,49.0,2.55,392,EU,FR,FR-IDF,Paris,yes,LFPG,CDG,ZZZZ,,,,",
        // icao_code empty -> fall back to gps_code
        "2,00A,heliport,Total RF Heliport,40.07,-74.93,11,NA,US,US-PA,Bensalem,no,,,K00A,00A,,,",
      ].join("\n"),
    );
    await fs.writeFile(
      path.join(rootDir, "runways.csv"),
      "id,airport_ref,airport_ident,length_ft,width_ft,surface,lighted,closed,le_ident,he_ident\n",
    );

    const airports = await parseOurAirportsCsv(airportsFile);
    const cdg = airports.find((a) => a.entityId === "airport-LFPG");
    const heli = airports.find((a) => a.entityId === "airport-00A");

    expect(cdg?.icaoCode).toBe("LFPG");
    expect(heli?.icaoCode).toBe("K00A");
  });
});
