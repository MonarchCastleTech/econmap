import fs from 'fs';
import path from 'path';
import { AssetRecord } from '../../../src/domain/types';

const OUTPUT_DIR = 'data/processed/assets';
const CORRIDORS_DIR = path.join(OUTPUT_DIR, 'corridors');
const INDEX_PATH = path.join(OUTPUT_DIR, 'corridors-index.json');
const LEGACY_MONOLITH_PATH = path.join(OUTPUT_DIR, 'corridors.json');

// Per-corridor map render cap. The page renders these points on a MapLibre canvas;
// 480k+ points cannot render and a 236MB monolith cannot be fetched in a browser.
// Stats below are computed over the FULL set (honest totals); the map shows the
// top-N by priority, and the UI surfaces "showing N of M" so nothing is hidden.
const RENDER_CAP = 5000;

const corridors = [
  {
    id: 'global-view',
    name: 'Global View',
    description: 'Macro overview of all tracked global assets across all regions.',
    bbox: { minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 }
  },
  {
    id: 'strait-of-hormuz',
    name: 'Strait of Hormuz',
    description: 'Critical chokepoint for global oil transit.',
    bbox: { minLat: 24.0, maxLat: 28.0, minLon: 54.0, maxLon: 58.0 }
  },
  {
    id: 'suez-canal',
    name: 'Suez Canal & Red Sea',
    description: 'Vital maritime route connecting Europe and Asia.',
    bbox: { minLat: 27.0, maxLat: 31.5, minLon: 32.0, maxLon: 34.0 }
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab el-Mandeb',
    description: 'Strategic link between the Red Sea and the Indian Ocean.',
    bbox: { minLat: 11.0, maxLat: 14.0, minLon: 42.0, maxLon: 45.0 }
  },
  {
    id: 'malacca-strait',
    name: 'Strait of Malacca',
    description: 'Primary shipping lane between the Indian and Pacific oceans.',
    bbox: { minLat: 1.0, maxLat: 6.0, minLon: 98.0, maxLon: 104.0 }
  },
  {
    id: 'panama-canal',
    name: 'Panama Canal',
    description: 'Artificial 82km waterway connecting the Atlantic and Pacific.',
    bbox: { minLat: 8.5, maxLat: 9.5, minLon: -80.0, maxLon: -79.0 }
  },
  {
    id: 'turkish-straits',
    name: 'Bosporus & Dardanelles',
    description: 'The sole maritime gateway to the Black Sea.',
    bbox: { minLat: 39.5, maxLat: 41.5, minLon: 26.0, maxLon: 30.0 }
  },
  {
    id: 'strait-of-gibraltar',
    name: 'Strait of Gibraltar',
    description: 'Connects the Atlantic Ocean to the Mediterranean Sea.',
    bbox: { minLat: 35.5, maxLat: 36.5, minLon: -6.5, maxLon: -5.0 }
  },
  {
    id: 'english-channel',
    name: 'English Channel',
    description: 'Busiest shipping lane connecting the North Sea to the Atlantic.',
    bbox: { minLat: 49.0, maxLat: 51.5, minLon: -5.0, maxLon: 2.0 }
  },
  {
    id: 'danish-straits',
    name: 'Danish Straits',
    description: 'Crucial transit route for Russian and Baltic exports.',
    bbox: { minLat: 54.0, maxLat: 58.0, minLon: 10.0, maxLon: 13.0 }
  },
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait',
    description: 'Major geopolitical flashpoint and shipping lane in East Asia.',
    bbox: { minLat: 22.0, maxLat: 26.0, minLon: 117.0, maxLon: 122.0 }
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea',
    description: 'Disputed maritime region facilitating one-third of global shipping.',
    bbox: { minLat: 4.0, maxLat: 22.0, minLon: 105.0, maxLon: 120.0 }
  },
  {
    id: 'cape-of-good-hope',
    name: 'Cape of Good Hope',
    description: 'Alternative global shipping route bypassing the Suez Canal.',
    bbox: { minLat: -36.0, maxLat: -33.0, minLon: 17.0, maxLon: 20.0 }
  }
];

type Bbox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

function isInside(lat: number, lon: number, bbox: Bbox) {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon;
}

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function priorityRank(asset: AssetRecord): number {
  const value = typeof asset.priority === 'string' ? asset.priority.toLowerCase() : '';
  return PRIORITY_RANK[value] ?? 4;
}

async function extractCorridors() {
  console.log('Extracting strategic corridor assets...');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(CORRIDORS_DIR)) fs.mkdirSync(CORRIDORS_DIR, { recursive: true });

  const corridorsData: Record<string, AssetRecord[]> = {};
  for (const c of corridors) corridorsData[c.id] = [];

  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json' && f !== 'corridors.json' && f !== 'corridors-index.json');

  for (const file of files) {
    const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
    try {
      const assets: AssetRecord[] = JSON.parse(content);
      for (const asset of assets) {
        if (asset.latitude === undefined || asset.longitude === undefined) continue;
        for (const corridor of corridors) {
          if (isInside(asset.latitude, asset.longitude, corridor.bbox)) {
            corridorsData[corridor.id].push(asset);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  const index = corridors.map((c) => {
    const all = corridorsData[c.id];
    // Full-set counts — these are the honest totals shown in the stat panel.
    const criticalCount = all.filter((a) => a.priority === 'critical').length;
    const energyCount = all.filter((a) => a.category === 'energy').length;
    const transportCount = all.filter((a) => a.category === 'transport').length;

    // Top-N by priority for the map render. Stable sort keeps original order within a tier.
    const rendered = [...all]
      .map((asset, i) => ({ asset, i }))
      .sort((a, b) => priorityRank(a.asset) - priorityRank(b.asset) || a.i - b.i)
      .slice(0, RENDER_CAP)
      .map((entry) => entry.asset);

    const detail = {
      id: c.id,
      name: c.name,
      description: c.description,
      bbox: c.bbox,
      totalAssetCount: all.length,
      renderedAssetCount: rendered.length,
      assets: rendered
    };
    fs.writeFileSync(path.join(CORRIDORS_DIR, `${c.id}.json`), JSON.stringify(detail));

    return {
      id: c.id,
      name: c.name,
      description: c.description,
      bbox: c.bbox,
      totalAssetCount: all.length,
      renderedAssetCount: rendered.length,
      criticalCount,
      energyCount,
      transportCount
    };
  });

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index));

  // Remove the legacy 236MB monolith so it never ships to the static export again.
  if (fs.existsSync(LEGACY_MONOLITH_PATH)) fs.unlinkSync(LEGACY_MONOLITH_PATH);

  const totalRendered = index.reduce((sum, c) => sum + c.renderedAssetCount, 0);
  const totalAll = index.reduce((sum, c) => sum + c.totalAssetCount, 0);
  console.log(
    `Generated corridors index (${index.length} corridors). Rendered ${totalRendered} of ${totalAll} assets across per-corridor files (cap ${RENDER_CAP}).`
  );
}

extractCorridors().catch(console.error);
