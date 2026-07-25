#!/usr/bin/env python3
"""Repeatable HTTP smoke audit for the local-only website build."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


PAGES = [
    "/",
    "/discover",
    "/discover/1936-pingdiquan",
    "/discover/same-name",
    "/discover/ai-family-history",
    "/novel",
    "/novel/read",
    "/novel/chapter/prologue",
    "/novel/chapter/chapter-01",
    "/studio",
    "/studio/comments",
    "/studio/media",
    "/sukaiyuan",
    "/person",
    "/timeline",
    "/persons",
    "/events",
    "/archives",
    "/archives/SRC-013",
    "/graph",
    "/wiki",
    "/wiki/P-001",
    "/wiki/P-005",
    "/wiki/P-017",
    "/legacy/su-kaiyuan",
    "/topics",
    "/topics/dong-yan-su-evidence-visibility",
    "/controversies",
    "/methodology",
    "/about",
    "/rights",
    "/privacy",
    "/insights",
]
NOVEL_MANIFEST = "/novel/hero-wuming/novel-manifest.json"
EXPECTED_NOVEL_SOURCE_HASHES = {
    "pdf_sha256": "3913ae458296646e3151ab9ad2b6646a7104cfe538a80e095b6563fef652d152",
    "docx_sha256": "4d72bb26a15a45a95ca7f21795a4365db057fac06025b4fc7b4b330fa9ba1b09",
}
EXPECTED_NOVEL_LOCAL_ONLY_PAGES = {6, 14, 22, 28, 47, 116, 177}
FORBIDDEN_NOVEL_RAW_SOURCES = {
    "/novel/hero-wuming/英雄无名V0.3-出版版.pdf",
    "/novel/hero-wuming/英雄无名V0.3-出版版.docx",
    "/novel/hero-wuming/source.pdf",
    "/novel/hero-wuming/source.docx",
    "/novel/hero-wuming/hero-wuming.pdf",
    "/novel/hero-wuming/hero-wuming.docx",
}
GRAPH_MANIFEST = "/data/graph/manifest.json"
EXPECTED_GRAPH_COUNTS = {
    "audit_sources": 131,
    "audit_claims": 211,
    "audit_nodes": 229,
    "audit_edges": 127,
    "legacy_nodes": 107,
    "legacy_edges": 151,
    "crosswalk_records": 258,
}
GRAPH_OUTPUTS = {
    "audit-graph.json": ("nodes", 229, "edges", 127),
    "legacy-graph.json": ("nodes", 107, "edges", 151),
    "legacy-crosswalk.json": ("records", 258, None, None),
}
JSON_ENDPOINTS = [
    "/data/persons.json",
    "/data/events.json",
    "/data/timeline.json",
    "/data/sources.json",
]
EXPECTED_ENDPOINT_COUNTS = {
    "/data/persons.json": ("persons", 2),
    "/data/events.json": ("events", 3),
    "/data/timeline.json": ("timeline", 3),
    "/data/sources.json": ("sources", 5),
}
EXCLUDED_MIXED_DEPENDENCY_IDS = {
    "SRC-103",
    "SRC-104",
    "CL-176",
    "CL-177",
    "CL-178",
    "CL-179",
    "P-002",
    "L-001",
    "D-029",
    "L-021",
    "R-042",
    "REL-001",
    "REL-130",
}
# These routes deliberately expose the full audited or blocked research layer.
# The IDs above are forbidden only from the older V7R4 safe projection; their
# presence as an explicitly labelled conflict, candidate, or not-for-media
# record on Wiki/topic pages is expected and must not be mistaken for leakage.
FULL_AUDIT_ROUTES = {
    "/wiki",
    "/wiki/P-001",
    "/wiki/P-005",
    "/wiki/P-017",
    "/legacy/su-kaiyuan",
    "/archives/SRC-013",
    "/topics",
    "/topics/dong-yan-su-evidence-visibility",
    "/studio/media",
}
SITE_RESEARCH = Path(__file__).resolve().parents[1] / "src" / "data" / "research.json"
STATIC_ASSET_MANIFEST = "/assets/asset-manifest.json"
EXPECTED_STATIC_ASSETS = {
    "assets/editorial/fiction-north-city-collage-v1.png",
    "assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png",
    "assets/personal/botanical-sprig.png",
    "assets/personal/jian-zhen-xiao-tu-lv-portrait.jpg",
    "assets/personal/jian-zhen-xiao-tu-lv-wechat-qr.png",
}
FORBIDDEN_STATIC_ASSETS = {
    "/assets/sukaiyuan/1936-sui-xing-ji-lue.png",
    "/assets/sukaiyuan/1937-namebook-page.jpg",
    "/assets/sukaiyuan/1937-namebook-page-2.jpg",
}
ABSOLUTE_MACOS_HOME_MARKER = ("/" + "Users" + "/").encode()


def load_expected_meta() -> dict[str, object]:
    research = json.loads(SITE_RESEARCH.read_text(encoding="utf-8"))
    meta = research.get("_meta", {})
    if not isinstance(meta, dict):
        raise ValueError(f"generated research metadata is malformed: {SITE_RESEARCH}")
    snapshot_id = str(meta.get("research_snapshot_id", "")).strip()
    hashes = meta.get("research_input_sha256")
    generation_id = str(meta.get("generation_id", ""))
    generation_sha = str(meta.get("generation_manifest_sha256", ""))
    if (
        not snapshot_id
        or not isinstance(hashes, dict)
        or not hashes
        or re.fullmatch(r"gen-[0-9a-f]{64}", generation_id) is None
        or re.fullmatch(r"[0-9a-f]{64}", generation_sha) is None
        or meta.get("exporter_version") != "1.3.6"
        or "v7r4_safe_subset" not in str(meta.get("approval_scope", ""))
    ):
        raise ValueError(
            f"generated site data lacks V7R4 generation provenance: {SITE_RESEARCH}"
        )
    return meta


def fetch(base_url: str, path: str) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{urllib.parse.quote(path, safe='/?=&%:')}",
        headers={"User-Agent": "sukaiyuan-local-smoke/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, {key.lower(): value for key, value in exc.headers.items()}, exc.read()


def fetch_with_headers(
    base_url: str,
    path: str,
    request_headers: dict[str, str],
) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{urllib.parse.quote(path, safe='/?=&%:')}",
        headers={
            "User-Agent": "sukaiyuan-local-smoke/1.0",
            **request_headers,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, {key.lower(): value for key, value in exc.headers.items()}, exc.read()


def post_json(
    base_url: str,
    path: str,
    payload: dict[str, object],
    *,
    origin: str | None = None,
    request_headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], bytes]:
    headers = {
        "User-Agent": "sukaiyuan-local-smoke/1.0",
        "Content-Type": "application/json",
    }
    if origin is not None:
        headers["Origin"] = origin
    if request_headers:
        headers.update(request_headers)
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{urllib.parse.quote(path, safe='/?=&%:')}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, {key.lower(): value for key, value in exc.headers.items()}, exc.read()


def check_headers(path: str, headers: dict[str, str], errors: list[str]) -> None:
    cache = headers.get("cache-control", "").lower()
    robots = headers.get("x-robots-tag", "").lower()
    if "private" not in cache or "no-store" not in cache:
        errors.append(f"{path}: Cache-Control is not private/no-store ({cache!r})")
    if "noindex" not in robots or "nofollow" not in robots:
        errors.append(f"{path}: X-Robots-Tag is not noindex/nofollow ({robots!r})")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:3217")
    parser.add_argument("--admin-token-file", type=Path)
    args = parser.parse_args()
    errors: list[str] = []
    titles: dict[str, str] = {}
    rights_ids = {
        "/discover/1936-pingdiquan": "RP-DISC-001",
        "/discover/same-name": "RP-DISC-002",
        "/discover/ai-family-history": "RP-DISC-003",
    }
    try:
        expected_meta = load_expected_meta()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "FAIL", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 1

    for path in PAGES:
        status, headers, body = fetch(args.base_url, path)
        if status != 200:
            errors.append(f"{path}: expected 200, got {status}")
            continue
        check_headers(path, headers, errors)
        html = body.decode("utf-8", errors="replace")
        title_match = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
        if not title_match:
            errors.append(f"{path}: missing title")
        else:
            title = re.sub(r"\s+", " ", title_match.group(1)).strip()
            titles[path] = title
        robots_meta = re.search(
            r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)',
            html,
            re.I,
        )
        if not robots_meta or "noindex" not in robots_meta.group(1).lower():
            errors.append(f"{path}: missing noindex robots meta")
        if path not in FULL_AUDIT_ROUTES:
            for excluded_id in sorted(EXCLUDED_MIXED_DEPENDENCY_IDS):
                if excluded_id in html:
                    errors.append(f"{path}: renders excluded mixed-dependency record {excluded_id}")
        if path == "/" and (
            "本地审阅版" not in html
            or "研究资料仍在核验" not in html
            or "未授权外部部署或公开发布" not in html
        ):
            errors.append("/: missing the visible local-review and publication-boundary notice")
        if "产品首创" in html:
            errors.append(f"{path}: stale unverified '产品首创' wording remains")
        if path == "/rights" and (
            "尚未发放许可" not in html
            or "当前不存在默认许可" not in html
            or "原创部分按 CC BY-NC-SA 4.0 使用" in html
        ):
            errors.append("/rights: proposed license is not clearly separated from an active grant")
        if path == "/about" and (
            "本人履历｜本人提供" not in html
            or "不替代个人任职证明" not in html
            or "原创系统示意图，非产品实物复刻" not in html
        ):
            errors.append("/about: career evidence boundary is missing")
        if path in rights_ids:
            rights_id = rights_ids[path]
            if (
                rights_id not in html
                or "当前保留全部权利" not in html
                or "当前未发放 CC 或其他开放许可" not in html
                or "历史事实不由本站独占" not in html
                or "小说人物设定、剧情、样章、剧本、故事圣经及影视开发方案全部保留权利" not in html
            ):
                errors.append(f"{path}: article rights passport is incomplete")
            if 'rel="license"' in html or "creativecommons.org/licenses/" in html:
                errors.append(f"{path}: local-review article accidentally grants a Creative Commons license")
            if "127.0.0.1" in html and "当前只有本地审阅地址" not in html:
                errors.append(f"{path}: localhost was presented as a public canonical URL")
        if path == "/discover/1936-pingdiquan" and (
            "朱自清" not in html
            or "《绥行纪略》" not in html
            or "SRC-013" not in html
            or "不随本文授权" not in html
        ):
            errors.append("/discover/1936-pingdiquan: third-party source rights label is incomplete")
        if path == "/novel" and (
            "182" not in html
            or "32" not in html
            or "水印" not in html
            or "不能阻止截图" not in html
        ):
            errors.append("/novel: full-book count or honest watermark boundary is missing")
        if path == "/novel/chapter/chapter-01" and (
            "第一章" not in html
            or "读者意见" not in html
            or "审核" not in html
        ):
            errors.append("/novel/chapter/chapter-01: chapter reader or moderated discussion notice is missing")
        if path == "/topics/dong-yan-su-evidence-visibility" and (
            "拒绝给出功劳排名" not in html
            or 'data-publication-status="not_for_media"' not in html
            or 'data-topic-mode="source_backed"' not in html
            or 'data-topic-mode="question"' not in html
            or 'data-topic-mode="interpretation"' not in html
        ):
            errors.append(
                "/topics/dong-yan-su-evidence-visibility: topic evidence modes or media gate is missing"
            )
        if path == "/studio/media" and (
            "review_only" not in html
            or "not_for_media" not in html
            or "不是未经确认的自动发布" not in html
            or "不保存令牌" not in html
        ):
            errors.append("/studio/media: review-only distribution gate is incomplete")
        if path == "/graph" and (
            "故事模式" not in html
            or "研究模式" not in html
            or "Legacy 线索默认关闭" not in html
            or "229 个实体" not in html
            or "127 条关系" not in html
        ):
            errors.append("/graph: dual-mode graph boundary or audited counts are missing")

    if len(set(titles.values())) != len(PAGES):
        errors.append(f"page titles are missing or not unique: {titles}")

    for path in JSON_ENDPOINTS:
        status, headers, body = fetch(args.base_url, path)
        if status != 200:
            errors.append(f"{path}: expected 200, got {status}")
            continue
        check_headers(path, headers, errors)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{path}: invalid JSON ({exc})")
            continue
        meta = payload.get("_meta", {})
        if meta.get("research_snapshot_id") != expected_meta.get("research_snapshot_id"):
            errors.append(
                f"{path}: snapshot mismatch "
                f"({meta.get('research_snapshot_id')!r} != {expected_meta.get('research_snapshot_id')!r})"
            )
        if meta != expected_meta:
            errors.append(f"{path}: metadata does not match the generated research commit marker")
        if meta.get("deployment_authorized") is not False or meta.get("must_not_deploy") is not True:
            errors.append(f"{path}: deployment gate is not closed")
        field, expected_count = EXPECTED_ENDPOINT_COUNTS[path]
        if len(payload.get(field, [])) != expected_count:
            errors.append(
                f"{path}: {field} count {len(payload.get(field, []))}, "
                f"expected V7R4 count {expected_count}"
            )
        body_text = body.decode("utf-8", errors="replace")
        for excluded_id in sorted(EXCLUDED_MIXED_DEPENDENCY_IDS):
            if excluded_id in body_text:
                errors.append(f"{path}: contains excluded mixed-dependency record {excluded_id}")

    status, headers, body = fetch(args.base_url, STATIC_ASSET_MANIFEST)
    if status != 200:
        errors.append(f"{STATIC_ASSET_MANIFEST}: expected 200, got {status}")
    else:
        check_headers(STATIC_ASSET_MANIFEST, headers, errors)
        try:
            asset_manifest = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{STATIC_ASSET_MANIFEST}: invalid JSON ({exc})")
            asset_manifest = {}

        if (
            asset_manifest.get("deployment_authorized") is not False
            or asset_manifest.get("must_not_deploy") is not True
        ):
            errors.append(f"{STATIC_ASSET_MANIFEST}: deployment gate is not closed")

        asset_rows = asset_manifest.get("assets", [])
        if not isinstance(asset_rows, list):
            errors.append(f"{STATIC_ASSET_MANIFEST}: assets must be a list")
            asset_rows = []
        listed_paths = {
            str(row.get("path", ""))
            for row in asset_rows
            if isinstance(row, dict)
        }
        if listed_paths != EXPECTED_STATIC_ASSETS:
            errors.append(
                f"{STATIC_ASSET_MANIFEST}: asset list {sorted(listed_paths)}, "
                f"expected {sorted(EXPECTED_STATIC_ASSETS)}"
            )

        for row in asset_rows:
            if not isinstance(row, dict):
                errors.append(f"{STATIC_ASSET_MANIFEST}: asset entry is not an object")
                continue
            asset_path = str(row.get("path", ""))
            expected_sha = str(row.get("sha256", ""))
            if (
                row.get("rights_scope") != "local_internal_preview_only"
                or row.get("publishable") is not False
            ):
                errors.append(f"/{asset_path}: asset publication gate is not closed")
            if re.fullmatch(r"[0-9a-f]{64}", expected_sha) is None:
                errors.append(f"/{asset_path}: invalid SHA-256 in manifest")
                continue
            asset_url = f"/{asset_path.lstrip('/')}"
            asset_status, asset_headers, asset_body = fetch(args.base_url, asset_url)
            if asset_status != 200:
                errors.append(f"{asset_url}: expected 200, got {asset_status}")
                continue
            check_headers(asset_url, asset_headers, errors)
            actual_sha = hashlib.sha256(asset_body).hexdigest()
            if actual_sha != expected_sha:
                errors.append(
                    f"{asset_url}: SHA-256 mismatch ({actual_sha} != {expected_sha})"
                )

    for path in sorted(FORBIDDEN_STATIC_ASSETS):
        status, headers, _body = fetch(args.base_url, path)
        if status != 404:
            errors.append(f"{path}: forbidden or superseded asset is still accessible ({status})")
        check_headers(path, headers, errors)

    # Verify the complete novel delivery contract, then hash every rendered page
    # over HTTP so a stale, missing, duplicated, or substituted page cannot pass.
    status, headers, body = fetch(args.base_url, NOVEL_MANIFEST)
    if status != 200:
        errors.append(f"{NOVEL_MANIFEST}: expected 200, got {status}")
        novel_manifest: dict[str, object] = {}
    else:
        check_headers(NOVEL_MANIFEST, headers, errors)
        try:
            novel_manifest = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{NOVEL_MANIFEST}: invalid JSON ({exc})")
            novel_manifest = {}

    if novel_manifest:
        totals = novel_manifest.get("totals", {})
        source = novel_manifest.get("source", {})
        rights = novel_manifest.get("rights", {})
        output = novel_manifest.get("output", {})
        pages = novel_manifest.get("pages", [])
        sections = novel_manifest.get("sections", [])
        if (
            novel_manifest.get("schema_version") != "handx-novel-manifest-1.0"
            or novel_manifest.get("must_not_deploy") is not True
            or novel_manifest.get("deployment_authorized") is not False
            or novel_manifest.get("publication_status") != "local_review"
        ):
            errors.append(f"{NOVEL_MANIFEST}: local-review publication gate is malformed")
        if not isinstance(totals, dict) or (
            totals.get("pages") != 182
            or totals.get("numbered_chapters") != 32
            or totals.get("commentable_sections") != 34
            or totals.get("local_only_pages") != 7
        ):
            errors.append(f"{NOVEL_MANIFEST}: unexpected totals {totals!r}")
        if not isinstance(source, dict) or any(
            source.get(key) != expected
            for key, expected in EXPECTED_NOVEL_SOURCE_HASHES.items()
        ):
            errors.append(f"{NOVEL_MANIFEST}: source SHA contract changed ({source!r})")
        if (
            not isinstance(source, dict)
            or source.get("pdf_page_count") != 182
            or source.get("raw_sources_served") is not False
            or source.get("chapter_titles_verified_against_docx") is not True
        ):
            errors.append(f"{NOVEL_MANIFEST}: source verification boundary is malformed")
        if (
            not isinstance(rights, dict)
            or rights.get("license") != "no-license-granted"
            or set(rights.get("local_only_image_pages", []))
            != EXPECTED_NOVEL_LOCAL_ONLY_PAGES
            or "不能阻止截图" not in str(rights.get("notice", ""))
        ):
            errors.append(f"{NOVEL_MANIFEST}: rights or watermark limitation is malformed")
        if (
            not isinstance(output, dict)
            or output.get("format") != "webp"
            or output.get("long_edge_pixels") != 1800
            or output.get("responsive_width_pixels") != 760
            or output.get("watermark_is_pixel_layer") is not True
        ):
            errors.append(f"{NOVEL_MANIFEST}: page output contract is malformed")

        if not isinstance(pages, list) or len(pages) != 182:
            errors.append(f"{NOVEL_MANIFEST}: expected 182 page rows, got {len(pages) if isinstance(pages, list) else 'invalid'}")
            pages = []
        page_numbers = [
            row.get("number")
            for row in pages
            if isinstance(row, dict)
        ]
        if page_numbers != list(range(1, 183)):
            errors.append(f"{NOVEL_MANIFEST}: page numbers are not the exact ordered range 1..182")
        if not isinstance(sections, list) or len(sections) != 44:
            errors.append(f"{NOVEL_MANIFEST}: expected 44 section rows")
            sections = []
        covered_pages: list[int] = []
        section_ids: set[str] = set()
        for section in sections:
            if not isinstance(section, dict):
                errors.append(f"{NOVEL_MANIFEST}: section row is not an object")
                continue
            section_id = str(section.get("id", ""))
            if not section_id or section_id in section_ids:
                errors.append(f"{NOVEL_MANIFEST}: blank or duplicated section id {section_id!r}")
            section_ids.add(section_id)
            start_page = section.get("start_page")
            end_page = section.get("end_page")
            if not isinstance(start_page, int) or not isinstance(end_page, int) or start_page > end_page:
                errors.append(f"{NOVEL_MANIFEST}: invalid page range for {section_id!r}")
                continue
            if section.get("page_count") != end_page - start_page + 1:
                errors.append(f"{NOVEL_MANIFEST}: page_count mismatch for {section_id!r}")
            covered_pages.extend(range(start_page, end_page + 1))
        if covered_pages != list(range(1, 183)):
            errors.append(f"{NOVEL_MANIFEST}: sections do not uniquely and contiguously cover pages 1..182")

        for row in pages:
            if not isinstance(row, dict):
                continue
            number = row.get("number")
            page_path = str(row.get("path", ""))
            expected_sha = str(row.get("sha256", ""))
            responsive_path = str(row.get("responsive_path", ""))
            responsive_sha = str(row.get("responsive_sha256", ""))
            if (
                not isinstance(number, int)
                or page_path != f"/novel/hero-wuming/pages/page-{number:03d}.webp"
                or re.fullmatch(r"[0-9a-f]{64}", expected_sha) is None
                or responsive_path
                != f"/novel/hero-wuming/pages-responsive/page-{number:03d}.webp"
                or re.fullmatch(r"[0-9a-f]{64}", responsive_sha) is None
                or row.get("responsive_width") != 760
                or row.get("responsive_height") != 1078
                or row.get("section_id") not in section_ids
                or row.get("watermark") != "© 韩大昕｜鉴真小秃驴 · 仅供本站阅读"
                or row.get("local_only") is not (number in EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
                or row.get("git_eligible") is not (number not in EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
                or row.get("not_for_media") is not (number in EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
            ):
                errors.append(f"{NOVEL_MANIFEST}: malformed page row {number!r}")
                continue
            page_status, page_headers, page_body = fetch(args.base_url, page_path)
            if page_status != 200:
                errors.append(f"{page_path}: expected 200, got {page_status}")
                continue
            check_headers(page_path, page_headers, errors)
            if hashlib.sha256(page_body).hexdigest() != expected_sha:
                errors.append(f"{page_path}: rendered page SHA-256 mismatch")
            if len(page_body) != row.get("byte_size"):
                errors.append(f"{page_path}: byte_size differs from manifest")
            if page_headers.get("content-type", "").split(";", 1)[0] != "image/webp":
                errors.append(f"{page_path}: expected image/webp Content-Type")
            responsive_status, responsive_headers, responsive_body = fetch(
                args.base_url,
                responsive_path,
            )
            if responsive_status != 200:
                errors.append(
                    f"{responsive_path}: expected 200, got {responsive_status}"
                )
                continue
            check_headers(responsive_path, responsive_headers, errors)
            if hashlib.sha256(responsive_body).hexdigest() != responsive_sha:
                errors.append(
                    f"{responsive_path}: responsive page SHA-256 mismatch"
                )
            if len(responsive_body) != row.get("responsive_byte_size"):
                errors.append(
                    f"{responsive_path}: responsive byte_size differs from manifest"
                )
            if (
                responsive_headers.get("content-type", "").split(";", 1)[0]
                != "image/webp"
            ):
                errors.append(
                    f"{responsive_path}: expected image/webp Content-Type"
                )

    for path in sorted(FORBIDDEN_NOVEL_RAW_SOURCES):
        status, headers, _body = fetch(args.base_url, path)
        if status != 404:
            errors.append(f"{path}: raw novel source is HTTP-accessible ({status})")
        check_headers(path, headers, errors)

    # Verify graph source hashes and all three count families independently of
    # the UI, including the blocked-for-fact migration layer.
    status, headers, body = fetch(args.base_url, GRAPH_MANIFEST)
    if status != 200:
        errors.append(f"{GRAPH_MANIFEST}: expected 200, got {status}")
        graph_manifest: dict[str, object] = {}
    else:
        check_headers(GRAPH_MANIFEST, headers, errors)
        try:
            graph_manifest = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{GRAPH_MANIFEST}: invalid JSON ({exc})")
            graph_manifest = {}
    if graph_manifest:
        if (
            graph_manifest.get("must_not_deploy") is not True
            or graph_manifest.get("counts") != EXPECTED_GRAPH_COUNTS
        ):
            errors.append(f"{GRAPH_MANIFEST}: graph counts or local-only gate changed")
        privacy = graph_manifest.get("privacy", {})
        if not isinstance(privacy, dict) or (
            privacy.get("legacy_detail_included") is not False
            or privacy.get("absolute_paths_included") is not False
            or privacy.get("crosswalk_creates_facts") is not False
        ):
            errors.append(f"{GRAPH_MANIFEST}: graph privacy/migration gate is malformed")
        output_hashes = graph_manifest.get("outputs", {})
        for filename, shape in GRAPH_OUTPUTS.items():
            graph_path = f"/data/graph/{filename}"
            graph_status, graph_headers, graph_body = fetch(args.base_url, graph_path)
            if graph_status != 200:
                errors.append(f"{graph_path}: expected 200, got {graph_status}")
                continue
            check_headers(graph_path, graph_headers, errors)
            if (
                not isinstance(output_hashes, dict)
                or hashlib.sha256(graph_body).hexdigest() != output_hashes.get(filename)
            ):
                errors.append(f"{graph_path}: SHA-256 differs from graph manifest")
            try:
                graph_payload = json.loads(graph_body)
            except json.JSONDecodeError as exc:
                errors.append(f"{graph_path}: invalid JSON ({exc})")
                continue
            first_field, first_count, second_field, second_count = shape
            if len(graph_payload.get(first_field, [])) != first_count:
                errors.append(f"{graph_path}: {first_field} count mismatch")
            if second_field and len(graph_payload.get(second_field, [])) != second_count:
                errors.append(f"{graph_path}: {second_field} count mismatch")
            if filename == "audit-graph.json" and (
                len(graph_payload.get("claims", [])) != 211
                or len(graph_payload.get("sources", [])) != 131
            ):
                errors.append(f"{graph_path}: audited claims/sources count mismatch")
            if filename == "legacy-crosswalk.json":
                records = graph_payload.get("records", [])
                if any(
                    isinstance(record, dict)
                    and record.get("migration_status") == "merged_as_fact"
                    for record in records
                ):
                    errors.append(f"{graph_path}: crosswalk contains an automatic fact merge")

    status, headers, _body = fetch(args.base_url, "/private-runtime/admin-token")
    if status != 404:
        errors.append(f"/private-runtime/admin-token: private runtime file is HTTP-accessible ({status})")
    check_headers("/private-runtime/admin-token", headers, errors)

    status, headers, body = fetch(args.base_url, "/robots.txt")
    if status != 200 or b"Disallow: /" not in body:
        errors.append("/robots.txt: missing full-site Disallow")
    check_headers("/robots.txt", headers, errors)

    status, headers, _body = fetch(args.base_url, "/__definitely_missing__")
    if status != 404:
        errors.append(f"missing route: expected 404, got {status}")
    check_headers("missing route", headers, errors)

    local_origin = args.base_url.rstrip("/")
    smoke_session = "00000000-0000-4000-8000-000000000001"
    smoke_session_2 = "00000000-0000-4000-8000-000000000002"
    status, headers, body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "page_view",
            "path": "/privacy?smoke=ignored",
            "session_id": smoke_session,
            "properties": {
                "section": "smoke",
                "acquisition_channel": "xiaohongshu",
                "campaign_id": "pingdiquan-01",
                "content_id": "privacy",
                "content_type": "site",
            },
        },
        origin=local_origin,
    )
    if status != 202:
        errors.append(f"/api/local/analytics: expected 202, got {status} ({body!r})")
    check_headers("/api/local/analytics", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "not valid",
            "path": "/",
            "session_id": smoke_session,
        },
        origin=local_origin,
    )
    if status != 400:
        errors.append(f"/api/local/analytics invalid contract: expected 400, got {status}")
    check_headers("/api/local/analytics invalid contract", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "page_view",
            "path": "/",
            "session_id": smoke_session,
            "properties": {
                "acquisition_channel": "direct",
                "forbidden": "must-fail",
            },
        },
        origin=local_origin,
    )
    if status != 400:
        errors.append(f"/api/local/analytics unknown property: expected 400, got {status}")
    check_headers("/api/local/analytics unknown property", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "page_view",
            "path": "/",
            "session_id": smoke_session,
            "properties": {
                "acquisition_channel": "xiaohongshu",
                "campaign_id": "person@example.com",
            },
        },
        origin=local_origin,
    )
    if status != 400:
        errors.append(f"/api/local/analytics unsafe campaign: expected 400, got {status}")
    check_headers("/api/local/analytics unsafe campaign", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "page_view",
            "path": "/",
            "session_id": "anonymous",
            "properties": {"acquisition_channel": "direct"},
        },
        origin=local_origin,
    )
    if status != 400:
        errors.append(f"/api/local/analytics invalid session: expected 400, got {status}")
    check_headers("/api/local/analytics invalid session", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/analytics",
        {
            "event_name": "page_view",
            "path": "/",
            "session_id": "x" * 9000,
        },
        origin=local_origin,
    )
    if status != 413:
        errors.append(f"/api/local/analytics oversized body: expected 413, got {status}")
    check_headers("/api/local/analytics oversized body", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/messages",
        {
            "display_name": "Smoke",
            "contact": "private@example.invalid",
            "body": "这是一条仅用于本机接口验收的测试留言。",
            "website": "",
            "consent": True,
            "related_path": "/about?source=smoke",
            "session_id": smoke_session,
        },
        origin="https://example.com",
    )
    if status != 403:
        errors.append(f"/api/local/messages foreign origin: expected 403, got {status}")
    check_headers("/api/local/messages foreign origin", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/messages",
        {
            "display_name": "Smoke",
            "contact": "private@example.invalid",
            "body": "这是一条不带 Origin 的本机接口反向测试留言。",
            "website": "",
            "consent": True,
            "related_path": "/about",
            "session_id": smoke_session_2,
        },
    )
    if status != 403:
        errors.append(f"/api/local/messages missing origin: expected 403, got {status}")
    check_headers("/api/local/messages missing origin", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/messages",
        {
            "display_name": "Smoke",
            "contact": "private@example.invalid",
            "body": "这是一条来自其他本机端口的反向测试留言。",
            "website": "",
            "consent": True,
            "related_path": "/about",
            "session_id": smoke_session_2,
        },
        origin="http://127.0.0.1:65530",
    )
    if status != 403:
        errors.append(f"/api/local/messages cross-port origin: expected 403, got {status}")
    check_headers("/api/local/messages cross-port origin", headers, errors)

    status, headers, body = post_json(
        args.base_url,
        "/api/local/messages",
        {
            "display_name": "Smoke",
            "contact": "private@example.invalid",
            "body": "这是一条仅用于本机接口验收的测试留言。",
            "website": "",
            "consent": True,
            "related_path": "/about?source=smoke",
            "session_id": smoke_session,
        },
        origin=local_origin,
    )
    if status != 201:
        errors.append(f"/api/local/messages: expected 201, got {status} ({body!r})")
    check_headers("/api/local/messages", headers, errors)

    status, headers, body = fetch(args.base_url, "/api/local/insights")
    if status != 200:
        errors.append(f"/api/local/insights: expected 200, got {status}")
    else:
        try:
            insights = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"/api/local/insights: invalid JSON ({exc})")
            insights = {}
        totals = insights.get("totals", {})
        if (
            totals.get("page_views") != 1
            or totals.get("saved_messages") != 1
            or totals.get("sessions") != 1
        ):
            errors.append(f"/api/local/insights: unexpected totals {totals!r}")
        if "messages" in insights:
            errors.append("/api/local/insights: aggregate endpoint leaked message content")
        if "recent_activity" in insights:
            errors.append("/api/local/insights: aggregate endpoint leaked precise activity")
        top_pages = insights.get("top_pages", [])
        if top_pages != [{"path": "/privacy", "views": 1}]:
            errors.append(f"/api/local/insights: query stripping failed ({top_pages!r})")
        source_quality = insights.get("source_quality", [])
        if (
            len(source_quality) != 1
            or source_quality[0].get("channel") != "xiaohongshu"
            or source_quality[0].get("campaign") != "pingdiquan-01"
        ):
            errors.append(f"/api/local/insights: acquisition aggregation failed ({source_quality!r})")
        window = insights.get("window", {})
        if window.get("timezone") != "Asia/Shanghai" or len(insights.get("daily_page_views", [])) != 30:
            errors.append(f"/api/local/insights: analysis window is malformed ({window!r})")
    check_headers("/api/local/insights", headers, errors)

    status, headers, _body = fetch(args.base_url, "/api/local/inbox")
    if status != 401:
        errors.append(f"/api/local/inbox without token: expected 401, got {status}")
    check_headers("/api/local/inbox without token", headers, errors)

    status, headers, body = fetch(
        args.base_url,
        "/api/local/corpus-hits?entity=P-001",
    )
    if status != 401:
        errors.append(f"/api/local/corpus-hits without token: expected 401, got {status}")
    if ABSOLUTE_MACOS_HOME_MARKER in body or b"private-runtime" in body:
        errors.append("/api/local/corpus-hits without token leaked a local path")
    check_headers("/api/local/corpus-hits without token", headers, errors)

    status, headers, _body = fetch(
        args.base_url,
        "/private-runtime/local-corpus-index.json",
    )
    if status != 404:
        errors.append(
            f"/private-runtime/local-corpus-index.json: private corpus index is HTTP-accessible ({status})"
        )
    check_headers("/private-runtime/local-corpus-index.json", headers, errors)

    comment_chapter = "chapter-01"
    comment_session = "00000000-0000-4000-8000-000000000011"
    xss_comment_session = "00000000-0000-4000-8000-000000000012"
    safe_comment_body = "这是一条用于验证先审后显流程的章节读者意见。"
    xss_comment_body = "<script>alert(1)</script>请勿执行"

    status, headers, body = fetch(
        args.base_url,
        f"/api/local/novel-comments?chapter={comment_chapter}",
    )
    if status != 200:
        errors.append(f"/api/local/novel-comments initial GET: expected 200, got {status}")
    else:
        try:
            initial_comments = json.loads(body).get("comments", [])
        except json.JSONDecodeError as exc:
            errors.append(f"/api/local/novel-comments initial GET: invalid JSON ({exc})")
            initial_comments = []
        if initial_comments:
            errors.append("/api/local/novel-comments initial GET: isolated runtime was not empty")
    check_headers("/api/local/novel-comments initial GET", headers, errors)

    base_comment_payload = {
        "chapter_id": comment_chapter,
        "display_name": "Smoke Reader",
        "body": safe_comment_body,
        "website": "",
        "consent": True,
        "session_id": comment_session,
    }
    status, headers, _body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        base_comment_payload,
        origin="https://example.com",
    )
    if status != 403:
        errors.append(f"/api/local/novel-comments foreign origin: expected 403, got {status}")
    check_headers("/api/local/novel-comments foreign origin", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        base_comment_payload,
    )
    if status != 403:
        errors.append(f"/api/local/novel-comments missing origin: expected 403, got {status}")
    check_headers("/api/local/novel-comments missing origin", headers, errors)

    status, headers, body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        base_comment_payload,
        origin=local_origin,
    )
    submitted_comment_id = ""
    if status != 201:
        errors.append(f"/api/local/novel-comments submit: expected 201, got {status} ({body!r})")
    else:
        try:
            submission = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"/api/local/novel-comments submit: invalid JSON ({exc})")
            submission = {}
        submitted_comment_id = str(submission.get("id", ""))
        if submission.get("status") != "pending" or not submitted_comment_id:
            errors.append("/api/local/novel-comments submit: response did not enter pending")
    check_headers("/api/local/novel-comments submit", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        base_comment_payload,
        origin=local_origin,
    )
    if status != 409:
        errors.append(f"/api/local/novel-comments duplicate: expected 409, got {status}")
    check_headers("/api/local/novel-comments duplicate", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        {
            **base_comment_payload,
            "body": "两个链接必须被拒绝：https://example.com 与 https://example.org",
            "session_id": "00000000-0000-4000-8000-000000000013",
        },
        origin=local_origin,
    )
    if status != 400:
        errors.append(f"/api/local/novel-comments link limit: expected 400, got {status}")
    check_headers("/api/local/novel-comments link limit", headers, errors)

    status, headers, body = post_json(
        args.base_url,
        "/api/local/novel-comments",
        {
            **base_comment_payload,
            "display_name": "<img src=x onerror=alert(1)>",
            "body": xss_comment_body,
            "session_id": xss_comment_session,
        },
        origin=local_origin,
    )
    xss_comment_id = ""
    if status != 201:
        errors.append(f"/api/local/novel-comments XSS payload: expected 201, got {status} ({body!r})")
    else:
        try:
            xss_submission = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"/api/local/novel-comments XSS payload: invalid JSON ({exc})")
            xss_submission = {}
        xss_comment_id = str(xss_submission.get("id", ""))
        if xss_submission.get("status") != "pending" or not xss_comment_id:
            errors.append("/api/local/novel-comments XSS payload: response did not enter pending")
    check_headers("/api/local/novel-comments XSS payload", headers, errors)

    status, headers, body = fetch(
        args.base_url,
        f"/api/local/novel-comments?chapter={comment_chapter}",
    )
    if status != 200:
        errors.append(f"/api/local/novel-comments pending visibility: expected 200, got {status}")
    else:
        try:
            pending_public_comments = json.loads(body).get("comments", [])
        except json.JSONDecodeError as exc:
            errors.append(f"/api/local/novel-comments pending visibility: invalid JSON ({exc})")
            pending_public_comments = []
        if pending_public_comments:
            errors.append("/api/local/novel-comments: pending comments leaked publicly")
    check_headers("/api/local/novel-comments pending visibility", headers, errors)

    status, headers, _body = fetch(
        args.base_url,
        "/api/local/novel-comments/inbox",
    )
    if status != 401:
        errors.append(f"/api/local/novel-comments/inbox without token: expected 401, got {status}")
    check_headers("/api/local/novel-comments/inbox without token", headers, errors)

    status, headers, _body = post_json(
        args.base_url,
        "/api/local/novel-comments/moderate",
        {
            "comment_id": submitted_comment_id
            or "cmt-1700000000000-0123456789",
            "action": "approved",
        },
        origin=local_origin,
    )
    if status != 401:
        errors.append(f"/api/local/novel-comments/moderate without token: expected 401, got {status}")
    check_headers("/api/local/novel-comments/moderate without token", headers, errors)

    if args.admin_token_file is None:
        errors.append("missing --admin-token-file for private inbox smoke test")
    else:
        try:
            admin_token = args.admin_token_file.read_text(encoding="utf-8").strip()
        except OSError as exc:
            errors.append(f"unable to read local admin token: {exc}")
            admin_token = ""
        status, headers, body = fetch_with_headers(
            args.base_url,
            "/api/local/inbox",
            {"Authorization": f"Bearer {admin_token}"},
        )
        if status != 200:
            errors.append(f"/api/local/inbox with token: expected 200, got {status}")
        else:
            try:
                inbox = json.loads(body)
            except json.JSONDecodeError as exc:
                errors.append(f"/api/local/inbox: invalid JSON ({exc})")
                inbox = {}
            messages = inbox.get("messages", [])
            recent_activity = inbox.get("recent_activity", [])
            if (
                len(messages) != 1
                or "session_hash" in messages[0]
                or messages[0].get("contact") != "private@example.invalid"
            ):
                errors.append("/api/local/inbox: authenticated projection is malformed")
            if (
                len(recent_activity) != 1
                or "session_hash" in recent_activity[0]
                or recent_activity[0].get("session_label") != "S01"
                or recent_activity[0].get("path") != "/privacy"
            ):
                errors.append("/api/local/inbox: recent activity projection is malformed")
        check_headers("/api/local/inbox with token", headers, errors)

        status, headers, body = fetch_with_headers(
            args.base_url,
            "/api/local/novel-comments/inbox",
            {"Authorization": f"Bearer {admin_token}"},
        )
        if status != 200:
            errors.append(f"/api/local/novel-comments/inbox with token: expected 200, got {status}")
        else:
            try:
                comment_inbox = json.loads(body)
            except json.JSONDecodeError as exc:
                errors.append(f"/api/local/novel-comments/inbox: invalid JSON ({exc})")
                comment_inbox = {}
            inbox_comments = comment_inbox.get("comments", [])
            inbox_ids = {
                comment.get("id")
                for comment in inbox_comments
                if isinstance(comment, dict)
            }
            if (
                len(inbox_comments) != 2
                or submitted_comment_id not in inbox_ids
                or xss_comment_id not in inbox_ids
                or any(
                    not isinstance(comment, dict)
                    or comment.get("status") != "pending"
                    or "session_hash" in comment
                    for comment in inbox_comments
                )
            ):
                errors.append("/api/local/novel-comments/inbox: pending projection is malformed")
        check_headers("/api/local/novel-comments/inbox with token", headers, errors)

        for comment_id in (submitted_comment_id, xss_comment_id):
            if not comment_id:
                continue
            status, headers, body = post_json(
                args.base_url,
                "/api/local/novel-comments/moderate",
                {"comment_id": comment_id, "action": "approved"},
                origin=local_origin,
                request_headers={"Authorization": f"Bearer {admin_token}"},
            )
            if status != 200:
                errors.append(
                    f"/api/local/novel-comments/moderate {comment_id}: expected 200, got {status} ({body!r})"
                )
            else:
                try:
                    moderation = json.loads(body)
                except json.JSONDecodeError as exc:
                    errors.append(f"/api/local/novel-comments/moderate: invalid JSON ({exc})")
                    moderation = {}
                if moderation.get("status") != "approved":
                    errors.append(f"/api/local/novel-comments/moderate: approval was not recorded")
            check_headers("/api/local/novel-comments/moderate with token", headers, errors)

        status, headers, body = fetch(
            args.base_url,
            f"/api/local/novel-comments?chapter={comment_chapter}",
        )
        if status != 200:
            errors.append(f"/api/local/novel-comments approved GET: expected 200, got {status}")
        else:
            try:
                approved_comments = json.loads(body).get("comments", [])
            except json.JSONDecodeError as exc:
                errors.append(f"/api/local/novel-comments approved GET: invalid JSON ({exc})")
                approved_comments = []
            approved_ids = {
                comment.get("id")
                for comment in approved_comments
                if isinstance(comment, dict)
            }
            if (
                len(approved_comments) != 2
                or submitted_comment_id not in approved_ids
                or xss_comment_id not in approved_ids
                or any(
                    not isinstance(comment, dict)
                    or comment.get("status") != "approved"
                    or "session_hash" in comment
                    for comment in approved_comments
                )
            ):
                errors.append("/api/local/novel-comments approved GET: public projection is malformed")
            xss_projected = next(
                (
                    comment
                    for comment in approved_comments
                    if isinstance(comment, dict)
                    and comment.get("id") == xss_comment_id
                ),
                {},
            )
            if (
                "<script>" in str(xss_projected.get("body", ""))
                or "<img" in str(xss_projected.get("display_name", ""))
                or "&lt;script&gt;" not in str(xss_projected.get("body", ""))
                or "&lt;img" not in str(xss_projected.get("display_name", ""))
            ):
                errors.append("/api/local/novel-comments: XSS payload was not safely escaped")
        check_headers("/api/local/novel-comments approved GET", headers, errors)

        if xss_comment_id:
            status, headers, body = post_json(
                args.base_url,
                "/api/local/novel-comments/moderate",
                {"comment_id": xss_comment_id, "action": "withdrawn"},
                origin=local_origin,
                request_headers={"Authorization": f"Bearer {admin_token}"},
            )
            if status != 200:
                errors.append(
                    f"/api/local/novel-comments approved→withdrawn: expected 200, got {status} ({body!r})"
                )
            check_headers(
                "/api/local/novel-comments approved→withdrawn",
                headers,
                errors,
            )

        status, headers, body = fetch(
            args.base_url,
            f"/api/local/novel-comments?chapter={comment_chapter}",
        )
        try:
            after_withdrawal = (
                json.loads(body).get("comments", []) if status == 200 else []
            )
        except json.JSONDecodeError:
            after_withdrawal = []
        if (
            status != 200
            or len(after_withdrawal) != 1
            or after_withdrawal[0].get("id") != submitted_comment_id
        ):
            errors.append(
                "/api/local/novel-comments: withdrawn comment remained public"
            )
        check_headers(
            "/api/local/novel-comments after withdrawal", headers, errors
        )

        other_chapter_payload = {
            "chapter_id": "chapter-02",
            "display_name": "Chapter isolation",
            "body": "这条评论只应出现在第二章。",
            "website": "",
            "consent": True,
            "session_id": "00000000-0000-4000-8000-000000000014",
        }
        status, headers, body = post_json(
            args.base_url,
            "/api/local/novel-comments",
            other_chapter_payload,
            origin=local_origin,
        )
        try:
            other_comment_id = (
                str(json.loads(body).get("id", "")) if status == 201 else ""
            )
        except json.JSONDecodeError:
            other_comment_id = ""
        if status != 201 or not other_comment_id:
            errors.append(
                f"/api/local/novel-comments chapter isolation submit: expected 201, got {status}"
            )
        if other_comment_id:
            status, headers, body = post_json(
                args.base_url,
                "/api/local/novel-comments/moderate",
                {"comment_id": other_comment_id, "action": "approved"},
                origin=local_origin,
                request_headers={"Authorization": f"Bearer {admin_token}"},
            )
            if status != 200:
                errors.append(
                    f"/api/local/novel-comments chapter isolation approve: expected 200, got {status} ({body!r})"
                )
        status, headers, body = fetch(
            args.base_url,
            "/api/local/novel-comments?chapter=chapter-02",
        )
        try:
            chapter_two_comments = (
                json.loads(body).get("comments", []) if status == 200 else []
            )
        except json.JSONDecodeError:
            chapter_two_comments = []
        if (
            status != 200
            or len(chapter_two_comments) != 1
            or chapter_two_comments[0].get("id") != other_comment_id
            or chapter_two_comments[0].get("chapter_id") != "chapter-02"
        ):
            errors.append(
                "/api/local/novel-comments: comments were not isolated by chapter"
            )
        check_headers(
            "/api/local/novel-comments chapter isolation", headers, errors
        )

        # Add a large, valid pending fixture directly to the isolated private
        # runtime. The repository must page pending comments instead of hiding
        # older ones behind processed history.
        comment_log = args.admin_token_file.parent / "chapter-comments.ndjson"
        try:
            with comment_log.open("a", encoding="utf-8") as stream:
                for index in range(301):
                    occurred = f"2026-07-26T01:{index // 60:02d}:{index % 60:02d}.000Z"
                    fixture_id = f"cmt-{1800000000000 + index}-{index:010x}"
                    stream.write(
                        json.dumps(
                            {
                                "type": "novel_comment_submission",
                                "id": fixture_id,
                                "occurred_at": occurred,
                                "chapter_id": "chapter-01",
                                "display_name": "Pagination fixture",
                                "body": f"待审核分页夹具 {index + 1}",
                                "session_hash": "0" * 24,
                                "fingerprint": hashlib.sha256(
                                    fixture_id.encode()
                                ).hexdigest(),
                                "status": "pending",
                                "consent_version": "novel-comments-local-1",
                            },
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
        except OSError as exc:
            errors.append(f"unable to append comment pagination fixture: {exc}")

        status, headers, body = fetch_with_headers(
            args.base_url,
            "/api/local/novel-comments/inbox?status=pending&cursor=0&limit=100",
            {"Authorization": f"Bearer {admin_token}"},
        )
        try:
            pending_page = json.loads(body) if status == 200 else {}
        except json.JSONDecodeError:
            pending_page = {}
        if (
            status != 200
            or pending_page.get("total_pending") != 301
            or len(pending_page.get("comments", [])) != 100
            or pending_page.get("next_cursor") != "100"
            or pending_page.get("truncated") is not True
        ):
            errors.append(
                "/api/local/novel-comments/inbox: 301 pending records were not safely paginated"
            )
        check_headers(
            "/api/local/novel-comments/inbox pagination", headers, errors
        )

        # A malformed moderation line must fail closed: previously approved
        # comments disappear until the owner repairs the local audit log.
        event_log = (
            args.admin_token_file.parent / "chapter-comment-events.ndjson"
        )
        try:
            with event_log.open("a", encoding="utf-8") as stream:
                stream.write("{malformed moderation fixture\n")
        except OSError as exc:
            errors.append(f"unable to append malformed moderation fixture: {exc}")
        status, headers, body = fetch(
            args.base_url,
            f"/api/local/novel-comments?chapter={comment_chapter}",
        )
        if (
            status != 503
            or b"comment_log_unhealthy" not in body
            or submitted_comment_id.encode() in body
        ):
            errors.append(
                "/api/local/novel-comments: damaged event log did not fail closed"
            )
        check_headers(
            "/api/local/novel-comments fail closed", headers, errors
        )

        status, headers, body = fetch_with_headers(
            args.base_url,
            "/api/local/corpus-hits?entity=P-001",
            {"Authorization": f"Bearer {admin_token}"},
        )
        if status not in {200, 404}:
            errors.append(
                f"/api/local/corpus-hits with token: expected 200 or isolated-runtime 404, got {status}"
            )
        if ABSOLUTE_MACOS_HOME_MARKER in body or b"absolute_path" in body:
            errors.append("/api/local/corpus-hits with token leaked an absolute local path")
        if status == 200:
            try:
                corpus_projection = json.loads(body)
            except json.JSONDecodeError as exc:
                errors.append(f"/api/local/corpus-hits: invalid JSON ({exc})")
                corpus_projection = {}
            if corpus_projection.get("creates_claims_or_edges") is not False:
                errors.append("/api/local/corpus-hits: locator index can create claims or edges")
            for hit in corpus_projection.get("hits", []):
                if (
                    not isinstance(hit, dict)
                    or hit.get("access_tier") != "P1-owner-only"
                    or hit.get("creates_claim") is not False
                    or any(
                        key in hit
                        for key in ("path", "absolute_path", "content", "family_text")
                    )
                ):
                    errors.append("/api/local/corpus-hits: owner projection exposes forbidden fields")
                    break
        check_headers("/api/local/corpus-hits with token", headers, errors)

    if errors:
        print(json.dumps({"status": "FAIL", "errors": errors}, ensure_ascii=False, indent=2))
        return 1
    print(
        json.dumps(
            {
                "status": "PASS",
                "pages": len(PAGES),
                "json_endpoints": len(JSON_ENDPOINTS),
                "local_runtime_endpoints": 8,
                "novel_pages_hashed": 182,
                "novel_responsive_pages_hashed": 182,
                "novel_numbered_chapters": 32,
                "graph_counts": EXPECTED_GRAPH_COUNTS,
                "static_assets": len(EXPECTED_STATIC_ASSETS),
                "unique_titles": len(set(titles.values())),
                "research_snapshot_id": expected_meta.get("research_snapshot_id"),
                "generation_id": expected_meta.get("generation_id"),
                "generation_manifest_sha256": expected_meta.get("generation_manifest_sha256"),
                "exporter_version": expected_meta.get("exporter_version"),
                "cache_policy": "private, no-store",
                "robots_policy": "noindex, nofollow; Disallow: /",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
