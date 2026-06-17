import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CityWorkspace } from "@/features/city/components/city-workspace";

describe("CityWorkspace", () => {
  it("renders anchored dossier sections with explicit source-backed gaps", () => {
    render(
      <CityWorkspace
        commandCenterManifest={{
          generatedAt: "2026-03-25T00:00:00.000Z",
          defaultViewId: "global",
          globalIntelligence: [],
          opsTimeline: [],
          savedViews: [],
          sourceSummary: [],
          datasetInventory: [
            {
              id: "mobility-database",
              label: "Mobility Database",
              status: "downloaded_local_source",
              sourceLabels: ["Mobility Database"],
              detail: "GTFS feeds are downloaded locally but not yet published to the website.",
              websiteSurfaces: [],
              workspacePath: "/datasets/mobility-database",
            },
          ],
          tacticalLayerCatalog: [],
        }}
        panel={{
          city: {
            cityId: "geo-745044",
            slug: "geo-745044-istanbul",
            name: "Istanbul",
            aliases: [],
            countryIso2: "TR",
            countryIso3: "TUR",
            countrySlug: "turkiye",
            admin1Name: "Istanbul",
            admin1Code: "34",
            latitude: 41.0082,
            longitude: 28.9784,
            boundaryStatus: "has_boundary",
            population: 15_701_602,
            populationSource: "GeoNames",
            registrySource: "GeoNames",
            recordStatus: "active",
            isMajorCity: true,
          },
          workspace: {
            city: {
              cityId: "geo-745044",
              slug: "geo-745044-istanbul",
              name: "Istanbul",
              aliases: [],
              countryIso2: "TR",
              countryIso3: "TUR",
              countrySlug: "turkiye",
              admin1Name: "Istanbul",
              admin1Code: "34",
              latitude: 41.0082,
              longitude: 28.9784,
              boundaryStatus: "has_boundary",
              population: 15_701_602,
              populationSource: "GeoNames",
              registrySource: "GeoNames",
              recordStatus: "active",
              isMajorCity: true,
            },
            summary: "Istanbul source-backed command workspace",
            roleTags: ["logistics hub"],
            coverage: {
              economicFactbook: "verified_exact",
              investorIntel: "verified_city_presence",
              urbanIntel: "partial_coverage",
            },
            economicFactbook: [],
            investorIntel: [
              {
                indicatorId: "company-presence",
                value: 42_315,
                unit: "LEIs",
                year: 2026,
                status: "actual",
                source: {
                  id: "gleif-lei",
                  name: "GLEIF LEI",
                  updatedAt: "2026-03-21",
                  coverage: "legal-entity-city-match",
                  methodology:
                    "Active GLEIF LEI records counted when the legal or headquarters city matches the selected city.",
                  url: "https://leidata.gleif.org/",
                },
              },
            ],
            urbanIntel: [],
            economicIntel: [
              {
                indicatorId: "gdp-current-ppp",
                value: 801_599_000_000,
                unit: "USD PPP",
                year: 2023,
                status: "actual",
                source: {
                  id: "oecd-fua-economy",
                  name: "OECD FUA Economy",
                  updatedAt: "2026-03-21",
                  coverage: "oecd_fua",
                  methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
                  url: "https://www.oecd.org/",
                },
              },
              {
                indicatorId: "employment",
                value: 5_980_000,
                unit: "persons",
                year: 2023,
                status: "actual",
                source: {
                  id: "oecd-fua-labour",
                  name: "OECD FUA Labour",
                  updatedAt: "2026-03-21",
                  coverage: "oecd_fua",
                  methodology: "Latest OECD FUA labour observation matched to a city selection surface.",
                  url: "https://www.oecd.org/",
                },
              },
            ],
            transportIntel: [
              {
                indicatorId: "ports",
                value: 2,
                unit: "sites",
                year: 2026,
                status: "actual",
                source: {
                  id: "world-port-index",
                  name: "World Port Index",
                  updatedAt: "2026-03-21",
                  coverage: "city_presence",
                  methodology: "Port registry joined to city evidence bundles.",
                  url: "https://msi.nga.mil/Publications/WPI",
                },
              },
            ],
            utilitiesIntel: [
              {
                indicatorId: "utilities",
                value: 8,
                unit: "sites",
                year: 2026,
                status: "actual",
                source: {
                  id: "wri-power-plants",
                  name: "WRI Global Power Plant Database",
                  updatedAt: "2026-03-21",
                  coverage: "city_presence",
                  methodology: "Power assets linked to city evidence bundles.",
                  url: "https://datasets.wri.org/dataset/globalpowerplantdatabase",
                },
              },
            ],
            telecomIntel: [
              {
                indicatorId: "fixed-download-mbps",
                value: 239.9,
                unit: "Mbps",
                year: 2025,
                status: "actual",
                source: {
                  id: "ookla-fixed",
                  name: "Ookla Open Data",
                  updatedAt: "2026-03-21",
                  coverage: "city_selection_surface",
                  methodology: "Weighted average of fixed broadband tiles intersecting the visible city selection surface.",
                  url: "https://www.speedtest.net/insights/open-data/",
                },
              },
            ],
            environmentIntel: [
              {
                indicatorId: "pm25",
                value: 21.4,
                unit: "ug/m3",
                year: 2023,
                status: "actual",
                source: {
                  id: "who-air-quality",
                  name: "WHO Air Quality",
                  updatedAt: "2026-03-21",
                  coverage: "city_selection_surface",
                  methodology: "Latest WHO PM2.5 observation matched to a city selection surface.",
                  url: "https://www.who.int/",
                },
              },
            ],
            organizationIntel: [
              {
                indicatorId: "organizations",
                value: 142,
                unit: "sites",
                year: 2026,
                status: "actual",
                source: {
                  id: "ror",
                  name: "Research Organization Registry",
                  updatedAt: "2026-03-21",
                  coverage: "city_presence",
                  methodology: "Research organizations linked to city evidence bundles.",
                  url: "https://ror.org/",
                },
              },
            ],
            coverageBoundaryType: "admin_selection_surface",
            sourceCoverageSummary: [
              {
                label: "OECD FUA Economy",
                value: "oecd_fua",
                sources: [
                  {
                    id: "oecd-fua-economy",
                    name: "OECD FUA Economy",
                    updatedAt: "2026-03-21",
                    coverage: "oecd_fua",
                    methodology: "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
                    url: "https://www.oecd.org/",
                  },
                ],
              },
            ],
            entityCounts: {
              airport: 48,
              port: 2,
              rail_hub: 5,
              logistics_hub: 4,
              utility: 8,
              research: 142,
              company: 42315,
            },
            entityHighlights: [],
            mapLayerSummary: { availableLayers: ["cities", "ports", "utilities", "connectivity-fixed", "air-quality"] },
            sources: [
              {
                id: "geonames",
                name: "GeoNames",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Canonical city registry record",
                url: "https://www.geonames.org/",
              },
            ],
          },
          coverageShell: {
            generatedAt: "2026-03-26T00:00:00.000Z",
            cityId: "geo-745044",
            boundaryStatus: "has_boundary",
            sourceCount: 3,
            mappedCategoryCount: 2,
            documentedCategoryCount: 3,
            missingCategoryCount: 1,
            categories: [
              {
                id: "registry",
                label: "Canonical Registry",
                state: "documented",
                count: 1,
                detail: "GeoNames registry record anchors the dossier shell.",
                sourceLabels: ["GeoNames"],
              },
              {
                id: "geometry",
                label: "Geometry Surface",
                state: "mapped",
                count: 1,
                detail: "Boundary-backed city surface is available.",
                sourceLabels: ["GeoNames", "Overture Divisions"],
              },
            ],
          },
          entities: {
            entities: [],
            sources: [],
          },
          sources: {
            cityId: "geo-745044",
            sources: [
              {
                id: "geonames",
                name: "GeoNames",
                updatedAt: "2026-03-21",
                coverage: "global",
                methodology: "Canonical city registry record",
                url: "https://www.geonames.org/",
              },
            ],
          },
        }}
      />,
    );

    [
      "Economic Factbook",
      "Logistics & Transport",
      "Utilities & Energy",
      "Telecom & Connectivity",
      "Environment & Hazards",
      "Institutions & Public Services",
      "Source Coverage & Data Quality",
      "Missing Coverage & Gaps",
    ].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });

    [
      "economic-factbook",
      "logistics-transport",
      "utilities-energy",
      "telecom-connectivity",
      "environment-hazards",
      "institutions-public-services",
      "source-coverage-data-quality",
      "missing-coverage-gaps",
    ].forEach((sectionId) => {
      expect(document.getElementById(sectionId)).not.toBeNull();
    });

    expect(screen.queryByRole("heading", { name: "Investor Intelligence" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Urban Intelligence" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Infrastructure Access" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Organizations & Assets" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Source Audit" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/oecd fua economy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/world port index/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Transit Feeds")).toBeInTheDocument();
    expect(screen.getByText(/mobility database/i)).toBeInTheDocument();
    expect(screen.getByText("Hospitals & Clinics")).toBeInTheDocument();
    expect(screen.getByText(/dossier shell/i)).toBeInTheDocument();
    expect(screen.getByText(/2 mapped \/ 3 documented \/ 1 missing/i)).toBeInTheDocument();
    expect(screen.getByText(/boundary-backed city surface is available/i)).toBeInTheDocument();
  });
});
