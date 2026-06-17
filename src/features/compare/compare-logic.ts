import { getCompareRows } from "@/lib/factbook";

export function buildCompareTable(slugs: string[], metricIds: string[]) {
  return getCompareRows(slugs, metricIds);
}

export function normalizeCompareValues(
  rows: Array<{
    country: { slug: string; name: string };
    values: Record<string, number | null>;
  }>,
  metricId: string,
) {
  const max = Math.max(...rows.map((row) => row.values[metricId] ?? 0), 0);

  return rows.map((row) => {
    const value = row.values[metricId] ?? 0;
    const normalizedValue = max === 0 ? 0 : Math.round((value / max) * 100);

    return {
      ...row,
      normalizedValue,
    };
  });
}
