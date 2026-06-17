import fs from 'fs';
import path from 'path';
import { parseOurAirportsCsv } from '../cities/parsers/ourairports-parser';
import { parseWpiCsv } from '../cities/parsers/wpi-parser';
import { AssetRecord } from '../../../src/domain/types';

const AIRPORTS_DATA_PATH = 'data/raw/cities/bulk/ourairports/airports.csv';
const PORTS_DATA_PATH = 'data/raw/cities/bulk/worldportindex/wpi_data_download/wpi_data_download/WPI.csv';
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

// Fallback mappings for some territories without cities or known edge cases
iso2ToIso3['GB'] = 'GBR';
iso2ToIso3['US'] = 'USA';
iso2ToIso3['FR'] = 'FRA';
iso2ToIso3['DE'] = 'DEU';
iso2ToIso3['TR'] = 'TUR';
// If missing, generate a dummy ISO3 by appending X
function getIso3(iso2: string): string | undefined {
  if (!iso2) return undefined;
  const iso2Up = iso2.toUpperCase();
  if (iso2ToIso3[iso2Up]) return iso2ToIso3[iso2Up];
  return undefined; // Filter out if we truly don't know the ISO3
}

async function extractTransportAssets() {
  console.log("Extracting transport assets from OurAirports and WPI...");
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  // Load existing assets if they exist (to preserve energy assets)
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

  // 1. Process Airports
  if (fs.existsSync(AIRPORTS_DATA_PATH)) {
    console.log("Parsing airports...");
    const airports = await parseOurAirportsCsv(AIRPORTS_DATA_PATH);
    
    for (const ap of airports) {
      const iso3 = getIso3(ap.countryIso2);
      if (!iso3) continue;

      let priority: "critical" | "high" | "medium" | "low" = "low";
      if (ap.entitySubtype === 'large_airport') priority = "critical";
      else if (ap.entitySubtype === 'medium_airport') priority = "high";
      else if (ap.entitySubtype === 'small_airport') priority = "medium";

      const asset: AssetRecord = {
        assetId: ap.entityId,
        name: ap.name,
        category: 'transport',
        subtype: ap.entitySubtype,
        countryIso3: iso3,
        admin1: ap.admin1Code,
        latitude: ap.latitude,
        longitude: ap.longitude,
        status: 'active',
        priority: priority,
        sourceIds: ['ourairports'],
        confidence: 0.95,
        freshness: 'fresh',
        coverageState: 'verified_exact'
      };

      if (!assetsByCountry[iso3]) assetsByCountry[iso3] = [];
      assetsByCountry[iso3].push(asset);
      countries.add(iso3);
    }
  } else {
    console.warn(`Airports data not found at ${AIRPORTS_DATA_PATH}`);
  }

  // 2. Process Ports
  if (fs.existsSync(PORTS_DATA_PATH)) {
    console.log("Parsing ports...");
    const ports = await parseWpiCsv(PORTS_DATA_PATH);
    
    for (const pt of ports) {
      const iso3 = getIso3(pt.countryIso2);
      if (!iso3) continue;

      let priority: "critical" | "high" | "medium" | "low" = "medium";
      if (pt.harborSize === 'L' || pt.harborSize === 'V') priority = "critical";
      else if (pt.harborSize === 'M') priority = "high";

      const asset: AssetRecord = {
        assetId: pt.entityId,
        name: pt.name,
        category: 'transport',
        subtype: pt.entitySubtype,
        countryIso3: iso3,
        latitude: pt.latitude,
        longitude: pt.longitude,
        status: 'active',
        priority: priority,
        sourceIds: ['world-port-index'],
        confidence: 0.95,
        freshness: 'historic',
        coverageState: 'verified_exact'
      };

      if (!assetsByCountry[iso3]) assetsByCountry[iso3] = [];
      assetsByCountry[iso3].push(asset);
      countries.add(iso3);
    }
  } else {
    console.warn(`Ports data not found at ${PORTS_DATA_PATH}`);
  }

  // 3. Save to output
  const manifest: any = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : {};

  for (const iso3 of Object.keys(assetsByCountry)) {
    // Filter duplicates by assetId in case we re-run
    const uniqueAssets = Array.from(new Map(assetsByCountry[iso3].map(item => [item.assetId, item])).values());
    
    const filePath = path.join(OUTPUT_DIR, `${iso3.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(uniqueAssets, null, 2));

    const energyCount = uniqueAssets.filter(a => a.category === 'energy').length;
    const transportCount = uniqueAssets.filter(a => a.category === 'transport').length;

    manifest[iso3] = {
      ...manifest[iso3],
      countryIso3: iso3,
      categoryCounts: { 
        energy: energyCount,
        transport: transportCount
      },
      totalAssets: uniqueAssets.length,
      completenessScore: 0.9,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Updated assets for ${countries.size} countries with transport data.`);
  console.log(`Updated asset manifest.json`);
}

extractTransportAssets().catch(console.error);
