import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComparePage } from "@/features/compare/components/compare-page";

describe("ComparePage", () => {
  it("centers the compare surface on a city-first OSINT compare set", async () => {
    render(await ComparePage());

    expect(screen.getByText("Selected cities")).toBeInTheDocument();
    expect(screen.getByText("OSINT compare set")).toBeInTheDocument();
  });
});
