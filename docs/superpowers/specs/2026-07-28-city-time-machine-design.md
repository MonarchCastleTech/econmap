# City Time Machine and Evidence Monitor Design

## Goal

Turn EconMap from a latest-state city directory into a source-attributed city
monitor. Every temporal claim must say what was observed, when it was observed,
which geography it describes, what class of evidence supports it, and whether
the evidence changed.

## Product Scope

The milestone delivers six connected capabilities:

1. City observation histories and deterministic change detection.
2. Administrative, urban-centre, and metro geography distinctions.
3. Telecom evidence tiers that never infer 5G from generic mobile speed.
4. Measured network-quality observations and source coverage metadata.
5. Saved-city alerts generated from source-backed changes.
6. Operational hazard observations from authoritative feeds.

The app remains a static Next.js export. Data acquisition and change detection
run before publication. The browser reads compact generated artifacts and does
not pretend to provide continuously live backend state.

## Observation Contract

All new intelligence uses one normalized observation type:

- `id`: stable content-derived identifier.
- `cityId`: canonical EconMap city identifier.
- `topic`: population, connectivity, telecom coverage, network quality,
  environment, hazard, infrastructure, or source coverage.
- `metric`: source-specific normalized metric identifier.
- `state`: observed, not_observed, unknown, unavailable, or not_applicable.
- `value` and `unit`: optional typed value.
- `evidenceKind`: regulator_reported, operator_reported, measured,
  satellite_detected, modelled, registry, or derived.
- `technology`: optional technology label such as 5G-NR or LTE.
- `operator`: optional operator or network name.
- `geographyKind`: point, administrative, urban_centre, metro, or radius.
- `observedAt`, `validFrom`, `validTo`, and `publishedAt`.
- `sourceId`, `sourceUrl`, `methodology`, and `confidence`.

Generic mobile download or latency measurements may use `technology: null`.
They cannot create a 5G coverage observation. A 5G state requires a
technology-specific regulator or operator observation.

## Temporal Artifacts

The pipeline stores immutable snapshot files by observation date. A deterministic
delta generator compares the latest two snapshots per source and emits:

- Added observations.
- Removed or expired observations.
- Value changes with previous and current values.
- State changes.
- Source freshness changes.

Public delivery uses a compact city-keyed intelligence index plus a global alert
feed. It does not duplicate full snapshots into every city dossier.

## Urban Geography

Every spatially aggregated observation declares its geography. The system can
ingest GHSL Urban Centre Database geometry when the source package is present.
Without GHSL input, cities retain their canonical point and urban-centre metrics
remain explicitly unavailable. Point-radius matching is permitted only when the
methodology and radius are published.

## Source Adapters

- Ookla: quarterly measured fixed/mobile performance; never 5G proof.
- M-Lab: measured download, upload, latency, loss, and sample counts.
- RIPE Atlas: measured latency, DNS, traceroute, and probe counts.
- FCC BDC: regulator-reported US technology coverage, including 5G-NR.
- GSMA: operator-reported global technology coverage when licensed data exists.
- GHSL: urban-centre geometry, population, and built-up classifications.
- OpenAQ: station-backed air-quality observations.
- NASA FIRMS: satellite-detected active-fire observations.
- USGS: authoritative earthquake observations.

Each adapter has an availability contract. Missing credentials, licences, or
source files produce `unavailable` source status, not synthetic observations.

## Alerts and Watchlists

Alerts are deterministic products of observation deltas. They have severity,
topic, city, change type, source, timestamp, and a human-readable summary.
Saved-city UI filters the published alert feed using the existing persisted
watchlist store. No account or server is required.

## User Interface

The OSINT city detail gains four compact sections:

- Evidence status: telecom and network evidence tiers.
- Time machine: latest changes and observation history.
- Urban geography: available geography definitions and aggregation warnings.
- Operational alerts: current hazards and source changes.

The interface uses existing dense analyst styling. Unknown and unavailable are
first-class states. No section displays empty promotional copy.

## Verification

- Schema tests reject generic-speed-as-5G observations.
- Delta tests prove deterministic added, changed, removed, and expired results.
- Alert tests prove watchlist filtering and severity ordering.
- Adapter tests prove graceful unavailable states.
- UI tests cover populated and baseline-only cities.
- Data audit verifies source IDs, URLs, timestamps, confidence, and artifact size.
- Production build and browser checks verify static export, desktop, and mobile.

## Non-Goals

- Inferring 5G from throughput.
- Scraping gated commercial datasets without permission.
- Claiming GHSL or GSMA coverage when source packages are absent.
- Adding social-media or general-news feeds.
- Sending email or push notifications from the static site.
