"""Visual, OCR, and optional VLM analyzers for external frame inspection."""

from qa_observer.analyzers.ocr import OcrAnalyzer, OcrItem, OcrCheckResult
from qa_observer.analyzers.visual import (
    FrameVisualMetrics,
    TeleportLoadTracker,
    analyze_frame_visual,
    crop_normalized_roi,
    detect_input_mode,
    match_templates_in_dir,
)
from qa_observer.analyzers.vlm import VlmInspector, VlmInspectionResult

__all__ = [
    "FrameVisualMetrics",
    "OcrAnalyzer",
    "OcrItem",
    "OcrCheckResult",
    "TeleportLoadTracker",
    "VlmInspector",
    "VlmInspectionResult",
    "analyze_frame_visual",
    "crop_normalized_roi",
    "detect_input_mode",
    "match_templates_in_dir",
]
