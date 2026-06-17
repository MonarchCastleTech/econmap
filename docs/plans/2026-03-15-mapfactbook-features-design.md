# MapFactbook Features Design

## Context

This document defines the approved next-layer feature strategy for MapFactbook after the command-center homepage and data-design decisions.

The product direction is:

- command-center / defense aesthetic
- Cesium-first 3D live-earth homepage
- full product surface remains visible
- zero frontend data APIs
- scheduled static rebuilds
- accepted dataset rows are sufficient evidence
- no fabrication

The purpose of this feature design is to deepen intelligence, not just add spectacle.

## Feature Philosophy

MapFactbook should not become a bag of widgets. New features must deepen reasoning around an object, system, comparison, or time state.

The right model is not “add everything as separate modules.” The right model is “make the selected place or system reveal deeper intelligence through multiple lenses.”

## Core Feature Framework

All deeper features should organize around six intelligence lenses:

- Compare
- Time
- Systems
- Exposure
- Presence
- Confidence

These should not feel like six separate apps. They should feel like six ways of interrogating the same intelligence surface.

## Packaging Model

The feature set should be grouped into four product zones.

### 1. Core Command Surface

This is the homepage and its immediate right-rail / ops-strip behavior.

Belongs here:

- layer stack
- command presets
- global operational summary
- selected-city command panel
- watch candidates
- layer interaction explainability
- coverage/confidence summary

Purpose:

- immediate situational awareness
- fast operator focus
- first-level reasoning

### 2. Deep City Intelligence Workspace

This is the deeper city page / city workspace.

Belongs here:

- city systems breakdown
- source drill-down workspace
- asset cluster detection
- infrastructure dependency graph
- full city metric panels
- full entity views
- city dossier export

Purpose:

- full city inspection
- system-by-system reasoning
- asset and exposure understanding

### 3. Comparative Intelligence Workspace

This is the compare surface.

Belongs here:

- city comparison command view
- corridor intelligence
- side-by-side system comparisons
- source difference views
- coverage difference views

Purpose:

- selection
- benchmarking
- strategic comparison

### 4. Temporal Intelligence Workspace

This is the time and change layer of the product.

Belongs here:

- snapshot delta
- change detection
- watch candidates
- temporal ops-strip modes
- build-to-build change summaries

Purpose:

- time-aware intelligence
- monitored-system behavior
- change-based prioritization

## Recommended Next Features

The strongest next additions are:

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

## Recommended Build Order

To make the product smarter fastest, the recommended implementation order is:

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

This order improves:

- intelligence depth
- operator reasoning
- trust and explainability
- decision support
- temporal awareness

without requiring every advanced feature to land at once.

## Feature Concepts

### 1. City Systems Breakdown

This should become the backbone of the city workspace.

System families:

- Telecom
- Transport
- Water
- Energy
- Environment
- Research
- Logistics

Behavior:

- selecting a system reconfigures both the right-side panel and the globe
- the city panel shows only the most relevant metrics, assets, dependencies, source lines, and coverage state for that system
- the globe emphasizes the relevant operational layers for the active system

This turns a city from a flat factbook into a system-by-system intelligence object.

### 2. Source Drill-Down Workspace

This should be a first-class intelligence surface, not a tooltip detail.

Each major block should allow the operator to inspect:

- exact dataset names
- source labels
- version or dataset date
- methodology summary
- fields provided by each source
- whether the value is direct, derived, or aggregated
- coverage/confidence state

It should be possible to inspect sources by:

- city
- system
- metric
- entity
- layer

This supports auditability and aligns with the approved rule that accepted dataset rows are enough evidence.

### 3. City Comparison Command View

This should feel like a tactical side-by-side evaluation surface, not a table page.

Capabilities:

- compare two or more cities
- compare by system
- compare by layer state
- compare assets and counts
- compare source backing
- compare coverage quality

Recommended globe modes:

- split compare
- dual focus
- sequential focus

This makes the product useful for selection and strategic comparison, not just observation.

### 4. Snapshot Delta / Change Detection

This should make the command center feel monitored across rebuilds.

Capabilities:

- latest versus previous build
- city delta
- system delta
- layer delta
- new coverage detection
- new asset/detection changes
- changed metric or field highlights

The globe should support a delta mode so change becomes a first-class analytical lens.

### 5. Asset Cluster Detection

This should group nearby assets into meaningful clusters instead of treating every entity as an isolated marker.

Examples:

- airport + warehouse + freight rail cluster
- port + industrial + power cluster
- university + HQ + research campus cluster

This is operationally more useful than flat point lists.

### 6. Coverage / Confidence Surface

This should remain visible without becoming apology UI.

Capabilities:

- system coverage by city
- layer coverage by city
- source strength display
- explicit partial/not-covered states

It clarifies what is strong and weak while preserving the full product surface.

### 7. Corridor Intelligence

This expands the product from point-city thinking into connection and movement analysis.

Examples:

- port-to-city corridors
- airport-to-industrial-belt corridors
- basin / river-linked corridors
- logistics chains across linked cities

This is valuable for transport, logistics, infrastructure, and environmental reasoning.

### 8. Infrastructure Dependency Graph

This should visualize constrained, interpretable relationships between systems.

Examples:

- water stress -> energy exposure
- airport -> logistics -> industrial cluster
- research anchors -> HQ concentration
- telecom density -> infrastructure service reach

This should only be built from explicit relationships justified by the data model.

### 9. City Dossier Export

This should generate a compiled briefing, not a screenshot dump.

Export contents should include:

- city command summary
- active systems
- active layers
- key metrics
- key assets
- exposures
- source labels
- coverage notes
- optional comparison deltas

### 10. Watch / Alert Candidates

Even without runtime APIs, scheduled rebuilds can generate meaningful watch candidates.

Examples:

- cities with biggest build-to-build change
- cities with newly improved source coverage
- cities with changing heat/fire/weather exposure
- cities with rapidly shifting connectivity or asset context

### 11. Layer Interaction Explainability

This feature answers:

- why does this city look important right now?
- which active layers are driving its prominence?
- what sources are shaping that view?
- is the signal broad, sparse, or partial?

This prevents the command-center globe from becoming visually impressive but analytically opaque.

## Shared UX Rules

All deeper features should share:

- system-first organization
- visible source labels
- visible coverage/confidence states
- command-center visual language
- synchronized globe and panel behavior
- common city identity model
- common layer semantics

They must feel like parts of one intelligence system, not disconnected tools.

## Product Risks

### 1. Feature Sprawl

Risk:

- too many disconnected modes

Guardrail:

- every feature must deepen one of the four product zones

### 2. Overcomplicated City Pages

Risk:

- too many simultaneous signals make the city unreadable

Guardrail:

- system-first presentation
- one dominant system at a time
- contextual expansion for secondary information

### 3. False Analytical Authority

Risk:

- partial data can look more complete than it is

Guardrail:

- visible source labels
- visible coverage states
- visible confidence states
- always-available source drill-down

### 4. Command-Center Noise

Risk:

- too many alerts, overlays, colors, and motion

Guardrail:

- one dominant signal at a time
- controlled motion
- meaningful alerting only
- explainable layer composition

### 5. Weak Temporal Features

Risk:

- change detection becomes gimmicky

Guardrail:

- changes must come from real packaged snapshot/build differences
- the UI must say what changed, from which source, and when

### 6. Compare Mode Becoming Spreadsheet-Only

Risk:

- comparison becomes sterile and disconnected from the globe

Guardrail:

- compare systems, layers, assets, source backing, and coverage
- keep the globe active in comparison mode

### 7. Graph Features Becoming Decorative

Risk:

- network graphs look intelligent without analytical value

Guardrail:

- edges must come from explicit relationships in the model
- constrained graph design first

### 8. Export Becoming Dumb Screenshots

Risk:

- dossier export has no structure or analytical value

Guardrail:

- exports must be structured around systems, sources, assets, exposures, and current layer state

### 9. Coverage Becoming Apology UI

Risk:

- users become over-focused on what is missing

Guardrail:

- coverage should clarify confidence, not overshadow intelligence

### 10. Homepage / Workspace Drift

Risk:

- homepage and deep pages feel like different products

Guardrail:

- shared source model
- shared system categories
- shared coverage model
- shared city identity spine
- shared visual language

## Final Rule

Every new feature must improve at least one of:

- understanding
- comparison
- explanation
- change awareness
- operator decision-making

If it does not materially improve one of those, it should not ship.

## Outcome

If implemented correctly, these features turn MapFactbook into:

- a command-center intelligence product
- a deep city reasoning tool
- a source-transparent analytical system
- a comparison and change-awareness platform

This document is the active feature-design source of truth for MapFactbook.
