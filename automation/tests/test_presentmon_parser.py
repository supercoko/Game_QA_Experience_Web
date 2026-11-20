import tempfile
import unittest
from pathlib import Path

from qa_observer.telemetry.presentmon import parse_presentmon_csv


class TestPresentMonParser(unittest.TestCase):
    def test_parse_presentmon_v1_csv(self) -> None:
        # 98 frames at 16.67ms (~60 FPS) + 2 hitch frames at 80ms and 120ms
        rows = ["Application,ProcessID,SwapChainAddress,Runtime,msBetweenPresents"]
        for _ in range(98):
            rows.append("YuanShen.exe,1234,0x1,DXGI,16.67")
        rows.append("YuanShen.exe,1234,0x1,DXGI,80.0")
        rows.append("YuanShen.exe,1234,0x1,DXGI,120.0")

        with tempfile.TemporaryDirectory() as td:
            csv_file = Path(td) / "pm_v1.csv"
            csv_file.write_text("\n".join(rows), encoding="utf-8")
            stats = parse_presentmon_csv(csv_file, process_filter=["YuanShen.exe"])
            self.assertIsNotNone(stats)
            assert stats is not None
            self.assertEqual(stats.sample_count, 100)
            self.assertAlmostEqual(stats.avg_fps, 54.53, delta=0.5)
            self.assertAlmostEqual(stats.low1_fps, 8.33, delta=0.1)
            self.assertEqual(stats.hitch_50ms_count, 2)
            self.assertEqual(stats.hitch_100ms_count, 1)
            self.assertEqual(stats.max_ms, 120.0)

    def test_parse_presentmon_v2_filters_other_processes(self) -> None:
        rows = [
            "Application,FrameTime",
            "explorer.exe,500.0",
            "YuanShen.exe,16.6",
            "YuanShen.exe,16.7",
            "YuanShen.exe,16.8",
            "YuanShen.exe,16.5",
            "YuanShen.exe,16.9",
            "YuanShen.exe,16.7",
        ]
        with tempfile.TemporaryDirectory() as td:
            csv_file = Path(td) / "pm_v2.csv"
            csv_file.write_text("\n".join(rows), encoding="utf-8")
            stats = parse_presentmon_csv(csv_file, process_filter=["YuanShen.exe"])
            self.assertIsNotNone(stats)
            assert stats is not None
            self.assertEqual(stats.sample_count, 6)
            self.assertEqual(stats.hitch_100ms_count, 0)
            self.assertGreater(stats.avg_fps, 58.0)

    def test_empty_or_invalid_csv_returns_none(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            empty_csv = Path(td) / "empty.csv"
            empty_csv.write_text("", encoding="utf-8")
            self.assertIsNone(parse_presentmon_csv(empty_csv))


if __name__ == "__main__":
    unittest.main()
