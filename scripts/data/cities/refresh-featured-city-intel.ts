import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { fetchCitySources } from "./fetch-sources";
import { generateArtifacts } from "./generate-artifacts";
import { getEntityIndex } from "./load-bulk-entities";
import { resolveEntities } from "./resolve-entities";

const GENERATED_CITIES_DIR = path.join(process.cwd(), "src", "data", "generated", "cities");
const REGISTRY_FILE = path.join(GENERATED_CITIES_DIR, "registry.json");
const FACTS_DIR = path.join(process.cwd(), "data", "raw", "cities", "facts");
const RESOLVED_DIR = path.join(process.cwd(), "data", "raw", "cities", "resolved");

const DEFAULT_FEATURED_CITY_IDS = [
  "geo-745044",
  "geo-323786",
  "geo-3169070",
  "geo-2988507",
  "geo-2643743",
  "geo-2950159",
  "geo-3117735",
  "geo-4140963",
];

type CityRegistryEntry = {
  cityId: string;
  slug: string;
  name: string;
};

async function main() {
  const requestedIdsOrSlugs = process.argv.slice(2);
  const registry = JSON.parse(await fs.readFile(REGISTRY_FILE, "utf-8")) as CityRegistryEntry[];
  const requestedSet =
    requestedIdsOrSlugs.length > 0 ? new Set(requestedIdsOrSlugs) : new Set(DEFAULT_FEATURED_CITY_IDS);
  const selectedCities = registry.filter(
    (city) => requestedSet.has(city.cityId) || requestedSet.has(city.slug),
  );

  if (selectedCities.length === 0) {
    throw new Error(
      `No featured cities matched the requested ids/slugs: ${Array.from(requestedSet).join(", ")}`,
    );
  }

  console.log(
    `=== Refreshing city intelligence for ${selectedCities.length} cities: ${selectedCities.map((city) => city.name).join(", ")} ===`,
  );

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "econmap-refresh-city-intel-"));
  const tempGeneratedDir = path.join(tempRoot, "generated");
  const tempRegistryFile = path.join(tempGeneratedDir, "registry.json");

  try {
    await fs.mkdir(tempGeneratedDir, { recursive: true });
    await fs.writeFile(tempRegistryFile, JSON.stringify(selectedCities, null, 2));

    await Promise.all(
      selectedCities.flatMap((city) => [
        fs.rm(path.join(FACTS_DIR, `${city.cityId}.json`), { force: true }),
        fs.rm(path.join(RESOLVED_DIR, `${city.cityId}.json`), { force: true }),
        fs.rm(path.join(GENERATED_CITIES_DIR, "workspaces", `${city.cityId}.json`), { force: true }),
        fs.rm(path.join(GENERATED_CITIES_DIR, "entities", `${city.cityId}.json`), { force: true }),
        fs.rm(path.join(GENERATED_CITIES_DIR, "sources", `${city.cityId}.json`), { force: true }),
      ]),
    );

    const rebuiltEntityIndex = await getEntityIndex({ forceReload: true });

    await fetchCitySources({
      registryFile: tempRegistryFile,
      factsDir: FACTS_DIR,
      entityIndex: rebuiltEntityIndex,
      logger: console,
    });

    await resolveEntities({
      registryFile: tempRegistryFile,
      factsDir: FACTS_DIR,
      resolvedDir: RESOLVED_DIR,
      logger: console,
    });

    await generateArtifacts({
      outDir: tempGeneratedDir,
      registryFile: tempRegistryFile,
      resolvedDir: RESOLVED_DIR,
      logger: console,
    });

    await fs.mkdir(path.join(GENERATED_CITIES_DIR, "workspaces"), { recursive: true });
    await fs.mkdir(path.join(GENERATED_CITIES_DIR, "entities"), { recursive: true });
    await fs.mkdir(path.join(GENERATED_CITIES_DIR, "sources"), { recursive: true });

    await Promise.all(
      selectedCities.flatMap((city) => [
        fs.copyFile(
          path.join(tempGeneratedDir, "workspaces", `${city.cityId}.json`),
          path.join(GENERATED_CITIES_DIR, "workspaces", `${city.cityId}.json`),
        ),
        fs.copyFile(
          path.join(tempGeneratedDir, "entities", `${city.cityId}.json`),
          path.join(GENERATED_CITIES_DIR, "entities", `${city.cityId}.json`),
        ),
        fs.copyFile(
          path.join(tempGeneratedDir, "sources", `${city.cityId}.json`),
          path.join(GENERATED_CITIES_DIR, "sources", `${city.cityId}.json`),
        ),
      ]),
    );

    console.log("=== Featured city intelligence refreshed successfully ===");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
