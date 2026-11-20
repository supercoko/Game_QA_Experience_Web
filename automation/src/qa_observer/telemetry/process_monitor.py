"""Read-only process liveness, memory/CPU trend, and crash-dump watcher."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from qa_observer.config import expand_env_path


@dataclass
class ResourceSample:
    timestamp: float
    mem_mb: float | None
    cpu_pct: float | None


@dataclass
class ProcessSummary:
    pid: int | None = None
    process_name: str | None = None
    alive_at_end: bool = False
    exited_unexpectedly: bool = False
    access_denied_warning: str | None = None
    mem_mb_avg: float | None = None
    mem_mb_peak: float | None = None
    mem_leak_slope_mb_per_min: float | None = None
    cpu_pct_avg: float | None = None
    new_crash_dumps: list[str] = field(default_factory=list)
    samples: list[ResourceSample] = field(default_factory=list)


def compute_linear_slope_per_min(samples: list[ResourceSample]) -> float | None:
    """Compute ordinary least-squares memory trend (MB/minute) over samples spanning >= 60s."""
    pts = [(s.timestamp, s.mem_mb) for s in samples if s.mem_mb is not None]
    if len(pts) < 4:
        return None
    span_sec = pts[-1][0] - pts[0][0]
    if span_sec < 60.0:
        return None
    n = len(pts)
    mean_x = sum(x for x, _ in pts) / n
    mean_y = sum(y for _, y in pts) / n
    denom = sum((x - mean_x) ** 2 for x, _ in pts)
    if denom <= 1e-9:
        return None
    slope_per_sec = sum((x - mean_x) * (y - mean_y) for x, y in pts) / denom
    return round(slope_per_sec * 60.0, 2)


class ProcessMonitor:
    """Non-invasive external monitor using psutil (with safe AccessDenied handling)."""

    def __init__(self, process_names: Iterable[str], crash_dump_dirs: Iterable[str] = ()) -> None:
        self.process_names = {p.lower() for p in process_names}
        self.crash_dump_dirs = [expand_env_path(d) for d in crash_dump_dirs]
        self._baseline_dumps: set[str] = set()
        self._proc: object | None = None
        self._pid: int | None = None
        self._proc_name: str | None = None
        self._samples: list[ResourceSample] = []
        self._access_denied_msg: str | None = None
        self._started_at: float = time.monotonic()

    def snapshot_crash_dirs(self) -> None:
        self._baseline_dumps = self._scan_crash_files()

    def _scan_crash_files(self) -> set[str]:
        found: set[str] = set()
        for folder in self.crash_dump_dirs:
            if not folder.exists() or not folder.is_dir():
                continue
            try:
                for entry in folder.iterdir():
                    found.add(str(entry.resolve()))
            except OSError:
                continue
        return found

    def find_running_process(self) -> tuple[int, str] | None:
        try:
            import psutil  # type: ignore

            for proc in psutil.process_iter(["pid", "name"]):
                name = (proc.info.get("name") or "").strip()
                if name.lower() in self.process_names:
                    self._proc = proc
                    self._pid = int(proc.info["pid"])
                    self._proc_name = name
                    try:
                        proc.cpu_percent(interval=None)
                    except Exception:
                        pass
                    return (self._pid, name)
        except ImportError:
            self._access_denied_msg = "psutil 未安装，无法采集进程内存/CPU 水位"
        except Exception as exc:
            self._access_denied_msg = f"进程枚举受限：{exc}"
        return None

    def attach_pid(self, pid: int, process_name: str | None = None) -> None:
        self._pid = pid
        self._proc_name = process_name
        try:
            import psutil  # type: ignore

            self._proc = psutil.Process(pid)
            try:
                self._proc.cpu_percent(interval=None)  # type: ignore[attr-defined]
            except Exception:
                pass
        except ImportError:
            self._access_denied_msg = "psutil 未安装，无法采集进程内存/CPU 水位"
        except Exception as exc:
            self._access_denied_msg = f"附着进程 PID={pid} 元数据失败：{exc}"

    def sample(self, rel_ts: float) -> bool:
        """Sample process liveness + RSS memory + CPU%. Returns False if process has exited."""
        if self._proc is None:
            return False
        try:
            import psutil  # type: ignore

            proc = self._proc
            if not proc.is_running():  # type: ignore[attr-defined]
                return False
            mem_mb: float | None = None
            cpu_pct: float | None = None
            try:
                mem_info = proc.memory_info()  # type: ignore[attr-defined]
                mem_mb = round(float(mem_info.rss) / (1024 * 1024), 2)
            except psutil.AccessDenied:
                self._access_denied_msg = (
                    "访问游戏进程内存受限（AccessDenied）：原神客户端通常以管理员权限运行，"
                    "如需读取进程内存/PresentMon，请以管理员身份运行终端。"
                )
            try:
                cpu_pct = round(float(proc.cpu_percent(interval=None)), 2)  # type: ignore[attr-defined]
            except psutil.AccessDenied:
                pass

            if mem_mb is not None or cpu_pct is not None:
                self._samples.append(ResourceSample(timestamp=rel_ts, mem_mb=mem_mb, cpu_pct=cpu_pct))
            return True
        except Exception:
            return False

    def summarize(self, exited_unexpectedly: bool = False) -> ProcessSummary:
        mems = [s.mem_mb for s in self._samples if s.mem_mb is not None]
        cpus = [s.cpu_pct for s in self._samples if s.cpu_pct is not None]
        alive = False
        if self._proc is not None:
            try:
                alive = bool(self._proc.is_running())  # type: ignore[attr-defined]
            except Exception:
                alive = False

        current_dumps = self._scan_crash_files()
        new_dumps = sorted(current_dumps - self._baseline_dumps)

        return ProcessSummary(
            pid=self._pid,
            process_name=self._proc_name,
            alive_at_end=alive,
            exited_unexpectedly=exited_unexpectedly,
            access_denied_warning=self._access_denied_msg,
            mem_mb_avg=round(sum(mems) / len(mems), 2) if mems else None,
            mem_mb_peak=round(max(mems), 2) if mems else None,
            mem_leak_slope_mb_per_min=compute_linear_slope_per_min(self._samples),
            cpu_pct_avg=round(sum(cpus) / len(cpus), 2) if cpus else None,
            new_crash_dumps=new_dumps,
            samples=list(self._samples),
        )
