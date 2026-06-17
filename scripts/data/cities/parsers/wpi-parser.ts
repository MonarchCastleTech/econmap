import { createCsvRecordStream } from "./csv-stream";

export type PortEntity = {
  entityId: string;
  entityType: "port";
  entitySubtype: "seaport" | "river_port" | "lake_port";
  name: string;
  alternateName?: string;
  wpiNumber: number;
  unlocode?: string;
  countryIso2: string;
  countryName?: string;
  region?: string;
  waterBody?: string;
  latitude: number;
  longitude: number;
  harborSize?: string;
  harborType?: string;
  harborUse?: string;
  facilities: string[];
  services: string[];
  exactSite: true;
  sourceId: "world-port-index";
};

type WpiRow = {
  "World Port Index Number": string;
  "Main Port Name": string;
  "Alternate Port Name": string;
  "UN/LOCODE": string;
  "Country Code": string;
  "Region Name": string;
  "North Water Body": string;
  "Latitude": string;
  "Longitude": string;
  "Harbor Size": string;
  "Harbor Type": string;
  "Harbor Use": string;
  "Facilities - Wharves": string;
  "Facilities - Anchorage": string;
  "Facilities - Container": string;
  "Facilities - Oil Terminal": string;
  "Facilities - LNG Terminal": string;
  "Services - Longshoremen": string;
  "Services - Electricity": string;
  "Services - Navigation Equipment": string;
  "Medical Facilities": string;
  "Dry Dock": string;
  "Railway": string;
};

export function normalizeWpiRow(row: Partial<WpiRow>): PortEntity | null {
  const wpiNumber = parseFloat(row["World Port Index Number"] ?? "");
  if (isNaN(wpiNumber) || !row["Main Port Name"]) {
    return null;
  }

  const latitude = parseFloat(row["Latitude"] ?? "");
  const longitude = parseFloat(row["Longitude"] ?? "");

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const facilities: string[] = [];
  if (row["Facilities - Wharves"] === "Yes") facilities.push("wharves");
  if (row["Facilities - Anchorage"] === "Yes") facilities.push("anchorage");
  if (row["Facilities - Container"] === "Yes") facilities.push("container");
  if (row["Facilities - Oil Terminal"] === "Yes") facilities.push("oil_terminal");
  if (row["Facilities - LNG Terminal"] === "Yes") facilities.push("lng_terminal");
  if (row["Dry Dock"] === "Yes") facilities.push("dry_dock");
  if (row["Railway"] === "Yes") facilities.push("railway");

  const services: string[] = [];
  if (row["Services - Longshoremen"] === "Yes") services.push("longshoremen");
  if (row["Services - Electricity"] === "Yes") services.push("electricity");
  if (row["Services - Navigation Equipment"] === "Yes") services.push("navigation_equipment");
  if (row["Medical Facilities"] === "Yes") services.push("medical");

  let entitySubtype: PortEntity["entitySubtype"] = "seaport";
  const harborType = row["Harbor Type"]?.toLowerCase() ?? "";
  if (harborType.includes("river")) {
    entitySubtype = "river_port";
  } else if (harborType.includes("lake")) {
    entitySubtype = "lake_port";
  }

  return {
    entityId: `wpi-port-${wpiNumber}`,
    entityType: "port",
    entitySubtype,
    name: row["Main Port Name"] ?? "",
    alternateName: row["Alternate Port Name"] || undefined,
    wpiNumber,
    unlocode: normalizeUnlocode(row["UN/LOCODE"]),
    countryIso2: inferCountryIso2(row["UN/LOCODE"], row["Country Code"]),
    countryName: row["Country Code"] || undefined,
    region: row["Region Name"] || undefined,
    waterBody: row["North Water Body"] || undefined,
    latitude,
    longitude,
    harborSize: row["Harbor Size"] || undefined,
    harborType: row["Harbor Type"] || undefined,
    harborUse: row["Harbor Use"] || undefined,
    facilities,
    services,
    exactSite: true,
    sourceId: "world-port-index",
  };
}

function normalizeUnlocode(unlocode?: string) {
  const normalized = unlocode?.replace(/\s+/g, "").toUpperCase();
  return normalized && normalized.length >= 5 ? normalized : undefined;
}

function inferCountryIso2(unlocode?: string, sourceCountryField?: string) {
  const normalizedUnlocode = normalizeUnlocode(unlocode);
  if (normalizedUnlocode && /^[A-Z]{2}/.test(normalizedUnlocode)) {
    return normalizedUnlocode.slice(0, 2);
  }

  const normalizedCountryField = sourceCountryField?.trim().toUpperCase();
  if (normalizedCountryField && /^[A-Z]{2}$/.test(normalizedCountryField)) {
    return normalizedCountryField;
  }

  return "";
}

export async function parseWpiCsv(filePath: string): Promise<PortEntity[]> {
  const ports: PortEntity[] = [];
  const parser = createCsvRecordStream<Partial<WpiRow>>(filePath);

  for await (const row of parser) {
    const port = normalizeWpiRow(row);
    if (port) {
      ports.push(port);
    }
  }

  return ports;
}

export function findPortsForCity(
  ports: PortEntity[],
  city: {
    name: string;
    countryIso2?: string;
    latitude: number;
    longitude: number;
  },
  maxDistanceKm = 50
): PortEntity[] {
  const normalizedCityName = city.name.toLowerCase().trim();

  return ports.filter((port) => {
    if (city.countryIso2 && port.countryIso2 !== city.countryIso2) {
      return false;
    }

    const normalizedPortName = port.name.toLowerCase().trim();
    const normalizedAlternateName = port.alternateName?.toLowerCase().trim() ?? "";

    if (normalizedPortName.includes(normalizedCityName) || normalizedAlternateName.includes(normalizedCityName)) {
      return true;
    }

    const distance = haversineDistance(city.latitude, city.longitude, port.latitude, port.longitude);
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
