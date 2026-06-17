import { createCsvRecordStream } from "./csv-stream";

export type ResearchEntity = {
  entityId: string;
  entityType: "research";
  entitySubtype: "university" | "research_institute" | "hospital" | "government_lab";
  name: string;
  aliases: string[];
  rorId: string;
  countryIso2: string;
  countryName: string;
  admin1Name?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  types: string[];
  exactSite: boolean;
  sourceId: "ror";
};

type RorRow = {
  id: string;
  "locations.geonames_details.country_code": string;
  "locations.geonames_details.country_name": string;
  "locations.geonames_details.country_subdivision_name": string;
  "locations.geonames_details.lat": string;
  "locations.geonames_details.lng": string;
  "locations.geonames_details.name": string;
  "names.types.acronym"?: string;
  "names.types.alias"?: string;
  "names.types.ror_display": string;
  types: string;
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter((value) => value !== "")));
}

export function normalizeRorRow(row: Partial<RorRow>): ResearchEntity | null {
  const name = readLabeledValue(row["names.types.ror_display"]);

  if (!row.id || !name) {
    return null;
  }

  const latitude = row["locations.geonames_details.lat"]
    ? parseFloat(row["locations.geonames_details.lat"])
    : undefined;
  const longitude = row["locations.geonames_details.lng"]
    ? parseFloat(row["locations.geonames_details.lng"])
    : undefined;

  const aliases = uniqueValues([
    ...parseAlternateNames(row["names.types.alias"] ?? ""),
    ...parseAlternateNames(row["names.types.acronym"] ?? ""),
  ]);
  const types = uniqueValues(
    (row.types ?? "")
      .split(";")
      .map((value) => value.trim())
      .filter((value) => value !== ""),
  );
  const entitySubtype = determineResearchSubtype(types);

  const hasExactCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  return {
    entityId: `ror-${row.id.replace("https://ror.org/", "")}`,
    entityType: "research",
    entitySubtype,
    name,
    aliases,
    rorId: row.id,
    countryIso2: row["locations.geonames_details.country_code"] ?? "",
    countryName: row["locations.geonames_details.country_name"] ?? "",
    admin1Name: row["locations.geonames_details.country_subdivision_name"] || undefined,
    city: readLabeledValue(row["locations.geonames_details.name"]) || undefined,
    latitude: hasExactCoords ? latitude : undefined,
    longitude: hasExactCoords ? longitude : undefined,
    types,
    exactSite: hasExactCoords,
    sourceId: "ror",
  };
}

function parseAlternateNames(namesStr: string): string[] {
  if (!namesStr || namesStr.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(namesStr);
    if (Array.isArray(parsed)) {
      return uniqueValues(
        parsed
          .flatMap((value) => {
            if (typeof value === "string") {
              return [value];
            }

            if (!value || typeof value !== "object") {
              return [];
            }

            const candidate = [value.label, value.value, value.name].find(
              (entry) => typeof entry === "string" && entry.trim() !== "",
            );

            return typeof candidate === "string" ? [candidate] : [];
          })
          .map((value) => readLabeledValue(value))
          .filter((value) => value !== ""),
      );
    }
  } catch {
    // Not JSON, try semicolon-separated
  }

  return uniqueValues(
    namesStr
      .split(/[;|]/)
      .map((value) => readLabeledValue(value))
      .filter((value) => value !== ""),
  );
}

function readLabeledValue(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  const labeledValueMatch = trimmed.match(/^[a-z_]+:\s*(.+)$/i);
  return (labeledValueMatch?.[1] ?? trimmed).trim();
}

function determineResearchSubtype(types: string[]): ResearchEntity["entitySubtype"] {
  const normalizedTypes = types.map((t) => t.toLowerCase());

  if (normalizedTypes.some((t) => t.includes("education") || t.includes("university") || t.includes("college"))) {
    return "university";
  }

  if (normalizedTypes.some((t) => t.includes("healthcare") || t.includes("hospital") || t.includes("medical"))) {
    return "hospital";
  }

  if (normalizedTypes.some((t) => t.includes("government") || t.includes("agency"))) {
    return "government_lab";
  }

  return "research_institute";
}

export async function parseRorCsv(filePath: string): Promise<ResearchEntity[]> {
  const entities: ResearchEntity[] = [];
  const parser = createCsvRecordStream<Partial<RorRow>>(filePath);

  for await (const row of parser) {
    const entity = normalizeRorRow(row);
    if (entity) {
      entities.push(entity);
    }
  }

  return entities;
}

export function findResearchForCity(
  entities: ResearchEntity[],
  city: {
    name: string;
    countryIso2?: string;
    admin1Name?: string;
    latitude?: number;
    longitude?: number;
  },
  maxDistanceKm = 50
): ResearchEntity[] {
  const normalizedCityName = city.name.toLowerCase().trim();

  return entities.filter((entity) => {
    if (city.countryIso2 && entity.countryIso2 !== city.countryIso2) {
      return false;
    }

    if (entity.city) {
      const normalizedEntityCity = entity.city.toLowerCase().trim();
      if (normalizedEntityCity === normalizedCityName) {
        return true;
      }
    }

    if (city.admin1Name && entity.admin1Name) {
      const normalizedAdmin1 = entity.admin1Name.toLowerCase().trim();
      if (normalizedAdmin1 === city.admin1Name.toLowerCase().trim()) {
        if (entity.latitude && entity.longitude && city.latitude && city.longitude) {
          const distance = haversineDistance(
            city.latitude,
            city.longitude,
            entity.latitude,
            entity.longitude
          );
          return distance <= maxDistanceKm;
        }
        return true;
      }
    }

    if (
      entity.latitude &&
      entity.longitude &&
      city.latitude &&
      city.longitude
    ) {
      const distance = haversineDistance(
        city.latitude,
        city.longitude,
        entity.latitude,
        entity.longitude
      );
      return distance <= maxDistanceKm;
    }

    return false;
  });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
