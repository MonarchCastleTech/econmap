from __future__ import annotations

import csv
import json
import math
import re
import unicodedata
from datetime import datetime, UTC
from pathlib import Path

import geopandas as gpd


ROOT = Path.cwd()
REGISTRY_FILE = ROOT / "src" / "data" / "generated" / "cities" / "registry.json"
OECD_DIR = ROOT / "data" / "raw" / "cities" / "bulk" / "oecd"
FUA_SHAPEFILE = OECD_DIR / "fuas (1)" / "fuas.shp"
OECD_MUNICIPALITIES_FILE = OECD_DIR / "list_of_municipalities_in_FUAs_and_Cities.csv"
OECD_ECONOMY_FILE = OECD_DIR / "oecd-fua-economy.csv"
OECD_LABOUR_FILE = OECD_DIR / "oecd-fua-labour.csv"
OUTPUT_FILE = ROOT / "src" / "data" / "generated" / "command-center" / "city-intel-enrichment.json"


def normalize_label(value: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", value)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    normalized = re.sub(r"\([^)]*\)", " ", normalized)
    normalized = re.sub(r"\b(greater|metropolitan)\b", " ", normalized)
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")


def parse_number(value: str) -> float | None:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def scale_value(value: float | None, unit_mult: str | None) -> float | None:
    if value is None:
        return None

    multiplier = int(unit_mult or 0)
    return value * (10 ** multiplier)


def latest_row_by_key(rows, key_fields):
    latest = {}
    for row in rows:
        try:
            year = int(row["TIME_PERIOD"])
        except (TypeError, ValueError):
            continue

        key = tuple(row[field] for field in key_fields)
        current = latest.get(key)
        if current is None or year > current[0]:
            latest[key] = (year, row)

    return {key: row for key, (_, row) in latest.items()}


def build_oecd_city_lookup():
    registry = json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
    city_lookup = {}

    for city in registry:
        country_iso3 = city.get("countryIso3")
        labels = {normalize_label(city["name"])}
        for alias in city.get("aliases", []):
            labels.add(normalize_label(alias))

        for label in labels:
            city_lookup.setdefault((country_iso3, label), []).append(city)

    return registry, city_lookup


def build_fua_membership_lookup():
    memberships = {}

    with OECD_MUNICIPALITIES_FILE.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            fua_code = (row.get("FUA ID") or "").strip()
            municipality_name = normalize_label(row.get("Municipality name") or "")
            if not fua_code or not municipality_name:
                continue

            memberships.setdefault(fua_code, set()).add(municipality_name)

    return memberships


def resolve_candidates(candidates, municipality_labels):
    if len(candidates) == 1:
        return candidates[0]

    admin_matches = []
    for candidate in candidates:
        admin1_label = normalize_label(candidate.get("admin1Name") or "")
        if admin1_label and admin1_label in municipality_labels:
            admin_matches.append(candidate)

    if len(admin_matches) == 1:
        return admin_matches[0]

    major_candidates = [candidate for candidate in candidates if candidate.get("isMajorCity")]
    if len(major_candidates) == 1:
        return major_candidates[0]

    ranked_candidates = sorted(
        major_candidates or candidates,
        key=lambda candidate: (candidate.get("population") or 0),
        reverse=True,
    )
    if len(ranked_candidates) == 1:
        return ranked_candidates[0]

    if ranked_candidates and (ranked_candidates[0].get("population") or 0) > (ranked_candidates[1].get("population") or 0):
        return ranked_candidates[0]

    return None


def build_fua_city_matches(city_lookup):
    fuas = gpd.read_file(FUA_SHAPEFILE)
    memberships = build_fua_membership_lookup()
    matches = {}

    for _, fua in fuas.iterrows():
        country_iso3 = str(fua["iso3"])
        fua_code = str(fua["fuacode"])
        labels = {normalize_label(str(fua["fuaname_en"]))}
        fua_name = fua.get("fuaname")
        if fua_name:
            labels.add(normalize_label(str(fua_name)))

        matched_city = None
        for label in labels:
            candidates = city_lookup.get((country_iso3, label), [])
            if not candidates:
                continue

            resolved_candidate = resolve_candidates(candidates, memberships.get(fua_code, set()))
            if resolved_candidate:
                matched_city = resolved_candidate
                break

        if matched_city:
            matches.setdefault(
                matched_city["cityId"],
                {
                    "fuacode": fua_code,
                    "cityName": matched_city["name"],
                    "countryIso3": country_iso3,
                },
            )

    return matches


def build_metric(indicator_id, value, unit, year, source):
    return {
        "indicatorId": indicator_id,
        "value": None if value is None or not math.isfinite(value) else round(value),
        "unit": unit,
        "year": year,
        "status": "actual",
        "source": source,
    }


def main():
    generated_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    registry, city_lookup = build_oecd_city_lookup()
    matches = build_fua_city_matches(city_lookup)

    economy_rows = latest_row_by_key(
        csv.DictReader(OECD_ECONOMY_FILE.open("r", encoding="utf-8")),
        ["REF_AREA", "MEASURE", "UNIT_MEASURE"],
    )
    labour_rows = latest_row_by_key(
        csv.DictReader(OECD_LABOUR_FILE.open("r", encoding="utf-8")),
        ["REF_AREA", "MEASURE", "UNIT_MEASURE"],
    )

    economy_source = {
        "id": "oecd-fua-economy",
        "name": "OECD FUA Economy",
        "updatedAt": generated_at[:10],
        "coverage": "oecd_fua",
        "methodology": "Latest OECD FUA GDP PPP observation matched to a city selection surface.",
        "url": "https://www.oecd.org/",
    }
    labour_source = {
        "id": "oecd-fua-labour",
        "name": "OECD FUA Labour",
        "updatedAt": generated_at[:10],
        "coverage": "oecd_fua",
        "methodology": "Latest OECD FUA labour observation matched to a city selection surface.",
        "url": "https://www.oecd.org/",
    }

    city_entries = {}
    for city in registry:
        match = matches.get(city["cityId"])
        if not match:
            continue

        fuacode = match["fuacode"]
        economic_metrics = []
        investor_metrics = []
        sources = []

        gdp_ppp = economy_rows.get((fuacode, "GDP", "USD_PPP"))
        if gdp_ppp:
            value = scale_value(parse_number(gdp_ppp["OBS_VALUE"]), gdp_ppp.get("UNIT_MULT"))
            economic_metrics.append(
                build_metric("gdp-current-ppp", value, "USD PPP", int(gdp_ppp["TIME_PERIOD"]), economy_source)
            )
            sources.append(economy_source)

        labour_force = labour_rows.get((fuacode, "LF", "PS"))
        if labour_force:
            value = scale_value(parse_number(labour_force["OBS_VALUE"]), labour_force.get("UNIT_MULT"))
            investor_metrics.append(
                build_metric("labour-force", value, "persons", int(labour_force["TIME_PERIOD"]), labour_source)
            )
            sources.append(labour_source)

        employed = labour_rows.get((fuacode, "EMP", "PS"))
        if employed:
            value = scale_value(parse_number(employed["OBS_VALUE"]), employed.get("UNIT_MULT"))
            investor_metrics.append(
                build_metric("employment", value, "persons", int(employed["TIME_PERIOD"]), labour_source)
            )
            sources.append(labour_source)

        unemployment_rate = labour_rows.get((fuacode, "UNE_RATE", "PC"))
        if unemployment_rate:
            investor_metrics.append(
                build_metric(
                    "unemployment-rate",
                    parse_number(unemployment_rate["OBS_VALUE"]),
                    "%",
                    int(unemployment_rate["TIME_PERIOD"]),
                    labour_source,
                )
            )
            sources.append(labour_source)

        if not economic_metrics and not investor_metrics:
            continue

        unique_sources = {source["id"]: source for source in sources}
        city_entries[city["cityId"]] = {
            "generatedAt": generated_at,
            "economicFactbook": economic_metrics,
            "investorIntel": investor_metrics,
            "urbanIntel": [],
            "sources": list(unique_sources.values()),
        }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(
            {
                "generatedAt": generated_at,
                "cities": city_entries,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Generated {len(city_entries)} enriched city entries at {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
