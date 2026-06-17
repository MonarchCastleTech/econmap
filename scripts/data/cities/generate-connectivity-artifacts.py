from __future__ import annotations

import argparse
import json
import math
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import geopandas as gpd
import pyarrow.parquet as pq


OOKLA_SOURCE_URL = "https://www.speedtest.net/insights/open-data/"


@dataclass
class AggregatedConnectivityMetric:
    tile_count: int = 0
    tests_total: int = 0
    devices_total: int = 0
    weighted_download_kbps: float = 0.0
    weighted_upload_kbps: float = 0.0
    weighted_latency_ms: float = 0.0
    download_weight: float = 0.0
    upload_weight: float = 0.0
    latency_weight: float = 0.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Aggregate Ookla fixed/mobile broadband tiles into city-first connectivity artifacts.",
    )
    parser.add_argument("--root-dir", type=Path, default=Path.cwd())
    parser.add_argument("--selection-asset")
    parser.add_argument("--fixed-parquet")
    parser.add_argument("--mobile-parquet")
    parser.add_argument("--processed-indexes-dir")
    parser.add_argument("--output-file")
    return parser.parse_args()


def resolve_path(root_dir: Path, override: str | None, relative_path: str) -> Path:
    if override:
        return Path(override).resolve()
    return (root_dir / relative_path).resolve()


def to_float(value) -> float | None:
    if value is None:
        return None

    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(numeric):
        return None

    return numeric


def to_non_negative_int(value) -> int:
    numeric = to_float(value)
    if numeric is None:
        return 0
    return max(0, int(numeric))


def round_metric(value: float | None, digits: int = 1) -> float | None:
    if value is None:
        return None

    rounded = round(value, digits)
    if digits == 0:
        return int(rounded)
    return rounded


def parse_dataset_date(file_path: Path, fallback_date: str) -> tuple[int | None, str]:
    match = re.search(r"(\d{4}-\d{2}-\d{2})", file_path.name)
    if not match:
        year_match = re.search(r"(\d{4})", file_path.name)
        if not year_match:
            return None, fallback_date
        return int(year_match.group(1)), fallback_date

    date_value = match.group(1)
    return int(date_value[:4]), date_value


def load_city_selection(selection_asset: Path) -> gpd.GeoDataFrame:
    if not selection_asset.exists():
        raise FileNotFoundError(f"City selection asset not found: {selection_asset}")

    city_selection = gpd.read_file(selection_asset)
    if city_selection.empty:
        raise ValueError(f"City selection asset is empty: {selection_asset}")

    if city_selection.crs is None:
        city_selection = city_selection.set_crs(epsg=4326)
    else:
        city_selection = city_selection.to_crs(epsg=4326)

    expected_columns = [
        "cityId",
        "slug",
        "name",
        "countryIso3",
        "latitude",
        "longitude",
        "population",
        "sourceLabel",
    ]
    missing_columns = [column for column in expected_columns if column not in city_selection.columns]
    if missing_columns:
        raise ValueError(
            f"City selection asset is missing required fields: {', '.join(sorted(missing_columns))}",
        )

    return city_selection[expected_columns + ["geometry"]].copy()


def iter_parquet_batches(parquet_file: Path):
    if not parquet_file.exists():
        return

    parquet_reader = pq.ParquetFile(parquet_file)
    columns = [
        "tile_x",
        "tile_y",
        "avg_d_kbps",
        "avg_u_kbps",
        "avg_lat_ms",
        "tests",
        "devices",
    ]

    for row_group_index in range(parquet_reader.num_row_groups):
        yield parquet_reader.read_row_group(row_group_index, columns=columns).to_pandas()


def aggregate_parquet_to_city_metrics(
    city_selection: gpd.GeoDataFrame,
    parquet_file: Path,
) -> dict[str, AggregatedConnectivityMetric]:
    aggregates: dict[str, AggregatedConnectivityMetric] = defaultdict(AggregatedConnectivityMetric)

    if not parquet_file.exists():
        return aggregates

    for batch in iter_parquet_batches(parquet_file):
        if batch is None or batch.empty:
            continue

        batch = batch.dropna(subset=["tile_x", "tile_y"])
        if batch.empty:
            continue

        point_frame = gpd.GeoDataFrame(
            batch,
            geometry=gpd.points_from_xy(batch["tile_x"], batch["tile_y"]),
            crs="EPSG:4326",
        )
        matched = gpd.sjoin(point_frame, city_selection, how="inner", predicate="intersects")
        if matched.empty:
            continue

        for row in matched.itertuples(index=False):
            city_id = getattr(row, "cityId")
            aggregate = aggregates[city_id]
            tests = to_non_negative_int(getattr(row, "tests", 0))
            devices = to_non_negative_int(getattr(row, "devices", 0))
            weight = tests or devices or 1

            aggregate.tile_count += 1
            aggregate.tests_total += tests
            aggregate.devices_total += devices

            avg_download_kbps = to_float(getattr(row, "avg_d_kbps", None))
            avg_upload_kbps = to_float(getattr(row, "avg_u_kbps", None))
            avg_latency_ms = to_float(getattr(row, "avg_lat_ms", None))

            if avg_download_kbps is not None:
                aggregate.weighted_download_kbps += avg_download_kbps * weight
                aggregate.download_weight += weight

            if avg_upload_kbps is not None:
                aggregate.weighted_upload_kbps += avg_upload_kbps * weight
                aggregate.upload_weight += weight

            if avg_latency_ms is not None:
                aggregate.weighted_latency_ms += avg_latency_ms * weight
                aggregate.latency_weight += weight

    return aggregates


def build_source_meta(
    source_id: str,
    methodology: str,
    updated_at: str,
) -> dict[str, str]:
    return {
        "id": source_id,
        "name": "Ookla Open Data",
        "updatedAt": updated_at,
        "coverage": "city_selection_surface",
        "methodology": methodology,
        "url": OOKLA_SOURCE_URL,
    }


def metric_from_aggregate(aggregate: AggregatedConnectivityMetric, attribute: str) -> float | None:
    weighted_value = getattr(aggregate, f"weighted_{attribute}")
    if attribute == "download_kbps":
        weight_total = aggregate.download_weight
    elif attribute == "upload_kbps":
        weight_total = aggregate.upload_weight
    elif attribute == "latency_ms":
        weight_total = aggregate.latency_weight
    else:
        weight_total = 0

    if not weight_total:
        return None

    return weighted_value / weight_total


def build_layer_record(
    city_record,
    aggregate: AggregatedConnectivityMetric,
    layer_kind: str,
    source_id: str,
) -> dict[str, object]:
    average_download_mbps = metric_from_aggregate(aggregate, "download_kbps")
    average_upload_mbps = metric_from_aggregate(aggregate, "upload_kbps")
    average_latency_ms = metric_from_aggregate(aggregate, "latency_ms")

    return {
        "entityId": f"{layer_kind}-{city_record.cityId}",
        "entityType": layer_kind.replace("-", "_"),
        "entitySubtype": "city_selection_surface",
        "name": str(city_record.name),
        "cityId": str(city_record.cityId),
        "slug": str(city_record.slug),
        "countryIso3": str(city_record.countryIso3),
        "latitude": round(float(city_record.latitude), 6),
        "longitude": round(float(city_record.longitude), 6),
        "population": to_float(getattr(city_record, "population", None)),
        "exactSite": False,
        "sourceId": source_id,
        "sourceLabel": "Ookla",
        "tileCount": aggregate.tile_count,
        "tests": aggregate.tests_total,
        "devices": aggregate.devices_total,
        "avgDownloadMbps": round_metric(
            None if average_download_mbps is None else average_download_mbps / 1000,
        ),
        "avgUploadMbps": round_metric(
            None if average_upload_mbps is None else average_upload_mbps / 1000,
        ),
        "avgLatencyMs": round_metric(average_latency_ms),
    }


def build_metric(
    indicator_id: str,
    value: float | None,
    unit: str,
    year: int | None,
    source: dict[str, str],
) -> dict[str, object]:
    return {
        "indicatorId": indicator_id,
        "value": round_metric(value),
        "unit": unit,
        "year": year,
        "status": "actual",
        "source": source,
    }


def main() -> None:
    args = parse_args()
    root_dir = args.root_dir.resolve()
    generated_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    selection_asset = resolve_path(
        root_dir,
        args.selection_asset,
        "public/data/globe/reference/city-footprints/selectable.geojson",
    )
    fixed_parquet = resolve_path(
        root_dir,
        args.fixed_parquet,
        "data/raw/cities/bulk/ookla/2025-10-01_performance_fixed_tiles.parquet",
    )
    mobile_parquet = resolve_path(
        root_dir,
        args.mobile_parquet,
        "data/raw/cities/bulk/ookla/2025-10-01_performance_mobile_tiles.parquet",
    )
    processed_indexes_dir = resolve_path(
        root_dir,
        args.processed_indexes_dir,
        "data/processed/cities/indexes",
    )
    output_file = resolve_path(
        root_dir,
        args.output_file,
        "src/data/generated/command-center/city-connectivity-enrichment.json",
    )

    city_selection = load_city_selection(selection_asset)
    fixed_year, fixed_updated_at = parse_dataset_date(fixed_parquet, generated_at[:10])
    mobile_year, mobile_updated_at = parse_dataset_date(mobile_parquet, generated_at[:10])

    fixed_source = build_source_meta(
        "ookla-fixed-open-data",
        "Weighted average of fixed broadband Ookla tiles intersecting the visible city selection surface.",
        fixed_updated_at,
    )
    mobile_source = build_source_meta(
        "ookla-mobile-open-data",
        "Weighted average of mobile broadband Ookla tiles intersecting the visible city selection surface.",
        mobile_updated_at,
    )

    fixed_aggregates = aggregate_parquet_to_city_metrics(city_selection, fixed_parquet)
    mobile_aggregates = aggregate_parquet_to_city_metrics(city_selection, mobile_parquet)

    fixed_records: list[dict[str, object]] = []
    mobile_records: list[dict[str, object]] = []
    enrichment_cities: dict[str, dict[str, object]] = {}

    for city_record in city_selection.sort_values(["population", "name"], ascending=[False, True]).itertuples(index=False):
        city_id = str(city_record.cityId)
        urban_intel: list[dict[str, object]] = []
        sources: dict[str, dict[str, str]] = {}

        fixed_aggregate = fixed_aggregates.get(city_id)
        if fixed_aggregate and fixed_aggregate.tile_count > 0:
            fixed_records.append(
                build_layer_record(city_record, fixed_aggregate, "connectivity-fixed", "ookla-fixed"),
            )
            fixed_download_mbps = metric_from_aggregate(fixed_aggregate, "download_kbps")
            fixed_upload_mbps = metric_from_aggregate(fixed_aggregate, "upload_kbps")
            fixed_latency_ms = metric_from_aggregate(fixed_aggregate, "latency_ms")
            urban_intel.extend(
                [
                    build_metric(
                        "fixed-download-mbps",
                        None if fixed_download_mbps is None else fixed_download_mbps / 1000,
                        "Mbps",
                        fixed_year,
                        fixed_source,
                    ),
                    build_metric(
                        "fixed-upload-mbps",
                        None if fixed_upload_mbps is None else fixed_upload_mbps / 1000,
                        "Mbps",
                        fixed_year,
                        fixed_source,
                    ),
                    build_metric(
                        "fixed-latency-ms",
                        fixed_latency_ms,
                        "ms",
                        fixed_year,
                        fixed_source,
                    ),
                ],
            )
            sources[fixed_source["id"]] = fixed_source

        mobile_aggregate = mobile_aggregates.get(city_id)
        if mobile_aggregate and mobile_aggregate.tile_count > 0:
            mobile_records.append(
                build_layer_record(city_record, mobile_aggregate, "connectivity-mobile", "ookla-mobile"),
            )
            mobile_download_mbps = metric_from_aggregate(mobile_aggregate, "download_kbps")
            mobile_upload_mbps = metric_from_aggregate(mobile_aggregate, "upload_kbps")
            mobile_latency_ms = metric_from_aggregate(mobile_aggregate, "latency_ms")
            urban_intel.extend(
                [
                    build_metric(
                        "mobile-download-mbps",
                        None if mobile_download_mbps is None else mobile_download_mbps / 1000,
                        "Mbps",
                        mobile_year,
                        mobile_source,
                    ),
                    build_metric(
                        "mobile-upload-mbps",
                        None if mobile_upload_mbps is None else mobile_upload_mbps / 1000,
                        "Mbps",
                        mobile_year,
                        mobile_source,
                    ),
                    build_metric(
                        "mobile-latency-ms",
                        mobile_latency_ms,
                        "ms",
                        mobile_year,
                        mobile_source,
                    ),
                ],
            )
            sources[mobile_source["id"]] = mobile_source

        if not urban_intel:
            continue

        enrichment_cities[city_id] = {
            "generatedAt": generated_at,
            "economicFactbook": [],
            "investorIntel": [],
            "urbanIntel": [metric for metric in urban_intel if metric["value"] is not None],
            "sources": list(sources.values()),
        }

    processed_indexes_dir.mkdir(parents=True, exist_ok=True)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    (processed_indexes_dir / "connectivity-fixed.json").write_text(
        json.dumps(fixed_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (processed_indexes_dir / "connectivity-mobile.json").write_text(
        json.dumps(mobile_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    output_file.write_text(
        json.dumps(
            {
                "generatedAt": generated_at,
                "cities": enrichment_cities,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(
        "Generated connectivity artifacts:",
        f"fixed={len(fixed_records)}",
        f"mobile={len(mobile_records)}",
        f"cities={len(enrichment_cities)}",
        f"output={output_file}",
    )


if __name__ == "__main__":
    main()
