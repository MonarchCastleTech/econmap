import { describe, expect, it } from "vitest";

import { sanitizeExportFileName, toCsv } from "@/lib/export";

describe("export helpers", () => {
  it("creates CSV output with a stable header row", () => {
    const csv = toCsv([
      { country: "Germany", gdp: 4_750_000_000_000 },
      { country: "India", gdp: 4_100_000_000_000 },
    ]);

    expect(csv.split("\n")[0]).toBe("country,gdp");
    expect(csv).toContain('"Germany"');
  });

  it("sanitizes export file names", () => {
    expect(sanitizeExportFileName("Germany vs India Report 2025")).toBe(
      "germany-vs-india-report-2025",
    );
  });
});
