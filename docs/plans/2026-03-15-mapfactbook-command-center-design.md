# MapFactbook Command Center Design

## Context

This design supersedes the earlier fresh-build and premium-terminal planning direction.

MapFactbook should no longer feel like a premium dashboard with a map panel. It should become a full command-center product with a real 3D live-earth homepage, persistent operational side rails, dense system UI, and a city-focused tactical workflow.

The product still keeps its premium quality bar, source transparency, and analyst-grade seriousness. The difference is the interface language: command-center first, dashboard second.

## Core Direction

- full command-center / defense aesthetic
- homepage is a Cesium-first 3D live-earth globe
- premium layout discipline remains
- left rail is a permanent global layer and source control surface
- right rail is a permanent intelligence panel
- when no city is selected, the right rail shows global operational intelligence
- when a city is selected, the right rail becomes a focused city command panel
- bottom of the viewport supports a command-style ops strip / timeline
- users can combine arbitrary layer stacks, not just fixed presets
- operational layers may begin simulated, but the architecture must support later live-feed swap-in

## Product Identity

MapFactbook should feel like:

- a serious operational intelligence interface
- premium software someone could actually work inside for hours
- cinematic, but controlled
- system-like, not toy-like
- dense, but readable
- credible, not performative sci-fi

It should not feel like:

- a consumer analytics dashboard
- a glossy marketing landing page
- a literal copy of Palantir Maven
- a movie-prop military UI full of meaningless chrome

The reference quality to borrow is operational density, segmentation, tracking logic, and visual seriousness.

## Homepage Information Architecture

The homepage becomes a single operational surface with four permanent zones.

### 1. Left Rail: Global Control Stack

The left rail is the operator control surface for the whole planet view.

It contains:

- search and jump-to-place
- layer family groups
- per-layer toggles
- opacity/intensity controls
- source toggles
- saved operational views
- feed health / freshness / latency
- filters for transport, telecom, weather, hydrology, infrastructure, and admin overlays

This rail should always remain visible. It must feel like a control rack, not a navigation sidebar.

### 2. Center-Left: 3D Live-Earth Globe

The globe is the homepage hero and the main work surface.

It contains:

- photoreal or near-photoreal earth imagery
- atmosphere and cloud systems
- day/night lighting
- user-controlled operational overlays
- asset points
- path and corridor layers
- raster fields
- boundary overlays
- detection pulses and selection states

The globe is not decorative. It is the core interaction surface.

### 3. Right Rail: Intelligence / Command Panel

This rail is always visible and is state-dependent.

When no city is selected, it shows:

- active layer summary
- feed and source health
- notable detections
- coverage gaps
- global operational notes
- what the current camera/view is showing

When a city is selected, it becomes the city command panel:

- city header
- admin hierarchy
- role tags
- status badges
- active operational layers affecting the city
- source-backed asset lists
- city intelligence summary
- visible source labels
- actions to open the full city workspace or save the current view

### 4. Bottom Ops Strip

The bottom strip is the temporal and event surface.

It may show:

- current time-state
- feed updates
- weather windows
- detections
- source refreshes
- asset activity or event sequence
- city-specific operational timing once a city is selected

It should feel like a command timeline, not a dashboard footer.

## Selection Model

### Default State

When no city is selected:

- the homepage remains globally useful
- the active layer stack still tells a story
- the right rail summarizes global operational context
- the bottom strip emphasizes feed activity and time-based layer behavior

### City Selected

When a city is selected:

- the globe camera moves to that city/region with a deliberate operational transition
- the left rail remains the global layer control rack
- the right rail fully drops global summary content
- the right rail becomes a focused city command panel
- the bottom strip becomes city-relevant when the active layers support that behavior

Selection should feel like focus acquisition, not a tooltip state.

## Layer System

The homepage must support arbitrary user-selected combinations of layers.

The system should not be built around one canned stack such as GSM plus water plus live satellite plus airports. That is only one example of what users might want.

### Layer Families

Recommended layer families:

- Base Earth
- Atmosphere
- Hydrology
- Connectivity
- Transport
- Economic / Infrastructure
- Political / Admin
- Signals / Detection

### Layer Rules

Each layer should have:

- `id`
- `label`
- `family`
- `source`
- `visibility`
- `opacity`
- `priority`
- `supportsTime`
- `supportsCityFocus`

### Visual-Clarity Rules

To prevent the globe from collapsing into sludge:

- allow only one photoreal base layer at a time
- let overlays use different grammars: raster, line, point, boundary, atmospheric motion
- cluster dense point layers at wider zooms
- fade secondary layers automatically when a dominant layer is active
- keep labels selective and contextual
- use opacity as a first-class control, not only on/off

### Saved Views

Users should be able to save named operational stacks such as:

- Telecom + Airports
- Climate + Water
- City Logistics
- Infrastructure Watch

Saved views are shortcuts, not restrictions.

## City Command Panel

The selected-city panel should take structural cues from modern operator software such as Maven, without becoming a literal clone.

It should be:

- dense
- segmented
- hard-edged
- status-driven
- built from stacked operational modules rather than large marketing cards

Recommended structure:

- City Header
- Operational Snapshot
- Asset Layer Summary
- Environment / Weather / Water
- Connectivity / Coverage
- Transport / Access
- Infrastructure / Utilities
- Source Transparency
- Actions

The panel should summarize only what is active and relevant.

If a layer is turned off, its section should collapse or disappear rather than showing stale summary content.

## Visual Language

### Typography

- Use Inter as the main UI typeface.
- Inter should carry almost all interface text.
- Use a restrained mono face only for telemetry, timestamps, coordinates, feed IDs, and other machine-like strings.
- Typography hierarchy should rely on spacing, casing, weight, and alignment rather than oversized editorial headlines.

### Color

- base canvas: near-black, deep navy-black, graphite-blue
- primary signal: cold cyan / electric ice
- active system state: muted lime / controlled green
- warning: amber
- critical: restrained red
- neutral text: fog, steel, slate

The globe should provide most of the emotional richness. The UI should remain disciplined.

### Surfaces

- dark matte shells
- thin precision borders
- inset depth
- minimal glow accents
- subtle texture where helpful
- tighter radius than consumer SaaS cards

### Motion

Motion should feel like:

- acquisition
- tracking
- focus transition
- layer fade-in
- alert emergence
- orbital or atmospheric drift

It should not feel bouncy or playful.

## Cesium-First Technical Direction

The homepage should use a globe-native engine rather than a styled flat map. The recommended direction is Cesium-first.

### Why Cesium

Cesium matches the approved design better than a purely custom 3D render because it treats the earth as a real globe system with:

- camera altitude
- globe-native interaction
- imagery layers
- terrain support
- atmosphere
- time-aware overlays
- future live operational layer readiness

### React + Cesium Split

- React owns the product shell, rails, panels, timeline, and stateful controls.
- Cesium owns the globe runtime and the rendering of earth/layer interactions.
- The homepage becomes a composed operational system rather than a single canvas.

### Layer Registry

Operational layers should be registered through a typed layer registry so that simulated layers can later be swapped with live adapters without redesigning the UI.

### Performance Boundaries

- lazy-load Cesium on the client
- mount heavy layers on demand
- aggregate dense points until zoom or focus justifies detail
- keep the first-render command surface coherent even if some heavy layers are still loading

## Source Transparency

Source transparency remains non-negotiable.

Every meaningful layer, metric block, asset block, and city summary should display visible provenance such as:

- `Source: OECD`
- `Source: WHO`
- `Source: GHSL`
- `Source: OpenCellID`
- `Source: World Port Index`

If a layer or feed is simulated, it must be labeled as simulated until replaced by a verified or live source.

## Premium Constraint

Even with the command-center redesign, MapFactbook must preserve premium product discipline:

- coherent spacing
- consistent typography
- readable dense layouts
- high-end motion
- strong contrast
- refined loading and empty states
- no fake completeness

This is a premium operational interface, not a gimmick UI.

## Non-Goals

This design does not call for:

- news integration
- random military jargon
- meaningless sci-fi decoration
- literal copying of Palantir Maven
- fixed one-stack-only layer behavior
- replacing city/country pages with homepage-only analysis

Dedicated city and country workspaces should still exist for deeper analysis. The homepage is the global operational surface.

## Outcome

If implemented correctly, the new MapFactbook homepage will feel like:

- an operational earth console
- a premium geospatial intelligence product
- a credible tactical analysis surface
- a system that can support layered world monitoring now and live feeds later

This document is the active design source of truth for the command-center redesign.
