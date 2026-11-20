"""Non-invasive screen capture backends (DXGI dxcam -> MSS -> PIL) and offline replay source."""

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


class FrameCapturer:
    """Captures the game window's client rectangle purely from desktop compositor output."""

    def __init__(self, preferred_backend: str = "auto") -> None:
        self.preferred_backend = preferred_backend.lower()
        self.backend_name: str = "unavailable"
        self._dxcam_camera: Any = None
        self._mss_ctx: Any = None
        self._init_backend()

    def _init_backend(self) -> None:
        order = (
            ["dxcam", "mss", "pil"]
            if self.preferred_backend == "auto"
            else [self.preferred_backend]
        )
        for name in order:
            if name == "dxcam":
                try:
                    import dxcam  # type: ignore

                    cam = dxcam.create(output_color="BGR")
                    if cam is not None:
                        self._dxcam_camera = cam
                        self.backend_name = "dxcam"
                        return
                except Exception:
                    continue
            elif name == "mss":
                try:
                    import mss  # type: ignore

                    self._mss_ctx = mss.mss()
                    self.backend_name = "mss"
                    return
                except Exception:
                    continue
            elif name == "pil":
                try:
                    from PIL import ImageGrab  # type: ignore  # noqa: F401

                    self.backend_name = "pil"
                    return
                except Exception:
                    continue

    def grab_region(self, left: int, top: int, width: int, height: int, rel_ts: float = 0.0) -> CapturedFrame | None:
        if width <= 0 or height <= 0:
            return None

        if self.backend_name == "dxcam" and self._dxcam_camera is not None:
            region = (max(0, left), max(0, top), max(1, left + width), max(1, top + height))
            frame = self._dxcam_camera.grab(region=region)
            if frame is None:
                return None
            h, w = frame.shape[:2]
            return CapturedFrame(timestamp=rel_ts, width=w, height=h, bgr=frame, backend="dxcam")

        if self.backend_name == "mss" and self._mss_ctx is not None:
            import numpy as np  # type: ignore

            monitor = {"left": int(left), "top": int(top), "width": int(width), "height": int(height)}
            raw = self._mss_ctx.grab(monitor)
            arr = np.array(raw, dtype=np.uint8)
            bgr = arr[:, :, :3].copy()
            h, w = bgr.shape[:2]
            return CapturedFrame(timestamp=rel_ts, width=w, height=h, bgr=bgr, backend="mss")

        if self.backend_name == "pil":
            import numpy as np  # type: ignore
            from PIL import ImageGrab  # type: ignore

            bbox = (int(left), int(top), int(left + width), int(top + height))
            img = ImageGrab.grab(bbox=bbox)
            rgb = np.array(img, dtype=np.uint8)
            bgr = rgb[:, :, ::-1].copy()
            h, w = bgr.shape[:2]
            return CapturedFrame(timestamp=rel_ts, width=w, height=h, bgr=bgr, backend="pil")

        return None

    def close(self) -> None:
        if self._dxcam_camera is not None:
            try:
                self._dxcam_camera.release()
            except Exception:
                pass
            self._dxcam_camera = None
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
