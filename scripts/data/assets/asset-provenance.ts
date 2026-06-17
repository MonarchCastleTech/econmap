/**
 * Asset provenance gate (P0.2 — no-fabrication non-negotiable).
 *
 * Single source of truth for deciding whether an AssetRecord is backed by a real,
 * point-geometry OSINT source or is synthetic / non-traceable. The publish guard and the
 * regression test both import from here so the rule cannot drift.
 *
 * Rule: an asset is source-backed iff it carries at least one sourceId and EVERY sourceId is
 * in REAL_ASSET_SOURCE_IDS. Anything else (no source, a known-synthetic source, or a source
 * outside the real allowlist) is treated as synthetic and must never be published to the UI.
 */

/**
 * Real OSINT sources that legitimately provide exact point geometry for assets, matching the
 * extractors under scripts/data/assets/. Adding a NEW real source (e.g. peeringdb, opencellid,
 * healthsites, openinframap) is an explicit, reviewed change to this set.
 */
export const REAL_ASSET_SOURCE_IDS: ReadonlySet<string> = new Set([
  "ourairports", // OurAirports — airports/heliports (exact)
  "world-port-index", // NGA World Port Index — seaports (exact)
  "unlocode", // UN/LOCODE — ports / rail / logistics hubs
  "ror", // Research Organization Registry — universities / research / hospitals (org)
  "telegeography", // TeleGeography — subsea cable landing points (exact)
  "wri", // WRI Global Power Plant Database — power plants (exact)
  "usgs-mrds", // USGS Mineral Resources Data System — mines (exact)
]);

/**
 * Known-synthetic / misused source ids that must never appear on a published asset point.
 * 'ookla' is a real BROADBAND-TILE source but was misused to stamp fabricated, Math.random()
 * base-station coordinates; as a per-asset point geometry source it is never legitimate.
 */
export const SYNTHETIC_ASSET_SOURCE_IDS: ReadonlySet<string> = new Set([
  "mock-telecom-registry",
  "ookla",
]);

export type MinimalAssetRecord = {
  sourceIds?: string[];
  subtype?: string;
  name?: string;
  assetId?: string;
};

/** True when the record is NOT traceable to a real point-geometry source (i.e. must be quarantined). */
export function isSyntheticAssetRecord(record: MinimalAssetRecord): boolean {
  const ids = record.sourceIds ?? [];
  if (ids.length === 0) return true; // no source label => not traceable
  if (ids.some((id) => SYNTHETIC_ASSET_SOURCE_IDS.has(id))) return true;
  if (!ids.every((id) => REAL_ASSET_SOURCE_IDS.has(id))) return true;
  return false;
}

/** Inverse of isSyntheticAssetRecord — every sourceId is in the real allowlist. */
export function isSourceBackedAssetRecord(record: MinimalAssetRecord): boolean {
  return !isSyntheticAssetRecord(record);
}
