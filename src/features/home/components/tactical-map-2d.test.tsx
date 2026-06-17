import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TacticalMap2D } from "@/features/home/components/tactical-map-2d";
import * as tacticalMapModule from "@/features/home/components/tactical-map-2d";

const push = vi.fn();
const router = { push };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const citySelectionAssetPath = "/data/globe/reference/city-footprints/selectable.geojson";

const baseImageryCatalog = {
  generatedAt: "2026-03-15T00:00:00.000Z",
  defaultLayerId: "night-lights",
  layers: [
    {
      id: "night-lights",
      label: "Night Lights",
      family: "Base Maps",
      status: "published" as const,
      availableDates: ["2016-01-01"],
      minZoom: 0,
      maxZoom: 3,
      attribution: ["NASA Black Marble"],
      assetPathTemplate: "/data/globe/base-imagery/night-lights/{date}/{z}/{x}/{y}.png",
      defaultOpacity: 1,
    },
  ],
};

const globeManifest = {
  generatedAt: "2026-03-15T00:00:00.000Z",
  layers: [
    {
      id: "cities",
      label: "Cities",
      family: "Political / Admin",
      sourceLabels: ["GeoNames"],
      tier: "boot" as const,
      supportsTime: false,
      supportsCityFocus: true,
      assetPath: "/data/globe/layers/cities/vectors/current.geojson",
      bootAssetPath: "/data/globe/layers/cities/vectors/boot.geojson",
    },
    {
      id: "ports",
      label: "Ports",
      family: "Transport",
      sourceLabels: ["World Port Index"],
      tier: "interactive" as const,
      supportsTime: false,
      supportsCityFocus: true,
      assetPath: "/data/globe/layers/ports/vectors/current.geojson",
    },
  ],
};

describe("TacticalMap2D", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("mounts a 2D tactical surface and hydrates active layers from shipped manifest props", async () => {
    const mountMap = vi.fn().mockResolvedValue(() => {});

    render(
      <TacticalMap2D
        activeLayerIds={["cities", "ports"]}
        activeBaseImageryLayerId="night-lights"
        activeDate="2016-01-01"
        activeViewId="global-ops"
        baseImageryCatalog={baseImageryCatalog}
        citySelectionAssetPath={citySelectionAssetPath}
        globeManifest={globeManifest}
        mountMap={mountMap}
        searchQuery=""
        selectedCity={{
          cityId: "geo-1",
          name: "Ankara",
          slug: "ankara",
          latitude: 39.9334,
          longitude: 32.8597,
        }}
      />,
    );

    expect(screen.getByTestId("tactical-2d-surface")).toBeInTheDocument();
    expect(screen.queryByText(/^2d ops$/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mountMap).toHaveBeenCalledTimes(1);
    });

    expect(mountMap).toHaveBeenCalledWith(
      expect.objectContaining({
        citySelectionAssetPath,
      }),
    );
  });

  it("keeps the 2D surface readable while the map boots", () => {
    const mountMap = vi.fn().mockResolvedValue({
      destroy: () => {},
      update: () => {},
    });

    render(
      <TacticalMap2D
        activeLayerIds={[]}
        activeBaseImageryLayerId="night-lights"
        activeViewId="global-ops"
        baseImageryCatalog={baseImageryCatalog}
        citySelectionAssetPath={citySelectionAssetPath}
        globeManifest={{ generatedAt: "2026-03-15T00:00:00.000Z", layers: [] }}
        mountMap={mountMap}
        searchQuery=""
      />,
    );

    expect(screen.getByTestId("tactical-2d-surface")).toBeInTheDocument();
    expect(screen.queryByTestId("hovered-city-label")).not.toBeInTheDocument();
  });

  it("renders a hover label when the map reports a hovered city marker", async () => {
    const mountMap = vi.fn().mockImplementation(async (args) => {
      args.onCityHover({
        cityId: "geo-323786",
        slug: "geo-323786-ankara",
        name: "Ankara",
        countryIso3: "TUR",
        latitude: 39.9334,
        longitude: 32.8597,
        pointX: 120,
        pointY: 80,
      });

      return {
        destroy: () => {},
        update: () => {},
      };
    });

    render(
      <TacticalMap2D
        activeLayerIds={["ports"]}
        activeBaseImageryLayerId="night-lights"
        activeDate="2016-01-01"
        activeViewId="global-ops"
        baseImageryCatalog={baseImageryCatalog}
        citySelectionAssetPath={citySelectionAssetPath}
        globeManifest={globeManifest}
        mountMap={mountMap}
        searchQuery=""
      />,
    );

    expect(await screen.findByTestId("hovered-city-label")).toHaveTextContent("Ankara");
    expect(screen.getByTestId("hovered-city-label")).toHaveTextContent("TUR");
  });

  it("pushes a city selection into the homepage query when a city marker is clicked", async () => {
    const mountMap = vi.fn().mockImplementation(async (args) => {
      args.onCitySelect({
        cityId: "geo-323786",
        slug: "geo-323786-ankara",
        name: "Ankara",
        countryIso3: "TUR",
        latitude: 39.9334,
        longitude: 32.8597,
        pointX: 120,
        pointY: 80,
      });

      return {
        destroy: () => {},
        update: () => {},
      };
    });

    render(
      <TacticalMap2D
        activeLayerIds={["ports"]}
        activeBaseImageryLayerId="night-lights"
        activeDate="2016-01-01"
        activeViewId="global-ops"
        baseImageryCatalog={baseImageryCatalog}
        citySelectionAssetPath={citySelectionAssetPath}
        globeManifest={globeManifest}
        mountMap={mountMap}
        searchQuery="ankara"
      />,
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledTimes(1);
    });

    expect(push).toHaveBeenCalledWith(expect.stringContaining("city=geo-323786-ankara"), {
      scroll: false,
    });
  });

  it("extracts selection targets only from visible city-selection features", () => {
    expect(
      tacticalMapModule.extractCityTarget({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [32.8, 39.9],
              [32.9, 39.9],
              [32.9, 40],
              [32.8, 40],
              [32.8, 39.9],
            ],
          ],
        },
        properties: {
          cityId: "geo-323786",
          slug: "geo-323786-ankara",
          name: "Ankara",
          countryIso3: "TUR",
          latitude: 39.9334,
          longitude: 32.8597,
        },
      } as never),
    ).toMatchObject({ slug: "geo-323786-ankara" });

    expect(
      tacticalMapModule.extractCityTarget({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [32.8, 39.9],
              [32.9, 39.9],
              [32.9, 40],
              [32.8, 40],
              [32.8, 39.9],
            ],
          ],
        },
        properties: {
          cityId: "geo-323786",
          name: "Ankara",
          countryIso3: "TUR",
          latitude: 39.9334,
          longitude: 32.8597,
        },
      } as never),
    ).toBeNull();
  });

});
