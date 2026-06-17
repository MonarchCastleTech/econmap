from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd


ROOT = Path(__file__).resolve().parents[3]
RAW_NATURAL_EARTH_DIR = ROOT / "data" / "raw" / "cities" / "bulk" / "naturalearth"
RAW_GHSL_DIR = ROOT / "data" / "raw" / "cities" / "bulk" / "ghsl"
CITY_REGISTRY_FILE = ROOT / "src" / "data" / "generated" / "cities" / "registry.json"
CITY_SEARCH_INDEX_FILE = ROOT / "src" / "data" / "generated" / "cities" / "search-index.json"
OUTPUT_DIR = ROOT / "public" / "data" / "globe" / "reference"
CITY_FOOTPRINTS_DIR = OUTPUT_DIR / "city-footprints"

GHSL_VECTOR_DIR = RAW_GHSL_DIR / "GHS_WUP_MTUC_GLOBE_R2025A_V1_1_vector"
GHSL_STATS_FILE = (
    RAW_GHSL_DIR
    / "GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics"
    / "GHS_WUP_MTUC_MT_GLOBE_R2025A_v1_1.xlsx"
)
GHSL_POLYGON_FILE = GHSL_VECTOR_DIR / "GHS_WUP_MTUC_MT_GLOBE_R2025A_v1_1.shp"
GHSL_POINT_FILE = GHSL_VECTOR_DIR / "GHS_WUP_MTUC_MT_GLOBE_R2025A_pnt_v1_1.shp"
NATURAL_EARTH_URBAN_AREAS_FILE = (
    RAW_NATURAL_EARTH_DIR / "ne_10m_urban_areas" / "ne_10m_urban_areas.shp"
)

CITY_MAP_SELECTION_POPULATION_THRESHOLD = 500_000
GHSL_MAX_DISTANCE_M = 15_000
NATURAL_EARTH_MAX_DISTANCE_M = 3_000
GHSL_SMOOTH_BUFFER_METERS = 125
NATURAL_EARTH_SMOOTH_BUFFER_METERS = 60
GHSL_SIMPLIFY_METERS = 175
NATURAL_EARTH_SIMPLIFY_METERS = 90
NATURAL_EARTH_GHSL_CONFLICT_DISTANCE_M = 20_000


def write_geojson(frame: gpd.GeoDataFrame, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    frame.to_file(output_file, driver="GeoJSON")


def write_json(data: object, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(data, indent=2), encoding="utf-8")


def normalize_name(value: object) -> str:
    if value is None:
        return ""

    text = str(value).strip().lower()
    replacements = str.maketrans(
        {
            "ç": "c",
            "ğ": "g",
            "ı": "i",
            "İ": "i",
            "ö": "o",
            "ş": "s",
            "ü": "u",
            "â": "a",
            "î": "i",
            "û": "u",
            "-": " ",
            "'": "",
            "’": "",
            "(": " ",
            ")": " ",
            ",": " ",
            ".": " ",
        }
    )
    return " ".join(text.translate(replacements).split())


def smooth_polygonal_geometry(
    frame: gpd.GeoDataFrame, buffer_distance: float, simplify_distance: float
) -> gpd.GeoDataFrame:
    smoothed = frame.copy()
    smoothed["geometry"] = smoothed.geometry.buffer(buffer_distance).buffer(-buffer_distance)
    smoothed["geometry"] = smoothed.geometry.simplify(simplify_distance, preserve_topology=True)
    smoothed = smoothed[smoothed.geometry.notnull() & ~smoothed.geometry.is_empty].copy()
    return smoothed


def load_ghsl_points_with_stats() -> gpd.GeoDataFrame:
    ghsl_points = gpd.read_file(GHSL_POINT_FILE)
    ghsl_stats = pd.read_excel(
        GHSL_STATS_FILE,
        sheet_name="UC_STATS",
        usecols=["ID_UC_G0", "UCname", "UNLocName", "Year"],
    )
    ghsl_stats = ghsl_stats[ghsl_stats["Year"] == 2025].drop_duplicates(subset=["ID_UC_G0"])
    ghsl_points = ghsl_points.merge(ghsl_stats[["ID_UC_G0", "UCname", "UNLocName"]], on="ID_UC_G0", how="left")
    return ghsl_points


def build_country_reference() -> None:
    countries = gpd.read_file(
        RAW_NATURAL_EARTH_DIR / "ne_10m_admin_0_countries" / "ne_10m_admin_0_countries.shp"
    ).to_crs("EPSG:4326")
    countries = countries[["NAME", "ADM0_A3", "geometry"]].rename(
        columns={"NAME": "name", "ADM0_A3": "iso3"}
    )
    countries = countries[countries.geometry.notnull()].copy()
    countries["geometry"] = countries.geometry.simplify(0.08, preserve_topology=True)
    countries = countries[countries.geometry.notnull() & ~countries.geometry.is_empty].copy()
    write_geojson(countries, OUTPUT_DIR / "natural-earth-countries.geojson")


def load_admin1_reference_frame() -> gpd.GeoDataFrame:
    admin1 = gpd.read_file(
        RAW_NATURAL_EARTH_DIR
        / "ne_10m_admin_1_states_provinces"
        / "ne_10m_admin_1_states_provinces.shp"
    ).to_crs("EPSG:4326")
    admin1 = admin1[
        ["name", "name_en", "adm0_a3", "iso_3166_2", "gn_a1_code", "geometry"]
    ].rename(
        columns={
            "adm0_a3": "iso3",
            "iso_3166_2": "iso3166_2",
            "gn_a1_code": "geoNamesAdmin1Code",
            "name_en": "nameEn",
        }
    )
    admin1 = admin1[admin1.geometry.notnull()].copy()
    admin1["admin1Code"] = admin1["geoNamesAdmin1Code"].fillna("").map(_normalize_admin1_code)
    admin1["geometry"] = admin1.geometry.simplify(0.04, preserve_topology=True)
    admin1 = admin1[admin1.geometry.notnull() & ~admin1.geometry.is_empty].copy()
    admin1["normalizedName"] = admin1["name"].map(normalize_name)
    admin1["normalizedNameEn"] = admin1["nameEn"].map(normalize_name)
    admin1["areaSqKm"] = admin1.to_crs("EPSG:3857").geometry.area / 1_000_000
    return admin1


def build_admin1_reference() -> None:
    admin1 = load_admin1_reference_frame().drop(columns=["normalizedName", "normalizedNameEn"])
    write_geojson(admin1, OUTPUT_DIR / "natural-earth-admin1.geojson")


def _normalize_admin1_code(value: object) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    if "." in text:
        return text.rsplit(".", 1)[-1]

    if "-" in text:
        return text.rsplit("-", 1)[-1]

    return text


def load_candidate_cities() -> gpd.GeoDataFrame:
    registry = pd.read_json(CITY_REGISTRY_FILE)
    search_index = pd.read_json(CITY_SEARCH_INDEX_FILE)

    candidates = registry.merge(
        search_index[["cityId", "population", "isMajorCity"]],
        on="cityId",
        how="left",
        suffixes=("", "_search"),
    )
    candidates["selectionPopulation"] = (
        candidates["population_search"].fillna(candidates["population"]).fillna(0)
    )
    candidates["isMajorCity"] = candidates["isMajorCity"].fillna(False)
    candidates = candidates[
        candidates["selectionPopulation"] >= CITY_MAP_SELECTION_POPULATION_THRESHOLD
    ].copy()
    candidates = candidates[
        [
            "cityId",
            "slug",
            "name",
            "countryIso3",
            "admin1Code",
            "admin1Name",
            "latitude",
            "longitude",
            "selectionPopulation",
        ]
    ].drop_duplicates(subset=["cityId"])

    return gpd.GeoDataFrame(
        candidates,
        geometry=gpd.points_from_xy(candidates["longitude"], candidates["latitude"]),
        crs="EPSG:4326",
    )


def build_admin1_city_matches(candidates: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    admin1 = load_admin1_reference_frame()
    admin1 = admin1[
        [
            "name",
            "nameEn",
            "iso3",
            "iso3166_2",
            "geoNamesAdmin1Code",
            "admin1Code",
            "normalizedName",
            "normalizedNameEn",
            "areaSqKm",
            "geometry",
        ]
    ].copy()

    candidate_frame = candidates.copy()
    candidate_frame["normalizedCityName"] = candidate_frame["name"].map(normalize_name)
    candidate_frame["normalizedAdmin1Name"] = candidate_frame["admin1Name"].map(normalize_name)

    country_candidate_frames = {
        country_iso3: frame.reset_index(drop=True)
        for country_iso3, frame in candidate_frame.groupby("countryIso3", sort=False)
    }

    matched_rows: list[dict[str, object]] = []
    for admin_row in admin1.itertuples(index=False):
        country_candidates = country_candidate_frames.get(admin_row.iso3)
        if country_candidates is None or country_candidates.empty:
            continue

        name_candidates = {
            normalized_name
            for normalized_name in [admin_row.normalizedName, admin_row.normalizedNameEn]
            if normalized_name
        }
        code_matches = (
            country_candidates["admin1Code"] == admin_row.admin1Code
            if admin_row.admin1Code
            else pd.Series(False, index=country_candidates.index)
        )
        name_matches = (
            country_candidates["normalizedCityName"].isin(name_candidates)
            | country_candidates["normalizedAdmin1Name"].isin(name_candidates)
        )
        matching_candidates = country_candidates[code_matches | name_matches].copy()
        if matching_candidates.empty:
            continue

        matching_candidates["nameMatchScore"] = matching_candidates["normalizedCityName"].isin(name_candidates)
        matching_candidates["adminNameMatchScore"] = matching_candidates["normalizedAdmin1Name"].isin(name_candidates)
        matching_candidates["codeMatchScore"] = (
            matching_candidates["admin1Code"] == admin_row.admin1Code if admin_row.admin1Code else False
        )
        matching_candidates = matching_candidates.sort_values(
            ["nameMatchScore", "adminNameMatchScore", "codeMatchScore", "selectionPopulation", "name"],
            ascending=[False, False, False, False, True],
        )
        winning_candidate = matching_candidates.iloc[0]

        matched_rows.append(
            {
                "cityId": winning_candidate["cityId"],
                "slug": winning_candidate["slug"],
                "name": winning_candidate["name"],
                "countryIso3": winning_candidate["countryIso3"],
                "latitude": winning_candidate["latitude"],
                "longitude": winning_candidate["longitude"],
                "selectionPopulation": winning_candidate["selectionPopulation"],
                "matchDistanceMeters": 0,
                "sourceLabel": "Natural Earth Admin1",
                "areaSqKm": admin_row.areaSqKm,
                "geometry": admin_row.geometry,
            }
        )

    if not matched_rows:
        return gpd.GeoDataFrame(
            columns=[
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "latitude",
                "longitude",
                "selectionPopulation",
                "matchDistanceMeters",
                "sourceLabel",
                "areaSqKm",
                "geometry",
            ],
            geometry=[],
            crs="EPSG:4326",
        )

    matched = gpd.GeoDataFrame(matched_rows, geometry="geometry", crs="EPSG:4326")
    matched = matched.sort_values(
        ["selectionPopulation", "areaSqKm", "name"], ascending=[False, False, True]
    ).drop_duplicates(subset=["cityId"], keep="first")
    matched = matched.reset_index(drop=True)
    return matched


def build_ghsl_city_matches(candidates: gpd.GeoDataFrame) -> tuple[gpd.GeoDataFrame, set[str]]:
    ghsl_polygons = gpd.read_file(GHSL_POLYGON_FILE)
    ghsl_polygons = ghsl_polygons[ghsl_polygons["Year"] == 2025].copy()
    polygon_crs = ghsl_polygons.crs
    ghsl_polygons = ghsl_polygons[["ID_UC_G0", "geometry"]]

    ghsl_points = load_ghsl_points_with_stats().to_crs(polygon_crs)

    joined = gpd.sjoin_nearest(
        candidates.to_crs(polygon_crs),
        ghsl_points[["ID_UC_G0", "UCname", "UNLocName", "geometry"]],
        how="left",
        distance_col="matchDistanceMeters",
    )
    joined = joined[joined["matchDistanceMeters"] <= GHSL_MAX_DISTANCE_M].copy()
    ghsl_candidate_city_ids = set(joined["cityId"].astype(str))
    joined = joined.sort_values(
        ["selectionPopulation", "matchDistanceMeters"], ascending=[False, True]
    ).drop_duplicates(subset=["ID_UC_G0"], keep="first")

    ghsl_matched = ghsl_polygons.merge(
        joined[
            [
                "ID_UC_G0",
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "latitude",
                "longitude",
                "selectionPopulation",
                "matchDistanceMeters",
                "UCname",
                "UNLocName",
            ]
        ],
        on="ID_UC_G0",
        how="inner",
    )

    ghsl_matched["sourceLabel"] = "GHSL"
    ghsl_matched["areaSqKm"] = ghsl_matched.geometry.area / 1_000_000
    ghsl_matched = smooth_polygonal_geometry(
        ghsl_matched, GHSL_SMOOTH_BUFFER_METERS, GHSL_SIMPLIFY_METERS
    )
    ghsl_matched = ghsl_matched.to_crs("EPSG:4326")

    return (
        ghsl_matched[
            [
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "latitude",
                "longitude",
                "selectionPopulation",
                "matchDistanceMeters",
                "sourceLabel",
                "areaSqKm",
                "geometry",
            ]
        ],
        ghsl_candidate_city_ids,
    )


def build_natural_earth_city_matches(
    candidates: gpd.GeoDataFrame, matched_city_ids: set[str]
) -> gpd.GeoDataFrame:
    unmatched_candidates = candidates[~candidates["cityId"].isin(matched_city_ids)].copy()
    if unmatched_candidates.empty:
        return gpd.GeoDataFrame(
            columns=[
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "selectionPopulation",
                "matchDistanceMeters",
                "sourceLabel",
                "areaSqKm",
                "geometry",
            ],
            geometry=[],
            crs="EPSG:4326",
        )

    urban_areas = gpd.read_file(NATURAL_EARTH_URBAN_AREAS_FILE).to_crs("EPSG:3857")
    urban_areas = urban_areas.reset_index(drop=True)
    urban_areas["urbanAreaId"] = urban_areas.index.astype(str)

    unmatched_candidates_3857 = unmatched_candidates.to_crs("EPSG:3857")
    ghsl_points_3857 = load_ghsl_points_with_stats().to_crs("EPSG:3857")

    ghsl_nearest = gpd.sjoin_nearest(
        unmatched_candidates_3857,
        ghsl_points_3857[["ID_UC_G0", "UCname", "UNLocName", "geometry"]],
        how="left",
        distance_col="ghslDistanceMeters",
    )
    ghsl_nearest["candidateNormalizedName"] = ghsl_nearest["name"].map(normalize_name)
    ghsl_nearest["ghslNormalizedName"] = ghsl_nearest["UCname"].map(normalize_name)
    ghsl_nearest["ghslUnlocNormalizedName"] = ghsl_nearest["UNLocName"].map(normalize_name)
    ghsl_nearest["conflictsWithNearbyGhslCity"] = (
        (ghsl_nearest["ghslDistanceMeters"] <= NATURAL_EARTH_GHSL_CONFLICT_DISTANCE_M)
        & (ghsl_nearest["ghslNormalizedName"] != "")
        & (ghsl_nearest["candidateNormalizedName"] != ghsl_nearest["ghslNormalizedName"])
        & (ghsl_nearest["candidateNormalizedName"] != ghsl_nearest["ghslUnlocNormalizedName"])
    )
    unmatched_candidates_3857 = ghsl_nearest[~ghsl_nearest["conflictsWithNearbyGhslCity"]].copy()

    contained = gpd.sjoin(
        unmatched_candidates_3857,
        urban_areas[["urbanAreaId", "area_sqkm", "geometry"]],
        how="inner",
        predicate="within",
    )
    contained = contained.assign(matchDistanceMeters=0)
    contained = contained.sort_values(
        ["selectionPopulation", "area_sqkm"], ascending=[False, True]
    ).drop_duplicates(subset=["urbanAreaId"], keep="first")

    still_unmatched = unmatched_candidates_3857[
        ~unmatched_candidates_3857["cityId"].isin(contained["cityId"])
    ].copy()
    nearest = gpd.sjoin_nearest(
        still_unmatched,
        urban_areas[["urbanAreaId", "area_sqkm", "geometry"]],
        how="left",
        distance_col="matchDistanceMeters",
    )
    nearest = nearest[nearest["matchDistanceMeters"] <= NATURAL_EARTH_MAX_DISTANCE_M].copy()
    nearest = nearest.sort_values(
        ["selectionPopulation", "matchDistanceMeters"], ascending=[False, True]
    ).drop_duplicates(subset=["urbanAreaId"], keep="first")

    accepted = pd.concat([contained, nearest], ignore_index=True)
    if accepted.empty:
        return gpd.GeoDataFrame(
            columns=[
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "selectionPopulation",
                "matchDistanceMeters",
                "sourceLabel",
                "areaSqKm",
                "geometry",
            ],
            geometry=[],
            crs="EPSG:4326",
        )

    matched = urban_areas.merge(
        accepted[
            [
                "urbanAreaId",
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "latitude",
                "longitude",
                "selectionPopulation",
                "matchDistanceMeters",
            ]
        ],
        on="urbanAreaId",
        how="inner",
    )
    matched["sourceLabel"] = "Natural Earth Urban Areas"
    matched["areaSqKm"] = matched["area_sqkm"]
    matched = smooth_polygonal_geometry(
        matched, NATURAL_EARTH_SMOOTH_BUFFER_METERS, NATURAL_EARTH_SIMPLIFY_METERS
    )
    matched = matched.to_crs("EPSG:4326")

    return matched[
        [
            "cityId",
            "slug",
            "name",
            "countryIso3",
            "latitude",
            "longitude",
            "selectionPopulation",
            "matchDistanceMeters",
            "sourceLabel",
            "areaSqKm",
            "geometry",
        ]
    ]


def build_city_footprints() -> None:
    candidates = load_candidate_cities()
    city_footprints = build_admin1_city_matches(candidates)
    city_footprints = city_footprints[city_footprints.geometry.notnull() & ~city_footprints.geometry.is_empty].copy()
    city_footprints = city_footprints.sort_values(
        ["selectionPopulation", "name"], ascending=[False, True]
    ).reset_index(drop=True)

    CITY_FOOTPRINTS_DIR.mkdir(parents=True, exist_ok=True)

    selectable = city_footprints.copy()
    selectable["population"] = selectable["selectionPopulation"]
    write_geojson(
        selectable[
            [
                "cityId",
                "slug",
                "name",
                "countryIso3",
                "latitude",
                "longitude",
                "population",
                "sourceLabel",
                "areaSqKm",
                "matchDistanceMeters",
                "geometry",
            ]
        ],
        CITY_FOOTPRINTS_DIR / "selectable.geojson",
    )

    catalog_items = []
    for row in city_footprints.itertuples(index=False):
        asset_path = f"/data/globe/reference/city-footprints/{row.cityId}.geojson"
        feature = gpd.GeoDataFrame(
            [
                {
                    "cityId": row.cityId,
                    "slug": row.slug,
                    "name": row.name,
                    "countryIso3": row.countryIso3,
                    "latitude": row.latitude,
                    "longitude": row.longitude,
                    "population": row.selectionPopulation,
                    "sourceLabel": row.sourceLabel,
                    "areaSqKm": row.areaSqKm,
                    "matchDistanceMeters": row.matchDistanceMeters,
                    "geometry": row.geometry,
                }
            ],
            geometry="geometry",
            crs="EPSG:4326",
        )
        write_geojson(feature, CITY_FOOTPRINTS_DIR / f"{row.cityId}.geojson")
        catalog_items.append(
            {
                "cityId": row.cityId,
                "slug": row.slug,
                "name": row.name,
                "countryIso3": row.countryIso3,
                "assetPath": asset_path,
                "latitude": None if pd.isna(row.latitude) else float(row.latitude),
                "longitude": None if pd.isna(row.longitude) else float(row.longitude),
                "population": None if pd.isna(row.selectionPopulation) else float(row.selectionPopulation),
                "areaSqKm": None if pd.isna(row.areaSqKm) else round(float(row.areaSqKm), 3),
                "matchDistanceMeters": None
                if pd.isna(row.matchDistanceMeters)
                else round(float(row.matchDistanceMeters), 3),
                "sourceLabel": row.sourceLabel,
            }
        )

    write_json(
        {
            "generatedAt": pd.Timestamp.utcnow().isoformat(),
            "selectionAssetPath": "/data/globe/reference/city-footprints/selectable.geojson",
            "cities": catalog_items,
        },
        CITY_FOOTPRINTS_DIR / "catalog.json",
    )


def main() -> None:
    build_country_reference()
    build_admin1_reference()
    build_city_footprints()
    print(f"Generated reference layers in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
