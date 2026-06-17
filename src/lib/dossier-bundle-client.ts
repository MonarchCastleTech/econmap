/**
 * Client reader for the Range-addressable dossier bundle (see scripts/data/cities/build-dossier-bundle.ts).
 * Fetches the small index once, then one HTTP Range request per city returns that city's gzip blob,
 * which is decompressed in the browser. Replaces 4 per-city file fetches with 1 byte-range fetch.
 */
import { assetUrl } from "@/lib/asset-url";

const DOSSIERS_BASE = assetUrl("/data/cities/dossiers");

export type DossierPayload = { w: unknown; e: unknown; s: unknown; c: unknown };

type DossierIndex = {
  format: string;
  shardCount: number;
  shards: { file: string; bytes: number }[];
  entries: Record<string, [number, number, number]>; // cityId -> [shard, offset, length]
};

let indexPromise: Promise<DossierIndex | null> | null = null;
// Share a single Range request across the (up to 4) concurrent loader calls for the same city.
const inFlight = new Map<string, Promise<DossierPayload | null>>();

function getIndex(): Promise<DossierIndex | null> {
  if (!indexPromise) {
    indexPromise = fetch(`${DOSSIERS_BASE}/index.json`)
      .then((r) => (r.ok ? (r.json() as Promise<DossierIndex>) : null))
      .catch(() => null);
  }
  return indexPromise;
}

async function gunzip(buf: ArrayBuffer): Promise<string> {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

export async function loadDossier(cityId: string): Promise<DossierPayload | null> {
  const cached = inFlight.get(cityId);
  if (cached) return cached;

  const promise = (async (): Promise<DossierPayload | null> => {
    const index = await getIndex();
    const entry = index?.entries[cityId];
    if (!index || !entry) return null;
    const [shard, offset, length] = entry;
    const url = `${DOSSIERS_BASE}/${index.shards[shard].file}`;
    try {
      const res = await fetch(url, { headers: { Range: `bytes=${offset}-${offset + length - 1}` } });
      if (res.status !== 206 && res.status !== 200) return null;
      const full = await res.arrayBuffer();
      // A CDN node that ignores Range returns 200 with the whole shard — slice client-side.
      const slice = res.status === 206 ? full : full.slice(offset, offset + length);
      return JSON.parse(await gunzip(slice)) as DossierPayload;
    } catch {
      return null;
    }
  })();

  inFlight.set(cityId, promise);
  // Keep a small LRU-ish cache: drop after resolution only if the map grew large.
  promise.finally(() => {
    if (inFlight.size > 64) inFlight.delete(cityId);
  });
  return promise;
}
