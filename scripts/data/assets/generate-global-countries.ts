/**
 * Generates non-curated country identity records from the official World Bank
 * country catalog. Economic metrics remain sourced from world-bank-core.json;
 * this file intentionally contains no synthetic metric values.
 */
import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = "src/data/generated/global-countries.json";
const ISO_MAPPING_PATH = "data/raw/cities/bulk/iso_mapping.json";
const CATALOG_URL = "https://api.worldbank.org/v2/country?format=json&per_page=400";

const EXISTING_ISO3 = new Set([
  "USA", "GBR", "DEU", "FRA", "JPN", "CHN", "IND", "BRA", "ZAF", "AUS",
  "CAN", "MEX", "ITA", "ESP", "TUR", "RUS", "SAU", "IDN", "KOR", "ARG",
  "NGA", "EGY", "VNM", "THA", "POL", "SWE", "CHL", "ARE",
]);

type WorldBankCountry = {
  id?: string;
  iso2Code?: string;
  name?: string;
  region?: { id?: string; value?: string };
  adminregion?: { value?: string };
  capitalCity?: string;
  longitude?: string;
  latitude?: string;
};

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function flagFor(iso2: string) {
  return String.fromCodePoint(
    ...[...iso2].map((character) => 0x1f1e6 + character.charCodeAt(0) - 65),
  );
}

function coordinate(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchCatalog() {
  let response: Response | undefined;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    response = await fetch(CATALOG_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "econmap-world-bank-country-generator/1.0",
      },
      signal: AbortSignal.timeout(110_000),
    });
    if (response.ok) break;
    if (attempt === 5 || ![400, 408, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`World Bank country catalog failed: HTTP ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
  }
  if (!response?.ok) {
    throw new Error("World Bank country catalog returned no successful response");
  }
  const payload = (await response.json()) as [
    { total?: number } | undefined,
    WorldBankCountry[] | undefined,
  ];
  return payload[1] ?? [];
}

async function generateGlobalCountries() {
  console.log("Generating global country identities from the World Bank country catalog...");
  const catalog = await fetchCatalog();
  const officialCountries = catalog
    .filter((country) => {
      const iso2 = country.iso2Code ?? "";
      const iso3 = country.id ?? "";
      return (
        country.region?.id !== "NA"
        && /^[A-Z]{2}$/.test(iso2)
        && /^[A-Z]{3}$/.test(iso3)
        && Boolean(country.name)
      );
    })
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  const additionalCountries: GlobalCountrySeed[] = officialCountries
    .filter((country) => !EXISTING_ISO3.has(country.id!))
    .map((country) => {
      const iso2 = country.iso2Code!;
      const iso3 = country.id!;
      const name = country.name!;
      const slug = slugify(name);
      return {
        id: `country-${slug}`,
        slug,
        iso2,
        iso3,
        name,
        flag: flagFor(iso2),
        capital: country.capitalCity ?? "",
        region: country.region?.value || "Global",
        subregion: country.adminregion?.value || country.region?.value || "Global",
        latitude: coordinate(country.latitude),
        longitude: coordinate(country.longitude),
        currencyCode: "",
        currencyName: "",
        creditRating: "NR",
        blocs: [],
        showcase: false,
        trendProfile: "frontier",
      };
    });

  const isoMapping = officialCountries.map((country) => ({
    "alpha-2": country.iso2Code,
    "alpha-3": country.id,
    name: country.name,
    region: country.region?.value || "",
    "sub-region": country.adminregion?.value || "",
  }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(ISO_MAPPING_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(additionalCountries, null, 2));
  fs.writeFileSync(ISO_MAPPING_PATH, JSON.stringify(isoMapping, null, 2));
  console.log(
    `Generated ${additionalCountries.length} non-curated country identities `
      + `and ${isoMapping.length} ISO mappings (no metrics).`,
  );
}

generateGlobalCountries().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
