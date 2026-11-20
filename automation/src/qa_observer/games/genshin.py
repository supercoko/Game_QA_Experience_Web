"""Genshin Impact (原神) non-invasive black-box QA observer adapter.

Implements all 3 real execution modes:
1. `observe`   (default): 100% passive zero-input external observation of YuanShen.exe / GenshinImpact.exe
2. `active-ui` (opt-in):  compliance-guarded public UI checklist traversal (Paimon/Bag/Char/Handbook/Map)
3. `replay`    (offline): runs identical visual/OCR/teleport/PresentMon/VLM suite on recorded video/screenshots
"""

from __future__ import annotations

import configparser
import importlib.util
import os
import platform
import socket
import time
from pathlib import Path
from typing import Any, Iterable

from qa_observer.analyzers.ocr import OcrAnalyzer
from qa_observer.analyzers.visual import (
    TeleportLoadTracker,
    analyze_frame_visual,
    crop_normalized_roi,
    detect_input_mode,
)
from qa_observer.analyzers.vlm import VlmInspector
from qa_observer.capture.screen import CapturedFrame, FrameCapturer, ReplayFrameSource, save_frame_png
from qa_observer.capture.window import WindowInfo, find_game_window
from qa_observer.compliance import COMPLIANCE_DECLARATION, SafeActionGuard, is_windows_admin
from qa_observer.config import AUTOMATION_ROOT
from qa_observer.games.base import GameAdapter
from qa_observer.input_driver.safe_ui import SafeUiDriver
from qa_observer.reporting.evidence import EvidenceArchiver
from qa_observer.schema import (
    ArtifactRef,
    CaseResult,
    CIMetadata,
    EnvironmentInfo,
    Finding,
    PerformanceMetrics,
    RunReport,
    generate_run_id,
    local_now_iso,
)
from qa_observer.telemetry.presentmon import (
    PresentMonRunner,
    PresentMonStats,
    discover_presentmon,
    parse_presentmon_csv,
)
from qa_observer.telemetry.process_monitor import ProcessMonitor


def _module_installed(mod_name: str) -> bool:
    return importlib.util.find_spec(mod_name) is not None


class GenshinAdapter(GameAdapter):
    game_key = "genshin"
    game_name = "原神"

    def __init__(self, config: dict[str, Any], templates_dir: Path | None = None) -> None:
        super().__init__(config)
        self.templates_dir = templates_dir or (AUTOMATION_ROOT / "templates" / "genshin")

    # ------------------------------------------------------------------
    # Real version detection (read-only launcher/game config.ini)
    # ------------------------------------------------------------------
    def detect_version(self, game_dir: str | Path | None = None) -> str:
        raw_dir = game_dir or os.environ.get("GENSHIN_GAME_DIR")
        if not raw_dir:
            return "unknown"
        base = Path(raw_dir)
        candidates = [
            base / "config.ini",
            base / "Genshin Impact game" / "config.ini",
            base / "YuanShen" / "config.ini",
        ]
        for cfg_file in candidates:
            if not cfg_file.exists():
                continue
            parser = configparser.ConfigParser()
            try:
                parser.read(cfg_file, encoding="utf-8-sig")
                for section in parser.sections():
                    if parser.has_option(section, "game_version"):
                        ver = parser.get(section, "game_version").strip()
                        if ver:
                            return ver
            except Exception:
                continue
        return "unknown"

    # ------------------------------------------------------------------
    # Preflight Doctor Diagnostics
    # ------------------------------------------------------------------
    def doctor(
        self,
        game_dir: str | Path | None = None,
        presentmon_path: str | None = None,
    ) -> dict[str, Any]:
        proc_cfg = self.config.get("process", {})
        win = find_game_window(
            process_names=proc_cfg.get("names", ["YuanShen.exe", "GenshinImpact.exe"]),
            window_classes=proc_cfg.get("window_classes", ["UnityWndClass"]),
            window_titles=proc_cfg.get("window_titles", ["原神", "Genshin Impact"]),
        )
        pm_exe = discover_presentmon(presentmon_path)
        kbm_tpls = sorted(p.name for p in self.templates_dir.glob("kbm_*.png")) if self.templates_dir.exists() else []
        pad_tpls = sorted(p.name for p in self.templates_dir.glob("pad_*.png")) if self.templates_dir.exists() else []
        admin_status = is_windows_admin()
        vlm = VlmInspector()

        deps = {
            "numpy": _module_installed("numpy"),
            "opencv (cv2)": _module_installed("cv2"),
            "mss": _module_installed("mss"),
            "dxcam (DXGI)": _module_installed("dxcam"),
            "psutil": _module_installed("psutil"),
            "Pillow": _module_installed("PIL"),
            "PyYAML": _module_installed("yaml"),
            "rapidocr_onnxruntime": _module_installed("rapidocr_onnxruntime"),
        }
        recommendations: list[str] = []
        if not deps["numpy"] or not deps["opencv (cv2)"]:
            recommendations.append("请先安装基础依赖：cd automation && uv sync（或 pip install -e .）")
        if not deps["dxcam (DXGI)"] and platform.system() == "Windows":
            recommendations.append("建议安装 DXGI 采集后端（可选）：uv sync --extra dxgi（未安装时会自动降级到 mss）")
        if not deps["rapidocr_onnxruntime"]:
            recommendations.append("建议安装 OCR 后端（可选）：uv sync --extra ocr（未安装时 YS-OCR-01 会自动标记为 SKIP）")
        if pm_exe is None:
            recommendations.append(
                "未检测到 PresentMon.exe：FPS / 1% Low / P99 帧时间将如实记为 null。可下载 Intel PresentMon 放到 automation/tools/ 或通过 --presentmon 指定。"
            )
        if admin_status is False:
            recommendations.append(
                "当前终端非管理员权限：原神客户端 (YuanShen.exe) 通常以管理员权限运行，若需 psutil 内存采样、PresentMon ETW 帧率或 active-ui 键位巡检，请以管理员身份运行终端（纯 DXGI 屏幕观测无需管理员）。"
            )
        if not kbm_tpls and not pad_tpls:
            recommendations.append(
                "模板目录尚无键鼠/手柄图标模板：可运行 `qa-observer genshin capture-template --name kbm_prompt --roi bottom_prompts` 采集真实模板。"
            )

        return {
            "compliance": COMPLIANCE_DECLARATION,
            "platform": platform.platform(),
            "python": platform.python_version(),
            "isAdmin": admin_status,
            "detectedVersion": self.detect_version(game_dir),
            "dependencies": deps,
            "presentmonPath": str(pm_exe) if pm_exe else None,
            "vlmConfigured": vlm.configured,
            "templates": {"dir": str(self.templates_dir), "kbm": kbm_tpls, "gamepad": pad_tpls},
            "liveWindow": {
                "found": win is not None,
                "hwnd": win.hwnd if win else None,
                "pid": win.pid if win else None,
                "processName": win.process_name if win else None,
                "title": win.title if win else None,
                "position": [win.left, win.top] if win else None,
                "resolution": win.resolution_str if win else None,
                "isForeground": win.is_foreground if win else None,
                "isMinimized": win.is_minimized if win else None,
            },
            "recommendations": recommendations,
        }

    # ------------------------------------------------------------------
    # Template Capture Helper (with multi-monitor support, delay & ROI preview)
    # ------------------------------------------------------------------
    def _resolve_roi(self, roi_spec: str) -> list[float] | None:
        if roi_spec.strip().lower() in {"full", "all", "none"}:
            return None
        named = self.config.get("rois", {}).get(roi_spec)
        if named:
            return [float(x) for x in named]
        if "," in roi_spec:
            parts = [float(p.strip()) for p in roi_spec.split(",")]
            if len(parts) == 4 and all(0.0 <= v <= 1.0 for v in parts) and parts[0] < parts[2] and parts[1] < parts[3]:
                return parts
            raise ValueError(f"自定义 --roi 必须为 4 个 0~1 之间的归一化坐标 x1,y1,x2,y2，收到：{roi_spec}")
        valid_names = sorted(self.config.get("rois", {}).keys()) + ["full"]
        raise ValueError(f"未知 ROI 名称 '{roi_spec}'，可选：{valid_names}，或传入自定义坐标如 0.75,0.80,0.99,0.98")

    def capture_template(
        self,
        name: str,
        roi_name: str = "bottom_prompts",
        delay_sec: float = 3.0,
        backend: str | None = None,
        save_preview: bool = True,
    ) -> dict[str, Any]:
        roi = self._resolve_roi(roi_name)
        if delay_sec > 0:
            time.sleep(delay_sec)

        proc_cfg = self.config.get("process", {})
        win = find_game_window(
            process_names=proc_cfg.get("names", ["YuanShen.exe", "GenshinImpact.exe"]),
            window_classes=proc_cfg.get("window_classes", ["UnityWndClass"]),
            window_titles=proc_cfg.get("window_titles", ["原神", "Genshin Impact"]),
        )
        if win is None or win.is_minimized:
            raise RuntimeError("未找到可见的原神客户端窗口，请先启动游戏并保持窗口可见（不要最小化）。")

        preferred = backend or self.config.get("capture", {}).get("backend", "auto")
        capturer = FrameCapturer(preferred)
        try:
            frame = capturer.grab_region(win.left, win.top, win.width, win.height, rel_ts=0.0)
            if frame is None:
                raise RuntimeError(f"截屏失败（当前后端：{capturer.backend_name}），请确认已安装 mss 或 dxcam。")

            if roi is not None:
                sub_img, px_box = crop_normalized_roi(frame.bgr, roi)
            else:
                sub_img = frame.bgr
                px_box = (0, 0, frame.width, frame.height)

            th, tw = sub_img.shape[:2]
            if tw < 16 or th < 16:
                raise RuntimeError(
                    f"截取到的模板尺寸异常过小 ({tw}x{th})，原始捕获尺寸 ({frame.width}x{frame.height})，"
                    f"窗口位置 ({win.left},{win.top},{win.width}x{win.height})，已拒绝写入。"
                )

            self.templates_dir.mkdir(parents=True, exist_ok=True)
            safe_name = name if name.endswith(".png") else f"{name}.png"
            out_path = self.templates_dir / safe_name
            if not save_frame_png(sub_img, out_path):
                raise RuntimeError("无法保存模板 PNG，请确认已安装 opencv-python 或 Pillow。")

            preview_path: Path | None = None
            if save_preview:
                preview_path = self.templates_dir / f"_preview_{safe_name}"
                try:
                    import cv2  # type: ignore

                    annotated = frame.bgr.copy()
                    cv2.rectangle(annotated, (px_box[0], px_box[1]), (px_box[2] - 1, px_box[3] - 1), (0, 255, 0), 3)
                    save_frame_png(annotated, preview_path)
                except Exception:
                    save_frame_png(frame.bgr, preview_path)

            vis = analyze_frame_visual(sub_img, None, self.config.get("thresholds", {}))
            warnings: list[str] = []
            if not win.is_foreground:
                warnings.append("截图瞬间原神窗口不在前台：若终端与游戏在同一显示器，可能截到了遮挡窗口；可加 --delay 3 切回游戏后再截。")
            if vis.std_luma < 3.0:
                warnings.append(f"截取区域几乎为纯色（亮度={vis.mean_luma}, 标准差={vis.std_luma}），请打开预览图确认是否遮挡或黑屏。")

            return {
                "templatePath": str(out_path),
                "previewPath": str(preview_path) if preview_path else None,
                "backend": frame.backend,
                "windowRect": [win.left, win.top, win.width, win.height],
                "windowForeground": win.is_foreground,
                "capturedFrameSize": f"{frame.width}x{frame.height}",
                "templateSize": f"{tw}x{th}",
                "roi": roi_name,
                "roiPixels": list(px_box),
                "lumaMean": vis.mean_luma,
                "lumaStd": vis.std_luma,
                "warnings": warnings,
            }
        finally:
            capturer.close()

    # ------------------------------------------------------------------
    # Shared Frame Stream Analyzer (used by live observe & offline replay)
    # ------------------------------------------------------------------
    def _analyze_frame_stream(
        self,
        frames: Iterable[CapturedFrame],
        archiver: EvidenceArchiver,
        enable_vlm: bool = False,
        on_frame_hook: Any | None = None,
    ) -> dict[str, Any]:
        thresholds = self.config.get("thresholds", {})
        ocr_cfg = self.config.get("ocr_rules", {})
        capture_cfg = self.config.get("capture", {})

        ocr = OcrAnalyzer(
            ocr_rules=ocr_cfg,
            edge_margin_px=int(thresholds.get("ocr_edge_margin_px", 3)),
        )
        vlm = VlmInspector() if enable_vlm else None

        teleport_tracker = TeleportLoadTracker(
            min_hold_sec=float(thresholds.get("teleport_min_hold_sec", 0.8)),
            warn_sec=float(thresholds.get("teleport_warn_sec", 15.0)),
            timeout_sec=float(thresholds.get("teleport_timeout_sec", 35.0)),
        )

        black_hold_limit = float(thresholds.get("black_screen_hold_sec", 6.0))
        freeze_hold_limit = float(thresholds.get("freeze_hold_sec", 15.0))
        solid_hold_limit = float(thresholds.get("solid_color_hold_sec", 6.0))
        ocr_interval = float(capture_cfg.get("ocr_interval_sec", 4.0))
        vlm_max_frames = int(capture_cfg.get("vlm_max_frames", 4))

        prev_frame: CapturedFrame | None = None
        frames_analyzed = 0
        resolution: str | None = None
        capture_backend: str | None = None

        black_start_ts: float | None = None
        black_flagged = False
        freeze_start_ts: float | None = None
        freeze_flagged = False
        solid_start_ts: float | None = None
        solid_flagged = False
        magenta_flagged = False

        last_ocr_ts: float = -1e9
        ocr_checks_run = 0
        ocr_forbidden_total: list[str] = []
        ocr_overflow_total: list[str] = []
        ocr_reconnect_total: list[str] = []

        input_mode_history: list[tuple[float, str, str]] = []
        input_switches = 0
        unknown_after_switch_start: float | None = None
        input_switch_missing_flagged = False

        findings: list[Finding] = []
        artifacts: list[ArtifactRef] = []
        vlm_candidates: list[tuple[Path, str]] = []
        telemetry_points: list[dict[str, Any]] = []
        last_ts = 0.0

        for frame in frames:
            frames_analyzed += 1
            last_ts = frame.timestamp
            if resolution is None:
                resolution = f"{frame.width}x{frame.height}"
            if capture_backend is None:
                capture_backend = frame.backend

            vis = analyze_frame_visual(
                frame.bgr,
                prev_frame.bgr if prev_frame is not None else None,
                thresholds,
            )
            telemetry_points.append(
                {
                    "ts": round(frame.timestamp, 2),
                    "luma": vis.mean_luma,
                    "std": vis.std_luma,
                    "magentaRatio": vis.magenta_ratio,
                    "mad": vis.mad_from_prev,
                    "whiteLoading": vis.is_white_loading,
                }
            )

            # 1) Teleport white loading screen tracker
            ev = teleport_tracker.update(frame.timestamp, vis.is_white_loading)
            if ev is not None:
                if ev.timed_out:
                    art = archiver.save_screenshot(frame.bgr, f"teleport_timeout_{frames_analyzed}.png", "传送白屏超时")
                    if art:
                        artifacts.append(art)
                    findings.append(
                        Finding(
                            caseId="YS-TELEPORT-01",
                            severity="P1",
                            rule="TELEPORT_LOAD_TIMEOUT",
                            msg=f"传送/切场景白屏加载持续 {ev.duration_sec}s，超过超时阈值 {teleport_tracker.timeout_sec}s",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )
                elif ev.duration_sec >= teleport_tracker.warn_sec:
                    findings.append(
                        Finding(
                            caseId="YS-TELEPORT-01",
                            severity="P2",
                            rule="TELEPORT_LOAD_SLOW",
                            msg=f"传送/切场景加载耗时 {ev.duration_sec}s，超过告警阈值 {teleport_tracker.warn_sec}s",
                            timestamp=local_now_iso(),
                        )
                    )

            # 2) Prolonged black screen detection
            if vis.is_black_screen:
                if black_start_ts is None:
                    black_start_ts = frame.timestamp
                elif (frame.timestamp - black_start_ts) >= black_hold_limit and not black_flagged:
                    black_flagged = True
                    dur = round(frame.timestamp - black_start_ts, 2)
                    art = archiver.save_screenshot(frame.bgr, f"black_screen_{frames_analyzed}.png", "连续黑屏异常")
                    if art:
                        artifacts.append(art)
                    findings.append(
                        Finding(
                            caseId="YS-VIS-01",
                            severity="P1",
                            rule="BLACK_SCREEN",
                            msg=f"游戏画面连续黑屏 {dur}s（亮度均值 {vis.mean_luma}, 标准差 {vis.std_luma}）",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )
            else:
                black_start_ts = None

            # 3) Solid-color rendering anomaly
            if vis.is_solid_color:
                if solid_start_ts is None:
                    solid_start_ts = frame.timestamp
                elif (frame.timestamp - solid_start_ts) >= solid_hold_limit and not solid_flagged:
                    solid_flagged = True
                    dur = round(frame.timestamp - solid_start_ts, 2)
                    art = archiver.save_screenshot(frame.bgr, f"solid_color_{frames_analyzed}.png", "纯色画面异常")
                    if art:
                        artifacts.append(art)
                    findings.append(
                        Finding(
                            caseId="YS-VIS-01",
                            severity="P1",
                            rule="SOLID_COLOR_ANOMALY",
                            msg=f"画面连续 {dur}s 呈现异常纯色（亮度 {vis.mean_luma}, 标准差 {vis.std_luma}）",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )
            else:
                solid_start_ts = None

            # 4) Unity magenta/pink missing shader anomaly
            if vis.is_magenta_anomaly and not magenta_flagged:
                magenta_flagged = True
                art = archiver.save_screenshot(frame.bgr, f"magenta_shader_{frames_analyzed}.png", "紫红缺贴图/Shader异常")
                if art:
                    artifacts.append(art)
                findings.append(
                    Finding(
                        caseId="YS-VIS-01",
                        severity="P1",
                        rule="MISSING_TEXTURE_MAGENTA",
                        msg=f"检测到异常紫红色缺贴图区域占比 {vis.magenta_ratio:.2%}（阈值 {thresholds.get('magenta_ratio_max', 0.03):.2%}）",
                        timestamp=local_now_iso(),
                        evidencePath=art.path if art else None,
                    )
                )

            # 5) Prolonged frame freeze (excluding white loading screen)
            if vis.is_frozen_pair and not vis.is_white_loading and not vis.is_black_screen:
                if freeze_start_ts is None:
                    freeze_start_ts = frame.timestamp
                elif (frame.timestamp - freeze_start_ts) >= freeze_hold_limit and not freeze_flagged:
                    freeze_flagged = True
                    dur = round(frame.timestamp - freeze_start_ts, 2)
                    art = archiver.save_screenshot(frame.bgr, f"frame_freeze_{frames_analyzed}.png", "画面完全冻结")
                    if art:
                        artifacts.append(art)
                    findings.append(
                        Finding(
                            caseId="YS-VIS-01",
                            severity="P2",
                            rule="FRAME_FREEZE",
                            msg=f"画面连续 {dur}s 无像素变化（帧间 MAD={vis.mad_from_prev}），疑似界面卡死或长时间静止",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )
            else:
                freeze_start_ts = None

            # 6) Periodic OCR + Input Mode detection
            ocr_texts_for_frame: list[str] = []
            if (frame.timestamp - last_ocr_ts) >= ocr_interval or frames_analyzed == 1:
                last_ocr_ts = frame.timestamp
                if ocr.available:
                    ocr_checks_run += 1
                    res = ocr.inspect_frame(frame.bgr)
                    ocr_texts_for_frame = [it.text for it in res.items]
                    if res.forbidden_hits:
                        ocr_forbidden_total.extend(res.forbidden_hits)
                        art = archiver.save_screenshot(frame.bgr, f"ocr_raw_key_{frames_analyzed}.png", "疑似未翻译Key/占位符")
                        if art:
                            artifacts.append(art)
                        findings.append(
                            Finding(
                                caseId="YS-OCR-01",
                                severity="P2",
                                rule="L10N_RAW_KEY",
                                msg=f"OCR 检测到疑似未翻译 Key / 占位符：{'; '.join(res.forbidden_hits[:3])}",
                                timestamp=local_now_iso(),
                                evidencePath=art.path if art else None,
                            )
                        )
                    if res.overflow_hits:
                        ocr_overflow_total.extend(res.overflow_hits)
                    if res.reconnect_hits:
                        ocr_reconnect_total.extend(res.reconnect_hits)
                        art = archiver.save_screenshot(frame.bgr, f"reconnect_popup_{frames_analyzed}.png", "断线重连提示弹窗")
                        if art:
                            artifacts.append(art)
                        findings.append(
                            Finding(
                                caseId="YS-OCR-01",
                                severity="P1",
                                rule="RECONNECT_POPUP_DETECTED",
                                msg=f"检测到网络重连/断线提示弹窗：{'; '.join(res.reconnect_hits[:3])}",
                                timestamp=local_now_iso(),
                                evidencePath=art.path if art else None,
                            )
                        )

                mode, mode_reason = detect_input_mode(frame.bgr, self.templates_dir, ocr_texts_for_frame, self.config)
                if mode in {"kbm", "gamepad"}:
                    if input_mode_history and input_mode_history[-1][1] != mode:
                        input_switches += 1
                    input_mode_history.append((frame.timestamp, mode, mode_reason))
                    unknown_after_switch_start = None
                elif input_mode_history and not vis.is_white_loading and not vis.is_black_screen:
                    if unknown_after_switch_start is None:
                        unknown_after_switch_start = frame.timestamp
                    elif (frame.timestamp - unknown_after_switch_start) >= 6.0 and not input_switch_missing_flagged:
                        input_switch_missing_flagged = True
                        findings.append(
                            Finding(
                                caseId="YS-INPUT-01",
                                severity="P2",
                                rule="INPUT_PROMPT_DISAPPEARED",
                                msg=f"输入提示区在识别到 {input_mode_history[-1][1]} 后连续消失超过 6s（请人工复核是否处于过场动画或热切换丢失 UI）",
                                timestamp=local_now_iso(),
                            )
                        )

                if enable_vlm and len(vlm_candidates) < vlm_max_frames and not vis.is_black_screen and not vis.is_white_loading:
                    art = archiver.save_screenshot(frame.bgr, f"vlm_sample_{frames_analyzed}.png", "VLM 语义抽检样本")
                    if art:
                        artifacts.append(art)
                        vlm_candidates.append((Path(art.path), frame.source_label or f"t={frame.timestamp:.1f}s"))

            if on_frame_hook is not None:
                on_frame_hook(frame, vis)

            prev_frame = frame

        # Flush any ongoing teleport screen at end
        flushed = teleport_tracker.flush(last_ts)
        if flushed and flushed.timed_out:
            findings.append(
                Finding(
                    caseId="YS-TELEPORT-01",
                    severity="P1",
                    rule="TELEPORT_LOAD_TIMEOUT",
                    msg=f"巡检结束时仍停留在传送白屏界面已达 {flushed.duration_sec}s",
                    timestamp=local_now_iso(),
                )
            )

        if ocr_overflow_total:
            findings.append(
                Finding(
                    caseId="YS-OCR-01",
                    severity="P2",
                    rule="L10N_TEXT_OVERFLOW",
                    msg=f"OCR 检测到 {len(ocr_overflow_total)} 处文本贴边/疑似裁切：{'; '.join(ocr_overflow_total[:3])}",
                    timestamp=local_now_iso(),
                )
            )

        # Build deterministic CaseResults
        cases: list[CaseResult] = []
        vis_findings = [f for f in findings if f.caseId == "YS-VIS-01"]
        cases.append(
            CaseResult(
                caseId="YS-VIS-01",
                name="画面渲染异常实时巡检（黑屏/纯色/冻结/紫红缺贴图）",
                status="FAIL"
                if any(f.severity in {"P0", "P1"} for f in vis_findings)
                else ("WARN" if vis_findings else ("PASS" if frames_analyzed > 0 else "SKIP")),
                durationSec=last_ts,
                detail=(
                    f"共分析 {frames_analyzed} 帧，检出 {len(vis_findings)} 条视觉异常"
                    if frames_analyzed > 0
                    else "未采集到任何有效游戏画面帧"
                ),
                metrics={"framesAnalyzed": frames_analyzed},
            )
        )

        tp_durations = [ev.duration_sec for ev in teleport_tracker.events]
        tp_findings = [f for f in findings if f.caseId == "YS-TELEPORT-01"]
        cases.append(
            CaseResult(
                caseId="YS-TELEPORT-01",
                name="大世界传送/白屏加载耗时观测",
                status="FAIL"
                if any(f.severity in {"P0", "P1"} for f in tp_findings)
                else ("WARN" if tp_findings else "PASS"),
                durationSec=last_ts,
                detail=(
                    f"观测到 {len(tp_durations)} 次传送加载，耗时(s)：{tp_durations}"
                    if tp_durations
                    else "本轮未触发白屏传送切换，加载链路无卡死"
                ),
                metrics={"teleportLoadsSec": tp_durations},
            )
        )

        ocr_findings = [f for f in findings if f.caseId == "YS-OCR-01"]
        if ocr.available:
            cases.append(
                CaseResult(
                    caseId="YS-OCR-01",
                    name="UI 文本溢出 / 未翻译 Key / 重连弹窗 OCR 巡检",
                    status="FAIL"
                    if any(f.severity in {"P0", "P1"} for f in ocr_findings)
                    else ("WARN" if ocr_findings else "PASS"),
                    durationSec=last_ts,
                    detail=f"RapidOCR 共抽检 {ocr_checks_run} 帧，检出 {len(ocr_findings)} 条文本/弹窗异常",
                    metrics={"ocrChecks": ocr_checks_run},
                )
            )
        else:
            cases.append(
                CaseResult(
                    caseId="YS-OCR-01",
                    name="UI 文本溢出 / 未翻译 Key / 重连弹窗 OCR 巡检",
                    status="SKIP",
                    durationSec=0.0,
                    detail="未安装 rapidocr_onnxruntime，已跳过 OCR 巡检（可运行 uv sync --extra ocr 启用）",
                )
            )

        input_findings = [f for f in findings if f.caseId == "YS-INPUT-01"]
        observed_modes = sorted({m for _, m, _ in input_mode_history})
        if observed_modes:
            cases.append(
                CaseResult(
                    caseId="YS-INPUT-01",
                    name="键鼠 ↔ 手柄输入模式视觉验收",
                    status="WARN" if input_findings else "PASS",
                    durationSec=last_ts,
                    detail=f"识别到输入模式 {observed_modes}，检测到 {input_switches} 次热切换",
                    metrics={"observedModes": observed_modes, "switches": input_switches},
                )
            )
        else:
            cases.append(
                CaseResult(
                    caseId="YS-INPUT-01",
                    name="键鼠 ↔ 手柄输入模式视觉验收",
                    status="SKIP",
                    durationSec=0.0,
                    detail="未匹配到键鼠/手柄图标模板或按键 OCR 提示词（可先采集 templates/genshin/ 模板或安装 OCR）",
                )
            )

        if enable_vlm and vlm is not None:
            if not vlm.configured:
                cases.append(
                    CaseResult(
                        caseId="YS-VLM-01",
                        name="VLM 语义级画面与 UI 排版抽检",
                        status="SKIP",
                        durationSec=0.0,
                        detail="未配置 VLM_API_KEY / OPENAI_API_KEY，已跳过 VLM 抽检",
                    )
                )
            else:
                vlm_defects = 0
                vlm_ran = 0
                for img_path, ctx_label in vlm_candidates:
                    vres = vlm.inspect_image_file(img_path, context_label=ctx_label)
                    if vres.status != "SKIP":
                        vlm_ran += 1
                    for d in vres.defects:
                        vlm_defects += 1
                        findings.append(
                            Finding(
                                caseId="YS-VLM-01",
                                severity=str(d.get("severity", "P2")),
                                rule=str(d.get("rule", "VLM_VISUAL_DEFECT")),
                                msg=str(d.get("msg", vres.summary)),
                                timestamp=local_now_iso(),
                                evidencePath=str(img_path),
                            )
                        )
                cases.append(
                    CaseResult(
                        caseId="YS-VLM-01",
                        name="VLM 语义级画面与 UI 排版抽检",
                        status="WARN" if vlm_defects > 0 else ("PASS" if vlm_ran > 0 else "SKIP"),
                        durationSec=0.0,
                        detail=f"抽检 {vlm_ran} 张截图，VLM 标记 {vlm_defects} 处疑似视觉问题",
                    )
                )

        return {
            "frames_analyzed": frames_analyzed,
            "resolution": resolution,
            "capture_backend": capture_backend,
            "ocr_engine": ocr.engine_name,
            "teleport_loads": tp_durations,
            "cases": cases,
            "findings": findings,
            "artifacts": artifacts,
            "telemetry_points": telemetry_points,
        }

    # ------------------------------------------------------------------
    # Performance Case Builder (PresentMon + Process Memory)
    # ------------------------------------------------------------------
    def _build_perf_case(
        self,
        pm_stats: PresentMonStats | None,
        mem_avg: float | None,
        mem_peak: float | None,
        mem_slope: float | None,
        access_warning: str | None,
        duration_sec: float,
    ) -> tuple[CaseResult, list[Finding]]:
        thresholds = self.config.get("thresholds", {})
        findings: list[Finding] = []
        details: list[str] = []

        if pm_stats is not None:
            details.append(
                f"PresentMon 采样 {pm_stats.sample_count} 帧：Avg {pm_stats.avg_fps} FPS, "
                f"1% Low {pm_stats.low1_fps} FPS, P99 {pm_stats.p99_ms}ms, "
                f">50ms毛刺 {pm_stats.hitch_50ms_count} 次, >100ms毛刺 {pm_stats.hitch_100ms_count} 次"
            )
            if pm_stats.low1_fps < float(thresholds.get("low1_fps_fail", 30.0)):
                findings.append(
                    Finding(
                        caseId="YS-PERF-01",
                        severity="P1",
                        rule="LOW_1PCT_FPS_CRITICAL",
                        msg=f"1% Low FPS 跌至 {pm_stats.low1_fps}（严重低于基线 {thresholds.get('low1_fps_fail', 30.0)} FPS）",
                        timestamp=local_now_iso(),
                    )
                )
            elif pm_stats.low1_fps < float(thresholds.get("low1_fps_warn", 45.0)):
                findings.append(
                    Finding(
                        caseId="YS-PERF-01",
                        severity="P2",
                        rule="LOW_1PCT_FPS_WARN",
                        msg=f"1% Low FPS 为 {pm_stats.low1_fps}（低于预警基线 {thresholds.get('low1_fps_warn', 45.0)} FPS）",
                        timestamp=local_now_iso(),
                    )
                )
            if pm_stats.hitch_100ms_count >= int(thresholds.get("hitch_fail_count", 10)):
                findings.append(
                    Finding(
                        caseId="YS-PERF-01",
                        severity="P2",
                        rule="FRAMETIME_SPIKE",
                        msg=f"检测到 {pm_stats.hitch_100ms_count} 次 >100ms 单帧毛刺（最大帧时间 {pm_stats.max_ms}ms）",
                        timestamp=local_now_iso(),
                    )
                )
        else:
            details.append("PresentMon 未挂载或无帧数据（FPS/FrameTime 如实留空）")

        if mem_peak is not None:
            details.append(f"内存均值 {mem_avg} MB / 峰值 {mem_peak} MB")
            slope_limit = float(thresholds.get("mem_leak_slope_mb_per_min", 80.0))
            if mem_slope is not None:
                details.append(f"斜率 {mem_slope:+.1f} MB/min")
                if mem_slope >= slope_limit:
                    findings.append(
                        Finding(
                            caseId="YS-PERF-01",
                            severity="P2",
                            rule="MEMORY_GROWTH_SUSPECT",
                            msg=f"进程 RSS 内存持续上涨斜率达 {mem_slope:+.1f} MB/min（超过阈值 {slope_limit} MB/min）",
                            timestamp=local_now_iso(),
                        )
                    )
        elif access_warning:
            details.append(access_warning)

        if pm_stats is None and mem_peak is None:
            status = "SKIP"
        elif any(f.severity in {"P0", "P1"} for f in findings):
            status = "FAIL"
        elif findings:
            status = "WARN"
        else:
            status = "PASS"

        return (
            CaseResult(
                caseId="YS-PERF-01",
                name="外部性能基线观测（PresentMon 帧时间 + 进程内存水位）",
                status=status,
                durationSec=duration_sec,
                detail="；".join(details),
            ),
            findings,
        )

    # ------------------------------------------------------------------
    # Mode 1: 100% Passive Observe Mode (Default)
    # ------------------------------------------------------------------
    def run_observe(
        self,
        duration_sec: float = 60.0,
        wait_launch: bool = False,
        launch_timeout_sec: float = 120.0,
        game_dir: str | Path | None = None,
        version_override: str | None = None,
        presentmon_path: str | None = None,
        enable_vlm: bool = False,
        reports_dir: str | Path | None = None,
    ) -> RunReport:
        run_id = generate_run_id(self.game_key)
        archiver = EvidenceArchiver(run_id, base_dir=reports_dir)
        proc_cfg = self.config.get("process", {})
        capture_cfg = self.config.get("capture", {})
        proc_names = proc_cfg.get("names", ["YuanShen.exe", "GenshinImpact.exe"])
        win_classes = proc_cfg.get("window_classes", ["UnityWndClass"])
        win_titles = proc_cfg.get("window_titles", ["原神", "Genshin Impact"])

        monitor = ProcessMonitor(proc_names, proc_cfg.get("crash_dump_dirs", []))
        monitor.snapshot_crash_dirs()

        cold_start_sec: float | None = None
        launch_watch_start = time.monotonic()
        win: WindowInfo | None = None

        if wait_launch:
            proc_seen_ts: float | None = None
            while (time.monotonic() - launch_watch_start) < launch_timeout_sec:
                if proc_seen_ts is None:
                    found_proc = monitor.find_running_process()
                    if found_proc is not None:
                        proc_seen_ts = time.monotonic()
                win = find_game_window(proc_names, win_classes, win_titles)
                if win is not None and not win.is_minimized:
                    if proc_seen_ts is not None:
                        cold_start_sec = round(time.monotonic() - proc_seen_ts, 2)
                    break
                time.sleep(0.5)
        else:
            win = find_game_window(proc_names, win_classes, win_titles)

        if win is None:
            raise RuntimeError(
                "未检测到运行中的原神窗口（YuanShen.exe / GenshinImpact.exe）。"
                "请先启动游戏，或加上 --wait-launch 等待启动，或使用 `qa-observer genshin replay --input <录像/截图目录>` 分析已有录制文件。"
            )

        monitor.attach_pid(win.pid, win.process_name)

        # Attach PresentMon externally if present
        pm_exe = discover_presentmon(presentmon_path)
        pm_runner: PresentMonRunner | None = None
        pm_csv_path = archiver.run_dir / "presentmon.csv"
        if pm_exe is not None and win.process_name and not win.process_name.startswith("("):
            pm_runner = PresentMonRunner(pm_exe, win.process_name, pm_csv_path)
            pm_runner.start()

        capturer = FrameCapturer(capture_cfg.get("backend", "auto"))
        sample_interval = 1.0 / max(0.2, float(capture_cfg.get("sample_fps", 2.0)))
        start_mono = time.monotonic()
        exited_unexpectedly = False
        first_interactive_recorded = cold_start_sec is None  # Only refine cold_start when wait_launch used

        def _live_frames() -> Iterable[CapturedFrame]:
            nonlocal exited_unexpectedly, cold_start_sec, first_interactive_recorded
            while (time.monotonic() - start_mono) < duration_sec:
                rel_ts = time.monotonic() - start_mono
                alive = monitor.sample(rel_ts)
                cur_win = find_game_window(proc_names, win_classes, win_titles)
                if cur_win is None and not alive:
                    exited_unexpectedly = True
                    break
                if cur_win is not None and not cur_win.is_minimized:
                    frame = capturer.grab_region(cur_win.left, cur_win.top, cur_win.width, cur_win.height, rel_ts=rel_ts)
                    if frame is not None:
                        if not first_interactive_recorded:
                            # Refine coldStartSec once screen leaves black/white loading
                            vis_probe = analyze_frame_visual(frame.bgr, None, self.config.get("thresholds", {}))
                            if not vis_probe.is_black_screen and not vis_probe.is_white_loading:
                                cold_start_sec = round((cold_start_sec or 0.0) + rel_ts, 2)
                                first_interactive_recorded = True
                        yield frame
                sleep_for = sample_interval - ((time.monotonic() - start_mono) - rel_ts)
                if sleep_for > 0:
                    time.sleep(sleep_for)

        try:
            analysis = self._analyze_frame_stream(_live_frames(), archiver=archiver, enable_vlm=enable_vlm)
        finally:
            capturer.close()

        actual_duration = round(time.monotonic() - start_mono, 2)
        pm_stats = pm_runner.stop_and_parse() if pm_runner is not None else None
        proc_summary = monitor.summarize(exited_unexpectedly=exited_unexpectedly)

        findings: list[Finding] = list(analysis["findings"])
        cases: list[CaseResult] = []
        artifacts: list[ArtifactRef] = list(analysis["artifacts"])

        # Case YS-PROC-01
        proc_fail = exited_unexpectedly or bool(proc_summary.new_crash_dumps)
        if exited_unexpectedly:
            findings.append(
                Finding(
                    caseId="YS-PROC-01",
                    severity="P0",
                    rule="PROCESS_CRASH_EXIT",
                    msg=f"观测期间目标进程 {win.process_name} (PID={win.pid}) 异常退出",
                    timestamp=local_now_iso(),
                )
            )
        if proc_summary.new_crash_dumps:
            findings.append(
                Finding(
                    caseId="YS-PROC-01",
                    severity="P0",
                    rule="CRASH_DUMP_DETECTED",
                    msg=f"检测到新增崩溃转储文件：{', '.join(proc_summary.new_crash_dumps[:3])}",
                    timestamp=local_now_iso(),
                )
            )
        cases.append(
            CaseResult(
                caseId="YS-PROC-01",
                name="进程存活、冷启动与 CrashDump 监控",
                status="FAIL" if proc_fail else "PASS",
                durationSec=actual_duration,
                detail=(
                    f"进程 {win.process_name} (PID={win.pid}) 全程稳定存活，新增 CrashDump 0 个"
                    + (f"，冷启动耗时 {cold_start_sec}s" if cold_start_sec is not None else "")
                    if not proc_fail
                    else "检测到进程异常退出或新增 CrashDump"
                ),
            )
        )

        # Case YS-PERF-01
        perf_case, perf_findings = self._build_perf_case(
            pm_stats=pm_stats,
            mem_avg=proc_summary.mem_mb_avg,
            mem_peak=proc_summary.mem_mb_peak,
            mem_slope=proc_summary.mem_leak_slope_mb_per_min,
            access_warning=proc_summary.access_denied_warning or (pm_runner.start_error if pm_runner else None),
            duration_sec=actual_duration,
        )
        cases.append(perf_case)
        findings.extend(perf_findings)
        cases.extend(analysis["cases"])

        if pm_stats is not None and pm_stats.csv_path:
            artifacts.append(ArtifactRef(kind="presentmon_csv", path=pm_stats.csv_path, label="PresentMon Raw CSV"))

        telemetry_art = archiver.save_telemetry(
            {
                "runId": run_id,
                "frames": analysis["telemetry_points"],
                "processSamples": [
                    {"ts": round(s.timestamp, 2), "memMb": s.mem_mb, "cpuPct": s.cpu_pct}
                    for s in proc_summary.samples
                ],
            }
        )
        artifacts.append(telemetry_art)

        version = version_override or self.detect_version(game_dir)
        report = RunReport(
            id=run_id,
            game=self.game_name,
            gameKey=self.game_key,
            version=version,
            suite="genshin-non-intrusive-observe",
            mode="observe",
            dataOrigin="real_capture",
            durationSec=actual_duration,
            metrics=PerformanceMetrics(
                coldStartSec=cold_start_sec,
                avgFps=pm_stats.avg_fps if pm_stats else None,
                low1Fps=pm_stats.low1_fps if pm_stats else None,
                low01Fps=pm_stats.low01_fps if pm_stats else None,
                p50FrameTimeMs=pm_stats.p50_ms if pm_stats else None,
                p95FrameTimeMs=pm_stats.p95_ms if pm_stats else None,
                p99FrameTimeMs=pm_stats.p99_ms if pm_stats else None,
                maxFrameTimeMs=pm_stats.max_ms if pm_stats else None,
                hitchCount50ms=pm_stats.hitch_50ms_count if pm_stats else None,
                hitchCount100ms=pm_stats.hitch_100ms_count if pm_stats else None,
                memMbAvg=proc_summary.mem_mb_avg,
                memMbPeak=proc_summary.mem_mb_peak,
                memLeakSlopeMbPerMin=proc_summary.mem_leak_slope_mb_per_min,
                cpuPctAvg=proc_summary.cpu_pct_avg,
                framesAnalyzed=analysis["frames_analyzed"],
                teleportLoadsSec=analysis["teleport_loads"],
            ),
            environment=EnvironmentInfo(
                os=platform.platform(),
                resolution=analysis["resolution"] or win.resolution_str,
                processName=win.process_name,
                captureBackend=analysis["capture_backend"] or capturer.backend_name,
                presentmonAttached=pm_stats is not None,
                ocrEngine=analysis["ocr_engine"],
                vlmEnabled=bool(enable_vlm and VlmInspector().configured),
                isAdmin=is_windows_admin(),
                host=socket.gethostname(),
            ),
            ci=CIMetadata(provider="local-cli", triggeredBy="manual", runner=socket.gethostname()),
            cases=cases,
            findings=findings,
            artifacts=artifacts,
            notes="100% 零输入外部被动观测模式（Observe Mode），所有指标均为真实采样。",
        ).finalize()

        archiver.save_report(report)
        return report

    # ------------------------------------------------------------------
    # Mode 2: Opt-in Safe Public UI Traversal Mode
    # ------------------------------------------------------------------
    def run_active_ui(
        self,
        confirm_safe_zone: bool = False,
        dry_run: bool = False,
        game_dir: str | Path | None = None,
        version_override: str | None = None,
        presentmon_path: str | None = None,
        enable_vlm: bool = False,
        reports_dir: str | Path | None = None,
    ) -> RunReport:
        if not confirm_safe_zone:
            raise PermissionError(
                "active-ui 模式会发送标准公共菜单热键（ESC/B/C/F1/M），"
                "请先将角色停放在安全区主城静止状态，并显式传入 `--confirm-safe-zone` 确认执行。"
            )

        run_id = generate_run_id(self.game_key)
        archiver = EvidenceArchiver(run_id, base_dir=reports_dir)
        proc_cfg = self.config.get("process", {})
        ui_cfg = self.config.get("active_ui", {})
        thresholds = self.config.get("thresholds", {})
        proc_names = proc_cfg.get("names", ["YuanShen.exe", "GenshinImpact.exe"])
        win_classes = proc_cfg.get("window_classes", ["UnityWndClass"])
        win_titles = proc_cfg.get("window_titles", ["原神", "Genshin Impact"])

        win = find_game_window(proc_names, win_classes, win_titles)
        if win is None or win.is_minimized:
            raise RuntimeError("未找到可见的原神窗口，无法执行 active-ui 公共界面巡检。")
        if not dry_run and not win.is_foreground:
            raise RuntimeError("请先将原神游戏窗口切至前台，再执行 active-ui 巡检（可按 F12 随时紧急中止）。")

        guard = SafeActionGuard(
            min_interval_sec=float(ui_cfg.get("min_action_interval_sec", 1.2)),
            kill_switch_vk=int(ui_cfg.get("kill_switch_vk", 0x7B)),
        )
        driver = SafeUiDriver(target_hwnd=win.hwnd, guard=guard, dry_run=dry_run)
        ocr = OcrAnalyzer(self.config.get("ocr_rules", {}), int(thresholds.get("ocr_edge_margin_px", 3)))
        vlm = VlmInspector() if enable_vlm else None
        monitor = ProcessMonitor(proc_names, proc_cfg.get("crash_dump_dirs", []))
        monitor.snapshot_crash_dirs()
        monitor.attach_pid(win.pid, win.process_name)

        pm_exe = discover_presentmon(presentmon_path)
        pm_runner: PresentMonRunner | None = None
        if pm_exe is not None and win.process_name and not win.process_name.startswith("("):
            pm_runner = PresentMonRunner(pm_exe, win.process_name, archiver.run_dir / "presentmon.csv")
            pm_runner.start()

        capturer = FrameCapturer(self.config.get("capture", {}).get("backend", "auto"))
        settle_sec = float(ui_cfg.get("settle_sec", 2.0))
        steps = ui_cfg.get("steps", [])

        cases: list[CaseResult] = []
        findings: list[Finding] = []
        artifacts: list[ArtifactRef] = []
        frames_analyzed = 0
        start_mono = time.monotonic()

        try:
            for step in steps:
                step_start = time.monotonic()
                case_id = str(step.get("case_id", "YS-UI-STEP"))
                case_name = str(step.get("name", case_id))
                open_key = str(step.get("open_key", "ESC"))
                close_key = str(step.get("close_key", "ESC"))
                expected_kws = [str(k).lower() for k in step.get("expected_keywords", [])]

                monitor.sample(time.monotonic() - start_mono)
                before = capturer.grab_region(win.left, win.top, win.width, win.height, rel_ts=time.monotonic() - start_mono)
                driver.tap_key(open_key)
                time.sleep(settle_sec)
                after = capturer.grab_region(win.left, win.top, win.width, win.height, rel_ts=time.monotonic() - start_mono)
                driver.tap_key(close_key)
                time.sleep(0.8)

                if after is None:
                    cases.append(
                        CaseResult(caseId=case_id, name=case_name, status="FAIL", durationSec=time.monotonic() - step_start, detail="界面截屏失败")
                    )
                    continue

                frames_analyzed += 1
                art = archiver.save_screenshot(after.bgr, f"{case_id.lower()}.png", case_name)
                if art:
                    artifacts.append(art)

                vis = analyze_frame_visual(after.bgr, before.bgr if before else None, thresholds)
                step_findings: list[Finding] = []

                if not dry_run and vis.mad_from_prev is not None and vis.mad_from_prev < 1.2:
                    step_findings.append(
                        Finding(
                            caseId=case_id,
                            severity="P1",
                            rule="UI_NO_RESPONSE",
                            msg=f"按下 {open_key} 后画面几乎无变化（MAD={vis.mad_from_prev}），疑似热键无响应或非管理员权限被 UIPI 拦截",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )
                if vis.is_black_screen or vis.is_magenta_anomaly:
                    step_findings.append(
                        Finding(
                            caseId=case_id,
                            severity="P1",
                            rule="BLACK_SCREEN" if vis.is_black_screen else "MISSING_TEXTURE_MAGENTA",
                            msg=f"打开界面 {case_name} 后检出渲染异常（亮度={vis.mean_luma}, 紫红占比={vis.magenta_ratio:.2%}）",
                            timestamp=local_now_iso(),
                            evidencePath=art.path if art else None,
                        )
                    )

                ocr_note = "OCR 未安装"
                if ocr.available:
                    ores = ocr.inspect_frame(after.bgr)
                    joined = " ".join(it.text for it in ores.items).lower()
                    matched_kws = [kw for kw in expected_kws if kw in joined]
                    ocr_note = f"OCR 识别 {len(ores.items)} 处文本，命中特征词 {len(matched_kws)}/{len(expected_kws)}"
                    if ores.forbidden_hits:
                        step_findings.append(
                            Finding(
                                caseId=case_id,
                                severity="P2",
                                rule="L10N_RAW_KEY",
                                msg=f"界面 {case_name} 检出疑似未翻译 Key：{'; '.join(ores.forbidden_hits[:3])}",
                                timestamp=local_now_iso(),
                                evidencePath=art.path if art else None,
                            )
                        )
                    if ores.overflow_hits:
                        step_findings.append(
                            Finding(
                                caseId=case_id,
                                severity="P2",
                                rule="L10N_TEXT_OVERFLOW",
                                msg=f"界面 {case_name} 检出文本贴边/溢出：{'; '.join(ores.overflow_hits[:3])}",
                                timestamp=local_now_iso(),
                                evidencePath=art.path if art else None,
                            )
                        )

                if enable_vlm and vlm and vlm.configured and art:
                    vres = vlm.inspect_image_file(Path(art.path), context_label=case_name)
                    for d in vres.defects:
                        step_findings.append(
                            Finding(
                                caseId=case_id,
                                severity=str(d.get("severity", "P2")),
                                rule=str(d.get("rule", "VLM_VISUAL_DEFECT")),
                                msg=str(d.get("msg", vres.summary)),
                                timestamp=local_now_iso(),
                                evidencePath=art.path,
                            )
                        )

                findings.extend(step_findings)
                step_status = (
                    "FAIL"
                    if any(f.severity in {"P0", "P1"} for f in step_findings)
                    else ("WARN" if step_findings else "PASS")
                )
                cases.append(
                    CaseResult(
                        caseId=case_id,
                        name=case_name,
                        status=step_status,
                        durationSec=time.monotonic() - step_start,
                        detail=f"热键 {open_key}->{close_key} | 亮度={vis.mean_luma}, MAD={vis.mad_from_prev} | {ocr_note}",
                    )
                )
        finally:
            capturer.close()

        actual_duration = round(time.monotonic() - start_mono, 2)
        pm_stats = pm_runner.stop_and_parse() if pm_runner else None
        proc_summary = monitor.summarize(exited_unexpectedly=False)
        perf_case, perf_findings = self._build_perf_case(
            pm_stats=pm_stats,
            mem_avg=proc_summary.mem_mb_avg,
            mem_peak=proc_summary.mem_mb_peak,
            mem_slope=proc_summary.mem_leak_slope_mb_per_min,
            access_warning=proc_summary.access_denied_warning,
            duration_sec=actual_duration,
        )
        cases.append(perf_case)
        findings.extend(perf_findings)

        version = version_override or self.detect_version(game_dir)
        report = RunReport(
            id=run_id,
            game=self.game_name,
            gameKey=self.game_key,
            version=version,
            suite="genshin-safe-ui-traversal",
            mode="active-ui",
            dataOrigin="real_capture",
            durationSec=actual_duration,
            metrics=PerformanceMetrics(
                avgFps=pm_stats.avg_fps if pm_stats else None,
                low1Fps=pm_stats.low1_fps if pm_stats else None,
                low01Fps=pm_stats.low01_fps if pm_stats else None,
                p50FrameTimeMs=pm_stats.p50_ms if pm_stats else None,
                p95FrameTimeMs=pm_stats.p95_ms if pm_stats else None,
                p99FrameTimeMs=pm_stats.p99_ms if pm_stats else None,
                maxFrameTimeMs=pm_stats.max_ms if pm_stats else None,
                hitchCount50ms=pm_stats.hitch_50ms_count if pm_stats else None,
                hitchCount100ms=pm_stats.hitch_100ms_count if pm_stats else None,
                memMbAvg=proc_summary.mem_mb_avg,
                memMbPeak=proc_summary.mem_mb_peak,
                cpuPctAvg=proc_summary.cpu_pct_avg,
                framesAnalyzed=frames_analyzed,
            ),
            environment=EnvironmentInfo(
                os=platform.platform(),
                resolution=win.resolution_str,
                processName=win.process_name,
                captureBackend=capturer.backend_name,
                presentmonAttached=pm_stats is not None,
                ocrEngine=ocr.engine_name,
                vlmEnabled=bool(enable_vlm and VlmInspector().configured),
                isAdmin=is_windows_admin(),
                host=socket.gethostname(),
            ),
            ci=CIMetadata(provider="local-cli", triggeredBy="manual", runner=socket.gethostname()),
            cases=cases,
            findings=findings,
            artifacts=artifacts,
            notes="安全区公共界面遍历模式（仅使用标准系统热键打开非对抗 UI 界面，支持 F12 紧急中止）。",
        ).finalize()

        archiver.save_report(report)
        return report

    # ------------------------------------------------------------------
    # Mode 3: Offline Replay Mode (Real Video / Screenshot Folder + Optional PresentMon CSV)
    # ------------------------------------------------------------------
    def run_replay(
        self,
        input_path: str | Path,
        presentmon_csv: str | Path | None = None,
        version: str = "unknown",
        sample_fps: float | None = None,
        enable_vlm: bool = False,
        reports_dir: str | Path | None = None,
    ) -> RunReport:
        run_id = generate_run_id(self.game_key)
        archiver = EvidenceArchiver(run_id, base_dir=reports_dir)
        fps = sample_fps or float(self.config.get("capture", {}).get("sample_fps", 2.0))

        source = ReplayFrameSource(input_path, sample_fps=fps)
        t0 = time.monotonic()
        analysis = self._analyze_frame_stream(source.iter_frames(), archiver=archiver, enable_vlm=enable_vlm)
        elapsed = round(time.monotonic() - t0, 2)

        if analysis["frames_analyzed"] == 0:
            raise RuntimeError(f"未能从 {input_path} 读取到任何有效帧或图片。")

        pm_stats = parse_presentmon_csv(presentmon_csv) if presentmon_csv else None
        cases: list[CaseResult] = list(analysis["cases"])
        findings: list[Finding] = list(analysis["findings"])
        artifacts: list[ArtifactRef] = list(analysis["artifacts"])

        perf_case, perf_findings = self._build_perf_case(
            pm_stats=pm_stats,
            mem_avg=None,
            mem_peak=None,
            mem_slope=None,
            access_warning="离线回放模式未附带 PresentMon CSV，FPS 与内存指标如实留空",
            duration_sec=elapsed,
        )
        cases.append(perf_case)
        findings.extend(perf_findings)

        telemetry_art = archiver.save_telemetry({"runId": run_id, "frames": analysis["telemetry_points"]})
        artifacts.append(telemetry_art)

        report = RunReport(
            id=run_id,
            game=self.game_name,
            gameKey=self.game_key,
            version=version,
            suite=f"genshin-replay ({Path(input_path).name})",
            mode="replay",
            dataOrigin="real_replay",
            durationSec=elapsed,
            metrics=PerformanceMetrics(
                avgFps=pm_stats.avg_fps if pm_stats else None,
                low1Fps=pm_stats.low1_fps if pm_stats else None,
                low01Fps=pm_stats.low01_fps if pm_stats else None,
                p50FrameTimeMs=pm_stats.p50_ms if pm_stats else None,
                p95FrameTimeMs=pm_stats.p95_ms if pm_stats else None,
                p99FrameTimeMs=pm_stats.p99_ms if pm_stats else None,
                maxFrameTimeMs=pm_stats.max_ms if pm_stats else None,
                hitchCount50ms=pm_stats.hitch_50ms_count if pm_stats else None,
                hitchCount100ms=pm_stats.hitch_100ms_count if pm_stats else None,
                framesAnalyzed=analysis["frames_analyzed"],
                teleportLoadsSec=analysis["teleport_loads"],
            ),
            environment=EnvironmentInfo(
                os=platform.platform(),
                resolution=analysis["resolution"],
                captureBackend=analysis["capture_backend"],
                presentmonAttached=pm_stats is not None,
                ocrEngine=analysis["ocr_engine"],
                vlmEnabled=bool(enable_vlm and VlmInspector().configured),
                isAdmin=is_windows_admin(),
                host=socket.gethostname(),
            ),
            ci=CIMetadata(provider="local-cli", triggeredBy="manual", runner=socket.gethostname()),
            cases=cases,
            findings=findings,
            artifacts=artifacts,
            notes=f"基于真实录屏/截图目录离线回放分析：{Path(input_path).name}",
        ).finalize()

        archiver.save_report(report)
        return report
