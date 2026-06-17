import { createCsvRecordStream } from "./csv-stream";

export type AirportEntity = {
  entityId: string;
  entityType: "airport";
  entitySubtype: "large_airport" | "medium_airport" | "small_airport" | "heliport" | "seaplane_base" | "balloonport";
  name: string;
  iataCode?: string;
  icaoCode?: string;
  localCode?: string;
  latitude: number;
  longitude: number;
  elevationFt?: number;
  continent: string;
  countryIso2: string;
  admin1Code?: string;
  municipality?: string;
  scheduledService: boolean;
  gpsCode?: string;
  homeLink?: string;
  wikipediaLink?: string;
  keywords?: string;
  runwayCount?: number;
  exactSite: true;
  sourceId: "ourairports";
};

type AirportRow = {
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  icao_code: string;
  gps_code: string;
  iata_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
};

const VALID_AIRPORT_TYPES = ["large_airport", "medium_airport", "small_airport", "heliport", "seaplane_base", "balloonport"] as const;

export function normalizeAirportRow(row: Partial<AirportRow>, runwayCount?: number): AirportEntity | null {
  if (!row.ident || !row.type || !row.name) {
    return null;
  }

  if (!VALID_AIRPORT_TYPES.includes(row.type as any)) {
    return null;
  }

  const latitude = parseFloat(row.latitude_deg ?? "");
  const longitude = parseFloat(row.longitude_deg ?? "");

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  return {
    entityId: `airport-${row.ident}`,
    entityType: "airport",
    entitySubtype: row.type as AirportEntity["entitySubtype"],
    name: row.name,
    iataCode: row.iata_code || undefined,
    icaoCode: row.icao_code || row.gps_code || undefined,
    localCode: row.local_code || undefined,
    latitude,
    longitude,
    elevationFt: row.elevation_ft ? parseInt(row.elevation_ft, 10) : undefined,
    continent: row.continent ?? "",
    countryIso2: row.iso_country ?? "",
    admin1Code: row.iso_region ? row.iso_region.split("-")[1] : undefined,
    municipality: row.municipality || undefined,
    scheduledService: row.scheduled_service === "yes",
    gpsCode: row.gps_code || undefined,
    homeLink: row.home_link || undefined,
    wikipediaLink: row.wikipedia_link || undefined,
    keywords: row.keywords || undefined,
    runwayCount,
    exactSite: true,
    sourceId: "ourairports",
  };
}

export async function parseOurAirportsCsv(filePath: string): Promise<AirportEntity[]> {
  const airports: AirportEntity[] = [];
  const runwayCounts = new Map<string, number>();

  // First pass: count runways per airport
  const runwayPath = filePath.replace("airports.csv", "runways.csv");
  try {
    const runwayParser = createCsvRecordStream<{ airport_ident?: string }>(runwayPath);

    for await (const runway of runwayParser) {
      const airportIdent = runway.airport_ident;
      if (airportIdent) {
        runwayCounts.set(airportIdent, (runwayCounts.get(airportIdent) ?? 0) + 1);
      }
    }
  } catch {
    // Runways file might not exist, continue without runway counts
  }

  // Second pass: parse airports
  const parser = createCsvRecordStream<Partial<AirportRow>>(filePath);

  for await (const row of parser) {
    const runwayCount = row.ident ? runwayCounts.get(row.ident) : undefined;
    const airport = normalizeAirportRow(row, runwayCount);
    if (airport) {
      airports.push(airport);
    }
  }

  return airports;
}

export function findAirportsForCity(
  airports: AirportEntity[],
  city: {
    name: string;
    countryIso2?: string;
    admin1Code?: string;
    latitude: number;
    longitude: number;
  },
  maxDistanceKm = 50
): AirportEntity[] {
  const normalizedCityName = city.name.toLowerCase().trim();

  return airports.filter((airport) => {
    // Country match required
    if (city.countryIso2 && airport.countryIso2 !== city.countryIso2) {
      return false;
    }

    // Municipality match (strongest signal)
    if (airport.municipality) {
      const normalizedMunicipality = airport.municipality.toLowerCase().trim();
      if (normalizedMunicipality === normalizedCityName) {
        return true;
      }
    }

    // Admin1 match as secondary signal
    if (city.admin1Code && airport.admin1Code === city.admin1Code) {
      // Check distance if admin1 matches
      const distance = haversineDistance(city.latitude, city.longitude, airport.latitude, airport.longitude);
      return distance <= maxDistanceKm;
    }

    // Fallback to distance-only match
    const distance = haversineDistance(city.latitude, city.longitude, airport.latitude, airport.longitude);
    return distance <= maxDistanceKm;
  });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
