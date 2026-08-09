#!/usr/bin/env python3
"""Verify the complete local Handx novel manifest and watermarked page set."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROJECT_ROOT / "public/novel/hero-wuming/novel-manifest.json"
PINS_PATH = PROJECT_ROOT / "src/data/novel-edition-pins.json"
EXPECTED_WATERMARK = "© 韩大昕｜鉴真小秃驴 · 仅供本站阅读"


def load_served_pin() -> dict[str, Any]:
    """Expected source hashes and structure for whichever edition is rendered.

    Held in src/data/novel-edition-pins.json rather than written here, so that
    rendering a different edition is a reviewable data change instead of an edit
    to this verifier. Previously these were literals for V0.3 and would report a
    defect the moment the served edition changed.
    """
    pins = json.loads(PINS_PATH.read_text(encoding="utf-8"))
    served = pins.get("served_edition")
    if not isinstance(served, dict):
        raise SystemExit("novel-edition-pins.json has no served_edition block")
    return served


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def main() -> int:
    errors: list[str] = []
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"FAIL novel manifest unreadable: {error}")
        return 1

    served = load_served_pin()
    expected_pdf_sha = served["sha256"]["pdf"]
    expected_docx_sha = served["sha256"]["docx"]
    expected_pages = served["structure"]["pages"]
    expected_chapters = served["structure"]["numbered_chapters"]
    expected_local_only = set(served.get("local_only_image_pages", []))
    expected_commentable = served["structure"]["commentable_sections"]
    expected_width = served["structure"]["page_width"]
    expected_height = served["structure"]["page_height"]
    expected_responsive_width = served["structure"]["responsive_width"]
    expected_responsive_height = served["structure"]["responsive_height"]

    require(manifest.get("schema_version") == "handx-novel-manifest-1.0", "wrong schema", errors)
    require(manifest.get("project") == "Handx web0.1", "wrong project", errors)
    require(manifest.get("must_not_deploy") is True, "must_not_deploy is not true", errors)
    require(
        manifest.get("deployment_authorized") is False,
        "deployment_authorized is not false",
        errors,
    )
    require(manifest.get("publication_status") == "local_review", "not local_review", errors)

    source = as_dict(manifest.get("source"))
    require(source.get("pdf_sha256") == expected_pdf_sha, "PDF SHA changed", errors)
    require(source.get("docx_sha256") == expected_docx_sha, "DOCX SHA changed", errors)
    require(
        source.get("pdf_page_count") == expected_pages,
        f"PDF page count is not {expected_pages}",
        errors,
    )
    require(source.get("raw_sources_served") is False, "raw source marked served", errors)
    require(
        source.get("chapter_titles_verified_against_docx") is True,
        "DOCX title verification missing",
        errors,
    )

    rights = as_dict(manifest.get("rights"))
    require(rights.get("license") == "no-license-granted", "novel license is open", errors)
    require(rights.get("watermark") == EXPECTED_WATERMARK, "watermark text changed", errors)
    require(
        set(rights.get("local_only_image_pages", [])) == expected_local_only,
        "local-only image pages changed",
        errors,
    )

    sections = manifest.get("sections", [])
    pages = manifest.get("pages", [])
    require(isinstance(sections, list), "sections is not a list", errors)
    require(isinstance(pages, list), "pages is not a list", errors)
    if not isinstance(sections, list) or not isinstance(pages, list):
        print("\n".join(f"FAIL {error}" for error in errors))
        return 1

    section_ids: set[str] = set()
    slugs: set[str] = set()
    assigned: list[int] = []
    numbered = 0
    commentable = 0
    for row in sections:
        require(isinstance(row, dict), "section row is not an object", errors)
        if not isinstance(row, dict):
            continue
        section_id = str(row.get("id", ""))
        slug = str(row.get("slug", ""))
        require(section_id not in section_ids and bool(section_id), f"duplicate section {section_id}", errors)
        require(slug not in slugs and bool(slug), f"duplicate slug {slug}", errors)
        section_ids.add(section_id)
        slugs.add(slug)
        start = row.get("start_page")
        end = row.get("end_page")
        require(isinstance(start, int) and isinstance(end, int), f"{section_id}: invalid range", errors)
        if isinstance(start, int) and isinstance(end, int):
            require(1 <= start <= end <= expected_pages, f"{section_id}: range outside book", errors)
            assigned.extend(range(start, end + 1))
            require(row.get("page_count") == end - start + 1, f"{section_id}: wrong page_count", errors)
        if isinstance(row.get("chapter_number"), int):
            numbered += 1
        if row.get("commentable") is True:
            commentable += 1
            require(
                row.get("kind") == "chapter",
                f"{section_id}: non-chapter comment area",
                errors,
            )
    require(
        sorted(assigned) == list(range(1, expected_pages + 1)),
        "pages are missing, repeated, or out of order",
        errors,
    )
    require(
        numbered == expected_chapters,
        f"numbered chapter count is {numbered}, pin says {expected_chapters}",
        errors,
    )
    require(
        commentable == expected_commentable,
        f"commentable section count is {commentable}, pin says {expected_commentable}",
        errors,
    )

    seen_pages: set[int] = set()
    local_only: set[int] = set()
    total_bytes = 0
    total_responsive_bytes = 0
    for row in pages:
        require(isinstance(row, dict), "page row is not an object", errors)
        if not isinstance(row, dict):
            continue
        number = row.get("number")
        require(isinstance(number, int), "page number is invalid", errors)
        if not isinstance(number, int):
            continue
        require(number not in seen_pages, f"duplicate page {number}", errors)
        seen_pages.add(number)
        path = str(row.get("path", ""))
        expected_path = f"/novel/hero-wuming/pages/page-{number:03d}.webp"
        require(path == expected_path, f"page {number}: unstable path", errors)
        require(row.get("section_id") in section_ids, f"page {number}: missing section", errors)
        require(row.get("watermark") == EXPECTED_WATERMARK, f"page {number}: wrong watermark", errors)
        require(
            row.get("width") == expected_width and row.get("height") == expected_height,
            f"page {number}: wrong dimensions",
            errors,
        )
        require(re.fullmatch(r"[0-9a-f]{64}", str(row.get("sha256", ""))) is not None, f"page {number}: bad SHA", errors)
        page_path = PROJECT_ROOT / "public" / path.lstrip("/")
        require(page_path.is_file(), f"page {number}: asset missing", errors)
        if page_path.is_file():
            actual_sha = sha256_file(page_path)
            require(actual_sha == row.get("sha256"), f"page {number}: SHA mismatch", errors)
            require(page_path.suffix.lower() == ".webp", f"page {number}: wrong format", errors)
            size = page_path.stat().st_size
            total_bytes += size
            require(size == row.get("byte_size"), f"page {number}: byte count mismatch", errors)
            require(size < 450_000, f"page {number}: exceeds 450 KB target", errors)
        responsive_path = str(row.get("responsive_path", ""))
        expected_responsive_path = (
            f"/novel/hero-wuming/pages-responsive/page-{number:03d}.webp"
        )
        require(
            responsive_path == expected_responsive_path,
            f"page {number}: unstable responsive path",
            errors,
        )
        require(
            row.get("responsive_width") == expected_responsive_width
            and row.get("responsive_height") == expected_responsive_height,
            f"page {number}: wrong responsive dimensions",
            errors,
        )
        require(
            re.fullmatch(r"[0-9a-f]{64}", str(row.get("responsive_sha256", "")))
            is not None,
            f"page {number}: bad responsive SHA",
            errors,
        )
        responsive_page_path = PROJECT_ROOT / "public" / responsive_path.lstrip("/")
        require(
            responsive_page_path.is_file(),
            f"page {number}: responsive asset missing",
            errors,
        )
        if responsive_page_path.is_file():
            actual_responsive_sha = sha256_file(responsive_page_path)
            require(
                actual_responsive_sha == row.get("responsive_sha256"),
                f"page {number}: responsive SHA mismatch",
                errors,
            )
            responsive_size = responsive_page_path.stat().st_size
            total_responsive_bytes += responsive_size
            require(
                responsive_size == row.get("responsive_byte_size"),
                f"page {number}: responsive byte count mismatch",
                errors,
            )
            require(
                responsive_size < 250_000,
                f"page {number}: responsive asset exceeds 250 KB",
                errors,
            )
        if row.get("local_only") is True:
            local_only.add(number)
            require(row.get("git_eligible") is False, f"page {number}: local-only Git eligible", errors)
            require(row.get("not_for_media") is True, f"page {number}: local-only media eligible", errors)
            require(
                row.get("rights_status") == "local_only_third_party_review",
                f"page {number}: wrong local-only rights",
                errors,
            )
        else:
            require(row.get("git_eligible") is True, f"page {number}: Git flag mismatch", errors)
            require(row.get("not_for_media") is False, f"page {number}: media flag mismatch", errors)
            require(
                row.get("rights_status") == "author_watermarked_derivative",
                f"page {number}: wrong derivative rights",
                errors,
            )
    require(
        seen_pages == set(range(1, expected_pages + 1)),
        f"manifest does not contain {expected_pages} unique pages",
        errors,
    )
    require(local_only == expected_local_only, "page-level local-only set changed", errors)

    public_root = PROJECT_ROOT / "public"
    raw_sources = [
        path
        for path in public_root.rglob("*")
        if path.is_file() and path.suffix.lower() in {".pdf", ".docx", ".doc", ".odt"}
    ]
    require(not raw_sources, f"raw novel/document source is public: {raw_sources}", errors)

    if errors:
        print("\n".join(f"FAIL {error}" for error in errors))
        return 1
    print(
        "novel assets verified:",
        f"pages={expected_pages}",
        f"chapters={expected_chapters}",
        f"commentable={commentable}",
        f"bytes={total_bytes}",
        f"responsive_bytes={total_responsive_bytes}",
        "raw_sources=0",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
