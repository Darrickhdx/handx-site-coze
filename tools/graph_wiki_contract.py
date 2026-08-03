#!/usr/bin/env python3
"""Shared graph/Wiki release contract and safe upstream-drift quarantine."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path
from typing import Any


EXPECTED_COUNTS = {
    "audit_sources": 131,
    "audit_claims": 211,
    "audit_nodes": 229,
    "audit_edges": 127,
    "legacy_nodes": 107,
    "legacy_edges": 151,
    "crosswalk_records": 258,
}

DRIFT_INVENTORY_FIELDS = {
    "record_type",
    "change_type",
    "opaque_key",
    "source_position",
    "record_sha256",
    "migration_status",
    "fact_migration_allowed",
    "public_export_allowed",
    "privacy_review_status",
    "risk_flags",
    "decision",
    "baseline_sha256",
    "live_sha256",
}
OPAQUE_KEY_PATTERN = re.compile(
    r"^legacy-delta-(?:node|edge)-(?:modified|added)-\d{3}$"
)
BLOCKED_DECISION = (
    "仅证明该Legacy增量已被隔离登记；不迁移、不映射、不公开、不构成事实。"
)
BLOCKED_RISK_FLAGS = "legacy-upstream-drift;privacy-unreviewed;internal-only"


def canonical_record_sha256(record: dict[str, Any]) -> str:
    payload = json.dumps(
        record,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def split_crosswalk_values(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def normalize_migration_row(row: dict[str, str]) -> dict[str, Any]:
    return {
        "legacy_key": row["legacy_key"],
        "migration_status": row["migration_status"],
        "new_entity_ids": split_crosswalk_values(row["new_entity_ids"]),
        "new_relation_ids": split_crosswalk_values(row["new_relation_ids"]),
        "candidate_claim_ids": split_crosswalk_values(row["candidate_claim_ids"]),
        "risk_flags": split_crosswalk_values(row["risk_flags"]),
        "decision": row["decision"],
    }


def expected_drift_records(
    baseline_graph: dict[str, Any],
    live_graph: dict[str, Any],
) -> list[dict[str, str]]:
    """Return an opaque, content-addressed inventory of every live delta."""

    records: list[dict[str, str]] = []
    counters = {
        ("node", "modified"): 0,
        ("node", "added"): 0,
        ("edge", "modified"): 0,
        ("edge", "added"): 0,
    }
    for record_type, collection_name in (("node", "nodes"), ("edge", "edges")):
        baseline_records = baseline_graph[collection_name]
        live_records = live_graph[collection_name]
        for index, record in enumerate(live_records, start=1):
            if index <= len(baseline_records):
                if record == baseline_records[index - 1]:
                    continue
                change = "modified"
                change_type = "modified_approved_record"
            else:
                change = "added"
                change_type = "added_candidate"
            counters[(record_type, change)] += 1
            records.append(
                {
                    "record_type": record_type,
                    "change_type": change_type,
                    "opaque_key": (
                        f"legacy-delta-{record_type}-{change}-"
                        f"{counters[(record_type, change)]:03d}"
                    ),
                    "source_position": f"{record_type}:{index}",
                    "record_sha256": canonical_record_sha256(record),
                }
            )
    return records


def load_and_validate_drift_inventory(
    path: Path,
    *,
    baseline_graph: dict[str, Any],
    live_graph: dict[str, Any],
    baseline_sha256: str,
    live_sha256: str,
) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    if not rows or not DRIFT_INVENTORY_FIELDS <= set(rows[0]):
        raise ValueError("Legacy drift inventory is missing required columns")

    expected = expected_drift_records(baseline_graph, live_graph)
    actual_signatures = {
        (
            row["record_type"],
            row["change_type"],
            row["source_position"],
            row["record_sha256"],
        )
        for row in rows
    }
    expected_signatures = {
        (
            row["record_type"],
            row["change_type"],
            row["source_position"],
            row["record_sha256"],
        )
        for row in expected
    }
    if len(actual_signatures) != len(rows):
        raise ValueError("Legacy drift inventory contains duplicate records")
    if actual_signatures != expected_signatures:
        raise ValueError("Legacy drift inventory is stale or incomplete")

    opaque_keys = [row["opaque_key"] for row in rows]
    if len(opaque_keys) != len(set(opaque_keys)) or any(
        OPAQUE_KEY_PATTERN.fullmatch(key) is None for key in opaque_keys
    ):
        raise ValueError("Legacy drift inventory has unsafe opaque keys")
    for row in rows:
        if row["migration_status"] != "blocked_for_fact":
            raise ValueError("Legacy drift inventory contains an unblocked record")
        if row["fact_migration_allowed"] != "false":
            raise ValueError("Legacy drift inventory permits fact migration")
        if row["public_export_allowed"] != "false":
            raise ValueError("Legacy drift inventory permits public export")
        if row["privacy_review_status"] != "unreviewed":
            raise ValueError("Legacy drift inventory bypasses privacy review")
        if row["risk_flags"] != BLOCKED_RISK_FLAGS or row["decision"] != BLOCKED_DECISION:
            raise ValueError("Legacy drift inventory weakens the fixed decision")
        if row["baseline_sha256"] != baseline_sha256:
            raise ValueError("Legacy drift inventory baseline digest is stale")
        if row["live_sha256"] != live_sha256:
            raise ValueError("Legacy drift inventory live digest is stale")

    serialized = json.dumps(rows, ensure_ascii=False)
    forbidden_fragments = ["/" + "Users" + "/", "file://", "detail", "title"]
    for node in live_graph["nodes"][len(baseline_graph["nodes"]) :]:
        forbidden_fragments.extend(
            value for value in (node.get("id", ""), node.get("label", "")) if value
        )
    for edge in live_graph["edges"][len(baseline_graph["edges"]) :]:
        forbidden_fragments.extend(
            value
            for value in (
                edge.get("from", ""),
                edge.get("to", ""),
                edge.get("label", ""),
            )
            if value
        )
    if any(fragment in serialized for fragment in forbidden_fragments):
        raise ValueError("Legacy drift inventory leaks semantic or private content")
    return rows


def assess_quarantinable_legacy_drift(
    approved_legacy: dict[str, Any],
    baseline_graph: dict[str, Any],
    live_graph: dict[str, Any],
    legacy_html_path: Path,
    crosswalk_path: Path,
    drift_inventory_path: Path,
    *,
    baseline_sha256: str,
    live_sha256: str,
) -> dict[str, int] | None:
    """Validate and summarize live Legacy drift while freezing public output."""

    approved_nodes = approved_legacy.get("nodes")
    approved_edges = approved_legacy.get("edges")
    baseline_nodes = baseline_graph.get("nodes")
    baseline_edges = baseline_graph.get("edges")
    live_nodes = live_graph.get("nodes")
    live_edges = live_graph.get("edges")
    if not all(
        isinstance(value, list)
        for value in (
            approved_nodes,
            approved_edges,
            baseline_nodes,
            baseline_edges,
            live_nodes,
            live_edges,
        )
    ):
        raise ValueError("Legacy graph collections are malformed")
    if len(approved_nodes) != len(baseline_nodes) or len(approved_edges) != len(baseline_edges):
        raise ValueError("Approved projection no longer matches the frozen baseline")
    if len(live_nodes) < len(baseline_nodes) or len(live_edges) < len(baseline_edges):
        raise ValueError("Legacy graph removed an approved node or edge")

    public_node_field_changes = 0
    modified_nodes = 0
    for index, baseline in enumerate(baseline_nodes):
        live = live_nodes[index]
        approved = approved_nodes[index]
        for approved_field, baseline_field in (
            ("id", "id"),
            ("label", "label"),
            ("group", "group"),
            ("subgroup", "subgroup"),
            ("period", "period"),
            ("title", "title"),
            ("legacy_reliability", "reliability"),
        ):
            if approved.get(approved_field, "") != baseline.get(baseline_field, ""):
                raise ValueError(
                    f"Approved Legacy node differs from baseline at node:{index + 1}"
                )
        if any(
            baseline.get(field, "") != live.get(field, "")
            for field in ("id", "label", "group")
        ):
            raise ValueError(f"Legacy node approved identity changed at node:{index + 1}")
        if baseline != live:
            modified_nodes += 1
        if any(
            approved.get(approved_field, "") != live.get(live_field, "")
            for approved_field, live_field in (
                ("subgroup", "subgroup"),
                ("period", "period"),
                ("title", "title"),
                ("legacy_reliability", "reliability"),
            )
        ):
            public_node_field_changes += 1

    modified_edges = 0
    public_edge_field_changes = 0
    for index, baseline in enumerate(baseline_edges):
        live = live_edges[index]
        approved = approved_edges[index]
        for field in ("from", "to", "label", "period"):
            if approved.get(field, "") != baseline.get(field, ""):
                raise ValueError(
                    f"Approved Legacy edge differs from baseline at edge:{index + 1}"
                )
        if any(baseline.get(field, "") != live.get(field, "") for field in ("from", "to")):
            raise ValueError(f"Legacy edge approved endpoints changed at edge:{index + 1}")
        if baseline != live:
            modified_edges += 1
        if any(
            approved.get(field, "") != live.get(field, "")
            for field in ("label", "period")
        ):
            public_edge_field_changes += 1

    with crosswalk_path.open(newline="", encoding="utf-8-sig") as stream:
        crosswalk_rows = list(csv.DictReader(stream))
    crosswalk_node_ids = {
        row["legacy_key"] for row in crosswalk_rows if row["record_type"] == "node"
    }
    crosswalk_edge_ids = {
        row["legacy_key"] for row in crosswalk_rows if row["record_type"] == "edge"
    }
    approved_node_ids = {str(node["id"]) for node in approved_nodes}
    approved_edge_ids = {str(edge["id"]) for edge in approved_edges}
    if crosswalk_node_ids != approved_node_ids or crosswalk_edge_ids != approved_edge_ids:
        raise ValueError("Legacy crosswalk no longer matches the approved projection")
    keyed_rows = {
        (row["record_type"], row["legacy_key"]): row for row in crosswalk_rows
    }
    if len(keyed_rows) != len(crosswalk_rows):
        raise ValueError("Legacy crosswalk contains duplicate records")
    for approved in (*approved_nodes, *approved_edges):
        record_type = "node" if "group" in approved else "edge"
        if normalize_migration_row(
            keyed_rows[(record_type, str(approved["id"]))]
        ) != approved.get("migration"):
            raise ValueError(f"Legacy approved migration changed: {approved['id']}")

    marker = "const DATA = "
    html = legacy_html_path.read_text(encoding="utf-8")
    marker_index = html.find(marker)
    if marker_index < 0:
        raise ValueError("Legacy HTML has no embedded DATA payload")
    embedded, _ = json.JSONDecoder().raw_decode(html[marker_index + len(marker) :])
    if embedded != live_graph:
        raise ValueError("Legacy HTML and graph-data.json disagree")

    added_nodes = len(live_nodes) - len(baseline_nodes)
    added_edges = len(live_edges) - len(baseline_edges)
    if added_nodes == 0 and added_edges == 0 and modified_nodes == 0 and modified_edges == 0:
        return None

    inventory_rows = load_and_validate_drift_inventory(
        drift_inventory_path,
        baseline_graph=baseline_graph,
        live_graph=live_graph,
        baseline_sha256=baseline_sha256,
        live_sha256=live_sha256,
    )
    return {
        "approved_nodes": len(approved_nodes),
        "approved_edges": len(approved_edges),
        "quarantined_modified_nodes": modified_nodes,
        "quarantined_modified_edges": modified_edges,
        "quarantined_public_node_field_changes": public_node_field_changes,
        "quarantined_public_edge_field_changes": public_edge_field_changes,
        "quarantined_nodes": added_nodes,
        "quarantined_edges": added_edges,
        "quarantined_inventory_records": len(inventory_rows),
        "quarantined_blocked_records": len(inventory_rows),
    }
