import fs from "node:fs";
import path from "node:path";

/**
 * Publish every canonical city in the lazy-loaded client search index. Only the top-N cities get a
 * pre-rendered page; the rest resolve through the SPA fallback and all-city dossier bundle.
 * URL/Wikidata aliases add no search value, so they are removed and remaining aliases are capped.
 *
 * Run: npx tsx scripts/data/cities/build-search-index-slim.ts
 */
const SRC = path.join(process.cwd(), "src", "data", "generated", "cities", "search-index.json");
const OUT = path.join(process.cwd(), "public", "data", "cities", "search-index.json");
type Entry = {
  cityId: string;
  slug: string;
  name: string;
  aliases?: string[];
  placeClass?: "city" | "subordinate_place" | "region";
  featureCode?: string;
  countryIso3: string;
  admin1Name?: string;
  population?: number | null;
  isMajorCity?: boolean;
};

function isNoiseAlias(a: string): boolean {
  return /^https?:/i.test(a) || /^q\d+$/i.test(a);
}

function main() {
  const all: Entry[] = JSON.parse(fs.readFileSync(SRC, "utf-8"));
  const slim = all
    .filter(
      (e) =>
        e.placeClass !== "subordinate_place" &&
        e.placeClass !== "region",
    )
    .map((e) => ({
      cityId: e.cityId,
      slug: e.slug,
      name: e.name,
      aliases: (e.aliases ?? []).filter((a) => !isNoiseAlias(a)).slice(0, 3),
      placeClass: e.placeClass ?? "city",
      featureCode: e.featureCode,
      countryIso3: e.countryIso3,
      admin1Name: e.admin1Name,
      population: e.population,
      isMajorCity: e.isMajorCity ?? false,
    }));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(slim));
  const mb = (fs.statSync(OUT).size / 1048576).toFixed(1);
  console.log(`Slim search index: ${all.length} -> ${slim.length} canonical cities, ${mb} MB.`);
}

main();
