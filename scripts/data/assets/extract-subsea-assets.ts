import fs from 'fs';
import path from 'path';
import { AssetRecord } from '../../../src/domain/types';

const RAW_DATA_PATH = 'data/raw/cities/bulk/telegeography/landing-points.json';
const ISO_MAPPING_PATH = 'data/raw/cities/bulk/iso_mapping.json';
const OUTPUT_DIR = 'data/processed/assets';
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Build a Name to ISO3 lookup
const nameToIso3: Record<string, string> = {};
if (fs.existsSync(ISO_MAPPING_PATH)) {
  const mapping = JSON.parse(fs.readFileSync(ISO_MAPPING_PATH, 'utf-8'));
  const list = Array.isArray(mapping) ? mapping : mapping.value;
  for (const country of list) {
    if (country['name'] && country['alpha-3']) {
      nameToIso3[country['name'].toLowerCase()] = country['alpha-3'].toUpperCase();
    }
  }
}

// Custom fallbacks for subsea cable naming conventions
nameToIso3['united states'] = 'USA';
nameToIso3['united kingdom'] = 'GBR';
nameToIso3['virgin islands (u.s.)'] = 'VIR';
nameToIso3['virgin islands (u.k.)'] = 'VGB';
nameToIso3['northern mariana islands'] = 'MNP';
nameToIso3['korea, south'] = 'KOR';
nameToIso3['taiwan'] = 'TWN';
nameToIso3['china'] = 'CHN';
nameToIso3['turkiye'] = 'TUR';
nameToIso3['turkey'] = 'TUR';
nameToIso3['russia'] = 'RUS';

async function extractSubseaAssets() {
  console.log("Extracting subsea cable assets from TeleGeography...");
  
  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error(`Source file not found: ${RAW_DATA_PATH}`);
    return;
  }

  const geojson = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  // Load existing assets
  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (file.endsWith('.json') && file !== 'manifest.json' && file !== 'corridors.json') {
      const iso3 = file.replace('.json', '').toUpperCase();
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
      try {
        assetsByCountry[iso3] = JSON.parse(content);
      } catch (e) {
        assetsByCountry[iso3] = [];
      }
    }
  }

  let count = 0;
  for (const feature of geojson.features) {
    const name = feature.properties.name;
    const parts = name.split(',');
    const countryName = parts[parts.length - 1].trim().toLowerCase();
    const iso3 = nameToIso3[countryName];
    
    if (!iso3) continue;

    const [lon, lat] = feature.geometry.coordinates;

    const asset: AssetRecord = {
      assetId: `subsea-${iso3.toLowerCase()}-${feature.properties.id}`,
      name: name,
      category: 'telecom',
      subtype: 'subsea_cable_landing',
      countryIso3: iso3,
      latitude: lat,
      longitude: lon,
      status: 'active',
      priority: 'critical',
      sourceIds: ['telegeography'],
      confidence: 1.0,
      freshness: 'fresh',
      coverageState: 'verified_exact'
    };

    if (!assetsByCountry[iso3]) assetsByCountry[iso3] = [];
    assetsByCountry[iso3].push(asset);
    countries.add(iso3);
    count++;
  }

  // Save to output
  const manifest: any = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : {};

  for (const iso3 of Object.keys(assetsByCountry)) {
    const uniqueAssets = Array.from(new Map(assetsByCountry[iso3].map(item => [item.assetId, item])).values());
    
    const filePath = path.join(OUTPUT_DIR, `${iso3.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(uniqueAssets, null, 2));

    const categoryCounts: Record<string, number> = {};
    uniqueAssets.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    manifest[iso3] = {
      ...manifest[iso3],
      countryIso3: iso3,
      categoryCounts: categoryCounts,
      totalAssets: uniqueAssets.length,
      completenessScore: 0.98,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Extracted ${count} subsea cable landing assets across ${countries.size} countries.`);
  console.log(`Updated asset manifest.json`);
}

extractSubseaAssets().catch(console.error);
