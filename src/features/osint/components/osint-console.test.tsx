import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const WATCHLIST = vi.hoisted(() => ({
  items: ["geo-1-portville"],
  toggle: vi.fn(),
}));

// Minimal fixtures shaped like the real client returns (the component reads a small subset).
const INDEX = [
  { cityId: "geo-1", slug: "geo-1-portville", name: "Portville", aliases: [], countryIso3: "USA", admin1Name: "California", population: 900_000, isMajorCity: true },
  { cityId: "geo-2", slug: "geo-2-smalltown", name: "Smalltown", aliases: [], countryIso3: "USA", admin1Name: "Texas", population: 40_000, isMajorCity: false },
];

const PORTVILLE_ENTITIES = {
  cityId: "geo-1",
  entities: [
    { entityId: "e1", cityId: "geo-1", entityName: "Big Harbor", entityType: "port", presenceType: "port", exactSite: true, geometryMode: "exact", sources: [], lastVerifiedAt: "2026", confidenceState: "verified_exact" },
    { entityId: "e2", cityId: "geo-1", entityName: "Tech University", entityType: "research", presenceType: "research", exactSite: false, geometryMode: "city_presence", sources: [], lastVerifiedAt: "2026", confidenceState: "verified_city_presence" },
  ],
  sources: [{ id: "wri", name: "WRI Global Power Plant Database", updatedAt: "2026", coverage: "x", methodology: "y" }],
};

const PORTVILLE_COVERAGE = {
  generatedAt: "2026", cityId: "geo-1", boundaryStatus: "point_only", sourceCount: 2,
  mappedCategoryCount: 1, documentedCategoryCount: 0, missingCategoryCount: 1,
  categories: [{ id: "ports", label: "Ports", state: "mapped", count: 1, detail: "1 port mapped", sourceLabels: ["WRI Global Power Plant Database"] }],
};

vi.mock("@/lib/city-data-client", () => ({
  loadCitySearchIndex: vi.fn(async () => INDEX),
  loadCityEntities: vi.fn(async (id: string) => (id === "geo-1" ? PORTVILLE_ENTITIES : null)),
  loadCityCoverageShell: vi.fn(async (id: string) => (id === "geo-1" ? PORTVILLE_COVERAGE : null)),
}));

vi.mock("@/lib/city-intelligence-client", () => ({
  loadCityIntelligence: vi.fn(async (cityId: string) => ({
    schemaVersion: "1.0",
    generatedAt: "2026-07-28T00:00:00.000Z",
    cityId,
    telecomEvidence: "unknown",
    geographies: [],
    observations: [],
    deltas: [],
    alerts: [],
    sourceStatuses: [],
  })),
  loadCityAlerts: vi.fn(async () => [
    {
      id: "alert-1",
      cityId: "geo-1",
      topic: "hazard",
      severity: "warning",
      changeType: "added",
      title: "Earthquake detected",
      summary: "A nearby event was detected.",
      sourceId: "usgs-earthquakes",
      observedAt: "2026-07-28T00:00:00.000Z",
      detectedAt: "2026-07-28T00:00:00.000Z",
    },
  ]),
}));

vi.mock("@/store/watchlist-store", () => ({
  useWatchlistStore: (selector: (state: typeof WATCHLIST) => unknown) =>
    selector(WATCHLIST),
}));

import { OsintConsole } from "@/features/osint/components/osint-console";

describe("OsintConsole", () => {
  it("loads the search index and shows the indexed-city count", async () => {
    render(<OsintConsole />);
    expect(await screen.findByText(/2 cities indexed/)).toBeInTheDocument();
  });

  it("filters results by query", async () => {
    render(<OsintConsole />);
    await screen.findByRole("button", { name: /Portville/ });
    fireEvent.change(screen.getByLabelText("Search cities"), { target: { value: "small" } });
    await waitFor(() => expect(screen.queryByRole("button", { name: /Portville/ })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Smalltown/ })).toBeInTheDocument();
  });

  it("selecting a city renders its entities, coverage, and type-filter chips", async () => {
    render(<OsintConsole />);
    fireEvent.click(await screen.findByRole("button", { name: /Portville/ }));
    expect(await screen.findByText("Big Harbor")).toBeInTheDocument();
    expect(screen.getByText("Tech University")).toBeInTheDocument();
    expect(screen.getByText("Coverage")).toBeInTheDocument();
    expect(screen.getByText("Telecom and network evidence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "City time machine" })).toBeInTheDocument();
    // two entity types → filter chips render
    expect(screen.getByRole("button", { name: /Ports \(1\)/ })).toBeInTheDocument();
  });

  it("type-filter chip narrows the entity list to the chosen type", async () => {
    render(<OsintConsole />);
    fireEvent.click(await screen.findByRole("button", { name: /Portville/ }));
    await screen.findByText("Big Harbor");
    fireEvent.click(screen.getByRole("button", { name: /Research & universities \(1\)/ }));
    await waitFor(() => expect(screen.queryByText("Big Harbor")).not.toBeInTheDocument());
    expect(screen.getByText("Tech University")).toBeInTheDocument();
  });

  it("shows saved-city alerts and toggles the selected city watchlist state", async () => {
    render(<OsintConsole />);

    expect(await screen.findByText("Saved city alerts")).toBeInTheDocument();
    expect(screen.getByText("Earthquake detected")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /Portville/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove Portville from saved cities" }));
    expect(WATCHLIST.toggle).toHaveBeenCalledWith("geo-1-portville");
  });

  it("an identity-only city (no dossier) shows the explicit gap message, not fabricated data", async () => {
    render(<OsintConsole />);
    fireEvent.click(await screen.findByRole("button", { name: /Smalltown/ }));
    expect(await screen.findByText(/Identity-only city/)).toBeInTheDocument();
  });
});
