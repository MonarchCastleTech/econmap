import { createCsvRecordStream } from "./csv-stream";

/**
 * USGS Mineral Resources Data System (MRDS) — public-domain global mineral-site inventory
 * with exact coordinates. https://mrdata.usgs.gov/mrds/  (rdbms-tab-all.zip)
 *
 * Honesty note: USGS ceased systematic MRDS updates in 2011 and the corpus is US-heavy. The
 * frozen/historical nature is surfaced to the UI via the visible "USGS Mineral Resources Data
 * System" source label + methodology text (see resolve-entities.ts createSourceMeta). Maps to
 * the existing closed `utility` entity type — no schema/enum change.
 */
export type MineralSiteEntity = {
  entityId: string;
  entityType: "utility";
  entitySubtype: "mineral_site";
  name: string;
  latitude: number;
  longitude: number;
  commodity?: string;
  devStat?: string;
  countryName?: string;
  exactSite: true;
  sourceId: "usgs-mrds";
};

type MrdsRow = {
  dep_id: string;
  mrds_id: string;
  site_name: string;
  latitude: string;
  longitude: string;
  country: string;
  commod1: string;
  dev_stat: string;
};

export function normalizeMrdsRow(row: Partial<MrdsRow>): MineralSiteEntity | null {
  const name = row.site_name?.trim();
  if (!name) {
    return null;
  }

  const latitude = parseFloat(row.latitude ?? "");
  const longitude = parseFloat(row.longitude ?? "");
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  // dep_id is the documented MRDS primary key; fall back to mrds_id only if absent.
  const id = (row.dep_id || row.mrds_id || "").trim();
  if (!id) {
    return null;
  }

  return {
    entityId: `mineral-site-${id}`,
    entityType: "utility",
    entitySubtype: "mineral_site",
    name,
    latitude,
    longitude,
    commodity: row.commod1?.trim() || undefined,
    devStat: row.dev_stat?.trim() || undefined,
    countryName: row.country?.trim() || undefined,
    exactSite: true,
    sourceId: "usgs-mrds",
  };
}

export async function parseMrdsCsv(filePath: string): Promise<MineralSiteEntity[]> {
  const sites: MineralSiteEntity[] = [];
  const parser = createCsvRecordStream<Partial<MrdsRow>>(filePath);

  for await (const row of parser) {
    const site = normalizeMrdsRow(row);
    if (site) {
      sites.push(site);
    }
  }

  return sites;
}

export function findMineralSitesForCity(
  sites: MineralSiteEntity[],
  city: {
    name: string;
    latitude: number;
    longitude: number;
  },
  maxDistanceKm = 30,
): MineralSiteEntity[] {
  // The MRDS country field is a NAME (not an ISO code), so it is NOT used as a join gate.
  // Attribution is purely proximity (small radius) so dossiers list only sites in the immediate
  // urban footprint, not every distant mine.
  return sites.filter((site) => {
    const distance = haversineDistance(city.latitude, city.longitude, site.latitude, site.longitude);
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
