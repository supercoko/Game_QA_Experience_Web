"""Zero-dependency Win32 window locator via ctypes (read-only metadata only)."""

from __future__ import annotations

import ctypes
import sys
from dataclasses import dataclass
from typing import Iterable


@dataclass
class WindowInfo:
    hwnd: int
    pid: int
    process_name: str
    title: str
    class_name: str
    left: int
    top: int
    width: int
    height: int
    is_foreground: bool
    is_minimized: bool

    @property
    def region(self) -> tuple[int, int, int, int]:
        return (self.left, self.top, self.left + self.width, self.top + self.height)

    @property
    def resolution_str(self) -> str:
        return f"{self.width}x{self.height}"


def enable_dpi_awareness() -> None:
    if sys.platform != "win32":
        return
    try:
        # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4
        ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass


def _get_process_name_by_pid(pid: int) -> str:
    try:
        import psutil  # type: ignore

        return psutil.Process(pid).name()
    except Exception:
        pass

    if sys.platform != "win32":
        return ""

    # Read-only QueryLimitedInformation (0x1000) — does NOT request VM_READ or inject anything
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not handle:
        return ""
    try:
        buf = ctypes.create_unicode_buffer(512)
        size = ctypes.c_uint(len(buf))
        if ctypes.windll.kernel32.QueryFullProcessImageNameW(handle, 0, buf, ctypes.byref(size)):
            full_path = buf.value
            return full_path.rsplit("\\", 1)[-1]
    finally:
        ctypes.windll.kernel32.CloseHandle(handle)
    return ""


def find_game_window(
    process_names: Iterable[str],
    window_classes: Iterable[str] = (),
    window_titles: Iterable[str] = (),
    min_width: int = 320,
    min_height: int = 200,
) -> WindowInfo | None:
    """Locate the visible top-level game window using Win32 read-only APIs."""
    if sys.platform != "win32":
        return None

    enable_dpi_awareness()

    from ctypes import wintypes

    user32 = ctypes.windll.user32
    proc_set = {p.lower() for p in process_names}
    class_set = {c.lower() for c in window_classes}
    title_set = {t.lower() for t in window_titles}

    foreground_hwnd = user32.GetForegroundWindow()
    matches: list[WindowInfo] = []

    class RECT(ctypes.Structure):
        _fields_ = [
            ("left", ctypes.c_long),
            ("top", ctypes.c_long),
            ("right", ctypes.c_long),
            ("bottom", ctypes.c_long),
        ]

    class POINT(ctypes.Structure):
        _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def _callback(hwnd: int, _lparam: int) -> bool:
        if not user32.IsWindowVisible(hwnd):
            return True

        title_buf = ctypes.create_unicode_buffer(256)
        user32.GetWindowTextW(hwnd, title_buf, 256)
        title = title_buf.value.strip()

        cls_buf = ctypes.create_unicode_buffer(256)
        user32.GetClassNameW(hwnd, cls_buf, 256)
        cls_name = cls_buf.value.strip()

        pid_val = wintypes.DWORD(0)
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid_val))
        pid = int(pid_val.value)
        proc_name = _get_process_name_by_pid(pid)

        proc_hit = bool(proc_name and proc_name.lower() in proc_set)
        title_hit = bool(title and (title.lower() in title_set))
        class_hit = bool(cls_name and (cls_name.lower() in class_set))

        if not (proc_hit or (title_hit and (not class_set or class_hit))):
            return True

        is_minimized = bool(user32.IsIconic(hwnd))
        rect = RECT()
        if not user32.GetClientRect(hwnd, ctypes.byref(rect)):
            return True
        width = int(rect.right - rect.left)
        height = int(rect.bottom - rect.top)
        if not is_minimized and (width < min_width or height < min_height):
            return True

        origin = POINT(0, 0)
        user32.ClientToScreen(hwnd, ctypes.byref(origin))

        matches.append(
            WindowInfo(
                hwnd=int(hwnd),
                pid=pid,
                process_name=proc_name or "(elevated/unknown)",
                title=title,
                class_name=cls_name,
                left=int(origin.x),
                top=int(origin.y),
                width=width,
                height=height,
                is_foreground=(int(hwnd) == int(foreground_hwnd)),
                is_minimized=is_minimized,
            )
        )
        return True

    user32.EnumWindows(WNDENUMPROC(_callback), 0)
    if not matches:
        return None
    # Prefer foreground & largest client window
    matches.sort(key=lambda w: (w.is_foreground, not w.is_minimized, w.width * w.height), reverse=True)
    return matches[0]


def is_window_foreground(hwnd: int) -> bool:
    if sys.platform != "win32":
        return False
    try:
        return int(ctypes.windll.user32.GetForegroundWindow()) == int(hwnd)
    except Exception:
        return False
