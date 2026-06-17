import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TopControlCluster } from "@/features/home/components/layout/top-control-cluster";

describe("TopControlCluster", () => {
  it("renders compact operator-map controls without timeline toggles", () => {
    render(<TopControlCluster />);

    expect(screen.getByTestId("tactical-control-cluster")).toHaveAttribute("data-geometry", "hard-edge");
    expect(screen.getByTestId("tactical-control-cluster")).toHaveAttribute("data-density", "compact");
    expect(screen.getByLabelText(/reset camera/i)).toHaveAttribute("data-geometry", "hard-edge");
    expect(screen.getByLabelText(/reset camera/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/toggle timeline/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/export screenshot/i)).toBeInTheDocument();
  });
});
