import fs from 'fs';
import path from 'path';
import { parseUnlocodeCsv } from '../cities/parsers/unlocode-parser';
import { AssetRecord } from '../../../src/domain/types';

const UNLOCODE_DIR = 'data/raw/cities/bulk/unlocode/loc242csv';
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

// Fallbacks
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

async function extractLogisticsAssets() {
  console.log("Extracting logistics assets from UN/LOCODE...");
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  // Load existing assets
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

  // Parse UNLOCODE Parts 1-3
  const parts = [
    '2024-2 UNLOCODE CodeListPart1.csv',
    '2024-2 UNLOCODE CodeListPart2.csv',
    '2024-2 UNLOCODE CodeListPart3.csv'
  ];

  for (const part of parts) {
    const partPath = path.join(UNLOCODE_DIR, part);
    if (!fs.existsSync(partPath)) {
      console.warn(`UNLOCODE part not found: ${partPath}`);
      continue;
    }

    console.log(`Parsing ${part}...`);
    const entities = await parseUnlocodeCsv(partPath);
    
    for (const en of entities) {
      // Skip airports and ports as they are extracted by extract-transport-assets.ts (OurAirports & WPI)
      if (en.entityType === 'airport' || en.entityType === 'port') continue;

      const iso3 = getIso3(en.countryIso2);
      if (!iso3) continue;

      let priority: "critical" | "high" | "medium" | "low" = "medium";
      if (en.entityType === 'rail_hub') priority = "high"; // Major rail hubs are high priority
      else if (en.entityType === 'logistics_hub') priority = "medium";

      if (en.exactSite && en.latitude !== undefined && en.longitude !== undefined) {
        const asset: AssetRecord = {
          assetId: en.entityId,
          name: en.name,
          category: 'transport', // Rail and logistics are transport
          subtype: en.entityType,
          countryIso3: iso3,
          admin1: en.subdivision,
          latitude: en.latitude,
          longitude: en.longitude,
          status: 'active', // UNLOCODE active implies operational
          priority: priority,
          sourceIds: ['unlocode'],
          confidence: 0.85,
          freshness: 'historic',
          coverageState: 'verified_exact'
        };

        if (!assetsByCountry[iso3]) assetsByCountry[iso3] = [];
        assetsByCountry[iso3].push(asset);
        countries.add(iso3);
      }
    }
  }

  // Save to output
  const manifest: any = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : {};

  for (const iso3 of Object.keys(assetsByCountry)) {
    // Filter duplicates
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
  console.log(`Updated assets for ${countries.size} countries with logistics data.`);
  console.log(`Updated asset manifest.json`);
}

extractLogisticsAssets().catch(console.error);
