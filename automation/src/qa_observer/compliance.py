"""Strict anti-cheat & safety compliance guardrails for external black-box QA observation."""

from __future__ import annotations

import ctypes
import sys
import time
from dataclasses import dataclass

COMPLIANCE_DECLARATION = (
    "STRICT NON-INVASIVE MODE: External screen capture, OS window metadata, "
    "ETW PresentMon telemetry, and read-only process stats only. "
    "Zero memory read/write, zero DLL injection, zero hooking, zero packet tampering, "
    "zero combat/farming/gacha automation."
)

APPROVED_PROCESS_WHITELIST: dict[str, set[str]] = {
    "genshin": {"yuanshen.exe", "genshinimpact.exe"},
    "starrail": {"starrail.exe"},
    "zzz": {"zenlesszonezero.exe"},
    "endfield": {"endfield.exe"},
}

SAFE_UI_ALLOWED_KEYS = {"ESC", "B", "C", "M", "F1", "F2", "F3", "TAB"}


def is_windows_admin() -> bool | None:
    if sys.platform != "win32":
        return None
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return None


def validate_target_process(game_key: str, process_name: str) -> bool:
    allowed = APPROVED_PROCESS_WHITELIST.get(game_key.lower(), set())
    return process_name.lower() in allowed


@dataclass
class SafeActionGuard:
    """Rate limiter & emergency kill-switch guard for opt-in active-ui checks."""

    min_interval_sec: float = 1.2
    max_actions: int = 24
    kill_switch_vk: int = 0x7B  # F12
    _last_action_ts: float = 0.0
    _action_count: int = 0

    def is_kill_switch_pressed(self) -> bool:
        if sys.platform != "win32":
            return False
        try:
            state = ctypes.windll.user32.GetAsyncKeyState(self.kill_switch_vk)
            return bool(state & 0x8000)
        except Exception:
            return False

    def authorize_key(self, key_name: str) -> None:
        upper = key_name.upper()
        if upper not in SAFE_UI_ALLOWED_KEYS:
            raise PermissionError(
                f"Key '{key_name}' is blocked by compliance guardrail. "
                f"Allowed safe UI navigation keys: {sorted(SAFE_UI_ALLOWED_KEYS)}"
            )
        if self.is_kill_switch_pressed():
            raise KeyboardInterrupt("Emergency kill-switch (F12) triggered by operator.")
        if self._action_count >= self.max_actions:
            raise RuntimeError(f"Safe action budget exceeded ({self.max_actions} max UI actions per run).")

        now = time.monotonic()
        elapsed = now - self._last_action_ts
        if self._last_action_ts > 0 and elapsed < self.min_interval_sec:
            time.sleep(self.min_interval_sec - elapsed)
        self._last_action_ts = time.monotonic()
        self._action_count += 1
