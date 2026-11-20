window.DATA_JOBS = {
  profileSummary: {
    years: "3.5 年（2023.05 - 2026.10）",
    positioning: "UE 质量工具链 / 测试开发 + 复杂系统白盒定位 复合型游戏 QA",
    radar: [
      { label: "UE工具链与CI/CD", value: 92 },
      { label: "静态/配置检查", value: 90 },
      { label: "业务系统与白盒定位", value: 86 },
      { label: "自动化测试落地", value: 80 },
      { label: "跨端/手柄体验", value: 74 },
      { label: "线上长线运维/性能", value: 52 }
    ],
    strengths: [
      "独立闭环工具链：Perforce change-commit -> Jenkins 串行排队 -> UGS -> UE 蓝图导出 -> MongoDB -> Python DeepDiff -> Web -> 飞书多维表精准推送",
      "质量左移与平台化：FlowGraph XML->JSON 静态检查、内部质量平台整合（Checklist/自动化/Diff/单据卡点）与 AI 辅助重构接入",
      "引擎内外分层自动化：UE Functional Test 基础战斗冒烟 + Poco/Airtest 采集物探索性自动化",
      "白盒/灰盒排查硬实力：读 Lua 揪出背包无限堆叠 -1 边界遗漏；结合服务端日志与代码定位“死亡+升级并发跳过属性同步”根因",
      "商业大作支援视野：《无限暖暖》PC/Xbox/PS5 引导与冒烟、《恋与深空》家园单双人交互打断与穿模测试"
    ],
    gaps: [
      "主项目为在研 UE 项目，缺乏从 0 到 1 完整大版本公测上线、热更新应急及长线线上逃逸 Bug 复盘经历（需用本报告 4,134 条线上案例系统补齐）",
      "缺乏深度图形渲染/Profiler 性能调优、大规模服务器压测与主机全流程合规提审（TRC/XR/Lotcheck）实操",
      "缺乏 Golang/React/Vue 商业级大型独立全栈平台架构经验及 5 年以上团队管理经历"
    ]
  },

  jobs: [
    {
      id: "hg-ue-qa-dev",
      tier: "S",
      score: 95,
      company: "鹰角网络",
      title: "游戏测试开发工程师-（UE项目）",
      direction: "测试开发 / 工具链",
      expReq: "3年以上游戏测试工具开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/451c36a7-fa80-491c-b5d7-318a890d9c6f",
      hits: [
        "3.5年经验严丝合缝命中“3年以上工具开发”要求",
        "强命中“熟悉UE引擎优先”与“独立主导测试工具/自动化开发”",
        "DataTable Diff 闭环 + FlowGraph 静态检查 + UE Functional Test + Poco 直接覆盖全部核心职责",
        "Python / Lua 技能树完全匹配"
      ],
      gaps: [
        "需准备自动化框架可扩展性、工具链稳定性与量化 ROI 数据（如拦截配置错误数、节省回归人时）"
      ],
      advice: "【第一志愿首选】简历首屏置顶“DataTable 变更检测全链路”与“UE Functional Test / FlowGraph 静态检查”，用架构图思维讲清工程取舍。"
    },
    {
      id: "hg-ue-sys",
      tier: "S",
      score: 90,
      company: "鹰角网络",
      title: "资深游戏测试工程师—系统向（UE项目）",
      direction: "系统测试 + 工具复合",
      expReq: "3-5年游戏测试",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/76976752-dbc1-49b4-8593-b078b2320556",
      hits: [
        "3.5年命中“3-5年”，UE项目+构建跟进（Perforce/UGS/Jenkins）直击优先项",
        "背包/物品/快捷栏/相机全流程系统测试 + 读Lua/查服务端代码定位能力极具说服力",
        "工具思维（Diff/静态检查/提交卡点）对纯功能测试形成降维打击",
        "《恋与深空》家园交互 + 《无限暖暖》多端引导契合“社交/多平台”加分点"
      ],
      gaps: [
        "缺少独立负责线上运营活动、打包提审与带人管理经验，需用四款游戏线上逃逸案例展示线上风控意识"
      ],
      advice: "【业务+工具复合第一首选】简历平衡展示“复杂系统状态一致性/白盒排查”与“以工具解决测试痛点”，突出风险左移能力。"
    },
    {
      id: "hg-tool-agent",
      tier: "S",
      score: 86,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师-工具/Agent向",
      direction: "测试开发 / AI效能",
      expReq: "3年以上测试工具开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/49b56a1e-ce20-4f17-8c29-703922fb7cc2",
      hits: [
        "明确优先“熟悉 Unity、UE（DS）相关自动化测试开发并有实际落地”",
        "已有内部质量平台整合与“后期使用 AI 辅助代码重构与平台接入”的真实切入点",
        "Python + 工具链全链路闭环能力高度吻合"
      ],
      gaps: [
        "AI Agent（用例生成、问题归因、多模态巡检）和压测/性能平台实战偏浅，需在面试前梳理清晰的 Agent 落地构想"
      ],
      advice: "【高潜冲刺首选】提前设计一个“DataTable Diff + LLM 变更风险摘要与回归用例推荐”的技术方案作为面试加分题。"
    },
    {
      id: "mhy-zzz",
      tier: "A",
      score: 84,
      company: "米哈游",
      title: "游戏测试工程师-绝区零",
      direction: "系统/玩法 + 工具思维",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/947",
      hits: [
        "不硬卡“完整上线”，2年门槛轻松达标",
        "明确强调“挖掘测试工具需求或流程优化需求、具备工具思维”和“策划数据配置检查”",
        "战斗冒烟 + 背包/相机/状态机打断测试经验与 ARPG/ACT 核心痛点高度同频"
      ],
      gaps: [
        "项目为 Unity 引擎；绝区零对高帧率战斗手感、连携/失衡状态机及迷宫玩法有较高游戏理解要求"
      ],
      advice: "【米哈游首选 #1】强调配置检查/自动化方法论跨引擎通用，结合本报告绝区零 367 条修复案例（如迷宫诡域道具 CD、手柄交互、状态机打断）展现业务敏感度。"
    },
    {
      id: "mhy-sr",
      tier: "A",
      score: 82,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：星穹铁道",
      direction: "综合功能 + 自动化脚本",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/1215",
      hits: [
        "明确要求“编写自动化测试脚本提高占比”及“熟悉 Python 或 Lua 编程、数据库操作（MongoDB）”",
        "重视“深入了解 Bug 原因并总结经验”，候选人的白盒代码+日志定位经历极其加分",
        "2年经验门槛友好，无管理年限限制"
      ],
      gaps: [
        "缺少线上版本大促/支付系统实操，且偏 Unity 技术栈"
      ],
      advice: "【米哈游首选 #2】重点讲“Python/Lua + 自动化 + 查服务端日志定位状态不同步”，并用崩铁 1,613 条公告里的重连丢奖励、跨入口越权等案例补足线上认知。"
    },
    {
      id: "mhy-xbgd",
      tier: "A",
      score: 81,
      company: "米哈游",
      title: "游戏测试工程师-星布谷地",
      direction: "系统/社交 + 自动化",
      expReq: "至少3年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5748",
      hits: [
        "3.5年刚好达标3年要求；熟悉 Python/Lua + 自动化脚本占比要求完全匹配",
        "背包/物品/采集物自动化 + 《恋与深空》家园单双人交互测试与生活模拟/社交游戏业务场景高度契合"
      ],
      gaps: [
        "缺少支付系统与完整大型项目上线经历"
      ],
      advice: "【米哈游高契合备选】重点放大物品/背包堆叠边界、采集物交互以及双人家园动作打断与状态同步的测试深度。"
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
        "2年门槛达标，强调“策划数据配置检查”、“自动化框架”与“深入理解技术实现原理”",
        "背包、相机、采集物自动化与大世界系统测试思路一脉相承"
      ],
      gaps: [
        "Unity 引擎工具实操较少；原神对跨版本长线回归、多人联机同步和历史债务防回归要求极高"
      ],
      advice: "【米哈游经典核心岗】结合本报告原神 2,022 条线上逃逸案例（断线重连、任务占用互斥、背包上限配置），展现对超长线大世界质量保障的系统理解。"
    },
    {
      id: "mhy-yczj-spec",
      tier: "A",
      score: 79,
      company: "米哈游",
      title: "资深游戏测试工程师（专项向）-源初之结",
      direction: "自动化/CI专项",
      expReq: "2年以上专项/测开",
      url: "https://jobs.mihoyo.com/#/position/9398",
      hits: [
        "四大方向（性能/兼容/压测/自动化）仅要求“至少一个深入”，候选人完美卡位“自动化 + CI/CD + 质量风险前推（资源/配置检查与卡点）”",
        "测试工具/平台自研经验与 AI 辅助探索命中加分项"
      ],
      gaps: [
        "性能/兼容/压测三大方向需补齐基本认知与排查思路，避免面试问到 Profiler 或压测模型时完全答不出"
      ],
      advice: "【米哈游专项冲刺岗】明确主打“自动化管线 + 配置/静态检查左移”，同时提前准备性能基础指标与压测机器人概念应答。"
    },
    {
      id: "mhy-byjl-qa",
      tier: "A",
      score: 78,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：因缘精灵",
      direction: "新项目综合测试",
      expReq: "至少1年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5300",
      hits: [
        "新项目早期建设阶段，最需要能搭建配置 Diff、静态检查、自动化冒烟的“多面手”",
        "Python/Lua + 自动化 + 在研项目 0-1 质量体系搭建经验天然匹配"
      ],
      gaps: [
        "职级门槛较低（1年+），需确认定级与薪资预期是否匹配 3.5 年资深水平"
      ],
      advice: "【稳健保底/在研红利】适合作为米哈游体系保底或看重全新项目 0-1 质量工具主导权时投递。"
    },
    {
      id: "mhy-yczj-core",
      tier: "B",
      score: 72,
      company: "米哈游",
      title: "资深游戏测试工程师（战斗/关卡/系统/任务）-源初之结",
      direction: "资深模块负责人",
      expReq: "至少3年，需模块负责人/带队优先",
      url: "https://jobs.mihoyo.com/#/position/6430",
      hits: [
        "3.5年达标，系统测试+配置检查+自动化开发加分"
      ],
      gaps: [
        "偏好担任过大型模块测试负责人或有小团队管理经验、且有完整大型项目上线经历"
      ],
      advice: "若投递需重点包装自己在质量工具项目中的跨角色推动力（协调程序/QA/多维表映射落地）与核心系统 Owner 意识。"
    },
    {
      id: "hg-zmd-sys",
      tier: "B",
      score: 71,
      company: "鹰角网络",
      title: "资深游戏测试工程师—系统向（明日方舟·终末地）",
      direction: "Unity线上系统向",
      expReq: "3-5年，Unity优先",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/d0cc7bdc-3911-4a3c-9e7e-fae2254d494f",
      hits: [
        "系统复杂度与工具思维匹配，且本报告已深度拆解终末地 132 条线上公告缺陷"
      ],
      gaps: [
        "明确偏好 Unity 引擎大型构建跟进及打包/SDK/提审经验；同等条件下优先投鹰角 UE 项目系统向"
      ],
      advice: "鹰角同公司岗位通常建议优先锁定 UE 项目两个 S 级岗，此岗作为次选备份。"
    },
    {
      id: "hg-ark-dev",
      tier: "B",
      score: 70,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师（明日方舟）",
      direction: "Unity测开/工具平台",
      expReq: "3年以上测开，Unity+Web前后端",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/baa55cd3-5a36-4678-b69d-a6a0fb508f7a",
      hits: [
        "3年以上工具开发与自动化经验匹配"
      ],
      gaps: [
        "要求熟悉 Unity 引擎及常见 Web 前后端开发框架，与自身 UE 引擎优势错位"
      ],
      advice: "优先投鹰角“UE项目测开”与“工具/Agent向”，避免在 Unity 栈上处于劣势。"
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
      score: 62,
      company: "米哈游",
      title: "游戏测试工程师（专项向）-星布谷地",
      direction: "兼容性/性能/热更新专项",
      expReq: "2年以上专项测试",
      url: "https://jobs.mihoyo.com/#/position/7251",
      hits: [
        "自动化管线落地与 PS5 支援有部分交集"
      ],
      gaps: [
        "核心要求兼容性矩阵、热更新专项、渲染分析工具与主机提审，并非主要优势区"
      ],
      advice: "谨慎投递，容易在渲染分析工具和热更新底层机制被问穿。"
    },
    {
      id: "hg-agent-dev",
      tier: "B",
      score: 60,
      company: "鹰角网络",
      title: "测试开发工程师-Agent 方向",
      direction: "纯后端/AI Agent工程",
      expReq: "2年以上，后端+RAG/LangGraph",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/c6b9c8f6-a2a2-4d57-83c5-6246dfe474b6",
      hits: [
        "SDLC 质量数据链路理解与 Python 能力匹配"
      ],
      gaps: [
        "强要求 SpringBoot/Django/FastAPI 服务端工程及 RAG/LangChain/LangGraph 落地经验，候选人仅处于 AI 辅助重构阶段"
      ],
      advice: "与纯 AI 工程候选人竞争吃亏，优先投“工具/Agent向”而非纯 Agent 研发岗。"
    },
    {
      id: "mhy-byjl-dev",
      tier: "C",
      score: 52,
      company: "米哈游",
      title: "游戏测试开发-崩坏：因缘精灵",
      direction: "全栈效能平台架构",
      expReq: "3年以上全栈平台开发（Go+Vue/React）",
      url: "https://jobs.mihoyo.com/#/position/9576",
      hits: [
        "理解游戏研发分支/资源/质量痛点"
      ],
      gaps: [
        "明确要求 Golang 优先 + Vue/React 独立全栈商业平台架构经验，而候选人是“基于开源框架整合”，工程定位不匹配"
      ],
      advice: "【不推荐】容易在系统设计、高并发后端与前端工程化面试中挂掉。"
    },
    {
      id: "mhy-varsapura",
      tier: "C",
      score: 50,
      company: "米哈游",
      title: "资深游戏测试工程师-Varsapura",
      direction: "5年+ UE 资深负责人",
      expReq: "至少5年，项目/大型模块负责人",
      url: "https://jobs.mihoyo.com/#/position/4857",
      hits: [
        "UE引擎工具 + 配置检查 + 自动化方向完全契合"
      ],
      gaps: [
        "硬卡“至少5年游戏测试经验”及项目/大型模块测试负责人履历（当前3.5年）"
      ],
      advice: "【暂不推荐】简历初筛大概率卡年限，除非有内推且对方愿意降级评估。"
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
        "熟悉一门编程语言"
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
      target: "通用开场 · 快速建立“能写工具+懂业务+会查代码”的立体标签",
      duration: "约 55 ~ 70 秒",
      script: `面试官您好，我叫【姓名】，有三年半的游戏测试与质量工具开发经验（2023.05 至今），主要深耕在研 UE 项目，也跨组支援过《无限暖暖》和《恋与深空》两款成熟商业大作。

我的能力可以概括为“两条腿走路”：
第一，质量工具链与自动化落地。我独立设计并落地了基于 Perforce + Jenkins + UGS + UE 蓝图导出 + MongoDB + Python DeepDiff 的 DataTable 变更检测与飞书精准通知系统；参与了 FlowGraph XML 转 JSON 的静态检查和内部质量平台整合，后期还用 AI 辅助完成了部分代码重构和平台接入；在自动化上落地了基于 UE Functional Test 的战斗冒烟流水线，以及基于 Poco/Airtest 的采集物探索性自动化。
第二，复杂系统测试与白盒问题定位。我长期负责物品、背包、快捷背包与相机系统测试，习惯结合策划配置、Lua 脚本和服务端日志直接排查根因——例如排查出背包角标遗漏 -1 无限堆叠边界，以及定位出“死亡与升级并发触发导致跳过属性同步、药品无法回满”的服务端根因。

我希望能加入贵司，把 UE 质量工具链、配置左移检查与复杂系统测试经验结合起来，为大型项目的版本稳定性和研发效能带来实际价值。`,
      hooks: [
        { trigger: "“Perforce + Jenkins + UGS + DeepDiff 闭环”", effect: "引导面试官追问工具链架构、并发排队与 Diff 噪音治理（你的绝对主场）。" },
        { trigger: "“查 Lua 发现 -1 无限堆叠 / 服务端日志定位死亡升级并发”", effect: "立刻区分于纯点点点黑盒 QA，证明你具备白盒读代码和并发状态机排查能力。" },
        { trigger: "“支援《无限暖暖》与《恋与深空》”", effect: "自然带出跨项目快速上手能力、多端/手柄及双人交互经验，弱化单项目局限。" },
        { trigger: "“AI 辅助重构与平台接入”", effect: "给测开/工具/Agent 向面试官递出顺手的延展话题。" }
      ]
    },
    {
      id: "dev-3m",
      label: "2-3 分钟标准版（测开 / 工具 / 专项向）",
      target: "投递：鹰角 UE 测开、鹰角工具/Agent向、米哈游源初之结自动化专项",
      duration: "约 2 分 15 秒 ~ 2 分 40 秒",
      script: `面试官您好，我叫【姓名】，拥有三年半游戏测试与质量工具开发经验，一直扎根在大型 UE 项目组，核心角色是把业务测试中反复出现的痛点沉淀为自动化和工具链方案。

具体工作主要集中在三个板块：
第一块是“配置与资产的质量左移”。在研项目迭代期，策划频繁改表导致 QA 难以及时感知影响面。我独立设计并实现了 DataTable 变更检测与通知闭环：监听 Perforce change-commit，把提交 CL 传给 Jenkins，执行机通过 UGS 同步到精确 CL 后调用程序提供的 UE 蓝图导出接口生成 JSON 快照并关联 CL 写入 MongoDB；随后通过 Python 与 DeepDiff 对比上一成功快照，在 Web 端可视化展示变更，并读取飞书多维表里的路径与 QA 映射关系精准通知责任人，同时设计了串行排队与阶段失败告警恢复机制。此外，我还负责了 FlowGraph 静态检查（XML 转 JSON 解析、Python 规则校验、入库展示及推送），并基于开源框架整合内部质量平台，实现了提交工具单据关联与状态卡点，后期也引入 AI 辅助做代码重构和现有平台接入。

第二块是“分层自动化实践”。针对战斗核心链路，我基于 UE Functional Test 编排角色与怪物基础攻击，调用程序和中台接口控 AI、读血量做精准数据层断言，并接入 Jenkins 自动提取失败摘要推送通知、归档完整日志。在开放场景探索层面，我针对采集物做过阶段性 UI/表现层自动化，基于配置坐标用 GM 传送、调相机再结合 Poco/Airtest 交互并留存截图录像报告，在这个过程中我也清晰认识到纯 UI 自动化在复杂地形和动态场景下的脆弱性，因此在后续选型上更强调引擎内逻辑断言与静态左移的投入产出比。

第三块是“业务深耕与白盒定位”。我没有脱离业务写工具，一直负责物品、背包、快捷背包与相机等高频基础系统，也支援过《无限暖暖》PC/PS5 新手引导及《恋与深空》家园单双人交互。因为懂业务且能看懂 Lua 与服务端日志，我在需求阶段就能查配置边界（如发现堆叠 -1 遗漏），也能稳定复现并代码级定位“死亡与升级同时触发跳过属性同步”这类并发状态缺陷。

同时，我也清醒认识到自己主经历在研项目、缺少线上长线运维实操，因此近期系统复盘了原神、崩铁、绝区零和终末地等商业项目的四千多条线上修复公告，把断线重连、脏数据清理、手柄热切换和跨系统状态残留等线上高频逃逸模式沉淀进了自己的检查思路。非常期待能加入团队，在 UE/自动化工具链与质量左移方向持续产出。`,
      hooks: [
        { trigger: "“客观复盘采集物自动化局限 + 强调 ROI”", effect: "资深测开面试官极度看重工程师是否懂“什么该自动化、什么不该自动化”，不盲目吹嘘反而显专业。" },
        { trigger: "“主动点出在研短板 + 4,000+ 线上逃逸 Bug 复盘”", effect: "化被动为主动，提前把面试官最担心的短板转化为“有自驱力、有方法论”的亮点。" }
      ]
    },
    {
      id: "sys-3m",
      label: "2-3 分钟标准版（系统测试 + 工具复合向）",
      target: "投递：鹰角 UE 系统向、米哈游绝区零 / 崩铁 / 星布谷地 / 原神",
      duration: "约 2 分 15 秒 ~ 2 分 40 秒",
      script: `面试官您好，我叫【姓名】，有三年半大型 UE 项目系统测试与质量效能建设经验，并跨组支援过《无限暖暖》和《恋与深空》的重点测试任务。我给自己的定位是“既能抠透复杂业务状态机，又能用代码和工具把质量防线前移”的复合型游戏 QA。

在核心业务测试方面，我长期负责 UE 项目里的物品、背包、快捷背包与相机四大基础系统。这些模块看似基础，但耦合度极高——我会重点围绕角色状态切换、任务进度与场景跳转去检验操作逻辑和数据一致性，比如相机遮挡/锁定/回正、背包堆叠/排序/快捷绑定。在实际排查中，我不止步于提黑盒现象单，而是习惯进一层看配置、代码和日志：比如在核对背包角标逻辑时，我结合策划规则去查 Lua 实现，不仅确认了按配置堆叠上限判定的逻辑，还揪出程序修正方案里漏掉的 -1 无限堆叠特例；又比如我稳定复现过“角色死亡与升级同时触发导致药品无法回满”的偶现 Bug，结合服务端日志和代码直接定位到是死亡校验分支跳过了属性同步，导致最大生命值未刷新。

在跨项目支援中，我也在商业级多端产品上积累了实战手感：在《无限暖暖》中承担 PC 端键鼠及 Xbox/PS5 手柄的新手引导测试，查出引导卡死、输入互斥和特殊死亡引导遗漏，并支援了 PS5 基础冒烟；在《恋与深空》中执行家园道具单人、双人交互测试，重点把控动画穿模、交互切换与中途打断后的状态收口。

在测试提效方面，我把日常最痛的“策划改表难感知、配置/逻辑脚本低级错误多、版本冒烟耗时”做成了工具闭环：独立实现了 Perforce + Jenkins + UGS + UE 蓝图导出 + MongoDB + Python DeepDiff 的 DataTable 变更检测与飞书按路径精准推送；参与了 FlowGraph 静态检查、内部质量平台单据卡点，以及基于 UE Functional Test 的战斗冒烟流水线。

为了补齐在研项目缺少线上长线运维的视野，我也系统研究过原神、崩铁、绝区零和终末地等产品的线上修复记录，梳理出了断线重连状态重建、资产消耗边界、跨入口状态残留与手柄热切换等高频逃逸模型。非常期待能把这套“业务深度 + 白盒排查 + 质量工具”的组合能力带到贵司项目中。`,
      hooks: [
        { trigger: "“基础系统高耦合 + 状态机/跨场景一致性”", effect: "直接命中米哈游/鹰角系统向面试官最核心的业务考察点。" },
        { trigger: "“《无限暖暖》多端引导 + 《恋与深空》双人打断”", effect: "与绝区零/星布谷地/鹰角 UE 社交或动作系统的交互复杂度高度同频。" }
      ]
    }
  ]
};
