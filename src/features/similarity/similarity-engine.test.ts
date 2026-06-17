import { describe, expect, it } from "vitest";

import { findSimilarEconomies } from "@/features/similarity/similarity-engine";

describe("similarity engine", () => {
  it("returns ranked peer economies excluding the seed country", () => {
    const peers = findSimilarEconomies("germany", 3);

    expect(peers).toHaveLength(3);
    expect(peers[0]?.country.slug).not.toBe("germany");
    expect(peers[0]?.score).toBeGreaterThanOrEqual(peers[1]?.score ?? 0);
  });
});
