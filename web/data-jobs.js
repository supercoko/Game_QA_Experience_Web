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
      id: "hg-ue-sys",
      tier: "S",
      score: 92,
      company: "鹰角网络",
      title: "资深游戏测试工程师—系统向（UE项目）",
      direction: "系统测试 + 工具复合（当前最高胜率首选！）",
      expReq: "3-5年游戏测试",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/76976752-dbc1-49b4-8593-b078b2320556",
      hits: [
        "【结合鹰角 UE 测开实测反馈调优！】你的综合能力（系统业务+白盒排查+Vue3/Flask全栈工具+UE构建跟进）放在系统向 QA 是绝对降维打击！",
        "3.5年命中“3-5年”，UE项目+Perforce/UGS/Jenkins 构建跟进直击优先项",
        "背包/物品/快捷栏/相机系统测试 + 读Lua/查服务端代码定位能力极具说服力",
        "《恋与深空》家园交互 + 《无限暖暖》多端引导契合“社交/多平台”加分点"
      ],
      gaps: [
        "必须先按「10. 面评复盘 & 8周路线」练熟背包/相机的四层架构表达，并补齐线上活动与任务/战斗基础测试模型"
      ],
      advice: "【当前阶段最稳 S 级首选】把“全栈工具+配置Diff”包装成你做系统测试的效率杠杆，而非纯开发履历。"
    },
    {
      id: "mhy-zzz",
      tier: "S",
      score: 89,
      company: "米哈游",
      title: "游戏测试工程师-绝区零",
      direction: "业务测试 + 工具思维（极高胜率！）",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/947",
      hits: [
        "【综合能力完美主场！】不硬卡完整上线、2年门槛宽松，明确需要“系统/玩法业务测试 + 具备工具思维 + 策划数据配置检查”",
        "Vue3+TS+Flask+MongoDB 平台 + DataTable Diff + 白盒定位在业务 QA 池里辨识度极高",
        "《无限暖暖》手柄引导与《恋与深空》交互打断测试同频动作玩法痛点"
      ],
      gaps: [
        "需提前用《绝区零》VR 训练场与 367 条修复公告补齐战斗状态机/连携/失衡和迷宫玩法的业务测试设计表达"
      ],
      advice: "【米哈游第一志愿首选】定位“重业务逻辑+强工具杠杆”，面试前务必打磨背包/相机四层表达+战斗基础测试模型。"
    },
    {
      id: "mhy-sr",
      tier: "S",
      score: 88,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：星穹铁道",
      direction: "综合功能 + Python/Lua自动化",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/1215",
      hits: [
        "【极度契合“偏综合”定位！】明确要业务测试 + 编写自动化脚本 + Python/Lua + 数据库（MongoDB）",
        "回合制系统/养成/活动比重极高，对动作手感和硬核战斗帧事件门槛相对低于纯 ACT 岗，完美避开你的战斗短板！",
        "白盒查服务端日志/代码定位与 1,613 条崩铁公告复盘直接拉满加分"
      ],
      gaps: [
        "补齐商业化支付/掉单补单、跨零点活动结算与弱网重连测试思路"
      ],
      advice: "【最扬长避短的 S 级首选！】系统与活动权重高、对纯研发算法要求低，非常适合作为突破大厂的王牌岗位。"
    },
    {
      id: "mhy-xbgd",
      tier: "S",
      score: 87,
      company: "米哈游",
      title: "游戏测试工程师-星布谷地",
      direction: "系统/社交/生活模拟 + 自动化",
      expReq: "至少3年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5748",
      hits: [
        "【高度避开战斗短板！】生活模拟/家园社交核心正是物品、背包、采集物、双人交互与系统一致性——与你全部真实经历 100% 重叠！",
        "3.5年精准达标 3 年要求，Python/Lua + MongoDB + 自动化脚本占比要求全中",
        "《恋与深空》家园单双人交互 + 采集物自动化 + 背包堆叠边界简直是对口模板"
      ],
      gaps: [
        "补齐支付系统与线上发版基础认知，把背包和家园交互讲成体系化测试设计"
      ],
      advice: "【隐藏黑马 S 级首选！】几乎零战斗门槛，你的物品背包+采集物+双人家园交互经验全都是正中靶心的核心资产！"
    },
    {
      id: "mhy-ys",
      tier: "A",
      score: 84,
      company: "米哈游",
      title: "游戏测试工程师-原神",
      direction: "大世界系统 + 配置检查",
      expReq: "至少2年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/3550",
      hits: [
        "2年门槛达标，强调“策划数据配置检查”、“自动化框架”、“数据库操作”与“深入理解技术实现原理”",
        "背包、相机、采集物自动化 + 2,022 条原神线上公告复盘形成极强说服力"
      ],
      gaps: [
        "需提前补齐大世界任务占用互斥防软锁、多人联机同步和超长线回归风控表达"
      ],
      advice: "【米哈游核心业务池】强调配置左移、白盒定位和针对原神 2,022 条线上逃逸案例的深度复盘。"
    },
    {
      id: "mhy-byjl-qa",
      tier: "A",
      score: 83,
      company: "米哈游",
      title: "游戏测试工程师-崩坏：因缘精灵",
      direction: "新项目综合业务 + 工具建设",
      expReq: "至少1年游戏测试",
      url: "https://jobs.mihoyo.com/#/position/5300",
      hits: [
        "在研新项目最需要能干系统业务又能搭质量平台/配置 Diff 的“综合多面手”！",
        "1 年起门槛友好，可务实对标 2-3 年中级/中高级业务 QA，先拿大厂完整上线周期入场券"
      ],
      gaps: [
        "需与 HR 对齐职级预期，确认成长空间与核心模块历练机会"
      ],
      advice: "【极具性价比的务实突破口】正好匹配你的“综合型”标签，且能跟完整 0-1 上线过程彻底补齐履历短板。"
    },
    {
      id: "mhy-yczj-spec",
      tier: "A",
      score: 80,
      company: "米哈游",
      title: "资深游戏测试工程师（专项向）-源初之结",
      direction: "自动化/工具平台专项",
      expReq: "2年以上专项/测开",
      url: "https://jobs.mihoyo.com/#/position/9398",
      hits: [
        "四大方向仅要求“至少一个深入”，主打“自动化 + CI/CD + 质量风险前推（资源/配置检查）+ 全栈工具自研”",
        "相对纯测开更看重 QA 质量落地思维，但仍会有一定工程/框架深度追问"
      ],
      gaps: [
        "需补齐性能/兼容/压测三大专项的基本原理卡片，并打磨自动化框架可扩展性架构"
      ],
      advice: "【专项向备选】建议完成第 5-6 周非侵入式自动化作品集后再投，工程说服力倍增。"
    },
    {
      id: "hg-ue-qa-dev",
      tier: "B",
      score: 72,
      company: "鹰角网络",
      title: "游戏测试开发工程师-（UE项目）【已实测：需纯测开】",
      direction: "纯测开（实测反馈修正）",
      expReq: "3年以上纯测试开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/451c36a7-fa80-491c-b5d7-318a890d9c6f",
      hits: [
        "UE 工具链、Vue3+TS+Flask+MongoDB、DataTable Diff、FlowGraph 静态检查方向高度对口"
      ],
      gaps: [
        "【真实面试反馈】该岗要求“纯测开”（算法、后端工程深度、独立底层框架/UE C++ 插件开发），而当前履历偏“业务+工具综合型”"
      ],
      advice: "【已实测 · 归档复盘】切忌短期内盲目重复撞同类纯测开岗；若走纯测开，请按「路线 B」沉淀 4-6 个月算法与底层开发后再战。"
    },
    {
      id: "hg-tool-agent",
      tier: "B",
      score: 71,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师-工具/Agent向",
      direction: "纯测开 / 平台与AI（受纯测开门槛影响）",
      expReq: "3年以上纯测试开发",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/49b56a1e-ce20-4f17-8c29-703922fb7cc2",
      hits: [
        "Vue3+TS+Flask+MongoDB 全栈平台与 UE 自动化背景高度相关"
      ],
      gaps: [
        "参照鹰角 UE 测开反馈，鹰角测开序列普遍要求纯开发工程硬实力，且此岗还叠加了 Agent/多模态工程落地要求"
      ],
      advice: "【暂缓硬撞】等做出非侵入 VLM/Agent 开源作品并补齐算法+异步后端工程后再评估。"
    },
    {
      id: "mhy-byjl-dev",
      tier: "B",
      score: 70,
      company: "米哈游",
      title: "游戏测试开发-崩坏：因缘精灵",
      direction: "全栈效能平台纯开发（警惕纯研发门槛）",
      expReq: "3年以上全栈平台开发（Golang优先+Vue/React）",
      url: "https://jobs.mihoyo.com/#/position/9576",
      hits: [
        "Vue 3 + TypeScript + Python + Flask + MongoDB 平台开发直接命中技术面"
      ],
      gaps: [
        "【结合鹰角纯测开反馈警示】此岗偏向纯软件全栈工程师（系统架构设计、高并发、算法、Golang 优先），若当前工程底层尚未补齐，容易重演“偏综合不够纯开发”的结局"
      ],
      advice: "【谨慎评估】优先投同项目的业务岗（因缘精灵游戏测试 A级）；仅在补齐后端架构/算法后冲击此岗。"
    },
    {
      id: "hg-ark-dev",
      tier: "B",
      score: 69,
      company: "鹰角网络",
      title: "资深游戏测试开发工程师（明日方舟）",
      direction: "纯测开 / Web工具平台",
      expReq: "3年以上纯测开 + Unity",
      url: "https://app.mokahr.com/social-recruitment/hypergryph/26325?locale=zh-CN#/job/baa55cd3-5a36-4678-b69d-a6a0fb508f7a",
      hits: [
        "Vue3+TS+Flask+MongoDB Web 前后端框架经验直接命中"
      ],
      gaps: [
        "同属鹰角纯测开序列，且偏好 Unity 引擎与压测底层框架，短期内胜率低于业务+工具复合岗"
      ],
      advice: "【暂缓】先拿业务+工具复合型 Offer 站稳脚跟，或走路线 B 补强纯开发实力。"
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
      label: "1 分钟自然口语版（初面/电话面开场）",
      target: "去机器感 · 像真人聊天一样自然带出“系统排查 + 全栈工具 + 大作支援”",
      duration: "约 50 ~ 65 秒",
      script: `面试官您好，我叫【姓名】，做游戏测试大概三年半了，从 23 年 5 月一直做到现在。这几年主要在一个在研的 UE 项目组，期间也跨组支援过《无限暖暖》和《恋与深空》。

日常工作大概分两块。一块是业务测试，我长期跟进物品、背包、快捷背包和相机这些基础系统。平时查问题我不太习惯只提个黑盒现象就完事，会顺手翻翻策划表、Lua 代码或者服务端日志——比如之前查背包角标的时候，顺着 Lua 抓出过程序漏判 -1 无限堆叠的问题；还有一次角色死亡和升级同时触发导致吃药回不满血，我也是复现后结合服务端日志定位到是死亡校验直接跳过了属性同步。

另一块是结合测试痛点做些提效工具。因为项目里策划改 UE 配置表比较频繁，QA 很难及时知道改了哪儿，我就用 Python、Jenkins、MongoDB 搭了一套 DataTable 变更检测和飞书推送；另外也基于开源框架，用 Vue3、TS、Flask 和 MongoDB 搭了个内部质量平台，把 Checklist、自动化结果、配置 Diff 和单据检查整合在一起，还写过 FlowGraph 静态检查和 UE Functional Test 战斗冒烟。

这次看机会，也是希望能加入一个流程更成熟、有完整上线节奏的团队，把我自己做系统测试和写工具这两块经验真正用起来。`,
      hooks: [
        { trigger: "“翻 Lua 抓出 -1 无限堆叠 / 服务端日志查死亡升级同时触发”", effect: "口语自然带出，不显刻意炫技，但面试官一听就会追问排查过程。" },
        { trigger: "“策划改表 QA 难感知 -> 搭了变更检测和 Vue3+Flask 平台”", effect: "从真实痛点讲起，比硬背技术栈名词更有说服力、更有真人感。" },
        { trigger: "“希望能加入有完整上线节奏的团队”", effect: "提前把在研项目短板转化为积极的求职动机，显得真诚坦荡。" }
      ]
    },
    {
      id: "sys-3m",
      label: "2 分钟实战口语版（主攻：系统/业务测试 + 工具加分）",
      target: "主投：米哈游（崩铁/星布谷地/绝区零/原神/因缘精灵）、鹰角 UE 系统向、网易/大厂系统 QA",
      duration: "约 1 分 50 秒 ~ 2 分 15 秒",
      script: `面试官您好，我叫【姓名】，23 年 5 月入行，到现在有三年半游戏测试经验，主要待在一个在研的 UE 项目里，中间也去《无限暖暖》和《恋与深空》支援过。

先说说业务这块。在 UE 项目里我主要负责物品、背包、快捷背包还有相机系统。这几个系统看起来基础，其实跟角色状态、任务进度、切场景耦合得特别紧，所以平时测的时候我重点会盯操作逻辑和数据一致性。遇到不好定位的问题，我习惯往代码和日志里多看一层：比如有一次核对背包和快捷背包角标显示，我对完策划规则又去翻了前端 Lua 代码，发现程序给的修复方案漏掉了 -1 无限堆叠这个特例，提前拦截了一个回归问题；还有一次是吃药血条回不满，偶现挺难抓的，后来我摸出稳定复现条件——死亡和升级刚好同时触发，顺着服务端日志和代码查到，是死亡校验分支直接跳过了属性同步，导致最大生命值没刷新。

支援那两个上线项目对我帮助也挺大。在《无限暖暖》主要测 PC 端键鼠和 Xbox、PS5 手柄的新手引导，抓过引导卡死、输入互斥，还有特殊死亡后缺少引导兜底的问题，也帮忙跑过 PS5 冒烟；在《恋与深空》主要测家园道具的单人、双人交互，重点看动作穿模、交互切换和中途中止后双方的状态能不能干净收口。

除了业务测试，平时遇到重复或者容易漏测的环节，我也会自己写工具解决。比如策划改 UE 的 DataTable 之后 QA 很难察觉，我就联动 Perforce、Jenkins、UGS 和程序给的导出接口，用 Python 和 DeepDiff 做了快照对比、Web 展示和按飞书多维表精准推送；另外也用 Vue3、TS、Flask 和 MongoDB 搭了个内部质量平台，整合 Checklist、配置 Diff、自动化结果和提交单据卡点，还参与过 FlowGraph 静态检查和 UE Functional Test 战斗冒烟。

实话讲，之前主项目一直在研，没完整跟过一个大版本上线长线运营，确实是我的短板。所以最近我专门把原神、崩铁、绝区零、终末地这几款产品几千条线上更新修复公告做了一次梳理，把断线重连、资产上限、跨入口状态残留这些线上高发问题补进了自己的测试思路里。也希望能加入贵司，在扎实的业务项目里把这块实战彻底补上。`,
      hooks: [
        { trigger: "“看起来基础，其实耦合得特别紧”", effect: "用大白话引出系统复杂度，为后面展开背包/相机四层架构做好铺垫。" },
        { trigger: "“实话讲，没完整跟过上线确实是我的短板，所以我最近专门……”", effect: "主动坦诚 + 拿出真实行动（复盘几千条公告），彻底化解面试官防备心。" }
      ]
    },
    {
      id: "dev-3m",
      label: "2 分钟工程口语版（备选：自动化专项 / 偏工具平台岗）",
      target: "投递：米哈游源初之结自动化专项、偏工具建设的测开/效能岗",
      duration: "约 1 分 50 秒 ~ 2 分 20 秒",
      script: `面试官您好，我叫【姓名】，有三年半游戏测试和质量工具开发经验，一直在一个在研 UE 项目里，平时既做核心系统测试，也负责把团队里最痛的流程做成工具和自动化。

工具这边我最完整的产出有两个。一个是配置变更检测流程：UE 的 DataTable 是二进制资产，策划改表后 QA 根本不知道动了哪一行。我就借着程序提供的蓝图导出接口，把整条链路串了起来——Perforce 提交触发 Jenkins 串行排队，执行机用 UGS 拉到指定 CL 导出 JSON，存进 MongoDB，再用 Python 和 DeepDiff 跟上一次成功快照做比对，最后在 Web 展示，并按飞书多维表里的路径映射通知到对应 QA，中间哪一步挂了也会告警，支持人工重跑恢复。

另一个是内部质量平台。一开始大家的 Checklist、自动化报告、配置 Diff 都散在各处，我就基于开源框架，用 Vue3、TS、Python、Flask 和 MongoDB 搭了个 Web 平台把这些都收口到一起，还补了提交工具的单据关联、状态和提交人检查，顺带做了 FlowGraph 的 XML 转 JSON 静态检查。后期需要重构并接入公司现有平台时，我也用 AI 辅助做了代码拆解和适配，再用历史数据跑对比验证没改坏逻辑。

自动化方面我跑过两条线：战斗基础冒烟用的是 UE Functional Test，调中台接口控 AI、读血量断言，接进 Jenkins 出失败通知；采集物那边做过阶段性的 Poco 加 Airtest 自动化，虽然在复杂地形下覆盖有限，但也让我很清楚哪些场景适合引擎内断言、哪些不该硬上 UI 自动化。

因为我自己也一直测着背包、相机这些业务系统，也会查 Lua 和服务端日志，所以我做工具一般会紧贴 QA 真实痛点来。最近也在业余用真实线上包体折腾非侵入式的视觉和帧率巡检脚本，希望能有机会加入团队，在自动化和质量工具这块继续往下深挖。`,
      hooks: [
        { trigger: "“借着程序提供的蓝图导出接口，把整条链路串了起来”", effect: "边界诚实、不夸大，同时清晰凸显你全链路落地的工程 ownership。" },
        { trigger: "“也让我很清楚哪些不该硬上 UI 自动化”", effect: "一句话体现工程师的 ROI 判断力，比盲目吹自动化率高级得多。" }
      ]
    }
  ]
};
