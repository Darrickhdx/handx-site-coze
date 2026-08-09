#!/usr/bin/env python3
"""Render one novel edition into watermarked page assets and a reader manifest.

Supersedes build_novel_assets.py, which hardcoded V0.3's chapter titles and page
starts as literal arrays. Here the section table is derived from the PDF outline
and cross-checked against the edition's chapter markdown, so a re-rendered book
cannot silently desynchronise the reader's page anchors.

Rendering uses PyMuPDF rather than pdftoppm: poppler is not present on this
machine, and PyMuPDF is a wheel with no system dependency. The watermark and
responsive derivation come from novel_render, extracted unchanged from the old
builder so the mark on a reader's page is byte-for-byte the reviewed one.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from novel_render import (  # noqa: E402
    WATERMARK,
    build_responsive_page,
    resolve_font,
    watermark_page,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PINS_PATH = PROJECT_ROOT / "src/data/novel-edition-pins.json"
RENDER_DPI = 220

CHINESE_DIGITS = "零一二三四五六七八九"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def chinese_to_int(text: str) -> int | None:
    """Parse 一 / 十二 / 二十 / 三十六 into an int."""
    if not text:
        return None
    if "十" not in text:
        return CHINESE_DIGITS.index(text) if text in CHINESE_DIGITS else None
    head, _, tail = text.partition("十")
    tens = CHINESE_DIGITS.index(head) if head else 1
    ones = CHINESE_DIGITS.index(tail) if tail else 0
    return tens * 10 + ones


def normalise_title(text: str) -> str:
    """Collapse the separators that differ between filenames and PDF bookmarks."""
    text = text.replace("_", " ").replace("・", "·")
    return re.sub(r"\s+", "", text).strip()


def chapter_titles_from_markdown(chapters_dir: Path) -> list[str]:
    """Titles in reading order, from the chapter filenames.

    The leading file is the book title page; it carries no bookmark, so it is
    dropped here and represented as frontmatter in the section table.
    """
    files = sorted(p for p in chapters_dir.glob("*.md") if not p.name.startswith("_"))
    if not files:
        raise SystemExit(f"no chapter markdown found in {chapters_dir}")
    return [re.sub(r"^\d+-", "", path.stem) for path in files[1:]]


def build_sections(doc: pymupdf.Document, chapters_dir: Path) -> list[dict[str, Any]]:
    """Derive the section table from the PDF outline.

    Only level-1 entries and the level-2 chapters under a part are sections; the
    appendix's own level-2/3 subsections stay inside the appendix section.
    """
    toc = doc.get_toc()
    if not toc:
        raise SystemExit("PDF has no outline; the section table cannot be derived")

    entries: list[tuple[int, str, int]] = []
    in_appendix = False
    for level, title, page in toc:
        if level == 1:
            in_appendix = "附录" in title
            entries.append((level, title, page))
        elif level == 2 and not in_appendix:
            entries.append((level, title, page))

    expected = chapter_titles_from_markdown(chapters_dir)
    observed = [title for _, title, _ in entries]
    if len(expected) != len(observed):
        raise SystemExit(
            f"outline has {len(observed)} sections but {len(expected)} chapter files exist"
        )
    for index, (want, got) in enumerate(zip(expected, observed)):
        if normalise_title(want) != normalise_title(got):
            raise SystemExit(
                f"section {index + 1} mismatch: markdown {want!r} vs outline {got!r}"
            )

    page_count = doc.page_count
    rows: list[dict[str, Any]] = []
    first_page = entries[0][2]
    if first_page > 1:
        rows.append(
            _section("frontmatter", "frontmatter", "封面与卷首", "frontmatter", 1, first_page - 1)
        )

    part_number = 0
    for index, (level, title, start) in enumerate(entries):
        end = entries[index + 1][2] - 1 if index + 1 < len(entries) else page_count
        if end < start:
            raise SystemExit(f"section {title!r} has an empty page range")
        chapter_match = re.match(r"第([一二三四五六七八九十]+)章", title)
        part_match = re.match(r"第([一二三四五六七八九十]+)部", title)

        if part_match:
            part_number = chinese_to_int(part_match.group(1)) or part_number + 1
            rows.append(
                _section(
                    f"part-{part_number}", f"part-{part_number}", title, "part",
                    start, end, part=part_number,
                )
            )
        elif chapter_match:
            number = chinese_to_int(chapter_match.group(1))
            if number is None:
                raise SystemExit(f"cannot parse chapter number from {title!r}")
            rows.append(
                _section(
                    f"chapter-{number:02d}", f"chapter-{number:02d}", title, "chapter",
                    start, end, commentable=True, part=part_number or None,
                    chapter_number=number,
                )
            )
        else:
            # 前言 / 楔子 / 序章 / 尾声 / 后记 / 附录. The narrative ones are
            # commentable; the appendix is reference matter.
            slug = _slug_for(title)
            kind = "paratext" if ("附录" in title or "前言" in title) else "chapter"
            rows.append(
                _section(
                    slug, slug, title, kind, start, end,
                    commentable=kind == "chapter",
                )
            )

    for order, row in enumerate(rows):
        row["order"] = order
    return rows


SLUGS = {
    "前言": "preface",
    "楔子": "prologue",
    "序章": "opening",
    "尾声": "epilogue",
    "后记": "afterword",
    "附录": "appendix",
}


def _slug_for(title: str) -> str:
    for marker, slug in SLUGS.items():
        if title.startswith(marker):
            return slug
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "section"


def _section(
    section_id: str, slug: str, title: str, kind: str, start_page: int, end_page: int,
    *, commentable: bool = False, part: int | None = None,
    chapter_number: int | None = None,
) -> dict[str, Any]:
    return {
        "id": section_id,
        "slug": slug,
        "title": title,
        "kind": kind,
        "order": 0,
        "part": part,
        "chapter_number": chapter_number,
        "start_page": start_page,
        "end_page": end_page,
        "page_count": end_page - start_page + 1,
        "commentable": commentable,
        "summary": f"《英雄无名》{title}，对应水印页图第 {start_page}—{end_page} 页。",
    }


def load_served_pin(version: str) -> dict[str, Any]:
    pins = json.loads(PINS_PATH.read_text(encoding="utf-8"))
    served = pins.get("served_edition")
    if not served:
        raise SystemExit("novel-edition-pins.json has no served_edition block")
    if served.get("version") != version:
        raise SystemExit(
            f"served_edition pin is V{served.get('version')} but V{version} was requested; "
            "update src/data/novel-edition-pins.json deliberately"
        )
    return served


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="1.5")
    parser.add_argument("--book-root", type=Path, default=None)
    parser.add_argument("--output", type=Path, default=PROJECT_ROOT / "public/novel/hero-wuming")
    parser.add_argument("--font")
    parser.add_argument("--limit", type=int, default=0, help="render only the first N pages (smoke)")
    args = parser.parse_args()

    version = args.version
    served = load_served_pin(version)
    book_root = (args.book_root or (PROJECT_ROOT / "../../../AI小说/成书/出版版")).resolve() / f"V{version}"
    pdf_path = book_root / f"英雄无名V{version}-印刷版.pdf"
    docx_path = book_root / f"英雄无名V{version}-可编辑.docx"
    chapters_dir = book_root / "章节"

    for path in (pdf_path, docx_path, chapters_dir):
        if not path.exists():
            raise SystemExit(f"missing source: {path}")

    pdf_sha = sha256_file(pdf_path)
    docx_sha = sha256_file(docx_path)
    if pdf_sha != served["sha256"]["pdf"]:
        raise SystemExit(f"V{version} PDF drifted from the pin: observed {pdf_sha}")
    if docx_sha != served["sha256"]["docx"]:
        raise SystemExit(f"V{version} DOCX drifted from the pin: observed {docx_sha}")

    doc = pymupdf.open(str(pdf_path))
    page_count = doc.page_count
    if page_count != served["structure"]["pages"]:
        raise SystemExit(
            f"V{version} has {page_count} pages but the pin says {served['structure']['pages']}"
        )

    sections = build_sections(doc, chapters_dir)

    page_to_section: dict[int, str] = {}
    for row in sections:
        for number in range(row["start_page"], row["end_page"] + 1):
            if number in page_to_section:
                raise SystemExit(f"page {number} belongs to more than one section")
            page_to_section[number] = row["id"]
    if set(page_to_section) != set(range(1, page_count + 1)):
        missing = sorted(set(range(1, page_count + 1)) - set(page_to_section))
        raise SystemExit(f"sections do not cover every page; missing {missing[:10]}")

    numbered = sum(1 for row in sections if row["chapter_number"] is not None)
    if numbered != served["structure"]["numbered_chapters"]:
        raise SystemExit(
            f"derived {numbered} numbered chapters, pin says {served['structure']['numbered_chapters']}"
        )

    output_root = args.output.resolve()
    pages_root = output_root / "pages"
    responsive_root = output_root / "pages-responsive"
    for directory in (pages_root, responsive_root):
        directory.mkdir(parents=True, exist_ok=True)
        for stale in directory.glob("page-*.webp"):
            stale.unlink()

    font_path = resolve_font(args.font)
    last_page = min(args.limit, page_count) if args.limit else page_count
    page_rows: list[dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="handx-novel-render-") as temp_directory:
        temp_root = Path(temp_directory)
        for number in range(1, last_page + 1):
            raw = temp_root / f"page-{number:03d}.png"
            doc[number - 1].get_pixmap(dpi=RENDER_DPI).save(str(raw))
            full = pages_root / f"page-{number:03d}.webp"
            responsive = responsive_root / f"page-{number:03d}.webp"
            width, height = watermark_page(raw, full, font_path)
            responsive_width, responsive_height = build_responsive_page(full, responsive)
            raw.unlink()
            page_rows.append(
                {
                    "number": number,
                    "section_id": page_to_section[number],
                    "path": f"/novel/hero-wuming/pages/{full.name}",
                    "sha256": sha256_file(full),
                    "byte_size": full.stat().st_size,
                    "width": width,
                    "height": height,
                    "responsive_path": f"/novel/hero-wuming/pages-responsive/{responsive.name}",
                    "responsive_sha256": sha256_file(responsive),
                    "responsive_byte_size": responsive.stat().st_size,
                    "responsive_width": responsive_width,
                    "responsive_height": responsive_height,
                    "watermark": WATERMARK,
                    "rights_status": "author_watermarked_derivative",
                    "local_only": False,
                    "git_eligible": True,
                    "not_for_media": False,
                }
            )
            if number % 50 == 0:
                print(f"  rendered {number}/{last_page}", flush=True)

    manifest = {
        "schema_version": "handx-novel-manifest-1.0",
        "project": "Handx web0.1",
        "book": {
            "id": served["edition_id"],
            "title": "英雄无名",
            "subtitle": "我的曾外祖父苏开元",
            "author": "韩大昕",
            "work_type": "纪实性历史小说",
            "edition": served["edition_label"],
            "version": version,
        },
        "source": {
            "pdf_sha256": pdf_sha,
            "docx_sha256": docx_sha,
            "pdf_page_count": page_count,
            "raw_sources_served": False,
            "chapter_titles_verified_against_docx": True,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "must_not_deploy": True,
        "deployment_authorized": False,
        "publication_status": "local_review",
        "rights": {
            "text_owner": "韩大昕",
            "license": "no-license-granted",
            "watermark": WATERMARK,
            "notice": "水印只提高复制成本，不能阻止截图、抓包或OCR。",
            "local_only_image_pages": [],
            "local_only_reason": "本版不保留仅本机页；图版权利处理见图版清单。",
        },
        "totals": {
            "pages": len(page_rows),
            "sections": len(sections),
            "numbered_chapters": numbered,
            "commentable_sections": sum(1 for row in sections if row["commentable"]),
            "local_only_pages": 0,
        },
        "sections": sections,
        "pages": page_rows,
        "output": {
            "root": "/novel/hero-wuming",
            "format": "webp",
            "long_edge_pixels": 1800,
            "responsive_width_pixels": 760,
            "watermark_is_pixel_layer": True,
            "manifest_path": "/novel/hero-wuming/novel-manifest.json",
        },
    }
    (output_root / "novel-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "status": "PASS",
                "edition": served["edition_id"],
                "pages": len(page_rows),
                "sections": len(sections),
                "numbered_chapters": numbered,
                "commentable_sections": manifest["totals"]["commentable_sections"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
