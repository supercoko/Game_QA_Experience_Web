import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from qa_observer.analyzers.ocr import OcrAnalyzer, OcrItem
from qa_observer.analyzers.visual import TeleportLoadTracker
from qa_observer.compliance import SafeActionGuard
from qa_observer.config import AUTOMATION_ROOT, REPO_ROOT, default_game_config_path, load_config
from qa_observer.games.genshin import GenshinAdapter
from qa_observer.reporting.ci_publisher import compact_report_for_dispatch
from qa_observer.schema import CaseResult, CIMetadata, RunReport, empty_store


class TestCiIngestAndGenshinCore(unittest.TestCase):
    def test_load_genshin_yaml_config(self) -> None:
        cfg = load_config(default_game_config_path("genshin"))
        self.assertEqual(cfg["game"], "原神")
        self.assertEqual(cfg["game_key"], "genshin")
        self.assertIn("YuanShen.exe", cfg["process"]["names"])
        self.assertIn("bottom_prompts", cfg["rois"])
        self.assertGreaterEqual(len(cfg["active_ui"]["steps"]), 4)

    def test_genshin_version_detect_real_config_ini(self) -> None:
        cfg = load_config(default_game_config_path("genshin"))
        adapter = GenshinAdapter(cfg)
        with tempfile.TemporaryDirectory() as td:
            ini = Path(td) / "config.ini"
            ini.write_text("[General]\ngame_version=7.2.0\nchannel=1\n", encoding="utf-8")
            self.assertEqual(adapter.detect_version(td), "7.2.0")
            self.assertEqual(adapter.detect_version(Path(td) / "nonexistent"), "unknown")

    def test_genshin_doctor_runs_cleanly(self) -> None:
        cfg = load_config(default_game_config_path("genshin"))
        adapter = GenshinAdapter(cfg)
        doc = adapter.doctor()
        self.assertIn("compliance", doc)
        self.assertIn("dependencies", doc)
        self.assertIn("liveWindow", doc)

    def test_safe_action_guard_blocks_combat_keys(self) -> None:
        guard = SafeActionGuard(min_interval_sec=0.0)
        guard.authorize_key("ESC")
        guard.authorize_key("B")
        for forbidden in ("W", "A", "S", "D", "Q", "E", "SPACE", "LMB"):
            with self.assertRaises(PermissionError):
                guard.authorize_key(forbidden)

    def test_teleport_load_tracker(self) -> None:
        tracker = TeleportLoadTracker(min_hold_sec=0.8, warn_sec=10.0, timeout_sec=25.0)
        self.assertIsNone(tracker.update(0.0, False))
        self.assertIsNone(tracker.update(1.0, True))
        self.assertIsNone(tracker.update(4.0, True))
        ev = tracker.update(5.2, False)
        self.assertIsNotNone(ev)
        assert ev is not None
        self.assertAlmostEqual(ev.duration_sec, 4.2, delta=0.05)
        self.assertFalse(ev.timed_out)

    def test_ocr_rule_inspection(self) -> None:
        cfg = load_config(default_game_config_path("genshin"))
        ocr = OcrAnalyzer(cfg["ocr_rules"], edge_margin_px=3)
        items = [
            OcrItem(text="UI_DIALOG_MISSING_01", confidence=0.95, bbox=(120, 100, 320, 130)),
            OcrItem(text="正在重新连接服务器...", confidence=0.92, bbox=(500, 400, 720, 440)),
            OcrItem(text="活动奖励详情按钮", confidence=0.91, bbox=(1, 200, 140, 230)),
            OcrItem(text="UID:104688390", confidence=0.99, bbox=(1760, 1055, 1918, 1079)),
            OcrItem(text="关卡GUID:45694132064 UID：104688390", confidence=0.96, bbox=(1400, 1055, 1918, 1079)),
        ]
        res = ocr.inspect_items(items, frame_width=1920, frame_height=1080)
        self.assertEqual(len(res.forbidden_hits), 1)
        self.assertEqual(len(res.reconnect_hits), 1)
        self.assertEqual(len(res.overflow_hits), 1)
        self.assertNotIn("104688390", " ".join(res.overflow_hits))

    def test_ci_ingest_script_end_to_end(self) -> None:
        script = AUTOMATION_ROOT / "scripts" / "ci_ingest.py"
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            store_file = td_path / "automation-runs.json"
            store_file.write_text(json.dumps(empty_store(), ensure_ascii=False, indent=2), encoding="utf-8")

            inbox_dir = td_path / "inbox"
            inbox_dir.mkdir()

            run_obj = RunReport(
                id="RUN-YS-20261120-181500-99aa",
                game="原神",
                gameKey="genshin",
                version="7.2.0",
                suite="genshin-non-intrusive-observe",
                mode="observe",
                dataOrigin="real_capture",
                cases=[CaseResult(caseId="YS-PROC-01", name="进程监控", status="PASS", durationSec=30.0)],
                ci=CIMetadata(provider="local-cli", runner="WIN-QA-01"),
            ).to_dict()
            (inbox_dir / f"{run_obj['id']}.json").write_text(json.dumps(run_obj, ensure_ascii=False), encoding="utf-8")

            env = dict(os.environ)
            env.update(
                {
                    "GITHUB_ACTIONS": "true",
                    "GITHUB_SERVER_URL": "https://github.com",
                    "GITHUB_REPOSITORY": "supercoko/Game_QA_Experience_Web",
                    "GITHUB_RUN_ID": "987654321",
                    "GITHUB_RUN_NUMBER": "7",
                    "GITHUB_SHA": "abcdef1234567890",
                    "GITHUB_REF_NAME": "main",
                    "GITHUB_WORKFLOW": "Ingest Automation Run Data",
                    "RUNNER_OS": "Linux",
                }
            )
            proc = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "ingest",
                    "--store",
                    str(store_file),
                    "--inbox-dir",
                    str(inbox_dir),
                    "--trigger",
                    "push-inbox",
                    "--clean-inbox",
                ],
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, msg=proc.stderr + proc.stdout)
            # Inbox file cleaned up
            self.assertEqual(list(inbox_dir.glob("*.json")), [])

            updated = json.loads(store_file.read_text(encoding="utf-8"))
            self.assertEqual(len(updated["runs"]), 1)
            ci_meta = updated["runs"][0]["ci"]
            self.assertEqual(ci_meta["provider"], "github-actions")
            self.assertEqual(ci_meta["jobRunNumber"], 7)
            self.assertIn("/actions/runs/987654321", ci_meta["jobUrl"])
            self.assertIn("WIN-QA-01", ci_meta["runner"])

            # Reject mock payload via payload-env
            bad_run = dict(run_obj, id="RUN-YS-MOCK-0001", dataOrigin="mock")
            env["TEST_BAD_PAYLOAD"] = json.dumps({"run": bad_run})
            proc_bad = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "ingest",
                    "--store",
                    str(store_file),
                    "--payload-env",
                    "TEST_BAD_PAYLOAD",
                ],
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(proc_bad.returncode, 0)

    def test_live_store_validates_with_cli_script(self) -> None:
        script = AUTOMATION_ROOT / "scripts" / "ci_ingest.py"
        store_path = REPO_ROOT / "web" / "data" / "automation-runs.json"
        proc = subprocess.run(
            [sys.executable, str(script), "validate", "--store", str(store_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, msg=proc.stderr + proc.stdout)

    def test_compact_report_preserves_core_fields(self) -> None:
        rep = RunReport(
            id="RUN-YS-20261120-182000-1122",
            game="原神",
            gameKey="genshin",
            version="7.2.0",
            suite="genshin-non-intrusive-observe",
            mode="observe",
            dataOrigin="real_capture",
            cases=[CaseResult(caseId="YS-VIS-01", name="视觉", status="PASS", durationSec=10.0)],
        ).to_dict()
        compact = compact_report_for_dispatch(rep)
        self.assertEqual(compact["id"], rep["id"])
        self.assertEqual(compact["cases"][0]["caseId"], "YS-VIS-01")


if __name__ == "__main__":
    unittest.main()
