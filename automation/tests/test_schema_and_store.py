import json
import tempfile
import unittest
from pathlib import Path

from qa_observer.config import REPO_ROOT
from qa_observer.reporting.store import load_store, merge_run_into_store, save_store
from qa_observer.schema import (
    CaseResult,
    CIMetadata,
    Finding,
    PerformanceMetrics,
    RunReport,
    empty_store,
    validate_run_dict,
    validate_store_dict,
)


def make_valid_run(run_id: str = "RUN-YS-20261120-180000-abcd", ts: str = "2026-11-20T18:00:00+08:00") -> dict:
    rep = RunReport(
        id=run_id,
        game="原神",
        gameKey="genshin",
        version="7.2.0",
        suite="genshin-non-intrusive-observe",
        mode="observe",
        dataOrigin="real_capture",
        timestamp=ts,
        durationSec=60.0,
        metrics=PerformanceMetrics(framesAnalyzed=120, memMbAvg=4120.5, memMbPeak=4310.0),
        ci=CIMetadata(provider="github-actions", triggeredBy="repository_dispatch"),
        cases=[
            CaseResult(caseId="YS-PROC-01", name="进程监控", status="PASS", durationSec=60.0),
            CaseResult(caseId="YS-VIS-01", name="视觉巡检", status="PASS", durationSec=60.0),
            CaseResult(caseId="YS-OCR-01", name="OCR巡检", status="SKIP", durationSec=0.0),
        ],
    )
    return rep.to_dict()


class TestSchemaAndStore(unittest.TestCase):
    def test_empty_store_is_valid(self) -> None:
        store = empty_store()
        self.assertEqual(validate_store_dict(store), [])
        self.assertEqual(store["runs"], [])
        self.assertIsNone(store["updatedAt"])

    def test_repo_live_store_has_no_fabricated_data_and_is_valid(self) -> None:
        live_store_path = REPO_ROOT / "web" / "data" / "automation-runs.json"
        store = load_store(live_store_path)
        self.assertEqual(validate_store_dict(store), [])
        self.assertEqual(store.get("policy"), "real-data-only")

    def test_rejects_mock_or_fabricated_origins(self) -> None:
        for bad_origin in ("mock", "demo", "fake", "synthetic", "simulated", "sample", ""):
            run = make_valid_run()
            run["dataOrigin"] = bad_origin
            errors = validate_run_dict(run)
            self.assertTrue(any("dataOrigin" in e for e in errors), f"Expected rejection for origin={bad_origin!r}")

    def test_pass_rate_excludes_skipped_cases(self) -> None:
        run = make_valid_run()
        self.assertEqual(run["totalCases"], 3)
        self.assertEqual(run["passedCases"], 2)
        self.assertEqual(run["skippedCases"], 1)
        self.assertEqual(run["passRate"], 100.0)
        self.assertEqual(run["status"], "PASS")

    def test_status_turns_fail_on_p1_finding(self) -> None:
        rep = RunReport(
            id="RUN-YS-20261120-180500-ef12",
            game="原神",
            gameKey="genshin",
            version="unknown",
            suite="genshin-non-intrusive-observe",
            mode="observe",
            dataOrigin="real_capture",
            cases=[CaseResult(caseId="YS-VIS-01", name="视觉", status="FAIL", durationSec=12.0)],
            findings=[Finding(caseId="YS-VIS-01", severity="P1", rule="BLACK_SCREEN", msg="黑屏 8s")],
        )
        d = rep.to_dict()
        self.assertEqual(d["status"], "FAIL")
        self.assertEqual(d["passRate"], 0.0)
        self.assertEqual(validate_run_dict(d), [])

    def test_idempotent_merge_and_persistence(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            store_path = Path(td) / "automation-runs.json"
            store = empty_store()
            r1 = make_valid_run("RUN-YS-20261120-180000-0001", "2026-11-20T18:00:00+08:00")
            r2 = make_valid_run("RUN-YS-20261120-190000-0002", "2026-11-20T19:00:00+08:00")

            store, ch1 = merge_run_into_store(store, r1)
            self.assertTrue(ch1)
            store, ch_dup = merge_run_into_store(store, r1)
            self.assertFalse(ch_dup)
            store, ch2 = merge_run_into_store(store, r2)
            self.assertTrue(ch2)

            # Sorted descending by timestamp
            self.assertEqual([r["id"] for r in store["runs"]], [r2["id"], r1["id"]])
            save_store(store_path, store)
            reloaded = json.loads(store_path.read_text(encoding="utf-8"))
            self.assertEqual(validate_store_dict(reloaded), [])
            self.assertEqual(reloaded["ci"]["totalIngestedRuns"], 2)


if __name__ == "__main__":
    unittest.main()
