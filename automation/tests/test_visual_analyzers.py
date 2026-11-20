import importlib.util
import unittest

from qa_observer.analyzers.visual import analyze_frame_visual
from qa_observer.config import default_game_config_path, load_config

HAS_NUMPY = importlib.util.find_spec("numpy") is not None


@unittest.skipUnless(HAS_NUMPY, "numpy not installed in minimal stdlib environment")
class TestVisualAnalyzers(unittest.TestCase):
    def setUp(self) -> None:
        self.thresholds = load_config(default_game_config_path("genshin"))["thresholds"]

    def test_detect_black_screen(self) -> None:
        import numpy as np

        black = np.zeros((180, 320, 3), dtype=np.uint8)
        m = analyze_frame_visual(black, None, self.thresholds)
        self.assertTrue(m.is_black_screen)
        self.assertFalse(m.is_white_loading)
        self.assertFalse(m.is_magenta_anomaly)

    def test_detect_white_teleport_loading(self) -> None:
        import numpy as np

        white = np.full((180, 320, 3), 245, dtype=np.uint8)
        m = analyze_frame_visual(white, None, self.thresholds)
        self.assertTrue(m.is_white_loading)
        self.assertFalse(m.is_black_screen)

    def test_detect_magenta_missing_shader(self) -> None:
        import numpy as np

        frame = np.full((180, 320, 3), 100, dtype=np.uint8)
        # BGR vivid magenta (B=255, G=0, R=255) over 25% of screen
        frame[:90, :160] = (255, 0, 255)
        m = analyze_frame_visual(frame, None, self.thresholds)
        self.assertTrue(m.is_magenta_anomaly)
        self.assertGreater(m.magenta_ratio, 0.2)

    def test_detect_frozen_vs_moving_frames(self) -> None:
        import numpy as np

        rng = np.random.default_rng(42)
        f1 = rng.integers(30, 210, size=(180, 320, 3), dtype=np.uint8)
        f2 = f1.copy()
        f3 = rng.integers(30, 210, size=(180, 320, 3), dtype=np.uint8)

        m_same = analyze_frame_visual(f2, f1, self.thresholds)
        self.assertTrue(m_same.is_frozen_pair)
        self.assertEqual(m_same.mad_from_prev, 0.0)

        m_diff = analyze_frame_visual(f3, f1, self.thresholds)
        self.assertFalse(m_diff.is_frozen_pair)
        self.assertGreater(m_diff.mad_from_prev or 0.0, 20.0)


if __name__ == "__main__":
    unittest.main()
