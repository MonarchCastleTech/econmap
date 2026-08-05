import { countries, getObservation } from "@/data/mock/countries";

const metrics = [
  { id: "gdp-per-capita", weight: 0.18 },
  { id: "inflation-cpi", weight: 0.12 },
  { id: "unemployment", weight: 0.1 },
  { id: "urbanization", weight: 0.1 },
  { id: "renewables-share", weight: 0.08 },
  { id: "internet-penetration", weight: 0.08 },
  { id: "gini", weight: 0.1 },
  { id: "debt-to-gdp", weight: 0.08 },
  { id: "policy-rate", weight: 0.08 },
  { id: "labor-force-participation", weight: 0.08 },
];

function distance(sourceSlug: string, candidateSlug: string) {
  return metrics.reduce((sum, metric) => {
    const source = getObservation(sourceSlug, metric.id)?.value ?? 0;
    const candidate = getObservation(candidateSlug, metric.id)?.value ?? 0;
    const scale = Math.max(Math.abs(source), 1);
    const delta = Math.abs(source - candidate) / scale;
    return sum + delta * metric.weight;
  }, 0);
}

export function findSimilarEconomies(seedSlug: string, limit = 5) {
  return countries
    .filter((country) => country.slug !== seedSlug)
    .map((country) => {
      const score = Math.max(0, Number((100 - distance(seedSlug, country.slug) * 100).toFixed(1)));
      return {
        country,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export type SimilarityDimension = {
  id: string;
  label: string;
  sourceValue: number | null;
  candidateValue: number | null;
  contribution: number;
};

export function explainSimilarity(seedSlug: string, candidateSlug: string): {
  score: number;
  dimensions: SimilarityDimension[];
} {
  const dimensions: SimilarityDimension[] = metrics.map((metric) => {
    const source = getObservation(seedSlug, metric.id)?.value ?? null;
    const candidate = getObservation(candidateSlug, metric.id)?.value ?? null;
    const scale = Math.max(Math.abs(source ?? 1), 1);
    const delta = source !== null && candidate !== null
      ? Math.abs(source - candidate) / scale
      : 1;
    return {
      id: metric.id,
      label: metric.id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      sourceValue: source,
      candidateValue: candidate,
      contribution: delta * metric.weight,
    };
  });

  const rawScore = dimensions.reduce((sum, d) => sum + d.contribution, 0);
  const score = Math.max(0, Number((100 - rawScore * 100).toFixed(1)));

  return { score, dimensions };
}
