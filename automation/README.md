# qa-observer — 四款线上游戏非侵入式黑盒自动化巡检工具（原神 v1.0 已实现）

> **严格合规与反作弊声明**：本工具 100% 运行在游戏进程外部，仅使用桌面合成层视觉采集（DXGI / MSS）、Win32 只读窗口元数据、Intel PresentMon ETW 帧时间观测、psutil 进程状态与受控公共界面巡检。**严禁**任何内存读写、DLL 注入、Hook、封包篡改或自动战斗/刷资源逻辑。

## 一、四款游戏实现状态

| 游戏             | 适配器键名   | 当前状态                        | 说明                                                                                                 |
| ---------------- | ------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **原神**   | `genshin`  | **已实现（v1.0 可运行）** | 支持 `doctor` / `observe` / `active-ui` / `replay` / `capture-template` 与完整 CI 入库闭环 |
| 崩坏：星穹铁道   | `starrail` | 架构已预留                      | 复用核心视觉/OCR/PresentMon/CI 引擎，待补充多语言与弱网适配器                                        |
| 绝区零           | `zzz`      | 架构已预留                      | 复用核心引擎，待补充多分辨率裁切与 ESC 倒计时适配器                                                  |
| 明日方舟：终末地 | `endfield` | 架构已预留                      | 复用核心引擎，待补充启动闪退与地图底图适配器                                                         |

---

## 二、快速安装（推荐 `uv` + Python 3.10–3.13）

```powershell
cd automation

# 1. 基础安装（OpenCV + NumPy + MSS + psutil + PyYAML + Pillow）
uv sync --python 3.13

# 2. 推荐：启用 Windows DXGI 高速截屏 + RapidOCR 文本溢出/未翻译 Key 检测
uv sync --python 3.13 --extra all

# 3. 环境自检（检查依赖、管理员权限、PresentMon、实时原神窗口）
uv run qa-observer genshin doctor
```

> **关于 PresentMon（可选，强烈推荐）**：如需采集真实 `Avg FPS / 1% Low FPS / P99 FrameTime / >50ms 毛刺`，请下载 Intel [PresentMon](https://github.com/GameTechDev/PresentMon/releases) 放到 `automation/tools/PresentMon.exe`（或通过 `--presentmon` 指定路径），并以**管理员权限**打开终端运行。未挂载 PresentMon 时，FPS 字段会如实记录为 `null`，**绝不编造虚假数据**。

---

## 三、原神实操命令

### 1. 100% 零输入纯被动观测（默认推荐，绝对安全）

运行后正常游玩、传送、切背包或热切换键鼠/手柄，工具在进程外自动观测并生成真实报告：

```powershell
# 实时观测 120 秒，并将真实结果直接合并到本地看板数据文件
uv run qa-observer genshin observe --duration 120 --save-store ../web/data/automation-runs.json

# 从启动前开始监听冷启动耗时 + 自动从 config.ini 读取真实版本号
uv run qa-observer genshin observe --wait-launch --duration 90 --game-dir "D:\Genshin Impact"
```

### 2. 离线回放真实录屏 / 截图目录（可配合 PresentMon CSV）

支持把 OBS / Xbox Game Bar 录制的真实原神视频（`.mp4`/`.mkv`）或截图文件夹送入同一套视觉 + OCR + 传送耗时 + PresentMon 引擎分析：

```powershell
uv run qa-observer genshin replay `
  --input "D:\Captures\genshin_teleport_test.mp4" `
  --presentmon-csv "D:\Captures\presentmon.csv" `
  --version "7.2" `
  --save-store ../web/data/automation-runs.json
```

### 3. 安全区公共界面遍历巡检（可选，按 `F12` 随时紧急中止）

仅在主城安全区静止时使用，通过标准系统热键依次打开 `ESC(派蒙菜单) -> B(背包) -> C(角色) -> F1(冒险之证) -> M(大地图)` 做视觉/OCR/响应性巡检：

```powershell
uv run qa-observer genshin active-ui --confirm-safe-zone --game-dir "D:\Genshin Impact"
```

### 4. 采集真实键鼠 / 手柄提示图标模板

```powershell
uv run qa-observer genshin capture-template --name kbm_prompt --roi bottom_prompts
uv run qa-observer genshin capture-template --name pad_prompt --roi bottom_prompts
```

---

## 四、CI 自动接入与网站实时刷新（三种通道）

所有网站展示数据统一存放在 `web/data/automation-runs.json`（Schema v2，`policy: "real-data-only"`），CI 门禁会自动拒绝任何 `mock/demo/fake` 编造载荷。

### 通道 A：CLI 一键触发 GitHub Actions `repository_dispatch`（推荐）

```powershell
# 设置具备目标仓库 Contents: Write 权限的 Fine-grained PAT
$env:GITHUB_TOKEN = "github_pat_xxx"

# 方式 1：观测结束直接推送至 CI 自动入库并触发 GitHub Pages 重新部署
uv run qa-observer genshin observe --duration 120 --ci-push

# 方式 2：将已生成的真实报告推送至 CI
uv run qa-observer ci push --report reports/runs/RUN-YS-xxx/report.json --repo supercoko/Game_QA_Experience_Web
```

### 通道 B：Inbox 目录 Git Push 自动入库

```powershell
uv run qa-observer genshin observe --duration 120 --save-inbox
git add automation/reports/inbox/ && git commit -m "ci: add real genshin run" && git push
```

推送后 `.github/workflows/ingest-automation-run.yml` 自动校验 Schema v2、写入 CI 溯源信息、合并入 `web/data/automation-runs.json`、清理 inbox 并触发 `.github/workflows/deploy-pages.yml` 重新部署网站。

### 通道 C：Jenkins Windows 执行机流水线

仓库已内置 [automation/ci/Jenkinsfile](ci/Jenkinsfile)，可在公司/本地 Windows GPU 执行机上定时或手工触发原神巡检，并将结果自动推送至 GitHub CI + 飞书群通知。
