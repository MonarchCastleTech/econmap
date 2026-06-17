/**
 * Generates identity records for countries not in the curated catalog, so the global country
 * layer has worldwide coverage. Real economic metrics for these countries come from the World Bank
 * snapshot (src/data/generated/world-bank-core.json) at render time; where a country has no
 * observation it shows "no data".
 *
 * P0.2 (no-fabrication non-negotiable): this script previously fabricated EVERY metric
 * (population, GDP, inflation, unemployment, debt, gini, renewables, ...) with Math.random() and
 * emitted a placeholder capital "Capital". Those values were never read by the app
 * (src/data/normalized/countries.ts derives metrics from world-bank-core, not seed.metrics) but
 * are fabrication-in-the-repo, so they are removed. Capital is left blank ("") rather than a fake
 * string; identity fields (iso, name, region) come from the real ISO mapping.
 *
 * Output records intentionally carry NO `metrics` field.
 */
import fs from "fs";
import path from "path";

const ISO_MAPPING_PATH = "data/raw/cities/bulk/iso_mapping.json";
const OUTPUT_PATH = "src/data/generated/global-countries.json";

const EXISTING_ISO3 = new Set([
  "USA", "GBR", "DEU", "FRA", "JPN", "CHN", "IND", "BRA", "ZAF", "AUS",
  "CAN", "MEX", "ITA", "ESP", "TUR", "RUS", "SAU", "IDN", "KOR", "ARG",
  "NGA", "EGY", "VNM", "THA", "POL", "SWE", "CHL", "ARE",
]);

type GlobalCountrySeed = {
  id: string;
  slug: string;
  iso2: string;
  iso3: string;
  name: string;
  flag: string;
  capital: string;
  region: string;
  subregion: string;
  latitude: number;
  longitude: number;
  currencyCode: string;
  currencyName: string;
  creditRating: string;
  blocs: string[];
  showcase: boolean;
  trendProfile: string;
};

function generateGlobalCountries(): void {
  console.log("Generating global country identity records (no fabricated metrics)...");
  const mapping = JSON.parse(fs.readFileSync(ISO_MAPPING_PATH, "utf-8"));
  const list = Array.isArray(mapping) ? mapping : mapping.value;

  const additionalCountries: GlobalCountrySeed[] = [];

  for (const country of list) {
    const iso2 = country["alpha-2"];
    const iso3 = country["alpha-3"];
    const name = country["name"];

    if (!iso2 || !iso3 || EXISTING_ISO3.has(String(iso3).toUpperCase())) {
      continue;
    }

    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    additionalCountries.push({
      id: `country-${slug}`,
      slug,
      iso2: String(iso2).toUpperCase(),
      iso3: String(iso3).toUpperCase(),
      name,
      flag: "🌎",
      capital: "", // unknown — shown as "no data", never a fabricated placeholder
      region: country["region"] || "Global",
      subregion: country["sub-region"] || "Global",
      latitude: 0,
      longitude: 0,
      currencyCode: "",
      currencyName: "",
      creditRating: "NR",
      blocs: [],
      showcase: false,
      trendProfile: "frontier",
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(additionalCountries, null, 2));
  console.log(`Generated ${additionalCountries.length} global country identity records (no metrics).`);
}

generateGlobalCountries();
