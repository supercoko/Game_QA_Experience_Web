# 原神键鼠 / 手柄视觉模板目录

本目录用于存放非侵入模板匹配使用的真实截图小图（PNG），帮助 `YS-INPUT-01`（键鼠 ↔ 手柄热切换验收）与关键弹窗识别提升精度。

## 命名规范

- 键鼠提示图标：`kbm_*.png`（例如 `kbm_esc.png`、`kbm_bag_b.png`、`kbm_map_m.png`）
- 手柄提示图标：`pad_*.png`（例如 `pad_xbox_b.png`、`pad_xbox_lb.png`、`pad_ps_circle.png`）
- 弹窗/加载参考图标：`popup_*.png`、`loading_*.png`

## 一键采集真实模板

当游戏处于前台且显示对应图标时，执行：

```bash
qa-observer genshin capture-template --name kbm_bottom_prompt --roi bottom_prompts
qa-observer genshin capture-template --name pad_bottom_prompt --roi bottom_prompts
```

未采集模板时，`YS-INPUT-01` 会自动使用 OCR 按键提示词（`Esc`/`Tab`/`F1` vs `LB`/`RB`/`LT`/`RT`）与区域画面变化进行判定，并在报告中如实标注模板库状态。
