"""Non-invasive screen capture backends (multi-monitor DXGI dxcam -> MSS -> PIL) and offline replay source."""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator


@dataclass
class CapturedFrame:
    timestamp: float  # seconds since run start (or monotonic)
    width: int
    height: int
    bgr: Any  # numpy.ndarray (H, W, 3) uint8 BGR or list-based test frame
    backend: str
    source_label: str = ""


@dataclass
class MonitorRect:
    device_idx: int
    output_idx: int
    left: int
    top: int
    right: int
    bottom: int
    name: str = ""

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top


def map_region_to_monitor(
    left: int,
    top: int,
    width: int,
    height: int,
    monitors: list[MonitorRect],
) -> tuple[MonitorRect, tuple[int, int, int, int]] | None:
    """Map a virtual-desktop window rect to the monitor containing its center and convert to local coords.

    Returns `(monitor, (local_x1, local_y1, local_x2, local_y2))` when the window lies substantially
    inside a single monitor, or `None` if no monitor matches (caller should fall back to MSS).
    """
    if width <= 0 or height <= 0 or not monitors:
        return None
    right = left + width
    bottom = top + height
    cx = left + width // 2
    cy = top + height // 2

    target: MonitorRect | None = None
    for mon in monitors:
        if mon.left <= cx < mon.right and mon.top <= cy < mon.bottom:
            target = mon
            break
    if target is None:
        return None

    # Compute intersection with target monitor in monitor-local coordinates
    ix1 = max(left, target.left)
    iy1 = max(top, target.top)
    ix2 = min(right, target.right)
    iy2 = min(bottom, target.bottom)
    inter_w = ix2 - ix1
    inter_h = iy2 - iy1
    if inter_w < max(16, int(width * 0.5)) or inter_h < max(16, int(height * 0.5)):
        # Window mostly spans across multiple monitors; let MSS handle virtual desktop capture
        return None

    local_region = (
        ix1 - target.left,
        iy1 - target.top,
        ix2 - target.left,
        iy2 - target.top,
    )
    return (target, local_region)


def _discover_dxcam_monitors() -> list[MonitorRect]:
    monitors: list[MonitorRect] = []
    try:
        import dxcam  # type: ignore

        for d_idx, outs in enumerate(dxcam.__factory.outputs):
            for o_idx, out in enumerate(outs):
                coords = out.desc.DesktopCoordinates
                monitors.append(
                    MonitorRect(
                        device_idx=d_idx,
                        output_idx=o_idx,
                        left=int(coords.left),
                        top=int(coords.top),
                        right=int(coords.right),
                        bottom=int(coords.bottom),
                        name=str(getattr(out, "devicename", "")),
                    )
                )
    except Exception:
        pass
    return monitors


def _create_mss_ctx() -> Any | None:
    try:
        import mss  # type: ignore

        return mss.MSS() if hasattr(mss, "MSS") else mss.mss()
    except Exception:
        return None


class FrameCapturer:
    """Captures the game window's client rectangle purely from desktop compositor output.

    Supports multi-monitor Windows setups (including negative left/top coordinates on
    secondary monitors) by mapping each window to its DXGI output or falling back seamlessly to MSS.
    """

    def __init__(self, preferred_backend: str = "auto") -> None:
        self.preferred_backend = preferred_backend.lower()
        self.backend_name: str = "unavailable"
        self._dxcam_available: bool = False
        self._dxcam_monitors: list[MonitorRect] = []
        self._dxcam_cameras: dict[tuple[int, int], Any] = {}
        self._dxcam_failed_outputs: set[tuple[int, int]] = set()
        self._mss_ctx: Any = None
        self._pil_available: bool = False
        self._init_backend()

    def _init_backend(self) -> None:
        # Always probe fallback backends cleanly when preferred_backend == "auto"
        order = (
            ["dxcam", "mss", "pil"]
            if self.preferred_backend == "auto"
            else [self.preferred_backend]
        )
        for name in order:
            if name == "dxcam":
                mons = _discover_dxcam_monitors()
                if mons:
                    self._dxcam_available = True
                    self._dxcam_monitors = mons
                    if self.backend_name == "unavailable":
                        self.backend_name = "dxcam"
            elif name == "mss":
                ctx = _create_mss_ctx()
                if ctx is not None:
                    self._mss_ctx = ctx
                    if self.backend_name == "unavailable":
                        self.backend_name = "mss"
            elif name == "pil":
                try:
                    from PIL import ImageGrab  # type: ignore  # noqa: F401

                    self._pil_available = True
                    if self.backend_name == "unavailable":
                        self.backend_name = "pil"
                except Exception:
                    continue

    def _get_dxcam_camera(self, device_idx: int, output_idx: int) -> Any | None:
        key = (device_idx, output_idx)
        if key in self._dxcam_failed_outputs:
            return None
        if key in self._dxcam_cameras:
            return self._dxcam_cameras[key]
        try:
            import dxcam  # type: ignore

            cam = dxcam.create(device_idx=device_idx, output_idx=output_idx, output_color="BGR")
            if cam is None:
                self._dxcam_failed_outputs.add(key)
                return None
            self._dxcam_cameras[key] = cam
            return cam
        except Exception:
            self._dxcam_failed_outputs.add(key)
            return None

    def _grab_dxcam(self, left: int, top: int, width: int, height: int, rel_ts: float) -> CapturedFrame | None:
        if not self._dxcam_available:
            return None
        mapped = map_region_to_monitor(left, top, width, height, self._dxcam_monitors)
        if mapped is None:
            return None
        mon, local_region = mapped
        cam = self._get_dxcam_camera(mon.device_idx, mon.output_idx)
        if cam is None:
            return None

        frame = None
        for attempt in range(3):
            try:
                frame = cam.grab(region=local_region)
            except Exception:
                self._dxcam_failed_outputs.add((mon.device_idx, mon.output_idx))
                return None
            if frame is not None:
                break
            if attempt < 2:
                time.sleep(0.05)

        if frame is None:
            return None
        h, w = frame.shape[:2]
        if w < 16 or h < 16:
            return None
        return CapturedFrame(
            timestamp=rel_ts,
            width=w,
            height=h,
            bgr=frame,
            backend=f"dxcam(out{mon.output_idx})",
        )

    def _grab_mss(self, left: int, top: int, width: int, height: int, rel_ts: float) -> CapturedFrame | None:
        if self._mss_ctx is None:
            return None
        try:
            import numpy as np  # type: ignore

            monitor = {"left": int(left), "top": int(top), "width": int(width), "height": int(height)}
            raw = self._mss_ctx.grab(monitor)
            arr = np.array(raw, dtype=np.uint8)
            bgr = arr[:, :, :3].copy()
            h, w = bgr.shape[:2]
            if w < 16 or h < 16:
                return None
            return CapturedFrame(timestamp=rel_ts, width=w, height=h, bgr=bgr, backend="mss")
        except Exception:
            return None

    def _grab_pil(self, left: int, top: int, width: int, height: int, rel_ts: float) -> CapturedFrame | None:
        if not self._pil_available:
            return None
        try:
            import numpy as np  # type: ignore
            from PIL import ImageGrab  # type: ignore

            bbox = (int(left), int(top), int(left + width), int(top + height))
            img = ImageGrab.grab(bbox=bbox, all_screens=True)
            rgb = np.array(img, dtype=np.uint8)
            bgr = rgb[:, :, ::-1].copy()
            h, w = bgr.shape[:2]
            if w < 16 or h < 16:
                return None
            return CapturedFrame(timestamp=rel_ts, width=w, height=h, bgr=bgr, backend="pil")
        except Exception:
            return None

    def grab_region(self, left: int, top: int, width: int, height: int, rel_ts: float = 0.0) -> CapturedFrame | None:
        if width <= 0 or height <= 0:
            return None

        if self.preferred_backend in {"auto", "dxcam"}:
            f = self._grab_dxcam(left, top, width, height, rel_ts)
            if f is not None:
                return f
        if self.preferred_backend in {"auto", "mss"} or (self.preferred_backend == "dxcam" and self._mss_ctx is not None):
            f = self._grab_mss(left, top, width, height, rel_ts)
            if f is not None:
                return f
        if self.preferred_backend in {"auto", "pil"}:
            return self._grab_pil(left, top, width, height, rel_ts)
        return None

    def close(self) -> None:
        for cam in self._dxcam_cameras.values():
            try:
                cam.release()
            except Exception:
                pass
        self._dxcam_cameras.clear()
        if self._mss_ctx is not None:
            try:
                self._mss_ctx.close()
            except Exception:
                pass
            self._mss_ctx = None


class ReplayFrameSource:
    """Offline frame reader for recorded gameplay videos (.mp4/.mkv/.avi) or screenshot folders."""

    IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
    VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}

    def __init__(self, input_path: str | Path, sample_fps: float = 2.0) -> None:
        self.input_path = Path(input_path)
        self.sample_fps = max(0.2, float(sample_fps))

    def iter_frames(self) -> Iterator[CapturedFrame]:
        if not self.input_path.exists():
            raise FileNotFoundError(f"Replay input not found: {self.input_path}")

        if self.input_path.is_dir():
            yield from self._iter_image_dir(self.input_path)
        elif self.input_path.suffix.lower() in self.IMAGE_EXTS:
            frame = self._load_image(self.input_path, 0.0)
            if frame is not None:
                yield frame
        elif self.input_path.suffix.lower() in self.VIDEO_EXTS:
            yield from self._iter_video(self.input_path)
        else:
            raise ValueError(f"Unsupported replay input type: {self.input_path}")

    def _load_image(self, img_path: Path, rel_ts: float) -> CapturedFrame | None:
        try:
            import cv2  # type: ignore
            import numpy as np  # type: ignore

            # Support Unicode Windows paths cleanly via fromfile + imdecode
            data = np.fromfile(str(img_path), dtype=np.uint8)
            bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
            if bgr is None:
                return None
            h, w = bgr.shape[:2]
            return CapturedFrame(
                timestamp=rel_ts,
                width=w,
                height=h,
                bgr=bgr,
                backend="replay-image",
                source_label=img_path.name,
            )
        except ImportError:
            from PIL import Image  # type: ignore
            import numpy as np  # type: ignore

            with Image.open(img_path) as im:
                rgb = np.array(im.convert("RGB"), dtype=np.uint8)
            bgr = rgb[:, :, ::-1].copy()
            h, w = bgr.shape[:2]
            return CapturedFrame(
                timestamp=rel_ts,
                width=w,
                height=h,
                bgr=bgr,
                backend="replay-image-pil",
                source_label=img_path.name,
            )

    def _iter_image_dir(self, folder: Path) -> Iterator[CapturedFrame]:
        files = sorted(
            [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in self.IMAGE_EXTS],
            key=lambda p: p.name.lower(),
        )
        interval = 1.0 / self.sample_fps
        for idx, img_path in enumerate(files):
            frame = self._load_image(img_path, idx * interval)
            if frame is not None:
                yield frame

    def _iter_video(self, video_path: Path) -> Iterator[CapturedFrame]:
        import cv2  # type: ignore

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Unable to open video file: {video_path}")
        try:
            native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            step = max(1, int(round(native_fps / self.sample_fps)))
            frame_idx = 0
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                if frame_idx % step == 0:
                    rel_ts = frame_idx / native_fps
                    h, w = frame.shape[:2]
                    yield CapturedFrame(
                        timestamp=rel_ts,
                        width=w,
                        height=h,
                        bgr=frame,
                        backend="replay-video",
                        source_label=f"{video_path.name}#f{frame_idx}",
                    )
                frame_idx += 1
        finally:
            cap.release()


def save_frame_png(frame_bgr: Any, out_path: Path) -> bool:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        import cv2  # type: ignore

        ok, buf = cv2.imencode(".png", frame_bgr)
        if ok:
            buf.tofile(str(out_path))
            return True
    except Exception:
        pass
    try:
        from PIL import Image  # type: ignore

        rgb = frame_bgr[:, :, ::-1]
        Image.fromarray(rgb).save(out_path)
        return True
    except Exception:
        return False


def monotonic_now() -> float:
    return time.monotonic()
