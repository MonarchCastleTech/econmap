import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { AssetRecord } from '../../../src/domain/types';

const RAW_DATA_PATH = 'data/raw/cities/bulk/usgs/mrds.csv';
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

// Custom fallbacks for common name mismatches in MRDS
nameToIso3['united states'] = 'USA';
nameToIso3['great britain'] = 'GBR';
nameToIso3['korea, south'] = 'KOR';
nameToIso3['vietnam'] = 'VNM';
nameToIso3['turkiye'] = 'TUR';
nameToIso3['turkey'] = 'TUR';

async function extractMiningAssets() {
  console.log("Extracting mining assets from USGS MRDS...");
  
  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error(`Source file not found: ${RAW_DATA_PATH}`);
    return;
  }

  const csvContent = fs.readFileSync(RAW_DATA_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  // Load existing assets to merge
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
  for (const record of records as any[]) {
    // Filter for significance: Producer or Past Producer
    const status = record.dev_stat;
    if (status !== 'Producer' && status !== 'Past Producer') continue;

    const countryName = record.country?.toLowerCase();
    const iso3 = nameToIso3[countryName];
    if (!iso3) continue;

    const lat = parseFloat(record.latitude);
    const lon = parseFloat(record.longitude);
    if (isNaN(lat) || isNaN(lon)) continue;

    const subtype = 'mine';
    const priority = status === 'Producer' ? 'high' : 'medium';

    const asset: AssetRecord = {
      assetId: `mine-${iso3.toLowerCase()}-${record.dep_id}`,
      name: record.site_name || `Unnamed ${record.commod1} Site`,
      category: 'industrial',
      subtype: subtype,
      countryIso3: iso3,
      admin1: record.state || undefined,
      latitude: lat,
      longitude: lon,
      status: status === 'Producer' ? 'active' : 'closed',
      priority: priority,
      sourceIds: ['usgs-mrds'],
      confidence: 0.9,
      freshness: 'historic',
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
      completenessScore: 0.95,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Extracted ${count} mining assets across ${countries.size} countries.`);
  console.log(`Updated asset manifest.json`);
}

extractMiningAssets().catch(console.error);
