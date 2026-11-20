"""Evidence archiver saving anomaly screenshots, report JSON, and Markdown summary."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from qa_observer.capture.screen import save_frame_png
from qa_observer.config import AUTOMATION_ROOT
from qa_observer.schema import ArtifactRef, RunReport


class EvidenceArchiver:
    def __init__(self, run_id: str, base_dir: str | Path | None = None) -> None:
        root = Path(base_dir) if base_dir else (AUTOMATION_ROOT / "reports" / "runs")
        self.run_dir = root / run_id
        self.evidence_dir = self.run_dir / "evidence"
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    def save_screenshot(self, frame_bgr: Any, filename: str, label: str = "") -> ArtifactRef | None:
        target = self.evidence_dir / filename
        ok = save_frame_png(frame_bgr, target)
        if not ok:
            return None
        return ArtifactRef(kind="screenshot", path=str(target), label=label or filename)

    def save_telemetry(self, telemetry_payload: dict[str, Any]) -> ArtifactRef:
        target = self.run_dir / "telemetry.json"
        target.write_text(json.dumps(telemetry_payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return ArtifactRef(kind="telemetry", path=str(target), label="Frame & resource telemetry")

    def save_report(self, report: RunReport) -> tuple[Path, Path]:
        report_dict = report.to_dict()
        json_path = self.run_dir / "report.json"
        json_path.write_text(json.dumps(report_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        md_path = self.run_dir / "summary.md"
        md_path.write_text(render_markdown_summary(report_dict), encoding="utf-8")
        return json_path, md_path


def render_markdown_summary(report: dict[str, Any]) -> str:
    m = report.get("metrics", {})
    env = report.get("environment", {})
    ci = report.get("ci", {})
    lines = [
        f"# 非侵入自动化巡检报告 · {report.get('game')} ({report.get('id')})",
        "",
        f"- **状态**: `{report.get('status')}` | **通过率**: `{report.get('passRate')}%` "
        f"({report.get('passedCases')}/{report.get('totalCases')}, 跳过 {report.get('skippedCases', 0)})",
        f"- **模式**: `{report.get('mode')}` | **数据来源**: `{report.get('dataOrigin')}`",
        f"- **版本**: `{report.get('version')}` | **执行时间**: `{report.get('timestamp')}` | **耗时**: `{report.get('durationSec')}s`",
        f"- **CI 来源**: `{ci.get('provider')}` / `{ci.get('triggeredBy')}`"
        + (f" ([Job Link]({ci.get('jobUrl')}))" if ci.get("jobUrl") else ""),
        f"- **运行环境**: `{env.get('os')}` | 分辨率 `{env.get('resolution') or '未采集'}` | "
        f"采集后端 `{env.get('captureBackend') or '未采集'}` | PresentMon `{env.get('presentmonAttached')}`",
        "",
        "## 性能与观测指标（未采集项如实留空）",
        "",
        "| 指标 | 实测值 |",
        "| --- | --- |",
        f"| 冷启动耗时 | {m.get('coldStartSec') if m.get('coldStartSec') is not None else '未采集'} |",
        f"| 平均 FPS / 1% Low FPS | {m.get('avgFps') if m.get('avgFps') is not None else '未采集'} / {m.get('low1Fps') if m.get('low1Fps') is not None else '未采集'} |",
        f"| P95 / P99 FrameTime (ms) | {m.get('p95FrameTimeMs') if m.get('p95FrameTimeMs') is not None else '未采集'} / {m.get('p99FrameTimeMs') if m.get('p99FrameTimeMs') is not None else '未采集'} |",
        f"| >50ms / >100ms 毛刺数 | {m.get('hitchCount50ms') if m.get('hitchCount50ms') is not None else '未采集'} / {m.get('hitchCount100ms') if m.get('hitchCount100ms') is not None else '未采集'} |",
        f"| 内存均值 / 峰值 (MB) | {m.get('memMbAvg') if m.get('memMbAvg') is not None else '未采集'} / {m.get('memMbPeak') if m.get('memMbPeak') is not None else '未采集'} |",
        f"| 分析帧数 | {m.get('framesAnalyzed', 0)} |",
        f"| 传送白屏加载记录 (s) | {m.get('teleportLoadsSec') or '无'} |",
        "",
        "## 用例执行明细",
        "",
        "| 用例 ID | 名称 | 状态 | 耗时 (s) | 说明 |",
        "| --- | --- | --- | ---: | --- |",
    ]
    for case in report.get("cases", []):
        lines.append(
            f"| `{case.get('caseId')}` | {case.get('name')} | **{case.get('status')}** | "
            f"{case.get('durationSec', 0)} | {case.get('detail', '')} |"
        )
    lines.append("")
    lines.append("## 检出异常 (Findings)")
    lines.append("")
    findings = report.get("findings", [])
    if not findings:
        lines.append("- 本轮巡检未发现异常。")
    else:
        for f in findings:
            lines.append(
                f"- **[{f.get('severity')}][{f.get('caseId')}][{f.get('rule')}]** {f.get('msg')}"
                + (f" (`{f.get('evidencePath')}`)" if f.get("evidencePath") else "")
            )
    lines.append("")
    return "\n".join(lines)
