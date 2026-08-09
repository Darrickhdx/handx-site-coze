#!/usr/bin/env python3
"""Shared page-rendering primitives for novel editions.

Extracted verbatim from build_novel_assets.py, which rendered V0.3 and hardcoded
that edition's chapter titles and page starts. The watermark geometry, alpha and
text are unchanged: the rendered pages are the only copy readers ever receive, so
weakening the mark is a rights decision, not a refactor.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WATERMARK = "© 韩大昕｜鉴真小秃驴 · 仅供本站阅读"
RESPONSIVE_WIDTH = 760
RESPONSIVE_QUALITY = 74


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
