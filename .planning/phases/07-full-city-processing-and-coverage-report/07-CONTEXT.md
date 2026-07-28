# Phase 7 Context

## Goal

Process every canonical city deterministically without treating subordinate populated places as
cities. Keep the broader populated-place registry available for search and disambiguation.

## Decisions

- Canonical processing denominator: 95,915 records with `placeClass: city`.
- Search denominator: 192,445 populated-place records.
- Required baseline sources: GeoNames, OurAirports, and official UN/LOCODE.
- GLEIF, GHSL, OECD, WPI, and similar enrichment feeds are optional; absence becomes an explicit gap.
- Checkpoints record deterministic offsets, failures, total city count, and batch size.
