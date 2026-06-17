import fs from 'fs';
import path from 'path';
import { parseRorCsv } from '../cities/parsers/ror-parser';
import { AssetRecord } from '../../../src/domain/types';

const ROR_DATA_PATH = 'data/raw/cities/bulk/ror/v2.1-2026-01-15-ror-data/v2.1-2026-01-15-ror-data.csv';
const CITY_REGISTRY_PATH = 'data/raw/cities/bulk/iso_mapping.json';
const OUTPUT_DIR = 'data/processed/assets';
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Build an ISO2 to ISO3 lookup from the iso_mapping.json
const iso2ToIso3: Record<string, string> = {};

if (fs.existsSync(CITY_REGISTRY_PATH)) {
  const mapping = JSON.parse(fs.readFileSync(CITY_REGISTRY_PATH, 'utf-8'));
  const list = Array.isArray(mapping) ? mapping : mapping.value;
  for (const country of list) {
    if (country['alpha-2'] && country['alpha-3']) {
      iso2ToIso3[country['alpha-2'].toUpperCase()] = country['alpha-3'].toUpperCase();
    }
  }
}

iso2ToIso3['GB'] = 'GBR';
iso2ToIso3['US'] = 'USA';
iso2ToIso3['FR'] = 'FRA';
iso2ToIso3['DE'] = 'DEU';
iso2ToIso3['TR'] = 'TUR';

function getIso3(iso2: string): string | undefined {
  if (!iso2) return undefined;
  const iso2Up = iso2.toUpperCase();
  if (iso2ToIso3[iso2Up]) return iso2ToIso3[iso2Up];
  return undefined; 
}

async function extractResearchAssets() {
  console.log("Extracting research assets from ROR...");
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  // Load existing assets if they exist
  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (file.endsWith('.json') && file !== 'manifest.json') {
      const iso3 = file.replace('.json', '').toUpperCase();
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
      try {
        assetsByCountry[iso3] = JSON.parse(content);
      } catch (e) {
        assetsByCountry[iso3] = [];
      }
    }
  }

  if (fs.existsSync(ROR_DATA_PATH)) {
    const researchEntities = await parseRorCsv(ROR_DATA_PATH);
    
    for (const rs of researchEntities) {
      const iso3 = getIso3(rs.countryIso2);
      if (!iso3) continue;

      let priority: "critical" | "high" | "medium" | "low" = "medium";
      if (rs.entitySubtype === 'government_lab') priority = "critical";
      else if (rs.entitySubtype === 'research_institute') priority = "high";

      let category: AssetRecord["category"] = 'public_services';
      if (rs.entitySubtype === 'hospital') category = 'public_services';
      else if (rs.entitySubtype === 'university' || rs.entitySubtype === 'research_institute' || rs.entitySubtype === 'government_lab') category = 'industrial';

      if (rs.exactSite && rs.latitude !== undefined && rs.longitude !== undefined) {
        const asset: AssetRecord = {
          assetId: rs.entityId,
          name: rs.name,
          category: category,
          subtype: rs.entitySubtype,
          countryIso3: iso3,
          admin1: rs.admin1Name,
          latitude: rs.latitude,
          longitude: rs.longitude,
          status: 'active',
          priority: priority,
          sourceIds: ['ror'],
          confidence: 0.95,
          freshness: 'fresh',
          coverageState: 'verified_exact'
        };

        if (!assetsByCountry[iso3]) assetsByCountry[iso3] = [];
        assetsByCountry[iso3].push(asset);
        countries.add(iso3);
      }
    }
  } else {
    console.warn(`ROR data not found at ${ROR_DATA_PATH}`);
  }

  // Save to output
  const manifest: any = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : {};

  for (const iso3 of Object.keys(assetsByCountry)) {
    // Filter duplicates by assetId in case we re-run
    const uniqueAssets = Array.from(new Map(assetsByCountry[iso3].map(item => [item.assetId, item])).values());
    
    const filePath = path.join(OUTPUT_DIR, `${iso3.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(uniqueAssets, null, 2));

    const energyCount = uniqueAssets.filter(a => a.category === 'energy').length;
    const transportCount = uniqueAssets.filter(a => a.category === 'transport').length;
    const publicServicesCount = uniqueAssets.filter(a => a.category === 'public_services').length;
    const industrialCount = uniqueAssets.filter(a => a.category === 'industrial').length;

    manifest[iso3] = {
      ...manifest[iso3],
      countryIso3: iso3,
      categoryCounts: { 
        energy: energyCount,
        transport: transportCount,
        public_services: publicServicesCount,
        industrial: industrialCount
      },
      totalAssets: uniqueAssets.length,
      completenessScore: 0.9,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Updated assets for ${countries.size} countries with research data.`);
  console.log(`Updated asset manifest.json`);
}

extractResearchAssets().catch(console.error);
