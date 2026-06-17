/**
 * Uniform lat/lon grid index for fast "entities near a city" lookups.
 *
 * The city pipeline previously scanned every entity for every city (O(cities * entities) — the
 * ROR+airport scans alone are tens of billions of ops, so full runs never completed). This grid
 * buckets entities into ~cellDeg-degree cells; a city queries only the cells covering its search
 * radius, turning each per-city lookup into O(local density).
 *
 * queryRadius returns a superset of the entities within radiusKm (the caller still applies the
 * exact haversine/name/country filter); it never misses an in-radius entity (longitude span is
 * widened by 1/cos(lat) so high-latitude cities are covered).
 */

const KM_PER_DEG = 111.32;

export type SpatialGrid<T> = {
  cellDeg: number;
  cells: Map<string, T[]>;
};

function cellKey(latCell: number, lonCell: number): string {
  return `${latCell}:${lonCell}`;
}

export function buildSpatialGrid<T>(
  items: T[],
  getLatLon: (item: T) => { lat: number; lon: number } | null,
  cellDeg = 1,
): SpatialGrid<T> {
  const cells = new Map<string, T[]>();
  for (const item of items) {
    const ll = getLatLon(item);
    if (!ll || !Number.isFinite(ll.lat) || !Number.isFinite(ll.lon)) continue;
    if (ll.lat === 0 && ll.lon === 0) continue; // null-island placeholder, not a real location
    const key = cellKey(Math.floor(ll.lat / cellDeg), Math.floor(ll.lon / cellDeg));
    const bucket = cells.get(key);
    if (bucket) bucket.push(item);
    else cells.set(key, [item]);
  }
  return { cellDeg, cells };
}

export function queryRadius<T>(
  grid: SpatialGrid<T>,
  lat: number,
  lon: number,
  radiusKm: number,
): T[] {
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const latSpan = Math.max(1, Math.ceil(radiusKm / (KM_PER_DEG * grid.cellDeg)));
  const lonSpan = Math.max(1, Math.ceil(radiusKm / (KM_PER_DEG * cosLat * grid.cellDeg)));
  const latCell = Math.floor(lat / grid.cellDeg);
  const lonCell = Math.floor(lon / grid.cellDeg);

  const results: T[] = [];
  for (let dLat = -latSpan; dLat <= latSpan; dLat++) {
    for (let dLon = -lonSpan; dLon <= lonSpan; dLon++) {
      const bucket = grid.cells.get(cellKey(latCell + dLat, lonCell + dLon));
      if (bucket) {
        for (const item of bucket) results.push(item);
      }
    }
  }
  return results;
}

/** Great-circle distance in km (shared so callers filter the grid candidate set consistently). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
