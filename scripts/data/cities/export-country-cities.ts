import fs from 'fs';
import path from 'path';

const REGISTRY_PATH = 'src/data/generated/cities/registry.json';
const OUTPUT_DIR = 'public/data/countries';

async function exportCountryCities() {
  console.log("Exporting city lists by country...");
  
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Registry not found at ${REGISTRY_PATH}`);
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  const citiesByCountry: Record<string, any[]> = {};

  for (const city of registry) {
    if (!city.countryIso3) continue;
    const iso3 = city.countryIso3.toUpperCase();
    
    if (!citiesByCountry[iso3]) {
      citiesByCountry[iso3] = [];
    }

    citiesByCountry[iso3].push({
      cityId: city.cityId,
      slug: city.slug,
      name: city.name,
      admin1Name: city.admin1Name,
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population,
      isMajorCity: city.isMajorCity
    });
  }

  const countries = Object.keys(citiesByCountry);
  for (const iso3 of countries) {
    // Sort cities by population descending, then by name
    citiesByCountry[iso3].sort((a, b) => {
      if (b.population !== a.population) {
        return (b.population || 0) - (a.population || 0);
      }
      return a.name.localeCompare(b.name);
    });

    const filePath = path.join(OUTPUT_DIR, `${iso3.toLowerCase()}_cities.json`);
    fs.writeFileSync(filePath, JSON.stringify(citiesByCountry[iso3]));
  }

  console.log(`Exported city lists for ${countries.length} countries.`);
}

exportCountryCities().catch(console.error);
