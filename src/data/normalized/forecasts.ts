import { forecastYears, sourceById } from "@/data/mock/catalog";
import { forecastSeriesSchema } from "@/domain/schemas";

import { getObservation } from "@/data/normalized/countries";

const showcaseEntities = ["united-states", "germany", "india", "brazil", "turkiye"];
const forecastIndicators = [
  { id: "gdp-growth", unit: "percent", optimistic: 0.5, pessimistic: -0.8, step: 0.15 },
  { id: "inflation-cpi", unit: "percent", optimistic: -0.4, pessimistic: 0.7, step: -0.12 },
  { id: "unemployment", unit: "percent", optimistic: -0.2, pessimistic: 0.4, step: -0.05 },
  { id: "debt-to-gdp", unit: "percent", optimistic: -1.2, pessimistic: 1.6, step: 0.35 },
  { id: "population", unit: "people", optimistic: 0.004, pessimistic: -0.001, step: 0.0025 },
];

export const forecastSeries = forecastSeriesSchema.array().parse(
  showcaseEntities.flatMap((entityId) =>
    forecastIndicators.map((definition) => {
      const latest = getObservation(entityId, definition.id)?.value ?? 0;

      const baselineValues = forecastYears.map((year, index) => {
        const growthMultiplier = definition.id === "population" ? 1 + definition.step * (index + 1) : 0;
        const value =
          definition.id === "population"
            ? Math.round(latest * growthMultiplier)
            : Number((latest + definition.step * (index + 1)).toFixed(1));

        return { year, value, source: sourceById["mapfactbook-lab"] };
      });

      return {
        id: `${entityId}-${definition.id}-forecast`,
        entityId,
        indicatorId: definition.id,
        unit: definition.unit,
        scenarios: [
          { scenario: "baseline", values: baselineValues },
          {
            scenario: "optimistic",
            values: baselineValues.map((point) => ({
              ...point,
              value:
                definition.id === "population"
                  ? Math.round(point.value * (1 + definition.optimistic))
                  : Number((point.value + definition.optimistic).toFixed(1)),
            })),
          },
          {
            scenario: "pessimistic",
            values: baselineValues.map((point) => ({
              ...point,
              value:
                definition.id === "population"
                  ? Math.round(point.value * (1 + definition.pessimistic))
                  : Number((point.value + definition.pessimistic).toFixed(1)),
            })),
          },
        ],
      };
    }),
  ),
);
