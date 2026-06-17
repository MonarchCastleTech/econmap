import { riskScoreSchema } from "@/domain/schemas";
import { getObservation } from "@/data/mock/countries";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scoreBand(score: number) {
  if (score < 28) return "low" as const;
  if (score < 45) return "moderate" as const;
  if (score < 65) return "elevated" as const;
  return "high" as const;
}

export function buildRiskScore(entityId: string) {
  const inflation = getObservation(entityId, "inflation-cpi")?.value ?? 0;
  const debt = getObservation(entityId, "debt-to-gdp")?.value ?? 0;
  const unemployment = getObservation(entityId, "unemployment")?.value ?? 0;
  const exchangeRate = getObservation(entityId, "exchange-rate")?.value ?? 0;
  const emissions = getObservation(entityId, "emissions-per-capita")?.value ?? 0;
  const businessClimate = getObservation(entityId, "business-climate")?.value ?? 50;

  const dimensions = [
    {
      id: "inflation-risk",
      label: "Inflation risk",
      score: clamp(inflation * 2.2, 0, 100),
      weight: 0.2,
      narrative: "Inflation volatility and persistence pressure purchasing power and rates.",
    },
    {
      id: "debt-risk",
      label: "Debt risk",
      score: clamp(debt * 0.55, 0, 100),
      weight: 0.18,
      narrative: "Debt metrics capture refinancing sensitivity and policy flexibility.",
    },
    {
      id: "labor-risk",
      label: "Labor market stress",
      score: clamp(unemployment * 2.5, 0, 100),
      weight: 0.16,
      narrative: "Unemployment is used as a simple proxy for labor market slack.",
    },
    {
      id: "external-vulnerability",
      label: "External vulnerability",
      score: clamp(Math.log10(exchangeRate + 1) * 18, 0, 100),
      weight: 0.14,
      narrative: "Exchange-rate stress is used as a placeholder for external vulnerability.",
    },
    {
      id: "climate-transition",
      label: "Climate and transition",
      score: clamp(emissions * 5, 0, 100),
      weight: 0.14,
      narrative: "Higher emissions intensity raises transition and climate vulnerability scores.",
    },
    {
      id: "institutional",
      label: "Institutional execution",
      score: clamp(100 - businessClimate, 0, 100),
      weight: 0.18,
      narrative: "The inverse business climate score is used as a transparent institutional placeholder.",
    },
  ];

  const score = Number(
    dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0).toFixed(1),
  );

  return riskScoreSchema.parse({
    entityId,
    score,
    band: scoreBand(score),
    methodology:
      "Weighted composite based on inflation, debt, labor, external, climate, and institutional placeholders.",
    dimensions,
  });
}
