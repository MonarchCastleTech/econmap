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
  const gdpGrowth = getObservation(entityId, "gdp-growth")?.value ?? 0;
  const gini = getObservation(entityId, "gini")?.value ?? 35;
  const electricity = getObservation(entityId, "electricity-access")?.value ?? 100;
  const internet = getObservation(entityId, "internet-penetration")?.value ?? 50;
  const renewables = getObservation(entityId, "renewables-share")?.value ?? 20;

  const dimensions = [
    {
      id: "inflation-risk",
      label: "Inflation risk",
      score: clamp(inflation * 2.2, 0, 100),
      weight: 0.16,
      narrative: "Inflation volatility and persistence pressure purchasing power and rates.",
    },
    {
      id: "debt-risk",
      label: "Debt sustainability",
      score: clamp(debt * 0.55, 0, 100),
      weight: 0.16,
      narrative: "Debt metrics capture refinancing sensitivity and policy flexibility.",
    },
    {
      id: "labor-risk",
      label: "Labor market stress",
      score: clamp(unemployment * 2.5, 0, 100),
      weight: 0.12,
      narrative: "Unemployment is used as a simple proxy for labor market slack.",
    },
    {
      id: "external-vulnerability",
      label: "External vulnerability",
      score: clamp(Math.log10(exchangeRate + 1) * 18, 0, 100),
      weight: 0.12,
      narrative: "Exchange-rate stress is used as a placeholder for external vulnerability.",
    },
    {
      id: "climate-transition",
      label: "Climate & transition",
      score: clamp(emissions * 5, 0, 100),
      weight: 0.1,
      narrative: "Higher emissions intensity raises transition and climate vulnerability scores.",
    },
    {
      id: "institutional",
      label: "Institutional execution",
      score: clamp(100 - businessClimate, 0, 100),
      weight: 0.12,
      narrative: "The inverse business climate score is used as a transparent institutional placeholder.",
    },
    {
      id: "growth-momentum",
      label: "Growth momentum",
      score: clamp(Math.max(0, 5 - gdpGrowth) * 12, 0, 100),
      weight: 0.08,
      narrative: "Low or negative growth increases vulnerability to shocks.",
    },
    {
      id: "inequality",
      label: "Inequality & cohesion",
      score: clamp(gini * 1.5, 0, 100),
      weight: 0.06,
      narrative: "High Gini index correlates with social instability risk.",
    },
    {
      id: "infrastructure-gap",
      label: "Infrastructure gap",
      score: clamp((100 - electricity) * 0.5 + (100 - internet) * 0.5, 0, 100),
      weight: 0.04,
      narrative: "Gaps in electricity and internet access indicate infrastructure deficits.",
    },
    {
      id: "energy-transition-readiness",
      label: "Energy transition readiness",
      score: clamp(100 - renewables * 1.5, 0, 100),
      weight: 0.04,
      narrative: "Low renewables share indicates higher transition risk exposure.",
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
      "Weighted composite across 10 dimensions: inflation, debt, labor, external, climate, institutional, growth, inequality, infrastructure, and energy transition.",
    dimensions,
  });
}

export type RiskDecomposition = {
  entityId: string;
  overallScore: number;
  band: "low" | "moderate" | "elevated" | "high";
  topRisks: Array<{ id: string; label: string; score: number; weight: number }>;
  topStrengths: Array<{ id: string; label: string; score: number; weight: number }>;
};

export function decomposeRisk(entityId: string): RiskDecomposition {
  const full = buildRiskScore(entityId);
  const sorted = [...full.dimensions].sort((a, b) => b.score * b.weight - a.score * a.weight);

  return {
    entityId: full.entityId,
    overallScore: full.score,
    band: full.band,
    topRisks: sorted.slice(0, 3).map((d) => ({
      id: d.id,
      label: d.label,
      score: d.score,
      weight: d.weight,
    })),
    topStrengths: sorted.slice(-3).reverse().map((d) => ({
      id: d.id,
      label: d.label,
      score: d.score,
      weight: d.weight,
    })),
  };
}
