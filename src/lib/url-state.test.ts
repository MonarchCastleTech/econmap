import { describe, expect, it } from "vitest";

import { parseViewState, serializeViewState } from "@/lib/url-state";

describe("view state serialization", () => {
  it("serializes core homepage filters into a query string", () => {
    expect(
      serializeViewState({
        metric: "gdp-current-usd",
        year: 2025,
        region: "Asia",
        bloc: "g20",
        mapMode: "choropleth",
      }),
    ).toBe(
      "?metric=gdp-current-usd&year=2025&region=Asia&bloc=g20&mapMode=choropleth",
    );
  });

  it("parses a query string back into a typed view state", () => {
    expect(
      parseViewState(
        "?metric=inflation-cpi&year=2024&region=Europe&mapMode=bubble",
      ),
    ).toEqual({
      metric: "inflation-cpi",
      year: 2024,
      region: "Europe",
      bloc: undefined,
      mapMode: "bubble",
    });
  });
});
