#!/usr/bin/env python3
"""Build one coherent local-preview snapshot from the pinned public authority.

The builder reads ``authority-v1/CURRENT`` exactly once through the shared
authority helper.  All source JSON then comes from that helper's validated,
immutable in-memory generation snapshot; legacy flat export directories are
never consulted.

The four public endpoint files are replaced first and ``research.json`` is
replaced last as the commit marker.  A crash can therefore never make a mixed
set pass verification: every consumer command runs ``data:verify``, which
requires all five files to carry identical generation metadata and projections.
"""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import stat
import sys
import tempfile
from collections import Counter
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Mapping, Sequence


# Importing the workspace helper must not leave bytecode inside the evidence
# workspace.  The helper itself remains the single implementation of the
# generation protocol used by both research gates and this site.
sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]
WORKSPACE_TOOLS = WORKSPACE_ROOT / "tools"
if str(WORKSPACE_TOOLS) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_TOOLS))

from public_generation_authority import pin_current_generation  # noqa: E402


DEFAULT_AUTHORITY_ROOT = (
    WORKSPACE_ROOT / "02-史料公开层" / "公开导出" / "authority-v1"
)
EXPECTED_EXPORTER_VERSION = "1.3.6"
EXPECTED_APPROVAL_SCOPE = (
    "local_preview_three_anchor_metadata_and_short_claims_only_v7r4_safe_subset"
)
EXPECTED_COUNTS = {"sources": 5, "claims": 5, "nodes": 7, "edges": 5}
SOURCE_CONTENT_SCOPES = {
    "metadata-only",
    "cover-visible",
    "body-verified",
    "interpreted",
}

EVENT_ANCHORS = [
    {
        "event_id": "EV-1933-03-09",
        "claim_ids": ["CL-092"],
        "precision": "exact",
        "title": "1933年公报刊载“蘇開元”团长任命记录",
        "description": "公报任命蘇開元为陆军第七十二师第二百十八旅第四百三十五团团长。",
        "category": "military",
        "location": "",
        "context": "《国民政府公报》第1075号",
        "people": ["公报中的“蘇開元”记录对象"],
        "note": "只证明公报刊载该姓名任命；不能外推实际到任、离任日期或完整任期，也不能与其他同名记录自动并人。",
    },
    {
        "event_id": "EV-1936-11-21",
        "claim_ids": ["CL-013", "CL-014"],
        "precision": "exact",
        "title": "1936年朱自清记下“留守司令苏开元团长”",
        "description": "《绥行纪略》记录该称谓，并记下苏开元对学生救国会组织独立性的态度。",
        "category": "social",
        "location": "平地泉（今集宁一带）",
        "context": "朱自清《绥行纪略》",
        "people": ["朱自清文中的“苏开元”记录对象", "朱自清"],
        "note": "只保留为朱自清在1936年11月21日的见闻和用语；转录与影印同源，该姓名记录与其他年份的人物连接仍是candidate。",
    },
    {
        "event_id": "EV-1942-08",
        "claim_ids": ["CL-167", "CL-168"],
        "precision": "month",
        "title": "1942年日方编成表列“蘇開元”为高级参议",
        "description": "1942年8月《第八战区编成表》在傅作义指挥部队项下并列李大超、蘇開元为高级参议。此处只陈述该表如何记载。",
        "category": "military",
        "location": "",
        "context": "《第八战区编成表》傅作义指挥部队项下",
        "people": ["编成表中的“蘇開元”记录对象", "编成表中的“李大超”姓名记录"],
        "note": "只陈述日方编成表如何列示；不能替代中方任命令，不能证明权限与任期，也不能与其他同名记录自动并人。",
    },
]

CLAIM_FIELDS = [
    "claim_id",
    "claim_type",
    "status",
    "subject_id",
    "predicate",
    "object_or_value",
    "time_start",
    "time_end",
    "place_ids",
    "source_ids",
    "locator",
    "evidence_tier",
    "independence_count",
    "confidence",
    "public_tier",
    "conflict_set_id",
    "conflicts_with",
    "quote_or_assertion",
    "provenance_stage",
    "verified_extent",
    "scene_eligible",
    "identity_link_status",
    "identity_anchor_ids",
    "identity_anchors_redacted",
]


def require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise RuntimeError(f"{label} must be a JSON object")
    return {str(key): item for key, item in value.items()}


def require_records(value: Any, label: str) -> list[dict[str, Any]]:
    if not isinstance(value, list) or any(not isinstance(row, Mapping) for row in value):
        raise RuntimeError(f"{label} must be a list of JSON objects")
    return [dict(row) for row in value]


def canonical_json_bytes(payload: Mapping[str, Any]) -> bytes:
    return (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def require_claims(claims_by_id: Mapping[str, Mapping[str, Any]], ids: Sequence[str]) -> None:
    missing = [claim_id for claim_id in ids if claim_id not in claims_by_id]
    if missing:
        raise RuntimeError(f"previewable export is missing required claims: {missing}")


def validate_source_scope(source: Mapping[str, Any]) -> None:
    source_id = str(source.get("source_id", "<missing-source-id>"))
    scope = source.get("content_scope")
    if scope not in SOURCE_CONTENT_SCOPES:
        raise RuntimeError(f"{source_id}: invalid content_scope {scope!r}")
    values = {
        field: str(source.get(field, "")).strip()
        for field in ("verified_extent", "total_extent_known", "unread_extent")
    }
    blank = [field for field, value in values.items() if not value]
    if blank:
        raise RuntimeError(f"{source_id}: blank source scope fields: {blank}")
    if scope in {"metadata-only", "cover-visible"} and values[
        "unread_extent"
    ].lower() in {"none", "no", "n/a", "not-applicable"}:
        raise RuntimeError(f"{source_id}: {scope} cannot claim that no body is unread")
    if scope == "cover-visible" and not re.search(
        r"(?:封面|\bcover\b|\bpreview\b|预览)",
        values["verified_extent"],
        re.IGNORECASE,
    ):
        raise RuntimeError(f"{source_id}: cover-visible extent lacks a cover marker")


def event(
    *,
    claims_by_id: Mapping[str, Mapping[str, Any]],
    event_id: str,
    precision: str,
    title: str,
    description: str,
    category: str,
    location: str,
    context: str,
    people: list[str],
    claim_ids: list[str],
    note: str = "",
) -> dict[str, Any]:
    require_claims(claims_by_id, claim_ids)
    supporting_claims = [claims_by_id[claim_id] for claim_id in claim_ids]
    date_starts = {str(claim["time_start"]) for claim in supporting_claims}
    date_ends = {str(claim["time_end"]) for claim in supporting_claims}
    if len(date_starts) != 1 or len(date_ends) != 1:
        raise RuntimeError(
            f"{event_id}: grouped claims do not share one date range "
            f"({sorted(date_starts)} / {sorted(date_ends)})"
        )
    date_start = date_starts.pop()
    date_end = date_ends.pop()
    if not date_start or not date_end:
        raise RuntimeError(f"{event_id}: grouped claims have a blank date boundary")

    source_ids = sorted(
        {
            str(source_id)
            for claim in supporting_claims
            for source_id in claim["source_ids"]
        }
    )
    identity_link_statuses = sorted(
        {str(claim["identity_link_status"]) for claim in supporting_claims}
    )
    identity_anchor_ids = sorted(
        {
            str(anchor_id)
            for claim in supporting_claims
            for anchor_id in claim["identity_anchor_ids"]
            if anchor_id != "none"
        }
    )
    statuses = {str(claim["status"]) for claim in supporting_claims}
    status_value = "provisional" if "provisional" in statuses else "working_verified"
    evidence_tiers = {str(claim["evidence_tier"]) for claim in supporting_claims}
    if len(evidence_tiers) != 1:
        raise RuntimeError(
            f"{event_id}: grouped claims do not share one evidence tier "
            f"({sorted(evidence_tiers)})"
        )
    evidence_tier = evidence_tiers.pop()
    parts = date_start.split("-")
    return {
        "event_id": event_id,
        "date_start": date_start,
        "date_end": date_end,
        "date_precision": precision,
        "year": int(parts[0]),
        "month": int(parts[1]) if len(parts) > 1 else None,
        "day": int(parts[2]) if len(parts) > 2 else None,
        "title": title,
        "description": description,
        "category": category,
        "location": location,
        "context": context,
        "people": people,
        "status": status_value,
        "evidence_tier": evidence_tier,
        "claim_ids": claim_ids,
        "source_ids": source_ids,
        "carrier_count": len(source_ids),
        "independence_count": max(
            int(claim["independence_count"]) for claim in supporting_claims
        ),
        "scene_eligible": all(claim["scene_eligible"] is True for claim in supporting_claims),
        "identity_link_statuses": identity_link_statuses,
        "identity_anchor_ids": identity_anchor_ids,
        "note": note,
    }


def build_payloads(pinned: Any) -> dict[str, bytes]:
    generation = require_mapping(pinned.generation_document, "GENERATION.json")
    manifest = require_mapping(
        pinned.read_json("previewable/manifest.json"), "previewable/manifest.json"
    )
    source_export = require_mapping(
        pinned.read_json("previewable/sources.public.json"),
        "previewable/sources.public.json",
    )
    claim_export = require_mapping(
        pinned.read_json("previewable/claims.public.json"),
        "previewable/claims.public.json",
    )
    graph_export = require_mapping(
        pinned.read_json("previewable/graph.public.json"),
        "previewable/graph.public.json",
    )

    if generation.get("tool_version") != EXPECTED_EXPORTER_VERSION:
        raise RuntimeError("authority generation is not exporter 1.3.6")
    if manifest.get("tool_version") != EXPECTED_EXPORTER_VERSION:
        raise RuntimeError("previewable manifest is not exporter 1.3.6")
    if manifest.get("publication_layer") != "previewable":
        raise RuntimeError("site data must be built from the previewable layer")
    if manifest.get("preview_approved") is not True:
        raise RuntimeError("previewable data lacks preview approval")
    if manifest.get("deployment_authorized") is not False:
        raise RuntimeError("deployment gate unexpectedly opened")
    if manifest.get("must_not_deploy") is not True:
        raise RuntimeError("previewable data does not preserve must_not_deploy")
    if manifest.get("approval_scope") != EXPECTED_APPROVAL_SCOPE:
        raise RuntimeError("previewable approval scope is not the V7R4 safe subset")
    if manifest.get("counts") != EXPECTED_COUNTS:
        raise RuntimeError(f"unexpected V7R4 preview counts: {manifest.get('counts')!r}")
    if generation.get("counts", {}).get("previewable") != EXPECTED_COUNTS:
        raise RuntimeError("generation counts disagree with V7R4 preview counts")
    if generation.get("gates", {}).get("previewable") != {
        "must_not_deploy": True,
        "preview_approved": True,
        "publication_approved": False,
        "deployment_authorized": False,
    }:
        raise RuntimeError("generation previewable gates are not closed")

    sources = require_records(source_export.get("sources"), "sources")
    for source in sources:
        validate_source_scope(source)
    source_scope_counts = dict(
        sorted(Counter(str(source["content_scope"]) for source in sources).items())
    )
    raw_claims = require_records(claim_export.get("claims"), "claims")
    claims = [
        {field: claim[field] for field in CLAIM_FIELDS}
        for claim in raw_claims
    ]
    nodes = require_records(graph_export.get("nodes"), "nodes")
    edges = require_records(graph_export.get("edges"), "edges")
    if {
        "sources": len(sources),
        "claims": len(claims),
        "nodes": len(nodes),
        "edges": len(edges),
    } != EXPECTED_COUNTS:
        raise RuntimeError("previewable JSON payload counts disagree with its manifest")

    claims_by_id = {str(claim["claim_id"]): claim for claim in claims}
    if len(claims_by_id) != len(claims):
        raise RuntimeError("previewable claims contain duplicate claim IDs")
    event_claim_ids = [
        claim_id for anchor in EVENT_ANCHORS for claim_id in anchor["claim_ids"]
    ]
    require_claims(claims_by_id, event_claim_ids)
    if len(event_claim_ids) != len(set(event_claim_ids)):
        raise RuntimeError("event anchor configuration reuses a claim")
    if set(event_claim_ids) != set(claims_by_id):
        raise RuntimeError(
            "previewable claims and event anchor configuration differ: "
            f"configured={sorted(event_claim_ids)}, exported={sorted(claims_by_id)}"
        )
    events = [event(claims_by_id=claims_by_id, **anchor) for anchor in EVENT_ANCHORS]

    meta = {
        "schema_version": "sukaiyuan-site-preview-1.1",
        "generated_at_utc": manifest["generated_at_utc"],
        "publication_layer": "previewable",
        "preview_approved": True,
        "deployment_authorized": False,
        "must_not_deploy": True,
        "approval_scope": manifest["approval_scope"],
        "exporter_version": generation["tool_version"],
        "authority_schema_version": generation["schema_version"],
        "authority_layout_version": generation["layout_version"],
        "generation_id": pinned.generation_id,
        "generation_manifest_sha256": pinned.generation_manifest_sha256,
        "research_snapshot_id": manifest["research_snapshot_id"],
        "research_input_sha256": manifest["research_input_sha256"],
        "source_counts": manifest["counts"],
        "preview_anchor_years": [record["year"] for record in events],
        "source_scope_counts": source_scope_counts,
        "source_manifest_file_sha256": hashlib.sha256(
            pinned.read_bytes("previewable/manifest.json")
        ).hexdigest(),
        "disclaimer": (
            "V7R4权威代次中真实公开层数据的本地预览；不含扫描件、"
            "全文转录、家属私密材料或P2/P3。当前只显示1933、1936、1942三组"
            "文献记录；1929记录与苏开元—苏凯元身份桥因混合来源依赖暂缓显示。"
            "同名记录不构成连续生平，发起人的亲属关系也未在当前公开证据层内"
            "核验。未经发起人最终确认，不得部署或公开发布。"
        ),
    }
    combined: dict[str, Any] = {
        "_meta": meta,
        "sources": sources,
        "claims": claims,
        "nodes": nodes,
        "edges": edges,
        "events": events,
        "identity_candidates": [
            claim
            for claim in claims
            if claim["status"] == "provisional"
            and claim["identity_link_status"] in {"candidate", "unresolved", "rejected"}
        ],
        "identity_boundary_claims": [
            claim
            for claim in claims
            if claim["identity_link_status"] in {"candidate", "unresolved", "rejected"}
        ],
    }
    persons = [node for node in nodes if node["entity_type"] == "Person"]
    return {
        "research": canonical_json_bytes(combined),
        "persons": canonical_json_bytes({"_meta": meta, "persons": persons}),
        "events": canonical_json_bytes({"_meta": meta, "events": events}),
        "timeline": canonical_json_bytes({"_meta": meta, "timeline": events}),
        "sources": canonical_json_bytes({"_meta": meta, "sources": sources}),
    }


def _fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _stage_file(target: Path, payload: bytes) -> Path:
    if not target.parent.exists() or not stat.S_ISDIR(target.parent.lstat().st_mode):
        raise RuntimeError(f"output parent is not a real directory: {target.parent}")
    if os.path.lexists(target) and not stat.S_ISREG(target.lstat().st_mode):
        raise RuntimeError(f"refusing to replace non-regular output: {target}")
    with tempfile.NamedTemporaryFile(
        dir=target.parent,
        prefix=f".{target.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    temporary.chmod(0o644)
    return temporary


def _commit_fault_point(name: str) -> None:
    """No-op test hook for proving commit-marker failure behavior."""
    del name


@contextmanager
def build_lock(project_root: Path) -> Any:
    """Serialize all five-file site-data commits with one persistent lock."""
    lock_path = project_root / ".preview-data.lock"
    if os.path.lexists(lock_path) and not stat.S_ISREG(lock_path.lstat().st_mode):
        raise RuntimeError(f"preview-data lock is not an ordinary file: {lock_path}")
    flags = os.O_RDWR | os.O_CREAT
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(lock_path, flags, 0o600)
    try:
        if not stat.S_ISREG(os.fstat(descriptor).st_mode):
            raise RuntimeError("preview-data lock descriptor is not an ordinary file")
        fcntl.flock(descriptor, fcntl.LOCK_EX)
        os.ftruncate(descriptor, 0)
        os.write(descriptor, f"pid={os.getpid()}\n".encode("ascii"))
        os.fsync(descriptor)
        _fsync_directory(project_root)
        yield
    finally:
        fcntl.flock(descriptor, fcntl.LOCK_UN)
        os.close(descriptor)


def commit_payloads(project_root: Path, payloads: Mapping[str, bytes], pinned: Any) -> None:
    targets = {
        "research": project_root / "src" / "data" / "research.json",
        "persons": project_root / "public" / "data" / "persons.json",
        "events": project_root / "public" / "data" / "events.json",
        "timeline": project_root / "public" / "data" / "timeline.json",
        "sources": project_root / "public" / "data" / "sources.json",
    }
    if set(payloads) != set(targets):
        raise RuntimeError("derived payload set is incomplete")
    staged: dict[str, Path] = {}
    try:
        for name, target in targets.items():
            staged[name] = _stage_file(target, payloads[name])
        # Freshness is a distinct check from generation integrity.  The pinned
        # bytes remain authoritative for this build; a pointer switch causes a
        # fail-closed retry before any output is committed.
        pinned.assert_fresh()
        for name in ("persons", "events", "timeline", "sources"):
            os.replace(staged.pop(name), targets[name])
            _fsync_directory(targets[name].parent)
            _commit_fault_point(f"after_{name}")
        # research.json is the only site-data commit marker and is last.
        os.replace(staged.pop("research"), targets["research"])
        _fsync_directory(targets["research"].parent)
        _commit_fault_point("after_research_commit")
        # A switch during the short four-endpoint commit window is detected as
        # a stale (but internally coherent) result and makes the build fail.
        pinned.assert_fresh()
    finally:
        for temporary in staged.values():
            if os.path.lexists(temporary) and stat.S_ISREG(temporary.lstat().st_mode):
                temporary.unlink()


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--authority-root", type=Path, default=DEFAULT_AUTHORITY_ROOT)
    parser.add_argument("--project-root", type=Path, default=PROJECT_ROOT)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(list(argv) if argv is not None else sys.argv[1:])
    # abspath is lexical: unlike Path.resolve(), it does not dereference a
    # caller-supplied authority-root symlink before the helper can reject it.
    authority_root = Path(os.path.abspath(args.authority_root))
    project_root = Path(os.path.abspath(args.project_root))
    if not project_root.exists() or not stat.S_ISDIR(project_root.lstat().st_mode):
        raise RuntimeError(f"project root is not a real directory: {project_root}")
    with build_lock(project_root):
        pinned = pin_current_generation(authority_root=authority_root)
        payloads = build_payloads(pinned)
        commit_payloads(project_root, payloads, pinned)
    research = json.loads(payloads["research"])
    print(
        json.dumps(
            {
                "status": "PASS",
                "generation_id": pinned.generation_id,
                "generation_manifest_sha256": pinned.generation_manifest_sha256,
                "exporter_version": research["_meta"]["exporter_version"],
                "approval_scope": research["_meta"]["approval_scope"],
                "counts": research["_meta"]["source_counts"],
                "events": len(research["events"]),
                "commit_marker": "src/data/research.json",
                "deployment_authorized": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError) as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, ensure_ascii=False))
        raise SystemExit(2)
