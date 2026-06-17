import fs from 'node:fs';
import path from 'node:path';

// Emits a slim slug -> {name, iso3, population} lookup used by the city route's
// build-time functions (generateStaticParams / generateMetadata). Loading this
// ~11MB map instead of the full 113MB registry in every static-export worker is
// what keeps the build under the worker heap limit (the full registry parsed to
// ~500MB resident per worker and OOM'd the export).
const GENERATED_DIR = path.join(process.cwd(), 'src', 'data', 'generated', 'cities');
const REGISTRY_FILE = path.join(GENERATED_DIR, 'registry.json');
const OUT_FILE = path.join(GENERATED_DIR, 'slug-meta.json');

type RegistryEntry = { slug: string; name: string; countryIso3: string; population?: number | null };

function main() {
  const registry: RegistryEntry[] = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
  const out: Record<string, { n: string; i: string; p: number }> = {};
  for (const city of registry) {
    out[city.slug] = { n: city.name, i: city.countryIso3, p: city.population ?? 0 };
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  const sizeMb = (fs.statSync(OUT_FILE).size / 1048576).toFixed(1);
  console.log(`Wrote slug-meta.json: ${Object.keys(out).length} entries, ${sizeMb} MB`);
}

main();
