import { createCsvRecordStream } from "./csv-stream";

export type PowerPlantEntity = {
  entityId: string;
  entityType: "utility";
  entitySubtype: "power_plant";
  name: string;
  countryIso2: string;
  countryIso3?: string;
  countryName: string;
  admin1Name?: string;
  admin2Name?: string;
  latitude: number;
  longitude: number;
  primaryFuel: string;
  secondaryFuel?: string;
  capacityMw: number;
  capacityUnit: string;
  commissioningYear?: number;
  owner?: string;
  operator?: string;
  source?: string;
  exactSite: true;
  sourceId: "wri-gppd";
};

type PowerPlantRow = {
  country: string;
  country_long: string;
  name: string;
  gppd_idnr: string;
  capacity_mw: string;
  latitude: string;
  longitude: string;
  primary_fuel: string;
  secondary_fuel: string;
  commissioning_year: string;
  owner: string;
  operator: string;
  source: string;
  url: string;
  geolocation_source: string;
  year_of_capacity_data: string;
  generation_gwh: string;
  other_fuel1: string;
  other_fuel2: string;
  other_fuel3: string;
  estimated_generation_gwh: string;
};

export function normalizePowerPlantRow(row: Partial<PowerPlantRow>): PowerPlantEntity | null {
  if (!row.gppd_idnr || !row.name || !row.primary_fuel) {
    return null;
  }

  const latitude = parseFloat(row.latitude ?? "");
  const longitude = parseFloat(row.longitude ?? "");
  const capacityMw = parseFloat(row.capacity_mw ?? "");

  if (isNaN(latitude) || isNaN(longitude) || isNaN(capacityMw)) {
    return null;
  }

  const commissioningYear = row.commissioning_year ? parseInt(row.commissioning_year, 10) : undefined;

  return {
    entityId: `power-plant-${row.gppd_idnr}`,
    entityType: "utility",
    entitySubtype: "power_plant",
    name: row.name,
    countryIso2: row.country ?? "",
    countryIso3: row.country ?? "",
    countryName: row.country_long ?? "",
    admin1Name: undefined,
    admin2Name: undefined,
    latitude,
    longitude,
    primaryFuel: row.primary_fuel,
    secondaryFuel: row.secondary_fuel || undefined,
    capacityMw,
    capacityUnit: "MW",
    commissioningYear: isNaN(commissioningYear!) ? undefined : commissioningYear,
    owner: row.owner || undefined,
    operator: row.operator || undefined,
    source: row.source || undefined,
    exactSite: true,
    sourceId: "wri-gppd",
  };
}

export async function parseWriPowerPlantsCsv(filePath: string): Promise<PowerPlantEntity[]> {
  const plants: PowerPlantEntity[] = [];
  const parser = createCsvRecordStream<Partial<PowerPlantRow>>(filePath);

  for await (const row of parser) {
    const plant = normalizePowerPlantRow(row);
    if (plant) {
      plants.push(plant);
    }
  }

  return plants;
}

export function findPowerPlantsForCity(
  plants: PowerPlantEntity[],
  city: {
    name: string;
    countryIso2?: string;
    countryIso3?: string;
    admin1Name?: string;
    latitude: number;
    longitude: number;
  },
  maxDistanceKm = 100
): PowerPlantEntity[] {
  const normalizedCityName = city.name.toLowerCase().trim();

  return plants.filter((plant) => {
    if (!matchesCountryCode(plant, city)) {
      return false;
    }

    if (city.admin1Name && plant.admin1Name) {
      const normalizedAdmin1 = plant.admin1Name.toLowerCase().trim();
      if (normalizedAdmin1 === city.admin1Name.toLowerCase().trim()) {
        const distance = haversineDistance(city.latitude, city.longitude, plant.latitude, plant.longitude);
        return distance <= maxDistanceKm;
      }
    }

    const distance = haversineDistance(city.latitude, city.longitude, plant.latitude, plant.longitude);
    return distance <= maxDistanceKm;
  });
}

function matchesCountryCode(
  plant: Pick<PowerPlantEntity, "countryIso2" | "countryIso3">,
  city: { countryIso2?: string; countryIso3?: string },
) {
  const plantCodes = [plant.countryIso2, plant.countryIso3]
    .map(normalizeCountryCode)
    .filter((code): code is string => Boolean(code));
  const cityCodes = [city.countryIso2, city.countryIso3]
    .map(normalizeCountryCode)
    .filter((code): code is string => Boolean(code));

  if (cityCodes.length === 0 || plantCodes.length === 0) {
    return true;
  }

  return cityCodes.some((cityCode) => plantCodes.includes(cityCode));
}

function normalizeCountryCode(value?: string) {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2,3}$/.test(normalized) ? normalized : undefined;
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
