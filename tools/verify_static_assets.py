#!/usr/bin/env python3
"""Verify the closed local-preview asset allowlist and file hashes."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets"
MANIFEST = ASSET_ROOT / "asset-manifest.json"


def main() -> int:
    errors: list[str] = []
    try:
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
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
        relative = str(row.get("path", ""))
        if relative in listed:
            errors.append(f"duplicate asset manifest path: {relative}")
            continue
        if not relative.startswith("assets/") or ".." in Path(relative).parts:
            errors.append(f"unsafe asset manifest path: {relative}")
            continue
        listed[relative] = row

    actual: set[str] = set()
    for path in ASSET_ROOT.rglob("*"):
        if path == MANIFEST:
            continue
        if path.is_symlink():
            errors.append(f"asset symlink is forbidden: {path.relative_to(ROOT / 'public')}")
            continue
        if path.is_file():
            actual.add(path.relative_to(ROOT / "public").as_posix())

    listed_paths = set(listed)
    if actual != listed_paths:
        unlisted = sorted(actual - listed_paths)
        missing = sorted(listed_paths - actual)
        if unlisted:
            errors.append(f"unlisted public assets: {unlisted}")
        if missing:
            errors.append(f"manifest assets missing from disk: {missing}")

    for relative, row in listed.items():
        path = ROOT / "public" / relative
        expected_sha = str(row.get("sha256", ""))
        if re.fullmatch(r"[0-9a-f]{64}", expected_sha) is None:
            errors.append(f"invalid SHA-256 for {relative}")
            continue
        if row.get("rights_scope") != "local_internal_preview_only" or row.get("publishable") is not False:
            errors.append(f"asset publication gate is not closed: {relative}")
        if not path.is_file():
            continue
        actual_sha = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual_sha != expected_sha:
            errors.append(f"asset SHA-256 mismatch: {relative}")

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
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
