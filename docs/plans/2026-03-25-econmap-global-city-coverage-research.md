# EconMap Global City Coverage Research

Date: 2026-03-25

## Executive Summary

Literal universal completeness is not achievable from public data alone. There is no single global public source that provides every city in the world with every requested unit class at exact-site quality. Some categories are strong globally, some are partly global, and some only exist in national or city open-data portals.

The viable path is a federated, city-first evidence system:

1. A universal city spine for every city.
2. A global base extraction stack for the broadest unit classes.
3. Specialist global registries for categories that have real public databases.
4. Country and regulator connectors for categories where global public data is weak.
5. A city-specific source hunt workflow when a city-category remains empty.

If EconMap adopts that architecture, it can become:

- globally city-complete as a dossier shell
- broadly city-complete for transport, civic POI, buildings, and many public-service classes
- strong but not universal for telecom, power grid, data centers, health, SEZ, and military-public-data
- explicit and honest about gaps where no public source exists

## Research Questions

1. What public global sources can support a true city-first atlas across the missing unit classes?
2. Which categories can be saturated globally from open data versus only partially covered?
3. What technical architecture can ingest and reconcile those sources at city scale?
4. What should the parser and acquisition roadmap be for EconMap?

## Methodology

I prioritized primary or near-primary sources: official documentation, official data catalogs, official download servers, and project-maintainer documentation. I focused on sources that can actually be operationalized into a city-level data pipeline rather than high-level reports or marketing pages.

Limits:

- Some categories do not have a trustworthy, open, global registry.
- Some public sources are community-curated and vary in quality by country.
- Several candidate sources require federation with national open-data portals to approach real completeness.

## Key Findings

### 1. The best universal city spine is a hybrid, not a single source

Recommended stack:

- GeoNames for global city registry breadth and daily exports.
- Overture Divisions for city and sub-city geometries and modern place hierarchy.
- Existing GHSL/GHSL-like settlement geometry for city footprint support where useful.

Why:

- GeoNames provides daily worldwide extracts and very broad settlement coverage.
- Overture Divisions provides point, line, and polygon representations for countries, regions, cities, and neighborhoods.
- No single source alone is sufficient for global city identity, geometry, aliases, and containment.

### 2. Overture + OSM is the only realistic broad global foundation for many missing unit classes

For the missing classes the broadest open global path is:

- Overture Places for normalized global POI.
- Overture Buildings for building footprints.
- Overture Transportation for roads, rail, and water segments.
- Geofabrik OSM extracts for country and regional raw OSM ingestion.
- Overpass for small-area refreshes and targeted city recrawls.

This combination is the only plausible way to fill large portions of:

- roads
- bridges
- tunnels
- hospitals
- clinics
- schools
- police
- fire
- government facilities
- industrial zones
- warehouses
- data-center buildings
- military-public-data features

### 3. Several categories require specialist registries on top of OSM/Overture

Global specialist sources with real operational value:

- PeeringDB for IXPs, interconnection facilities, and network presence.
- OpenInfraMap as an OSM-derived power and telecom infrastructure view for substations and transmission.
- OpenCelliD for community-derived global cell tower observations.
- Healthsites for a health-facility-focused global dataset.
- World Bank SEZ for a public SEZ dataset.

These are not replacements for OSM/Overture. They are category-specific upgrades.

### 4. Some categories remain structurally hard

The hardest categories to make truly global from public data are:

- fiber/backbone
- official 5G/mobile coverage polygons
- police
- fire
- government facilities
- military-public-data
- data centers at reliable exact-site completeness

For these, the correct product strategy is:

- use the best global public layer where available
- fall back to country-specific official sources
- if neither exists, show a source-backed gap instead of faking coverage

## Source Matrix

| Category | Best global public source | Role in EconMap | Notes |
| --- | --- | --- | --- |
| City registry | GeoNames | canonical city list, names, population, aliases | broadest practical global baseline |
| City boundaries | Overture Divisions | city polygons and place hierarchy | better modern boundary spine than GeoNames alone |
| General facilities / POI | Overture Places | schools, hospitals, offices, services, amenities | strong global POI normalization with categories and source lineage |
| Buildings | Overture Buildings | building footprints, possible data centers, warehouses | useful for exact-site and land-use context |
| Roads / rail / waterways | Overture Transportation | road and rail network centerlines | strong global transport graph |
| Raw feature fallback | Geofabrik OSM extracts | bulk per-country ingestion and exact tag parsing | daily extracts; essential for tag-rich parsing |
| Small-area city refresh | Overpass API | targeted city recrawls and spot refreshes | best for city-specific backfills, not whole-world bulk |
| IXPs | PeeringDB | internet exchanges | strong public interconnection source |
| Interconnection facilities / some data centers | PeeringDB | facilities, netfac, ix, ixlan, netixlan | good for data-center/interconnection ecosystems, not all data centers |
| Power substations / transmission | OpenInfraMap + OSM | derived grid infrastructure | sourced from OSM; good but community-quality |
| Mobile tower observations | OpenCelliD | cell tower and operator evidence | tower observations, not official carrier coverage polygons |
| Hospitals / clinics | Healthsites + OSM/Overture | health facilities | Healthsites is health-focused but still incomplete in many countries |
| SEZ | World Bank SEZ + OSM | SEZ baseline + spatial fallback | public dataset is useful but explicitly incomplete |
| Ports | World Port Index + UN/LOCODE + OSM/Overture | ports and logistics nodes | already in repo, can be expanded |
| Airports | OurAirports + OSM/Overture | airports | already in repo |
| Rail infra detail | OSM / OpenRailwayMap-derived logic | stations, yards, lines | OpenRailwayMap is OSM-based, so use OSM tags directly in pipeline |
| Schools | OSM / Overture Places | schools and campuses | no authoritative global public registry |
| Police | OSM | police stations and facilities | usually requires country-specific portals for stronger coverage |
| Fire | OSM | fire stations | same limitation as police |
| Government facilities | OSM | ministries, municipal offices, courts, agencies | country-specific official portals improve quality |
| Industrial zones | OSM landuse + national zone lists | industrial land and parks | global via OSM, stronger via national registries |
| Warehouses | OSM buildings / landuse | storage and logistics facilities | broad but variable quality |
| Military-public-data | OSM public mapping | bases, checkpoints, ranges | public and incomplete; legal sensitivity varies by country |

## Category-by-Category Practical Path

### IXPs

Primary:

- PeeringDB API

Implementation:

- ingest `ix`, `fac`, `ixlan`, `netixlan`, `netfac`
- normalize cities using facility and exchange locality strings
- expose exact-site facilities when coordinates exist
- show IXP presence and connected-network counts in city dossiers

### Fiber / Backbone

Primary:

- OSM / Geofabrik extracts
- OpenInfraMap-derived OSM infrastructure
- PeeringDB facilities for interconnection concentration

Reality:

- there is no known open authoritative global terrestrial fiber backbone registry with reliable exact routes

Implementation:

- treat this as a composite category, not a single dataset
- parse telecom tags and infrastructure corridors from OSM
- use OpenInfraMap-compatible power/telecom extraction rules
- add national telecom regulator datasets where available

### Substations / Transmission

Primary:

- OSM / Geofabrik
- OpenInfraMap

Implementation:

- parse `power=substation`, `power=line`, related voltage/operator tags
- publish exact assets and linear transmission corridors
- show source labels as `OpenStreetMap` and `OpenInfraMap`

### Roads / Bridges / Tunnels

Primary:

- Overture Transportation
- OSM / Geofabrik raw extracts

Implementation:

- use Overture for base road graph
- use OSM tags to add bridge and tunnel semantics
- aggregate counts and class lengths by city
- publish bridge and tunnel evidence separately in city dossiers

### Hospitals / Clinics

Primary:

- Overture Places
- Healthsites
- OSM raw tags

Implementation:

- use Overture Places as broad POI baseline
- reconcile with Healthsites for health-specific coverage
- use OSM exact-site polygons where present
- country-level ministry registries should override when available

### Schools

Primary:

- Overture Places
- OSM raw tags

Implementation:

- parse `amenity=school`, `amenity=university`, `amenity=college`, education polygons
- use Overture Places to fill missing names, addresses, and categories
- plug in national school registries where available

### Police / Fire / Government

Primary:

- OSM raw tags
- Overture Places where categories help
- national and municipal open-data portals

Implementation:

- global baseline from OSM
- country-specific registry connectors for higher-trust coverage
- explicit quality scoring because global community coverage is uneven

### Industrial Zones / SEZ / Warehouses

Primary:

- OSM land-use and building tags
- World Bank SEZ
- national investment/industry/open-data registries

Implementation:

- use OSM for industrial land, parks, and warehouse structures
- use World Bank SEZ as public SEZ baseline
- add national zone authority registries country by country

### Military Public Data

Primary:

- OSM public mapping only, plus national public lists where lawful and openly available

Implementation:

- keep this explicitly in a `public-data only` category
- use `landuse=military`, `military=*`, public checkpoints/ranges/bases
- preserve strong caveats around legality, completeness, and sensitivity

## Recommended Product Architecture

### A. Universal city dossier shell

Every city should have:

- canonical identity
- geometry or point fallback
- category matrix
- source coverage table
- parser status
- missing-source queue

This is how EconMap becomes city-complete even when evidence is not.

### B. Four-tier evidence stack

Tier 1: Global foundational data

- GeoNames
- Overture Divisions
- Overture Places
- Overture Buildings
- Overture Transportation
- Geofabrik OSM extracts

Tier 2: Global specialist datasets

- OurAirports
- UN/LOCODE
- World Port Index
- PeeringDB
- Mobility Database
- OpenInfraMap-compatible OSM extraction
- OpenCelliD
- Healthsites
- World Bank SEZ

Tier 3: Country connectors

- national telecom regulators
- health ministry facility registries
- education ministry school lists
- police/fire/government open portals
- power-grid operators
- transport ministries and national roads agencies
- free zone authorities

Tier 4: City-specific OSINT fallback

- if a city-category is empty after tiers 1-3, trigger a city-specific discovery task
- capture source URL, parser status, and whether ingestion is blocked or queued

### C. Conflation strategy

Use one city-unit evidence graph, not separate ad hoc parsers.

Recommended entity resolution keys:

- geometry proximity
- normalized city and admin strings
- source-native IDs
- name/address similarity
- Overture GERS IDs where available

### D. Coverage scoring

Each city-category should expose:

- mapped exact-site count
- documented count
- queued source count
- last refresh date
- source labels
- confidence state

Do not report a category as covered just because a dataset exists globally.

## Recommended Build Order

### Phase 1: Make every city real

1. Keep GeoNames as canonical registry.
2. Add Overture Divisions as secondary city geometry spine.
3. Store per-city category coverage manifests for every city, even when empty.

### Phase 2: Add the global broad-base extractor

1. Add a country-scale OSM/Geofabrik ingestion pipeline.
2. Add Overture Places, Buildings, and Transportation ingestion.
3. Publish city-clipped outputs for:
   - roads
   - bridges
   - tunnels
   - schools
   - hospitals
   - clinics
   - police
   - fire
   - government
   - industrial land
   - warehouses
   - data-center buildings
   - military-public-data

### Phase 3: Add specialist registries

1. PeeringDB
2. OpenCelliD
3. Healthsites
4. OpenInfraMap-derived extraction rules
5. World Bank SEZ

### Phase 4: Add national connector framework

Build reusable harvesters for:

- CKAN
- ArcGIS FeatureServer
- Socrata
- simple CSV/ZIP registries
- ministry HTML/PDF-to-CSV fallback where necessary

### Phase 5: Add city-specific source hunt

When a city-category remains weak:

- automatically search for official city, ministry, regulator, or authority source
- register source
- mark parser status
- queue ingestion task

## Hard Truths

1. "Every city in the world with every unit type fully mapped" is not a single-dataset problem.
2. It is also not fully solvable from open data alone.
3. What is solvable is:
   - every city gets a full dossier shell
   - every category gets a traceable source state
   - every globally feasible category gets parsed at scale
   - every remaining gap gets queued to a specific source hunt

That is the correct definition of analyst-grade completeness for EconMap.

## Sources

1. GeoNames export docs: daily extracts and licensing.
   URL: https://www.geonames.org/export/
   Credibility: official GeoNames documentation.

2. GeoNames dump readme: country files, `allCountries.zip`, city extracts, license.
   URL: https://download.geonames.org/export/dump/
   Credibility: official GeoNames download server.

3. Overture Places Guide: more than 64M places, categories, addresses, source lineage, bbox extraction.
   URL: https://docs.overturemaps.org/guides/places/
   Credibility: official Overture docs.

4. Overture Transportation Guide: global road, rail, and water segments built from OSM plus authoritative sources.
   URL: https://docs.overturemaps.org/guides/transportation/
   Credibility: official Overture docs.

5. Overture Divisions Guide: city and neighborhood divisions with polygons and boundaries.
   URL: https://docs.overturemaps.org/guides/divisions/
   Credibility: official Overture docs.

6. Geofabrik download server: free daily OSM extracts by region/country, ODbL.
   URL: https://download.geofabrik.de/
   Credibility: official Geofabrik download server.

7. Overpass API language guide: official OSM wiki guidance for targeted OSM queries.
   URL: https://wiki.openstreetmap.org/Overpass_API/Language_Guide
   Credibility: official OSM wiki documentation.

8. PeeringDB API specs: public API object model for `ix`, `fac`, `netixlan`, `netfac`, etc.
   URL: https://docs.peeringdb.com/api_specs/
   Credibility: official PeeringDB docs.

9. PeeringDB search/howto: public interconnection database for IXPs, data centers, and facilities.
   URL: https://docs.peeringdb.com/howto/search/
   Credibility: official PeeringDB docs.

10. Open Infrastructure Map about page: data sourced directly from OSM; Overpass for small extracts.
    URL: https://openinframap.org/about
    Credibility: official project site.

11. OpenCelliD main site: open global cell tower database with API.
    URL: https://opencellid.org/
    Credibility: official OpenCelliD site.

12. OpenCelliD downloads page: country downloads, CC BY-SA 4.0, 18-month export limit, API access to full data.
    URL: https://www.opencellid.org/downloads
    Credibility: official OpenCelliD site.

13. Healthsites about page: global health-facility project, ODbL data, API/export intent.
    URL: https://healthsites.io/about
    Credibility: official Healthsites page.

14. World Bank SEZ data catalog: public SEZ dataset, subset of global SEZ universe, CC BY 4.0.
    URL: https://datacatalog.worldbank.org/search/dataset/0037742/special-economic-zones-sez
    Credibility: official World Bank Data Catalog.

15. OSM wiki tags used for category feasibility:
    - hospital: https://wiki.openstreetmap.org/wiki/Tag%3Aamenity%3Dhospital
    - school: https://wiki.openstreetmap.org/wiki/Item%3AQ4966
    - police: https://wiki.openstreetmap.org/wiki/Item%3AQ4727
    - fire station: https://wiki.openstreetmap.org/wiki/Item%3AQ6992
    - clinic: https://wiki.openstreetmap.org/wiki/Tag%3Aamenity%3Dclinic
    - office=government: https://wiki.openstreetmap.org/wiki/Item%3AQ5615
    - landuse=industrial: https://wiki.openstreetmap.org/wiki/Item%3AQ4931
    - building=warehouse: https://wiki.openstreetmap.org/wiki/Item%3AQ6126
    - building=data_center: https://wiki.openstreetmap.org/wiki/Item%3AQ16481
    - military: https://wiki.openstreetmap.org/wiki/Military
    Credibility: official OpenStreetMap wiki documentation.
