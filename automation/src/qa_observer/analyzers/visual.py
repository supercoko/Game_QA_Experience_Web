"""Deterministic OpenCV/NumPy visual anomaly detectors, teleport tracker, and template matching."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence


@dataclass
class FrameVisualMetrics:
    mean_luma: float
    std_luma: float
    magenta_ratio: float
    mad_from_prev: float | None
    is_black_screen: bool
    is_white_loading: bool
    is_solid_color: bool
    is_magenta_anomaly: bool
    is_frozen_pair: bool


def crop_normalized_roi(frame_bgr: Any, roi: Sequence[float]) -> tuple[Any, tuple[int, int, int, int]]:
    """Crop normalized ROI [x1, y1, x2, y2] returning (sub_image, (px1, py1, px2, py2))."""
    h, w = frame_bgr.shape[:2]
    x1 = max(0, min(w - 1, int(round(roi[0] * w))))
    y1 = max(0, min(h - 1, int(round(roi[1] * h))))
    x2 = max(x1 + 1, min(w, int(round(roi[2] * w))))
    y2 = max(y1 + 1, min(h, int(round(roi[3] * h))))
    return frame_bgr[y1:y2, x1:x2], (x1, y1, x2, y2)


def _to_gray(frame_bgr: Any) -> Any:
    try:
        import cv2  # type: ignore

        return cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    except ImportError:
        import numpy as np  # type: ignore

        b = frame_bgr[:, :, 0].astype(np.float32)
        g = frame_bgr[:, :, 1].astype(np.float32)
        r = frame_bgr[:, :, 2].astype(np.float32)
        return (0.114 * b + 0.587 * g + 0.299 * r).astype(np.uint8)


def _compute_magenta_ratio(frame_bgr: Any) -> float:
    """Detect Unity/UE missing shader pink/magenta regions."""
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore

        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, np.array([140, 140, 140]), np.array([168, 255, 255]))
        return float(np.count_nonzero(mask)) / float(mask.size) if mask.size else 0.0
    except ImportError:
        import numpy as np  # type: ignore

        # Fallback RGB heuristic for vivid magenta (high R & B, low G)
        b = frame_bgr[:, :, 0]
        g = frame_bgr[:, :, 1]
        r = frame_bgr[:, :, 2]
        mask = (r >= 180) & (b >= 180) & (g <= 70)
        return float(np.count_nonzero(mask)) / float(mask.size) if mask.size else 0.0


def analyze_frame_visual(
    frame_bgr: Any,
    prev_frame_bgr: Any | None,
    thresholds: dict[str, Any],
) -> FrameVisualMetrics:
    """Run deterministic visual checks on a single BGR frame."""
    import numpy as np  # type: ignore

    gray = _to_gray(frame_bgr)
    mean_luma = float(gray.mean())
    std_luma = float(gray.std())
    magenta_ratio = _compute_magenta_ratio(frame_bgr)

    black_luma_max = float(thresholds.get("black_screen_luma_max", 6.0))
    black_std_max = float(thresholds.get("black_screen_std_max", 4.0))
    solid_std_max = float(thresholds.get("solid_color_std_max", 2.5))
    magenta_max = float(thresholds.get("magenta_ratio_max", 0.03))
    white_luma_min = float(thresholds.get("teleport_white_luma_min", 228.0))
    white_std_max = float(thresholds.get("teleport_white_std_max", 28.0))
    freeze_mad_max = float(thresholds.get("freeze_mad_max", 0.35))

    is_black = mean_luma <= black_luma_max and std_luma <= black_std_max
    is_white_loading = mean_luma >= white_luma_min and std_luma <= white_std_max
    is_solid = (not is_black) and (not is_white_loading) and std_luma <= solid_std_max
    is_magenta = magenta_ratio >= magenta_max

    mad_val: float | None = None
    is_frozen_pair = False
    if prev_frame_bgr is not None and prev_frame_bgr.shape == frame_bgr.shape:
        prev_gray = _to_gray(prev_frame_bgr)
        diff = np.abs(gray.astype(np.float32) - prev_gray.astype(np.float32))
        mad_val = float(diff.mean())
        is_frozen_pair = mad_val <= freeze_mad_max

    return FrameVisualMetrics(
        mean_luma=round(mean_luma, 2),
        std_luma=round(std_luma, 2),
        magenta_ratio=round(magenta_ratio, 4),
        mad_from_prev=round(mad_val, 3) if mad_val is not None else None,
        is_black_screen=is_black,
        is_white_loading=is_white_loading,
        is_solid_color=is_solid,
        is_magenta_anomaly=is_magenta,
        is_frozen_pair=is_frozen_pair,
    )


@dataclass
class TeleportLoadEvent:
    start_ts: float
    end_ts: float
    duration_sec: float
    timed_out: bool = False


@dataclass
class TeleportLoadTracker:
    """Stateful tracker detecting Genshin's bright white 7-element loading screens."""

    min_hold_sec: float = 0.8
    warn_sec: float = 15.0
    timeout_sec: float = 35.0
    _active_start: float | None = None
    events: list[TeleportLoadEvent] = field(default_factory=list)

    def update(self, ts: float, is_white_loading: bool) -> TeleportLoadEvent | None:
        if is_white_loading:
            if self._active_start is None:
                self._active_start = ts
            return None

        if self._active_start is not None:
            dur = ts - self._active_start
            start = self._active_start
            self._active_start = None
            if dur >= self.min_hold_sec:
                ev = TeleportLoadEvent(
                    start_ts=round(start, 2),
                    end_ts=round(ts, 2),
                    duration_sec=round(dur, 2),
                    timed_out=dur >= self.timeout_sec,
                )
                self.events.append(ev)
                return ev
        return None

    def flush(self, end_ts: float) -> TeleportLoadEvent | None:
        if self._active_start is None:
            return None
        dur = end_ts - self._active_start
        start = self._active_start
        self._active_start = None
        if dur >= self.min_hold_sec:
            ev = TeleportLoadEvent(
                start_ts=round(start, 2),
                end_ts=round(end_ts, 2),
                duration_sec=round(dur, 2),
                timed_out=dur >= self.timeout_sec,
            )
            self.events.append(ev)
            return ev
        return None


def match_templates_in_dir(
    frame_bgr: Any,
    templates_dir: Path,
    prefix: str,
    roi: Sequence[float] | None = None,
    threshold: float = 0.78,
    scales: Sequence[float] = (0.85, 1.0, 1.15),
) -> tuple[str | None, float]:
    """Multi-scale OpenCV template matching for files matching `<prefix>*.png`."""
    if not templates_dir.exists():
        return (None, 0.0)
    files = sorted(templates_dir.glob(f"{prefix}*.png"))
    if not files:
        return (None, 0.0)
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore
    except ImportError:
        return (None, 0.0)

    search_img = crop_normalized_roi(frame_bgr, roi)[0] if roi is not None else frame_bgr
    search_gray = cv2.cvtColor(search_img, cv2.COLOR_BGR2GRAY)
    sh, sw = search_gray.shape[:2]

    best_name: str | None = None
    best_score = 0.0

    for tpl_path in files:
        raw = np.fromfile(str(tpl_path), dtype=np.uint8)
        tpl = cv2.imdecode(raw, cv2.IMREAD_GRAYSCALE)
        if tpl is None:
            continue
        th0, tw0 = tpl.shape[:2]
        for scale in scales:
            tw = max(4, int(round(tw0 * scale)))
            th = max(4, int(round(th0 * scale)))
            if tw > sw or th > sh:
                continue
            resized = tpl if abs(scale - 1.0) < 1e-3 else cv2.resize(tpl, (tw, th))
            res = cv2.matchTemplate(search_gray, resized, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(res)
            if float(max_val) > best_score:
                best_score = float(max_val)
                best_name = tpl_path.name

    if best_score >= threshold:
        return (best_name, round(best_score, 3))
    return (None, round(best_score, 3))


def detect_input_mode(
    frame_bgr: Any,
    templates_dir: Path,
    ocr_texts: Sequence[str],
    config: dict[str, Any],
) -> tuple[str, str]:
    """Detect whether the current Genshin UI prompt reflects keyboard+mouse or gamepad."""
    rois = config.get("rois", {})
    prompt_roi = rois.get("bottom_prompts", [0.55, 0.85, 0.99, 0.99])
    threshold = float(config.get("thresholds", {}).get("template_match_threshold", 0.78))

    kbm_tpl, kbm_score = match_templates_in_dir(frame_bgr, templates_dir, "kbm_", prompt_roi, threshold)
    pad_tpl, pad_score = match_templates_in_dir(frame_bgr, templates_dir, "pad_", prompt_roi, threshold)

    if kbm_tpl and (not pad_tpl or kbm_score >= pad_score):
        return ("kbm", f"template:{kbm_tpl}({kbm_score})")
    if pad_tpl:
        return ("gamepad", f"template:{pad_tpl}({pad_score})")

    ocr_rules = config.get("ocr_rules", {})
    kbm_tokens = [t.lower() for t in ocr_rules.get("kbm_prompt_tokens", [])]
    pad_tokens = [t.lower() for t in ocr_rules.get("gamepad_prompt_tokens", [])]

    joined = " ".join(ocr_texts).lower()
    kbm_hits = [tok for tok in kbm_tokens if tok and tok in joined]
    pad_hits = [tok for tok in pad_tokens if tok and tok in joined]

    if pad_hits and len(pad_hits) >= len(kbm_hits):
        return ("gamepad", f"ocr:{','.join(pad_hits[:3])}")
    if kbm_hits:
        return ("kbm", f"ocr:{','.join(kbm_hits[:3])}")

    return ("unknown", "no_template_or_ocr_prompt_hit")
