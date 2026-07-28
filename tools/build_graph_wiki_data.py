#!/usr/bin/env python3
"""Build the local-only audited graph, Legacy clue graph, and migration manifest.

The generated client data is deliberately narrower than the source corpus:
- the audited graph comes only from the P0/P1 public projection;
- Legacy node ``detail`` text is never copied;
- crosswalk decisions stay advisory and never create audited facts.
"""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any


SITE_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = SITE_ROOT.parents[2]
CORPUS_ROOT = WORKSPACE_ROOT / "AI小说"

LEGACY_HTML = CORPUS_ROOT / "知识图谱" / "苏开元知识图谱-交互版.html"
LEGACY_GRAPH = CORPUS_ROOT / "知识图谱" / "graph-data.json"
AUDIT_GRAPH = CORPUS_ROOT / "苏开元重启" / "05-知识图谱-公开版.json"
CROSSWALK = CORPUS_ROOT / "苏开元重启" / "28-旧知识图谱交叉映射.csv"
SOURCE_REGISTRY = CORPUS_ROOT / "苏开元重启" / "01-来源登记表.csv"

OUTPUT_ROOT = SITE_ROOT / "public" / "data" / "graph"


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


def unmapped_migration(legacy_key: str) -> dict[str, Any]:
    """Fail closed when the live Legacy graph grows ahead of its crosswalk."""
    return {
        "legacy_key": legacy_key,
        "migration_status": "unmapped_source_change",
        "new_entity_ids": [],
        "new_relation_ids": [],
        "candidate_claim_ids": [],
        "risk_flags": ["requires_crosswalk_review"],
        "decision": (
            "上游旧图新增记录，尚未完成人工交叉映射；仅保留为 Legacy 线索，"
            "不得据此创建事实、合并身份或生成关系。"
        ),
    }


def main() -> None:
    for path in (
        LEGACY_HTML,
        LEGACY_GRAPH,
        AUDIT_GRAPH,
        CROSSWALK,
        SOURCE_REGISTRY,
    ):
        if not path.is_file():
            raise SystemExit(f"Required graph input is missing: {path.name}")

    legacy_source = json.loads(LEGACY_GRAPH.read_text(encoding="utf-8"))
    audit_source = json.loads(AUDIT_GRAPH.read_text(encoding="utf-8"))
    with CROSSWALK.open(newline="", encoding="utf-8-sig") as stream:
        crosswalk_rows = list(csv.DictReader(stream))
    with SOURCE_REGISTRY.open(newline="", encoding="utf-8-sig") as stream:
        source_registry = {
            row["source_id"]: row for row in csv.DictReader(stream)
        }

    node_crosswalk = {
        row["legacy_key"]: row
        for row in crosswalk_rows
        if row["record_type"] == "node"
    }
    edge_crosswalk = {
        row["legacy_key"]: row
        for row in crosswalk_rows
        if row["record_type"] == "edge"
    }

    generated_crosswalk_records: list[dict[str, Any]] = []
    legacy_nodes: list[dict[str, Any]] = []
    for node in legacy_source["nodes"]:
        legacy_id = node["id"]
        crosswalk_row = node_crosswalk.get(legacy_id)
        if crosswalk_row and (
            crosswalk_row["legacy_label"] != node["label"]
            or crosswalk_row["legacy_group"] != node["group"]
        ):
            raise SystemExit(f"Legacy node crosswalk drift: {legacy_id}")
        migration = (
            migration_record(crosswalk_row)
            if crosswalk_row
            else unmapped_migration(legacy_id)
        )
        legacy_nodes.append(
            {
                "id": legacy_id,
                "label": node["label"],
                "group": node["group"],
                "subgroup": node.get("subgroup", ""),
                "period": node.get("period", ""),
                "title": node.get("title", ""),
                "legacy_reliability": node.get("reliability", ""),
                "migration": migration,
            }
        )
        generated_crosswalk_records.append(
            {
                "record_type": "node",
                "legacy_label": (
                    crosswalk_row["legacy_label"]
                    if crosswalk_row
                    else node["label"]
                ),
                "legacy_group": (
                    crosswalk_row["legacy_group"]
                    if crosswalk_row
                    else node["group"]
                ),
                "legacy_reliability": (
                    crosswalk_row["legacy_reliability"]
                    if crosswalk_row
                    else node.get("reliability", "")
                ),
                "legacy_period": (
                    crosswalk_row["legacy_period"]
                    if crosswalk_row
                    else node.get("period", "")
                ),
                **migration,
            }
        )

    legacy_edges: list[dict[str, Any]] = []
    for index, edge in enumerate(legacy_source["edges"], start=1):
        legacy_id = f"legacy-edge-{index:03d}"
        crosswalk_row = edge_crosswalk.get(legacy_id)
        edge_label = f"{edge['from']} --{edge['label']}--> {edge['to']}"
        if crosswalk_row and crosswalk_row["legacy_label"] != edge_label:
            raise SystemExit(f"Legacy edge crosswalk drift: {legacy_id}")
        migration = (
            migration_record(crosswalk_row)
            if crosswalk_row
            else unmapped_migration(legacy_id)
        )
        legacy_edges.append(
            {
                "id": legacy_id,
                "from": edge["from"],
                "to": edge["to"],
                "label": edge["label"],
                "period": edge.get("period", ""),
                "migration": migration,
            }
        )
        generated_crosswalk_records.append(
            {
                "record_type": "edge",
                "legacy_label": (
                    crosswalk_row["legacy_label"]
                    if crosswalk_row
                    else edge_label
                ),
                "legacy_group": (
                    crosswalk_row["legacy_group"]
                    if crosswalk_row
                    else "relation"
                ),
                "legacy_reliability": (
                    crosswalk_row["legacy_reliability"]
                    if crosswalk_row
                    else ""
                ),
                "legacy_period": (
                    crosswalk_row["legacy_period"]
                    if crosswalk_row
                    else edge.get("period", "")
                ),
                **migration,
            }
        )

    legacy_bundle = {
        "schema_version": "1.0",
        "layer": "legacy_clue_only",
        "warning": (
            "这是旧研究候选索引，不是事实图。旧详情、A/B/C评级和关系均未迁移为"
            "新版事实；请通过迁移裁决与新版主张重新核验。"
        ),
        "source_digest": sha256(LEGACY_GRAPH),
        "source_built": legacy_source.get("meta", {}).get("built", ""),
        "periods": legacy_source.get("meta", {}).get("periods", []),
        "nodes": legacy_nodes,
        "edges": legacy_edges,
    }

    crosswalk_bundle = {
        "schema_version": "1.0",
        "warning": "迁移映射只说明索引去向；不得据此合并身份、生成关系或升级证据。",
        "source_digest": sha256(CROSSWALK),
        "records": generated_crosswalk_records,
    }

    audit_sources: list[dict[str, Any]] = []
    for source in audit_source["sources"]:
        registry = source_registry.get(source["source_id"], {})
        canonical_path = registry.get("canonical_path", "").strip()
        public_url = (
            canonical_path
            if canonical_path.startswith("https://")
            and source["public_tier"] == "P0"
            else ""
        )
        carrier_status = registry.get("carrier_status", "")
        has_local_copy = (
            bool(canonical_path)
            and not canonical_path.startswith(("http://", "https://"))
        ) or "本地" in " ".join(
            [
                registry.get("access_scope", ""),
                registry.get("notes", ""),
            ]
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

    audit_bundle = {
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

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    output_values = {
        "audit-graph.json": audit_bundle,
        "legacy-graph.json": legacy_bundle,
        "legacy-crosswalk.json": crosswalk_bundle,
    }
    output_hashes: dict[str, str] = {}
    for filename, value in output_values.items():
        output_path = OUTPUT_ROOT / filename
        output_path.write_bytes(json_bytes(value))
        output_hashes[filename] = sha256(output_path)

    manifest = {
        "schema_version": "1.0",
        "project": "Handx web0.1",
        "must_not_deploy": True,
        "source_generated_at_utc": audit_source["generated_at_utc"],
        "inputs": {
            "legacy_html": {
                "filename": LEGACY_HTML.name,
                "sha256": sha256(LEGACY_HTML),
            },
            "legacy_graph": {
                "filename": LEGACY_GRAPH.name,
                "sha256": sha256(LEGACY_GRAPH),
            },
            "audit_graph": {
                "filename": AUDIT_GRAPH.name,
                "sha256": sha256(AUDIT_GRAPH),
            },
            "legacy_crosswalk": {
                "filename": CROSSWALK.name,
                "sha256": sha256(CROSSWALK),
            },
            "source_registry": {
                "filename": SOURCE_REGISTRY.name,
                "sha256": sha256(SOURCE_REGISTRY),
            },
        },
        "counts": {
            "audit_sources": len(audit_bundle["sources"]),
            "audit_claims": len(audit_bundle["claims"]),
            "audit_nodes": len(audit_bundle["nodes"]),
            "audit_edges": len(audit_bundle["edges"]),
            "legacy_nodes": len(legacy_bundle["nodes"]),
            "legacy_edges": len(legacy_bundle["edges"]),
            "crosswalk_records": len(crosswalk_bundle["records"]),
        },
        "privacy": {
            "allowed_public_tiers": ["P0", "P1"],
            "legacy_detail_included": False,
            "absolute_paths_included": False,
            "crosswalk_creates_facts": False,
        },
        "outputs": output_hashes,
    }
    (OUTPUT_ROOT / "manifest.json").write_bytes(json_bytes(manifest))

    print(
        "graph-wiki data built:",
        f"audit {len(audit_bundle['nodes'])}/{len(audit_bundle['edges'])},",
        f"legacy {len(legacy_bundle['nodes'])}/{len(legacy_bundle['edges'])},",
        f"crosswalk {len(crosswalk_bundle['records'])}",
    )


if __name__ == "__main__":
    main()
