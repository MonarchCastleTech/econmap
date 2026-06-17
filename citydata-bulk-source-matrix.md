# City Data Bulk Source Matrix

This file maps the variables requested in `citydata.md` to bulk data sources that are:

- already downloaded locally
- good candidates to add next
- not realistically available as a trustworthy global bulk dataset

## Important Reality Check

There is **no single honest bulk source set** that fills every variable in `citydata.md` for **every city in the world**.

The correct approach is:

1. fill the globally available variables with bulk datasets
2. fill regional subsets where strong official bulk sources exist
3. leave the rest explicit as `null`, `known_unknown`, or `not_covered_yet`

## Already Downloaded Bulk Sources

### Canonical city identity / geography

- GeoNames all countries
  - Local: `data/raw/cities/bulk/geonames/allCountries/allCountries.txt`
  - Covers: city identity, coordinates, population, feature codes, admin codes, timezone, modification date
- GeoNames alternate names
  - Local: `data/raw/cities/bulk/geonames/alternateNamesV2/alternateNamesV2.txt`
  - Covers: aliases, alternate spellings, multilingual names
- GeoNames admin/country support files
  - Local:
    - `data/raw/cities/bulk/geonames/countryInfo.txt`
    - `data/raw/cities/bulk/geonames/admin1CodesASCII.txt`
    - `data/raw/cities/bulk/geonames/admin2Codes.txt`
    - `data/raw/cities/bulk/geonames/featureCodes_en.txt`
  - Covers: ISO2->ISO3, admin hierarchy, country names, feature-code validation

### Ports / airports / transport / infrastructure

- OurAirports
  - Local:
    - `data/raw/cities/bulk/ourairports/airports.csv`
    - `data/raw/cities/bulk/ourairports/countries.csv`
    - `data/raw/cities/bulk/ourairports/regions.csv`
    - `data/raw/cities/bulk/ourairports/runways.csv`
  - Covers: airports, scheduled service, runways, municipality, region join
- UN/LOCODE
  - Local:
    - `data/raw/cities/bulk/unlocode/loc242csv/2024-2 UNLOCODE CodeListPart1.csv`
    - `data/raw/cities/bulk/unlocode/loc242csv/2024-2 UNLOCODE CodeListPart2.csv`
    - `data/raw/cities/bulk/unlocode/loc242csv/2024-2 UNLOCODE CodeListPart3.csv`
    - `data/raw/cities/bulk/unlocode/loc242csv/2024-2 SubdivisionCodes.csv`
  - Covers: ports, airports, rail/transport functions, location codes, subdivisions, coordinates
- WRI Global Power Plant Database
  - Local: `data/raw/cities/bulk/wri/global_power_plant_database.csv`
  - Covers: utility/power assets, plant name, fuel, owner, capacity, coordinates, commissioning year
- World Port Index
  - Local:
    - `data/raw/cities/bulk/worldportindex/wpi_data_download.zip`
    - `data/raw/cities/bulk/worldportindex/wpi_data_download/wpi_data_download/WPI.csv`
    - `data/raw/cities/bulk/worldportindex/wpi_data_download/WPI_Explanation_of_Data_Fields.pdf`
  - Covers: richer port facilities, services, physical characteristics, harbour metadata, and port explanatory fields

### Urban display / map layers

- Natural Earth
  - Local:
    - `data/raw/cities/bulk/naturalearth/ne_10m_admin_0_countries/*`
    - `data/raw/cities/bulk/naturalearth/ne_10m_admin_1_states_provinces/*`
    - `data/raw/cities/bulk/naturalearth/ne_10m_populated_places/*`
    - `data/raw/cities/bulk/naturalearth/ne_10m_urban_areas/*`
  - Covers: display polygons, admin boundaries, urban areas, QA cross-checks

### Population, land area, built-up area, boundaries

- GHSL / GHS-WUP-MTUC
  - Local:
    - `data/raw/cities/bulk/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics.zip`
    - `data/raw/cities/bulk/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics/*`
    - `data/raw/cities/bulk/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_vector.zip`
    - `data/raw/cities/bulk/ghsl/GHS_WUP_MTUC_GLOBE_R2025A_V1_1_vector/*`
  - Covers: urban-centre population, land area, built-up area, centroids, and multi-temporal boundaries

### OECD metros / FUAs / cities

- OECD FUA economy and labour bulk CSVs
  - Local:
    - `data/raw/cities/bulk/oecd/oecd-fua-economy.csv`
    - `data/raw/cities/bulk/oecd/oecd-fua-labour.csv`
    - `data/raw/cities/bulk/oecd/oecd-dataflows.xml`
  - Covers: FUA/city GDP-related metrics, employment at place of work, labour productivity, labour force, employment, unemployment, and rates where OECD publishes them
- OECD city / FUA boundaries and municipality membership
  - Local:
    - `data/raw/cities/bulk/oecd/cities (4)/*`
    - `data/raw/cities/bulk/oecd/fuas (1)/*`
    - `data/raw/cities/bulk/oecd/list_of_municipalities_in_FUAs_and_Cities.csv`
  - Covers: city boundaries, FUA boundaries, municipality-to-city/FUA membership
  - Note: the legacy OECD metadata PDF URL returned `404` on `2026-03-14`, so it is not part of the verified local source set

### EU cities / Urban Audit

- Eurostat Cities / Urban Audit API pulls
  - Local:
    - `data/raw/cities/bulk/eurostat/inventory.xml`
    - `data/raw/cities/bulk/eurostat/urb_cpop1.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_cpopcb.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_cpopstr.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_clma.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_cecfi.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_ctran.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_cenv.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_ctour.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_clivcon.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_ceduc.tsv.gz`
    - `data/raw/cities/bulk/eurostat/urb_cfermor.tsv.gz`
    - `data/raw/cities/bulk/eurostat/URB_LLMA.tsv`
    - `data/raw/cities/bulk/eurostat/URB_LPOP1.tsv`
  - Covers: EU city/FUA population, labour market, economy and finance, transport, environment, tourism, living conditions, education

### Transit / mobility / service coverage

- Mobility Database GTFS catalog
  - Local: `data/raw/cities/bulk/mobilitydatabase/feeds_v2.csv`
  - Covers: transit feed presence, official feed URLs, municipality, subdivision, country, bounding boxes
- Ookla Open Data
  - Local:
    - `data/raw/cities/bulk/ookla/2025-10-01_performance_mobile_tiles.parquet`
    - `data/raw/cities/bulk/ookla/2025-10-01_performance_fixed_tiles.parquet`
    - `data/raw/cities/bulk/ookla/2025-10-01_performance_mobile_tiles/*`
    - `data/raw/cities/bulk/ookla/2025-10-01_performance_fixed_tiles/*`
  - Covers: global fixed/mobile broadband performance tiles as digital-infrastructure proxies

### Air quality / emissions proxy

- WHO Ambient Air Quality Database v2024
  - Local: `data/raw/cities/bulk/who/who_ambient_air_quality_database_v2024.xlsx`
  - Covers: city-level ambient air pollution observations where WHO has coverage
- Carbon Monitor Cities
  - Local:
    - `data/raw/cities/bulk/carbon-monitor/carbon-monitor-cities-live.csv`
    - `data/raw/cities/bulk/carbon-monitor/carbon-monitor-cities-figshare.zip`
    - `data/raw/cities/bulk/carbon-monitor/carbon-monitor-cities-figshare/*`
  - Covers: city-level emissions estimates and time series for covered cities

### Water / flood / climate exposure

- WRI Aqueduct 4.0 water-risk data
  - Local: `data/raw/cities/bulk/aqueduct/aqueduct-4-0-water-risk-data.zip`
  - Covers: water stress and flood-risk model layers
- JRC Global Surface Water helper package
  - Local:
    - `data/raw/cities/bulk/jrc/downloadWaterData_PythonV3_2021.zip`
    - `data/raw/cities/bulk/jrc/downloadWaterData_PythonV3_2021/*`
    - `data/raw/cities/bulk/jrc/DataUsersGuidev2021.pdf`
  - Covers: official bulk-download helper for the full Global Surface Water tile archive and documentation
  - Note: the helper package is downloaded locally; the full raster tile archive itself has not been mirrored into this repo because it is tile-based and substantially larger than the helper package

### Universities / R&D anchors

- ROR Data v2.1
  - Local:
    - `data/raw/cities/bulk/ror/v2.1-2026-01-15-ror-data/v2.1-2026-01-15-ror-data.csv`
    - `data/raw/cities/bulk/ror/v2.1-2026-01-15-ror-data/v2.1-2026-01-15-ror-data.json`
  - Covers: research organizations, universities, institutes, names, aliases, city/country locations, external IDs

## Strong Bulk Sources Still Worth Adding

These remain worth adding, but they are not yet downloaded locally.

### Headquarters / legal-entity city presence

- GLEIF Golden Copy / Concatenated Files
  - Official page: `https://www.gleif.org/en/services/gleif-services/access-lei-data/lei-download`
  - Direct-file family documented by GLEIF: Golden Copy and Concatenated Files
  - Why: official global legal entity data with headquarters addresses
  - Best use: company headquarters / legal entity city presence, not factories or local branches

### Climate / heat additions

- NASA urban heat datasets
  - Official page: `https://data.nasa.gov/dataset/global-urban-heat-island-uhi-data-set-2013`
  - Why: urban heat island intensity and heat exposure proxies
  - Best use: climate / heat exposure

### Digital infrastructure proxies

- OpenCellID
  - Official page: `https://www.opencellid.org/downloads`
  - Why: global cell tower coverage proxy
  - Best use: mobile-network presence proxy, with lower evidentiary strength than official telecom data

## Variable Coverage Matrix

### A. City identity and geography

- Canonical name / aliases / admin hierarchy / coordinates: covered now
- Population: covered now via GeoNames and strengthened by GHSL
- Land area / density / boundary: covered now via GHSL, with Natural Earth still useful as a display/QA layer
- Metro relationship: partial, improved by OECD and Eurostat FUA/city datasets

### B. Economic factbook

- City GDP / GVA / GRP: not globally covered; partial now via OECD and Eurostat
- GDP per capita / output per capita: same as above
- Employment / unemployment: partial now via OECD, Eurostat, BEA/BLS for the US
- Wage / income proxies: partial via OECD/Eurostat only
- Sector composition: still partial; I did not find an honest global bulk source for full city-level sector mix
- Trade / logistics role: partial now via UN/LOCODE, airports, WPI, GTFS, and power
- Industrial output: no trustworthy global open bulk source found
- Office / industrial rent proxies: no trustworthy global open bulk source found
- Cost signals: no trustworthy global open bulk source found

### C. Investor / site-selection

- Ports / airports / rail transport: covered now via UN/LOCODE, OurAirports, and WPI; can still be strengthened with OSM bulk extracts
- Utilities / power assets: covered now for power plants via WRI GPPD
- Universities / R&D anchors: covered now via ROR
- Transit / logistics access: partial now via GTFS + UN/LOCODE + airports
- Major companies present in city: partial only via GLEIF HQ/legal entities; no good global open bulk for actual local operating presence
- Major factories / plants: no trustworthy global open bulk source found
- Industrial parks / SEZs / free zones: no strong global official open bulk source found
- Official incentives: no trustworthy global bulk source found
- Workforce / talent signals: partial via ROR, OECD, Eurostat

### D. Urban intelligence

- Transit coverage / major transit modes: partial now via Mobility Database GTFS and OECD/Eurostat transport tables
- Congestion / commute signals: no strong global official open bulk source found
- Housing pressure / rent pressure: no strong global official open bulk source found
- Air quality / emissions: partial now via WHO and Carbon Monitor Cities
- Climate / flood / heat exposure: partial now via Aqueduct, GHSL, and JRC surface water helper tooling; can be improved further with NASA UHI
- Electricity / water / utility reliability: no trustworthy global open bulk source found
- Internet / fiber / digital infrastructure proxies: available now via Ookla, can be extended with OpenCellID
- Resilience / adaptation indicators: partial now after adding climate/water hazard layers
- Inequality / poverty / informality: no trustworthy global city-complete bulk source found

## Variables That Still Need Explicit Gaps

Even after adding the best bulk sources above, these should still default to `null` / `not_covered_yet` unless city-specific trusted sources are added:

- factory employment estimates
- industrial park tenant rosters for every city
- official incentives for every city
- industrial and office rents globally
- city-wide land cost proxies globally
- utility reliability for every city
- congestion and commute metrics for every city
- major company local branch/facility presence for every city
- major warehouse/logistics center coverage for every city

## Recommended Priority Order

1. Add GLEIF
2. Add NASA urban heat data
3. Add OpenCellID
4. Add country-specific official city datasets where the website needs higher confidence than the global bulk layer can provide

## Bottom Line

I did not forget the missing `citydata.md` variables.

What happened is:

- the first bulk set covered the globally reliable infrastructure/registry foundation
- the second bulk set added transit, power, air quality, and research anchors
- the third bulk set added GHSL, OECD FUA economy/labour, Eurostat city/FUA tables, WPI, Aqueduct, JRC surface-water helper tooling, Ookla, and Carbon Monitor Cities
- the remaining variables split into:
  - available through more bulk datasets with partial/global coverage
  - not honestly available as a trustworthy global city-complete bulk source
