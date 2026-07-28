# Phase 6: City ontology and identity - Context

**Gathered:** 2026-07-27
**Status:** Implemented
**Mode:** Autonomous from explicit all-in-one request

## Phase Boundary

Define city identity at the GeoNames ingestion boundary, preserve canonical source IDs, keep
subordinate places searchable without ranking them as peer cities, and introduce honest
source-availability states without breaking legacy generated artifacts.

## Locked Decisions

- GeoNames feature class `P` remains the city-registry boundary; administrative class `A`
  records such as California are not admitted as cities.
- `PPLX`, `PPLL`, `PPLQ`, `PPLR`, `PPLS`, and `PPLW` are subordinate places.
- `PPLA2` through `PPLA4` below 100,000 population are subordinate places.
- Other accepted populated-place codes remain cities; the distinction is explicit and source-backed.
- Search ranks cities before subordinate places but does not hide subordinate records.
- Missing identity fields in legacy generated artifacts default compatibly at parse time.

## Acceptance Examples

Cities: Bursa, Antalya, Diyarbakir, Izmir, Mus, Mexico City, Paris, Toulouse.

Subordinate places: Kecioren, Esenyurt, Varto.

Region rejected from city registry: California.
