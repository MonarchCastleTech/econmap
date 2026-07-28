import type { CityAlert } from "@/domain/city-intelligence-schemas";

const SEVERITY_ORDER: Record<CityAlert["severity"], number> = {
  critical: 0,
  warning: 1,
  watch: 2,
  info: 3,
};

export function alertsForWatchlist(
  alerts: readonly CityAlert[],
  cityIds: readonly string[],
  limit = 100,
): CityAlert[] {
  if (cityIds.length === 0) return [];
  const selected = new Set(cityIds);
  return alerts
    .filter((alert) => selected.has(alert.cityId))
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.detectedAt.localeCompare(a.detectedAt) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}
