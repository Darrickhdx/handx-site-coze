#!/usr/bin/env python3
"""Verify graph/Wiki counts, provenance, privacy boundaries, and references."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Iterable

from graph_wiki_contract import (
    EXPECTED_COUNTS,
    assess_append_only_legacy_drift,
)


SITE_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = SITE_ROOT.parents[2]
CORPUS_ROOT = WORKSPACE_ROOT / "AI小说"
OUTPUT_ROOT = SITE_ROOT / "public" / "data" / "graph"

INPUTS = {
    "legacy_html": CORPUS_ROOT / "知识图谱" / "苏开元知识图谱-交互版.html",
    "legacy_graph": CORPUS_ROOT / "知识图谱" / "graph-data.json",
    "audit_graph": CORPUS_ROOT / "苏开元重启" / "05-知识图谱-公开版.json",
    "legacy_crosswalk": CORPUS_ROOT / "苏开元重启" / "28-旧知识图谱交叉映射.csv",
    "source_registry": CORPUS_ROOT / "苏开元重启" / "01-来源登记表.csv",
}

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load(name: str) -> dict[str, Any]:
    return json.loads((OUTPUT_ROOT / name).read_text(encoding="utf-8"))


def walk_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from walk_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from walk_strings(item)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"graph-wiki verification failed: {message}")


def main() -> None:
    manifest = load("manifest.json")
    audit = load("audit-graph.json")
    legacy = load("legacy-graph.json")
    crosswalk = load("legacy-crosswalk.json")

    require(manifest["must_not_deploy"] is True, "deployment gate changed")
    require(manifest["counts"] == EXPECTED_COUNTS, "manifest counts changed")
    require(
        manifest["privacy"]
        == {
            "allowed_public_tiers": ["P0", "P1"],
            "legacy_detail_included": False,
            "absolute_paths_included": False,
            "crosswalk_creates_facts": False,
        },
        "privacy contract changed",
    )

    drifted_inputs: list[str] = []
    for key, path in INPUTS.items():
        require(path.is_file(), f"missing input {path.name}")
        if manifest["inputs"][key]["sha256"] != sha256(path):
            drifted_inputs.append(key)

    quarantine: dict[str, int] | None = None
    if drifted_inputs:
        require(
            set(drifted_inputs) == {"legacy_html", "legacy_graph"},
            f"unsafe input digest drift: {', '.join(drifted_inputs)}",
        )
        try:
            quarantine = assess_append_only_legacy_drift(
                legacy,
                json.loads(INPUTS["legacy_graph"].read_text(encoding="utf-8")),
                INPUTS["legacy_html"],
                INPUTS["legacy_crosswalk"],
            )
        except ValueError as error:
            raise SystemExit(
                f"graph-wiki verification failed: unsafe Legacy drift: {error}"
            ) from error
        require(quarantine is not None, "Legacy digest drift has no additions")

    for filename, expected_digest in manifest["outputs"].items():
        require(sha256(OUTPUT_ROOT / filename) == expected_digest, f"output drift: {filename}")

    require(len(audit["sources"]) == EXPECTED_COUNTS["audit_sources"], "audit source count")
    require(len(audit["claims"]) == EXPECTED_COUNTS["audit_claims"], "audit claim count")
    require(len(audit["nodes"]) == EXPECTED_COUNTS["audit_nodes"], "audit node count")
    require(len(audit["edges"]) == EXPECTED_COUNTS["audit_edges"], "audit edge count")
    require(len(legacy["nodes"]) == EXPECTED_COUNTS["legacy_nodes"], "Legacy node count")
    require(len(legacy["edges"]) == EXPECTED_COUNTS["legacy_edges"], "Legacy edge count")
    require(
        len(crosswalk["records"]) == EXPECTED_COUNTS["crosswalk_records"],
        "crosswalk record count",
    )

    allowed_tiers = {"P0", "P1"}
    for collection_name in ("sources", "claims", "nodes", "edges"):
        for record in audit[collection_name]:
            require(
                record.get("public_tier") in allowed_tiers,
                f"{collection_name} contains non-public tier",
            )

    for source in audit["sources"]:
        public_url = source.get("public_url", "")
        require(
            not public_url or public_url.startswith("https://"),
            f"source has unsafe public URL: {source['source_id']}",
        )
        require(
            source.get("public_url_status")
            in {
                "official_or_institutional",
                "registered_public_locator",
                "not_available",
            },
            f"source has invalid public URL status: {source['source_id']}",
        )
        require(
            source.get("local_copy_status")
            in {
                "registered_local_carrier",
                "not_recorded_in_public_projection",
            },
            f"source has invalid local copy status: {source['source_id']}",
        )

    all_client_data = [audit, legacy, crosswalk, manifest]
    macos_home_prefix = "/" + "Users" + "/"
    for text in walk_strings(all_client_data):
        require(macos_home_prefix not in text, "absolute macOS path leaked into client data")
        require("file://" not in text, "file URL leaked into client data")

    source_ids = {source["source_id"] for source in audit["sources"]}
    claim_ids = {claim["claim_id"] for claim in audit["claims"]}
    entity_ids = {node["entity_id"] for node in audit["nodes"]}
    source_by_id = {source["source_id"]: source for source in audit["sources"]}
    claim_by_id = {claim["claim_id"]: claim for claim in audit["claims"]}

    require(len(source_ids) == len(audit["sources"]), "duplicate source id")
    require(len(claim_ids) == len(audit["claims"]), "duplicate claim id")
    require(len(entity_ids) == len(audit["nodes"]), "duplicate entity id")

    for claim in audit["claims"]:
        require(claim["subject_id"] in entity_ids, f"dangling subject in {claim['claim_id']}")
        for place_id in claim.get("place_ids", []):
            require(place_id in entity_ids, f"dangling place in {claim['claim_id']}")
        for source_id in claim["source_ids"]:
            require(source_id in source_ids, f"dangling source in {claim['claim_id']}")
        for conflict_id in claim.get("conflicts_with", []):
            require(conflict_id in claim_ids, f"dangling conflict in {claim['claim_id']}")

    for node in audit["nodes"]:
        for source_id in node["source_ids"]:
            require(source_id in source_ids, f"dangling node source in {node['entity_id']}")

    for edge in audit["edges"]:
        require(edge["from_entity_id"] in entity_ids, f"dangling edge source in {edge['edge_id']}")
        require(edge["to_entity_id"] in entity_ids, f"dangling edge target in {edge['edge_id']}")
        require(bool(edge["claim_ids"]), f"claimless audited edge {edge['edge_id']}")
        for claim_id in edge["claim_ids"]:
            require(claim_id in claim_ids, f"dangling edge claim in {edge['edge_id']}")
            claim = claim_by_id[claim_id]
            require(bool(claim["locator"]), f"claim without locator: {claim_id}")
            require(bool(claim["source_ids"]), f"claim without source: {claim_id}")
            for source_id in claim["source_ids"]:
                require(
                    bool(source_by_id[source_id]["locator"]),
                    f"source without locator: {source_id}",
                )

    legacy_node_ids = {node["id"] for node in legacy["nodes"]}
    legacy_edge_ids = {edge["id"] for edge in legacy["edges"]}
    require(len(legacy_node_ids) == len(legacy["nodes"]), "duplicate Legacy node id")
    require(len(legacy_edge_ids) == len(legacy["edges"]), "duplicate Legacy edge id")
    require(
        all("detail" not in node for node in legacy["nodes"]),
        "Legacy detail text must not reach client data",
    )
    for edge in legacy["edges"]:
        require(edge["from"] in legacy_node_ids, f"dangling Legacy source in {edge['id']}")
        require(edge["to"] in legacy_node_ids, f"dangling Legacy target in {edge['id']}")

    node_crosswalk_keys = {
        record["legacy_key"]
        for record in crosswalk["records"]
        if record["record_type"] == "node"
    }
    edge_crosswalk_keys = {
        record["legacy_key"]
        for record in crosswalk["records"]
        if record["record_type"] == "edge"
    }
    require(node_crosswalk_keys == legacy_node_ids, "Legacy node crosswalk mismatch")
    require(edge_crosswalk_keys == legacy_edge_ids, "Legacy edge crosswalk mismatch")
    require(legacy["layer"] == "legacy_clue_only", "Legacy layer can never be factual")

    print(
        "graph-wiki verified:",
        f"audit {len(entity_ids)}/{len(audit['edges'])}/{len(claim_ids)}/{len(source_ids)},",
        f"legacy {len(legacy_node_ids)}/{len(legacy_edge_ids)},",
        f"crosswalk {len(crosswalk['records'])},",
        (
            "upstream current"
            if quarantine is None
            else (
                f"quarantined changed {quarantine['quarantined_modified_nodes']} nodes/"
                f"{quarantine['quarantined_modified_edges']} edges and added "
                f"{quarantine['quarantined_nodes']} nodes/"
                f"{quarantine['quarantined_edges']} edges"
            )
        ),
    )


if __name__ == "__main__":
    main()
