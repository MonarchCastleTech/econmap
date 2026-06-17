# EconMap Global Asset OSINT Platform Execution Plan

Date: 2026-04-24
Status: Draft

## Goal
Turn EconMap into a source-traceable, global country asset intelligence platform: Refinitiv-style coverage for physical infrastructure, institutions, logistics, energy, telecom, environmental assets, and coverage gaps.

## Key Components

### 1. AssetRecord Contract
Define a canonical \AssetRecord\ contract in TypeScript/Zod.
- \ssetId\: Unique identifier.
- \
ame\: Canonical name.
- \category\: Transport, Energy, Water, etc.
- \subtype\: Nuclear station, Dam, Rail line, etc.
- \countryIso3\: ISO 3166-1 alpha-3 code.
- \dmin1\: Primary subnational division.
- \cityId\: Reference to existing city registry.
- \geometry\: GeoJSON geometry (Point, LineString, etc.).
- \operator/owner\: Entities involved.
- \status/capacity\: Operational state and metrics.
- \sourceIds\: List of contributing sources.
- \lastObservedAt\: Freshness timestamp.
- \confidence\: Scoring (0-1).
- \license\: Data usage rights.
- \reshness/coverageState\: Explicit gap/state flags.

### 2. New Asset Categories
- **Transport**: rail lines, stations, roads, ports, airports, logistics hubs, border crossings.
- **Energy**: power plants, nuclear stations, substations, transmission lines, pipelines, refineries, LNG terminals.
- **Water**: dams, reservoirs, canals, wastewater, desalination, water stress overlays.
- **Public Services**: hospitals, schools, police, fire, government offices.
- **Telecom**: fiber, exchanges, data centers, towers, IXPs, metrics.
- **Industrial**: SEZs, factories, mines, warehouses, corporate entities.

### 3. Country Asset Dossiers
- Asset map with progressive loading.
- Category breakdown tables.
- Source audit & coverage gap analysis.
- Freshness warnings & confidence scoring.
- Export functionality (CSV/GeoJSON).

### 4. Data Pipeline Enhancements
- Category-specific extractors (Nuclear, Dams, Rail).
- Integration of: HydroSHEDS, OpenRailwayMap (compatible), Wikidata, Overpass.
- Completeness scoring by country/category.

## Implementation Phases

### Phase 1: Foundations (Day 1)
- [ ] Define AssetRecord schema in \src/types/assets.ts\.
- [ ] Create basic asset registry structure in \data/assets\.
- [ ] Implement initial validation and mock asset generator.

### Phase 2: Core Asset Categories (Day 2-3)
- [ ] Energy: Nuclear & Power plants (WRI + Wikidata).
- [ ] Water: Dams & Reservoirs (HydroLAKES).
- [ ] Transport: Rail lines (OpenRailwayMap extracts).

### Phase 3: Country Dossiers (Day 4)
- [ ] Implement country-level aggregation.
- [ ] Create CountryDossier UI components.
- [ ] Add completeness/gap indicators.

### Phase 4: Map & Polish (Day 5)
- [ ] deck.gl/MapLibre layer upgrades for asset types.
- [ ] Category filtering & progressive loading.
- [ ] Export controls.

## Test Plan
- Unit tests for AssetRecord validation.
- Pipeline tests for data extraction/reconciliation.
- UI tests for dossier rendering and gap display.
- Build/Lint verification.
