import { forecastSeries } from "@/data/normalized/forecasts";

export function getForecastScenario(
  entityId: string,
  indicatorId: string,
  scenario: "baseline" | "optimistic" | "pessimistic",
) {
  const series = forecastSeries.find(
    (entry) => entry.entityId === entityId && entry.indicatorId === indicatorId,
  );

  if (!series) {
    throw new Error(`Forecast series not found for ${entityId} / ${indicatorId}`);
  }

  const selected = series.scenarios.find((entry) => entry.scenario === scenario);

  if (!selected) {
    throw new Error(`Forecast scenario ${scenario} not found for ${entityId} / ${indicatorId}`);
  }

  return selected;
}
