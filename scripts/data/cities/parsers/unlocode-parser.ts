import { createReadStream } from "node:fs";

import { parse } from "csv-parse";

const UNLOCODE_FILE_ENCODING: BufferEncoding = "latin1";

export type UnlocodeEntity = {
  entityId: string;
  entityType: "port" | "airport" | "rail_hub" | "logistics_hub";
  name: string;
  unlocode: string;
  countryIso2: string;
  subdivision?: string;
  latitude: number;
  longitude: number;
  functionCodes: string[];
  status: string;
  date: string;
  iataCode?: string;
  remarks?: string;
  exactSite: boolean;
  sourceId: "unlocode";
};

type UnlocodeRow = {
  change?: string;
  country?: string;
  location?: string;
  name?: string;
  nameAscii?: string;
  subdivision?: string;
  function?: string;
  status?: string;
  date?: string;
  iata?: string;
  coordinates?: string;
  remarks?: string;
};

export function parseUnlocodeRow(row: Partial<UnlocodeRow>): UnlocodeEntity[] {
  if (!row.country || !row.location || !row.name || !row.function) {
    return [];
  }

  const entities: UnlocodeEntity[] = [];
  const unlocode = `${row.country}${row.location.padStart(3, "0")}`;

  // Parse coordinates from formats like "4230N 00131E" or "5130N 00010W"
  const coords = parseCoordinates(row.coordinates ?? "");
  if (!coords) {
    return []; // Skip entries without valid coordinates
  }

  const functionCodes = row.function
    .split("")
    .filter((c, i) => i < 6 && c !== "-")
    .map((c) => c.trim())
    .filter((c) => c !== "");

  // Map UN/LOCODE function classifier positions to entity types (spec: position i holds digit i+1):
  //   pos 0 = '1' Port, pos 1 = '2' Rail terminal, pos 3 = '4' Airport.
  // (Previously port and airport were swapped, mislabeling every UN/LOCODE port as an airport.)
  const hasPort = row.function[0] === "1";
  const hasRail = row.function[1] === "2";
  const hasAirport = row.function[3] === "4";

  // Create separate entities for each transport mode
  if (hasAirport) {
    entities.push({
      entityId: `unlocode-airport-${unlocode}`,
      entityType: "airport",
      name: row.name,
      unlocode,
      countryIso2: row.country,
      subdivision: row.subdivision || undefined,
      latitude: coords.lat,
      longitude: coords.lon,
      functionCodes,
      status: row.status ?? "",
      date: row.date ?? "",
      iataCode: row.iata || undefined,
      remarks: row.remarks || undefined,
      exactSite: true,
      sourceId: "unlocode",
    });
  }

  if (hasRail) {
    entities.push({
      entityId: `unlocode-rail-${unlocode}`,
      entityType: "rail_hub",
      name: row.name,
      unlocode,
      countryIso2: row.country,
      subdivision: row.subdivision || undefined,
      latitude: coords.lat,
      longitude: coords.lon,
      functionCodes,
      status: row.status ?? "",
      date: row.date ?? "",
      iataCode: row.iata || undefined,
      remarks: row.remarks || undefined,
      exactSite: true,
      sourceId: "unlocode",
    });
  }

  if (hasPort) {
    entities.push({
      entityId: `unlocode-port-${unlocode}`,
      entityType: "port",
      name: row.name,
      unlocode,
      countryIso2: row.country,
      subdivision: row.subdivision || undefined,
      latitude: coords.lat,
      longitude: coords.lon,
      functionCodes,
      status: row.status ?? "",
      date: row.date ?? "",
      iataCode: row.iata || undefined,
      remarks: row.remarks || undefined,
      exactSite: true,
      sourceId: "unlocode",
    });
  }

  // If no specific transport mode but has functions, create logistics hub
  if (!hasAirport && !hasRail && !hasPort && functionCodes.length > 0) {
    entities.push({
      entityId: `unlocode-logistics-${unlocode}`,
      entityType: "logistics_hub",
      name: row.name,
      unlocode,
      countryIso2: row.country,
      subdivision: row.subdivision || undefined,
      latitude: coords.lat,
      longitude: coords.lon,
      functionCodes,
      status: row.status ?? "",
      date: row.date ?? "",
      iataCode: row.iata || undefined,
      remarks: row.remarks || undefined,
      exactSite: true,
      sourceId: "unlocode",
    });
  }

  return entities;
}

function parseCoordinates(coordStr: string): { lat: number; lon: number } | null {
  if (!coordStr || coordStr.trim() === "") {
    return null;
  }

  // Match patterns like "4230N 00131E" or "5130N 00010W"
  const match = coordStr.match(/(\d+)([NS])\s+(\d+)([EW])/i);
  if (!match) {
    return null;
  }

  const latDeg = parseInt(match[1].slice(0, -2), 10) || parseInt(match[1], 10);
  const latMin = parseInt(match[1].slice(-2), 10) || 0;
  const latDir = match[2].toUpperCase();
  const lonDeg = parseInt(match[3].slice(0, -2), 10) || parseInt(match[3], 10);
  const lonMin = parseInt(match[3].slice(-2), 10) || 0;
  const lonDir = match[4].toUpperCase();

  let latitude = latDeg + latMin / 60;
  let longitude = lonDeg + lonMin / 60;

  if (latDir === "S") latitude = -latitude;
  if (lonDir === "W") longitude = -longitude;

  return { lat: latitude, lon: longitude };
}

export async function parseUnlocodeCsv(filePath: string): Promise<UnlocodeEntity[]> {
  const entities: UnlocodeEntity[] = [];
  const parser = createReadStream(filePath, { encoding: UNLOCODE_FILE_ENCODING }).pipe(
    parse({
      columns: [
        "change",
        "country",
        "location",
        "name",
        "nameAscii",
        "subdivision",
        "function",
        "status",
        "date",
        "iata",
        "coordinates",
        "remarks",
      ],
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }),
  ) as AsyncIterable<Partial<UnlocodeRow>>;

  for await (const row of parser) {
    const parsed = parseUnlocodeRow(row);
    entities.push(...parsed);
  }

  return entities;
}

export function findUnlocodeEntitiesForCity(
  entities: UnlocodeEntity[],
  city: {
    name: string;
    countryIso2?: string;
    latitude: number;
    longitude: number;
  },
  maxDistanceKm = 30
): UnlocodeEntity[] {
  const normalizedCityName = city.name.toLowerCase().trim();

  return entities.filter((entity) => {
    // Country match required
    if (city.countryIso2 && entity.countryIso2 !== city.countryIso2) {
      return false;
    }

    // Name match (strongest signal)
    const normalizedName = entity.name.toLowerCase().trim();
    if (normalizedName === normalizedCityName) {
      return true;
    }

    // Fallback to distance match
    const distance = haversineDistance(city.latitude, city.longitude, entity.latitude, entity.longitude);
    return distance <= maxDistanceKm;
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
