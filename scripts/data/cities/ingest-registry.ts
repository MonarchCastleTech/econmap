import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { createReadStream } from "node:fs";

import { getBulkSourceManifest } from "./bulk-source-manifest";
import { parseGeoNamesRegistryRow, type GeoNamesCityRecord } from "./parsers/geonames-registry";
import { mergeAliases, parseAlternateNameRow } from "./parsers/geonames-aliases";

const RAW_DIR = path.join(process.cwd(), "data", "raw", "cities");
const NORMALIZED_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const REGISTRY_FILE = path.join(RAW_DIR, "registry.json");
const NORMALIZED_REGISTRY_FILE = path.join(NORMALIZED_DIR, "registry.json");
const VALID_PLACE_CODES = new Set([
  "PPL",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPLC",
  "PPLG",
  "PPLS",
  "PPLX",
  "PPLL",
  "PPLQ",
  "PPLR",
  "PPLW",
]);
const ADMIN_PLACE_CODES = new Set(["PPLC", "PPLA", "PPLA2", "PPLA3", "PPLA4"]);

type CountryInfo = {
  iso3: string;
  name: string;
};

type IngestRegistryOptions = {
  bulkPaths?: {
    admin1Codes: string;
    admin2Codes: string;
    allCountries: string;
    alternateNames: string;
    countryInfo: string;
  };
  rawDir?: string;
  outputDir?: string;
  minPopulation?: number;
  maxAliasesPerCity?: number;
  logger?: Pick<Console, "log">;
};

async function loadCountryInfo(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  const entries = new Map<string, CountryInfo>();

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const fields = line.split("\t");
    if (fields.length < 5) {
      continue;
    }

    const [iso2, iso3, , name] = fields;
    entries.set(iso2, { iso3, name });
  }

  return entries;
}

async function loadAdminCodeMap(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  const entries = new Map<string, string>();

  for (const line of content.split(/\r?\n/)) {
    if (!line) {
      continue;
    }

    const fields = line.split("\t");
    if (fields.length < 2) {
      continue;
    }

    entries.set(fields[0], fields[1]);
  }

  return entries;
}

function shouldPublishCity(fields: string[], minPopulation: number) {
  if (fields.length < 15) {
    return false;
  }

  const featureClass = fields[6];
  const featureCode = fields[7];
  const population = Number.parseInt(fields[14], 10) || 0;

  if (featureClass !== "P" || !VALID_PLACE_CODES.has(featureCode)) {
    return false;
  }

  return ADMIN_PLACE_CODES.has(featureCode) || population >= minPopulation;
}

export async function ingestRegistry(options: IngestRegistryOptions = {}) {
  const rawDir = options.rawDir ?? RAW_DIR;
  const outputDir = options.outputDir ?? NORMALIZED_DIR;
  const registryFile = path.join(rawDir, "registry.json");
  const normalizedRegistryFile = path.join(outputDir, "registry.json");
  const minPopulation = options.minPopulation ?? 1000;
  const maxAliasesPerCity = options.maxAliasesPerCity ?? 12;
  const logger = options.logger ?? console;

  logger.log("Starting city registry ingestion from local GeoNames bulk files...");
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const manifest = getBulkSourceManifest();
  const bulkPaths = options.bulkPaths ?? {
    admin1Codes: manifest.geonames.admin1Codes.absolutePath,
    admin2Codes: manifest.geonames.admin2Codes.absolutePath,
    allCountries: manifest.geonames.allCountries.absolutePath,
    alternateNames: manifest.geonames.alternateNames.absolutePath,
    countryInfo: manifest.geonames.countryInfo.absolutePath,
  };
  const countryInfo = await loadCountryInfo(bulkPaths.countryInfo);
  const admin1Codes = await loadAdminCodeMap(bulkPaths.admin1Codes);
  const admin2Codes = await loadAdminCodeMap(bulkPaths.admin2Codes);

  const registry: GeoNamesCityRecord[] = [];
  const registryByGeonameId = new Map<string, GeoNamesCityRecord>();
  const lineReader = readline.createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input: createReadStream(bulkPaths.allCountries, { encoding: "utf-8" }),
  });

  for await (const line of lineReader) {
    if (!line) {
      continue;
    }

    const fields = line.split("\t");
    if (!shouldPublishCity(fields, minPopulation)) {
      continue;
    }

    const countryIso2 = fields[8];
    const admin1Code = fields[10];
    const admin2Code = fields[11];
    const countryMeta = countryInfo.get(countryIso2);

    if (!countryMeta) {
      continue;
    }

    const admin1Name = admin1Code ? admin1Codes.get(`${countryIso2}.${admin1Code}`) : undefined;
    const admin2Name = admin1Code && admin2Code
      ? admin2Codes.get(`${countryIso2}.${admin1Code}.${admin2Code}`)
      : undefined;

    const parsed = parseGeoNamesRegistryRow(line, {
      admin1Name,
      admin2Name,
      countryIso3: countryMeta.iso3,
      countryName: countryMeta.name,
    });

    if (parsed) {
      registry.push(parsed);
      registryByGeonameId.set(fields[0], parsed);
    }
  }

  const aliasReader = readline.createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input: createReadStream(bulkPaths.alternateNames, { encoding: "utf-8" }),
  });

  for await (const line of aliasReader) {
    if (!line) {
      continue;
    }

    const parsedAlias = parseAlternateNameRow(line);
    if (!parsedAlias) {
      continue;
    }

    const city = registryByGeonameId.get(parsedAlias.geonameId);
    if (!city) {
      continue;
    }

    const aliases = mergeAliases(city.aliases, [parsedAlias.alternateName]).filter(
      (alias) => alias !== city.name,
    );
    city.aliases = aliases.slice(0, maxAliasesPerCity);
  }

  await fs.writeFile(registryFile, JSON.stringify(registry, null, 2));
  await fs.writeFile(normalizedRegistryFile, JSON.stringify(registry, null, 2));
  logger.log(`Normalized ${registry.length} GeoNames city records to ${normalizedRegistryFile}`);

  return registry;
}

if (require.main === module) {
  ingestRegistry().catch(console.error);
}
