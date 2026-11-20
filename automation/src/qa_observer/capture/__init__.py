"""External screen and window metadata capture (100% non-invasive)."""

from qa_observer.capture.screen import CapturedFrame, FrameCapturer, ReplayFrameSource
from qa_observer.capture.window import WindowInfo, find_game_window

__all__ = ["CapturedFrame", "FrameCapturer", "ReplayFrameSource", "WindowInfo", "find_game_window"]
