"""Restore reviewed generated data from a pinned EconMap release artifact.

This is the bounded fallback for development machines that cannot regenerate the
large city pipeline locally. The archive is accepted only when its SHA-256
matches the digest published on the GitHub release.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import tarfile
import tempfile
import time
import urllib.request
from pathlib import Path, PurePosixPath


TAG = "site-20260624"
ARCHIVE_URL = (
    "https://github.com/MonarchCastleTech/econmap/releases/download/"
    f"{TAG}/econmap-site.tar.gz"
)
EXPECTED_SHA256 = "94a0f3cf479aafb311db72b9483d4bacd663e9078e6bcef8d1414038f61036d3"
DOWNLOAD_DEADLINE_SECONDS = 110

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = Path(tempfile.gettempdir()) / f"econmap-{TAG}"
CACHE_ARCHIVE = CACHE_DIR / "econmap-site.tar.gz"
PUBLIC_DATA = ROOT / "public" / "data"
GENERATED_DATA = ROOT / "src" / "data" / "generated"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    part = CACHE_ARCHIVE.with_suffix(".part")
    request = urllib.request.Request(
        ARCHIVE_URL,
        headers={"User-Agent": "econmap-reviewed-release-cache/1.0"},
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(
            request, timeout=DOWNLOAD_DEADLINE_SECONDS
        ) as response, part.open("wb") as target:
            while chunk := response.read(1024 * 1024):
                if time.monotonic() - started > DOWNLOAD_DEADLINE_SECONDS:
                    raise TimeoutError(
                        f"release download exceeded {DOWNLOAD_DEADLINE_SECONDS}s"
                    )
                target.write(chunk)
        part.replace(CACHE_ARCHIVE)
    except BaseException:
        part.unlink(missing_ok=True)
        raise


def ensure_archive() -> None:
    if CACHE_ARCHIVE.exists() and sha256(CACHE_ARCHIVE) == EXPECTED_SHA256:
        print(f"[release-cache] verified cached archive for {TAG}")
        return
    CACHE_ARCHIVE.unlink(missing_ok=True)
    print(f"[release-cache] downloading {ARCHIVE_URL}")
    download()
    actual = sha256(CACHE_ARCHIVE)
    if actual != EXPECTED_SHA256:
        CACHE_ARCHIVE.unlink(missing_ok=True)
        raise RuntimeError(
            f"release digest mismatch: expected {EXPECTED_SHA256}, received {actual}"
        )
    print(f"[release-cache] verified sha256:{actual}")


def extract_public_data() -> int:
    extracted = 0
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    with tarfile.open(CACHE_ARCHIVE, "r:gz") as archive:
        for member in archive.getmembers():
            normalized = PurePosixPath(member.name.removeprefix("./"))
            if not normalized.parts or normalized.parts[0] != "data":
                continue
            relative = PurePosixPath(*normalized.parts[1:])
            if not relative.parts or ".." in relative.parts:
                continue
            if member.issym() or member.islnk():
                raise RuntimeError(f"release data contains an unsupported link: {member.name}")
            destination = PUBLIC_DATA.joinpath(*relative.parts).resolve()
            if PUBLIC_DATA.resolve() not in destination.parents:
                raise RuntimeError(f"release member escapes public/data: {member.name}")
            if member.isdir():
                destination.mkdir(parents=True, exist_ok=True)
                continue
            source = archive.extractfile(member)
            if source is None:
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            with source, destination.open("wb") as target:
                shutil.copyfileobj(source, target)
            extracted += 1
    return extracted


def mirror_build_manifests() -> None:
    GENERATED_DATA.mkdir(parents=True, exist_ok=True)
    for relative in ("cities/manifest.json", "command-center/manifest.json"):
        source = PUBLIC_DATA / relative
        destination = GENERATED_DATA / relative
        if not source.exists():
            raise RuntimeError(f"reviewed release is missing {source}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def derive_small_build_indexes() -> None:
    city_manifest_path = GENERATED_DATA / "cities" / "manifest.json"
    search_index_path = PUBLIC_DATA / "cities" / "search-index.json"
    with city_manifest_path.open(encoding="utf-8") as source:
        city_manifest = json.load(source)
    with search_index_path.open(encoding="utf-8") as source:
        search_index = json.load(source)
    if not isinstance(search_index, list) or not search_index:
        raise RuntimeError("reviewed release city search index is empty or invalid")

    slug_meta = {}
    for city in search_index:
        slug = city.get("slug")
        if not slug or slug in slug_meta:
            raise RuntimeError(f"reviewed release contains an invalid/duplicate city slug: {slug}")
        slug_meta[slug] = {
            "n": city.get("name", ""),
            "i": city.get("countryIso3", ""),
            "p": city.get("population", 0),
        }
    slug_meta_path = GENERATED_DATA / "cities" / "slug-meta.json"
    slug_meta_path.write_text(
        json.dumps(slug_meta, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    registry_summary = {
        "totalCities": city_manifest["totalCityCount"],
        "countriesCovered": len(city_manifest["countryCounts"]),
    }
    registry_summary_path = GENERATED_DATA / "command-center" / "registry-summary.json"
    registry_summary_path.write_text(
        json.dumps(registry_summary, separators=(",", ":")),
        encoding="utf-8",
    )


def main() -> None:
    ensure_archive()
    count = extract_public_data()
    mirror_build_manifests()
    derive_small_build_indexes()
    print(
        f"[release-cache] restored {count} published files and mirrored "
        "the reviewed build manifests/indexes"
    )


if __name__ == "__main__":
    main()
