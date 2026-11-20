// 公开作品集概览配置（已脱敏，仅保留公开可展示的工程与测试实践）
window.DATA_PUBLIC_PROFILE = {
  title: "游戏 QA 作品集与质量工程看板",
  subtitle: "系统测试 × 配置与静态左移 × 4,134 条版本修复分析 × 非侵入自动化观测",
  years: "3.5 年游戏测试与质量工具实践（UE 项目为主）",
  education: "工学学士 + Information Technology 硕士",
  positioning: "聚焦复杂系统测试、白盒/灰盒问题定位、配置变更检测与质量效率工具建设",
  radarNote: "注：以下六维分值为基于个人工作侧重点的能力自评，仅供概览参考。",
  radar: [
    { label: "UE工具链与CI/CD", value: 93 },
    { label: "质量平台(Vue3/Flask)", value: 86 },
    { label: "静态与配置左移检查", value: 91 },
    { label: "业务系统与白盒定位", value: 86 },
    { label: "自动化测试落地", value: 81 },
    { label: "线上运维与性能专项", value: 54 }
  ],
  highlights: [
    "配置变更检测闭环：基于程序提供的 UE 蓝图导出接口，独立设计并实现 Perforce 提交触发 → Jenkins 串行排队 → UGS 更新 → JSON 快照存入 MongoDB → Python DeepDiff 对比前一成功快照 → Web 展示与飞书多维表映射通知，含阶段失败告警与人工重触发恢复。",
    "内部质量平台与静态检查：基于开源 Web 框架，使用 Vue 3 + TypeScript + Python + Flask + MongoDB 整合 Checklist、自动化结果、配置 Diff 与问题反馈；开发提交工具单据关联、状态/提交人检查与提醒；参与 FlowGraph XML→JSON 解析与部分节点规则检查。",
    "分层自动化实践：基于 UE Functional Test 编排基础战斗冒烟并接入 Jenkins 失败通知与日志留存；阶段性实现基于坐标传送与 Poco/Airtest 的采集物表现层巡检。",
    "系统测试与白盒定位：长期负责物品、背包、快捷背包与相机系统测试；通过排查客户端 Lua 发现背包角标修正方案遗漏 -1 无限堆叠边界；结合服务端日志与代码定位“死亡与升级同时触发跳过属性同步导致最大生命值未更新”根因。",
    "多端与交互体验测试：参与 PC 端新手引导（覆盖键鼠与 Xbox/PS5 手柄）及 PS5 基础系统冒烟，发现引导卡住、多引导互斥异常及特殊死亡引导遗漏；执行家园道具单人/双人交互表现、穿模、切换与打断状态测试。"
  ],
  portfolioModules: [
    {
      title: "四款商业游戏版本修复条目分析（4,134 条）",
      desc: "采集自《原神》《崩坏：星穹铁道》《绝区零》《明日方舟：终末地》111 篇公开大版本更新公告，归类 8 类高危/高频缺陷模式与对应测试防线（明确标注数据采集范围与局限）。",
      sec: "online"
    },
    {
      title: "游戏测试方法论与 14 条实战用例库",
      desc: "将边界值、状态迁移、生命周期清理、多端输入、弱网重连等方法论与真实版本修复条目映射为可执行用例。",
      sec: "methods"
    },
    {
      title: "游戏 QA 技术知识卡片库",
      desc: "涵盖线上发布运维、性能与渲染基础、Web 全栈工程、弱网压测安全、AI/VLM 工程化、主机多端规范、核心业务建模、通用测试方法与 UE → Unity 引擎概念迁移。",
      sec: "study"
    },
    {
      title: "非侵入外部自动化观测工具 & CI 看板",
      desc: "遵循零注入/零内存读写红线，结合 DXGI 截屏、OpenCV 视觉检测、RapidOCR 与 PresentMon 实现外部观测，接入 GitHub Actions Schema v2 校验与 Pages 自动发布。",
      sec: "autohub"
    }
  ]
};
