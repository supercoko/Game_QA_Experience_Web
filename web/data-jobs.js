window.DATA_JOBS = {
  profileSummary: {
    years: "3.5 年（2023.05 - 2026.10）",
    positioning: "UE 质量工具链 / 全栈测试平台开发（Vue3+TS+Flask+MongoDB）+ 复杂系统白盒定位 复合型游戏 QA/测开",
    radar: [
      { label: "UE工具链与CI/CD", value: 93 },
      { label: "全栈质量平台(Vue3/Flask)", value: 86 },
      { label: "静态与配置左移检查", value: 91 },
      { label: "业务系统与白盒定位", value: 86 },
      { label: "自动化测试落地", value: 81 },
      { label: "线上运维与性能专项", value: 54 }
    ],
    strengths: [
      "独立全栈质量平台搭建：基于开源 Web 框架，采用 Vue 3 + TypeScript + Python + Flask + MongoDB 整合 Checklist、自动化结果、配置 Diff 与问题反馈，配套提交工具单据关联/状态检查/任务提醒，并用 AI 辅助代码重构与平台接入",
      "端到端配置变更闭环：Perforce change-commit -> Jenkins 串行排队 -> UGS -> UE 蓝图导出 -> MongoDB -> Python DeepDiff -> Web 展示 -> 飞书多维表精准推送 + 失败告警恢复",
      "静态检查与分层自动化：FlowGraph XML->JSON 静态规则校验；UE Functional Test 战斗冒烟接入 Jenkins；Poco/Airtest 采集物探索性自动化",
      "白盒/灰盒排查硬实力：读 Lua 揪出背包无限堆叠 -1 边界遗漏；结合服务端日志与代码定位“死亡+升级并发跳过属性同步”根因",
      "成熟大作跨端支援：《无限暖暖》PC/Xbox/PS5 引导与冒烟、《恋与深空》家园单双人交互打断与穿模测试"
    ],
    gaps: [
      "主项目为在研 UE 项目，缺乏从 0 到 1 完整大版本公测上线、热更新应急及长线线上逃逸 Bug 复盘实操（已通过 4,134 条线上公告 + 学习卡片系统补齐）",
      "Web 后端栈偏 Python/Flask/MongoDB，面对 Golang 高并发微服务架构或分布式任务队列（Celery/Redis）深度调优需在面试前巩固",
      "缺乏深度图形渲染/Profiler（RenderDoc/Unreal Insights）性能调优、大规模服务器压测与主机全流程合规提审（TRC/XR/Lotcheck）实操",
      "AI 应用停留在“辅助代码重构与平台接入”，尚缺独立落地 RAG / Agent / VLM 自动化巡检的端到端项目（可用本页非侵入式自动化方案补齐作品集！）"
    ]
  },

  jobs: [
    {
      id: "hg-ue-qa-dev",
      tier: "S",
      score: 96,
      company: "鹰角网络",
      title: "游戏测试开发工程师-（UE项目）",
      direction: "测试开发 / 工具平台",
      expReq: "3年以上游戏测试工具开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/451c36a7-fa80-491c-b5d7-318a890d9c6f",
      hits: [
        "3.5年经验严丝合缝命中“3年以上游戏测试工具开发”",
        "强命中“熟悉UE引擎优先”与“独立主导测试工具/自动化开发”",
        "Vue3+TS+Flask+MongoDB 完整质量平台 + DataTable Diff + FlowGraph 静态检查 + UE Functional Test 全面覆盖岗位职责",
        "Python / Lua / TypeScript 多语言工程栈优势突出"
      ],
      gaps: [
        "需准备自动化框架可扩展性、平台高可用/异步解耦思路与量化 ROI 数据（拦截配置错误数、节省回归人时）"
      ],
      advice: "【第一志愿绝对首选】简历首屏置顶“Vue3+TS+Flask+MongoDB 质量平台架构”与“DataTable Diff / UE Functional Test 流水线”。"
    },
    {
      id: "hg-ue-sys",
      tier: "S",
      score: 91,
      company: "鹰角网络",
      title: "资深游戏测试工程师—系统向（UE项目）",
      direction: "系统测试 + 工具复合",
      expReq: "3-5年游戏测试",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/76976752-dbc1-49b4-8593-b078b2320556",
      hits: [
        "3.5年命中“3-5年”，UE项目+构建跟进（Perforce/UGS/Jenkins）直击优先项",
        "背包/物品/快捷栏/相机全流程系统测试 + 读Lua/查服务端代码定位能力极具说服力",
        "全栈工具平台（Vue3+Flask+MongoDB）+ Diff/静态检查对纯功能测试形成明显降维打击",
        "《恋与深空》家园交互 + 《无限暖暖》多端引导契合“社交/多平台”加分点"
      ],
      gaps: [
        "缺少独立负责线上运营活动、打包提审与带人管理经验，需用四款游戏线上逃逸案例展示线上风控意识"
      ],
      advice: "【业务+工具复合第一首选】平衡展示“复杂系统状态一致性/白盒排查”与“自建全栈工具把质量风险前推”。"
    },
    {
      id: "hg-tool-agent",
      tier: "S",
      score: 90,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师-工具/Agent向",
      direction: "测试开发 / 平台与AI效能",
      expReq: "3年以上测试工具开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/49b56a1e-ce20-4f17-8c29-703922fb7cc2",
      hits: [
        "明确职责为“自动化、性能、压测等工具&平台的产品和开发工作”——Vue3+TS+Flask+MongoDB 全栈平台经验直接拉满匹配度！",
        "优先项命中“熟悉 UE 相关自动化测试开发，有实际项目落地经验”",
        "已有 AI 辅助代码重构与平台接入切入点，结合本页非侵入 CV/VLM 巡检 Demo 极具杀伤力"
      ],
      gaps: [
        "AI Agent（问题分析、用例生成、多模态巡检）与压测平台实战需加深，建议基于本页方案做出可展示的 GitHub 作品集"
      ],
      advice: "【S级高潜冲刺首选】把本页“非侵入式多端视觉巡检 + LLM 变更影响分析”做成 GitHub Pages 在线 Demo 附在简历里！"
    },
    {
      id: "mhy-zzz",
      tier: "A",
      score: 85,
      company: "米哈游",
      title: "游戏测试工程师-绝区零",
      direction: "系统/玩法 + 工具思维",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/947",
      hits: [
        "不硬卡“完整上线”，2年门槛轻松达标",
        "强命中“挖掘测试工具需求、具备工具思维”和“策划数据配置检查”",
        "Vue3+Flask 全栈工具开发 + 背包/相机/状态机打断测试经验与绝区零高度同频"
      ],
      gaps: [
        "项目为 Unity 引擎；绝区零对高帧率动作手感、连携/失衡状态机及迷宫玩法理解要求高"
      ],
      advice: "【米哈游业务+工具首选 #1】强调配置检查/全栈效能工具跨引擎通用，结合绝区零 367 条线上修复案例展现业务敏感度。"
    },
    {
      id: "mhy-yczj-spec",
      tier: "A",
      score: 84,
      company: "米哈游",
      title: "资深游戏测试工程师（专项向）-源初之结",
      direction: "自动化/工具平台专项",
      expReq: "2年以上专项/测开",
      url: "https://jobs.mihoyo.com/#/position/9398",
      hits: [
        "四大方向仅要求“至少一个深入”，候选人完美卡位“自动化 + CI/CD + 质量风险前推（资源/配置检查与卡点）”",
        "优先项“测试工具/平台自研经验”直接被 Vue3+TS+Flask+MongoDB 平台经历精准命中！",
        "AI 辅助实践与 2 年门槛非常友好"
      ],
      gaps: [
        "性能/兼容/压测三大方向需通过本页“学习卡片”补齐基础原理与指标认知"
      ],
      advice: "【米哈游测开/专项首选 #1】重点突出全栈质量平台自研、CI 自动化闭环与配置左移卡点。"
    },
    {
      id: "mhy-byjl-dev",
      tier: "A",
      score: 83,
      company: "米哈游",
      title: "游戏测试开发-崩坏：因缘精灵",
      direction: "全栈效能平台开发（升级推荐！）",
      expReq: "3年以上测开/平台全栈（Vue/React+后端）",
      url: "https://jobs.mihoyo.com/#/position/9576",
      hits: [
        "【更新简历后大幅跃升！】前端明确要求“熟悉 Vue 或 React 任一框架”——Vue 3 + TypeScript 精准命中！",
        "后端要求“熟练掌握至少一门编程语言（Golang 优先）”——Python + Flask + MongoDB 具备完整全栈设计开发落地经历",
        "覆盖“分支管理、资源管理、质量保障痛点 -> 平台化落地与跨团队接入”（单据卡点、Diff、Checklist、反馈闭环）"
      ],
      gaps: [
        "后端非 Golang 且基于开源框架整合，面试会深挖 Flask 异步并发架构、MongoDB 索引设计与前端工程化细节，需提前攻克学习卡片"
      ],
      advice: "【米哈游平台测开黑马岗】若对全栈平台开发有强烈兴趣非常值得投递！重点突出从 0 整合到持续迭代及跨团队推广能力。"
    },
    {
      id: "mhy-sr",
      tier: "A",
      score: 83,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：星穹铁道",
      direction: "综合功能 + 自动化脚本",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/1215",
      hits: [
        "明确要求“编写自动化测试脚本”及“熟悉 Python/Lua、数据库操作（MongoDB）”",
        "全栈 Web 平台 + 白盒查日志代码定位在纯业务 QA 竞争者中优势极大",
        "2年经验门槛友好，无管理年限限制"
      ],
      gaps: [
        "缺少线上支付系统实操，且偏 Unity 技术栈"
      ],
      advice: "【米哈游稳健高匹配】重点讲 Python/Lua + 自动化 + 白盒定位，并用崩铁 1,613 条公告里的重连丢奖励、跨入口越权补足线上视野。"
    },
    {
      id: "mhy-xbgd",
      tier: "A",
      score: 82,
      company: "米哈游",
      title: "游戏测试工程师-星布谷地",
      direction: "系统/社交 + 自动化",
      expReq: "至少3年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5748",
      hits: [
        "3.5年刚好达标3年要求；Python/Lua + 数据库 + 自动化脚本占比要求全面匹配",
        "背包/物品/采集物自动化 + 《恋与深空》家园单双人交互测试与模拟经营社交高度契合"
      ],
      gaps: [
        "缺少支付系统与完整大型项目上线经历"
      ],
      advice: "【米哈游高契合备选】重点放大物品/背包堆叠边界、采集物交互以及双人家园动作打断与状态同步的测试深度。"
    },
    {
      id: "hg-ark-dev",
      tier: "A",
      score: 81,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师（明日方舟）",
      direction: "测开 / Web工具平台（升级推荐！）",
      expReq: "3年以上测开，熟悉Web前后端+引擎",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/baa55cd3-5a36-4678-b69d-a6a0fb508f7a",
      hits: [
        "【更新简历后跃升至 A 级！】明确要求“熟悉常见的 Web 前后端开发框架”+“独立主导测试工具开发”——Vue3+TS+Flask+MongoDB 精准命中！",
        "3年以上工具开发与自动化测试经验完全达标"
      ],
      gaps: [
        "引擎偏好 Unity 且加分压测工具，同等条件下鹰角内部仍优先投 UE 测开与工具/Agent向"
      ],
      advice: "【鹰角测开强力备选】展示全栈工具平台落地能力，同时通过学习卡片补齐基础压测与 Unity 自动化差异认知。"
    },
    {
      id: "mhy-ys",
      tier: "A",
      score: 80,
      company: "米哈游",
      title: "游戏测试工程师-原神",
      direction: "大世界系统 + 配置检查",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/3550",
      hits: [
        "2年门槛达标，强调“策划数据配置检查”、“自动化框架”、“数据库操作”与“深入理解技术实现原理”",
        "背包、相机、采集物自动化与大世界系统测试思路一脉相承"
      ],
      gaps: [
        "Unity 引擎实操较少；原神对跨版本长线回归、多人联机同步和历史债务防回归要求极高"
      ],
      advice: "【米哈游经典核心岗】结合原神 2,022 条线上逃逸案例（断线重连、任务占用互斥、背包上限配置）展现超长线大世界质量保障理解。"
    },
    {
      id: "mhy-byjl-qa",
      tier: "A",
      score: 79,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：因缘精灵",
      direction: "新项目综合测试",
      expReq: "至少1年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5300",
      hits: [
        "新项目早期建设阶段，最需要能搭建配置 Diff、静态检查、Web 效能工具与自动化冒烟的多面手",
        "Python/Lua + MongoDB + 在研项目 0-1 质量体系搭建经验天然匹配"
      ],
      gaps: [
        "职级门槛较低（1年+），需确认定级与薪资预期是否匹配 3.5 年全栈测开/资深测试水平"
      ],
      advice: "【稳健保底/在研红利】可优先投同项目的“游戏测试开发-崩坏：因缘精灵（A级 83%）”。"
    },
    {
      id: "hg-agent-dev",
      tier: "B",
      score: 74,
      company: "鹰角网络",
      title: "测试开发工程师-Agent 方向",
      direction: "后端/AI Agent测开（提升至 B+）",
      expReq: "2年以上，后端+RAG/LangGraph优先",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/c6b9c8f6-a2a2-4d57-83c5-6246dfe474b6",
      hits: [
        "【更新简历后提升！】Python + Flask + MongoDB 服务端系统与工具链对接（需求/代码/缺陷/Diff 数据打通）直接命中基础职责！",
        "已有 AI 辅助代码重构与平台接入经验"
      ],
      gaps: [
        "缺少 RAG、LangChain / LangGraph 与 Agent 评测闭环的深度生产落地经验，竞争者多为纯 AI 工程背景"
      ],
      advice: "建议先攻克本页“AI Agent 测开学习卡片”并做一个轻量级 DataTable Diff + LLM 风险评估 Agent Demo 后再冲击，平时优先投“工具/Agent向”。"
    },
    {
      id: "mhy-yczj-core",
      tier: "B",
      score: 73,
      company: "米哈游",
      title: "资深游戏测试工程师（战斗/关卡/系统/任务）-源初之结",
      direction: "资深模块负责人",
      expReq: "至少3年，需模块负责人/带队优先",
      url: "https://jobs.mihoyo.com/#/position/6430",
      hits: [
        "3.5年达标，系统测试 + 配置检查 + 全栈平台自动化开发加分"
      ],
      gaps: [
        "偏好担任过大型模块测试负责人或有小团队管理经验、且有完整大型项目上线经历"
      ],
      advice: "同等条件下优先投同项目的“专项向（自动化/工具）”，若投此岗需突出平台推进中的跨角色协同与 Owner 意识。"
    },
    {
      id: "hg-zmd-sys",
      tier: "B",
      score: 72,
      company: "鹰角网络",
      title: "资深游戏测试工程师—系统向（明日方舟·终末地）",
      direction: "Unity线上系统向",
      expReq: "3-5年，Unity优先",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/d0cc7bdc-3911-4a3c-9e7e-fae2254d494f",
      hits: [
        "系统复杂度与全栈工具思维匹配，且本页已深度拆解终末地 132 条线上公告缺陷"
      ],
      gaps: [
        "明确偏好 Unity 引擎大型构建跟进及打包/SDK/提审经验；鹰角内部优先投 UE 项目系统向"
      ],
      advice: "作为鹰角 UE 两个 S 级岗之后的备选。"
    },
    {
      id: "hg-ue-level",
      tier: "B",
      score: 64,
      company: "鹰角网络",
      title: "资深游戏测试工程师—关卡向（UE项目）",
      direction: "UE大世界关卡/3C",
      expReq: "3-5年，大世界关卡与3C+带人",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/9cf47933-3edc-4e3e-86ba-56ed30f7d035",
      hits: [
        "UE引擎 + 相机(3C之一) + 采集物/引导测试有交集"
      ],
      gaps: [
        "缺少大世界关卡流、地编、白盒关卡机制及带人管理履历"
      ],
      advice: "不作为主投方向，仅在无系统/测开坑位时考虑。"
    },
    {
      id: "mhy-xbgd-compat",
      tier: "B",
      score: 63,
      company: "米哈游",
      title: "游戏测试工程师（专项向）-星布谷地",
      direction: "兼容性/性能/热更新专项",
      expReq: "2年以上专项测试",
      url: "https://jobs.mihoyo.com/#/position/7251",
      hits: [
        "自动化管线落地、质量平台与 PS5 支援有部分交集"
      ],
      gaps: [
        "核心要求兼容性矩阵、热更新专项、渲染分析工具与主机提审，并非主要优势区"
      ],
      advice: "谨慎投递，容易在渲染分析工具和热更新底层机制被问穿。"
    },
    {
      id: "mhy-varsapura",
      tier: "C",
      score: 52,
      company: "米哈游",
      title: "资深游戏测试工程师-Varsapura",
      direction: "5年+ UE 资深负责人",
      expReq: "至少5年，项目/大型模块负责人",
      url: "https://jobs.mihoyo.com/#/position/4857",
      hits: [
        "UE引擎工具 + 配置检查 + 全栈平台自动化方向高度契合"
      ],
      gaps: [
        "硬卡“至少5年游戏测试经验”及项目/大型模块测试负责人履历（当前3.5年）"
      ],
      advice: "【暂不推荐】简历初筛大概率卡年限，除非有内推且愿意降级评估。"
    },
    {
      id: "hg-console",
      tier: "C",
      score: 48,
      company: "鹰角网络",
      title: "游戏测试工程师—主机向",
      direction: "主机合规提审",
      expReq: "2年以上主机开发上线与合规审查",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/ef3572e6-413c-40a2-8fe7-7ed9e9ae1e62",
      hits: [
        "《无限暖暖》支援过 PS5 基础冒烟与 Xbox/PS5 手柄测试"
      ],
      gaps: [
        "要求深度参与 PS/Xbox/NS 合规审查（TRC/XR/Lotcheck）与上架更新全流程，现有支援深度远不够"
      ],
      advice: "【不推荐】主机合规细节极深，不宜以支援经历硬投专项岗。"
    },
    {
      id: "hg-zmd-combat",
      tier: "C",
      score: 46,
      company: "鹰角网络",
      title: "资深游戏测试工程师—战斗向（明日方舟·终末地）",
      direction: "Unity战斗系统深度",
      expReq: "3-5年，核心战斗+Unity",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/14309a8c-2ec9-4de4-b6cc-95db24577a3f",
      hits: [
        "基础战斗冒烟自动化 + 状态机定位经验"
      ],
      gaps: [
        "未独立负责复杂 ACT/ARPG 战斗框架、受击判定、技能帧事件及 Unity 战斗管线"
      ],
      advice: "【不推荐】垂直方向偏离。"
    },
    {
      id: "hg-ue-level-5y",
      tier: "C",
      score: 45,
      company: "鹰角网络",
      title: "资深游戏测试工程师（UE）-关卡向",
      direction: "5年+ UE 关卡负责人",
      expReq: "5年以上，大型上线+关卡负责人",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/c8949e77-c30b-4934-8c50-b835bb637969",
      hits: [
        "UE引擎与工具思维匹配"
      ],
      gaps: [
        "5年硬门槛 + 大型上线产品 + 独立负责大型关卡 + 管理经验四重门槛"
      ],
      advice: "【不推荐】年限和垂直赛道双错位。"
    },
    {
      id: "hg-zmd-level",
      tier: "C",
      score: 44,
      company: "鹰角网络",
      title: "资深游戏测试工程师—关卡向（明日方舟·终末地）",
      direction: "Unity大世界关卡",
      expReq: "3-5年，Unity大世界关卡+管理",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/e3f5b63f-d3b2-4a62-9f69-cf3a22d7f4a9",
      hits: [
        "系统/流程测试方法可迁移"
      ],
      gaps: [
        "Unity 栈 + 大世界关卡/任务/副本专项 + 管理经验要求"
      ],
      advice: "【不推荐】非核心竞争力方向。"
    },
    {
      id: "hg-zmd-scene",
      tier: "C",
      score: 38,
      company: "鹰角网络",
      title: "资深游戏测试工程师—场景向（明日方舟·终末地）",
      direction: "地编/模型/灯光/渲染审美",
      expReq: "3-5年精通场景地编灯光",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/93a7b120-f447-44d7-af7f-3bfe72dc8599",
      hits: [
        "无明显对口优势"
      ],
      gaps: [
        "要求精通地编、模型、灯光、演出与 Unity 渲染知识"
      ],
      advice: "【避坑】完全不匹配。"
    },
    {
      id: "mhy-ys-perf",
      tier: "C",
      score: 35,
      company: "米哈游",
      title: "游戏测试工程师（专项向）-原神（鸿蒙性能）",
      direction: "鸿蒙/客户端性能调优",
      expReq: "2年以上性能专项",
      url: "https://jobs.mihoyo.com/#/position/1031",
      hits: [
        "熟悉 Python 编程语言"
      ],
      gaps: [
        "核心聚焦鸿蒙系统搭载原神的性能调优、Profiler 热点分析与性能标准制定"
      ],
      advice: "【避坑】硬核性能专项岗，非当前积累方向。"
    },
    {
      id: "mhy-xbgd-perf",
      tier: "C",
      score: 35,
      company: "米哈游",
      title: "资深游戏测试工程师（专项向）-星布谷地（性能）",
      direction: "底层性能调优",
      expReq: "3年以上性能专项+带队优先",
      url: "https://jobs.mihoyo.com/#/position/7618",
      hits: [
        "Python/Lua + 自动化脚本基础"
      ],
      gaps: [
        "核心考核底层性能优化、CPU/GPU/内存热点定位"
      ],
      advice: "【避坑】性能深度不匹配。"
    },
    {
      id: "hg-ue-engine",
      tier: "C",
      score: 34,
      company: "鹰角网络",
      title: "资深游戏测试工程师-引擎向（UE项目）",
      direction: "引擎/渲染管线/图形API",
      expReq: "1年以上引擎测试+图形学加分",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/c131230b-9054-4be5-99d6-84b11bc10238",
      hits: [
        "熟悉 UE 编辑器日常工作流"
      ],
      gaps: [
        "考核渲染管线、图形 API（DX12/Vulkan/Metal）、引擎底层功能测试"
      ],
      advice: "【避坑】底层渲染/引擎专项，偏离业务与质量工具方向。"
    },
    {
      id: "hg-zmd-perf",
      tier: "C",
      score: 32,
      company: "鹰角网络",
      title: "游戏测试开发工程师-性能向（明日方舟·终末地）",
      direction: "图形渲染性能测开",
      expReq: "2年以上性能专项+美术制作与渲染管线",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/50a0e662-d399-404c-a48a-275d7a163073",
      hits: [
        "工具开发意识"
      ],
      gaps: [
        "深度要求美术资产制作流程、渲染管线原理及图形学基础"
      ],
      advice: "【避坑】专业壁垒高，不建议投递。"
    },
    {
      id: "hg-zmd-engine",
      tier: "C",
      score: 32,
      company: "鹰角网络",
      title: "游戏测试开发工程师-引擎向（明日方舟·终末地）",
      direction: "Unity/UE 引擎功能测试",
      expReq: "1年以上引擎测试+图形API",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/6f3515c0-3c59-44db-ad7b-d2bfec58b366",
      hits: [
        "熟悉 UE 引擎使用"
      ],
      gaps: [
        "渲染管线、图形 API、多平台引擎底层兼容非主要经历"
      ],
      advice: "【避坑】与鹰角 UE 引擎向同理，不建议投递。"
    }
  ],

  selfIntros: [
    {
      id: "short-1m",
      label: "1 分钟精简版（初面/电话面开场）",
      target: "通用开场 · 快速建立“全栈质量平台 + UE工具链 + 白盒排查”立体标签",
      duration: "约 55 ~ 70 秒",
      script: `面试官您好，我叫【姓名】，有三年半的游戏测试与质量工具开发经验（2023.05 至今），深耕在研 UE 项目，同时跨组支援过《无限暖暖》和《恋与深空》两款成熟商业大作。

我的核心优势是“全栈工具提效 + 复杂系统白盒定位”两条腿走路：
第一，全栈质量平台与自动化工具链。我基于开源 Web 框架，用 Vue 3 + TypeScript + Python + Flask + MongoDB 搭建了内部质量平台，整合 Checklist、自动化结果、配置 Diff 和问题反馈，开发了提交工具的单据关联与状态卡点，后期也用 AI 辅助完成了代码重构和现有平台接入；在配置与脚本左移方面，我独立实现了 Perforce + Jenkins + UGS + UE 蓝图导出 + MongoDB + Python DeepDiff 的 DataTable 变更检测与飞书精准通知闭环，以及 FlowGraph 的 XML 转 JSON 静态检查；自动化方面落地了 UE Functional Test 战斗冒烟与 Poco/Airtest 采集物探索性自动化。
第二，业务深耕与白盒定位。我长期负责物品、背包、快捷背包与相机系统，习惯结合策划表、Lua 脚本和服务端日志直接定因——比如查 Lua 揪出背包角标遗漏 -1 无限堆叠边界，以及定位出“死亡与升级并发跳过属性同步、导致药品无法回满”的服务端根因。

期待能把 UE 工具链、全栈平台开发和系统测试经验带入贵司，为版本质量和研发效能带来直接产出。`,
      hooks: [
        { trigger: "“Vue 3 + TS + Python + Flask + MongoDB 搭建质量平台”", effect: "立刻拉高测开与平台开发门槛，让面试官把你归类为具备全栈工程能力的稀缺游戏 QA。" },
        { trigger: "“Perforce + Jenkins + UGS + DeepDiff 闭环”", effect: "引导面试官追问工具链架构、并发排队与 Diff 噪音治理（你的绝对主场）。" },
        { trigger: "“查 Lua 发现 -1 无限堆叠 / 服务端日志定位死亡升级并发”", effect: "证明你不脱离业务，具备真正读代码查根因的硬实力。" },
        { trigger: "“支援《无限暖暖》与《恋与深空》”", effect: "带出多端手柄引导与双人交互打断实战视野。" }
      ]
    },
    {
      id: "dev-3m",
      label: "2-3 分钟标准版（测开 / 全栈平台 / 工具向）",
      target: "投递：鹰角 UE 测开、鹰角工具/Agent向、米哈游因缘精灵测开、米哈游源初之结专项、鹰角明日方舟测开",
      duration: "约 2 分 20 秒 ~ 2 分 45 秒",
      script: `面试官您好，我叫【姓名】，有三年半游戏测试与测试开发经验，长期扎根在大型 UE 项目组，核心工作是把研发与测试流程中的高频痛点，通过全栈 Web 平台、静态检查和引擎自动化做成可持续复用的工程闭环。

具体可以拆成三个板块：
第一块是“全栈内部质量平台与流程卡点”。为了把分散在文档、邮件和脚本里的测试资产统一起来，我基于开源 Web 框架，使用 Vue 3 + TypeScript + Python + Flask + MongoDB 搭建了内部质量平台，整合了版本 Checklist、自动化执行结果、配置 Diff 视图和问题反馈模块，同时开发了提交工具的单据关联、状态与提交人检查及任务提醒；后期在代码解耦和对接公司现有平台时，我利用 AI 辅助完成了模块重构与接口适配，并通过历史基线双跑保证了重构等价性。

第二块是“配置与资产左移检测流水线”。针对 UE 二进制 DataTable 改表 QA 难感知的痛点，我独立设计实现了端到端检测闭环：Perforce change-commit 触发 Jenkins 串行队列 -> 执行机通过 UGS 同步至精确 CL -> 调用程序提供的 UE 蓝图接口导出 JSON 并关联 CL 存入 MongoDB -> Python/DeepDiff 对比上一成功快照并在 Web 展示 -> 读取飞书多维表路径映射精准通知责任 QA，同时具备阶段失败告警与人工重跑恢复能力。此外还负责了 FlowGraph 的 XML 转 JSON 解析与 Python 静态检查规则，将任务/流程断链问题左移到提测前。

第三块是“分层自动化与业务白盒排查”。战斗侧采用 UE Functional Test 编排角色与怪物基础攻击，调用中台接口控 AI 并直接读血量做数据层断言，接入 Jenkins 自动摘取失败信息通知；场景侧做过基于坐标 GM 传送 + Poco/Airtest 的采集物阶段性自动化，这段经历也让我对 UI 自动化的脆弱性与分层 ROI 有了很清醒的认知。同时我一直保持一线系统测试手感，负责物品、背包、快捷背包和相机模块，能直接读 Lua 揪出堆叠 -1 遗漏，也能结合服务端日志和代码定位“死亡与升级同时触发跳过属性同步”的并发缺陷，并支援过《无限暖暖》多端手柄引导和《恋与深空》家园双人交互。

针对自己缺少完整商业项目长线运维经历的短板，我近期系统复盘了原神、崩铁、绝区零、终末地 4 款产品的 4,100 余条官方线上修复公告，并正在探索针对线上黑盒包体的非侵入式视觉/性能巡检方案，把线上高频逃逸模式沉淀到工具和展示平台中。非常希望能加入贵司，在测试开发与质量效能平台上持续深耕。`,
      hooks: [
        { trigger: "“Vue 3 + TS + Flask + MongoDB 全栈整合平台”", effect: "直接命中鹰角工具/明日方舟测开和米哈游因缘精灵测开的前后端全栈硬核要求！" },
        { trigger: "“重构时用历史基线双跑保证 AI 辅助重构等价性”", effect: "展现严谨的软件工程规范，避免面试官觉得你是靠 AI 盲目生成代码。" },
        { trigger: "“4,100+ 线上公告复盘 + 非侵入式黑盒巡检探索”", effect: "主动把短板转化为学习自驱力与工程创造力的证明。" }
      ]
    },
    {
      id: "sys-3m",
      label: "2-3 分钟标准版（系统测试 + 工具复合向）",
      target: "投递：鹰角 UE 系统向、米哈游绝区零 / 崩铁 / 星布谷地 / 原神",
      duration: "约 2 分 15 秒 ~ 2 分 40 秒",
      script: `面试官您好，我叫【姓名】，有三年半大型 UE 项目系统测试与质量工具建设经验，并跨组支援过《无限暖暖》和《恋与深空》。我给自己的定位是“能把复杂系统状态机抠到底，也能用全栈代码和工具把质量防线前移”的复合型游戏 QA。

在核心业务测试上，我长期负责 UE 项目里的物品、背包、快捷背包与相机四大高耦合基础系统，重点关注角色状态切换、任务进度与场景跳转下的操作逻辑和数据一致性。排查问题时，我不止步于提黑盒现象单，而是习惯进一层读配置、Lua 和服务端代码：比如排查背包和快捷背包角标逻辑时，结合策划规则与 Lua 代码揪出修正方案漏掉的 -1 无限堆叠特例；又比如稳定复现“死亡与升级同时触发导致药品无法回满”后，结合服务端日志和代码定位到死亡校验跳过属性同步、导致最大生命值未更新的根因。

在成熟商业项目跨组支援中，我在《无限暖暖》承担 PC 端键鼠及 Xbox/PS5 手柄的新手引导测试，查出引导卡住、互斥异常和特殊死亡引导遗漏，并支援 PS5 基础冒烟；在《恋与深空》负责家园道具单人、双人交互测试，重点把控动画穿模、交互切换与操作打断后的状态收口。

在技术提效上，我基于 Vue 3 + TS + Python + Flask + MongoDB 搭建了内部质量平台（整合 Checklist、自动化、配置 Diff 与反馈及提交单据卡点），独立落地了 Perforce + Jenkins + UGS + DeepDiff 的 DataTable 变更精准推送，参与了 FlowGraph 静态检查和 UE Functional Test 战斗冒烟。

为了补足主项目在研、缺少线上长线运维的视野，我也系统拆解了原神、崩铁、绝区零、终末地四千多条线上修复公告，梳理了断线重连、资产上限、跨入口越权与手柄热切换等高频线上逃逸模式。非常期待加入贵司，用业务深度 + 工具杠杆守好版本质量。`,
      hooks: [
        { trigger: "“基础系统高耦合 + 读 Lua/服务端代码定因”", effect: "直接切中系统向面试官对深度逻辑分析的核心考察。" },
        { trigger: "“自己能写 Vue3+Flask+MongoDB 平台解决测试痛点”", effect: "在业务 QA 面试中展现极强的工具思维与技术天花板。" }
      ]
    }
  ]
};
