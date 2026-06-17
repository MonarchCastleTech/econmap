import { describe, expect, it } from "vitest";

import { buildRiskScore } from "@/features/risk/risk-engine";

describe("risk engine", () => {
  it("builds a transparent composite score for a country", () => {
    const result = buildRiskScore("turkiye");

    expect(result.entityId).toBe("turkiye");
    expect(result.dimensions).toHaveLength(6);
    expect(result.score).toBeGreaterThan(0);
    expect(result.band).toMatch(/low|moderate|elevated|high/);
  });
});
