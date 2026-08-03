#!/usr/bin/env python3
"""Build frozen public graph data plus an opaque local drift inbox.

The visitor-facing Legacy projection always comes from the approved 2026-07-20
baseline.  Live Legacy additions can only update a count-only public summary and
an ignored, local-only review inbox; they can never become facts or client data.
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from graph_wiki_contract import assess_quarantinable_legacy_drift


SITE_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = SITE_ROOT.parents[2]
CORPUS_ROOT = WORKSPACE_ROOT / "AI小说"

LEGACY_HTML = CORPUS_ROOT / "知识图谱" / "苏开元知识图谱-交互版.html"
LEGACY_GRAPH = CORPUS_ROOT / "知识图谱" / "graph-data.json"
LEGACY_BASELINE = CORPUS_ROOT / "知识图谱" / "graph-data.backup-20260720.json"
AUDIT_GRAPH = CORPUS_ROOT / "苏开元重启" / "05-知识图谱-公开版.json"
CROSSWALK = CORPUS_ROOT / "苏开元重启" / "28-旧知识图谱交叉映射.csv"
DRIFT_INVENTORY = CORPUS_ROOT / "苏开元重启" / "40-Legacy增量隔离处置.csv"
SOURCE_REGISTRY = CORPUS_ROOT / "苏开元重启" / "01-来源登记表.csv"

OUTPUT_ROOT = SITE_ROOT / "public" / "data" / "graph"
PRIVATE_RUNTIME_ROOT = SITE_ROOT / "private-runtime"
PRIVATE_MIGRATION_INBOX = PRIVATE_RUNTIME_ROOT / "graph-migration-inbox.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def json_bytes(value: Any) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False).encode("utf-8")
        + b"\n"
    )


def split_ids(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def migration_record(row: dict[str, str]) -> dict[str, Any]:
    return {
        "legacy_key": row["legacy_key"],
        "migration_status": row["migration_status"],
        "new_entity_ids": split_ids(row["new_entity_ids"]),
        "new_relation_ids": split_ids(row["new_relation_ids"]),
        "candidate_claim_ids": split_ids(row["candidate_claim_ids"]),
        "risk_flags": split_ids(row["risk_flags"]),
        "decision": row["decision"],
    }


def safe_quarantine_summary(quarantine: dict[str, int]) -> dict[str, int]:
    return {
        key: int(quarantine[key])
        for key in (
            "approved_nodes",
            "approved_edges",
            "quarantined_modified_nodes",
            "quarantined_modified_edges",
            "quarantined_public_node_field_changes",
            "quarantined_public_edge_field_changes",
            "quarantined_nodes",
            "quarantined_edges",
            "quarantined_inventory_records",
            "quarantined_blocked_records",
        )
    }


def build_audit_bundle(
    audit_source: dict[str, Any],
    source_registry: dict[str, dict[str, str]],
) -> dict[str, Any]:
    audit_sources: list[dict[str, Any]] = []
    for source in audit_source["sources"]:
        registry = source_registry.get(source["source_id"], {})
        canonical_path = registry.get("canonical_path", "").strip()
        public_url = (
            canonical_path
            if canonical_path.startswith("https://") and source["public_tier"] == "P0"
            else ""
        )
        carrier_status = registry.get("carrier_status", "")
        has_local_copy = (
            bool(canonical_path)
            and not canonical_path.startswith(("http://", "https://"))
        ) or "本地" in " ".join(
            [registry.get("access_scope", ""), registry.get("notes", "")]
        )
        audit_sources.append(
            {
                **source,
                "public_url": public_url,
                "public_url_status": (
                    "official_or_institutional"
                    if public_url and "official" in carrier_status
                    else "registered_public_locator"
                    if public_url
                    else "not_available"
                ),
                "local_copy_status": (
                    "registered_local_carrier"
                    if has_local_copy
                    else "not_recorded_in_public_projection"
                ),
            }
        )
    return {
        "schema_version": audit_source["schema_version"],
        "layer": "audited_public_projection",
        "scope": audit_source["scope"],
        "source_generated_at_utc": audit_source["generated_at_utc"],
        "warning": audit_source["warning"],
        "model": audit_source["model"],
        "sources": audit_sources,
        "claims": audit_source["claims"],
        "nodes": audit_source["nodes"],
        "edges": audit_source["edges"],
    }


def build_approved_legacy_bundle(
    baseline: dict[str, Any],
    crosswalk_rows: list[dict[str, str]],
) -> dict[str, Any]:
    node_migrations = {
        row["legacy_key"]: migration_record(row)
        for row in crosswalk_rows
        if row["record_type"] == "node"
    }
    edge_migrations = {
        row["legacy_key"]: migration_record(row)
        for row in crosswalk_rows
        if row["record_type"] == "edge"
    }
    expected_nodes = {node["id"] for node in baseline["nodes"]}
    expected_edges = {
        f"legacy-edge-{index:03d}"
        for index, _edge in enumerate(baseline["edges"], start=1)
    }
    if set(node_migrations) != expected_nodes or set(edge_migrations) != expected_edges:
        raise SystemExit("Approved Legacy crosswalk no longer matches the frozen baseline")

    nodes = [
        {
            "id": node["id"],
            "label": node["label"],
            "group": node["group"],
            "subgroup": node.get("subgroup", ""),
            "period": node.get("period", ""),
            "title": node.get("title", ""),
            "legacy_reliability": node.get("reliability", ""),
            "migration": node_migrations[node["id"]],
        }
        for node in baseline["nodes"]
    ]
    edges = []
    for index, edge in enumerate(baseline["edges"], start=1):
        legacy_id = f"legacy-edge-{index:03d}"
        edges.append(
            {
                "id": legacy_id,
                "from": edge["from"],
                "to": edge["to"],
                "label": edge["label"],
                "period": edge.get("period", ""),
                "migration": edge_migrations[legacy_id],
            }
        )
    return {
        "schema_version": "1.0",
        "layer": "legacy_clue_only",
        "warning": (
            "这是旧研究候选索引，不是事实图。旧详情、A/B/C评级和关系均未迁移为"
            "新版事实；请通过迁移裁决与新版主张重新核验。"
        ),
        "source_digest": sha256(LEGACY_BASELINE),
        "source_built": baseline.get("meta", {}).get("built", ""),
        "periods": baseline.get("meta", {}).get("periods", []),
        "nodes": nodes,
        "edges": edges,
    }


def build_crosswalk_bundle(crosswalk_rows: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "warning": "迁移映射只说明索引去向；不得据此合并身份、生成关系或升级证据。",
        "source_digest": sha256(CROSSWALK),
        "records": [
            {
                "record_type": row["record_type"],
                "legacy_label": row["legacy_label"],
                "legacy_group": row["legacy_group"],
                "legacy_reliability": row["legacy_reliability"],
                "legacy_period": row["legacy_period"],
                **migration_record(row),
            }
            for row in crosswalk_rows
        ],
    }


def build_drift_summary(
    quarantine: dict[str, int] | None,
    live_graph: dict[str, Any],
    approved_legacy: dict[str, Any],
) -> dict[str, Any]:
    active = quarantine is not None
    return {
        "schema_version": "1.0",
        "project": "Handx web0.1",
        "must_not_deploy": True,
        "status": "quarantined" if active else "approved_current",
        "message": (
            "上游 Legacy 候选已隔离登记，未进入访客图谱。"
            if active
            else "上游 Legacy 数据与批准投影一致。"
        ),
        "approved_projection": {
            "nodes": len(approved_legacy["nodes"]),
            "edges": len(approved_legacy["edges"]),
        },
        "upstream_observed": {
            "nodes": len(live_graph["nodes"]),
            "edges": len(live_graph["edges"]),
        },
        "review": safe_quarantine_summary(quarantine) if quarantine else {},
        "privacy": {
            "record_ids_included": False,
            "labels_included": False,
            "edge_endpoints_included": False,
            "legacy_detail_included": False,
            "absolute_paths_included": False,
        },
    }


def build_private_migration_inbox(
    quarantine: dict[str, int] | None,
    drift_rows: list[dict[str, str]],
) -> dict[str, Any]:
    records = [
        {
            "opaque_key": row["opaque_key"],
            "record_type": row["record_type"],
            "change_type": row["change_type"],
            "source_position": row["source_position"],
            "record_sha256": row["record_sha256"],
            "privacy_tier": "P2_or_P3_review",
            "person_status": (
                "not_assessed" if row["record_type"] == "node" else "not_applicable"
            ),
            "consent_status": "not_assessed",
            "evidence_scope": "legacy_clue_only",
            "fact_status": row["migration_status"],
            "rights_status": "not_assessed",
            "publication_status": "local_only",
            "risk_flags": split_ids(row["risk_flags"]),
            "decision": row["decision"],
        }
        for row in drift_rows
    ] if quarantine else []
    return {
        "schema_version": "1.0",
        "project": "Handx web0.1",
        "must_not_deploy": True,
        "status": "read_only_review",
        "summary": safe_quarantine_summary(quarantine) if quarantine else {},
        "records": records,
    }


def atomic_write_json(path: Path, value: Any) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(json_bytes(value))
    os.replace(temporary, path)


def write_private_migration_inbox(payload: dict[str, Any]) -> None:
    PRIVATE_RUNTIME_ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(PRIVATE_RUNTIME_ROOT, 0o700)
    atomic_write_json(PRIVATE_MIGRATION_INBOX, payload)
    os.chmod(PRIVATE_MIGRATION_INBOX, 0o600)


def main() -> None:
    required = (
        LEGACY_HTML,
        LEGACY_GRAPH,
        LEGACY_BASELINE,
        AUDIT_GRAPH,
        CROSSWALK,
        DRIFT_INVENTORY,
        SOURCE_REGISTRY,
    )
    for path in required:
        if not path.is_file():
            raise SystemExit(f"Required graph input is missing: {path.name}")
    if os.environ.get("ALLOW_LEGACY_GRAPH_REFRESH") == "1":
        raise SystemExit(
            "ALLOW_LEGACY_GRAPH_REFRESH is not an approval. "
            "Migrate records into the audited claim graph and review them individually."
        )

    live_graph = json.loads(LEGACY_GRAPH.read_text(encoding="utf-8"))
    baseline_graph = json.loads(LEGACY_BASELINE.read_text(encoding="utf-8"))
    audit_source = json.loads(AUDIT_GRAPH.read_text(encoding="utf-8"))
    with CROSSWALK.open(newline="", encoding="utf-8-sig") as stream:
        crosswalk_rows = list(csv.DictReader(stream))
    with DRIFT_INVENTORY.open(newline="", encoding="utf-8-sig") as stream:
        drift_rows = list(csv.DictReader(stream))
    with SOURCE_REGISTRY.open(newline="", encoding="utf-8-sig") as stream:
        source_registry = {row["source_id"]: row for row in csv.DictReader(stream)}

    audit_bundle = build_audit_bundle(audit_source, source_registry)
    approved_legacy = build_approved_legacy_bundle(baseline_graph, crosswalk_rows)
    crosswalk_bundle = build_crosswalk_bundle(crosswalk_rows)
    try:
        quarantine = assess_quarantinable_legacy_drift(
            approved_legacy,
            baseline_graph,
            live_graph,
            LEGACY_HTML,
            CROSSWALK,
            DRIFT_INVENTORY,
            baseline_sha256=sha256(LEGACY_BASELINE),
            live_sha256=sha256(LEGACY_GRAPH),
        )
    except ValueError as error:
        raise SystemExit(f"Legacy graph drift is unsafe: {error}") from error

    drift_summary = build_drift_summary(quarantine, live_graph, approved_legacy)
    output_values = {
        "audit-graph.json": audit_bundle,
        "legacy-graph.json": approved_legacy,
        "legacy-crosswalk.json": crosswalk_bundle,
        "legacy-drift-summary.json": drift_summary,
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for filename, value in output_values.items():
        atomic_write_json(OUTPUT_ROOT / filename, value)
    output_hashes = {
        filename: sha256(OUTPUT_ROOT / filename) for filename in output_values
    }

    review = safe_quarantine_summary(quarantine) if quarantine else {}
    manifest = {
        "schema_version": "1.1",
        "project": "Handx web0.1",
        "must_not_deploy": True,
        "source_generated_at_utc": audit_source["generated_at_utc"],
        "inputs": {
            "legacy_baseline": {
                "filename": LEGACY_BASELINE.name,
                "sha256": sha256(LEGACY_BASELINE),
            },
            "legacy_crosswalk": {
                "filename": CROSSWALK.name,
                "sha256": sha256(CROSSWALK),
            },
            "audit_graph": {
                "filename": AUDIT_GRAPH.name,
                "sha256": sha256(AUDIT_GRAPH),
            },
            "source_registry": {
                "filename": SOURCE_REGISTRY.name,
                "sha256": sha256(SOURCE_REGISTRY),
            },
        },
        "quarantine": {
            "status": "active" if quarantine else "clear",
            "review": review,
            "current_inputs": {
                "legacy_html_sha256": sha256(LEGACY_HTML),
                "legacy_graph_sha256": sha256(LEGACY_GRAPH),
                "drift_inventory_sha256": sha256(DRIFT_INVENTORY),
            },
            "private_inbox": {
                "generated": True,
                "served_to_browser": False,
                "record_count": len(drift_rows) if quarantine else 0,
            },
        },
        "counts": {
            "audit_sources": len(audit_bundle["sources"]),
            "audit_claims": len(audit_bundle["claims"]),
            "audit_nodes": len(audit_bundle["nodes"]),
            "audit_edges": len(audit_bundle["edges"]),
            "legacy_nodes": len(approved_legacy["nodes"]),
            "legacy_edges": len(approved_legacy["edges"]),
            "crosswalk_records": len(crosswalk_bundle["records"]),
        },
        "privacy": {
            "allowed_public_tiers": ["P0", "P1"],
            "legacy_detail_included": False,
            "absolute_paths_included": False,
            "crosswalk_creates_facts": False,
            "quarantine_details_included": False,
        },
        "outputs": output_hashes,
    }
    atomic_write_json(OUTPUT_ROOT / "manifest.json", manifest)
    write_private_migration_inbox(
        build_private_migration_inbox(quarantine, drift_rows)
    )

    if quarantine:
        print(
            "graph-wiki data built with Legacy quarantine:",
            f"audit {len(audit_bundle['nodes'])}/{len(audit_bundle['edges'])},",
            f"approved Legacy {len(approved_legacy['nodes'])}/{len(approved_legacy['edges'])},",
            f"blocked drift {quarantine['quarantined_inventory_records']} records",
        )
    else:
        print("graph-wiki data built: upstream Legacy matches approved projection")


if __name__ == "__main__":
    main()
