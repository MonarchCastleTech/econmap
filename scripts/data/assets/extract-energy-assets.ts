import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { AssetRecord } from '../../../src/domain/types';

const RAW_DATA_PATH = 'data/raw/cities/bulk/wri/global_power_plant_database.csv';
const OUTPUT_DIR = 'data/processed/assets';
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const FUEL_TO_SUBTYPE: Record<string, string> = {
  'Hydro': 'hydro_plant',
  'Nuclear': 'nuclear_plant',
  'Gas': 'gas_plant',
  'Coal': 'coal_plant',
  'Oil': 'oil_plant',
  'Solar': 'solar_farm',
  'Wind': 'wind_farm',
  'Geothermal': 'geothermal_plant',
  'Biomass': 'biomass_plant',
  'Waste': 'waste_to_energy',
  'Other': 'power_plant'
};

async function extractEnergyAssets() {
  console.log("Extracting energy assets from WRI Global Power Plant Database...");
  
  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error(`Source file not found: ${RAW_DATA_PATH}`);
    return;
  }

  const csvContent = fs.readFileSync(RAW_DATA_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const assetsByCountry: Record<string, AssetRecord[]> = {};
  const countries = new Set<string>();

  for (const record of records as any[]) {
    const fuel = record.primary_fuel;
    const subtype = FUEL_TO_SUBTYPE[fuel] || 'power_plant';

    const capacity = parseFloat(record.capacity_mw) || 0;
    const priority = (subtype === 'nuclear_plant' || subtype === 'hydro_plant' || capacity > 1000) ? 'critical' : 
                     (capacity > 500) ? 'high' : 'medium';

    const asset: AssetRecord = {
      assetId: `pwr-${record.country.toLowerCase()}-${record.gppd_idnr.toLowerCase()}`,
      name: record.name,
      category: 'energy',
      subtype: subtype,
      countryIso3: record.country, // WRI uses ISO3
      admin1: record.admin1 || undefined,
      latitude: parseFloat(record.latitude),
      longitude: parseFloat(record.longitude),
      operator: record.owner || undefined,
      status: 'active',
      capacity: capacity || null,
      capacityUnit: 'MW',
      priority: priority,
      sourceIds: ['wri'],
      lastObservedAt: record.year_of_capacity_data ? `${record.year_of_capacity_data}-01-01T00:00:00Z` : undefined,
      confidence: 0.9,
      freshness: 'fresh',
      coverageState: 'verified_exact'
    };

    if (!assetsByCountry[asset.countryIso3]) {
      assetsByCountry[asset.countryIso3] = [];
    }
    assetsByCountry[asset.countryIso3].push(asset);
    countries.add(record.country);
  }

  // Write country files
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest: any = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : {};

  for (const iso3 of Object.keys(assetsByCountry)) {
    const filePath = path.join(OUTPUT_DIR, `${iso3.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(assetsByCountry[iso3], null, 2));

    manifest[iso3] = {
      countryIso3: iso3,
      categoryCounts: { energy: assetsByCountry[iso3].length },
      totalAssets: assetsByCountry[iso3].length,
      completenessScore: 0.85, // Representative OSINT coverage score
      lastUpdatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Extracted ${Object.values(assetsByCountry).flat().length} energy assets across ${countries.size} countries.`);
  console.log(`Updated asset manifest.json`);
}

extractEnergyAssets().catch(console.error);
