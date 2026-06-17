# Plan — Add Every (Real) City in the World to EconMap

**Status:** Planning only (no implementation in this document).
**Date:** 2026‑06‑17.
**Scope (corrected after the "Ankara/İstanbul/Bartın — not Keçiören/Esenyurt/Amasra" clarification):**
Build the **canonical city set** — one real city per administrative seat **plus** major independent cities —
**deduplicated** so a city's districts, boroughs, and neighborhoods never appear as separate cities.

> ### ⚠️ This supersedes the earlier "~5 million GeoNames places" draft.
> "Every city in the world" does **not** mean every populated place (villages/hamlets/boroughs). It means every
> **principal city**: national capitals + first‑order administrative seats (provinces/states/regions) + major
> standalone cities — and **explicitly not** their sub‑divisions. This makes the project a **curation/dedup**
> problem of **~7,000–10,000 cities**, not a scaling problem of millions. Every "scaling wall" from the prior
> draft (3 GB registry, 20M files, week‑long build, the 1 GB cap) is moot at this size.

---

## 0. The rule, proven against your examples (GeoNames feature codes, measured)

| City | GeoNames code | Pop | In? | Why |
|---|---|---|---|---|
| Ankara | **PPLC** | 3.5M | ✅ | national capital |
| İstanbul | **PPLA** | 15.7M | ✅ | first‑order (province) seat |
| Diyarbakır | **PPLA** | 1.79M | ✅ | province seat |
| Bartın | **PPLA** | **82K** | ✅ | province seat (small, still canonical) |
| Amasra | **PPLA2** | 6K | ❌ | *district* seat (2nd‑order) of Bartın |
| Esenyurt | **PPL** | **211K** | ❌ | a *district of İstanbul*, not its own city |
| Keçiören | PPL/PPLX | ~900K | ❌ | a *district of Ankara* |

**The discriminator is administrative rank + independence, NOT population.** Bartın (82K seat) is in; Esenyurt
(211K, 2.5× bigger) is out because it is part of İstanbul. The canonical definition:

> **A city is canonical iff it is** (a) a national capital `PPLC`, **or** (b) a first‑order admin seat `PPLA`,
> **or** (c) a *major independent* populated place (≥ population threshold `T`) **that is not a sub‑unit of a
> larger canonical city.** Everything that is a **district/borough/section/sub‑division** (`PPLA2`/`PPLA3`/
> `PPLA4`, `PPLX`, and `PPL` places absorbed by a larger city) is **excluded as a city** (it may still exist as
> a faint map point, but it is not "a city").

Decision taken: include **(c) major independent cities** (so New York / Los Angeles / Hamburg — which are `PPL`,
not seats — are cities), with `T` and the absorption rule defined in §4–5.

---

## 1. Scale (why this is easy now)

| Bucket | Count (approx.) | Source |
|---|---|---|
| `PPLC` national capitals | ~241 | GeoNames |
| `PPLA` first‑order seats | ~3,459 | GeoNames |
| Major independent `PPL`/`PPLX` ≥ T, after dedup | ~3,000–6,000 | depends on `T` (§4) |
| **Canonical city total** | **~7,000–10,000** | the deliverable |

For comparison: today the registry holds **189,025** places and pre‑renders **12,010** pages. The canonical set
is **smaller than today's page count**, so the existing architecture (pages + dossiers + PMTiles map + slim
search) absorbs it with **zero** scaling work. The entire effort is **getting the *membership* right**.

---

## 2. What's wrong with the data today (both directions)

The current filter (`ingest-registry.ts`: feature class `P` + valid codes + admin OR pop ≥ 1,000) and the page
threshold (`pop ≥ 50,000`) are **population‑shaped**, so they are wrong **both ways** vs the canonical rule:

- **Over‑includes** (has pages it shouldn't): Esenyurt (211K), Keçiören (~900K) and thousands of other
  districts/boroughs worldwide get pages purely for being populous.
- **Under‑includes** (missing pages it should have): province seats below 50K (small `PPLA` like some Anatolian/
  African/Pacific capitals) get **no page**, even though they are canonical cities.
- **No rank signal stored**: the registry record (`GeoNamesCityRecord`, `parsers/geonames-registry.ts:1‑21`)
  does **not** keep the GeoNames `featureCode`, so the pipeline currently *cannot* tell a seat from a borough.

**The fix is to make "is this a city?" rank‑and‑independence based, and store the signal.**

---

## 3. Context found (current pipeline — facts, cite before trusting)

- **Source**: GeoNames `allCountries.txt` (`scripts/data/cities/bulk-source-manifest.ts:147‑172`), raw at
  `data/raw/cities/bulk/geonames/`. Columns used: `featureClass`(7), **`featureCode`(8)** ← needed, `country`(9),
  `admin1..4`(11‑14), `population`(15).
- **Ingest/filter**: `scripts/data/cities/ingest-registry.ts` (`shouldPublishCity` :92‑106; `VALID_PLACE_CODES`
  :14‑28; `ADMIN_PLACE_CODES` :29; `minPopulation`=1000 :113). Row parse: `parsers/geonames-registry.ts:23‑79`
  (currently **drops** `featureCode`).
- **Registry record + Zod**: `parsers/geonames-registry.ts:1‑21`, `src/domain/city-schemas.ts:18‑38`. Fields:
  cityId/slug/name/aliases/iso2/iso3/admin1Name+Code/admin2Name/lat/lon/population/`isMajorCity`/… (no
  featureCode, no canonical flag).
- **Pages**: `src/app/city/[slug]/page.tsx` — `POPULATION_THRESHOLD=50000` (:8); `generateStaticParams` filters
  slug‑meta by `p >= 50000` (:17‑22) → 12,010 pages; body is a thin client shell, dossier loads client‑side.
- **Slug‑meta** (build params): `src/data/generated/cities/slug-meta.json` `{slug:{n,i,p}}`, built by
  `generate-slug-meta.ts`, read by `loadCitySlugMeta` (`src/lib/city-data.ts:49‑58`).
- **Delivery**: dossier Range‑bundle (`public/data/cities/dossiers/`, `build-dossier-bundle.ts`, client
  `src/lib/dossier-bundle-client.ts`); slim search (`build-search-index-slim.ts`, navigable = pop ≥ 50k);
  operational map layers now in `layers.pmtiles`; the **cities** map layer is fed by
  `reference/city-footprints/selectable.geojson`.
- **Hierarchy data NOT yet ingested**: GeoNames `hierarchy.txt` (parent↔child admin/place links) and the full
  `admin1Codes`/`admin2Codes` — these are the key inputs for dedup/completeness (§5–6).

---

## 4. The classifier — deciding membership

A populated place `p` (GeoNames row) is **canonical** iff:

```
isCanonical(p):
  if p.featureCode == "PPLC":            return true          # national capital
  if p.featureCode == "PPLA":            return true          # first-order admin seat
  if p.featureCode in {PPLA2,PPLA3,PPLA4}: return false       # lower admin seats → not a city
  if p.featureCode in {PPLX}:            return false         # section of a city → never a city
  # remaining: PPL / PPLG / PPLS / PPLL ... (independent populated places)
  if p.population >= T and not isAbsorbed(p): return true     # major independent city
  return false
```

- `T` = **major‑city population threshold**, a single tunable knob. Recommended **T = 100,000** (captures NYC,
  LA, Hamburg, Guangzhou‑districts? no — those are absorbed). M0 will measure the count at T ∈ {50k, 100k, 150k}.
- `isAbsorbed(p)` = the dedup test (§5): is `p` a sub‑unit / inside the footprint of a larger canonical city?
- **Tie‑break / completeness**: §6 guarantees every first‑order admin division still yields exactly one seat
  even if GeoNames mis‑codes it.

**New field to store**: `featureCode` (from col 8) **must** be captured in ingest (it is dropped today). Add a
derived boolean **`isCanonicalCity`** + an enum **`cityClass`** (`capital | admin1-seat | major-independent`) to
the registry record + Zod schema, and to slug‑meta (`{n,i,p,c}` where `c`=1 if canonical).

---

## 5. Deduplication / canonicalization (the technical heart)

Goal: a real city appears **once**, at its canonical level; its boroughs/districts/sections never appear as
separate cities. This is where Esenyurt/Keçiören/Amasra get removed.

**Inputs:** featureCode, `admin1..4` codes, GeoNames **`hierarchy.txt`** (add to bulk manifest), coordinates,
population.

**`isAbsorbed(p)` is true if any holds:**
1. **Admin rollup** — `p`'s admin chain resolves under a canonical city's metropolitan admin area. E.g. Esenyurt
   (`adm1=34` İstanbul) rolls up to İstanbul (`PPLA`, seat of `adm1=34`) → absorbed. Keçiören (`adm1=Ankara`) →
   absorbed into Ankara. Use `hierarchy.txt` parent links where present; else admin‑code prefix match.
2. **Footprint dominance** — `p` is within radius `R` of a canonical city `C` where `C.pop ≥ k·p.pop` (e.g.
   `k=3`) and `p` is not itself `PPLC/PPLA`. (`R` scaled by `C.pop`, ~10–35 km.) Catches boroughs GeoNames
   doesn't link cleanly.
3. **Rank** — `p.featureCode ∈ {PPLA2,PPLA3,PPLA4,PPLX}` (already excluded by the classifier; listed for
   completeness). Amasra (`PPLA2`) falls here.

**Non‑goal:** do NOT absorb a genuinely independent city that merely sits near a big one (e.g. a separate
province seat 20 km from a metro). Rule 2 is gated on `C.pop ≥ k·p.pop` **and** `p` not being a seat, to protect
these. Edge cases get flagged for manual review, not silently dropped.

**Output:** for each absorbed `p`, record `absorbedBy = C.cityId` (kept for the map/search "also known as"
rollup), so the data isn't lost — it's just not a separate *city*.

---

## 6. Completeness — every admin seat on Earth, present

"Every city" must be **exhaustive at the seat level**. Cross‑check, don't trust GeoNames blindly:

1. Load `admin1Codes` → the full set of (country, admin1) first‑order divisions worldwide (~3,600).
2. For each, assert **exactly one** canonical seat exists. If the `PPLA` is missing or mis‑coded, pick the
   largest in‑division populated place as the seat and **flag** it (`seatSource = "backfill"`).
3. Emit a **coverage report**: divisions with 0 seats (gap), >1 seat (ambiguous), backfilled seats. This report
   is a deliverable and an audit gate — "every province has its city" must be provable.
4. Major‑independent cities (`T`) are additive on top; they don't affect seat completeness.

---

## 7. App changes — pages/search/map keyed on canonical, not population

- **Pages**: replace the `pop ≥ 50,000` gate with `isCanonicalCity`. `generateStaticParams`
  (`city/[slug]/page.tsx:17‑22`) filters slug‑meta by `c === 1`, not `p ≥ 50000`. Result: **Bartın gets a page**
  (seat, 82K) and **Esenyurt does not** (absorbed). Page count ≈ canonical total (~7–10K) — *fewer* than today,
  so the build only gets easier.
- **Search**: the slim index becomes the **canonical set** (not "pop ≥ 50k"). `build-search-index-slim.ts:15`
  switches its filter to `isCanonicalCity`. Absorbed places can still resolve as aliases pointing to their
  parent city (so searching "Esenyurt" finds İstanbul).
- **Map**: canonical cities are the labelled city layer; absorbed/sub‑places may render as faint unlabelled
  points or be omitted. (When the cities layer moves to PMTiles, tag each point with `cityClass` so styling can
  distinguish seats vs major cities vs absorbed.)
- **Dossiers**: generated for canonical cities (and any with real entity data). Unchanged mechanism.
- **Country pages**: list the country's canonical cities (seats + major), giving the clean "Turkey: Ankara,
  İstanbul, …, Bartın" experience instead of district noise.

---

## 8. Data‑model changes

Add to `GeoNamesCityRecord` + `citySchema` (`src/domain/city-schemas.ts`) + the parser:
- `featureCode: string` (e.g. `"PPLA"`) — captured from allCountries col 8 (currently dropped).
- `cityClass: "capital" | "admin1-seat" | "major-independent"` — derived.
- `isCanonicalCity: boolean` — derived (the page/search/map gate).
- `absorbedBy?: string` — for sub‑places, the canonical city they roll into.
- `seatSource?: "geonames" | "backfill"` — provenance for completeness.

slug‑meta gains `c` (canonical flag). `source-licenses.ts` adds **GeoNames CC‑BY 4.0** (attribution).

---

## 9. Milestones (each independently testable)

**M0 — Measure & calibrate (no prod change).** Add `featureCode` capture behind a scratch run; produce counts by
feature code globally, the canonical total at `T ∈ {50k,100k,150k}`, and an absorption sample on Turkey
(must drop Esenyurt/Keçiören/Amasra, keep all 81 province seats incl. Bartın). **Gate:** the Turkey set matches
your examples exactly.

**M1 — Capture featureCode + canonical fields.** Extend `parsers/geonames-registry.ts` + `ingest-registry.ts` +
`city-schemas.ts` to store featureCode/cityClass/isCanonicalCity. Non‑destructive (membership unchanged yet).
**Verify:** schema/tests green; spot‑check codes for the example cities.

**M2 — Classifier.** Implement `isCanonical` (§4) with knob `T`. **Verify:** unit tests on the example cities +
NYC (PPL, in), Albany (PPLA, in), a random borough (out).

**M3 — Dedup/canonicalization.** Add `hierarchy.txt` to the bulk manifest; implement `isAbsorbed` (§5);
set `absorbedBy`. **Verify:** Esenyurt→İstanbul, Keçiören→Ankara, Amasra excluded by rank; an independent seat
near a metro is **not** absorbed (protect rule).

**M4 — Completeness audit.** Implement §6 cross‑check vs `admin1Codes`; emit the coverage report. **Verify:**
0 divisions with no seat (or each gap explained); backfills flagged.

**M5 — Re‑key app to canonical.** Pages/search/map/country lists switch from `pop ≥ 50k` to `isCanonicalCity`
(§7). **Verify:** Bartın has a page; Esenyurt 404s as a *city page* but resolves as an alias → İstanbul; Turkey
country page lists province capitals, not districts.

**M6 — Build + audit + deploy.** Regenerate slug‑meta (with `c`), dossiers, search, cities map layer; `npm run
build` (page count ≈ canonical total), `deploy:assemble`, `audit:data` PASS, deploy, live‑verify. **Verify:**
audit PASS; a seat city, a major city, and an absorbed place all behave per §7 live.

**M7 — Curation review pass.** Eyeball the coverage report + a per‑country sample (esp. federal countries:
US states' seats + major cities; metro‑heavy countries). Fix mis‑codes/backfills. **Verify:** sampled countries
read as a human‑sensible "list of that country's cities".

---

## 10. Risks & mitigations
- **GeoNames mis‑codes** a seat (wrong featureCode) → §6 backfill + flag; M7 human review.
- **Over‑absorption** (eating a real independent city) → rule‑2 gated on size dominance + non‑seat; flag, don't
  drop; `absorbedBy` keeps it recoverable.
- **Under‑absorption** (a borough survives as a city) → admin‑rollup (rule 1) + footprint (rule 2) + manual
  review of the largest non‑seat PPLs per metro.
- **Federal countries** (US/India/Brazil): first‑order seat ≠ biggest city → the `T` major‑independent rule (M2)
  restores NYC/LA/Mumbai/São Paulo; verify in M7.
- **`T` too low/high** → M0 calibrates; it's one constant.
- **Attribution** → GeoNames CC‑BY in `source-licenses.ts` (audit gate).

## 11. Verification plan
- Unit: classifier + dedup on a fixed fixture (the example cities + NYC/Albany/Mumbai + a borough).
- Data: coverage report (every admin1 has a seat); audit harness extended with a "canonical completeness" check.
- Build: page count == canonical count; no OOM (trivially under ceiling).
- Live: seat city page 200; major‑city page 200; absorbed place is alias→parent, not a standalone city; country
  page shows clean city list.

## 12. Definition of done
- Registry stores featureCode + cityClass + isCanonicalCity + absorbedBy.
- Canonical set ≈ 7–10K: **every** national capital, **every** first‑order admin seat (incl. small ones like
  Bartın), **plus** major independent cities (NYC/LA/Hamburg…), with **zero** districts/boroughs/sections as
  separate cities (Esenyurt/Keçiören/Amasra excluded, resolvable as aliases).
- Completeness report shows every first‑order division covered.
- Pages/search/map/country lists keyed on `isCanonicalCity`; build green; audit PASS; deployed + live‑verified.
- Per‑country sample reviewed (M7).

## 13. Open questions
1. **`T`** (major‑independent threshold): 50k / **100k** / 150k? (M0 will show counts; pick after.)
2. Should **major independent** cities require independence from the nearest metro only by admin (rule 1) or also
   by footprint (rule 2)? (Default: both.)
3. Do absorbed places stay as **faint map points** (recommended) or be **dropped** from the map entirely?
4. For sub‑country coverage beyond first‑order seats (e.g. you later want *second*‑order seats too), is that a
   future tier, or strictly out? (Default: out — Amasra stays excluded.)
5. Any countries where you want a **custom** notion of "city" (e.g. UK ceremonial cities, Japan's designated
   cities)? (Default: GeoNames admin model uniformly.)

---

### Appendix — the one‑paragraph summary
"Every city in the world" = the **canonical city set**: national capitals + first‑order administrative seats
(every province/state/region's principal city, regardless of size) + major independent cities — **deduplicated**
so no district, borough, or neighborhood appears as a separate city. ~7–10K cities. The work is **classification
(store featureCode) + dedup (absorb sub‑units) + completeness (every seat present)**, then re‑key the app's
pages/search/map from a population threshold to an `isCanonicalCity` flag. No scaling problem exists at this size.
