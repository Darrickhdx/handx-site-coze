#!/usr/bin/env python3
"""Build a private, owner-only entity hit index for the local research corpus.

The generated files always live in private-runtime/. They are research
locators, not evidence and never create graph claims or relationships.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
AUDIT_GRAPH = ROOT / "public" / "data" / "graph" / "audit-graph.json"
DEFAULT_OUTPUT = ROOT / "private-runtime" / "local-corpus-index.json"
DEFAULT_PATH_MAP = ROOT / "private-runtime" / "local-corpus-paths.json"
SUPPORTED_SUFFIXES = {
    ".csv",
    ".doc",
    ".docx",
    ".htm",
    ".html",
    ".json",
    ".md",
    ".pdf",
    ".txt",
}
SKIP_PARTS = {
    ".git",
    ".next",
    ".venv",
    "dist",
    "node_modules",
    "private-runtime",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--corpus",
        type=Path,
        default=Path(os.environ["HANDX_CORPUS_ROOT"])
        if os.environ.get("HANDX_CORPUS_ROOT")
        else None,
        help="Local corpus root. May also be set with HANDX_CORPUS_ROOT.",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--path-map", type=Path, default=DEFAULT_PATH_MAP)
    return parser.parse_args()


def classify_material(path: Path) -> tuple[str, str]:
    lowered = "/".join(part.lower() for part in path.parts)
    if any(marker in lowered for marker in ("小说", "成书", "创作", "/old/")):
        return "fiction_or_creative", "P3-owner-only"
    if any(marker in lowered for marker in ("家属", "口述", "家族")):
        return "family_material", "P3-owner-only"
    if any(marker in lowered for marker in ("ai整理", "ai研究", "deep-research", "报告")):
        return "ai_or_derived_research", "P2-owner-only"
    if any(marker in lowered for marker in ("ocr", "转录", "摘录")):
        return "transcription_or_ocr", "P2-owner-only"
    if any(marker in lowered for marker in ("网页", "缓存", "html")):
        return "web_cache", "P2-owner-only"
    if any(marker in lowered for marker in ("原件", "original", "同期")):
        return "registered_or_original_material", "P1-owner-only"
    return "local_research_material", "P2-owner-only"


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def read_docx_units(path: Path) -> list[tuple[str, str]]:
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    root = ElementTree.fromstring(xml)
    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    units: list[tuple[str, str]] = []
    for index, paragraph in enumerate(root.iter(f"{namespace}p"), start=1):
        text = clean_text("".join(node.text or "" for node in paragraph.iter(f"{namespace}t")))
        if text:
            units.append((f"paragraph {index}", text))
    return units


def read_pdf_units(path: Path) -> list[tuple[str, str]]:
    try:
        from pypdf import PdfReader
    except ImportError:
        return []
    reader = PdfReader(str(path))
    return [
        (f"page {index}", clean_text(page.extract_text() or ""))
        for index, page in enumerate(reader.pages, start=1)
    ]


def read_text_units(path: Path) -> list[tuple[str, str]]:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return read_docx_units(path)
    if suffix == ".pdf":
        return read_pdf_units(path)
    if suffix == ".doc":
        return []
    text = path.read_text(encoding="utf-8", errors="ignore")
    if suffix in {".html", ".htm"}:
        text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.I | re.S)
        text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
        text = re.sub(r"<[^>]+>", " ", text)
    return [
        (f"line {index}", clean_text(line))
        for index, line in enumerate(text.splitlines(), start=1)
        if clean_text(line)
    ]


def aliases_by_entity() -> dict[str, tuple[str, list[str]]]:
    payload = json.loads(AUDIT_GRAPH.read_text(encoding="utf-8"))
    result: dict[str, tuple[str, list[str]]] = {}
    for node in payload["nodes"]:
        labels: list[str] = []
        for field in ("canonical_label", "variant_label"):
            value = node.get(field)
            if isinstance(value, str):
                labels.extend(part.strip() for part in re.split(r"[、,/;；|]", value))
            elif isinstance(value, list):
                labels.extend(str(part).strip() for part in value)
        labels = sorted({label for label in labels if len(label) >= 2})
        if labels:
            result[str(node["entity_id"])] = (str(node["canonical_label"]), labels)
    return result


def main() -> int:
    args = parse_args()
    if args.corpus is None:
        raise SystemExit("Set --corpus or HANDX_CORPUS_ROOT; no local path is hard-coded.")
    corpus = args.corpus.expanduser().resolve()
    if not corpus.is_dir():
        raise SystemExit(f"Corpus root is not a directory: {corpus}")

    aliases = aliases_by_entity()
    documents: list[dict[str, object]] = []
    path_map: dict[str, str] = {}
    scanned = 0
    failed = 0

    for path in sorted(corpus.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        try:
            relative_path = path.relative_to(corpus)
        except ValueError:
            continue
        if relative_path.parts[:3] == ("AI网站媒体", "01-网站", "本地开发版"):
            continue
        scanned += 1
        document_id = "DOC-" + hashlib.sha256(str(relative_path).encode("utf-8")).hexdigest()[:16].upper()
        material_class, access_tier = classify_material(relative_path)
        path_map[document_id] = str(path)
        try:
            units = read_text_units(path)
        except (OSError, ValueError, KeyError, zipfile.BadZipFile):
            failed += 1
            units = []

        searchable_name = clean_text(path.stem)
        matches: list[dict[str, object]] = []
        for entity_id, (label, entity_aliases) in aliases.items():
            locators = [
                locator
                for locator, text in units
                if any(alias in text for alias in entity_aliases)
            ][:20]
            if not locators and not any(alias in searchable_name for alias in entity_aliases):
                continue
            if not locators:
                locators = ["filename"]
            matches.append(
                {
                    "entity_id": entity_id,
                    "label": label,
                    "locators": locators,
                    "hit_scope": "locator-only",
                    "creates_claim": False,
                }
            )

        if matches:
            documents.append(
                {
                    "document_id": document_id,
                    "title": path.name,
                    "suffix": path.suffix.lower(),
                    "material_class": material_class,
                    "access_tier": access_tier,
                    "byte_size": path.stat().st_size,
                    "matches": matches,
                }
            )

    args.output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    payload = {
        "schema_version": "handx-local-corpus-index-1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "must_not_deploy": True,
        "warning": "Locator-only owner index. Hits never create historical claims or graph edges.",
        "counts": {
            "files_scanned": scanned,
            "files_with_entity_hits": len(documents),
            "read_failures": failed,
        },
        "documents": documents,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    args.path_map.write_text(
        json.dumps(
            {
                "schema_version": "handx-local-corpus-path-map-1.0",
                "must_not_deploy": True,
                "paths": path_map,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    os.chmod(args.output, 0o600)
    os.chmod(args.path_map, 0o600)
    print(json.dumps(payload["counts"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
