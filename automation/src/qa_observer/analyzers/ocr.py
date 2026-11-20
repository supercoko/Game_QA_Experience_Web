"""RapidOCR wrapper for non-invasive UI text, untranslated key, and clipping inspection."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Sequence


@dataclass
class OcrItem:
    text: str
    confidence: float
    bbox: tuple[int, int, int, int]  # (x1, y1, x2, y2)


@dataclass
class OcrCheckResult:
    available: bool
    items: list[OcrItem] = field(default_factory=list)
    forbidden_hits: list[str] = field(default_factory=list)
    overflow_hits: list[str] = field(default_factory=list)
    reconnect_hits: list[str] = field(default_factory=list)


class OcrAnalyzer:
    """Lazy wrapper around rapidocr_onnxruntime with graceful fallback when uninstalled."""

    def __init__(self, ocr_rules: dict[str, Any] | None = None, edge_margin_px: int = 3) -> None:
        self.ocr_rules = ocr_rules or {}
        self.edge_margin_px = max(0, int(edge_margin_px))
        self.engine_name: str | None = None
        self._engine: Any = None
        self._patterns = [
            re.compile(pat) for pat in self.ocr_rules.get("forbidden_patterns", [])
        ]
        self._reconnect_keywords = [
            kw.lower() for kw in self.ocr_rules.get("reconnect_keywords", [])
        ]
        self._init_engine()

    def _init_engine(self) -> None:
        try:
            from rapidocr_onnxruntime import RapidOCR  # type: ignore

            self._engine = RapidOCR()
            self.engine_name = "rapidocr_onnxruntime"
        except Exception:
            self._engine = None
            self.engine_name = None

    @property
    def available(self) -> bool:
        return self._engine is not None

    def extract_items(self, frame_bgr: Any) -> list[OcrItem]:
        if self._engine is None:
            return []
        result, _ = self._engine(frame_bgr)
        if not result:
            return []
        items: list[OcrItem] = []
        for entry in result:
            box, text, conf = entry[0], str(entry[1]).strip(), float(entry[2])
            if not text:
                continue
            xs = [int(pt[0]) for pt in box]
            ys = [int(pt[1]) for pt in box]
            items.append(OcrItem(text=text, confidence=round(conf, 3), bbox=(min(xs), min(ys), max(xs), max(ys))))
        return items

    _WATERMARK_RE = re.compile(r"(?:^|\b)(?:UID|GUID|ID)\s*[:：]?\s*\d{4,}", re.IGNORECASE)

    @classmethod
    def _is_watermark_text(cls, text: str) -> bool:
        compact = text.replace(":", "").replace("：", "").replace(".", "").replace("-", "").replace(" ", "")
        if compact.isdigit():
            return True
        return bool(cls._WATERMARK_RE.search(text))

    @classmethod
    def _redact_sensitive_ids(cls, text: str) -> str:
        return cls._WATERMARK_RE.sub(lambda m: m.group(0).split(":")[0].split("：")[0] + ":[REDACTED]", text)

    def inspect_items(self, items: Sequence[OcrItem], frame_width: int, frame_height: int) -> OcrCheckResult:
        forbidden_hits: list[str] = []
        overflow_hits: list[str] = []
        reconnect_hits: list[str] = []

        for item in items:
            if item.confidence < 0.55:
                continue
            for pat in self._patterns:
                if pat.search(item.text):
                    forbidden_hits.append(f"{self._redact_sensitive_ids(item.text)} (rule={pat.pattern})")
                    break
            low = item.text.lower()
            for kw in self._reconnect_keywords:
                if kw and kw in low:
                    reconnect_hits.append(self._redact_sensitive_ids(item.text))
                    break
            x1, y1, x2, y2 = item.bbox
            if frame_width > 0 and frame_height > 0:
                if (
                    x1 <= self.edge_margin_px
                    or y1 <= self.edge_margin_px
                    or x2 >= frame_width - self.edge_margin_px
                    or y2 >= frame_height - self.edge_margin_px
                ):
                    # Ignore normal corner UID/GUID/version watermarks; focus on readable UI text >= 3 chars
                    if len(item.text) >= 3 and not self._is_watermark_text(item.text):
                        overflow_hits.append(f"'{self._redact_sensitive_ids(item.text)}' @ {item.bbox}")

        return OcrCheckResult(
            available=True,
            items=list(items),
            forbidden_hits=forbidden_hits,
            overflow_hits=overflow_hits,
            reconnect_hits=reconnect_hits,
        )

    def inspect_frame(self, frame_bgr: Any) -> OcrCheckResult:
        if not self.available:
            return OcrCheckResult(available=False)
        h, w = frame_bgr.shape[:2]
        items = self.extract_items(frame_bgr)
        return self.inspect_items(items, w, h)
