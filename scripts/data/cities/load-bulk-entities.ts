import fs from "node:fs/promises";
import path from "node:path";

import { getBulkSourceManifest } from "./bulk-source-manifest";
import { parseOurAirportsCsv, type AirportEntity } from "./parsers/ourairports-parser";
import { parseUnlocodeCsv, type UnlocodeEntity } from "./parsers/unlocode-parser";
import { parseWriPowerPlantsCsv, type PowerPlantEntity } from "./parsers/wri-powerplants-parser";
import { parseRorCsv, type ResearchEntity } from "./parsers/ror-parser";
import { parseWpiCsv, type PortEntity } from "./parsers/wpi-parser";
import { parseMrdsCsv, type MineralSiteEntity } from "./parsers/usgs-mrds-parser";

const PROCESSED_DIR = path.join(process.cwd(), "data", "processed", "cities", "indexes");

export type BulkEntityIndex = {
  airports: AirportEntity[];
  unlocodeEntities: UnlocodeEntity[];
  powerPlants: PowerPlantEntity[];
  researchOrgs: ResearchEntity[];
  wpiPorts: PortEntity[];
  mineralSites: MineralSiteEntity[];
};

type EntityIndexOptions = {
  forceReload?: boolean;
};

export async function loadBulkEntityIndex(): Promise<BulkEntityIndex> {
  console.log("Loading bulk entity indexes from local files...");
  await fs.mkdir(PROCESSED_DIR, { recursive: true });

  const manifest = getBulkSourceManifest();
  const index: BulkEntityIndex = {
    airports: [],
    unlocodeEntities: [],
    powerPlants: [],
    researchOrgs: [],
    wpiPorts: [],
    mineralSites: [],
  };

  // Load OurAirports
  if (manifest.ourAirports.airports.exists) {
    console.log("  Parsing OurAirports...");
    try {
      index.airports = await parseOurAirportsCsv(manifest.ourAirports.airports.absolutePath);
      console.log(`    Loaded ${index.airports.length} airports`);
    } catch (err) {
      console.warn(`    Failed to parse OurAirports: ${err}`);
    }
  }

  // Load UN/LOCODE (all 3 parts)
  if (manifest.unlocode.part1.exists && manifest.unlocode.part2.exists && manifest.unlocode.part3.exists) {
    console.log("  Parsing UN/LOCODE...");
    try {
      const part1 = await parseUnlocodeCsv(manifest.unlocode.part1.absolutePath);
      const part2 = await parseUnlocodeCsv(manifest.unlocode.part2.absolutePath);
      const part3 = await parseUnlocodeCsv(manifest.unlocode.part3.absolutePath);
      index.unlocodeEntities = [...part1, ...part2, ...part3];
      console.log(`    Loaded ${index.unlocodeEntities.length} UN/LOCODE entities`);
    } catch (err) {
      console.warn(`    Failed to parse UN/LOCODE: ${err}`);
    }
  }

  // Load WRI Power Plants
  if (manifest.wri.powerPlants.exists) {
    console.log("  Parsing WRI Power Plants...");
    try {
      index.powerPlants = await parseWriPowerPlantsCsv(manifest.wri.powerPlants.absolutePath);
      console.log(`    Loaded ${index.powerPlants.length} power plants`);
    } catch (err) {
      console.warn(`    Failed to parse WRI Power Plants: ${err}`);
    }
  }

  // Load ROR
  if (manifest.researchOrganizations.csv.exists) {
    console.log("  Parsing ROR...");
    try {
      index.researchOrgs = await parseRorCsv(manifest.researchOrganizations.csv.absolutePath);
      console.log(`    Loaded ${index.researchOrgs.length} research organizations`);
    } catch (err) {
      console.warn(`    Failed to parse ROR: ${err}`);
    }
  }

  // Load World Port Index
  if (manifest.worldPortIndex.wpi.exists) {
    console.log("  Parsing World Port Index...");
    try {
      index.wpiPorts = await parseWpiCsv(manifest.worldPortIndex.wpi.absolutePath);
      console.log(`    Loaded ${index.wpiPorts.length} WPI ports`);
    } catch (err) {
      console.warn(`    Failed to parse World Port Index: ${err}`);
    }
  }

  // Load USGS MRDS (mineral sites)
  if (manifest.usgs.mrds.exists) {
    console.log("  Parsing USGS MRDS...");
    try {
      index.mineralSites = await parseMrdsCsv(manifest.usgs.mrds.absolutePath);
      console.log(`    Loaded ${index.mineralSites.length} mineral sites`);
    } catch (err) {
      console.warn(`    Failed to parse USGS MRDS: ${err}`);
    }
  }

  // Persist indexes for faster subsequent runs
  await fs.writeFile(
    path.join(PROCESSED_DIR, "airports.json"),
    JSON.stringify(index.airports, null, 2)
  );
  await fs.writeFile(
    path.join(PROCESSED_DIR, "unlocode-entities.json"),
    JSON.stringify(index.unlocodeEntities, null, 2)
  );
  await fs.writeFile(
    path.join(PROCESSED_DIR, "power-plants.json"),
    JSON.stringify(index.powerPlants, null, 2)
  );
  await fs.writeFile(
    path.join(PROCESSED_DIR, "research-orgs.json"),
    JSON.stringify(index.researchOrgs, null, 2)
  );
  await fs.writeFile(
    path.join(PROCESSED_DIR, "wpi-ports.json"),
    JSON.stringify(index.wpiPorts, null, 2)
  );
  await fs.writeFile(
    path.join(PROCESSED_DIR, "mineral-sites.json"),
    JSON.stringify(index.mineralSites, null, 2)
  );

  console.log(`Bulk entity index persisted to ${PROCESSED_DIR}`);
  return index;
}

export async function loadCachedEntityIndex(): Promise<BulkEntityIndex | null> {
  try {
    const airportsFile = path.join(PROCESSED_DIR, "airports.json");
    const unlocodeFile = path.join(PROCESSED_DIR, "unlocode-entities.json");
    const powerPlantsFile = path.join(PROCESSED_DIR, "power-plants.json");
    const researchOrgsFile = path.join(PROCESSED_DIR, "research-orgs.json");
    const wpiPortsFile = path.join(PROCESSED_DIR, "wpi-ports.json");
    const mineralSitesFile = path.join(PROCESSED_DIR, "mineral-sites.json");

    const [airports, unlocodeEntities, powerPlants, researchOrgs, wpiPorts, mineralSites] =
      await Promise.all([
        fs.readFile(airportsFile, "utf-8").then((d) => JSON.parse(d)),
        fs.readFile(unlocodeFile, "utf-8").then((d) => JSON.parse(d)),
        fs.readFile(powerPlantsFile, "utf-8").then((d) => JSON.parse(d)),
        fs.readFile(researchOrgsFile, "utf-8").then((d) => JSON.parse(d)),
        fs.readFile(wpiPortsFile, "utf-8").then((d) => JSON.parse(d)),
        fs.readFile(mineralSitesFile, "utf-8").then((d) => JSON.parse(d)),
      ]);

    return { airports, unlocodeEntities, powerPlants, researchOrgs, wpiPorts, mineralSites };
  } catch {
    return null;
  }
}

export async function getEntityIndex(options: EntityIndexOptions = {}): Promise<BulkEntityIndex> {
  // Try cached first
  if (!options.forceReload) {
    const cached = await loadCachedEntityIndex();
    if (cached) {
      console.log("Using cached entity index");
      return cached;
    }
  }

  // Otherwise load from source
  return loadBulkEntityIndex();
}
