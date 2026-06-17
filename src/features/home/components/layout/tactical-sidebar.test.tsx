import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TacticalSidebar } from "@/features/home/components/layout/tactical-sidebar";

describe("TacticalSidebar", () => {
  it("renders a city-first analyst rail with evidence sections, watchlists, and recent cities", () => {
    render(
      <TacticalSidebar
        activeBaseImageryLayerId="night-lights"
        activeLayerIdsValue="airports,transit-feeds"
        analystSections={[
          {
            id: "dossier-sections",
            title: "Dossier Sections",
            description: "City dossier jump points and section readiness.",
            rows: [
              {
                id: "economic-factbook",
                label: "Economic Factbook",
                state: "documented",
                mappedCount: 0,
                documentedCount: 2,
                queuedDatasetCount: 0,
                detail: "Observed city-scale output, labour, and population coverage.",
                sourceLabels: ["GeoNames", "OECD FUA Economy"],
                href: "/city/geo-745044-istanbul#economic-factbook",
              },
              {
                id: "logistics-transport",
                label: "Logistics & Transport",
                state: "mapped",
                mappedCount: 3,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "Mapped transport evidence and exact-site assets for the selected city.",
                sourceLabels: ["OurAirports", "World Port Index", "Mobility Database"],
                href: "/city/geo-745044-istanbul#logistics-transport",
              },
            ],
          },
          {
            id: "infrastructure-categories",
            title: "Infrastructure Categories",
            description: "High-level map coverage across infrastructure domains.",
            rows: [
              {
                id: "transport-category",
                label: "Transport",
                state: "mapped",
                mappedCount: 3,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "Published transport map layers and city-linked evidence.",
                sourceLabels: ["OurAirports", "Mobility Database"],
              },
              {
                id: "utilities-category",
                label: "Utilities & Energy",
                state: "queued",
                mappedCount: 0,
                documentedCount: 0,
                queuedDatasetCount: 1,
                detail: "Power and utility datasets are catalogued but not fully mapped in this city.",
                sourceLabels: ["WRI Global Power Plant Database"],
              },
            ],
          },
          {
            id: "institutions-public-services",
            title: "Institutions / Public Services",
            description: "Research, civic, and public-service evidence coverage.",
            rows: [
              {
                id: "research-anchors",
                label: "Research Anchors",
                state: "mapped",
                mappedCount: 12,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "Research institutes and universities with published map coverage.",
                sourceLabels: ["ROR"],
                active: true,
                href: "/?city=geo-745044-istanbul&view=global-ops&layers=airports,transit-feeds,research&base=night-lights",
              },
              {
                id: "hospitals-clinics",
                label: "Hospitals & Clinics",
                state: "missing",
                mappedCount: 0,
                documentedCount: 0,
                queuedDatasetCount: 0,
                detail: "No public hospital registry is integrated for this city yet.",
                sourceLabels: [],
              },
            ],
          },
          {
            id: "telecom-connectivity",
            title: "Telecom / Connectivity",
            description: "Published telecom surfaces and city connectivity observations.",
            rows: [
              {
                id: "fixed-broadband",
                label: "Fixed Broadband",
                state: "mapped",
                mappedCount: 1,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "Published fixed broadband layer and city performance observation.",
                sourceLabels: ["Ookla"],
                href: "/?city=geo-745044-istanbul&view=global-ops&layers=airports,transit-feeds,connectivity-fixed&base=night-lights",
              },
            ],
          },
          {
            id: "utilities-energy",
            title: "Utilities / Energy",
            description: "Power, grid, and utility asset coverage.",
            rows: [
              {
                id: "power-plants-utilities",
                label: "Power Plants & Utilities",
                state: "queued",
                mappedCount: 0,
                documentedCount: 0,
                queuedDatasetCount: 1,
                detail: "Utility dataset is present but this city surface is not yet published.",
                sourceLabels: ["WRI Global Power Plant Database"],
                href: "/datasets/wri-global-power-plant-database",
              },
            ],
          },
          {
            id: "logistics-transport",
            title: "Logistics / Transport",
            description: "Air, port, rail, logistics, and transit coverage.",
            rows: [
              {
                id: "airports",
                label: "Airports",
                state: "mapped",
                mappedCount: 2,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "Exact-site aviation assets and airport-linked city evidence.",
                sourceLabels: ["OurAirports"],
                active: true,
                href: "/?city=geo-745044-istanbul&view=global-ops&layers=transit-feeds&base=night-lights",
              },
              {
                id: "transit-feeds",
                label: "Transit Feeds",
                state: "mapped",
                mappedCount: 27,
                documentedCount: 3,
                queuedDatasetCount: 0,
                detail: "GTFS/public-transit feed evidence for city transport operations.",
                sourceLabels: ["Mobility Database"],
                active: true,
                href: "/?city=geo-745044-istanbul&view=global-ops&layers=airports&base=night-lights",
              },
            ],
          },
          {
            id: "environment-hazards",
            title: "Environment / Hazards",
            description: "Air, water, and environmental risk evidence.",
            rows: [
              {
                id: "air-quality",
                label: "Air Quality",
                state: "documented",
                mappedCount: 0,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "City air-quality observation is documented in the dossier.",
                sourceLabels: ["WHO Air Quality"],
              },
            ],
          },
          {
            id: "source-coverage-data-quality",
            title: "Source Coverage / Data Quality",
            description: "Coverage states and direct source lineage for this city.",
            rows: [
              {
                id: "coverage:GeoNames",
                label: "GeoNames",
                state: "documented",
                mappedCount: 0,
                documentedCount: 1,
                queuedDatasetCount: 0,
                detail: "verified_exact",
                sourceLabels: ["GeoNames"],
              },
            ],
          },
          {
            id: "missing-coverage",
            title: "Missing Coverage / Gaps",
            description: "Explicitly tracked missing or queued evidence coverage.",
            rows: [
              {
                id: "schools",
                label: "Schools",
                state: "missing",
                mappedCount: 0,
                documentedCount: 0,
                queuedDatasetCount: 0,
                detail: "No integrated school facility registry is published for this city.",
                sourceLabels: [],
              },
            ],
          },
        ]}
        datasetWorkspaceSummary={{
          href: "/datasets",
          label: "Dataset explorer",
          meta: "inspect source workspaces and parser status",
        }}
        featuredCities={[
          {
            href: "/?city=geo-745044-istanbul",
            meta: "Istanbul / TUR",
            name: "Istanbul",
            populationLabel: "15.7M",
            selected: true,
          },
          {
            href: "/?city=geo-323786-ankara",
            meta: "Ankara / TUR",
            name: "Ankara",
            populationLabel: "3.5M",
            selected: false,
          },
        ]}
        recentCities={[
          {
            href: "/?city=geo-323786-ankara",
            meta: "Ankara / TUR",
            name: "Ankara",
            populationLabel: "3.5M",
            selected: false,
          },
        ]}
        searchQuery=""
        searchResults={[]}
        selectedCityIntel={{
          kind: "selected-city",
          cityName: "Istanbul",
          cityMeta: "Istanbul / TUR",
          summary: "Istanbul source-backed command workspace",
          workspaceHref: "/city/geo-745044-istanbul",
          clearHref: "/",
          coverageBadges: ["economic", "investor", "urban"],
          sourceLabels: ["GeoNames", "OurAirports", "Mobility Database"],
          metricRows: [
            { label: "Population", value: "15.7M persons", sourceLabel: "GeoNames" },
            { label: "GDP", value: "801.6B USD PPP", sourceLabel: "OECD" },
            { label: "Transit Feeds", value: "27 feeds", sourceLabel: "Mobility Database" },
            { label: "Air Quality", value: "18 ug/m3", sourceLabel: "WHO Air Quality" },
          ],
          infrastructureRows: [
            { label: "Airports", value: "2" },
            { label: "Transit Feeds", value: "27" },
            { label: "Research Anchors", value: "12" },
          ],
          entityRows: [
            { entityName: "Istanbul Airport", entityTypeLabel: "Airport", presenceLabel: "Airport", exactSite: true },
          ],
        }}
        selectedViewId="global-ops"
        selectedViewLabel="Global Ops"
        watchlists={[
          {
            id: "osint-compare-set",
            label: "OSINT compare set",
            description: "Shared city-first compare basket for transport, utilities, telecom, environment, and institutional evidence.",
            cityCount: 4,
            cityLabels: ["Istanbul", "Ankara", "Rome"],
            sourceLabels: ["OurAirports", "Mobility Database", "Ookla"],
          },
        ]}
      />,
    );

    expect(screen.getByTestId("tactical-command-rail")).toHaveAttribute("data-layout", "mission-console");
    expect(screen.queryByText(/^layers$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^active layers$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^city jump$/i)).toBeInTheDocument();
    expect(screen.getByText(/^dossier sections$/i)).toBeInTheDocument();
    expect(screen.getByText(/^infrastructure categories$/i)).toBeInTheDocument();
    expect(screen.getByText(/^institutions \/ public services$/i)).toBeInTheDocument();
    expect(screen.getByText(/^telecom \/ connectivity$/i)).toBeInTheDocument();
    expect(screen.getByText(/^utilities \/ energy$/i)).toBeInTheDocument();
    expect(screen.getByText(/^logistics \/ transport$/i)).toBeInTheDocument();
    expect(screen.getByText(/^environment \/ hazards$/i)).toBeInTheDocument();
    expect(screen.getByText(/^source coverage \/ data quality$/i)).toBeInTheDocument();
    expect(screen.getByText(/^missing coverage \/ gaps$/i)).toBeInTheDocument();
    expect(screen.getByText(/^saved watchlists \/ compare sets$/i)).toBeInTheDocument();
    expect(screen.getByText(/^recently viewed cities$/i)).toBeInTheDocument();
    expect(screen.getByText(/^osint compare set$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^ankara$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^mapped$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^documented$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^queued$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^missing$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^2 mapped$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^1 documented$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^1 queued$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^27 mapped$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^mobility database$/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /^open full city dossier$/i })).toBeInTheDocument();

    const orderedLabels = [
      screen.getByText(/^city jump$/i),
      screen.getByText(/^dossier sections$/i),
      screen.getByText(/^infrastructure categories$/i),
      screen.getByText(/^institutions \/ public services$/i),
      screen.getByText(/^telecom \/ connectivity$/i),
      screen.getByText(/^utilities \/ energy$/i),
      screen.getByText(/^logistics \/ transport$/i),
      screen.getByText(/^environment \/ hazards$/i),
      screen.getByText(/^source coverage \/ data quality$/i),
      screen.getByText(/^missing coverage \/ gaps$/i),
      screen.getByText(/^saved watchlists \/ compare sets$/i),
      screen.getByText(/^recently viewed cities$/i),
    ];

    for (let index = 0; index < orderedLabels.length - 1; index += 1) {
      expect(
        orderedLabels[index].compareDocumentPosition(orderedLabels[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});
