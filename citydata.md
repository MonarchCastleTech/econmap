Act as a principal geospatial data engineer, economic intelligence architect, urban data researcher, entity-resolution engineer, and TypeScript/Next.js product builder.

Extend the existing **MapFactbook** codebase with a **global city intelligence data system**.

You are not building a toy sample.
You are not building a partial prototype.
You are building a **worldwide city data pipeline and app-readable dataset** that covers **every city in the world**.

Important:
- Build data coverage for **every city in the world**.
- Use **high-confidence data only**.
- Do **not** fabricate, infer, guess, interpolate, or hallucinate city facts, company presence, or factory locations.
- If a field cannot be verified from credible sources, store it explicitly as `null`, `unknown`, `not_covered_yet`, or the appropriate coverage state.
- **Do not finish the iteration until all source queues, ingestion passes, validation passes, and output-writing steps have been exhausted.**
- Completion does **not** mean every city has every field populated.
- Completion **does** mean every city has a canonical record, every planned high-confidence source pass has been attempted, every verified datum has been written to app-readable artifacts, and every unresolved field is explicitly represented as a gap.
- Exclude news entirely. Do not build or scrape news feeds, headlines, articles, or current-events widgets.
- Prefer official, primary, regulatory, statistical, or company-first sources over third-party summaries.
- When APIs are unavailable, scrape only from credible primary-source pages.
- The output must be written in a format the existing website can read directly.

## Mission

Upgrade MapFactbook from country-first intelligence into a **city-first global intelligence system** with:
- a canonical record for every city in the world
- map-selectable city workspaces
- city economic factbook data
- investor / site-selection data
- urban intelligence data
- major company presence
- major factory / plant presence
- industrial parks and clusters
- ports, airports, rail freight hubs, logistics assets, and utility assets
- exact site markers where exact evidence exists
- city-level presence markers where only city-level evidence exists
- strict source attribution and confidence states for every nontrivial field

The resulting city workspace must support a product experience where:
- a city is chosen on the map
- a dedicated city workspace opens
- the map is primary
- entity layers are primary by default
- economics, investor intelligence, and urban intelligence explain the map
- exact sites and city-level presence are visibly distinct

## Product behavior this data must support

When a city is selected, the website should be able to render:

### 1. City workspace shell
- city name
- country
- region / admin hierarchy
- metro relationship if known
- role tags such as `capital`, `port city`, `manufacturing hub`, `energy city`, `tourism city`, `logistics hub`, `financial center`, `technology hub`
- data coverage badges
- last verified date

### 2. Default map mode: entity map
The city map should be able to show:
- major companies
- major factories / plants
- industrial parks / export processing zones / SEZs
- ports
- airports
- rail freight hubs
- warehouses / logistics centers
- utilities / power / energy assets
- other source-backed strategic economic assets

### 3. Panel sections
The city workspace should have data for:
- Economic factbook
- Investor / site selection
- Urban intelligence
- Entity detail view
- Source transparency

## Absolute constraints

### Every city means every city
You must begin from a canonical worldwide city registry.
Do not start from only major cities.
Do not limit to capitals.
Do not limit to top 1,000 or top 10,000 cities.
Every city record must exist even if enrichment is sparse.

### High confidence only
Do not use weak SEO pages, unsourced listicles, generic business directories, scraped AI summaries, or low-trust aggregator content as proof for major entities or city facts.

### No fake completeness
Do not imply that a city has no major companies or factories simply because you did not find one quickly.
Represent uncertainty honestly.

### App-readable output required
Do not stop at research notes or markdown summaries.
Write stable, schema-valid, map-ready data artifacts that the app can consume directly.

## Required build strategy

Use this execution order.

### Phase 1: Canonical global city registry
Create or ingest a canonical registry of all cities.

Each city must have at minimum:
- `cityId`
- `slug`
- `name`
- `aliases`
- `countryIso2`
- `countryIso3`
- `countrySlug`
- `admin1Name`
- `admin1Code` if known
- `admin2Name` if known
- `latitude`
- `longitude`
- `boundaryStatus`
- `population` if source-backed
- `populationSource`
- `registrySource`
- `recordStatus`

The registry is the backbone.
No later enrichment step is allowed to redefine city identity ad hoc.

### Phase 2: City enrichment
Enrich every city in layers:
- identity / geography
- economic factbook
- investor / site selection
- urban intelligence
- mapped entities
- derived city summaries

### Phase 3: Entity mapping
Build map-visible entity records for:
- company presence
- factory / plant
- industrial park / free zone / SEZ
- office / HQ / regional HQ
- port
- airport
- rail freight hub
- logistics hub / warehouse cluster
- utility / power / refinery / terminal / major industrial asset

### Phase 4: App artifacts
Write the final data into website-readable JSON and GeoJSON outputs, plus manifests and indexes.

### Phase 5: Validation and exhaustion
Do not finish while:
- city batches remain unprocessed
- source queues remain unattempted
- validation errors remain unresolved
- output artifacts remain unwritten
- schema mismatches remain unresolved

If a city or field is still unresolved after exhausting credible sources, encode the gap explicitly and continue.

## Source policy

Use this precedence order whenever possible.

### Tier 1: Primary official sources
- national statistical offices
- city statistical offices
- metropolitan planning authorities
- central banks if they publish city coverage
- ministries of economy, labor, transport, energy, industry, environment
- customs authorities
- port authorities
- airport authorities
- rail infrastructure operators
- utility regulators
- industrial zone / SEZ authorities
- environmental permitting registries
- business registries
- official gazetteers

### Tier 2: Primary organizational sources
- official company websites
- official company location pages
- annual reports
- investor relations site-location disclosures
- stock exchange filings
- sustainability reports
- official facility pages
- official press releases only when they confirm the existence of a site

### Tier 3: Credible structured sources
- multilateral organizations
- official geospatial sources
- authoritative open government data portals
- carefully chosen global city registries
- authoritative transport, energy, emissions, and urban datasets

### Tier 4: Conditional supporting sources
Use only to corroborate, not to establish truth alone:
- well-maintained commercial datasets
- reputable industry associations
- credible academic or policy datasets

### Forbidden as primary evidence
- low-quality directories
- unsourced ranking blogs
- listicles
- AI-generated summaries
- forum chatter
- map pins with no provenance
- scraped pages that do not clearly establish site or city presence

## Registry source guidance

For global city coverage, start from a durable city registry or a merge of durable registries.
Prefer sources such as:
- official gazetteers where available
- authoritative global populated-place datasets
- authoritative geospatial admin/place registries

If more than one registry is required to reach global completeness:
- merge deterministically
- preserve source provenance
- keep stable IDs
- store alias mappings
- prevent duplicate city records

## High-confidence evidence model

Every nontrivial field must carry source provenance.

### Field truth states
Use explicit truth states such as:
- `verified_exact`
- `verified_city_presence`
- `known_unknown`
- `not_covered_yet`
- `not_applicable`

### Geometry rules
- exact coordinates require exact evidence
- a company or factory can appear as a city-level marker if the city presence is source-backed but the exact site is not verified
- never invent exact coordinates from city-level claims
- never convert text like "near city X" into a precise point without evidence

### Marker display rules
Each entity must support:
- `geometryMode: "exact" | "city_presence"`
- `confidenceState`
- `exactSite: boolean`

This is required so the website can render:
- precise pins for exact sites
- city-hub markers or halos for city-level verified presence

## What to collect for every city

Do not assume all fields will be available.
The rule is: attempt systematically, persist verified data, encode gaps explicitly.

### A. City identity and geography
- canonical city name
- aliases / alternate spellings
- country
- admin hierarchy
- metro name if relevant and verifiable
- centroid coordinates
- boundary if available
- population
- land area if credible
- density if derivable from verified inputs
- timezone if needed by app
- role tags

### B. Economic factbook
Collect when source-backed:
- city GDP / GVA / GRP
- metro GDP / GVA where city GDP is not available and the distinction is explicit
- GDP per capita or output per capita
- employment
- unemployment
- labor-force participation
- average wage / median income / disposable income proxies
- sector composition
- trade / logistics role
- export role if published
- industrial output
- office / industrial rent proxies if official or highly credible
- cost signals where credible
- historical series where available

### C. Investor / site-selection
Collect when source-backed:
- major companies present in city
- major factories / plants present in city
- industrial parks / SEZs / free zones
- ports
- airports
- rail freight hubs
- logistics hubs
- utilities / power assets
- universities / R&D anchors relevant to industry
- workforce / talent signals
- business environment notes
- official incentives only if official and current enough for the dataset policy
- strategic clusters such as automotive, semiconductors, chemicals, steel, pharma, textiles, tourism, finance, software, energy, logistics

### D. Urban intelligence
Collect when source-backed:
- transit coverage / major transit modes
- congestion / commute signals
- housing pressure / rent pressure
- air quality / emissions
- climate / flood / heat / disaster exposure
- electricity / water / utility reliability where credible
- internet / fiber / digital infrastructure proxies
- public-service strain signals where credible
- resilience / adaptation indicators
- inequality / poverty / informality where credible

### E. Entity presence and asset mapping
For every city, attempt to identify source-backed entities in these classes:
- company presence
- factory / plant
- industrial campus
- office / HQ / regional HQ
- port
- airport
- rail freight hub
- logistics hub
- utility / power / refinery / terminal
- research or education anchor relevant to industry

## Major companies and major factories

The goal is not to show only globally famous names.
The goal is to ingest **as many verified notable entities as possible**.

Do not artificially cap the list to a top 5 or top 10.
If the entities are verified and relevant, include them.

Use source-backed notability cues such as:
- official tenant lists
- listed company facility disclosures
- city investment agency employer lists
- industrial park tenant rosters
- permitting databases
- operator asset maps
- official export/manufacturing cluster documents
- company annual reports identifying city operations

For each entity, capture:
- `entityId`
- `cityId`
- `entityName`
- `entityType`
- `entitySubtype`
- `industry`
- `parentCompany`
- `operator`
- `presenceType`
- `exactSite`
- `geometryMode`
- `latitude` if exact
- `longitude` if exact
- `address` if exact and available
- `cityPresenceEvidence`
- `importanceReason`
- `employmentEstimate` only if source-backed
- `status` if known, such as active / announced / closed
- `sources`
- `lastVerifiedAt`
- `confidenceState`

### Presence types
Support at minimum:
- `headquarters`
- `regional_hq`
- `office`
- `manufacturing`
- `plant`
- `warehouse`
- `distribution`
- `industrial_park`
- `port`
- `airport`
- `rail_hub`
- `power_asset`
- `research`

## Data model requirements

Write stable app-facing schemas for at least:
- `City`
- `CityAlias`
- `CityCoverage`
- `CityMetric`
- `CityMetricSeries`
- `CityEntity`
- `CityWorkspace`
- `CityLayerSummary`
- `CitySource`
- `CityRoleTag`

Each object must preserve:
- source metadata
- last verification date
- confidence state
- geometry mode when relevant
- coverage notes

## Website-readable output contract

Write outputs into deterministic, app-readable artifacts under a clear generated-data root.

Recommended layout:

- `src/data/generated/cities/manifest.json`
- `src/data/generated/cities/search-index.json`
- `src/data/generated/cities/country/{iso3}.json`
- `src/data/generated/cities/workspaces/{cityId}.json`
- `src/data/generated/cities/entities/{cityId}.json`
- `src/data/generated/cities/map/cities.geojson`
- `src/data/generated/cities/map/entities/companies.geojson`
- `src/data/generated/cities/map/entities/factories.geojson`
- `src/data/generated/cities/map/entities/infrastructure.geojson`
- `src/data/generated/cities/map/entities/industrial-parks.geojson`

If a different layout is better for the existing codebase, keep the same logical separation:
- registry
- search
- workspace payloads
- entity payloads
- map layers
- manifest / counts / provenance

### Required manifest fields
The manifest must include:
- schema version
- generated at
- total city count
- processed city count
- country counts
- entity counts by type
- exact-site counts
- city-presence counts
- unresolved coverage counts
- source counts
- build warnings

### Required city workspace payload shape
Each city workspace payload should contain:
- `city`
- `summary`
- `roleTags`
- `coverage`
- `economicFactbook`
- `investorIntel`
- `urbanIntel`
- `entityCounts`
- `entityHighlights`
- `mapLayerSummary`
- `sources`

### Required city map feature properties
Every map feature should expose enough data for the frontend to render without heavy transformation:
- `cityId`
- `entityId`
- `label`
- `entityType`
- `industry`
- `geometryMode`
- `confidenceState`
- `exactSite`
- `countryIso3`
- `sourceCount`
- `importanceReason`

## City workspace requirements

The data must support these UI sections.

### Top summary strip
- city name
- country
- admin context
- metro context if applicable
- population
- output estimate if available
- major role tags
- coverage badges
- last verified date

### Entity-led map defaults
Default visible layers should support:
- companies
- factories
- industrial parks
- ports
- airports
- freight / logistics
- power / utilities

### Economic factbook block
Support fields for:
- population
- output
- output per capita
- employment / unemployment
- income / wage proxy
- sector mix
- growth / trend series
- trade and logistics role

### Investor / site-selection block
Support fields for:
- major companies
- major factories
- industrial clusters
- industrial parks / SEZs
- logistics access
- utilities readiness
- workforce anchors
- cost / land / rent proxies where credible
- official incentives

### Urban intelligence block
Support fields for:
- transit
- congestion
- housing pressure
- emissions / air quality
- climate exposure
- digital infrastructure
- service strain / resilience proxies

### Entity detail panel
Every clicked entity should have enough data to render:
- name
- type
- industry
- exact site vs city presence
- operator / parent
- importance reason
- evidence summary
- source links
- last verified date

## Completion and persistence rules

### Do not stop early
Do not claim the iteration is complete while any of the following remain:
- unprocessed city registry records
- unattempted source batches
- unwritten app artifacts
- invalid schemas
- unresolved duplicate city identities
- missing manifests
- missing search indexes
- broken map-layer exports

### What "find all the data" means
Under this prompt, "find all the data" means:
- create a record for every city
- attempt every planned high-confidence source pass
- ingest every verified datum discovered
- write all verified data to app-readable outputs
- encode every unresolved field or uncovered area explicitly

It does **not** mean inventing complete enrichment where the world does not publish it.

### Persistence and resumability
The job is too large for a single fragile in-memory pass.
Build a resumable pipeline:
- batch by country or region
- checkpoint progress
- persist intermediate artifacts
- preserve per-source fetch manifests
- make reruns idempotent

Do not lose progress between iterations.

## Engineering requirements

- preserve the existing stack where sensible
- keep code modular
- separate acquisition, normalization, entity resolution, validation, and export
- use strong TypeScript types
- use schema validation for generated outputs
- preserve provenance at field level where possible
- add tests for parsers, validators, entity truth states, and export shapes
- keep app contracts stable where possible
- optimize for frontend loading by writing search indexes and layer-specific GeoJSON

## Suggested implementation modules

Create or extend modules like:
- global city registry loader
- source adapters
- company/entity resolvers
- factory resolver
- infrastructure resolver
- city metrics normalizer
- city workspace assembler
- GeoJSON export writers
- manifest and coverage reporters
- validation scripts

## Required validation

Before claiming completion, run validation that proves:
- every city has a canonical record
- every city record has stable ID, slug, country, and coordinates or documented fallback
- every entity has a valid city link
- every exact marker has coordinates
- every city-presence marker does not pretend to be exact
- every source ID resolves to source metadata
- every output artifact parses cleanly
- every workspace payload matches schema
- map layers are valid GeoJSON

## Deliverables

Produce:
1. global city registry ingestion
2. city schema extensions
3. source adapters and scraping logic for high-confidence primary sources
4. entity-resolution pipeline for companies, factories, and infrastructure
5. city economic factbook pipeline
6. urban intelligence pipeline
7. app-readable generated artifacts
8. map-ready GeoJSON layers
9. manifests and coverage reports
10. tests and validation scripts
11. README or docs update describing how city data is built and refreshed

## Non-negotiable reminders

- Every city gets a record.
- High confidence only.
- No invented company or factory presence.
- City-level presence is acceptable when exact sites are not verified.
- Exact pins require exact evidence.
- Unknown is acceptable.
- Silent omission is not acceptable.
- Research notes alone are not acceptable.
- The website must be able to read the outputs directly.
- Do not stop until the pipeline, validation, and app-readable outputs are exhausted and written.
