#!/usr/bin/env python3
"""Build or verify the browser-safe novel edition and migration contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BOOK_ROOT = (PROJECT_ROOT / "../../../AI小说/成书/出版版").resolve()
OUTPUT_PATH = PROJECT_ROOT / "src/data/novel-editions.json"
CURRENT_MANIFEST_PATH = PROJECT_ROOT / "public/novel/hero-wuming/novel-manifest.json"
V12_EXPECTED_HASHES = {
    "markdown": "b853bad3901207643356253c5c026bf3b0ccb74d95919cebe68e5bdd7a59a51e",
    "pdf": "9a252ca53a38d950056f2965fbaebda18b037e3ed976679032d375ad5fcadc43",
    "docx": "1ff7b58669aa05257673b7c521664fdbb8e7c9ce5c2502d3061c8d68cc5a6f7e",
}


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


def build_contract() -> dict[str, Any]:
    current = json.loads(CURRENT_MANIFEST_PATH.read_text(encoding="utf-8"))
    current_book = current["book"]
    current_source = current["source"]
    current_totals = current["totals"]

    v12_root = BOOK_ROOT / "V1.2"
    v12_paths = {
        "markdown": v12_root / "英雄无名V1.2-可审阅.md",
        "pdf": v12_root / "英雄无名V1.2-印刷版.pdf",
        "docx": v12_root / "英雄无名V1.2-可编辑.docx",
    }
    v12_rows = {key: source_row(path) for key, path in v12_paths.items()}
    for key, expected in V12_EXPECTED_HASHES.items():
        actual = v12_rows[key]["sha256"]
        if actual != expected:
            raise RuntimeError(f"V1.2 frozen {key} hash changed: {actual}")
    if not (v12_root / "FROZEN.md").is_file() or not (v12_root / "SHA256SUMS.txt").is_file():
        raise RuntimeError("V1.2 frozen contract files are missing")
    v12_pages = len(PdfReader(str(v12_paths["pdf"])).pages)
    v12_chapters, v12_openings, v12_figures = count_markdown_structure(v12_paths["markdown"])

    v13_root = BOOK_ROOT / "V1.3"
    v13_paths = {
        "markdown": v13_root / "英雄无名V1.3-可审阅.md",
        "pdf": v13_root / "英雄无名V1.3-印刷版.pdf",
        "docx": v13_root / "英雄无名V1.3-可编辑.docx",
    }
    if not all(path.is_file() for path in v13_paths.values()):
        raise RuntimeError("V1.3 candidate is missing one or more source artifacts")
    v13_rows = {key: source_row(path) for key, path in v13_paths.items()}
    v13_pages = len(PdfReader(str(v13_paths["pdf"])).pages)
    v13_chapters, v13_openings, v13_figures = count_markdown_structure(v13_paths["markdown"])
    rights_ledger_path = v13_root / "插图/_图版清单.json"
    rights_rows = json.loads(rights_ledger_path.read_text(encoding="utf-8"))
    rights_count = len(rights_rows) if isinstance(rights_rows, list) else 0

    v13_gate_checks = {
        "three_source_artifacts_present": True,
        "expected_structure_observed": (
            v13_pages == 519
            and v13_chapters == 35
            and v13_openings == 1
            and v13_figures == 47
        ),
        "frozen_manifest_present": (v13_root / "FROZEN.md").is_file(),
        "sha_manifest_present": (v13_root / "SHA256SUMS.txt").is_file(),
        "final_review_report_present": any(v13_root.glob("*终检*复评*.md")),
        "all_figure_rights_passports_present": rights_count >= v13_figures,
        "author_and_legal_rightsholder_confirmed": False,
        "page_mapping_and_visual_qa_complete": False,
        "edition_scoped_comments_and_progress_ready": True,
    }
    blockers = [key for key, passed in v13_gate_checks.items() if not passed]
    observed_at = max(row["modified_at"] for row in v13_rows.values())

    return {
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
                "pages": v12_pages,
                "numbered_chapters": v12_chapters,
                "unnumbered_openings": v12_openings,
                "figure_plates": v12_figures,
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
                "pages": v13_pages,
                "numbered_chapters": v13_chapters,
                "unnumbered_openings": v13_openings,
                "figure_plates": v13_figures,
                "rights_ledger_records": rights_count,
                "source_artifacts": v13_rows,
                "gate_checks": v13_gate_checks,
                "blocked_gates": blockers,
                "frozen": False,
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


def validate_browser_safe(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    encoded = json.dumps(payload, ensure_ascii=False)
    absolute_macos_home_marker = "/" + "Users" + "/"
    if absolute_macos_home_marker in encoded or "file://" in encoded:
        errors.append("absolute local path leaked into edition registry")
    if payload.get("must_not_deploy") is not True or payload.get("deployment_authorized") is not False:
        errors.append("deployment gate is open")
    current = payload.get("current_reader", {})
    if current.get("edition_id") != "hero-wuming-v0-3" or current.get("pages") != 182:
        errors.append("current V0.3 reader contract changed unexpectedly")
    editions = payload.get("editions", [])
    if not isinstance(editions, list) or len(editions) != 2:
        errors.append("edition rows are malformed")
        return errors
    v12, v13 = editions
    if (
        v12.get("status") != "frozen_baseline_not_served"
        or v12.get("pages") != 539
        or v12.get("numbered_chapters") != 35
        or v12.get("served") is not False
    ):
        errors.append("V1.2 frozen baseline contract is malformed")
    if (
        v13.get("status") != "active_candidate_not_served"
        or v13.get("pages") != 519
        or v13.get("numbered_chapters") != 35
        or v13.get("unnumbered_openings") != 1
        or v13.get("figure_plates") != 47
        or v13.get("served") is not False
        or not v13.get("blocked_gates")
    ):
        errors.append("V1.3 candidate gate is malformed or accidentally open")
    if payload.get("migration_policy", {}).get("candidate_static_pages_generated") is not False:
        errors.append("candidate pages were marked generated before rights clearance")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        expected = build_contract()
        errors = validate_browser_safe(expected)
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
