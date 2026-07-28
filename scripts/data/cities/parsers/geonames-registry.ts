export type GeoNamesCityRecord = {
  cityId: string;
  slug: string;
  name: string;
  aliases: string[];
  placeClass: "city" | "subordinate_place";
  featureClass: "P";
  featureCode: string;
  sourceIds: {
    geonames: string;
    wikidata?: string;
    osm?: string;
  };
  countryIso2: string;
  countryIso3: string;
  countrySlug: string;
  admin1Name?: string;
  admin1Code?: string;
  admin2Name?: string;
  latitude: number;
  longitude: number;
  boundaryStatus: "has_boundary" | "point_only";
  population: number | null;
  populationSource?: string;
  registrySource: string;
  recordStatus: "active" | "deprecated" | "merged";
  roleTags?: string[];
  isMajorCity: boolean;
};

const LOWER_ORDER_ADMIN_CODES = new Set(["PPLA2", "PPLA3", "PPLA4"]);
const SUBORDINATE_PLACE_CODES = new Set(["PPLL", "PPLQ", "PPLR", "PPLS", "PPLW", "PPLX"]);
const LOWER_ORDER_CITY_POPULATION = 100_000;

function slugifyPlaceName(value: string) {
  return value
    .replaceAll("\u0131", "i")
    .replaceAll("\u0130", "I")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function classifyPlace(
  featureCode: string,
  population: number,
  name: string,
  admin2Name?: string,
  countryIso2?: string,
): GeoNamesCityRecord["placeClass"] {
  if (SUBORDINATE_PLACE_CODES.has(featureCode)) {
    return "subordinate_place";
  }

  if (
    LOWER_ORDER_ADMIN_CODES.has(featureCode) &&
    (countryIso2 === "TR" || population < LOWER_ORDER_CITY_POPULATION)
  ) {
    return "subordinate_place";
  }

  if (
    featureCode === "PPL" &&
    admin2Name &&
    slugifyPlaceName(name) === slugifyPlaceName(admin2Name)
  ) {
    return "subordinate_place";
  }

  return "city";
}

export function parseGeoNamesRegistryRow(
  row: string,
  meta: {
    countryIso3: string;
    countryName: string;
    admin1Name?: string;
    admin2Name?: string;
  }
): GeoNamesCityRecord | null {
  const fields = row.split("\t");
  if (fields.length < 15) return null;

  const geonameid = fields[0];
  const name = fields[1];
  const latitude = parseFloat(fields[4]);
  const longitude = parseFloat(fields[5]);
  const featureClass = fields[6];
  const featureCode = fields[7];
  const countryIso2 = fields[8];
  const admin1Code = fields[10];
  const population = parseInt(fields[14], 10);

  if (featureClass !== "P") return null;

  const validPlaceCodes = ["PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC", "PPLG", "PPLS", "PPLX", "PPLL", "PPLQ", "PPLR", "PPLW"];
  if (!validPlaceCodes.includes(featureCode)) return null;

  const slug = `geo-${geonameid}-${slugifyPlaceName(name)}`;
  const countrySlug = slugifyPlaceName(meta.countryName);
  const placeClass = classifyPlace(featureCode, population, name, meta.admin2Name, countryIso2);

  // Major city criteria: capitals, admin HQs, or population > 500k
  const isAdminCapital = featureCode === "PPLC";
  const isAdminHQ = featureCode === "PPLA" || featureCode === "PPLA2";
  const isLargeCity = population > 500000;
  const isMajorCity = placeClass === "city" && (isAdminCapital || isAdminHQ || isLargeCity);

  return {
    cityId: `geo-${geonameid}`,
    slug,
    name,
    aliases: [],
    placeClass,
    featureClass: "P",
    featureCode,
    sourceIds: {
      geonames: geonameid,
    },
    countryIso2,
    countryIso3: meta.countryIso3,
    countrySlug,
    admin1Name: meta.admin1Name,
    admin1Code,
    admin2Name: meta.admin2Name,
    latitude,
    longitude,
    boundaryStatus: "point_only",
    population: isNaN(population) || population === 0 ? null : population,
    populationSource: "GeoNames",
    registrySource: "GeoNames",
    recordStatus: "active",
    isMajorCity,
  };
}
