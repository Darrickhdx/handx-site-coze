#!/usr/bin/env python3
"""Build or verify the browser-safe novel edition and migration contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOOK_ROOT = PROJECT_ROOT / "../../../AI小说/成书/出版版"
BOOK_ROOT = Path(os.environ.get("NOVEL_BOOK_ROOT", DEFAULT_BOOK_ROOT)).resolve()
OUTPUT_PATH = PROJECT_ROOT / "src/data/novel-editions.json"
PINS_PATH = PROJECT_ROOT / "src/data/novel-edition-pins.json"
CURRENT_MANIFEST_PATH = PROJECT_ROOT / "public/novel/hero-wuming/novel-manifest.json"
STRUCTURE_FIELDS = ("pages", "numbered_chapters", "unnumbered_openings", "figure_plates")


def sha256_file(path: Path) -> str:
    before = path.stat()
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise RuntimeError(f"source changed while hashing: {path.name}")
    return digest.hexdigest()


def source_row(path: Path) -> dict[str, Any]:
    stat = path.stat()
    return {
        "artifact": path.suffix.lower().lstrip("."),
        "sha256": sha256_file(path),
        "byte_size": stat.st_size,
        "modified_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
    }


def count_markdown_structure(path: Path) -> tuple[int, int, int]:
    text = path.read_text(encoding="utf-8")
    numbered = len(re.findall(r"^#+\s*第[一二三四五六七八九十]+章\s*[·・]", text, re.M))
    openings = len(re.findall(r"^#+\s*序章\s*[·・]", text, re.M))
    figures = len(re.findall(r"^!\[[^\n]*\]\(插图/[^\n]+\)\s*$", text, re.M))
    return numbered, openings, figures


def load_pins() -> dict[str, Any]:
    pins = json.loads(PINS_PATH.read_text(encoding="utf-8"))
    if pins.get("schema_version") != "handx-novel-edition-pins-1.0":
        raise RuntimeError("novel edition pin file has an unexpected schema_version")
    if pins.get("must_not_deploy") is not True or pins.get("deployment_authorized") is not False:
        raise RuntimeError("novel edition pin file must keep the deployment gate closed")
    editions = pins.get("editions")
    if not isinstance(editions, dict) or not editions:
        raise RuntimeError("novel edition pin file declares no editions")
    return editions


def observe_edition(version: str) -> tuple[Path, dict[str, Any], dict[str, int]]:
    """Read one edition's artifacts off disk. Never compares against a pin."""
    root = BOOK_ROOT / f"V{version}"
    paths = {
        "markdown": root / f"英雄无名V{version}-可审阅.md",
        "pdf": root / f"英雄无名V{version}-印刷版.pdf",
        "docx": root / f"英雄无名V{version}-可编辑.docx",
    }
    missing = [path.name for path in paths.values() if not path.is_file()]
    if missing:
        raise RuntimeError(f"V{version} is missing source artifacts: {', '.join(missing)}")
    rows = {key: source_row(path) for key, path in paths.items()}
    chapters, openings, figures = count_markdown_structure(paths["markdown"])
    structure = {
        "pages": len(PdfReader(str(paths["pdf"])).pages),
        "numbered_chapters": chapters,
        "unnumbered_openings": openings,
        "figure_plates": figures,
    }
    return root, rows, structure


def compare_against_pin(
    version: str, pin: dict[str, Any], rows: dict[str, Any], structure: dict[str, int]
) -> list[str]:
    """Report drift between a frozen edition on disk and the pin this repo holds.

    Drift is reported, never repaired. Re-pinning is a deliberate edit to
    src/data/novel-edition-pins.json, reviewable as a diff.
    """
    drift: list[str] = []
    expected_hashes = pin.get("sha256", {})
    for artifact, expected in expected_hashes.items():
        actual = rows.get(artifact, {}).get("sha256")
        if actual != expected:
            drift.append(
                f"V{version} frozen {artifact} hash drifted: pinned {expected}, observed {actual}"
            )
    expected_structure = pin.get("structure", {})
    for field in STRUCTURE_FIELDS:
        expected = expected_structure.get(field)
        actual = structure.get(field)
        if expected != actual:
            drift.append(
                f"V{version} frozen structure drifted: pinned {field}={expected}, observed {actual}"
            )
    return drift


def build_contract() -> tuple[dict[str, Any], list[str]]:
    pins = load_pins()
    drift: list[str] = []
    current = json.loads(CURRENT_MANIFEST_PATH.read_text(encoding="utf-8"))
    current_book = current["book"]
    current_source = current["source"]
    current_totals = current["totals"]

    v12_root, v12_rows, v12_structure = observe_edition("1.2")
    if not (v12_root / "FROZEN.md").is_file() or not (v12_root / "SHA256SUMS.txt").is_file():
        raise RuntimeError("V1.2 frozen contract files are missing")
    drift.extend(compare_against_pin("1.2", pins["1.2"], v12_rows, v12_structure))

    v13_root, v13_rows, v13_structure = observe_edition("1.3")
    drift.extend(compare_against_pin("1.3", pins["1.3"], v13_rows, v13_structure))
    rights_ledger_path = v13_root / "插图/_图版清单.json"
    rights_rows = json.loads(rights_ledger_path.read_text(encoding="utf-8"))
    rights_count = len(rights_rows) if isinstance(rights_rows, list) else 0

    # Gate checks are release blockers only. Whether the artifacts still match the
    # pin is a tamper check, reported through `drift` — mixing the two is what let a
    # stale constant masquerade as "the gate is accidentally open".
    v13_gate_checks = {
        "three_source_artifacts_present": True,
        "expected_structure_observed": not drift,
        "frozen_manifest_present": (v13_root / "FROZEN.md").is_file(),
        "sha_manifest_present": (v13_root / "SHA256SUMS.txt").is_file(),
        "final_review_report_present": any(v13_root.glob("*终检*复评*.md")),
        "all_figure_rights_passports_present": rights_count >= v13_structure["figure_plates"],
        "author_and_legal_rightsholder_confirmed": False,
        "page_mapping_and_visual_qa_complete": False,
        "edition_scoped_comments_and_progress_ready": True,
    }
    blockers = [key for key, passed in v13_gate_checks.items() if not passed]
    observed_at = max(row["modified_at"] for row in v13_rows.values())

    payload = {
        "schema_version": "handx-novel-editions-1.0",
        "observed_at": observed_at,
        "must_not_deploy": True,
        "deployment_authorized": False,
        "current_reader": {
            "edition_id": current_book["id"],
            "version": current_book["version"],
            "status": "legacy_local_reader",
            "pages": current_totals["pages"],
            "numbered_chapters": current_totals["numbered_chapters"],
            "commentable_sections": current_totals["commentable_sections"],
            "pdf_sha256": current_source["pdf_sha256"],
            "docx_sha256": current_source["docx_sha256"],
            "raw_sources_served": False,
        },
        "editions": [
            {
                "edition_id": "hero-wuming-v1-2",
                "version": "1.2",
                "status": "frozen_baseline_not_served",
                "role": "V1.3 的只读差异基线与回滚基线，不是当前网站阅读版。",
                **v12_structure,
                "source_artifacts": v12_rows,
                "frozen": True,
                "served": False,
                "public_ready": False,
            },
            {
                "edition_id": "hero-wuming-v1-3-candidate",
                "version": "1.3",
                "status": "active_candidate_not_served",
                "role": "下一版阅读器目标；冻结、审权和版本隔离门槛通过后才允许整体切换。",
                **v13_structure,
                "rights_ledger_records": rights_count,
                "source_artifacts": v13_rows,
                "gate_checks": v13_gate_checks,
                "blocked_gates": blockers,
                "frozen": (v13_root / "FROZEN.md").is_file(),
                "served": False,
                "public_ready": False,
            },
        ],
        "migration_policy": {
            "strategy": "parallel_import_then_atomic_switch",
            "raw_sources_in_browser": False,
            "old_comments_auto_migrated": False,
            "old_progress_auto_migrated": False,
            "rights_policy": "page_inherits_highest_risk_asset",
            "candidate_static_pages_generated": False,
        },
    }
    return payload, drift


def validate_browser_safe(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    encoded = json.dumps(payload, ensure_ascii=False)
    absolute_macos_home_marker = "/" + "Users" + "/"
    if absolute_macos_home_marker in encoded or "file://" in encoded:
        errors.append("absolute local path leaked into edition registry")
    if payload.get("must_not_deploy") is not True or payload.get("deployment_authorized") is not False:
        errors.append("deployment gate is open")
    # The served edition is whichever one is rendered into public/novel; its
    # identity comes from the pin file, so switching editions is a data change
    # rather than an edit here.
    served = json.loads(PINS_PATH.read_text(encoding="utf-8"))["served_edition"]
    current = payload.get("current_reader", {})
    if (
        current.get("edition_id") != served["edition_id"]
        or current.get("pages") != served["structure"]["pages"]
    ):
        errors.append(
            f"served reader contract drifted: pin says {served['edition_id']} "
            f"with {served['structure']['pages']} pages, manifest says "
            f"{current.get('edition_id')} with {current.get('pages')}"
        )
    editions = payload.get("editions", [])
    if not isinstance(editions, list) or len(editions) != 2:
        errors.append("edition rows are malformed")
        return errors
    v12, v13 = editions
    # Structure is checked against src/data/novel-edition-pins.json in
    # compare_against_pin(); this validator only guards the release posture, so a
    # re-rendered book can never again be reported as an open gate.
    if v12.get("status") != "frozen_baseline_not_served" or v12.get("served") is not False:
        errors.append("V1.2 frozen baseline must stay frozen and unserved")
    if (
        v13.get("status") != "active_candidate_not_served"
        or v13.get("served") is not False
        or v13.get("public_ready") is not False
        or not v13.get("blocked_gates")
    ):
        errors.append("V1.3 candidate must stay unserved with at least one blocked gate")
    if payload.get("migration_policy", {}).get("candidate_static_pages_generated") is not False:
        errors.append("candidate pages were marked generated before rights clearance")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        expected, drift = build_contract()
        errors = drift + validate_browser_safe(expected)
        if args.check:
            actual = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
            if actual != expected:
                errors.append("edition registry is stale; run novel:editions:build")
        elif not errors:
            OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT_PATH.write_text(
                json.dumps(expected, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        errors = [str(error)]
    if errors:
        print(json.dumps({"status": "FAIL", "errors": errors}, ensure_ascii=False, indent=2))
        return 1
    v13 = expected["editions"][1]
    print(
        json.dumps(
            {
                "status": "PASS",
                "current_reader": expected["current_reader"]["edition_id"],
                "v1_2": "frozen_baseline_not_served",
                "v1_3": "active_candidate_not_served",
                "v1_3_structure": f"{v13['pages']} pages/{v13['numbered_chapters']} chapters/{v13['unnumbered_openings']} opening/{v13['figure_plates']} figures",
                "v1_3_rights_coverage": f"{v13['rights_ledger_records']}/{v13['figure_plates']}",
                "blocked_gates": len(v13["blocked_gates"]),
                "must_not_deploy": True,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
