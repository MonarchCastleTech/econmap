import fs from "node:fs";
import path from "node:path";

const BULK_ROOT = path.join(process.cwd(), "data", "raw", "cities", "bulk");

type BulkSourceEntry = {
  absolutePath: string;
  exists: boolean;
  purpose: string;
  relativePath: string;
  required: boolean;
  sizeBytes: number | null;
  sourceUrl: string;
};

type BulkSourceManifest = {
  geonames: {
    admin1Codes: BulkSourceEntry;
    admin2Codes: BulkSourceEntry;
    allCountries: BulkSourceEntry;
    alternateNames: BulkSourceEntry;
    countryInfo: BulkSourceEntry;
    featureCodes: BulkSourceEntry;
  };
  mobilityDatabase: {
    feeds: BulkSourceEntry;
  };
  naturalEarth: {
    admin0: BulkSourceEntry;
    admin1: BulkSourceEntry;
    populatedPlaces: BulkSourceEntry;
    urbanAreas: BulkSourceEntry;
  };
  ourAirports: {
    airports: BulkSourceEntry;
    countries: BulkSourceEntry;
    regions: BulkSourceEntry;
    runways: BulkSourceEntry;
  };
  researchOrganizations: {
    csv: BulkSourceEntry;
    json: BulkSourceEntry;
  };
  unlocode: {
    part1: BulkSourceEntry;
    part2: BulkSourceEntry;
    part3: BulkSourceEntry;
    subdivisionCodes: BulkSourceEntry;
  };
  who: {
    airQuality: BulkSourceEntry;
  };
  wri: {
    powerPlants: BulkSourceEntry;
  };
  gleif: {
    lei2: BulkSourceEntry;
    rr: BulkSourceEntry;
    repex: BulkSourceEntry;
  };
  ghsl: {
    statistics: BulkSourceEntry;
    vector: BulkSourceEntry;
  };
  oecd: {
    fuaEconomy: BulkSourceEntry;
    fuaLabour: BulkSourceEntry;
    municipalities: BulkSourceEntry;
    citiesBoundaries: BulkSourceEntry;
    fuasBoundaries: BulkSourceEntry;
  };
  eurostat: {
    inventory: BulkSourceEntry;
    cpop1: BulkSourceEntry;
    cpopcb: BulkSourceEntry;
    cpopstr: BulkSourceEntry;
    clma: BulkSourceEntry;
    cecfi: BulkSourceEntry;
    ctran: BulkSourceEntry;
    cenv: BulkSourceEntry;
    ctour: BulkSourceEntry;
    clivcon: BulkSourceEntry;
    ceduc: BulkSourceEntry;
    cfermor: BulkSourceEntry;
    llma: BulkSourceEntry;
    lpop1: BulkSourceEntry;
  };
  worldPortIndex: {
    wpi: BulkSourceEntry;
  };
  usgs: {
    mrds: BulkSourceEntry;
  };
  aqueduct: {
    waterRisk: BulkSourceEntry;
  };
  carbonMonitor: {
    live: BulkSourceEntry;
    figshare: BulkSourceEntry;
  };
  ookla: {
    mobile: BulkSourceEntry;
    fixed: BulkSourceEntry;
  };
  jrc: {
    helperPackage: BulkSourceEntry;
  };
};

function buildEntry(relativePath: string, sourceUrl: string, purpose: string, required = true): BulkSourceEntry {
  const absolutePath = path.join(BULK_ROOT, ...relativePath.split("/"));
  const exists = fs.existsSync(absolutePath);
  const sizeBytes = exists ? fs.statSync(absolutePath).size : null;

  return {
    absolutePath,
    exists,
    purpose,
    relativePath,
    required,
    sizeBytes,
    sourceUrl,
  };
}

function flattenEntries(value: BulkSourceManifest | Record<string, unknown>): BulkSourceEntry[] {
  const entries: BulkSourceEntry[] = [];

  for (const item of Object.values(value)) {
    if (!item || typeof item !== "object") {
      continue;
    }

    if ("absolutePath" in item) {
      entries.push(item as BulkSourceEntry);
      continue;
    }

    entries.push(...flattenEntries(item as Record<string, unknown>));
  }

  return entries;
}

export function getBulkSourceManifest(): BulkSourceManifest {
  return {
    geonames: {
      admin1Codes: buildEntry(
        "geonames/admin1CodesASCII.txt",
        "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
        "Maps GeoNames admin1 codes to human-readable names.",
      ),
      admin2Codes: buildEntry(
        "geonames/admin2Codes.txt",
        "https://download.geonames.org/export/dump/admin2Codes.txt",
        "Maps GeoNames admin2 codes to human-readable names.",
      ),
      allCountries: buildEntry(
        "geonames/allCountries/allCountries.txt",
        "https://download.geonames.org/export/dump/allCountries.zip",
        "Canonical global place registry with coordinates, feature codes, and population.",
      ),
      alternateNames: buildEntry(
        "geonames/alternateNamesV2/alternateNamesV2.txt",
        "https://download.geonames.org/export/dump/alternateNamesV2.zip",
        "GeoNames alternate names and aliases keyed by geoname id.",
      ),
      countryInfo: buildEntry(
        "geonames/countryInfo.txt",
        "https://download.geonames.org/export/dump/countryInfo.txt",
        "Country metadata used to map ISO2 to ISO3 and country labels.",
      ),
      featureCodes: buildEntry(
        "geonames/featureCodes_en.txt",
        "https://download.geonames.org/export/dump/featureCodes_en.txt",
        "Feature code descriptions used to validate populated-place rows.",
      ),
    },
    mobilityDatabase: {
      feeds: buildEntry(
        "mobilitydatabase/feeds_v2.csv",
        "https://files.mobilitydatabase.org/feeds_v2.csv",
        "Global GTFS feed catalog used as a transit coverage proxy.",
        false,
      ),
    },
    naturalEarth: {
      admin0: buildEntry(
        "naturalearth/ne_10m_admin_0_countries.zip",
        "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries.zip",
        "Natural Earth admin-0 layer for display and QA.",
        false,
      ),
      admin1: buildEntry(
        "naturalearth/ne_10m_admin_1_states_provinces.zip",
        "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip",
        "Natural Earth admin-1 layer for display and QA.",
        false,
      ),
      populatedPlaces: buildEntry(
        "naturalearth/ne_10m_populated_places.zip",
        "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_populated_places.zip",
        "Natural Earth populated places layer for QA and lightweight display.",
        false,
      ),
      urbanAreas: buildEntry(
        "naturalearth/ne_10m_urban_areas.zip",
        "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_urban_areas.zip",
        "Natural Earth urban areas for map overlays.",
        false,
      ),
    },
    ourAirports: {
      airports: buildEntry(
        "ourairports/airports.csv",
        "https://ourairports.com/data/airports.csv",
        "Airport master table with exact coordinates and municipality fields.",
      ),
      countries: buildEntry(
        "ourairports/countries.csv",
        "https://ourairports.com/data/countries.csv",
        "Country lookup table for OurAirports joins.",
      ),
      regions: buildEntry(
        "ourairports/regions.csv",
        "https://ourairports.com/data/regions.csv",
        "Region lookup table for OurAirports joins.",
      ),
      runways: buildEntry(
        "ourairports/runways.csv",
        "https://ourairports.com/data/runways.csv",
        "Runway data used to summarize airport scale and capabilities.",
      ),
    },
    researchOrganizations: {
      csv: buildEntry(
        "ror/v2.1-2026-01-15-ror-data/v2.1-2026-01-15-ror-data.csv",
        "https://zenodo.org/api/records/18260365/files/v2.1-2026-01-15-ror-data.zip/content",
        "Research Organization Registry CSV used for university and R&D anchor coverage.",
        false,
      ),
      json: buildEntry(
        "ror/v2.1-2026-01-15-ror-data/v2.1-2026-01-15-ror-data.json",
        "https://zenodo.org/api/records/18260365/files/v2.1-2026-01-15-ror-data.zip/content",
        "Research Organization Registry JSON used when nested metadata is needed.",
        false,
      ),
    },
    unlocode: {
      part1: buildEntry(
        "unlocode/loc242csv/2024-2 UNLOCODE CodeListPart1.csv",
        "https://service.unece.org/trade/locode/loc242csv.zip",
        "UN/LOCODE part 1 for transport and trade locations.",
      ),
      part2: buildEntry(
        "unlocode/loc242csv/2024-2 UNLOCODE CodeListPart2.csv",
        "https://service.unece.org/trade/locode/loc242csv.zip",
        "UN/LOCODE part 2 for transport and trade locations.",
      ),
      part3: buildEntry(
        "unlocode/loc242csv/2024-2 UNLOCODE CodeListPart3.csv",
        "https://service.unece.org/trade/locode/loc242csv.zip",
        "UN/LOCODE part 3 for transport and trade locations.",
      ),
      subdivisionCodes: buildEntry(
        "unlocode/loc242csv/2024-2 SubdivisionCodes.csv",
        "https://service.unece.org/trade/locode/loc242csv.zip",
        "UN/LOCODE subdivision lookup table for region joins.",
      ),
    },
    who: {
      airQuality: buildEntry(
        "who/who_ambient_air_quality_database_v2024.xlsx",
        "https://cdn.who.int/media/docs/default-source/air-pollution-documents/air-quality-and-health/who_ambient_air_quality_database_version_2024_%28v6.1%29.xlsx?download=true&sfvrsn=c504c0cd_3",
        "WHO city-level ambient air quality observations.",
        false,
      ),
    },
    wri: {
      powerPlants: buildEntry(
        "wri/global_power_plant_database.csv",
        "https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv",
        "Global power plant inventory for utility and power asset coverage.",
        false,
      ),
    },
    gleif: {
      lei2: buildEntry(
        "gleif/lei2-latest.zip",
        "https://leidata.gleif.org/api/v1/concatenated-files/lei2/latest/zip",
        "Official GLEIF LEI concatenated file for legal-entity and headquarters presence.",
      ),
      rr: buildEntry(
        "gleif/rr-latest.zip",
        "https://leidata.gleif.org/api/v1/concatenated-files/rr/latest/zip",
        "Official GLEIF RR (Relationship Record) concatenated file.",
      ),
      repex: buildEntry(
        "gleif/repex-latest.zip",
        "https://leidata.gleif.org/api/v1/concatenated-files/repex/latest/zip",
        "Official GLEIF Reporting Exceptions concatenated file.",
      ),
    },
    ghsl: {
      statistics: buildEntry(
        "ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics/GHS_WUP_MTUC_MT_GLOBE_R2025A_v1_1.xlsx",
        "https://ghsl.jrc.ec.europa.eu/download.php",
        "GHSL urban centre population, land area, and multi-temporal boundary statistics.",
      ),
      vector: buildEntry(
        "ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_vector.zip",
        "https://ghsl.jrc.ec.europa.eu/download.php",
        "GHSL urban centre vector boundaries for spatial joins.",
        false,
      ),
    },
    oecd: {
      fuaEconomy: buildEntry(
        "oecd/oecd-fua-economy.csv",
        "https://stats.oecd.org/",
        "OECD FUA economy indicators including GDP and productivity.",
      ),
      fuaLabour: buildEntry(
        "oecd/oecd-fua-labour.csv",
        "https://stats.oecd.org/",
        "OECD FUA labour market indicators including employment and unemployment.",
      ),
      municipalities: buildEntry(
        "oecd/list_of_municipalities_in_FUAs_and_Cities.csv",
        "https://stats.oecd.org/",
        "OECD municipality to FUA/city membership mapping.",
      ),
      citiesBoundaries: buildEntry(
        "oecd/cities (4)/cities.shp",
        "https://stats.oecd.org/",
        "OECD city boundaries for spatial representation.",
        false,
      ),
      fuasBoundaries: buildEntry(
        "oecd/fuas (1)/fuas.shp",
        "https://stats.oecd.org/",
        "OECD functional urban area boundaries.",
        false,
      ),
    },
    eurostat: {
      inventory: buildEntry(
        "eurostat/inventory.xml",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Cities/Urban Audit data inventory.",
        false,
      ),
      cpop1: buildEntry(
        "eurostat/urb_cpop1.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit population on 1 January.",
        false,
      ),
      cpopcb: buildEntry(
        "eurostat/urb_cpopcb.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit population by citizenship.",
        false,
      ),
      cpopstr: buildEntry(
        "eurostat/urb_cpopstr.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit population by age and sex.",
        false,
      ),
      clma: buildEntry(
        "eurostat/urb_clma.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit labour market and employment data.",
        false,
      ),
      cecfi: buildEntry(
        "eurostat/urb_cecfi.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit economic and financial indicators.",
        false,
      ),
      ctran: buildEntry(
        "eurostat/urb_ctran.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit transport and mobility data.",
        false,
      ),
      cenv: buildEntry(
        "eurostat/urb_cenv.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit environment and climate data.",
        false,
      ),
      ctour: buildEntry(
        "eurostat/urb_ctour.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit tourism statistics.",
        false,
      ),
      clivcon: buildEntry(
        "eurostat/urb_clivcon.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit living conditions data.",
        false,
      ),
      ceduc: buildEntry(
        "eurostat/urb_ceduc.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit education and training data.",
        false,
      ),
      cfermor: buildEntry(
        "eurostat/urb_cfermor.tsv.gz",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Urban Audit urban morphology data.",
        false,
      ),
      llma: buildEntry(
        "eurostat/URB_LLMA.tsv",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat Local Labour Market Areas.",
        false,
      ),
      lpop1: buildEntry(
        "eurostat/URB_LPOP1.tsv",
        "https://ec.europa.eu/eurostat/web/cities/data",
        "Eurostat population for Local Labour Market Areas.",
        false,
      ),
    },
    worldPortIndex: {
      wpi: buildEntry(
        "worldportindex/wpi_data_download/wpi_data_download/WPI.csv",
        "https://msi.nga.mil/NGAPortal/MSI.portal",
        "World Port Index comprehensive port facilities and services data.",
      ),
    },
    usgs: {
      mrds: buildEntry(
        "usgs/mrds.csv",
        "https://mrdata.usgs.gov/mrds/rdbms-tab-all.zip",
        "USGS Mineral Resources Data System: global mineral sites with exact coordinates (public domain).",
        false,
      ),
    },
    aqueduct: {
      waterRisk: buildEntry(
        "aqueduct/aqueduct-4-0-water-risk-data.zip",
        "https://www.wri.org/aqueduct",
        "WRI Aqueduct 4.0 water stress and flood risk data.",
        false,
      ),
    },
    carbonMonitor: {
      live: buildEntry(
        "carbon-monitor/carbon-monitor-cities-live.csv",
        "https://carbonmonitor.org/cities/",
        "Carbon Monitor Cities daily emissions estimates.",
        false,
      ),
      figshare: buildEntry(
        "carbon-monitor/carbon-monitor-cities-figshare.zip",
        "https://figshare.com/",
        "Carbon Monitor Cities historical emissions dataset.",
        false,
      ),
    },
    ookla: {
      mobile: buildEntry(
        "ookla/2025-10-01_performance_mobile_tiles.parquet",
        "https://www.speedtest.net/insights/open-data/",
        "Ookla mobile broadband performance tiles as digital infrastructure proxy.",
        false,
      ),
      fixed: buildEntry(
        "ookla/2025-10-01_performance_fixed_tiles.parquet",
        "https://www.speedtest.net/insights/open-data/",
        "Ookla fixed broadband performance tiles as digital infrastructure proxy.",
        false,
      ),
    },
    jrc: {
      helperPackage: buildEntry(
        "jrc/downloadWaterData_PythonV3_2021.zip",
        "https://water.jrc.ec.europa.eu/",
        "JRC Global Surface Water download helper package and documentation.",
        false,
      ),
    },
  };
}

export function assertRequiredBulkSourcesExist(manifest = getBulkSourceManifest()) {
  const missing = flattenEntries(manifest)
    .filter((entry) => entry.required && !entry.exists);

  if (missing.length === 0) {
    return manifest;
  }

  const detail = missing
    .map((entry) => `- ${entry.relativePath} (${entry.sourceUrl})`)
    .join("\n");

  throw new Error(`Missing required bulk city data sources:\n${detail}`);
}
