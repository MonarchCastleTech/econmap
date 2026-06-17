# MapFactbook Starter

This file is the startup handoff for the next AI or engineer.

## Source Of Truth

Only these three plan/design docs are active:

- `docs/plans/2026-03-15-mapfactbook-command-center-design.md`
- `docs/plans/2026-03-15-mapfactbook-data-design.md`
- `docs/plans/2026-03-15-mapfactbook-features-design.md`

Treat them as the authoritative design, data, and feature direction.

## What MapFactbook Is Now

MapFactbook is no longer just a premium economic dashboard. It is now intended to become:

- a Cesium-first 3D live-earth command center
- a source-transparent city intelligence product
- a zero-frontend-API website
- a statically published intelligence system rebuilt on source-specific cadences

## Approved Non-Negotiables

- full command-center / defense aesthetic
- premium layout discipline stays
- homepage is a 3D live-earth globe
- left rail is a persistent global layer/source control rack
- right rail is a persistent intelligence panel
- when no city is selected, the right rail shows global operational intelligence
- when a city is selected, the right rail becomes a Maven-like focused city command panel
- all product surfaces stay visible
- nothing is fabricated
- accepted dataset rows are enough evidence
- no extra manual verification layer is required on top of accepted datasets
- zero frontend network data calls for intelligence data
- no runtime third-party APIs
- no runtime backend data APIs
- all data must be prebuilt into shipped code or shipped static assets
- source labels must be visible in the UI
- full-site scheduled rebuilds/redeploys are allowed and expected

## Read Order

Read these files first, in this order:

1. `docs/plans/2026-03-15-mapfactbook-command-center-design.md`
2. `docs/plans/2026-03-15-mapfactbook-data-design.md`
3. `docs/plans/2026-03-15-mapfactbook-features-design.md`
4. `citydata.md`
5. `citydata-bulk-source-matrix.md`
6. `orchestrate.md`
7. `prompt.md`
8. `data.md`
9. `premium.md`
10. `upgrade.md`

Then inspect the current code and data entry points:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/features/home/components/home-shell.tsx`
- `src/features/home/components/world-map-panel.tsx`
- `src/domain/city-schemas.ts`
- `src/domain/schemas.ts`
- `scripts/data/cities/bulk-source-manifest.ts`
- `scripts/data/cities/ingest-registry.ts`
- `scripts/data/cities/resolve-entities.ts`
- `scripts/data/cities/generate-artifacts.ts`
- `scripts/data/cities/run-pipeline.ts`

## Current Product Direction

### Homepage

The homepage should become a single command surface with:

- large Cesium globe in the center-left
- persistent left global control rail
- persistent right intelligence rail
- bottom ops/timeline strip

Layer behavior:

- users can combine arbitrary layers
- not limited to one canned layer stack
- examples include satellite, weather, water, GSM, airports, ports, rail, logistics, power, heat, fire, and admin overlays

### City Behavior

When a city is selected:

- the globe camera focuses on that city/region
- the left rail stays global and layer-centric
- the right rail drops global summary content
- the right rail becomes a focused city command panel

### Typography

Use Inter heavily throughout the UI.

## Data Model Direction

The website is a compiled intelligence artifact, not a runtime data client.

The data pipeline should:

1. ingest raw bulk sources into `data/raw/cities/bulk/...`
2. normalize into `data/processed/cities/...`
3. publish website-ready artifacts into:
   - `src/data/generated/...`
   - shipped globe assets such as `public/data/globe/...`

The frontend should consume only shipped artifacts.

## Already-Local Bulk Sources

The local baseline already includes:

- GeoNames
- OurAirports
- UN/LOCODE
- Natural Earth
- Mobility Database GTFS catalog
- WRI Global Power Plant Database
- WHO Ambient Air Quality Database
- ROR
- GHSL / GHS-WUP-MTUC
- OECD
- Eurostat
- World Port Index
- WRI Aqueduct
- JRC Global Surface Water helper package
- Ookla Open Data
- Carbon Monitor Cities

## Next Source Priorities

Add next:

1. GLEIF
2. OpenCellID
3. NASA / SEDAC urban heat
4. NASA GIBS
5. NOAA GFS
6. NASA Black Marble
7. NASA FIRMS
8. ESA WorldCover
9. HydroATLAS / HydroBASINS / HydroWASTE
10. Geofabrik regional extracts
11. ECMWF Open Data
12. Global Fishing Watch static public fishing effort

Use source-specific cadences.

Examples:

- satellite / weather: around every 8 hours where practical
- operational/detection layers: daily where practical
- slower infrastructure and official statistical datasets: weekly/monthly/release-based

## Strongest Next Product Features

Priority order:

1. City Systems Breakdown
2. Source Drill-Down Workspace
3. City Comparison Command View
4. Snapshot Delta / Change Detection
5. Asset Cluster Detection
6. Coverage / Confidence Surface
7. Corridor Intelligence
8. Infrastructure Dependency Graph
9. City Dossier Export
10. Watch / Alert Candidates
11. Layer Interaction Explainability

## Immediate Next Task

The next clean step is to turn the three approved design docs into a concrete implementation plan.

That implementation plan should:

- preserve the zero-API frontend rule
- preserve the full command-center homepage
- preserve all product surfaces without fabrication
- convert the existing city pipeline into a true offline publish pipeline
- replace the current homepage map architecture with the approved Cesium-first structure
- specify exact files to create and modify
- specify tests and verification commands

## Guardrails

- do not shrink the product surface to make implementation easier
- do not hide unsupported sections
- do not invent values or exact coordinates
- do not reintroduce live Overpass or other runtime third-party data dependencies
- do not make the homepage a generic dashboard again
- do not bury source labels in tooltips only

## Success Condition

The work is successful when the product is moving toward:

- a real command-center homepage
- a deterministic offline publish pipeline
- full visible intelligence surfaces
- honest accepted-dataset-backed coverage
- deeper city intelligence, comparison, and change-awareness features

This file is the entry point. The three docs in `docs/plans` are the actual design source of truth.
