import { countries, getObservation } from "@/data/mock/countries";

const metrics = [
  { id: "gdp-per-capita", weight: 0.24 },
  { id: "inflation-cpi", weight: 0.15 },
  { id: "unemployment", weight: 0.14 },
  { id: "urbanization", weight: 0.12 },
  { id: "renewables-share", weight: 0.1 },
  { id: "internet-penetration", weight: 0.1 },
  { id: "gini", weight: 0.15 },
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
