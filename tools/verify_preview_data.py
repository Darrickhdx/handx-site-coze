#!/usr/bin/env python3
"""Fail closed when local-preview data drifts from its audited public export."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import stat
import sys
from pathlib import Path
from typing import Any, Sequence


sys.dont_write_bytecode = True
PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = PROJECT_ROOT.parents[1]
WORKSPACE_TOOLS = WORKSPACE_ROOT / "tools"
if str(WORKSPACE_TOOLS) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_TOOLS))

from public_generation_authority import (  # noqa: E402
    GenerationAuthorityError,
    pin_generation,
)


DEFAULT_AUTHORITY_ROOT = (
    WORKSPACE_ROOT / "02-史料公开层" / "公开导出" / "authority-v1"
)


def data_files(project_root: Path) -> dict[str, Path]:
    return {
        "research": project_root / "src" / "data" / "research.json",
        "persons": project_root / "public" / "data" / "persons.json",
        "events": project_root / "public" / "data" / "events.json",
        "timeline": project_root / "public" / "data" / "timeline.json",
        "sources": project_root / "public" / "data" / "sources.json",
    }
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
EXPECTED_V7R4_COUNTS = {
    "sources": 5,
    "claims": 5,
    "nodes": 7,
    "edges": 5,
}
EXPECTED_EVENT_CLAIMS = {
    "EV-1933-03-09": ["CL-092"],
    "EV-1936-11-21": ["CL-013", "CL-014"],
    "EV-1942-08": ["CL-167", "CL-168"],
}
EXPECTED_ANCHOR_YEARS = [1933, 1936, 1942]
EXPECTED_SNAPSHOT_ID = "源数据工作版-2026-07-20-v7"
EXPECTED_EXPORTER_VERSION = "1.3.6"
EXPECTED_APPROVAL_SCOPE = (
    "local_preview_three_anchor_metadata_and_short_claims_only_v7r4_safe_subset"
)
EXPECTED_GENERATION_SCHEMA = "public-export-generation-manifest-1.0"
EXPECTED_GENERATION_LAYOUT = "public-export-generation-2.0"
EXPECTED_RESEARCH_INPUTS = {
    "01-来源登记表.csv",
    "03-核心主张.csv",
    "04-实体与别名.csv",
    "05-关系图谱.csv",
    "05-知识图谱.json",
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
IDENTITY_LINK_STATUSES = {
    "not-applicable",
    "unresolved",
    "candidate",
    "verified",
    "rejected",
}
IDENTITY_LINKS_THAT_BLOCK_SCENES = {"candidate", "unresolved", "rejected"}
SOURCE_CONTENT_SCOPES = {
    "metadata-only",
    "cover-visible",
    "body-verified",
    "interpreted",
}
FORBIDDEN_DEMO_MARKERS = [
    "墨农",
    "苏慎初",
    "苏建华",
    "上海某书局",
    "苏州某书院",
    "《墨农文集》",
    "武昌首义",
    "1872",
    "1874",
    "1876",
]


def strict_json_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_bytes(payload: bytes, label: str) -> dict[str, Any]:
    try:
        value = json.loads(
            payload.decode("utf-8-sig"), object_pairs_hook=strict_json_object
        )
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise ValueError(f"{label}: invalid strict JSON ({exc})") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{label}: top-level JSON must be an object")
    return value


def read_regular_once(path: Path) -> bytes:
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags)
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode):
            raise OSError(f"not an ordinary file: {path}")
        chunks: list[bytes] = []
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            chunks.append(chunk)
        after = os.fstat(descriptor)
        stable_fields = ("st_dev", "st_ino", "st_mode", "st_size", "st_mtime_ns", "st_ctime_ns")
        if any(getattr(before, field) != getattr(after, field) for field in stable_fields):
            raise OSError(f"file changed while being read: {path}")
        payload = b"".join(chunks)
        if len(payload) != after.st_size:
            raise OSError(f"byte count changed while reading: {path}")
        return payload
    finally:
        os.close(descriptor)


def acquire_verification_lock(project_root: Path) -> int:
    lock_path = project_root / ".preview-data.lock"
    if os.path.lexists(lock_path) and not stat.S_ISREG(lock_path.lstat().st_mode):
        raise OSError("preview-data lock is not an ordinary file")
    flags = os.O_RDWR | os.O_CREAT
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(lock_path, flags, 0o600)
    if not stat.S_ISREG(os.fstat(descriptor).st_mode):
        os.close(descriptor)
        raise OSError("preview-data lock descriptor is not ordinary")
    fcntl.flock(descriptor, fcntl.LOCK_SH)
    return descriptor


def projected_claims(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {field: claim[field] for field in CLAIM_FIELDS}
        for claim in payload["claims"]
    ]


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--authority-root", type=Path, default=DEFAULT_AUTHORITY_ROOT)
    parser.add_argument("--project-root", type=Path, default=PROJECT_ROOT)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(list(argv) if argv is not None else sys.argv[1:])
    project_root = Path(os.path.abspath(args.project_root))
    authority_root = Path(os.path.abspath(args.authority_root))
    if not project_root.exists() or not stat.S_ISDIR(project_root.lstat().st_mode):
        print(
            json.dumps(
                {"status": "FAIL", "errors": ["project root is not a real directory"]},
                ensure_ascii=False,
            )
        )
        return 2
    try:
        verification_lock = acquire_verification_lock(project_root)
    except OSError as exc:
        print(json.dumps({"status": "FAIL", "errors": [str(exc)]}, ensure_ascii=False))
        return 2
    errors: list[str] = []
    payloads: dict[str, dict[str, Any]] = {}
    payload_bytes: dict[str, bytes] = {}
    files = data_files(project_root)

    for name, path in files.items():
        if not os.path.lexists(path):
            errors.append(f"missing file: {path.relative_to(project_root)}")
            continue
        if not stat.S_ISREG(path.lstat().st_mode):
            errors.append(f"derived output is not an ordinary file: {path.name}")
            continue
        try:
            payload_bytes[name] = read_regular_once(path)
        except OSError as exc:
            errors.append(f"{path.name}: cannot read a stable byte snapshot ({exc})")
            continue
        text = payload_bytes[name].decode("utf-8", errors="replace")
        try:
            payloads[name] = load_bytes(payload_bytes[name], path.name)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        meta = payloads[name].get("_meta", {})
        if meta.get("publication_layer") != "previewable":
            errors.append(f"{path.name}: publication layer is not previewable")
        if meta.get("preview_approved") is not True:
            errors.append(f"{path.name}: preview approval missing")
        if meta.get("deployment_authorized") is not False:
            errors.append(f"{path.name}: deployment gate is not closed")
        if meta.get("must_not_deploy") is not True:
            errors.append(f"{path.name}: must_not_deploy is not true")
        if re.search(r"/(Users|home|private|tmp)/", text):
            errors.append(f"{path.name}: contains an absolute local path")
        for marker in FORBIDDEN_DEMO_MARKERS:
            if marker in text:
                errors.append(f"{path.name}: contains discarded demo marker {marker}")
        if meta.get("schema_version") != "sukaiyuan-site-preview-1.1":
            errors.append(f"{path.name}: site preview schema is not 1.1")
        if meta.get("exporter_version") != EXPECTED_EXPORTER_VERSION:
            errors.append(f"{path.name}: exporter version is not 1.3.6")
        if meta.get("approval_scope") != EXPECTED_APPROVAL_SCOPE:
            errors.append(f"{path.name}: approval scope is not the V7R4 safe subset")
        if meta.get("authority_schema_version") != EXPECTED_GENERATION_SCHEMA:
            errors.append(f"{path.name}: authority schema is not generation manifest 1.0")
        if meta.get("authority_layout_version") != EXPECTED_GENERATION_LAYOUT:
            errors.append(f"{path.name}: authority layout is not generation 2.0")
        if not re.fullmatch(r"gen-[0-9a-f]{64}", str(meta.get("generation_id", ""))):
            errors.append(f"{path.name}: generation_id is missing or malformed")
        if not re.fullmatch(
            r"[0-9a-f]{64}", str(meta.get("generation_manifest_sha256", ""))
        ):
            errors.append(f"{path.name}: generation manifest SHA-256 is missing or malformed")
        for excluded_id in sorted(EXCLUDED_MIXED_DEPENDENCY_IDS):
            if excluded_id in text:
                errors.append(
                    f"{path.name}: contains excluded mixed-dependency record {excluded_id}"
                )

    pinned: Any | None = None
    recorded_integrity_status = "NOT_CHECKED"
    freshness_status = "NOT_CHECKED"
    if "research" in payloads:
        research = payloads["research"]
        meta = research.get("_meta", {})
        recorded_generation_id = str(meta.get("generation_id", ""))
        if re.fullmatch(r"gen-[0-9a-f]{64}", recorded_generation_id):
            try:
                # This validates the generation recorded by the commit marker
                # without selecting or reading CURRENT's contents.
                pinned = pin_generation(
                    recorded_generation_id, authority_root=authority_root
                )
                recorded_integrity_status = "PASS"
            except (GenerationAuthorityError, OSError, ValueError) as exc:
                recorded_integrity_status = "FAIL"
                errors.append(f"recorded-generation integrity: {exc}")
        else:
            recorded_integrity_status = "FAIL"
            errors.append("recorded-generation integrity: invalid generation_id")

    if pinned is not None and "research" in payloads:
        generation = pinned.generation_document
        manifest = pinned.read_json("previewable/manifest.json")
        source_export = pinned.read_json("previewable/sources.public.json")
        claim_export = pinned.read_json("previewable/claims.public.json")
        graph_export = pinned.read_json("previewable/graph.public.json")
        research = payloads["research"]
        meta = research.get("_meta", {})

        if meta.get("generation_id") != pinned.generation_id:
            errors.append("research.json generation_id differs from recorded generation")
        if meta.get("generation_manifest_sha256") != pinned.generation_manifest_sha256:
            errors.append("research.json GENERATION.json SHA-256 is stale or incorrect")
        if meta.get("authority_schema_version") != generation.get("schema_version"):
            errors.append("research.json authority schema differs from GENERATION.json")
        if meta.get("authority_layout_version") != generation.get("layout_version"):
            errors.append("research.json authority layout differs from GENERATION.json")
        if meta.get("exporter_version") != generation.get("tool_version"):
            errors.append("research.json exporter version differs from GENERATION.json")

        if manifest.get("publication_layer") != "previewable":
            errors.append("authoritative manifest is not previewable")
        if manifest.get("preview_approved") is not True:
            errors.append("authoritative manifest lacks preview approval")
        if manifest.get("deployment_authorized") is not False:
            errors.append("authoritative deployment gate is not closed")
        if manifest.get("must_not_deploy") is not True:
            errors.append("authoritative must_not_deploy is not true")
        if manifest.get("tool_version") != EXPECTED_EXPORTER_VERSION:
            errors.append(
                "recorded authority preview is not exporter 1.3.6"
            )
        if manifest.get("counts") != EXPECTED_V7R4_COUNTS:
            errors.append(
                "recorded authority V7R4 counts differ from the required "
                f"5/5/7/5 subset: {manifest.get('counts')!r}"
            )
        if manifest.get("approval_scope") != EXPECTED_APPROVAL_SCOPE:
            errors.append("recorded authority approval_scope is not the V7R4 safe subset")
        policy = manifest.get("policy", {})
        for policy_key in (
            "private_dependency_taint_excluded",
            "mixed_dependency_records_excluded",
            "candidate_dependency_closure_required",
            "semantic_id_dependency_closure_required",
            "unknown_or_absent_semantic_ids_excluded",
        ):
            if policy.get(policy_key) is not True:
                errors.append(f"recorded V7R4 policy gate is missing: {policy_key}")
        snapshot_id = str(manifest.get("research_snapshot_id", ""))
        if not re.fullmatch(r"源数据工作版-\d{4}-\d{2}-\d{2}-v\d+", snapshot_id):
            errors.append("authoritative research snapshot id is missing or malformed")
        if snapshot_id != EXPECTED_SNAPSHOT_ID:
            errors.append(
                f"authoritative preview is not pinned to {EXPECTED_SNAPSHOT_ID}"
            )
        input_hashes = manifest.get("research_input_sha256", {})
        if set(input_hashes) != EXPECTED_RESEARCH_INPUTS or any(
            not re.fullmatch(r"[0-9a-f]{64}", str(value))
            for value in input_hashes.values()
        ):
            errors.append("authoritative research input hashes are missing or malformed")
        if input_hashes != generation.get("research_input_sha256"):
            errors.append("preview manifest research hashes differ from GENERATION.json")

        manifest_hash = pinned.sha256("previewable/manifest.json")
        if meta.get("source_manifest_file_sha256") != manifest_hash:
            errors.append(
                "research.json is not synchronized to its recorded previewable manifest"
            )

        for filename in ("sources.public.json", "claims.public.json", "graph.public.json"):
            expected_hash = manifest.get("file_sha256", {}).get(filename)
            actual_hash = pinned.sha256(f"previewable/{filename}")
            if expected_hash != actual_hash:
                errors.append(f"recorded-generation checksum mismatch: {filename}")

        expected_claims = projected_claims(claim_export)
        exact_sections = {
            "sources": source_export["sources"],
            "claims": expected_claims,
            "nodes": graph_export["nodes"],
            "edges": graph_export["edges"],
        }
        for section, expected in exact_sections.items():
            if research.get(section) != expected:
                errors.append(
                    f"research.json: {section} does not exactly match the authoritative export"
                )

        expected_counts = dict(manifest.get("counts", {}))
        expected_counts["events"] = len(EXPECTED_EVENT_CLAIMS)
        for section, expected in expected_counts.items():
            actual = len(research.get(section, []))
            if actual != expected:
                errors.append(
                    f"research.json: {section} count {actual}, expected {expected}"
                )
        if meta.get("source_counts") != manifest.get("counts"):
            errors.append("research.json: source_counts differs from authoritative manifest")
        if meta.get("research_snapshot_id") != manifest.get("research_snapshot_id"):
            errors.append("research.json: research_snapshot_id differs from manifest")
        if meta.get("research_input_sha256") != manifest.get("research_input_sha256"):
            errors.append("research.json: research_input_sha256 differs from manifest")
        if meta.get("preview_anchor_years") != EXPECTED_ANCHOR_YEARS:
            errors.append(
                "research.json: preview_anchor_years is not the V7R4 1933/1936/1942 set"
            )

        source_scope_counts = {
            scope: sum(
                source.get("content_scope") == scope
                for source in research.get("sources", [])
            )
            for scope in SOURCE_CONTENT_SCOPES
            if any(
                source.get("content_scope") == scope
                for source in research.get("sources", [])
            )
        }
        if meta.get("source_scope_counts") != dict(sorted(source_scope_counts.items())):
            errors.append("research.json: source_scope_counts is missing or stale")
        for source in research.get("sources", []):
            source_id = source.get("source_id", "<missing-source-id>")
            scope = source.get("content_scope")
            if scope not in SOURCE_CONTENT_SCOPES:
                errors.append(f"{source_id}: invalid content_scope {scope!r}")
            boundary = {
                field: str(source.get(field, "")).strip()
                for field in (
                    "verified_extent",
                    "total_extent_known",
                    "unread_extent",
                )
            }
            blank = [field for field, value in boundary.items() if not value]
            if blank:
                errors.append(f"{source_id}: blank source boundary fields {blank}")
            if scope in {"metadata-only", "cover-visible"} and boundary[
                "unread_extent"
            ].lower() in {"none", "no", "n/a", "not-applicable"}:
                errors.append(
                    f"{source_id}: {scope} incorrectly claims no unread body"
                )
            if scope == "cover-visible" and not re.search(
                r"(?:封面|\bcover\b|\bpreview\b|预览)",
                boundary["verified_extent"],
                re.IGNORECASE,
            ):
                errors.append(
                    f"{source_id}: cover-visible extent lacks a cover marker"
                )

        statuses = {claim.get("status") for claim in research.get("claims", [])}
        if not statuses.issubset({"working_verified", "provisional"}):
            errors.append(f"unexpected claim statuses: {sorted(statuses)}")
        provisional_identity_claims = [
            claim for claim in research.get("claims", [])
            if claim.get("status") == "provisional"
            and claim.get("identity_link_status") in IDENTITY_LINKS_THAT_BLOCK_SCENES
        ]
        if research.get("identity_candidates") != provisional_identity_claims:
            errors.append(
                "identity_candidates must equal the current provisional identity claim set"
            )

        identity_boundary_claims = [
            claim
            for claim in research.get("claims", [])
            if claim.get("identity_link_status") in IDENTITY_LINKS_THAT_BLOCK_SCENES
        ]
        if research.get("identity_boundary_claims") != identity_boundary_claims:
            errors.append(
                "identity_boundary_claims must exactly contain candidate/unresolved/rejected claims"
            )

        known_public_anchor_ids = known_source_ids = {
            source["source_id"] for source in research.get("sources", [])
        }
        known_public_anchor_ids = (
            known_public_anchor_ids
            | {claim["claim_id"] for claim in research.get("claims", [])}
            | {"none"}
        )
        for claim in research.get("claims", []):
            claim_id = claim.get("claim_id", "<missing-claim-id>")
            identity_status = claim.get("identity_link_status")
            if identity_status not in IDENTITY_LINK_STATUSES:
                errors.append(
                    f"{claim_id}: invalid identity_link_status {identity_status!r}"
                )
            if not isinstance(claim.get("scene_eligible"), bool):
                errors.append(f"{claim_id}: scene_eligible is not a boolean")
            if (
                identity_status in IDENTITY_LINKS_THAT_BLOCK_SCENES
                and claim.get("scene_eligible") is not False
            ):
                errors.append(
                    f"{claim_id}: {identity_status} identity link must block scene use"
                )
            anchor_ids = claim.get("identity_anchor_ids")
            if not isinstance(anchor_ids, list):
                errors.append(f"{claim_id}: identity_anchor_ids is not a list")
            elif not set(anchor_ids).issubset(known_public_anchor_ids):
                errors.append(f"{claim_id}: identity_anchor_ids contains a non-public ID")
            if not str(claim.get("verified_extent", "")).strip():
                errors.append(f"{claim_id}: verified_extent is blank")

        claims_by_id = {
            claim["claim_id"]: claim for claim in research.get("claims", [])
        }

        research_meta = research.get("_meta")
        endpoint_projections = {
            "persons": (
                "persons",
                [node for node in research.get("nodes", []) if node.get("entity_type") == "Person"],
            ),
            "events": ("events", research.get("events", [])),
            "timeline": ("timeline", research.get("events", [])),
            "sources": ("sources", research.get("sources", [])),
        }
        for payload_name, (field, expected) in endpoint_projections.items():
            payload = payloads.get(payload_name)
            if payload is None:
                continue
            if payload.get("_meta") != research_meta:
                errors.append(f"{payload_name}.json: _meta differs from research.json")
            if payload.get(field) != expected:
                errors.append(
                    f"{payload_name}.json: {field} is not an exact research.json projection"
                )

        known_source_ids = {
            source["source_id"] for source in research.get("sources", [])
        }
        place_labels = {
            node["canonical_label"]
            for node in research.get("nodes", [])
            if node.get("entity_type") == "Place"
        }
        event_ids: set[str] = set()
        event_claim_partition: list[str] = []
        for event in research.get("events", []):
            event_id = event.get("event_id", "<missing-event-id>")
            if event_id in event_ids:
                errors.append(f"duplicate event_id: {event_id}")
            event_ids.add(event_id)

            claim_ids = event.get("claim_ids", [])
            event_claim_partition.extend(claim_ids)
            expected_event_claim_ids = EXPECTED_EVENT_CLAIMS.get(event_id)
            if expected_event_claim_ids is None:
                errors.append(f"{event_id}: not a V7R4 three-anchor event")
            elif claim_ids != expected_event_claim_ids:
                errors.append(
                    f"{event_id}: claim group {claim_ids!r} differs from "
                    f"{expected_event_claim_ids!r}"
                )
            missing_claims = [cid for cid in claim_ids if cid not in claims_by_id]
            if not claim_ids or missing_claims:
                errors.append(
                    f"{event_id}: empty or unknown claim references {missing_claims}"
                )
                continue

            expected_source_ids = {
                source_id
                for claim_id in claim_ids
                for source_id in claims_by_id[claim_id]["source_ids"]
            }
            actual_source_ids = set(event.get("source_ids", []))
            if actual_source_ids != expected_source_ids:
                errors.append(f"{event_id}: source_ids differ from referenced claims")
            if not actual_source_ids.issubset(known_source_ids):
                errors.append(f"{event_id}: references an unknown source")
            if event.get("carrier_count") != len(actual_source_ids):
                errors.append(f"{event_id}: carrier_count is not the unique carrier count")

            expected_independence = max(
                int(claims_by_id[claim_id]["independence_count"])
                for claim_id in claim_ids
            )
            if event.get("independence_count") != expected_independence:
                errors.append(
                    f"{event_id}: independence_count {event.get('independence_count')} "
                    f"does not equal derived value {expected_independence}"
                )

            supporting_claims = [claims_by_id[claim_id] for claim_id in claim_ids]
            expected_date_starts = {
                str(claim["time_start"]) for claim in supporting_claims
            }
            expected_date_ends = {
                str(claim["time_end"]) for claim in supporting_claims
            }
            if expected_date_starts != {str(event.get("date_start"))}:
                errors.append(f"{event_id}: date_start is not derived from its claims")
            if expected_date_ends != {str(event.get("date_end"))}:
                errors.append(f"{event_id}: date_end is not derived from its claims")
            expected_scene_eligible = all(
                claim["scene_eligible"] is True for claim in supporting_claims
            )
            if event.get("scene_eligible") is not expected_scene_eligible:
                errors.append(
                    f"{event_id}: scene_eligible is not the all-claims derivation"
                )
            expected_identity_statuses = sorted(
                {claim["identity_link_status"] for claim in supporting_claims}
            )
            if event.get("identity_link_statuses") != expected_identity_statuses:
                errors.append(
                    f"{event_id}: identity_link_statuses differs from supporting claims"
                )
            expected_identity_anchors = sorted(
                {
                    anchor_id
                    for claim in supporting_claims
                    for anchor_id in claim["identity_anchor_ids"]
                    if anchor_id != "none"
                }
            )
            if event.get("identity_anchor_ids") != expected_identity_anchors:
                errors.append(
                    f"{event_id}: identity_anchor_ids differs from supporting claims"
                )

            location = event.get("location", "")
            if location and location not in place_labels:
                errors.append(
                    f"{event_id}: location is not a known Place node; use context for document scope"
                )
            if not event.get("context"):
                errors.append(f"{event_id}: missing source/document context")

        if event_ids != set(EXPECTED_EVENT_CLAIMS):
            errors.append(
                "research.json: event IDs are not exactly the V7R4 three-anchor set"
            )
        if len(event_claim_partition) != len(set(event_claim_partition)):
            errors.append("research.json: one or more claims are reused across event anchors")
        if set(event_claim_partition) != set(claims_by_id):
            errors.append(
                "research.json: event anchors do not partition all five previewable claims"
            )

    # Freshness is intentionally separate from recorded-generation integrity:
    # the latter proves what the five derived files record; this final read only
    # proves whether CURRENT still names that already-pinned generation.
    if pinned is not None:
        try:
            pinned.assert_fresh()
            freshness_status = "PASS"
        except (GenerationAuthorityError, OSError, ValueError) as exc:
            freshness_status = "FAIL"
            errors.append(f"CURRENT freshness: {exc}")

    summary = {
        "status": "FAIL" if errors else "PASS",
        "recorded_generation_integrity": recorded_integrity_status,
        "current_freshness": freshness_status,
        "generation_id": pinned.generation_id if pinned is not None else None,
        "generation_manifest_sha256": (
            pinned.generation_manifest_sha256 if pinned is not None else None
        ),
        "exporter_version": EXPECTED_EXPORTER_VERSION,
        "approval_scope": EXPECTED_APPROVAL_SCOPE,
        "derived_files": len(payloads),
        "errors": errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    fcntl.flock(verification_lock, fcntl.LOCK_UN)
    os.close(verification_lock)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
