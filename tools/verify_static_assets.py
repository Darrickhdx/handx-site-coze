#!/usr/bin/env python3
"""Verify local assets and the separate, explicit personal-project image grant."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets"
MANIFEST = ASSET_ROOT / "asset-manifest.json"
PROFILE_AUTHORIZATION = ROOT / "src" / "data" / "profile-media-authorization.json"
PROFILE_AUTHORIZATION_ID = "owner-personal-introduction-2026-10-04"
PROFILE_LICENSE = "CC BY-ND 2.1 JP"
PROFILE_LICENSE_URL = "https://creativecommons.org/licenses/by-nd/2.1/jp/deed.ja"
PROFILE_SOURCE_PAGE = "https://www.g-mark.org/gallery/winners/7551"
PROFILE_SOURCE_URLS = {
    "https://award-attachments.g-mark.io/winners/2022/7551/main.jpg?size=large",
    "https://award-attachments.g-mark.io/winners/2022/7551/use.jpg?size=large",
}


def safe_asset_path(value: object, *, personal_only: bool = False) -> bool:
    if not isinstance(value, str) or "\\" in value or any(ord(char) < 32 for char in value):
        return False
    parts = value.split("/")
    if any(part in {"", ".", ".."} for part in parts) or parts[0] != "assets":
        return False
    return not personal_only or (len(parts) >= 3 and parts[1] == "personal-projects")


def https_source(value: object) -> bool:
    if not isinstance(value, str) or any(char.isspace() for char in value):
        return False
    try:
        url = urlsplit(value)
        return url.scheme == "https" and bool(url.hostname) and url.username is None and url.password is None
    except ValueError:
        return False


def asset_has_symlink(path: Path) -> bool:
    return any(parent.is_symlink() for parent in (path, *path.parents) if parent == ROOT / "public" or ROOT / "public" in parent.parents)


def image_file_matches_suffix(path: Path, data: bytes) -> bool:
    suffix = path.suffix.lower()
    return (
        (suffix == ".png" and data.startswith(b"\x89PNG\r\n\x1a\n"))
        or (suffix in {".jpg", ".jpeg"} and data.startswith(b"\xff\xd8\xff"))
        or (suffix == ".webp" and data[:4] == b"RIFF" and data[8:12] == b"WEBP")
    )


def profile_authorization(errors: list[str]) -> dict[str, dict[str, object]]:
    if PROFILE_AUTHORIZATION.is_symlink():
        errors.append("profile media authorization symlink is forbidden")
        return {}
    if not PROFILE_AUTHORIZATION.exists():
        return {}
    try:
        payload = json.loads(PROFILE_AUTHORIZATION.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot read profile media authorization: {exc}")
        return {}
    if not isinstance(payload, dict):
        errors.append("profile media authorization must be an object")
        return {}
    if payload.get("schema_version") != "profile-media-authorization-1.0":
        errors.append("profile media authorization schema_version is invalid")
    if payload.get("authorization_id") != PROFILE_AUTHORIZATION_ID:
        errors.append("profile media authorization ID is invalid")
    pages = payload.get("authorized_pages")
    if not isinstance(pages, list) or sorted(page for page in pages if isinstance(page, str)) != ["/about", "/ai"] or len(pages) != 2:
        errors.append("profile media authorization must be limited to /about and /ai")
    if payload.get("reuse_license") != "per_asset_license":
        errors.append("profile media reuse license must refer to each asset's license")
    rows = payload.get("assets")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 2:
        errors.append("profile media authorization must list one or two assets")
        return {}

    authorized: dict[str, dict[str, object]] = {}
    for row in rows:
        if not isinstance(row, dict):
            errors.append("profile media authorization contains a non-object entry")
            continue
        relative = row.get("path")
        if not safe_asset_path(relative, personal_only=True):
            errors.append(f"unsafe profile media authorization path: {relative}")
            continue
        assert isinstance(relative, str)
        if relative in authorized:
            errors.append(f"duplicate profile media authorization path: {relative}")
            continue
        if not isinstance(row.get("sha256"), str) or re.fullmatch(r"[0-9a-f]{64}", row["sha256"]) is None:
            errors.append(f"invalid profile media SHA-256 for {relative}")
        if not https_source(row.get("source_url")) or not https_source(row.get("source_page")):
            errors.append(f"profile media sources must be HTTPS URLs: {relative}")
        source_url = row.get("source_url")
        if row.get("source_page") != PROFILE_SOURCE_PAGE or not isinstance(source_url, str) or source_url not in PROFILE_SOURCE_URLS:
            errors.append(f"profile media source is not an approved PPS7700 award image: {relative}")
        if row.get("license") != PROFILE_LICENSE or row.get("license_url") != PROFILE_LICENSE_URL:
            errors.append(f"profile media license is not the approved CC BY-ND 2.1 JP license: {relative}")
        if not isinstance(row.get("attribution"), str) or not row["attribution"].strip():
            errors.append(f"profile media attribution is missing: {relative}")
        if not isinstance(row.get("caption"), str) or not row["caption"].strip():
            errors.append(f"profile media caption is missing: {relative}")
        if not isinstance(row.get("alt"), str) or not row["alt"].strip():
            errors.append(f"profile media alt text is missing: {relative}")
        for dimension in ("width", "height"):
            if type(row.get(dimension)) is not int or row[dimension] <= 0:
                errors.append(f"profile media {dimension} must be a positive integer: {relative}")
        if not isinstance(row.get("visual_kind"), str) or not row["visual_kind"].strip():
            errors.append(f"profile media visual_kind is missing: {relative}")
        if row.get("original_site_bytes_compared") is not False:
            errors.append(f"profile media must disclose original bytes were not compared: {relative}")
        authorized[relative] = row
    return authorized


def main() -> int:
    errors: list[str] = []
    if asset_has_symlink(MANIFEST):
        print(json.dumps({"status": "FAIL", "errors": ["asset manifest symlink is forbidden"]}, ensure_ascii=False, indent=2))
        return 1
    try:
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 1

    if not isinstance(payload, dict):
        print(json.dumps({"status": "FAIL", "errors": ["asset manifest must be an object"]}, ensure_ascii=False, indent=2))
        return 1

    if payload.get("schema_version") != "local-preview-assets-1.0":
        errors.append("asset manifest schema_version is invalid")
    if payload.get("deployment_authorized") is not False or payload.get("must_not_deploy") is not True:
        errors.append("asset manifest deployment gate is not closed")

    rows = payload.get("assets")
    if not isinstance(rows, list):
        errors.append("asset manifest assets must be a list")
        rows = []

    listed: dict[str, dict[str, object]] = {}
    for row in rows:
        if not isinstance(row, dict):
            errors.append("asset manifest contains a non-object entry")
            continue
        relative = row.get("path")
        if not safe_asset_path(relative):
            errors.append(f"unsafe asset manifest path: {relative}")
            continue
        assert isinstance(relative, str)
        if relative in listed:
            errors.append(f"duplicate asset manifest path: {relative}")
            continue
        listed[relative] = row

    authorized = profile_authorization(errors)
    if set(authorized) & set(listed):
        errors.append("profile media authorization must not overlap the local-preview asset manifest")

    actual: set[str] = set()
    if asset_has_symlink(ASSET_ROOT):
        errors.append("public asset root symlink is forbidden")
    for path in (() if asset_has_symlink(ASSET_ROOT) else ASSET_ROOT.rglob("*")):
        if path == MANIFEST:
            continue
        if path.is_symlink():
            errors.append(f"asset symlink is forbidden: {path.relative_to(ROOT / 'public')}")
            continue
        if path.is_file():
            actual.add(path.relative_to(ROOT / "public").as_posix())

    listed_paths = set(listed) | set(authorized)
    if actual != listed_paths:
        unlisted = sorted(actual - listed_paths)
        missing = sorted(listed_paths - actual)
        if unlisted:
            errors.append(f"unlisted public assets: {unlisted}")
        if missing:
            errors.append(f"authorized assets missing from disk: {missing}")

    for relative, row in listed.items():
        path = ROOT / "public" / relative
        expected_sha = str(row.get("sha256", ""))
        if re.fullmatch(r"[0-9a-f]{64}", expected_sha) is None:
            errors.append(f"invalid SHA-256 for {relative}")
            continue
        if row.get("rights_scope") != "local_internal_preview_only" or row.get("publishable") is not False:
            errors.append(f"asset publication gate is not closed: {relative}")
        if asset_has_symlink(path):
            errors.append(f"asset symlink is forbidden: {relative}")
            continue
        if not path.is_file():
            continue
        try:
            actual_sha = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError as exc:
            errors.append(f"cannot read asset {relative}: {exc}")
            continue
        if actual_sha != expected_sha:
            errors.append(f"asset SHA-256 mismatch: {relative}")

    for relative, row in authorized.items():
        path = ROOT / "public" / relative
        if asset_has_symlink(path):
            errors.append(f"profile media symlink is forbidden: {relative}")
            continue
        if not path.is_file():
            continue
        try:
            data = path.read_bytes()
        except OSError as exc:
            errors.append(f"cannot read profile media {relative}: {exc}")
            continue
        if not image_file_matches_suffix(path, data):
            errors.append(f"profile media must be a PNG, JPEG or WebP image: {relative}")
        if hashlib.sha256(data).hexdigest() != row.get("sha256"):
            errors.append(f"profile media SHA-256 mismatch: {relative}")

    if errors:
        print(json.dumps({"status": "FAIL", "errors": errors}, ensure_ascii=False, indent=2))
        return 1
    print(
        json.dumps(
            {
                "status": "PASS",
                "assets": len(actual),
                "manifest": str(MANIFEST.relative_to(ROOT)),
                "deployment_authorized": False,
                "authorized_personal_assets": len(authorized),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
