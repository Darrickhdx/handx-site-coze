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

from graph_wiki_contract import EXPECTED_COUNTS as EXPECTED_GRAPH_COUNTS


PAGES = [
    "/",
    "/discover",
    "/discover/1936-pingdiquan",
    "/discover/same-name",
    "/discover/ai-family-history",
    "/evidence",
    "/evidence/pingdiquan-1936",
    "/evidence/chart-1942",
    "/evidence/beiping-boundary",
    "/novel",
    "/novel/read",
    "/novel/editions",
    "/novel/companion",
    "/novel/chapter/prologue",
    "/novel/chapter/chapter-01",
    "/novel/chapter/chapter-19",
    "/studio",
    "/studio/diagnosis",
    "/studio/comments",
    "/studio/migrations",
    "/studio/novel-migration",
    "/studio/media",
    "/studio/research-log",
    "/studio/rights-ledger",
    "/studio/data-versions",
    "/sukaiyuan",
    "/sukaiyuan/dossier",
    "/person",
    "/timeline",
    "/persons",
    "/persons/P-001",
    "/persons/P-005",
    "/persons/P-006",
    "/persons/P-007",
    "/persons/P-010",
    "/persons/P-017",
    "/events",
    "/archives",
    "/archives/SRC-013",
    "/archives/SRC-103",
    "/missions",
    "/missions/A001",
    "/missions/A015",
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
    "/ai",
    "/rights",
    "/privacy",
    "/insights",
]
NOVEL_MANIFEST = "/novel/hero-wuming/novel-manifest.json"
NOVEL_PINS = Path(__file__).resolve().parents[1] / "src" / "data" / "novel-edition-pins.json"


def _served_novel_pin() -> dict:
    """The edition currently rendered into public/novel, from the pin file.

    Written here as literals until V1.5 replaced V0.3, at which point every one
    of them reported a defect that did not exist.
    """
    return json.loads(NOVEL_PINS.read_text(encoding="utf-8"))["served_edition"]


_SERVED_NOVEL = _served_novel_pin()
EXPECTED_NOVEL_EDITION_ID = _SERVED_NOVEL["edition_id"]
EXPECTED_NOVEL_PAGES = _SERVED_NOVEL["structure"]["pages"]
EXPECTED_NOVEL_CHAPTERS = _SERVED_NOVEL["structure"]["numbered_chapters"]
EXPECTED_NOVEL_COMMENTABLE = _SERVED_NOVEL["structure"]["commentable_sections"]
EXPECTED_NOVEL_SOURCE_HASHES = {
    "pdf_sha256": _SERVED_NOVEL["sha256"]["pdf"],
    "docx_sha256": _SERVED_NOVEL["sha256"]["docx"],
}
EXPECTED_NOVEL_LOCAL_ONLY_PAGES = set(_SERVED_NOVEL.get("local_only_image_pages", []))
EXPECTED_NOVEL_RESPONSIVE_WIDTH = _SERVED_NOVEL["structure"]["responsive_width"]
EXPECTED_NOVEL_RESPONSIVE_HEIGHT = _SERVED_NOVEL["structure"]["responsive_height"]
EXPECTED_NOVEL_SECTIONS = _SERVED_NOVEL["structure"]["sections"]
EXPECTED_NOVEL_VERSION = f"V{_SERVED_NOVEL['version']}"
FORBIDDEN_NOVEL_RAW_SOURCES = {
    "/novel/hero-wuming/英雄无名V1.5-印刷版.pdf",
    "/novel/hero-wuming/英雄无名V1.5-可编辑.docx",
    "/novel/hero-wuming/英雄无名V1.5-可审阅.md",
    "/novel/hero-wuming/source.pdf",
    "/novel/hero-wuming/source.docx",
    "/novel/hero-wuming/hero-wuming.pdf",
    "/novel/hero-wuming/hero-wuming.docx",
}
GRAPH_MANIFEST = "/data/graph/manifest.json"
ARCHIVE_MISSIONS_DATA = "/data/archive-missions.json"
SITE_STATUS_DATA = "/data/site-status.json"
GRAPH_OUTPUTS = {
    "audit-graph.json": ("nodes", 229, "edges", 127),
    "legacy-graph.json": (
        "nodes",
        EXPECTED_GRAPH_COUNTS["legacy_nodes"],
        "edges",
        EXPECTED_GRAPH_COUNTS["legacy_edges"],
    ),
    "legacy-crosswalk.json": (
        "records",
        EXPECTED_GRAPH_COUNTS["crosswalk_records"],
        None,
        None,
    ),
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
    "/archives/SRC-103",
    "/topics",
    "/topics/dong-yan-su-evidence-visibility",
    "/studio/media",
    "/studio/diagnosis",
    "/sukaiyuan/dossier",
    "/persons/P-001",
    "/persons/P-005",
    "/persons/P-006",
    "/persons/P-007",
    "/persons/P-010",
    "/persons/P-017",
    "/novel/companion",
    "/evidence/pingdiquan-1936",
    "/evidence/chart-1942",
    "/evidence/beiping-boundary",
    "/missions",
    "/missions/A001",
    "/missions/A015",
    "/studio/research-log",
    "/studio/rights-ledger",
    "/studio/data-versions",
}
SITE_RESEARCH = Path(__file__).resolve().parents[1] / "src" / "data" / "research.json"
SITE_NOVEL_EDITIONS = Path(__file__).resolve().parents[1] / "src" / "data" / "novel-editions.json"


def candidate_rights_coverage() -> str:
    """Figure-rights coverage the migration page must display, e.g. "38/62".

    Read from the registry rather than written literally: a hardcoded "26/47"
    here would go stale the next time the book is re-rendered, and would then
    report a page defect that does not exist.
    """
    registry = json.loads(SITE_NOVEL_EDITIONS.read_text(encoding="utf-8"))
    candidate = next(
        edition
        for edition in registry["editions"]
        if edition.get("status") == "active_candidate_not_served"
    )
    return f"{candidate['rights_ledger_records']}/{candidate['figure_plates']}"
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
    if headers.get("x-content-type-options", "").lower() != "nosniff":
        errors.append(f"{path}: X-Content-Type-Options is not nosniff")
    if headers.get("x-frame-options", "").upper() != "DENY":
        errors.append(f"{path}: X-Frame-Options is not DENY")
    if headers.get("referrer-policy", "").lower() != "no-referrer":
        errors.append(f"{path}: Referrer-Policy is not no-referrer")
    if headers.get("cross-origin-opener-policy", "").lower() != "same-origin":
        errors.append(f"{path}: Cross-Origin-Opener-Policy is not same-origin")
    if headers.get("cross-origin-resource-policy", "").lower() != "same-origin":
        errors.append(f"{path}: Cross-Origin-Resource-Policy is not same-origin")
    permissions = headers.get("permissions-policy", "").lower()
    if any(marker not in permissions for marker in ("camera=()", "microphone=()", "payment=()")):
        errors.append(f"{path}: Permissions-Policy is incomplete ({permissions!r})")
    csp = headers.get("content-security-policy", "").lower()
    if any(
        marker not in csp
        for marker in (
            "default-src 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "connect-src 'self'",
        )
    ):
        errors.append(f"{path}: Content-Security-Policy is incomplete ({csp!r})")
    if "x-powered-by" in headers:
        errors.append(f"{path}: X-Powered-By must be removed")


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
        if path == "/" and any(
            route not in html for route in ['/ai', '/studio/diagnosis', '/sukaiyuan']
        ):
            errors.append("/: three-way reader intent routing is incomplete")
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
        if path == "/sukaiyuan/dossier" and (
            "蘇開元与蘇凱元" not in html
            or "开始比对 6 份材料" not in html
            or "高置信候选，尚未闭环" not in html
            or "选择不会改变史料状态" not in html
            or "不是已经确认的完整生平" not in html
            or "SRC-103" not in html
            or "SRC-013" not in html
        ):
            errors.append("/sukaiyuan/dossier: identity interaction or evidence boundary is incomplete")
        if path == "/persons" and (
            "他们不是配角" not in html
            or "李英夫" not in html
            or "李大超" not in html
            or "朱自清" not in html
            or "乔培新" not in html
            or "傅作义" not in html
            or "无伪造历史肖像" not in html
        ):
            errors.append("/persons: curated ensemble, people, or portrait boundary is incomplete")
        if path.startswith("/persons/P-") and (
            'data-publication-status="local_review_only"' not in html
            or "本地审阅 · 非完整传记" not in html
            or "材料如何把他们放在一起" not in html
            or "独立来源按" not in html
        ):
            errors.append(f"{path}: curated dossier publication or relation boundary is incomplete")
        if path.startswith("/persons/P-"):
            expected_person_edges = {
                "/persons/P-001": set(),
                "/persons/P-005": {"REL-033", "REL-034"},
                "/persons/P-006": {"REL-010"},
                "/persons/P-007": set(),
                "/persons/P-010": {"REL-076", "REL-077", "REL-080", "REL-108", "REL-111"},
                "/persons/P-017": {"REL-124"},
            }
            expected_person_edge_contracts = {
                "/persons/P-001": set(),
                "/persons/P-005": {
                    "REL-033|needs_archive|CL-040",
                    "REL-034|needs_archive|CL-041",
                },
                "/persons/P-006": {"REL-010|working_verified|CL-013"},
                "/persons/P-007": set(),
                "/persons/P-010": {
                    "REL-076|needs_archive|CL-079",
                    "REL-077|needs_archive|CL-080",
                    "REL-080|needs_archive|CL-083",
                    "REL-108|needs_archive|CL-132",
                    "REL-111|needs_archive|CL-137",
                },
                "/persons/P-017": {"REL-124|provisional|CL-170"},
            }
            rendered_person_edges = set(re.findall(r'data-edge-id="([^"]+)"', html))
            rendered_person_edge_contracts = set(
                re.findall(r'data-edge-contract="([^"]+)"', html)
            )
            if rendered_person_edges != expected_person_edges[path]:
                errors.append(
                    f"{path}: rendered relation set {sorted(rendered_person_edges)} "
                    f"does not match reviewed set {sorted(expected_person_edges[path])}"
                )
            if rendered_person_edge_contracts != expected_person_edge_contracts[path]:
                errors.append(
                    f"{path}: rendered relation contracts {sorted(rendered_person_edge_contracts)} "
                    f"do not match reviewed contracts {sorted(expected_person_edge_contracts[path])}"
                )
            if re.search(r'<img(?:\s|>)', html, re.I):
                errors.append(f"{path}: an unreviewed historical portrait or image entered the person dossier")
            if re.search(r'data-source-tier="[DE]"', html):
                errors.append(f"{path}: D/E-tier material entered a curated person dossier")
            for forbidden_person_copy in (
                "allegedly warned",
                "encountered by",
                "had a contemporaneous shared organizational anchor with",
                "was reported to have deliberately allowed",
                "南街青石巷",
            ):
                if forbidden_person_copy in html:
                    errors.append(f"{path}: unsafe or untranslated person copy remains: {forbidden_person_copy}")
        if path == "/persons/P-005" and (
            'data-person-dossier="P-005"' not in html
            or "最重要的参与者证词" not in html
            or "公报可核的军职与军阶" not in html
            or "李广荣" not in html
            or "回忆中的三组苏开元交集" not in html
            or "回忆／待档案关系线索，不计作已证真人交集" not in html
            or "《国民政府公报》第1075号" not in html
        ):
            errors.append("/persons/P-005: witness dossier or attributed-relation boundary is incomplete")
        if path == "/persons/P-017" and (
            'data-person-dossier="P-017"' not in html
            or "同名迷雾中的绥远军人" not in html
            or "同名人物必须分流" not in html
            or "CL-051" not in html
            or "CL-072" not in html
            or "P-020" not in html
            or "同一份编成表中的并列记录，不计作私人关系" not in html
        ):
            errors.append("/persons/P-017: homonym firewall or provisional-relation boundary is incomplete")
        if path == "/persons/P-010" and (
            'data-person-dossier="P-010"' not in html
            or "被捕与脱险的多版本叙述" not in html
            or "1911／1912" not in html
            or "上下文主张（不转移为本人生平）" not in html
            or "回忆／待档案关系线索，不计作已证真人交集" not in html
        ):
            errors.append("/persons/P-010: conflicting event versions or context boundary is incomplete")
        if path == "/persons/P-006" and (
            'data-person-dossier="P-006"' not in html
            or "1936 年的记录者" not in html
            or "《绥行纪略》" not in html
            or "同期文献中的一次共同出现，不等于长期私交" not in html
        ):
            errors.append("/persons/P-006: recorder role or verified-relation boundary is incomplete")
        if path == "/persons/P-001" and (
            "CL-181" not in html
            or "苏凯原（P-003）" not in html
            or "康原（P-004）" not in html
            or "1977 年校补名簿" not in html
        ):
            errors.append("/persons/P-001: identity-carrier distinction or alias firewall is incomplete")
        if path == "/sukaiyuan" and (
            "一个人身后，是一群人" not in html
            or '/persons/P-005' not in html
            or '/persons/P-017' not in html
        ):
            errors.append("/sukaiyuan: ensemble gateway is incomplete")
        if path == "/wiki/P-005" and "先读人物故事版" not in html:
            errors.append("/wiki/P-005: curated story dossier gateway is missing")
        if path == "/novel" and (
            str(EXPECTED_NOVEL_PAGES) not in html
            or str(EXPECTED_NOVEL_CHAPTERS) not in html
            or "水印" not in html
            or "不能阻止截图" not in html
        ):
            errors.append("/novel: full-book count or honest watermark boundary is missing")
        if path == "/novel/chapter/chapter-01" and (
            "第一章" not in html
            or "读者意见" not in html
            or "审核" not in html
            or f"{EXPECTED_NOVEL_EDITION_ID}--chapter-01" not in html
            or "真实与虚构伴读" not in html
            or "pingdiquan-1936" not in html
        ):
            errors.append("/novel/chapter/chapter-01: chapter reader or moderated discussion notice is missing")
        if path == "/novel/chapter/chapter-19" and (
            "第十九章" not in html
            or "真实与虚构伴读" not in html
            or "chart-1942" not in html
            or "研究旁注，不认证本场" not in html
        ):
            errors.append("/novel/chapter/chapter-19: evidence companion entry is missing")
        if path == "/novel/editions" and (
            "换一本书" not in html
            or "V1.2" not in html
            or "V1.3" not in html
            or "冻结对照，不提供阅读" not in html
            or "正在编辑，尚未接入" not in html
            or "26" not in html
            or "47" not in html
            or "并行导入" not in html
        ):
            errors.append("/novel/editions: edition states or atomic-switch boundary is incomplete")
        if path == "/novel/companion" and (
            "故事从哪里来" not in html
            or EXPECTED_NOVEL_VERSION not in html
            or "SRC-013" not in html
            or "SRC-103" not in html
            or "不能替小说证明" not in html
            or "展开故事证据链" not in html
        ):
            errors.append("/novel/companion: source companion or literary boundary is incomplete")
        if path == "/evidence" and (
            "读完故事" not in html
            or "来源伴读" not in html
            or "研究旁注" not in html
            or "主动停止链" not in html
            or "展开四步证据链" not in html
        ):
            errors.append("/evidence: story evidence trail index is incomplete")
        if path == "/evidence/pingdiquan-1936" and (
            'data-evidence-mode="scene_companion"' not in html
            or "CL-013" not in html
            or "CL-014" not in html
            or "SRC-013" not in html
            or "scene_eligible=false" not in html
            or "可以说" not in html
            or "不能说" not in html
        ):
            errors.append("/evidence/pingdiquan-1936: bounded source companion is incomplete")
        if path == "/evidence/chart-1942" and (
            'data-evidence-mode="research_note"' not in html
            or "CL-167" not in html
            or "CL-168" not in html
            or "SRC-095" not in html
            or "不认证本场" not in html
            or "不能证明延安行程" not in html
        ):
            errors.append("/evidence/chart-1942: document claim and person-attribution boundary are incomplete")
        if path == "/evidence/beiping-boundary" and (
            'data-evidence-mode="blocked"' not in html
            or "没有可用主张" not in html
            or "不得入史" not in html
            or "不生成主张" not in html
        ):
            errors.append("/evidence/beiping-boundary: stop boundary is incomplete")
        # The reading-moment redesign translated the viewer's technical headings
        # into reader language; the boundaries themselves are unchanged. These
        # assert the current wording of the same three properties: a viewer is
        # mounted, the excerpt is labelled local-review-only, and there is a path
        # back to the story.
        if path == "/archives/SRC-013" and (
            'data-source-viewer="SRC-013"' not in html
            or "读这一页" not in html
            or "本地审阅局部" not in html
            or "从故事来到这里" not in html
        ):
            errors.append("/archives/SRC-013: source viewer or story return path is incomplete")
        # SRC-103 has no site-hosted scan, so the page must say so and still hand
        # the reader a route back to the holding institution.
        if path == "/archives/SRC-103" and (
            'data-source-viewer="SRC-103"' not in html
            or "这份材料请回到原馆阅读" not in html
            or "原馆" not in html
        ):
            errors.append("/archives/SRC-103: no-copy viewer boundary is incomplete")
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
            or "不是未经确认的自动发布" not in html
            or "不保存令牌" not in html
            or "已通过：可以生成本地审稿包" not in html
            or "主张、来源定位和权利护照均可追溯" not in html
            or "个独立作品家族计权" not in html
            or "不同载体不重复增加证据数" not in html
            or "问题、解释与文学内容必须显式标注" not in html
            or "source_backed" not in html
            or "must_not_deploy=true" not in html
            or "external_egress=deny" not in html
        ):
            errors.append("/studio/media: review-only distribution gate is incomplete")
        if path == "/studio/rights-ledger" and (
            "护照总数" not in html
            or "208" not in html
            or "权利待核" not in html
            or "13" not in html
            or "禁止媒体复用" not in html
            or "22" not in html
            or "可以公开" not in html
            or "public_ready=false" not in html
            or "must_not_deploy=true" not in html
            or "permission_pending" not in html
        ):
            errors.append("/studio/rights-ledger: rights passport counts or fail-closed gates are incomplete")
        if path == "/studio/data-versions" and (
            'data-status-contract="handx-site-status-1.0"' not in html
            or "历史完成率：不计算" not in html
            or "文件上传" not in html
            or "模型处理" not in html
            or "向外传输" not in html
            or "平台自动发布" not in html
            or "公网部署未授权" not in html
            or "逐项权利护照" not in html
        ):
            errors.append("/studio/data-versions: version, service, or evidence-boundary contract is incomplete")
        if path == "/studio/migrations" and (
            "图谱迁移" not in html
            or "隔离门禁正常" not in html
            or "逐项阻断，公开泄漏为 0" not in html
            or "不发送给浏览器" not in html
        ):
            errors.append("/studio/migrations: migration quarantine summary is incomplete")
        if path == "/studio/novel-migration" and (
            "小说版本迁移" not in html
            or candidate_rights_coverage() not in html
            or "BLOCKED" not in html
            or "candidate_static_pages_generated" not in html
            or "must_not_deploy=true" not in html
        ):
            errors.append("/studio/novel-migration: candidate gate summary is incomplete")
        if path == "/studio/diagnosis":
            required_diagnostic_markers = [
                "先别上传原件",
                "开始 3 分钟自评",
                "不保存答案",
                "资料准备度诊断，不是历史事实鉴定",
                "当前仅开放小范围需求访谈",
                "data-family-history-diagnostic",
            ]
            if any(marker not in html for marker in required_diagnostic_markers):
                errors.append("/studio/diagnosis: browser-only diagnostic contract is incomplete")
            diagnostic_marker = html.find("data-family-history-diagnostic")
            diagnostic_start = html.rfind("<section", 0, diagnostic_marker)
            diagnostic_end = html.find("</section>", diagnostic_marker)
            diagnostic_html = (
                html[diagnostic_start:diagnostic_end]
                if diagnostic_marker >= 0 and diagnostic_start >= 0 and diagnostic_end >= 0
                else html
            )
            forbidden_diagnostic_markers = [
                "<input",
                "<textarea",
                'type=\"file\"',
                "/api/local/",
                "data-amplitude",
            ]
            if any(marker in diagnostic_html for marker in forbidden_diagnostic_markers):
                errors.append("/studio/diagnosis: contains a forbidden collection or analytics surface")
        if path == "/studio" and (
            "/studio/diagnosis" not in html
            or "正式收费服务尚未开放" not in html
        ):
            errors.append("/studio: diagnostic entry or unpaid-service boundary is missing")
        if path == "/ai" and (
            "/studio/diagnosis" not in html
            or "AI 家族史实验室" not in html
        ):
            errors.append("/ai: family-history method bridge is missing")
        if path == "/discover/ai-family-history" and (
            "/studio/diagnosis#start" not in html
            or "不上传原件，先判断从哪一步开始" not in html
        ):
            errors.append("/discover/ai-family-history: diagnostic CTA is missing")
        if path == "/privacy" and (
            "浏览器内自评" not in html
            or "刷新或退出即清空答案" not in html
            or "不调用外部模型" not in html
        ):
            errors.append("/privacy: browser-only diagnostic data boundary is missing")
        if path == "/missions":
            required_mission_markers = [
                "一份原件",
                "调查方向拆成可以行动",
                "已经定位到馆藏号、题名或物理帧",
                "已经取得并核读",
                "研究议程 · 非调查结论 · 已取得并核读 =",
                "当前全部任务仍在行动前准备或条件等待阶段",
                "线索接收尚未开放",
                "不会提交、保存、抓取网址或创建事实",
            ]
            if any(marker not in html for marker in required_mission_markers):
                errors.append("/missions: public pre-execution mission contract is incomplete")
            for forbidden_field in (
                'exact_request',
                'precondition',
                'next_action',
                'target_window',
                'ownerRaw',
            ):
                if forbidden_field in html:
                    errors.append(f"/missions: owner-only field leaked into public HTML ({forbidden_field})")
        if path == "/missions/A001" and (
            "尚未取得并核读目标原件" not in html
            or "研究议程 · 非调查结论 · 已取得并核读 = 0" not in html
            or "拿到什么才算完成" not in html
            or "即使取得，也不能自动证明什么" not in html
            or "locator_intake_not_open" not in html
            or "creates_claim=false" not in html
            or "不提交、不保存、不抓取网址" not in html
        ):
            errors.append("/missions/A001: task boundary or browser-only locator draft is incomplete")
        if path == "/missions/A015" and (
            "同一作品的不同载体，不重复计算证据" not in html
            or html.count("same-work") > 0
            or "多项申请不等于多条独立证据" not in html
            or "不会因为载体更多就增加独立来源数" not in html
        ):
            errors.append("/missions/A015: same-work carrier independence boundary is incomplete")
        if path == "/studio/research-log" and (
            "史料行动执行台" not in html
            or "本机私密基线" not in html
            or "不是历史研究完成率" not in html
            or "不写入 localStorage、sessionStorage、URL 或页面日志" not in html
            or "管理员令牌只停留在当前页面内存" not in html
        ):
            errors.append("/studio/research-log: owner-only read-only mission console contract is incomplete")
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

    status, headers, body = fetch(args.base_url, ARCHIVE_MISSIONS_DATA)
    if status != 200:
        errors.append(f"{ARCHIVE_MISSIONS_DATA}: expected 200, got {status}")
    else:
        check_headers(ARCHIVE_MISSIONS_DATA, headers, errors)
        try:
            mission_payload = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{ARCHIVE_MISSIONS_DATA}: invalid JSON ({exc})")
            mission_payload = {}
        mission_meta = mission_payload.get("_meta", {})
        mission_counts = mission_meta.get("counts", {}) if isinstance(mission_meta, dict) else {}
        missions = mission_payload.get("missions", [])
        if (
            not isinstance(mission_meta, dict)
            or mission_meta.get("schema_version") != "archive-missions-public-v1"
            or mission_meta.get("must_not_deploy") is not True
            or mission_meta.get("deployment_authorized") is not False
            or mission_meta.get("evidence_boundary") != "execution_progress_not_historical_completion"
            or mission_meta.get("lead_intake_status") != "browser_draft_only_no_submission_endpoint"
            or not isinstance(mission_counts, dict)
            or mission_counts.get("missions") != 33
            or mission_counts.get("highlighted") != 7
            or mission_counts.get("completed") != 0
            or not isinstance(missions, list)
            or len(missions) != 33
        ):
            errors.append(f"{ARCHIVE_MISSIONS_DATA}: metadata, counts, or deployment gate drifted")
        if isinstance(missions, list) and any(
            not isinstance(mission, dict)
            or not isinstance(mission.get("status"), dict)
            or mission["status"].get("completed") is not False
            or mission["status"].get("verifiedAt") is not None
            for mission in missions
        ):
            errors.append(f"{ARCHIVE_MISSIONS_DATA}: a pre-execution mission was presented as completed or verified")
        mission_text = body.decode("utf-8", errors="replace")
        for forbidden_marker in (
            '"ownerRaw"',
            '"exact_request"',
            '"precondition"',
            '"next_action"',
            '"target_window"',
            '"endpoint"',
            ABSOLUTE_MACOS_HOME_MARKER.decode(),
            "file://",
            "private-runtime",
        ):
            if forbidden_marker in mission_text:
                errors.append(f"{ARCHIVE_MISSIONS_DATA}: leaked forbidden marker {forbidden_marker}")
        expected_mission_bytes = (
            Path(__file__).resolve().parents[1]
            / "public"
            / "data"
            / "archive-missions.json"
        ).read_bytes()
        if body != expected_mission_bytes:
            errors.append(f"{ARCHIVE_MISSIONS_DATA}: served bytes differ from the verified public artifact")

    status, headers, body = fetch(args.base_url, SITE_STATUS_DATA)
    if status != 200:
        errors.append(f"{SITE_STATUS_DATA}: expected 200, got {status}")
    else:
        check_headers(SITE_STATUS_DATA, headers, errors)
        try:
            site_status = json.loads(body)
        except json.JSONDecodeError as exc:
            errors.append(f"{SITE_STATUS_DATA}: invalid JSON ({exc})")
            site_status = {}
        machine = site_status.get("machine_contract", {})
        boundary = site_status.get("evidence_boundary", {})
        rights = site_status.get("rights_and_publication", {})
        rights_registry = rights.get("registry", {}) if isinstance(rights, dict) else {}
        product_artifacts = site_status.get("product_artifacts", [])
        media_artifact = next(
            (
                item
                for item in product_artifacts
                if isinstance(item, dict) and item.get("id") == "media-studio"
            ),
            {},
        ) if isinstance(product_artifacts, list) else {}
        expected_machine = {
            "service_mode": "research_interview_only",
            "uploads": False,
            "model_processing": "off",
            "external_egress": "deny",
            "auto_fact_generation": False,
            "payment": False,
            "auto_publish": False,
            "must_not_deploy": True,
            "deployment_authorized": False,
        }
        if (
            site_status.get("schema_version") != "handx-site-status-1.0"
            or machine != expected_machine
            or not isinstance(boundary, dict)
            or boundary.get("historical_completion_percentage") is not None
            or boundary.get("historical_counts_are_inventory_not_completion") is not True
            or not isinstance(rights_registry, dict)
            or rights_registry.get("records") != EXPECTED_NOVEL_PAGES + 26
            or rights_registry.get("permission_pending")
            != 6 + len(EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
            or rights_registry.get("not_for_media")
            != 15 + len(EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
            or rights_registry.get("public_ready") != 0
            or not isinstance(media_artifact, dict)
            or media_artifact.get("inventory", {}).get("eligible_for_review_package") != 1
            or media_artifact.get("inventory", {}).get("blocked_from_media") != 5
        ):
            errors.append(f"{SITE_STATUS_DATA}: machine, evidence, rights, or media contract drifted")
        expected_status_bytes = (
            Path(__file__).resolve().parents[1]
            / "public"
            / "data"
            / "site-status.json"
        ).read_bytes()
        if body != expected_status_bytes:
            errors.append(f"{SITE_STATUS_DATA}: served bytes differ from the verified public artifact")

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
            totals.get("pages") != EXPECTED_NOVEL_PAGES
            or totals.get("numbered_chapters") != EXPECTED_NOVEL_CHAPTERS
            or totals.get("commentable_sections") != EXPECTED_NOVEL_COMMENTABLE
            or totals.get("local_only_pages") != len(EXPECTED_NOVEL_LOCAL_ONLY_PAGES)
        ):
            errors.append(f"{NOVEL_MANIFEST}: unexpected totals {totals!r}")
        if not isinstance(source, dict) or any(
            source.get(key) != expected
            for key, expected in EXPECTED_NOVEL_SOURCE_HASHES.items()
        ):
            errors.append(f"{NOVEL_MANIFEST}: source SHA contract changed ({source!r})")
        if (
            not isinstance(source, dict)
            or source.get("pdf_page_count") != EXPECTED_NOVEL_PAGES
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

        if not isinstance(pages, list) or len(pages) != EXPECTED_NOVEL_PAGES:
            errors.append(f"{NOVEL_MANIFEST}: expected {EXPECTED_NOVEL_PAGES} page rows, got {len(pages) if isinstance(pages, list) else 'invalid'}")
            pages = []
        page_numbers = [
            row.get("number")
            for row in pages
            if isinstance(row, dict)
        ]
        if page_numbers != list(range(1, EXPECTED_NOVEL_PAGES + 1)):
            errors.append(f"{NOVEL_MANIFEST}: page numbers are not the exact ordered range 1..{EXPECTED_NOVEL_PAGES}")
        if not isinstance(sections, list) or len(sections) != EXPECTED_NOVEL_SECTIONS:
            errors.append(f"{NOVEL_MANIFEST}: expected {EXPECTED_NOVEL_SECTIONS} section rows")
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
        if covered_pages != list(range(1, EXPECTED_NOVEL_PAGES + 1)):
            errors.append(f"{NOVEL_MANIFEST}: sections do not uniquely and contiguously cover pages 1..{EXPECTED_NOVEL_PAGES}")

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
                or row.get("responsive_width") != EXPECTED_NOVEL_RESPONSIVE_WIDTH
                or row.get("responsive_height") != EXPECTED_NOVEL_RESPONSIVE_HEIGHT
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

        drift_path = "/data/graph/legacy-drift-summary.json"
        drift_status, drift_headers, drift_body = fetch(args.base_url, drift_path)
        if drift_status != 200:
            errors.append(f"{drift_path}: expected 200, got {drift_status}")
        else:
            check_headers(drift_path, drift_headers, errors)
            if (
                not isinstance(output_hashes, dict)
                or hashlib.sha256(drift_body).hexdigest()
                != output_hashes.get("legacy-drift-summary.json")
            ):
                errors.append(f"{drift_path}: SHA-256 differs from graph manifest")
            try:
                drift_payload = json.loads(drift_body)
            except json.JSONDecodeError as exc:
                errors.append(f"{drift_path}: invalid JSON ({exc})")
            else:
                review = drift_payload.get("review", {})
                privacy = drift_payload.get("privacy", {})
                if (
                    drift_payload.get("status") != "quarantined"
                    or review.get("quarantined_inventory_records") != 86
                    or review.get("quarantined_blocked_records") != 86
                    or privacy.get("record_ids_included") is not False
                    or privacy.get("labels_included") is not False
                    or privacy.get("edge_endpoints_included") is not False
                ):
                    errors.append(f"{drift_path}: quarantine counts or privacy gate changed")

    status, headers, _body = fetch(args.base_url, "/private-runtime/admin-token")
    if status != 404:
        errors.append(f"/private-runtime/admin-token: private runtime file is HTTP-accessible ({status})")
    check_headers("/private-runtime/admin-token", headers, errors)

    status, headers, _body = fetch(
        args.base_url, "/private-runtime/graph-migration-inbox.json"
    )
    if status != 404:
        errors.append(
            "/private-runtime/graph-migration-inbox.json: private inbox is HTTP-accessible "
            f"({status})"
        )
    check_headers("/private-runtime/graph-migration-inbox.json", headers, errors)

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

    status, headers, body = fetch(args.base_url, "/api/local/research-missions")
    if status != 401:
        errors.append(f"/api/local/research-missions without token: expected 401, got {status}")
    if headers.get("www-authenticate") != 'Bearer realm="local-research-missions"':
        errors.append("/api/local/research-missions without token: missing bearer challenge")
    if ABSOLUTE_MACOS_HOME_MARKER in body or b"private-runtime" in body:
        errors.append("/api/local/research-missions without token leaked a local path")
    check_headers("/api/local/research-missions without token", headers, errors)

    status, headers, _body = fetch(
        args.base_url,
        "/private-runtime/local-corpus-index.json",
    )
    if status != 404:
        errors.append(
            f"/private-runtime/local-corpus-index.json: private corpus index is HTTP-accessible ({status})"
        )
    check_headers("/private-runtime/local-corpus-index.json", headers, errors)

    status, headers, _body = fetch(
        args.base_url,
        "/private-runtime/archive-missions-owner.json",
    )
    if status != 404:
        errors.append(
            f"/private-runtime/archive-missions-owner.json: private owner baseline is HTTP-accessible ({status})"
        )
    check_headers("/private-runtime/archive-missions-owner.json", headers, errors)

    comment_chapter = f"{EXPECTED_NOVEL_EDITION_ID}--chapter-01"
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
            "/api/local/research-missions",
            {"Authorization": f"Bearer {admin_token}"},
        )
        if status != 200:
            errors.append(f"/api/local/research-missions with token: expected 200, got {status}")
        else:
            try:
                owner_mission_projection = json.loads(body)
            except json.JSONDecodeError as exc:
                errors.append(f"/api/local/research-missions: invalid JSON ({exc})")
                owner_mission_projection = {}
            owner_baseline = owner_mission_projection.get("baseline", {})
            owner_missions = (
                owner_baseline.get("missions", [])
                if isinstance(owner_baseline, dict)
                else []
            )
            if (
                owner_mission_projection.get("storage_scope") != "local_private_runtime"
                or owner_mission_projection.get("event_writes_enabled") is not False
                or owner_mission_projection.get("historical_claims_created") is not False
                or not isinstance(owner_missions, list)
                or len(owner_missions) != 33
                or any(
                    not isinstance(mission, dict)
                    or not isinstance(mission.get("ownerRaw"), dict)
                    for mission in owner_missions
                )
            ):
                errors.append("/api/local/research-missions: authenticated owner projection is malformed")
            if ABSOLUTE_MACOS_HOME_MARKER in body or b"absolute_path" in body or b"private-runtime" in body:
                errors.append("/api/local/research-missions: authenticated projection leaked a local path")
        check_headers("/api/local/research-missions with token", headers, errors)

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
            "chapter_id": f"{EXPECTED_NOVEL_EDITION_ID}--chapter-02",
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
            f"/api/local/novel-comments?chapter={EXPECTED_NOVEL_EDITION_ID}--chapter-02",
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
            or chapter_two_comments[0].get("chapter_id")
            != f"{EXPECTED_NOVEL_EDITION_ID}--chapter-02"
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
                                "chapter_id": comment_chapter,
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
                "local_runtime_endpoints": 9,
                "novel_pages_hashed": EXPECTED_NOVEL_PAGES,
                "novel_responsive_pages_hashed": EXPECTED_NOVEL_PAGES,
                "novel_numbered_chapters": EXPECTED_NOVEL_CHAPTERS,
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
