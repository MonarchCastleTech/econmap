type SearchableCity = {
  aliases?: string[];
  admin1Name?: string;
  countryIso3: string;
  isMajorCity?: boolean;
  name: string;
  placeClass?: "city" | "subordinate_place" | "region";
  population?: number | null;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function textMatchScore(value: string | undefined, query: string, scores: [number, number, number]) {
  if (!value) return 0;
  const normalizedValue = normalizeSearchText(value);
  if (normalizedValue === query) return scores[0];
  if (normalizedValue.startsWith(query)) return scores[1];
  if (normalizedValue.includes(query)) return scores[2];
  return 0;
}

function getSearchScore(city: SearchableCity, query: string) {
  const nameScore = textMatchScore(city.name, query, [1_000, 800, 600]);
  const aliasScore = Math.max(
    0,
    ...(city.aliases ?? []).map((alias) => textMatchScore(alias, query, [900, 700, 500])),
  );
  const adminScore = textMatchScore(city.admin1Name, query, [300, 250, 200]);
  const countryScore = textMatchScore(city.countryIso3, query, [150, 100, 75]);
  const matchScore = Math.max(nameScore, aliasScore, adminScore, countryScore);

  if (matchScore === 0) return 0;
  const cityBonus = city.placeClass === "subordinate_place" || city.placeClass === "region" ? 0 : 50;
  return matchScore + cityBonus;
}

export function rankCitySearchEntries<T extends SearchableCity>(
  entries: T[],
  query: string,
  limit = 20,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return entries
    .filter(
      (entry) =>
        entry.placeClass !== "subordinate_place" && entry.placeClass !== "region",
    )
    .map((entry, index) => ({
      entry,
      index,
      score: getSearchScore(entry, normalizedQuery),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.entry.population ?? 0) - (left.entry.population ?? 0) ||
        Number(Boolean(right.entry.isMajorCity)) - Number(Boolean(left.entry.isMajorCity)) ||
        left.index - right.index,
    )
    .slice(0, limit)
    .map((candidate) => candidate.entry);
}
