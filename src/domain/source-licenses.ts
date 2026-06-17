/**
 * Vetted license registry for every data source that appears in shipped EconMap artifacts.
 * The data audit (`npm run audit:data`) reads this as the source of truth: any active sourceId that
 * is missing here (unknown) or marked `commercial: true` FAILS the build. This is what keeps a
 * non-public / unlicensed source (e.g. TeleGeography's commercial geocoded data) from shipping.
 */
export type SourceLicense = {
  label: string;
  license: string;
  /** true = not a free/public dataset; must NOT ship without explicit clearance → audit failure. */
  commercial: boolean;
  url?: string;
  /** "as-of"/freshness note for frozen or historical corpora (surfaced honestly in the UI). */
  asOf?: string;
};

// Keyed by sourceId. Both spellings that appear in real data are included
// ("un/locode" in city dossier source bundles, "unlocode" in asset records).
export const SOURCE_LICENSES: Record<string, SourceLicense> = {
  geonames: { label: "GeoNames", license: "CC BY 4.0", commercial: false, url: "https://www.geonames.org/" },
  ourairports: { label: "OurAirports", license: "Public Domain", commercial: false, url: "https://ourairports.com/data/" },
  unlocode: { label: "UN/LOCODE", license: "UN (free use)", commercial: false, url: "https://unece.org/trade/uncefact/unlocode" },
  "un/locode": { label: "UN/LOCODE", license: "UN (free use)", commercial: false, url: "https://unece.org/trade/uncefact/unlocode" },
  "world-port-index": { label: "World Port Index", license: "U.S. Gov / Public Domain", commercial: false, url: "https://msi.nga.mil/" },
  ror: { label: "Research Organization Registry", license: "CC0", commercial: false, url: "https://ror.org/" },
  wri: { label: "WRI Global Power Plant Database", license: "CC BY 4.0", commercial: false, url: "https://datasets.wri.org/dataset/globalpowerplantdatabase" },
  "usgs-mrds": {
    label: "USGS Mineral Resources Data System",
    license: "Public Domain",
    commercial: false,
    url: "https://mrdata.usgs.gov/mrds/",
    asOf: "2011 (systematic updates ceased; US-heavy)",
  },
  // COMMERCIAL — present in asset data today; the audit flags it so it cannot ship unlicensed.
  telegeography: {
    label: "TeleGeography Submarine Cable Map",
    license: "Commercial (annual geocoded-map-data license)",
    commercial: true,
    url: "https://www2.telegeography.com/license-geocoded-map-data",
  },
};

/** Normalize a sourceId for lookup (lowercase). Both "un/locode" and "unlocode" are registered keys. */
export function getSourceLicense(sourceId: string): SourceLicense | undefined {
  return SOURCE_LICENSES[sourceId] ?? SOURCE_LICENSES[sourceId.toLowerCase()];
}
