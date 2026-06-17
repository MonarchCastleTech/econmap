import { describe, expect, it } from "vitest";

import { pickCityIntelEntityRows } from "@/features/home/components/home-stage";

describe("pickCityIntelEntityRows", () => {
  it("prefers a mix of entity types for the city brief", () => {
    const rows = pickCityIntelEntityRows(
      [
        {
          entityId: "airport-1",
          entityName: "Heliport Alpha",
          entityType: "airport",
          entitySubtype: "heliport",
          presenceType: "airport",
          exactSite: true,
        },
        {
          entityId: "airport-2",
          entityName: "Heliport Bravo",
          entityType: "airport",
          entitySubtype: "heliport",
          presenceType: "airport",
          exactSite: true,
        },
        {
          entityId: "airport-3",
          entityName: "Main Airport",
          entityType: "airport",
          entitySubtype: "large_airport",
          presenceType: "airport",
          exactSite: true,
        },
        {
          entityId: "utility-1",
          entityName: "West Power Plant",
          entityType: "utility",
          entitySubtype: "power_plant",
          presenceType: "power_asset",
          exactSite: true,
        },
        {
          entityId: "port-1",
          entityName: "North Port",
          entityType: "port",
          presenceType: "port",
          exactSite: true,
        },
        {
          entityId: "research-1",
          entityName: "City Research Institute",
          entityType: "research",
          presenceType: "research",
          exactSite: true,
        },
      ] as Array<{
        entityId: string;
        entityName: string;
        entitySubtype?: string;
        entityType: string;
        exactSite: boolean;
        presenceType: string;
      }>,
      4,
    );

    expect(rows.map((row) => row.entityType)).toEqual(["utility", "port", "research", "airport"]);
    expect(rows[3]?.entityName).toBe("Main Airport");
  });
});
