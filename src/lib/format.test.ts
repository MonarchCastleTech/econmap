import { describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats large currency values compactly", () => {
    expect(formatCurrency(1_500_000_000_000, "USD", { compact: true })).toBe(
      "$1.5T",
    );
  });

  it("formats compact numbers for dashboard cards", () => {
    expect(formatCompactNumber(1_250_000)).toBe("1.3M");
  });

  it("formats percentages with one decimal place by default", () => {
    expect(formatPercent(4.367)).toBe("4.4%");
  });
});
