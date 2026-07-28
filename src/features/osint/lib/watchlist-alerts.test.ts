import { describe, expect, it } from "vitest";

import type { CityAlert } from "@/domain/city-intelligence-schemas";
import { alertsForWatchlist } from "@/features/osint/lib/watchlist-alerts";

function alert(
  id: string,
  cityId: string,
  severity: CityAlert["severity"],
  detectedAt: string,
): CityAlert {
  return {
    id,
    cityId,
    topic: "hazard",
    severity,
    changeType: "added",
    title: id,
    summary: id,
    sourceId: "usgs-earthquakes",
    observedAt: detectedAt,
    detectedAt,
  };
}

describe("alertsForWatchlist", () => {
  it("filters saved cities and orders by severity then recency", () => {
    const result = alertsForWatchlist(
      [
        alert("old-warning", "geo-1", "warning", "2026-07-27T00:00:00.000Z"),
        alert("critical", "geo-2", "critical", "2026-07-26T00:00:00.000Z"),
        alert("ignored", "geo-3", "critical", "2026-07-28T00:00:00.000Z"),
        alert("new-warning", "geo-1", "warning", "2026-07-28T00:00:00.000Z"),
      ],
      ["geo-1", "geo-2"],
    );

    expect(result.map((item) => item.id)).toEqual([
      "critical",
      "new-warning",
      "old-warning",
    ]);
  });

  it("returns no alerts for an empty watchlist", () => {
    expect(alertsForWatchlist([alert("a", "geo-1", "info", "2026-07-28T00:00:00.000Z")], []))
      .toEqual([]);
  });
});
