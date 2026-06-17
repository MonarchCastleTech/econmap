# MapFactbook Homepage Recovery Design

**Date:** 2026-03-21

**Intent:** Recover the homepage into a city-first OSINT workspace that is immediately useful on open, map-led, and compact enough for normal laptop use.

## Product Direction

The homepage is an analyst workspace, not a dataset catalog and not a command-center mock. The page should open with one compact operator rail on the left, the map in the center, and one compact `Infos` card in the top-right. The UI should feel restrained, evidence-first, and readable.

## Approved Layout

### Left rail

The left rail is the main recovery target. It should contain:

1. `Search`
2. `Active layers`
3. `Borders & Labels`
4. `Transport`
5. `Utilities`
6. `Connectivity`
7. `Environment`
8. `Economy / Institutions`
9. `City brief`
10. one small `Dataset explorer` utility link at the bottom

It should not contain:

- focus-city cards
- product-surface navigation grids
- dataset workspace rows mixed into the layer workflow
- decorative explanatory copy

Every layer row must clearly show:

- layer name
- on/off state
- source label
- short purpose
- status

If a group does not yet have a live published layer, it should show an honest operational placeholder row using real source labels and a non-published status. It must not deep-link into a dataset workspace from the main layer flow.

### Map

The visible city boundaries on the map are the selection surface. Selection must be bound only to that rendered source. The main workflow should prioritize meaningful cities such as Istanbul, Ankara, Paris, Rome, London, Berlin, Antalya, and Tbilisi.

### Selected city surfaces

The top-right should be just a compact `Infos` card. The larger selected-city intelligence surface stays in the left rail under `City brief`, where it should read as an OSINT starter brief rather than a decorative hero card.

## Interaction Model

- The operator starts from the map or search.
- Selecting a city updates the homepage immediately.
- The left rail remains usable even when no city is selected.
- Dataset workspaces remain available, but only as secondary support surfaces.

## Immediate Recovery Priorities

1. Remove homepage clutter from the left rail and top-right.
2. Rebuild the left rail as a compact layer-first operator panel.
3. Keep map selection strictly tied to visible selection geometry.
4. Expand the selected-city brief so the homepage is useful immediately after selection.
