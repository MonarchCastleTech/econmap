import { describe, it, expect } from "vitest";

import { normalizeMrdsRow, findMineralSitesForCity } from "./usgs-mrds-parser";

describe("normalizeMrdsRow", () => {
  it("maps a valid MRDS row to a utility/mineral_site entity", () => {
    const entity = normalizeMrdsRow({
      dep_id: "10012345",
      mrds_id: "M123",
      site_name: "Example Copper Mine",
      latitude: "39.5",
      longitude: "-105.2",
      country: "United States",
      commod1: "Copper",
      dev_stat: "Producer",
    });
    expect(entity).not.toBeNull();
    expect(entity!.entityId).toBe("mineral-site-10012345");
    expect(entity!.entityType).toBe("utility");
    expect(entity!.entitySubtype).toBe("mineral_site");
    expect(entity!.sourceId).toBe("usgs-mrds");
    expect(entity!.latitude).toBeCloseTo(39.5);
    expect(entity!.longitude).toBeCloseTo(-105.2);
    expect(entity!.commodity).toBe("Copper");
    expect(entity!.countryName).toBe("United States");
    expect(entity!.exactSite).toBe(true);
  });

  it("falls back to mrds_id when dep_id is missing", () => {
    const entity = normalizeMrdsRow({
      mrds_id: "M999",
      site_name: "Fallback Site",
      latitude: "10",
      longitude: "20",
    });
    expect(entity!.entityId).toBe("mineral-site-M999");
  });

  it("returns null for missing site name or non-numeric coordinates", () => {
    expect(normalizeMrdsRow({ dep_id: "1", latitude: "1", longitude: "2" })).toBeNull();
    expect(
      normalizeMrdsRow({ dep_id: "1", site_name: "No Coords", latitude: "x", longitude: "y" }),
    ).toBeNull();
    expect(
      normalizeMrdsRow({ site_name: "No Id", dep_id: "", mrds_id: "", latitude: "1", longitude: "2" }),
    ).toBeNull();
  });
});

describe("findMineralSitesForCity", () => {
  const sites = [
    {
      entityId: "mineral-site-near",
      entityType: "utility" as const,
      entitySubtype: "mineral_site" as const,
      name: "Near Mine",
      latitude: 39.51,
      longitude: -105.21,
      exactSite: true as const,
      sourceId: "usgs-mrds" as const,
    },
    {
      entityId: "mineral-site-far",
      entityType: "utility" as const,
      entitySubtype: "mineral_site" as const,
      name: "Far Mine",
      latitude: 45.0,
      longitude: -110.0,
      exactSite: true as const,
      sourceId: "usgs-mrds" as const,
    },
  ];

  it("includes sites within the radius and excludes distant ones (proximity only, no country gate)", () => {
    const found = findMineralSitesForCity(sites, { name: "Denver", latitude: 39.5, longitude: -105.2 }, 30);
    expect(found.map((s) => s.entityId)).toEqual(["mineral-site-near"]);
  });
});
