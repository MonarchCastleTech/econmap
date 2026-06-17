export type GeoNamesCityRecord = {
  cityId: string;
  slug: string;
  name: string;
  aliases: string[];
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

  const slug = `geo-${geonameid}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const countrySlug = meta.countryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Major city criteria: capitals, admin HQs, or population > 500k
  const isAdminCapital = featureCode === "PPLC";
  const isAdminHQ = featureCode === "PPLA" || featureCode === "PPLA2";
  const isLargeCity = population > 500000;
  const isMajorCity = isAdminCapital || isAdminHQ || isLargeCity;

  return {
    cityId: `geo-${geonameid}`,
    slug,
    name,
    aliases: [],
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
