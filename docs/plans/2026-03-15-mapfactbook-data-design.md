# MapFactbook Data Design

## Context

This document defines the approved data strategy for MapFactbook after the command-center redesign.

The homepage is a Cesium-first global operations surface with layered earth, weather, telecom, water, transport, infrastructure, and detection overlays. The website must support deep city intelligence in parallel.

The user-approved constraints are:

- zero frontend network data calls
- no runtime third-party APIs
- no runtime backend APIs for data
- all data must be prebuilt into shipped app code or shipped static assets
- all product surfaces stay visible
- nothing is fabricated
- accepted dataset rows are sufficient evidence
- no extra manual verification is required on top of accepted datasets
- source-specific rebuild cadence is allowed
- full-site scheduled rebuilds and redeploys are allowed

This means MapFactbook is a compiled intelligence product, not a live browser-side data client.

## Core Principles

### 1. Zero API Frontend

The website must not rely on runtime `fetch()` for intelligence data.

Allowed:

- importing generated data into the app bundle
- shipping static asset packs with the deployment
- loading locally shipped Cesium imagery/vector/raster assets that are part of the deployed site

Not allowed:

- third-party runtime APIs
- your own runtime data API
- browser-side ETL or runtime joins

### 2. No Feature Surrender

No homepage layer family, city section, command-center panel, or intelligence surface should be dropped because coverage is incomplete.

Instead:

- the full surface remains visible
- accepted datasets fill as much as they can
- the UI shows coverage state when data is partial or missing

### 3. No Fabrication

If a value is absent from accepted datasets, it is not invented.

Allowed states:

- `verified_exact`
- `verified_city_presence`
- `partial_coverage`
- `not_covered_yet`
- `not_applicable`

### 4. Dataset Presence Is Enough Evidence

If a row exists in an accepted dataset, that dataset row is sufficient evidence for inclusion.

Examples:

- OpenCellID tower coverage can appear as a connectivity layer because it is present in the accepted dataset
- GLEIF headquarters presence can appear as city-level company presence because it is present in the accepted dataset
- WHO air-quality values can be shown directly because they are present in the accepted dataset

Extra manual verification is not required.

### 5. Source Transparency Is Mandatory

Every meaningful layer, metric, entity, and command-panel summary must expose visible provenance.

Examples:

- `Source: OECD`
- `Source: Eurostat`
- `Source: GHSL`
- `Source: WHO`
- `Source: OpenCellID`
- `Sources: OECD, Eurostat`

## Data Architecture

MapFactbook should run as an offline-first geospatial publishing pipeline with four stages.

### Stage 1: Raw Source Layer

Location:

- `data/raw/cities/bulk/...`

Purpose:

- store untouched bulk source files
- preserve exact source provenance
- keep source-version awareness

Each source should have manifest metadata including:

- source name
- source URL
- local path
- version or publish date
- local ingest date
- coverage note
- license or terms note where needed

### Stage 2: Normalized Processing Layer

Location:

- `data/processed/cities/...`

Purpose:

- parse each source into stable internal structures
- normalize metrics, entities, geometry, source metadata, and joins
- produce deterministic rerunnable outputs

Outputs include:

- registry rows
- metric rows
- entity rows
- polygon/line/point geometry
- raster/time-slice layer products
- crosswalks and match indexes
- source metadata rows

### Stage 3: Publish Layer

Purpose:

- transform normalized data into website-ready outputs

There are two parallel publish tracks:

#### A. Homepage Operational Layer Track

Outputs:

- globe layer manifests
- packed vector layers
- simplified polygons
- point clusters
- raster snapshots
- time-slice assets
- legends
- source bundles

#### B. City Intelligence Track

Outputs:

- city registry
- search index
- city workspaces
- city entity packs
- city source bundles
- coverage summaries
- city map layer summaries

### Stage 4: Frontend Consumption Layer

Purpose:

- let the frontend consume only shipped artifacts

The frontend should render:

- homepage operational globe layers
- command-center rails
- city workspaces
- source labels
- timeline state

without any runtime data acquisition.

## Canonical City Backbone

The city identity spine is the most important join in the system.

### Backbone Source

- GeoNames city registry is the canonical identity base

### Canonical Fields

Every city record should have, at minimum:

- `cityId`
- `slug`
- `name`
- `aliases`
- `countryIso2`
- `countryIso3`
- `countrySlug`
- `admin1Name`
- `admin1Code`
- `admin2Name`
- `latitude`
- `longitude`
- `boundaryStatus`
- `population`
- `registrySource`
- `recordStatus`

### Join Rules

Preferred resolution order:

1. official source city code or municipality code joins
2. official city/FUA/metro crosswalks
3. name + country + admin hierarchy joins
4. bounded geospatial nearest-match fallback

Rule:

- sources may enrich a city
- sources may not redefine canonical city identity

## Source Acquisition Strategy

The site must support both homepage operational layers and city factbook depth in parallel. Therefore the source queue should expand in two tracks at once.

### Already Local

The approved baseline already on disk includes:

- GeoNames
- OurAirports
- UN/LOCODE
- Natural Earth
- Mobility Database GTFS catalog
- WRI Global Power Plant Database
- WHO Ambient Air Quality Database
- ROR
- GHSL / GHS-WUP-MTUC
- OECD FUA economy/labour + boundaries
- Eurostat Cities / Urban Audit pulls
- World Port Index
- WRI Aqueduct
- JRC Global Surface Water helper package
- Ookla Open Data
- Carbon Monitor Cities

### Highest-Priority Additions

These should be added next because they materially expand product coverage:

#### 1. GLEIF

Use:

- legal-entity and headquarters city presence

Publish behavior:

- city-level company presence
- company counts
- named legal entities
- no invented exact coordinates unless source-backed elsewhere

#### 2. OpenCellID

Use:

- GSM / cell-tower coverage proxy

Publish behavior:

- connectivity coverage layers
- city-level connectivity summary
- telecom presence context for the homepage and city panels

#### 3. NASA / SEDAC Urban Heat

Use:

- urban heat island intensity
- heat exposure context

Publish behavior:

- heat rasters for the globe
- city heat metrics and rankings

#### 4. Geofabrik Regional Extracts

Use:

- freight rail
- logistics land use
- industrial areas
- substations and other supporting infrastructure

Publish behavior:

- supporting geospatial operational layers
- city-nearby industrial and logistics context

### Additional Homepage-Oriented Sources

These sources are especially valuable for the Cesium command-center homepage.

#### NASA GIBS

Use:

- packaged latest satellite imagery layers
- earth imagery refresh snapshots

#### NOAA GFS

Use:

- global weather fields
- clouds
- precipitation
- pressure
- winds
- temperature

#### ECMWF Open Data

Use:

- premium weather and forecast overlays
- secondary model views

#### NASA Black Marble / Nighttime Lights

Use:

- night-earth and power/activity context

#### NASA FIRMS

Use:

- active fire / hotspot detections
- detection-focused command-center overlays

#### ESA WorldCover

Use:

- global land-cover layers
- city land-cover composition

#### HydroATLAS / HydroBASINS / HydroWASTE

Use:

- water system context
- basin overlays
- hydro-environmental attributes
- wastewater infrastructure

#### Global Fishing Watch Static Public Fishing Effort

Use:

- maritime activity context
- packaged ocean activity layers

## Source Refresh Cadence

There should be no single universal update cadence. The system should rebuild per source family.

### Fast Cadence

Target:

- every `8 hours` or similar practical cadence

Use for:

- satellite snapshots
- weather fields
- rapidly changing detection layers

### Daily Cadence

Use for:

- daily operational summaries
- selected detection layers
- packaged environmental overlays that change regularly

### Weekly / Monthly Cadence

Use for:

- OpenCellID snapshots
- Ookla refreshes
- Mobility Database refreshes
- some OSM/geofabrik refreshes

### Release-Based Cadence

Use for:

- OECD
- Eurostat
- WHO
- GHSL
- WPI
- WRI
- ROR
- GLEIF
- Aqueduct
- HydroATLAS-family releases

### Deployment Model

Each source family may refresh on its own cadence, but the result is always:

- a new offline build
- a new static-site deploy

There is no runtime live data dependency.

## Processing Strategy

The processing model should be deterministic and split per source before final publish.

### Per-Source Parsing

Each source gets its own parser and normalization step.

Examples:

- GeoNames -> city registry rows and aliases
- GHSL -> urban boundaries, land area, built-up area
- OECD / Eurostat -> city and FUA metrics
- WHO / Carbon Monitor -> environmental metrics
- OurAirports / UN/LOCODE / WPI -> transport entities
- ROR / GLEIF -> research and company-presence entities
- OpenCellID / Ookla -> connectivity coverage and city summaries
- NOAA / NASA / hydrology sources -> raster and time-aware layers

### Two Publish Tracks

#### A. Homepage Operational Layer Track

Purpose:

- produce globe-ready layer packs

Processing steps:

- clip and subset global layers
- simplify heavy geometry
- cluster dense points
- grid or aggregate extremely dense signals
- downsample rasters into publish-ready textures or snapshots
- produce layer manifests with source, date, opacity defaults, time support, and city-focus support

#### B. City Intelligence Track

Purpose:

- produce city-ready workspace artifacts

Processing steps:

- attach metrics to city records
- intersect rasters with city boundaries or buffers
- attach nearby assets by controlled distance logic
- compute city summaries and counts
- preserve exact-site versus city-presence distinctions
- publish explicit coverage states

### Geometry Rules

- homepage globe gets simplified geometry
- city pages may use richer local detail than the homepage
- exact-site and city-presence entity logic must remain separate
- dense layers should have multiple publish qualities if necessary:
  - `global-light`
  - `global-medium`
  - `city-focus`

### Raster And Time Rules

- raw rasters are not shipped directly if too heavy
- publish reduced-resolution global products for homepage use
- publish curated time slices, not unbounded archives
- every packaged snapshot should carry a build timestamp and source timestamp

This is how the site can feel operational without violating the zero-API rule.

## Packaging Strategy

The website needs two packaging classes.

### A. Importable App Data

Use for:

- city registry
- city search indexes
- workspace summaries
- source bundles
- compact metrics
- UI legends and metadata

Recommended location:

- `src/data/generated/...`

### B. Shipped Static Assets

Use for:

- globe imagery atlases
- raster snapshots
- time-slice textures
- large vector layer payloads
- simplified global geometry
- point-cluster packs

Recommended location:

- `public/data/globe/...`

This still satisfies the zero-API rule because the assets are part of the shipped site.

### Suggested Publish Structure

Examples:

- `src/data/generated/cities/registry.json`
- `src/data/generated/cities/search-index.json`
- `src/data/generated/cities/workspaces/<cityId>.json`
- `src/data/generated/cities/entities/<cityId>.json`
- `src/data/generated/cities/sources/<cityId>.json`
- `src/data/generated/cities/manifest.json`
- `public/data/globe/manifest.json`
- `public/data/globe/layers/<layerId>/meta.json`
- `public/data/globe/layers/<layerId>/vectors/*`
- `public/data/globe/layers/<layerId>/timeslices/*`
- `public/data/globe/layers/<layerId>/snapshots/*`

### Layer Tiers

To control initial load:

- `boot`
- `interactive`
- `deep`
- `city-focus`

This allows the homepage to load fast while still shipping the full globe system.

## Source Attribution And Confidence

Every published metric, entity, and layer should carry:

- source family name
- source URL
- source date or version
- local ingest date
- methodology note
- coverage note
- confidence/truth state

Accepted truth/coverage states:

- `verified_exact`
- `verified_city_presence`
- `partial_coverage`
- `not_covered_yet`
- `not_applicable`

These states should be visible in the UI, not hidden in backend-only metadata.

## Full Product Surface Without Fabrication

The product should keep all surfaces visible:

- homepage operational layers
- global right-rail intelligence
- selected-city command panel
- city factbook sections
- investor intelligence panels
- urban intelligence panels
- source transparency sections

Nothing should be hidden simply because coverage is incomplete.

Instead, each surface should display:

- verified data when present
- accepted-dataset data when present
- partial coverage when region-limited
- not-covered states when absent

This preserves the full command-center product without inventing values.

## Risks And Mitigations

### 1. Asset Bloat

Risk:

- too many layers and raw geospatial files can make the app too heavy

Mitigation:

- aggressive simplification
- point aggregation
- raster downsampling
- layer tiers
- per-layer payload splitting

### 2. False Precision

Risk:

- bulk joins can imply exactness where only city presence exists

Mitigation:

- separate exact-site and city-presence logic
- keep confidence state explicit

### 3. Uneven Freshness

Risk:

- different sources refresh on different cadences

Mitigation:

- per-layer source timestamps
- build manifest
- visible freshness labels

### 4. Coverage Mismatch

Risk:

- some global features are strong, others remain partial

Mitigation:

- full product surface stays visible
- coverage state remains explicit
- continue layering regional and country official sources later

## What The System Can Cover Well

Strong global coverage is realistic for:

- city identity and aliases
- coordinates and admin hierarchy
- population / land area / built-up area
- airports / ports / rail / power assets
- research organizations
- water / flood / heat / environmental context
- air quality and emissions proxies
- broadband and telecom proxies
- weather / cloud / satellite snapshots
- legal-entity HQ presence proxies
- land-cover and night-earth context

## What Will Still Remain Partial

Even with the expanded source ladder, these remain globally partial:

- city GDP and GVA everywhere
- income and wages everywhere
- congestion everywhere
- industrial and office rents everywhere
- incentives and policy packages everywhere
- utility reliability everywhere
- local branch/facility presence everywhere
- factory presence everywhere
- industrial park rosters everywhere

These should remain represented as visible coverage states, not hidden or invented.

## Outcome

If implemented correctly, this data plan produces:

- a zero-API command-center homepage
- a zero-API city intelligence product
- source-specific rebuilds with full-site static redeploys
- full product-surface coverage without fabrication
- accepted-dataset evidence as the operational standard
- strong command-center layers and city dossiers from a deterministic offline pipeline

This document is the active data-design source of truth for MapFactbook.
