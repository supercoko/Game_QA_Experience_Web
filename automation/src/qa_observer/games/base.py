"""Abstract base adapter and 4-game implementation registry."""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from qa_observer.schema import RunReport

GAME_REGISTRY: list[dict[str, Any]] = [
    {
        "gameKey": "genshin",
        "game": "原神",
        "status": "implemented",
        "version": "1.0",
        "configPath": "automation/configs/genshin.yaml",
        "adapterModule": "qa_observer.games.genshin.GenshinAdapter",
        "modes": ["observe", "active-ui", "replay", "doctor", "capture-template"],
        "summary": "已完成完整非侵入观测、安全 UI 巡检、录像/截图回放、PresentMon 帧时间采集、键鼠↔手柄热切视觉验收及 CI 上报闭环。",
    },
    {
        "gameKey": "starrail",
        "game": "崩坏：星穹铁道",
        "status": "planned",
        "version": None,
        "configPath": "automation/configs/starrail.yaml (待创建)",
        "adapterModule": "qa_observer.games.starrail (待实现)",
        "modes": [],
        "summary": "复用 qa_observer 核心引擎；后续补充多语言 UI 对比与 Clumsy 弱网重连弹窗用例。",
    },
    {
        "gameKey": "zzz",
        "game": "绝区零",
        "status": "planned",
        "version": None,
        "configPath": "automation/configs/zzz.yaml (待创建)",
        "adapterModule": "qa_observer.games.zzz (待实现)",
        "modes": [],
        "summary": "复用 qa_observer 核心引擎；后续补充多分辨率安全区裁切与 ESC 暂停计时器 OCR 用例。",
    },
    {
        "gameKey": "endfield",
        "game": "明日方舟：终末地",
        "status": "planned",
        "version": None,
        "configPath": "automation/configs/endfield.yaml (待创建)",
        "adapterModule": "qa_observer.games.endfield (待实现)",
        "modes": [],
        "summary": "复用 qa_observer 核心引擎；后续补充启动闪退监听、地图底图巡检与手柄热切换倒计时用例。",
    },
]


class GameAdapter(ABC):
    """Base contract for game-specific non-invasive observation adapters."""

    game_key: str
    game_name: str

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    @abstractmethod
    def detect_version(self, game_dir: str | Path | None = None) -> str:
        """Detect actual installed client version from read-only metadata, or 'unknown'."""

    @abstractmethod
    def doctor(self, game_dir: str | Path | None = None, presentmon_path: str | None = None) -> dict[str, Any]:
        """Run non-invasive environment and target-client preflight diagnostics."""

    @abstractmethod
    def run_observe(self, **kwargs: Any) -> RunReport:
        """Run 100% passive zero-input observation against a live client."""

    @abstractmethod
    def run_active_ui(self, **kwargs: Any) -> RunReport:
        """Run opt-in safe public UI traversal checks."""

    @abstractmethod
    def run_replay(self, **kwargs: Any) -> RunReport:
        """Run full analysis pipeline against recorded video/screenshot evidence + optional PresentMon CSV."""
