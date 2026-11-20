"""Non-invasive PresentMon external ETW frame-time runner and CSV parser.

PresentMon observes DXGI/D3D11/D3D12 present events via Windows ETW completely outside
the game process (zero DLL injection, zero hooking).
"""

from __future__ import annotations

import csv
import math
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from qa_observer.config import AUTOMATION_ROOT


@dataclass
class PresentMonStats:
    sample_count: int
    avg_fps: float
    low1_fps: float
    low01_fps: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_ms: float
    hitch_50ms_count: int
    hitch_100ms_count: int
    csv_path: str | None = None


def _percentile(sorted_vals: Sequence[float], pct: float) -> float:
    if not sorted_vals:
        return 0.0
    if len(sorted_vals) == 1:
        return float(sorted_vals[0])
    k = (len(sorted_vals) - 1) * (pct / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return float(sorted_vals[int(k)])
    return float(sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f))


def parse_presentmon_csv(
    csv_path: str | Path,
    process_filter: Sequence[str] | None = None,
) -> PresentMonStats | None:
    """Parse PresentMon v1 or v2 CSV output into real FPS & frame-time statistics."""
    path = Path(csv_path)
    if not path.exists() or path.stat().st_size == 0:
        return None

    proc_filter_set = {p.lower() for p in (process_filter or []) if p}
    frame_times_ms: list[float] = []

    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            return None

        norm_map = {col.strip().lower(): col for col in reader.fieldnames if col}
        # Support PresentMon 1.x & 2.x column names
        ft_col = (
            norm_map.get("msbetweenpresents")
            or norm_map.get("frametime")
            or norm_map.get("msbetweenpresents(ms)")
            or norm_map.get("msbetweendisplaychange")
        )
        app_col = norm_map.get("application") or norm_map.get("processname")

        if not ft_col:
            return None

        for row in reader:
            if proc_filter_set and app_col:
                app_val = (row.get(app_col) or "").strip().lower()
                if app_val and app_val not in proc_filter_set:
                    continue
            raw_ft = (row.get(ft_col) or "").strip()
            if not raw_ft or raw_ft.upper() in {"NA", "NAN", "NULL"}:
                continue
            try:
                ft = float(raw_ft)
            except ValueError:
                continue
            if 0.1 <= ft <= 10000.0:
                frame_times_ms.append(ft)

    if len(frame_times_ms) < 5:
        return None

    mean_ft = sum(frame_times_ms) / len(frame_times_ms)
    avg_fps = 1000.0 / mean_ft if mean_ft > 0 else 0.0

    sorted_asc = sorted(frame_times_ms)
    sorted_desc = sorted_asc[::-1]

    top_1pct_n = max(1, int(math.ceil(len(sorted_desc) * 0.01)))
    top_01pct_n = max(1, int(math.ceil(len(sorted_desc) * 0.001)))

    low1_mean_ft = sum(sorted_desc[:top_1pct_n]) / top_1pct_n
    low01_mean_ft = sum(sorted_desc[:top_01pct_n]) / top_01pct_n

    return PresentMonStats(
        sample_count=len(frame_times_ms),
        avg_fps=round(avg_fps, 2),
        low1_fps=round(1000.0 / low1_mean_ft, 2) if low1_mean_ft > 0 else 0.0,
        low01_fps=round(1000.0 / low01_mean_ft, 2) if low01_mean_ft > 0 else 0.0,
        p50_ms=round(_percentile(sorted_asc, 50.0), 2),
        p95_ms=round(_percentile(sorted_asc, 95.0), 2),
        p99_ms=round(_percentile(sorted_asc, 99.0), 2),
        max_ms=round(sorted_asc[-1], 2),
        hitch_50ms_count=sum(1 for ft in frame_times_ms if ft >= 50.0),
        hitch_100ms_count=sum(1 for ft in frame_times_ms if ft >= 100.0),
        csv_path=str(path),
    )


def discover_presentmon(explicit_path: str | None = None) -> Path | None:
    if explicit_path:
        p = Path(explicit_path)
        return p if p.exists() else None
    env_p = os.environ.get("PRESENTMON_PATH")
    if env_p and Path(env_p).exists():
        return Path(env_p)
    for exe in ("PresentMon.exe", "PresentMon-2.2.0-x64.exe", "PresentMon-2.0.0-x64.exe"):
        found = shutil.which(exe)
        if found:
            return Path(found)
    tools_dir = AUTOMATION_ROOT / "tools"
    if tools_dir.exists():
        for candidate in sorted(tools_dir.glob("PresentMon*.exe"), reverse=True):
            return candidate
    return None


class PresentMonRunner:
    """Manages an external PresentMon CLI subprocess capturing real DXGI frame times."""

    def __init__(self, exe_path: Path, process_name: str, output_csv: Path) -> None:
        self.exe_path = exe_path
        self.process_name = process_name
        self.output_csv = output_csv
        self._proc: subprocess.Popen[bytes] | None = None
        self.start_error: str | None = None

    def start(self) -> bool:
        self.output_csv.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            str(self.exe_path),
            "--process_name",
            self.process_name,
            "--output_file",
            str(self.output_csv),
            "--stop_existing_session",
            "--no_console_stats",
            "--terminate_on_proc_exit",
        ]
        try:
            self._proc = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            return True
        except Exception as exc:
            self.start_error = f"启动 PresentMon 失败（需管理员权限以订阅 ETW）：{exc}"
            self._proc = None
            return False

    def stop_and_parse(self) -> PresentMonStats | None:
        if self._proc is not None:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=5.0)
            except Exception:
                try:
                    self._proc.kill()
                except Exception:
                    pass
            self._proc = None
        return parse_presentmon_csv(self.output_csv, process_filter=[self.process_name])
