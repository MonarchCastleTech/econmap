import { describe, expect, it } from "vitest";

import { createTacticalGlobeStore } from "@/store/tactical-globe-store";

describe("tactical globe store", () => {
  it("boots with the night-lights imagery family selected", () => {
    const store = createTacticalGlobeStore();

    expect(store.getState().activeBaseImageryLayerId).toBe("night-lights");
  });

  it("tracks active imagery date and layer visibility", () => {
    const store = createTacticalGlobeStore();

    store.getState().setActiveDate("2026-03-15");
    store.getState().toggleLayer("cities");

    expect(store.getState().activeDate).toBe("2026-03-15");
    expect(store.getState().activeLayerIds).toContain("cities");
  });

  it("tracks imagery family, console panels, and selected points", () => {
    const store = createTacticalGlobeStore();

    store.getState().setActiveBaseImageryLayerId("night-lights");
    store.getState().setLegendOpen(true);
    store.getState().setSettingsOpen(true);
    store.getState().setSelectedPoint({
      latitude: 41.0082,
      longitude: 28.9784,
      nearestPlaceName: "Istanbul",
      timestamp: "2026-03-15T00:00:00.000Z",
      activeLayerIds: ["cities", "airports"],
    });

    expect(store.getState().activeBaseImageryLayerId).toBe("night-lights");
    expect(store.getState().isLegendOpen).toBe(true);
    expect(store.getState().isSettingsOpen).toBe(true);
    expect(store.getState().selectedPoint?.nearestPlaceName).toBe("Istanbul");
  });
});
