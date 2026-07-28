#!/usr/bin/env python3
"""Shared graph/Wiki release contract and safe upstream-drift quarantine."""

from __future__ import annotations

import csv
import json
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


def assess_quarantinable_legacy_drift(
    approved_legacy: dict[str, Any],
    live_graph: dict[str, Any],
    legacy_html_path: Path,
    crosswalk_path: Path,
) -> dict[str, int] | None:
    """Classify Legacy changes that can remain outside the approved projection.

    Identity fields, ordering, edge endpoints, HTML/JSON coherence and the
    approved crosswalk are stable. Display metadata changes and appended,
    unmapped records may be reported while the client projection stays frozen.
    Returning ``None`` means no quarantinable difference exists.
    """

    approved_nodes = approved_legacy.get("nodes")
    approved_edges = approved_legacy.get("edges")
    live_nodes = live_graph.get("nodes")
    live_edges = live_graph.get("edges")
    if not all(
        isinstance(value, list)
        for value in (approved_nodes, approved_edges, live_nodes, live_edges)
    ):
        raise ValueError("Legacy graph collections are malformed")
    if len(live_nodes) < len(approved_nodes) or len(live_edges) < len(approved_edges):
        raise ValueError("Legacy graph removed an approved node or edge")

    stable_node_fields = {
        "id": "id",
        "label": "label",
        "group": "group",
    }
    mutable_node_fields = {
        "subgroup": "subgroup",
        "period": "period",
        "title": "title",
        "legacy_reliability": "reliability",
    }
    modified_nodes = 0
    for index, approved in enumerate(approved_nodes):
        live = live_nodes[index]
        if not isinstance(approved, dict) or not isinstance(live, dict):
            raise ValueError(f"Legacy node {index + 1} is malformed")
        for approved_field, live_field in stable_node_fields.items():
            if approved.get(approved_field, "") != live.get(live_field, ""):
                raise ValueError(
                    f"Legacy node approved prefix changed: {approved.get('id', index)}"
                )
        if any(
            approved.get(approved_field, "") != live.get(live_field, "")
            for approved_field, live_field in mutable_node_fields.items()
        ):
            modified_nodes += 1

    modified_edges = 0
    for index, approved in enumerate(approved_edges):
        live = live_edges[index]
        if not isinstance(approved, dict) or not isinstance(live, dict):
            raise ValueError(f"Legacy edge {index + 1} is malformed")
        if any(
            approved.get(field, "") != live.get(field, "")
            for field in ("from", "to")
        ):
            raise ValueError(
                f"Legacy edge approved prefix changed: {approved.get('id', index)}"
            )
        if any(
            approved.get(field, "") != live.get(field, "")
            for field in ("label", "period")
        ):
            modified_edges += 1

    with crosswalk_path.open(newline="", encoding="utf-8-sig") as stream:
        crosswalk_rows = list(csv.DictReader(stream))
    approved_node_ids = {str(node["id"]) for node in approved_nodes}
    approved_edge_ids = {str(edge["id"]) for edge in approved_edges}
    crosswalk_node_ids = {
        row["legacy_key"]
        for row in crosswalk_rows
        if row["record_type"] == "node"
    }
    crosswalk_edge_ids = {
        row["legacy_key"]
        for row in crosswalk_rows
        if row["record_type"] == "edge"
    }
    if (
        crosswalk_node_ids != approved_node_ids
        or crosswalk_edge_ids != approved_edge_ids
    ):
        raise ValueError("Legacy crosswalk no longer matches the approved projection")

    marker = "const DATA = "
    html = legacy_html_path.read_text(encoding="utf-8")
    marker_index = html.find(marker)
    if marker_index < 0:
        raise ValueError("Legacy HTML has no embedded DATA payload")
    embedded, _ = json.JSONDecoder().raw_decode(
        html[marker_index + len(marker) :]
    )
    if embedded != live_graph:
        raise ValueError("Legacy HTML and graph-data.json disagree")

    added_nodes = len(live_nodes) - len(approved_nodes)
    added_edges = len(live_edges) - len(approved_edges)
    if (
        added_nodes == 0
        and added_edges == 0
        and modified_nodes == 0
        and modified_edges == 0
    ):
        return None
    return {
        "approved_nodes": len(approved_nodes),
        "approved_edges": len(approved_edges),
        "quarantined_modified_nodes": modified_nodes,
        "quarantined_modified_edges": modified_edges,
        "quarantined_nodes": added_nodes,
        "quarantined_edges": added_edges,
    }
