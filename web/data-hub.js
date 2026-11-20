window.DATA_HUB = {
  defaultRepo: "supercoko/Game_QA_Experience_Web",

  // Supabase 云端同步默认配置（可在此处填入 Project URL 与 anon public key 实现 GitHub Pages 全员默认连接，
  // 也可直接在网页右上角「账户 -> 云端同步 (Supabase)」弹窗中在线配置并保存）
  supabase: {
    url: "",
    anonKey: ""
  },

  // 严格真实数据原则：默认空数据集，不预置任何编造或模拟的巡检数据。
  // 托管至 GitHub Pages 或本地 HTTP 打开后，自动 fetch ./data/automation-runs.json 获取 CI 入库的真实记录。
  defaultAutomationData: {
    schemaVersion: "2.0",
    updatedAt: null,
    repository: "supercoko/Game_QA_Experience_Web",
    policy: "real-data-only",
    note: "仅收录由非侵入自动化工具实际执行或 CI 流水线校验入库的真实巡检数据；不预置任何编造或模拟记录。",
    ci: {
      pipeline: "github-actions",
      ingestWorkflow: ".github/workflows/ingest-automation-run.yml",
      qualityGateWorkflow: ".github/workflows/ci-quality-gate.yml",
      deployWorkflow: ".github/workflows/deploy-pages.yml",
      lastIngestAt: null,
      lastRunId: null,
      lastJobUrl: null,
      lastCommitSha: null,
      totalIngestedRuns: 0
    },
    runs: []
  },

  // 不预置任何编造缺陷记录；真实 Bug 可手工录入、由自动化真实 Finding 一键转入，或同步 GitHub Issues。
  initialBugs: [],

  ciChannels: [
    {
      name: "通道 1 · GitHub repository_dispatch（CLI / 网页在线上报）",
      workflow: ".github/workflows/ingest-automation-run.yml",
      trigger: "POST /repos/{owner}/{repo}/dispatches (event_type: automation-run-report)",
      detail: "本地运行 `qa-observer genshin observe --ci-push` 或 `qa-observer ci push --report report.json` 后，自动触发 GitHub Actions 校验 Schema v2、拒绝编造来源、幂等 Upsert 写入 `web/data/automation-runs.json`，并自动联动 `deploy-pages.yml` 发布最新看板。"
    },
    {
      name: "通道 2 · Inbox 目录 Git Push 自动归档入库",
      workflow: ".github/workflows/ingest-automation-run.yml",
      trigger: "push paths: automation/reports/inbox/*.json",
      detail: "本地执行 `--save-inbox` 将单轮真实 `report.json` 放入 `automation/reports/inbox/` 后 `git push`，CI 自动校验合并、打上真实 Commit/Job 溯源戳、清理 inbox 并触发 Pages 重新部署。"
    },
    {
      name: "通道 3 · Jenkins Windows GPU 执行机流水线",
      workflow: "automation/ci/Jenkinsfile",
      trigger: "Jenkins Declarative Pipeline (windows-gpu-qa)",
      detail: "复刻个人简历中的 Windows 执行机工程链路：Jenkins 调度 `qa-observer genshin` 跑完巡检后归档证据截图，自动通过 `ci push` 同步到 GitHub CI 看板，并可选推送飞书群告警卡片。"
    },
    {
      name: "门禁 · CI Quality Gate & 反编造校验",
      workflow: ".github/workflows/ci-quality-gate.yml",
      trigger: "push / pull_request (automation/**, web/**)",
      detail: "每次提交自动运行 `qa_observer` 单元测试（视觉异常/PresentMon 解析/原神套件/CI 入库脚本）与 `ci_ingest.py validate`，强制校验 `policy == real-data-only` 与 Schema v2 合规性。"
    }
  ],

  jsonSchemaDoc: `{
  "schemaVersion": "2.0",
  "updatedAt": "2026-11-20T18:30:00Z",
  "repository": "supercoko/Game_QA_Experience_Web",
  "policy": "real-data-only",
  "ci": {
    "pipeline": "github-actions",
    "ingestWorkflow": ".github/workflows/ingest-automation-run.yml",
    "qualityGateWorkflow": ".github/workflows/ci-quality-gate.yml",
    "deployWorkflow": ".github/workflows/deploy-pages.yml",
    "lastIngestAt": "2026-11-20T18:31:05Z",
    "lastRunId": "RUN-YS-20261120-183000-a1b2",
    "lastJobUrl": "https://github.com/supercoko/Game_QA_Experience_Web/actions/runs/<id>",
    "totalIngestedRuns": 1
  },
  "runs": [
    {
      "id": "RUN-YS-20261120-183000-a1b2",
      "schemaVersion": "2.0",
      "dataOrigin": "real_capture | real_replay",
      "timestamp": "2026-11-20T18:30:00+08:00",
      "date": "2026-11-20",
      "game": "原神",
      "gameKey": "genshin",
      "version": "<从 config.ini 读取的真实版本号或 unknown>",
      "suite": "genshin-non-intrusive-observe",
      "mode": "observe | active-ui | replay",
      "status": "PASS | WARN | FAIL",
      "passRate": 100.0,
      "totalCases": 6,
      "passedCases": 6,
      "warnedCases": 0,
      "failedCases": 0,
      "skippedCases": 0,
      "durationSec": 120.4,
      "metrics": {
        "coldStartSec": null,
        "avgFps": null,
        "low1Fps": null,
        "p99FrameTimeMs": null,
        "hitchCount50ms": null,
        "hitchCount100ms": null,
        "memMbAvg": null,
        "memMbPeak": null,
        "framesAnalyzed": 240,
        "teleportLoadsSec": []
      },
      "ci": {
        "provider": "github-actions | jenkins | local-cli",
        "triggeredBy": "repository_dispatch | workflow_dispatch | push-inbox | manual",
        "workflow": "Ingest Automation Run Data",
        "jobRunId": "<real-run-id>",
        "jobRunNumber": 1,
        "jobUrl": "https://github.com/<owner>/<repo>/actions/runs/<id>",
        "commitSha": "<sha>",
        "branch": "main",
        "runner": "WIN-HOST -> ubuntu-latest",
        "ingestedAt": "2026-11-20T18:31:05Z"
      },
      "cases": [
        { "caseId": "YS-PROC-01", "name": "进程存活、冷启动与 CrashDump 监控", "status": "PASS", "durationSec": 120.4, "detail": "..." }
      ],
      "findings": []
    }
  ]
}`,

  githubDeploySteps: [
    {
      step: "Step 1 · 已内置 3 条 GitHub Actions 流水线与质量门禁",
      detail: "• `.github/workflows/ingest-automation-run.yml`：接收真实巡检报告（repository_dispatch / workflow_dispatch / inbox push），校验 Schema v2 与反编造策略后幂等写入 `web/data/automation-runs.json`。\n• `.github/workflows/deploy-pages.yml`：支持独立触发与 `workflow_call` 复用，发布前强制校验数据合规性，秒级更新 GitHub Pages。\n• `.github/workflows/ci-quality-gate.yml`：每次 Push / PR 自动运行 Python 单元测试与 JSON Schema 门禁。"
    },
    {
      step: "Step 2 · 本地安装并运行原神非侵入观测工具",
      detail: "进入 `automation/` 目录安装依赖：\n`cd automation && uv sync --python 3.13 --extra all`\n先体检环境：`uv run qa-observer genshin doctor`\n执行 100% 零输入真实观测：`uv run qa-observer genshin observe --duration 120 --save-store ../web/data/automation-runs.json`"
    },
    {
      step: "Step 3 · 打通 GitHub CI 自动入库与 Pages 联动",
      detail: "1. 在 GitHub 仓库 Settings -> Pages -> Source 选择 **GitHub Actions**；\n2. 生成具备当前仓库 `Contents: Write` 权限的 Fine-grained PAT 并设为本地或 Jenkins 环境变量 `GITHUB_TOKEN`；\n3. 运行 `uv run qa-observer genshin observe --duration 120 --ci-push`，CI 自动验签入库、打上 Job 链接并重新部署 Pages！"
    },
    {
      step: "Step 4 · 零后端串联“真实 CI 数据”与“GitHub Issues 缺陷闭环”",
      detail: "• 网站展示的所有巡检指标均来源于真实采集或真实录屏回放，未挂载 PresentMon/OCR 的指标如实标注“未采集”，绝不编造数字；\n• 检出的真实 Finding 支持一键转入本页缺陷表单，填写 `supercoko/Game_QA_Experience_Web` 即可直接生成结构化 GitHub Issue 并实时拉取状态。"
    }
  ]
};
