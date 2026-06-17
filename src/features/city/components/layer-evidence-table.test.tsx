import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LayerEvidenceTable, type LayerEvidenceRow } from "./layer-evidence-table";

function source(coverageState?: string) {
  return {
    id: "ourairports",
    name: "OurAirports",
    updatedAt: "2026-01-01",
    coverage: "global",
    methodology: "registry",
    ...(coverageState ? { coverageState } : {}),
  } as LayerEvidenceRow["sources"][number];
}

describe("LayerEvidenceTable confidence tiers", () => {
  it("shows an Exact site tier for verified_exact sources", () => {
    render(
      <LayerEvidenceTable
        rows={[{ id: "a", label: "Airports", value: "2", sources: [source("verified_exact")] }]}
      />,
    );
    expect(screen.getByText("Exact site")).toBeTruthy();
  });

  it("shows a City presence tier for verified_city_presence sources", () => {
    render(
      <LayerEvidenceTable
        rows={[{ id: "p", label: "Ports", value: "1", sources: [source("verified_city_presence")] }]}
      />,
    );
    expect(screen.getByText("City presence")).toBeTruthy();
  });

  it("picks the strongest tier when sources mix coverage states", () => {
    render(
      <LayerEvidenceTable
        rows={[
          {
            id: "m",
            label: "Mixed",
            value: "3",
            sources: [source("verified_city_presence"), source("verified_exact")],
          },
        ]}
      />,
    );
    expect(screen.getByText("Exact site")).toBeTruthy();
    expect(screen.queryByText("City presence")).toBeNull();
  });

  it("renders no tier badge when sources lack a coverage state", () => {
    render(<LayerEvidenceTable rows={[{ id: "n", label: "None", value: "0", sources: [source()] }]} />);
    expect(screen.queryByText("Exact site")).toBeNull();
    expect(screen.queryByText("City presence")).toBeNull();
  });
});
