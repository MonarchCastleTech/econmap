import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

describe("DashboardPage", () => {
  it("reframes the dashboard as saved OSINT watchlists", async () => {
    render(await DashboardPage());

    expect(screen.getByText("Infrastructure watchlist")).toBeInTheDocument();
  });
});
