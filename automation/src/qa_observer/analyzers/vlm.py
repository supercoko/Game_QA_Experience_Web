"""Optional OpenAI-compatible VLM visual defect inspector (stdlib HTTP, zero extra SDK)."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class VlmInspectionResult:
    enabled: bool
    status: str  # PASS | WARN | FAIL | SKIP
    summary: str
    defects: list[dict[str, str]] = field(default_factory=list)


class VlmInspector:
    """Sends sampled UI screenshots to an OpenAI-compatible Vision API when configured."""

    SYSTEM_PROMPT = (
        "You are a senior Game QA Visual Inspector. Inspect the provided game screenshot strictly "
        "for genuine UI/rendering defects: overlapping text, clipped buttons/UID, missing pink/checkerboard "
        "textures, untranslated placeholder keys, blank UI panels, or severe rendering corruption. "
        "Do NOT invent issues if the screenshot looks normal. "
        "Respond ONLY with valid JSON: "
        '{"status": "PASS|WARN|FAIL", "summary": "...", '
        '"defects": [{"severity": "P1|P2", "rule": "VLM_VISUAL_DEFECT", "msg": "..."}]}'
    )

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_sec: float = 35.0,
    ) -> None:
        self.api_key = api_key or os.environ.get("VLM_API_KEY") or os.environ.get("OPENAI_API_KEY")
        self.base_url = (
            base_url
            or os.environ.get("VLM_BASE_URL")
            or os.environ.get("OPENAI_BASE_URL")
            or "https://api.openai.com/v1"
        ).rstrip("/")
        self.model = model or os.environ.get("VLM_MODEL") or "gpt-4o-mini"
        self.timeout_sec = timeout_sec

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def inspect_image_file(self, image_path: Path, context_label: str = "") -> VlmInspectionResult:
        if not self.configured:
            return VlmInspectionResult(
                enabled=False,
                status="SKIP",
                summary="未配置 VLM_API_KEY / OPENAI_API_KEY，已跳过 VLM 语义视觉抽检",
            )
        if not image_path.exists():
            return VlmInspectionResult(
                enabled=True,
                status="SKIP",
                summary=f"截图不存在：{image_path}",
            )

        b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
        payload = {
            "model": self.model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Game: 原神 (Genshin Impact). Context: {context_label or image_path.name}. Inspect strictly for visual defects.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64}"},
                        },
                    ],
                },
            ],
        }

        req = urllib.request.Request(
            url=f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            content = body["choices"][0]["message"]["content"]
            parsed: dict[str, Any] = json.loads(content)
            status = str(parsed.get("status", "PASS")).upper()
            if status not in {"PASS", "WARN", "FAIL"}:
                status = "WARN"
            defects = parsed.get("defects") if isinstance(parsed.get("defects"), list) else []
            return VlmInspectionResult(
                enabled=True,
                status=status,
                summary=str(parsed.get("summary", "VLM 抽检完成")),
                defects=defects,
            )
        except urllib.error.URLError as exc:
            return VlmInspectionResult(
                enabled=True,
                status="SKIP",
                summary=f"VLM 接口网络不可达：{exc}",
            )
        except Exception as exc:
            return VlmInspectionResult(
                enabled=True,
                status="SKIP",
                summary=f"VLM 响应解析失败：{exc}",
            )
