#!/usr/bin/env python3
"""Adversarial tests for the frozen Legacy projection and drift inventory."""

from __future__ import annotations

import csv
import copy
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from graph_wiki_contract import assess_quarantinable_legacy_drift


SITE_ROOT = Path(__file__).resolve().parents[1]
CORPUS_ROOT = SITE_ROOT.parents[2] / "AI小说"
OUTPUT_ROOT = SITE_ROOT / "research-data" / "graph"
BASELINE = CORPUS_ROOT / "知识图谱" / "graph-data.backup-20260720.json"
LIVE = CORPUS_ROOT / "知识图谱" / "graph-data.json"
LEGACY_HTML = CORPUS_ROOT / "知识图谱" / "苏开元知识图谱-交互版.html"
CROSSWALK = CORPUS_ROOT / "苏开元重启" / "28-旧知识图谱交叉映射.csv"
DRIFT_INVENTORY = CORPUS_ROOT / "苏开元重启" / "40-Legacy增量隔离处置.csv"


def file_sha256(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class GraphWikiContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.approved = json.loads(
            (OUTPUT_ROOT / "legacy-graph.json").read_text(encoding="utf-8")
        )
        cls.baseline = json.loads(BASELINE.read_text(encoding="utf-8"))
        cls.live = json.loads(LIVE.read_text(encoding="utf-8"))

    def assess(
        self,
        *,
        live: dict | None = None,
        crosswalk: Path = CROSSWALK,
        inventory: Path = DRIFT_INVENTORY,
    ) -> dict[str, int] | None:
        return assess_quarantinable_legacy_drift(
            self.approved,
            self.baseline,
            live or self.live,
            LEGACY_HTML,
            crosswalk,
            inventory,
            baseline_sha256=file_sha256(BASELINE),
            live_sha256=file_sha256(LIVE),
        )

    def test_current_drift_is_fully_quarantined(self) -> None:
        result = self.assess()
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["quarantined_modified_nodes"], 10)
        self.assertEqual(result["quarantined_public_node_field_changes"], 2)
        self.assertEqual(result["quarantined_nodes"], 26)
        self.assertEqual(result["quarantined_edges"], 50)
        self.assertEqual(result["quarantined_inventory_records"], 86)
        self.assertEqual(result["quarantined_blocked_records"], 86)

    def test_inventory_cannot_enable_public_export(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "inventory.csv"
            with DRIFT_INVENTORY.open(newline="", encoding="utf-8-sig") as source:
                rows = list(csv.DictReader(source))
                fieldnames = list(rows[0])
            rows[0]["public_export_allowed"] = "true"
            with path.open("w", newline="", encoding="utf-8") as target:
                writer = csv.DictWriter(target, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            with self.assertRaisesRegex(ValueError, "permits public export"):
                self.assess(inventory=path)

    def test_crosswalk_cannot_absorb_live_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "crosswalk.csv"
            with CROSSWALK.open(newline="", encoding="utf-8-sig") as source:
                rows = list(csv.DictReader(source))
                fieldnames = list(rows[0])
            extra = dict(rows[0])
            extra["legacy_key"] = str(self.live["nodes"][len(self.baseline["nodes"])]["id"])
            rows.append(extra)
            with path.open("w", newline="", encoding="utf-8") as target:
                writer = csv.DictWriter(target, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            with self.assertRaisesRegex(ValueError, "approved projection"):
                self.assess(crosswalk=path)

    def test_approved_edge_endpoint_change_is_blocked(self) -> None:
        altered = copy.deepcopy(self.live)
        altered["edges"][0]["to"] = "forbidden-endpoint"
        with self.assertRaisesRegex(ValueError, "approved endpoints changed"):
            self.assess(live=altered)

    def test_environment_variable_alone_is_not_release_approval(self) -> None:
        environment = os.environ.copy()
        environment["ALLOW_LEGACY_GRAPH_REFRESH"] = "1"
        completed = subprocess.run(
            ["python3", "tools/build_graph_wiki_data.py"],
            cwd=SITE_ROOT,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("is not an approval", completed.stderr + completed.stdout)


if __name__ == "__main__":
    unittest.main()
