window.DATA_HUB = {
  // 默认离线回退数据（与 web/data/automation-runs.json 结构 100% 一致；托管到 GitHub Pages 后优先 fetch 最新 JSON）
  defaultAutomationData: {
    updatedAt: "2026-11-20 16:50",
    note: "当前展示为标准 Schema 演示数据集（模拟四款线上客户端的非侵入式黑盒巡检结果）。后续本地 Python Runner 运行后，直接覆盖 web/data/automation-runs.json 并 git push，或点击页面“导入本地 JSON”即可实时刷新！",
    runs: [
      {
        id: "RUN-20261120-01",
        date: "2026-11-20",
        game: "明日方舟：终末地",
        version: "丹青渡 (2026.10)",
        suite: "冷启动 + 地图缩放 + 手柄热切视觉巡检",
        mode: "非侵入黑盒 (DXGI+OCR+PresentMon)",
        status: "WARN",
        passRate: 91.7,
        totalCases: 12,
        passedCases: 11,
        failedCases: 1,
        coldStartSec: 18.4,
        avgFps: 59.6,
        low1Fps: 47.2,
        memMb: 4210,
        findings: [
          { caseId: "NI-ZMD-04", severity: "P1", rule: "OCR_TIMER_MISSING", msg: "玩法倒计时界面执行键鼠->手柄热切换后，OCR 倒计时区域消失 1.8s（疑似 UI 重建）" }
        ]
      },
      {
        id: "RUN-20261119-02",
        date: "2026-11-19",
        game: "绝区零",
        version: "3.3 重返天空的旅程",
        suite: "多分辨率 UI 裁切 + PresentMon 帧率基线",
        mode: "非侵入黑盒 (DXGI+CV+PresentMon)",
        status: "PASS",
        passRate: 100.0,
        totalCases: 15,
        passedCases: 15,
        failedCases: 0,
        coldStartSec: 14.2,
        avgFps: 118.4,
        low1Fps: 88.5,
        memMb: 3890,
        findings: []
      },
      {
        id: "RUN-20261118-03",
        date: "2026-11-18",
        game: "崩坏：星穹铁道",
        version: "4.7 此刻将群星付之一笑",
        suite: "多界面遍历 OCR + Clumsy 弱网重连校验",
        mode: "非侵入黑盒 (OCR+VLM+Clumsy)",
        status: "FAIL",
        passRate: 87.5,
        totalCases: 16,
        passedCases: 14,
        failedCases: 2,
        coldStartSec: 15.8,
        avgFps: 60.0,
        low1Fps: 52.1,
        memMb: 3640,
        findings: [
          { caseId: "NI-SR-09", severity: "P2", rule: "L10N_TEXT_OVERFLOW", msg: "英文语言下活动弹窗右下角按钮文本超出边框（OCR 边界与按钮框重叠）" },
          { caseId: "NI-SR-14", severity: "P1", rule: "RECONNECT_UI_STUCK", msg: "Clumsy 断网 12s 恢复后，重连提示遮罩残留超过 8s 未自动消散" }
        ]
      },
      {
        id: "RUN-20261117-04",
        date: "2026-11-17",
        game: "原神",
        version: "7.2 坏灭肇始之时",
        suite: "大世界传送加载耗时 + 键鼠/手柄图标模板匹配",
        mode: "非侵入黑盒 (DXGI+OpenCV+PresentMon)",
        status: "PASS",
        passRate: 100.0,
        totalCases: 14,
        passedCases: 14,
        failedCases: 0,
        coldStartSec: 16.9,
        avgFps: 59.8,
        low1Fps: 49.4,
        memMb: 4580,
        findings: []
      },
      {
        id: "RUN-20261115-05",
        date: "2026-11-15",
        game: "绝区零",
        version: "3.2 她与她的隐秘往事",
        suite: "ESC 暂停计时器 OCR + 动态壁纸 VLM 巡检",
        mode: "非侵入黑盒 (OCR+VLM)",
        status: "WARN",
        passRate: 93.3,
        totalCases: 15,
        passedCases: 14,
        failedCases: 1,
        coldStartSec: 14.6,
        avgFps: 116.2,
        low1Fps: 84.0,
        memMb: 3920,
        findings: [
          { caseId: "NI-ZZZ-11", severity: "P2", rule: "VLM_VISUAL_CLIP", msg: "VLM 巡检标记：特定分辨率下拍照预览框底部 UID 区域发生边缘裁切" }
        ]
      },
      {
        id: "RUN-20261112-06",
        date: "2026-11-12",
        game: "原神",
        version: "7.1 往冥府的安魂歌",
        suite: "背包/角色/拍照 UI 视觉巡检 + 帧时间毛刺",
        mode: "非侵入黑盒 (DXGI+CV+PresentMon)",
        status: "PASS",
        passRate: 92.9,
        totalCases: 14,
        passedCases: 13,
        failedCases: 1,
        coldStartSec: 17.5,
        avgFps: 59.5,
        low1Fps: 45.8,
        memMb: 4620,
        findings: [
          { caseId: "NI-YS-07", severity: "P2", rule: "FRAMETIME_SPIKE", msg: "首次打开复杂 UI 界面触发 118ms 单帧毛刺（疑似同步加载/PSO编译）" }
        ]
      }
    ]
  },

  initialBugs: [
    {
      id: "BUG-1001",
      createdAt: "2026-11-20 14:20",
      game: "明日方舟：终末地",
      module: "手柄热切换 / UI",
      severity: "P1",
      status: "待确认",
      runId: "RUN-20261120-01",
      title: "玩法倒计时期间键鼠热切换手柄，倒计时文本短暂消失",
      steps: "1. PC 端进入倒计时挑战玩法；\n2. 倒计时进行中拨动 Xbox/PS5 手柄摇杆触发输入热切换；\n3. 观察顶部倒计时 UI。",
      expected: "输入图标平滑切换为手柄键位，倒计时数值持续连续显示。",
      actual: "热切换瞬间倒计时控件被清空隐藏约 1.8 秒（OCR 校验告警）。"
    },
    {
      id: "BUG-1002",
      createdAt: "2026-11-18 19:05",
      game: "崩坏：星穹铁道",
      module: "弱网重连 / 遮罩",
      severity: "P1",
      status: "修复中",
      runId: "RUN-20261118-03",
      title: "断网 12s 后网络恢复，重连遮罩残留导致无法点击主界面",
      steps: "1. Clumsy 模拟断网 12s 触发重连提示；\n2. 恢复网络等待重连成功；\n3. 尝试点击主界面功能入口。",
      expected: "重连成功后 2s 内遮罩消失，界面恢复响应。",
      actual: "重连提示遮罩持续残留超过 8s，非侵入巡检触发超时失败。"
    },
    {
      id: "BUG-1003",
      createdAt: "2026-11-15 11:30",
      game: "绝区零",
      module: "多分辨率 / 相机",
      severity: "P2",
      status: "已回归关闭",
      runId: "RUN-20261115-05",
      title: "21:9 分辨率下拍照选择特定画框时 UID 边缘被裁切",
      steps: "1. 切换 2560x1080 分辨率；\n2. 进入相机选择边缘装饰画框并预览成片。",
      expected: "UID 完整显示在安全区内无裁切。",
      actual: "UID 右下角被画框遮挡，VLM 视觉巡检检出异常。"
    }
  ],

  jsonSchemaDoc: `{
  "updatedAt": "2026-11-20 16:50",
  "runs": [
    {
      "id": "RUN-20261120-01",
      "date": "2026-11-20",
      "game": "明日方舟：终末地",
      "version": "丹青渡 (2026.10)",
      "suite": "冷启动 + 地图缩放 + 手柄热切视觉巡检",
      "mode": "非侵入黑盒 (DXGI+OCR+PresentMon)",
      "status": "PASS | WARN | FAIL",
      "passRate": 91.7,
      "totalCases": 12,
      "passedCases": 11,
      "failedCases": 1,
      "coldStartSec": 18.4,
      "avgFps": 59.6,
      "low1Fps": 47.2,
      "memMb": 4210,
      "findings": [
        { "caseId": "NI-ZMD-04", "severity": "P1", "rule": "OCR_TIMER_MISSING", "msg": "具体异常描述" }
      ]
    }
  ]
}`,

  githubDeploySteps: [
    {
      step: "Step 1 · 已自动生成工作流与免构建标记",
      detail: "已在本仓库创建 `.github/workflows/deploy-pages.yml` 与 `web/.nojekyll`。本网站为 100% 静态零构建架构（纯 HTML/CSS/JS + SVG），无需 Node/Webpack 打包即可秒级部署。"
    },
    {
      step: "Step 2 · 推送代码到 GitHub 仓库",
      detail: "在 GitHub 新建仓库（建议设为 Public 免费开启 GitHub Pages，注意先评估是否脱敏简历中的个人敏感信息），本地执行：\n`git add . && git commit -m \"feat: add QA portfolio & automation dashboard\"`\n`git remote add origin https://github.com/<你的用户名>/<仓库名>.git`\n`git push -u origin main`"
    },
    {
      step: "Step 3 · 在 GitHub 仓库开启 Pages（GitHub Actions 源）",
      detail: "打开 GitHub 仓库 -> Settings -> Pages -> Build and deployment -> Source 选择 **GitHub Actions**。保存后每次 push 修改 `web/` 目录，Action 会在 ~30 秒内自动发布至 `https://<你的用户名>.github.io/<仓库名>/`。"
    },
    {
      step: "Step 4 · 零后端串联“自动化数据”与“Bug 反馈”",
      detail: "• 自动化数据持续更新：本地 Python 非侵入脚本跑完后更新 `web/data/automation-runs.json`，执行 `git push` 即自动刷新线上看板（也支持在网页端直接拖拽/导入本地 JSON 预览）。\n• Bug 反馈真实落库：在本页填写你的 `owner/repo` 后，点击“提交至 GitHub Issue”自动带上结构化模板和标签落库到仓库 Issues，且支持一键拉取仓库真实 Issues 展示！"
    }
  ]
};
