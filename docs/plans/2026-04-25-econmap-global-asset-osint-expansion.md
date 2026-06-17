# EconMap Global Asset OSINT Platform - Expansion Plan

## Goal
Implement a suite of advanced analytical features on top of the newly established global asset OSINT foundation, while expanding asset categories and establishing clear prioritization (critical infrastructure first).

## Phase 1: Asset Expansion & Prioritization
*   **Schema Update**: Add a priority or criticality tier (e.g., Tier 1: Ports, Airports, Power Plants; Tier 2: Factories, Dams; Tier 3: Base Stations, Warehouses) to the AssetRecord schema.
*   **Data Ingestion Expansion**:
    *   Integrate Telecom assets (Base Stations, IXPs).
    *   Ensure existing parsers (WRI Power Plants, OurAirports, World Port Index) map to Tier 1.
*   **UI Update**: Update the AssetMap and tables to visually emphasize Tier 1 assets (larger icons, default sorting).

## Phase 2: AI-Synthesized Strategic Briefings
*   **Scripting**: Create a build script (scripts/data/assets/generate-ai-briefings.ts) that reads the manifest.json and asset distributions per country, and uses a mock/local LLM generation (or seeded data for now) to create a 2-paragraph strategic summary.
*   **UI Integration**: Display the "Analyst Take" briefing at the top of the CountryAssets component.

## Phase 3: Temporal Asset Intelligence (Change Detection & Timelines)
*   **Data Enrichment**: Ensure status (active, announced, under_construction) and lastObservedAt dates are robustly populated.
*   **UI Component**: Build a TemporalAssetTimeline component for the country dossier, rendering a Gantt-style or chronological view of infrastructure development pipelines.

## Phase 4: Geopolitical Bloc Asset Comparison
*   **Data Aggregation**: Create a script to aggregate CountryAssetAggregation data into bloc-level summaries (e.g., NATO, BRICS) based on src/data/normalized/blocs.ts.
*   **UI Route**: Add a new view (e.g., /compare/blocs or expanding the existing compare tool) with radar charts and capacity tables comparing total infrastructure strength between blocs.

## Phase 5: Strategic Chokepoint & Corridor Monitor
*   **Data Definition**: Define geographic bounding boxes for major chokepoints (Suez, Malacca, Hormuz).
*   **Spatial Querying**: Aggregate assets (ports, pipelines) that fall within or near these bounding boxes.
*   **UI View**: Create a specialized Command Center dashboard focusing on these corridors rather than individual countries.

## Phase 6: Asset Dependency & Vulnerability Graph
*   **Data Linking**: Establish basic relationships (e.g., linking a power plant to the nearest major city or industrial hub).
*   **UI/UX**: Enhance the AssetMap popup with a "Blast Radius" or "Dependencies" tab, highlighting linked entities when an asset is selected.
