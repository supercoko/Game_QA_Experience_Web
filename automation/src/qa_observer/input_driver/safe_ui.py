"""Opt-in safe UI key sender using standard Win32 SendInput (hardware scan codes).

Strictly guarded by SafeActionGuard:
- Only allows public UI navigation keys (ESC, B, C, M, F1..F3, TAB)
- Verifies target game window is still foreground before every single keypress
- Enforces cooldown interval and F12 emergency kill-switch
"""

from __future__ import annotations

import ctypes
import sys
import time

from qa_observer.capture.window import is_window_foreground
from qa_observer.compliance import SafeActionGuard

# Standard PC AT Set 1 hardware scan codes (used by Unity DirectInput/RawInput)
SCAN_CODES: dict[str, int] = {
    "ESC": 0x01,
    "TAB": 0x0F,
    "B": 0x30,
    "C": 0x2E,
    "M": 0x32,
    "F1": 0x3B,
    "F2": 0x3C,
    "F3": 0x3D,
}


class SafeUiDriver:
    def __init__(self, target_hwnd: int, guard: SafeActionGuard | None = None, dry_run: bool = False) -> None:
        self.target_hwnd = target_hwnd
        self.guard = guard or SafeActionGuard()
        self.dry_run = dry_run

    def tap_key(self, key_name: str, hold_sec: float = 0.08) -> None:
        upper = key_name.upper()
        self.guard.authorize_key(upper)
        if self.dry_run:
            return
        if sys.platform != "win32":
            raise RuntimeError("SafeUiDriver active key sending is only supported on Windows.")
        if not is_window_foreground(self.target_hwnd):
            raise RuntimeError(
                "目标游戏窗口已失去焦点，安全守卫已自动中止 active-ui 操作（防止误触其他应用）。"
            )
        scan = SCAN_CODES.get(upper)
        if scan is None:
            raise PermissionError(f"Unsupported safe UI key: {key_name}")
        self._send_scan_code(scan, key_up=False)
        time.sleep(hold_sec)
        self._send_scan_code(scan, key_up=True)

    @staticmethod
    def _send_scan_code(scan_code: int, key_up: bool = False) -> None:
        PUL = ctypes.POINTER(ctypes.c_ulong)

        class KeyBdInput(ctypes.Structure):
            _fields_ = [
                ("wVk", ctypes.c_ushort),
                ("wScan", ctypes.c_ushort),
                ("dwFlags", ctypes.c_ulong),
                ("time", ctypes.c_ulong),
                ("dwExtraInfo", PUL),
            ]

        class InputUnion(ctypes.Union):
            _fields_ = [("ki", KeyBdInput)]

        class Input(ctypes.Structure):
            _fields_ = [("type", ctypes.c_ulong), ("ii", InputUnion)]

        KEYEVENTF_SCANCODE = 0x0008
        KEYEVENTF_KEYUP = 0x0002
        flags = KEYEVENTF_SCANCODE | (KEYEVENTF_KEYUP if key_up else 0)
        extra = ctypes.c_ulong(0)
        inp = Input(
            type=1,
            ii=InputUnion(ki=KeyBdInput(0, scan_code, flags, 0, ctypes.pointer(extra))),
        )
        ctypes.windll.user32.SendInput(1, ctypes.pointer(inp), ctypes.sizeof(inp))
