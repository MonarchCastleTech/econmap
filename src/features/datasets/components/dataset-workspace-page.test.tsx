import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DatasetWorkspacePage } from "@/features/datasets/components/dataset-workspace-page";

describe("DatasetWorkspacePage", () => {
  it("renders the dataset page as an analytical surface instead of a dead file inventory", () => {
    render(
      <DatasetWorkspacePage
        workspace={{
          generatedAt: "2026-03-16T00:00:00.000Z",
          dataset: {
            id: "who-air-quality",
            label: "WHO Air Quality",
            status: "downloaded_local_source",
            sourceLabels: ["WHO Air Quality"],
            detail: "Downloaded local source is present on disk and surfaced on the website via dataset workspace.",
            websiteSurfaces: ["dataset workspace"],
            workspacePath: "/datasets/who-air-quality",
          },
          sourcePack: {
            fileCount: 1,
            totalSizeBytes: 4321000,
            files: [
              {
                relativePath: "who/who_ambient_air_quality_database_v2024.xlsx",
                purpose: "WHO city-level ambient air quality observations.",
                sourceUrl: "https://cdn.who.int/",
                required: false,
                exists: true,
                sizeBytes: 4321000,
              },
            ],
          },
          processedIndex: {
            fileName: null,
            exists: false,
            rowCount: 0,
          },
          cityBundleCount: 0,
          imageryDateCount: 0,
          notes: ["No processed index is published for this dataset in the current build."],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /who air quality/i })).toBeInTheDocument();
    [
      "Website surfaces",
      "Processed evidence",
      "City coverage",
      "Layer availability",
      "Source registry",
      "Open related cities",
    ].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
    expect(screen.getByText(/who_ambient_air_quality_database_v2024\.xlsx/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cdn\.who\.int/i })).toHaveAttribute("href", "https://cdn.who.int/");
    expect(screen.getByText(/no processed index is published/i)).toBeInTheDocument();
  });

  it("renders identified public sources even before a local source pack is downloaded", () => {
    render(
      <DatasetWorkspacePage
        workspace={{
          generatedAt: "2026-03-25T00:00:00.000Z",
          dataset: {
            id: "peeringdb",
            label: "PeeringDB",
            status: "identified_public_source",
            sourceLabels: ["PeeringDB"],
            detail: "Real public source is identified and queued for parser integration.",
            websiteSurfaces: ["dataset workspace"],
            workspacePath: "/datasets/peeringdb",
          },
          sourcePack: {
            fileCount: 1,
            totalSizeBytes: 0,
            files: [
              {
                relativePath: "PeeringDB REST API",
                purpose: "Public interconnection, IXP, and facility registry for city-scale internet exchange analysis.",
                sourceUrl: "https://docs.peeringdb.com/api_specs/",
                required: false,
                exists: false,
                sizeBytes: null,
              },
            ],
          },
          processedIndex: {
            fileName: null,
            exists: false,
            rowCount: 0,
          },
          cityBundleCount: 0,
          imageryDateCount: 0,
          notes: ["Real public source is identified but no local source pack entry is present in this build."],
        }}
      />,
    );

    expect(screen.getByText(/identified public source/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /source registry/i })).toBeInTheDocument();
    expect(screen.getByText(/peeringdb rest api/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /docs\.peeringdb\.com/i })).toHaveAttribute(
      "href",
      "https://docs.peeringdb.com/api_specs/",
    );
  });
});
