#!/usr/bin/env python3
"""Adversarial tests for the site's generation pin and commit-marker protocol."""

from __future__ import annotations

import contextlib
import io
import json
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True
TOOLS_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = TOOLS_ROOT.parents[2]
WORKSPACE_TOOLS = WORKSPACE_ROOT / "tools"
for path in (TOOLS_ROOT, WORKSPACE_TOOLS):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

import build_preview_data as builder  # noqa: E402
import verify_preview_data as verifier  # noqa: E402
from public_generation_authority import (  # noqa: E402
    GenerationAuthorityError,
    pin_current_generation,
)


REAL_AUTHORITY = (
    WORKSPACE_ROOT / "02-史料公开层" / "公开导出" / "authority-v1"
)
REAL_PROJECT_ROOT = TOOLS_ROOT.parent
NODE_GATE = REAL_PROJECT_ROOT / "tools" / "assert-local-preview-gate.mjs"
FAKE_GENERATION_ID = "gen-" + ("0" * 64)


class SwitchingPinned:
    """Delegate all pinned bytes but switch CURRENT at the freshness boundary."""

    def __init__(self, pinned: Any, current: Path) -> None:
        self._pinned = pinned
        self._current = current

    def __getattr__(self, name: str) -> Any:
        return getattr(self._pinned, name)

    def assert_fresh(self) -> None:
        self._current.write_text(f"{FAKE_GENERATION_ID}\n", encoding="ascii")
        self._pinned.assert_fresh()


class SiteGenerationProtocolTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_root = Path(tempfile.mkdtemp(prefix="sukaiyuan-site-generation-"))
        self.export_root = self.temporary_root / "public-export"
        self.authority_root = self.export_root / "authority-v1"
        shutil.copytree(REAL_AUTHORITY, self.authority_root, copy_function=shutil.copy2)
        self.project_root = self.temporary_root / "site"
        (self.project_root / "src" / "data").mkdir(parents=True)
        (self.project_root / "public" / "data").mkdir(parents=True)

    def tearDown(self) -> None:
        # The fixture intentionally copies sealed 0555/0444 evidence.  Only the
        # temporary copy is made writable for cleanup; the real authority is
        # never changed.
        for root, directories, files in os.walk(self.temporary_root, topdown=False):
            for filename in files:
                try:
                    Path(root, filename).chmod(0o600)
                except OSError:
                    pass
            for directory in directories:
                try:
                    Path(root, directory).chmod(0o700)
                except OSError:
                    pass
        self.temporary_root.chmod(0o700)
        shutil.rmtree(self.temporary_root)

    def run_builder(self) -> int:
        with contextlib.redirect_stdout(io.StringIO()):
            return builder.main(
                [
                    "--authority-root",
                    str(self.authority_root),
                    "--project-root",
                    str(self.project_root),
                ]
            )

    def run_verifier(self) -> tuple[int, dict[str, Any]]:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = verifier.main(
                [
                    "--authority-root",
                    str(self.authority_root),
                    "--project-root",
                    str(self.project_root),
                ]
            )
        return result, json.loads(output.getvalue())

    def test_legacy_flat_previewable_sentinel_is_never_read(self) -> None:
        legacy = self.export_root / "previewable"
        legacy.mkdir()
        sentinel = legacy / "manifest.json"
        sentinel.write_bytes(b"THIS LEGACY SENTINEL MUST NEVER BE PARSED\n")
        sentinel.chmod(0o000)

        self.assertEqual(self.run_builder(), 0)
        result, summary = self.run_verifier()
        self.assertEqual(result, 0)
        self.assertEqual(summary["recorded_generation_integrity"], "PASS")
        self.assertEqual(summary["current_freshness"], "PASS")

    def test_corrupt_current_is_rejected_before_output_commit(self) -> None:
        (self.authority_root / "CURRENT").write_bytes(b"not-a-generation")
        with self.assertRaises(GenerationAuthorityError):
            self.run_builder()
        self.assertFalse((self.project_root / "src" / "data" / "research.json").exists())

    def test_authority_root_symlink_is_rejected(self) -> None:
        authority_link = self.temporary_root / "authority-link"
        authority_link.symlink_to(self.authority_root, target_is_directory=True)
        with self.assertRaises(GenerationAuthorityError):
            with contextlib.redirect_stdout(io.StringIO()):
                builder.main(
                    [
                        "--authority-root",
                        str(authority_link),
                        "--project-root",
                        str(self.project_root),
                    ]
                )

    def test_current_switch_during_build_is_rejected_before_commit(self) -> None:
        original_pin = builder.pin_current_generation

        def pin_then_switch(*, authority_root: Path) -> SwitchingPinned:
            return SwitchingPinned(
                original_pin(authority_root=authority_root), authority_root / "CURRENT"
            )

        builder.pin_current_generation = pin_then_switch
        try:
            with self.assertRaises(GenerationAuthorityError):
                self.run_builder()
        finally:
            builder.pin_current_generation = original_pin
        self.assertFalse((self.project_root / "src" / "data" / "research.json").exists())
        self.assertEqual(list((self.project_root / "public" / "data").iterdir()), [])

    def test_recorded_generation_passes_before_separate_stale_current_failure(self) -> None:
        self.assertEqual(self.run_builder(), 0)
        (self.authority_root / "CURRENT").write_text(
            f"{FAKE_GENERATION_ID}\n", encoding="ascii"
        )

        result, summary = self.run_verifier()
        self.assertEqual(result, 1)
        self.assertEqual(summary["recorded_generation_integrity"], "PASS")
        self.assertEqual(summary["current_freshness"], "FAIL")
        self.assertTrue(any("CURRENT freshness" in item for item in summary["errors"]))

    def test_partial_endpoint_commit_is_rejected_by_verifier(self) -> None:
        self.assertEqual(self.run_builder(), 0)
        pinned = pin_current_generation(authority_root=self.authority_root)
        payloads = builder.build_payloads(pinned)
        persons = json.loads(payloads["persons"])
        persons["_meta"]["generation_id"] = FAKE_GENERATION_ID
        tainted_payloads = dict(payloads)
        tainted_payloads["persons"] = builder.canonical_json_bytes(persons)

        original_fault = builder._commit_fault_point

        def stop_after_first_endpoint(name: str) -> None:
            if name == "after_persons":
                raise RuntimeError("injected crash after first endpoint")

        builder._commit_fault_point = stop_after_first_endpoint
        try:
            with self.assertRaisesRegex(RuntimeError, "injected crash"):
                builder.commit_payloads(self.project_root, tainted_payloads, pinned)
        finally:
            builder._commit_fault_point = original_fault

        result, summary = self.run_verifier()
        self.assertEqual(result, 1)
        self.assertEqual(summary["recorded_generation_integrity"], "PASS")
        self.assertTrue(
            any("persons.json: _meta differs" in item for item in summary["errors"]),
            summary,
        )

    def run_node_gate(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                "node",
                str(NODE_GATE),
                "--project-root",
                str(self.project_root),
            ],
            check=False,
            capture_output=True,
            text=True,
        )

    def test_node_gate_accepts_one_coherent_five_file_snapshot(self) -> None:
        self.assertEqual(self.run_builder(), 0)
        result = self.run_node_gate()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PASS: coherent V7R4 snapshot", result.stdout)

    def test_node_gate_rejects_a_mixed_endpoint_generation(self) -> None:
        self.assertEqual(self.run_builder(), 0)
        persons_path = self.project_root / "public" / "data" / "persons.json"
        persons = json.loads(persons_path.read_text(encoding="utf-8"))
        persons["_meta"]["generation_id"] = FAKE_GENERATION_ID
        persons_path.write_text(
            json.dumps(persons, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        result = self.run_node_gate()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("metadata differs from the research commit marker", result.stderr)

    def test_dev_entrypoint_runs_both_full_data_gates_before_server(self) -> None:
        script = (REAL_PROJECT_ROOT / "scripts" / "dev.sh").read_text(encoding="utf-8")
        verifier = script.index("python3 tools/verify_preview_data.py")
        node_gate = script.index("node tools/assert-local-preview-gate.mjs")
        server = script.index("pnpm tsx watch src/server.ts")
        self.assertLess(verifier, node_gate)
        self.assertLess(node_gate, server)


if __name__ == "__main__":
    unittest.main(verbosity=2)
