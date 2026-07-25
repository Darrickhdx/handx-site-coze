#!/usr/bin/env python3
"""Build Handx web0.1's local-only, watermarked novel page assets."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from docx import Document
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader


PDF_SHA256 = "3913ae458296646e3151ab9ad2b6646a7104cfe538a80e095b6563fef652d152"
DOCX_SHA256 = "4d72bb26a15a45a95ca7f21795a4365db057fac06025b4fc7b4b330fa9ba1b09"
PAGE_COUNT = 182
WATERMARK = "© 韩大昕｜鉴真小秃驴 · 仅供本站阅读"
LOCAL_ONLY_IMAGE_PAGES = {6, 14, 22, 28, 47, 116, 177}
RESPONSIVE_WIDTH = 760
RESPONSIVE_QUALITY = 74

CHAPTER_TITLES = [
    "有名",
    "老师",
    "小河沿",
    "举旗",
    "投傅",
    "怀柔",
    "五个民族英雄",
    "没有名字的屋子",
    "保德",
    "太太团",
    "游击司令",
    "放乔",
    "自行车",
    "化装",
    "救她",
    "延安",
    "回蒙",
    "你听我的消息吧",
    "同一张桌子",
    "抚慰金",
    "剿总",
    "抬棺",
    "一同倾覆",
    "围城",
    "一角城门",
    "好觉",
    "不南下",
    "破案不能认领",
    "恩人",
    "亏欠",
    "揩干净",
    "无名",
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def section(
    section_id: str,
    slug: str,
    title: str,
    kind: str,
    start_page: int,
    end_page: int,
    *,
    commentable: bool = False,
    part: int | None = None,
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


def build_sections() -> list[dict[str, Any]]:
    rows = [
        section("frontmatter", "frontmatter", "封面、版权与卷首图", "frontmatter", 1, 6),
        section("preface", "preface", "前言 · 作者的话", "paratext", 7, 8),
        section("contents", "contents", "目录", "paratext", 9, 11),
        section("prologue", "prologue", "楔子 · 搜索框里的名字", "chapter", 12, 18, commentable=True),
        section("part-1", "part-1", "第一部 · 有名", "part", 19, 19, part=1),
    ]
    starts = [
        20, 27, 32, 36, 46, 52, 58, 65,
        70, 74, 80, 84, 88, 92, 95, 99, 103,
        108, 111, 115, 119, 125, 131, 139, 144, 148,
        152, 154, 157, 160, 163, 167,
    ]
    boundaries = {
        8: (69, "第二部 · 潜行"),
        17: (107, "第三部 · 虎穴"),
        26: (151, "第四部 · 无名"),
    }
    part = 1
    for index, (title, start_page) in enumerate(zip(CHAPTER_TITLES, starts), start=1):
        if index - 1 in boundaries:
            divider_page, divider_title = boundaries[index - 1]
            part += 1
            rows.append(
                section(
                    f"part-{part}",
                    f"part-{part}",
                    divider_title,
                    "part",
                    divider_page,
                    divider_page,
                    part=part,
                )
            )
        if index < len(starts):
            next_start = starts[index]
            end_page = next_start - 1
            if index in boundaries:
                end_page = boundaries[index][0] - 1
        else:
            end_page = 170
        rows.append(
            section(
                f"chapter-{index:02d}",
                f"chapter-{index:02d}",
                f"第{to_chinese_number(index)}章 · {title}",
                "chapter",
                start_page,
                end_page,
                commentable=True,
                part=part,
                chapter_number=index,
            )
        )
    rows.extend(
        [
            section("epilogue", "epilogue", "尾声 · 认出他", "chapter", 171, 175, commentable=True),
            section("afterword", "afterword", "后记 · 曾孙的话", "paratext", 176, 179),
            section("references", "references", "主要史料与参考资料", "paratext", 180, 181),
            section("image-credits", "image-credits", "图版与图片来源说明", "paratext", 182, 182),
        ]
    )
    for order, row in enumerate(rows):
        row["order"] = order
    return rows


def to_chinese_number(value: int) -> str:
    units = [
        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八",
        "十九", "二十", "二十一", "二十二", "二十三", "二十四", "二十五",
        "二十六", "二十七", "二十八", "二十九", "三十", "三十一", "三十二",
    ]
    return units[value - 1]


def expected_heading_titles() -> list[str]:
    rows = [
        "前言 · 作者的话",
        "楔子 · 搜索框里的名字",
        "第一部 · 有名",
    ]
    for index, title in enumerate(CHAPTER_TITLES, start=1):
        if index == 9:
            rows.append("第二部 · 潜行")
        elif index == 18:
            rows.append("第三部 · 虎穴")
        elif index == 27:
            rows.append("第四部 · 无名")
        rows.append(f"第{to_chinese_number(index)}章 · {title}")
    rows.extend(
        [
            "尾声 · 认出他",
            "后记 · 曾孙的话",
            "主要史料与参考资料",
            "图版与图片来源说明",
        ]
    )
    return rows


def verify_sources(pdf_path: Path, docx_path: Path) -> None:
    actual_pdf_sha = sha256_file(pdf_path)
    actual_docx_sha = sha256_file(docx_path)
    if actual_pdf_sha != PDF_SHA256:
        raise SystemExit(f"PDF SHA-256 changed: {actual_pdf_sha}")
    if actual_docx_sha != DOCX_SHA256:
        raise SystemExit(f"DOCX SHA-256 changed: {actual_docx_sha}")

    reader = PdfReader(str(pdf_path))
    if len(reader.pages) != PAGE_COUNT:
        raise SystemExit(f"PDF has {len(reader.pages)} pages, expected {PAGE_COUNT}")

    document = Document(str(docx_path))
    headings = [
        " ".join(paragraph.text.split())
        for paragraph in document.paragraphs
        if paragraph.style.name == "Heading 1" and paragraph.text.strip()
    ]
    expected = expected_heading_titles()
    if headings != expected:
        raise SystemExit(
            "DOCX heading sequence changed.\n"
            f"Expected: {expected!r}\n"
            f"Actual:   {headings!r}"
        )


def resolve_pdftoppm() -> Path:
    from_path = shutil.which("pdftoppm")
    if from_path:
        return Path(from_path)
    bundled = Path(sys.executable).resolve().parents[2] / "bin" / "override" / "pdftoppm"
    if bundled.is_file():
        return bundled
    raise SystemExit("pdftoppm is unavailable; load the Codex workspace PDF dependencies.")


def resolve_font(requested: str | None) -> Path:
    candidates = [
        Path(requested) if requested else None,
        Path("/System/Library/Fonts/STHeiti Medium.ttc"),
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate and candidate.is_file():
            return candidate
    raise SystemExit("No font capable of rendering the watermark was found.")


def watermark_page(source: Path, destination: Path, font_path: Path) -> tuple[int, int]:
    with Image.open(source) as opened:
        image = opened.convert("RGB")
    longest = max(image.size)
    if longest > 1800:
        scale = 1800 / longest
        image = image.resize(
            (round(image.width * scale), round(image.height * scale)),
            Image.Resampling.LANCZOS,
        )

    rgba = image.convert("RGBA")
    overlay = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    font_size = max(24, round(max(rgba.size) / 58))
    font = ImageFont.truetype(str(font_path), font_size)
    sample = ImageDraw.Draw(overlay)
    bounds = sample.textbbox((0, 0), WATERMARK, font=font)
    text_width = bounds[2] - bounds[0]
    text_height = bounds[3] - bounds[1]
    tile = Image.new("RGBA", (text_width + 70, text_height + 50), (0, 0, 0, 0))
    tile_draw = ImageDraw.Draw(tile)
    tile_draw.text((35, 20), WATERMARK, font=font, fill=(126, 50, 48, 34))
    rotated = tile.rotate(27, expand=True, resample=Image.Resampling.BICUBIC)
    stride_x = max(rotated.width + 150, rgba.width // 2)
    stride_y = max(rotated.height + 120, rgba.height // 4)
    for y in range(-rotated.height, rgba.height + rotated.height, stride_y):
        offset = -rotated.width // 2 if (y // stride_y) % 2 else 0
        for x in range(-rotated.width + offset, rgba.width + rotated.width, stride_x):
            overlay.alpha_composite(rotated, (x, y))

    footer_font = ImageFont.truetype(str(font_path), max(18, font_size - 4))
    footer_bounds = sample.textbbox((0, 0), WATERMARK, font=footer_font)
    footer_width = footer_bounds[2] - footer_bounds[0]
    footer_height = footer_bounds[3] - footer_bounds[1]
    footer_x = max(18, rgba.width - footer_width - 28)
    footer_y = max(18, rgba.height - footer_height - 24)
    ImageDraw.Draw(overlay).text(
        (footer_x, footer_y),
        WATERMARK,
        font=footer_font,
        fill=(78, 46, 42, 108),
    )
    watermarked = Image.alpha_composite(rgba, overlay).convert("RGB")
    destination.parent.mkdir(parents=True, exist_ok=True)
    watermarked.save(destination, "WEBP", quality=82, method=6)
    return watermarked.size


def build_responsive_page(source: Path, destination: Path) -> tuple[int, int]:
    with Image.open(source) as opened:
        image = opened.convert("RGB")
    width = min(RESPONSIVE_WIDTH, image.width)
    height = round(image.height * width / image.width)
    responsive = image.resize((width, height), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    responsive.save(
        destination,
        "WEBP",
        quality=RESPONSIVE_QUALITY,
        method=6,
    )
    return responsive.size


def build_manifest(
    output_root: Path,
    page_rows: list[dict[str, Any]],
    sections: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "schema_version": "handx-novel-manifest-1.0",
        "project": "Handx web0.1",
        "book": {
            "id": "hero-wuming-v0-3",
            "title": "英雄无名",
            "subtitle": "我的曾外祖父苏开元",
            "author": "韩大昕",
            "work_type": "纪实性历史小说",
            "edition": "V0.3 · 出版式内部审阅版",
            "version": "0.3",
        },
        "source": {
            "pdf_sha256": PDF_SHA256,
            "docx_sha256": DOCX_SHA256,
            "pdf_page_count": PAGE_COUNT,
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
            "local_only_image_pages": sorted(LOCAL_ONLY_IMAGE_PAGES),
            "local_only_reason": "页面含家属影像或尚未闭环的第三方图版，仅保存在本机。",
        },
        "totals": {
            "pages": PAGE_COUNT,
            "sections": len(sections),
            "numbered_chapters": 32,
            "commentable_sections": sum(1 for row in sections if row["commentable"]),
            "local_only_pages": len(LOCAL_ONLY_IMAGE_PAGES),
        },
        "sections": sections,
        "pages": page_rows,
        "output": {
            "root": "/novel/hero-wuming",
            "format": "webp",
            "long_edge_pixels": 1800,
            "responsive_width_pixels": RESPONSIVE_WIDTH,
            "watermark_is_pixel_layer": True,
            "manifest_path": "/novel/hero-wuming/novel-manifest.json",
        },
    }


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    default_source_root = (project_root / "../../../AI小说/成书/出版版").resolve()
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pdf",
        type=Path,
        default=default_source_root / "英雄无名V0.3-出版版.pdf",
    )
    parser.add_argument(
        "--docx",
        type=Path,
        default=default_source_root / "英雄无名V0.3-出版版.docx",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_root / "public/novel/hero-wuming",
    )
    parser.add_argument("--font")
    args = parser.parse_args()

    pdf_path = args.pdf.resolve()
    docx_path = args.docx.resolve()
    output_root = args.output.resolve()
    verify_sources(pdf_path, docx_path)
    sections = build_sections()

    page_to_section: dict[int, str] = {}
    for row in sections:
        for page_number in range(row["start_page"], row["end_page"] + 1):
            if page_number in page_to_section:
                raise SystemExit(f"Page {page_number} belongs to multiple sections")
            page_to_section[page_number] = row["id"]
    if set(page_to_section) != set(range(1, PAGE_COUNT + 1)):
        raise SystemExit("Section ranges do not cover exactly pages 1–182")

    pdftoppm = resolve_pdftoppm()
    font_path = resolve_font(args.font)
    pages_root = output_root / "pages"
    responsive_root = output_root / "pages-responsive"
    pages_root.mkdir(parents=True, exist_ok=True)
    responsive_root.mkdir(parents=True, exist_ok=True)
    page_rows: list[dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="handx-novel-render-") as temp_directory:
        temp_root = Path(temp_directory)
        subprocess.run(
            [
                str(pdftoppm),
                "-png",
                "-r",
                "220",
                "-f",
                "1",
                "-l",
                str(PAGE_COUNT),
                "-forcenum",
                str(pdf_path),
                str(temp_root / "page"),
            ],
            check=True,
        )
        for page_number in range(1, PAGE_COUNT + 1):
            source = temp_root / f"page-{page_number:03d}.png"
            destination = pages_root / f"page-{page_number:03d}.webp"
            responsive_destination = responsive_root / f"page-{page_number:03d}.webp"
            if not source.is_file():
                raise SystemExit(f"Rendered page is missing: {source.name}")
            width, height = watermark_page(source, destination, font_path)
            responsive_width, responsive_height = build_responsive_page(
                destination,
                responsive_destination,
            )
            local_only = page_number in LOCAL_ONLY_IMAGE_PAGES
            page_rows.append(
                {
                    "number": page_number,
                    "section_id": page_to_section[page_number],
                    "path": f"/novel/hero-wuming/pages/page-{page_number:03d}.webp",
                    "sha256": sha256_file(destination),
                    "byte_size": destination.stat().st_size,
                    "width": width,
                    "height": height,
                    "responsive_path": (
                        f"/novel/hero-wuming/pages-responsive/page-{page_number:03d}.webp"
                    ),
                    "responsive_sha256": sha256_file(responsive_destination),
                    "responsive_byte_size": responsive_destination.stat().st_size,
                    "responsive_width": responsive_width,
                    "responsive_height": responsive_height,
                    "watermark": WATERMARK,
                    "rights_status": (
                        "local_only_third_party_review"
                        if local_only
                        else "author_watermarked_derivative"
                    ),
                    "local_only": local_only,
                    "git_eligible": not local_only,
                    "not_for_media": local_only,
                }
            )

    manifest = build_manifest(output_root, page_rows, sections)
    manifest_path = output_root / "novel-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        "novel assets built:",
        f"pages={len(page_rows)}",
        f"chapters={manifest['totals']['numbered_chapters']}",
        f"commentable={manifest['totals']['commentable_sections']}",
        f"local_only={manifest['totals']['local_only_pages']}",
        f"manifest={manifest_path}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
