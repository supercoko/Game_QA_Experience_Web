window.DATA_STUDY = {
  gapOverview: [
    {
      cat: "线上发布与运维质量",
      priority: "P0 必补",
      why: "弥补主项目为在研项目、缺少公测/大版本热更/脏数据修复与 P0 应急的客观短板",
      focus: "热更新 Manifest 差分与回滚、灰度放量、存量脏数据幂等补发、P0 15分钟应急 SOP"
    },
    {
      cat: "游戏性能与渲染基础",
      priority: "P1 高频",
      why: "鹰角/米哈游测开与专项岗常考基础性能指标，防止被问“如何定位卡顿掉帧”时哑火",
      focus: "FrameTime vs FPS、1% Low FPS、CPU/GPU Bound 区分、DrawCall/Overdraw、内存 PSS/GC、Unreal Insights/PresentMon"
    },
    {
      cat: "Web全栈工程进阶(Vue3/Flask/Mongo)",
      priority: "P0 护城河",
      why: "简历新增 Vue3+TS+Flask+MongoDB 全栈平台后，米哈游/鹰角测开必然深挖后端并发与数据库设计",
      focus: "Gunicorn+Celery异步队列、MongoDB复合索引/Projection/GridFS、Vue3虚拟滚动、接口幂等与RBAC鉴权"
    },
    {
      cat: "服务端弱网、压测与防刷安全",
      priority: "P1 核心",
      why: "从客户端视角跃迁到全链路视角，精准呼应你服务端日志定位与线上公告重连丢奖/ESC卡CD案例",
      focus: "QPS/TP99/并发机器人压测、弱网注入模型、服务端权威校验、分布式锁防双花与客户端时钟篡改"
    },
    {
      cat: "AI Agent 与 VLM 测开工程化",
      priority: "P1 差异化",
      why: "冲刺鹰角“工具/Agent向”与米哈游“源初之结专项”的王牌加分项，把“AI辅助重构”升级为“AI质量方案”",
      focus: "结构化输出(JSON Schema)、RAG检索历史Bug/配置表、Function Calling工具闭环、VLM视觉异常巡检与幻觉评估"
    },
    {
      cat: "主机与多端兼容性红线",
      priority: "P2 拓展",
      why: "把《无限暖暖》PS5/手柄支援经历体系化，覆盖跨端大作（终末地/原神/绝区零）多端底线",
      focus: "PS5 TRC / Xbox XR 基础合规（手柄断连/休眠/账号切换/输入法）、机型芯片矩阵、Shader编译卡顿(PSO)"
    }
  ],

  flashcards: [
    // 1. 线上发布与运维质量 (4)
    {
      id: "fc-ops-1",
      cat: "线上发布与运维质量",
      difficulty: "核心必背",
      front: "游戏热更新（Hotfix）的基本流程是什么？测试热更新时最容易漏掉哪 4 个高危场景？",
      back: "核心流程：客户端启动请求版本服 -> 下发最新 Manifest（资源清单+MD5/CRC+版本号） -> 对比本地清单元数据 -> 仅下载增量/差分包（Pak/AssetBundle） -> 校验完整性 -> 覆盖挂载并生效。\n\n测试 4 大必测高危：\n1) 跨多版本跳跃更新（如从 1.2 直接更到 1.5）；\n2) 下载中途断网/杀进程后的断点续传与残留临时文件校验；\n3) 磁盘空间不足与弱网 MD5 校验失败重试；\n4) 热更回滚（撤回 Manifest）后客户端是否能干净回退不闪退。",
      golden: "面试金句：热更测试绝不只是“更完能进游戏”，核心要守住跨版本跳更、断网续传校验、以及回滚可逆三条底线。"
    },
    {
      id: "fc-ops-2",
      cat: "线上发布与运维质量",
      difficulty: "核心必背",
      front: "什么是“灰度发布（Canary Release）”？游戏线上出 P0 事故时，回滚与热修该如何抉择？",
      back: "灰度发布：按白名单 -> 1% -> 10% -> 50% -> 100% 逐步放量，结合崩溃率、登录成功率、卡死率、支付回调监控实时观察指标。\n\n止血抉择：\n• 优先回滚：若新版本/热更刚发布即引发大面积启动闪退（如特定 iOS 系统必现）且无不可逆数据结构变更，第一时间回滚版本清单止血（分钟级恢复）；\n• 必须热修：若已涉及不可逆数据库 Schema 升级或线上经济/资产刷漏洞，先通过服务端开关/熔断临时关闭异常玩法入口，再紧急打补丁验证后发布。",
      golden: "面试金句：线上应急第一原则是“先止血、后查因”，能用配置开关熔断或清单回滚解决的，绝不赌未经验证的盲目热修。"
    },
    {
      id: "fc-ops-3",
      cat: "线上发布与运维质量",
      difficulty: "高频考题",
      front: "线上 Bug 已经给存量玩家留下了“脏数据”（如背包道具未扣、奖励漏发），测试怎么验收数据修复方案？",
      back: "分“治新增”与“治存量”双线验收：\n1) 幂等性：补发/补扣脚本重复跑 N 次不能多发多扣；\n2) 人群圈定准确：在仿真库核对三类样本（受影响异常号、正常已消耗号、未参与号）零误伤；\n3) 触发方式安全：优先惰性触发（如原神 7.1 玩家回到对应区域自动补扣钥匙）或离线低峰批处理，避免高峰全表扫库拖垮 DB；\n4) 满包/边界兜底：自动补发时玩家背包已满能否安全进邮箱，且提前做好修复前数据快照备份。",
      golden: "面试金句：修逻辑只算完成一半，线上高阶 QA 必须把存量脏数据的幂等补偿和回滚预案一并验收闭环。"
    },
    {
      id: "fc-ops-4",
      cat: "线上发布与运维质量",
      difficulty: "核心必背",
      front: "大版本发版前的“封板（Code Freeze / Branch Lock）”机制下，QA 应该如何把控合入风险？",
      back: "封板三阶管控：\n1) 强单据关联：发布分支仅允许关联 P0/P1 修复单且经评审批准的 CL 合入（对应你自研的提交工具单据卡点！）；\n2) 影响面 Diff 审查：所有配置表改表必须过 DataTable Diff 审查，杜绝夹带未提测半成品；\n3) 回归分层：合入后跑最小 P0 冒烟 + 受影响模块精准回归，防止“修一个 P2 引入一个 P0 崩服”。",
      golden: "面试金句：封板期最大的风险不是老 Bug，而是不受控的“顺手改一行”，单据卡点 + 配置 Diff 是守住封板的最佳工程防线。"
    },

    // 2. 游戏性能与渲染基础 (4)
    {
      id: "fc-perf-1",
      cat: "游戏性能与渲染基础",
      difficulty: "核心必背",
      front: "为什么性能测试不能只看“平均 FPS”，而必须盯紧 FrameTime（帧时间）和 1% Low FPS？",
      back: "• 60 FPS 对应的单帧预算仅为 16.67ms（30 FPS 为 33.33ms）。\n• 平均 FPS 会掩盖瞬时卡顿（Jank/Hitch）：哪怕 59 帧每帧 10ms、只有 1 帧卡了 400ms，平均帧率看似仍接近 60，但玩家体感就是严重掉帧撕裂。\n• 1% Low FPS（最慢 1% 帧的平均帧率）与单帧耗时毛刺（>50ms / >100ms 尖刺次数）才能真实反映流畅度，也是 PresentMon / PerfDog 核心关注指标。",
      golden: "面试金句：平均 FPS 看上限，1% Low FPS 和 FrameTime 毛刺才决定玩家的真实卡顿体感。"
    },
    {
      id: "fc-perf-2",
      cat: "游戏性能与渲染基础",
      difficulty: "高频考题",
      front: "游戏掉帧时，如何快速初步判断是 CPU Bound（逻辑/渲染线程瓶颈）还是 GPU Bound（显卡渲染瓶颈）？",
      back: "实战 30 秒快速定界法：\n1) 调低游戏渲染分辨率（如从 1080p 降到 540p 或调低渲染精度 0.5）：如果帧率明显飙升，大概率是 GPU 像素着色器（Fillrate / Overdraw / 后处理）瓶颈；如果帧率几乎不动，基本是 CPU 瓶颈（主线程游戏逻辑 Tick、物理、骨骼动画或渲染线程提交 DrawCall 过载）；\n2) UE 引擎内直接看 `stat unit`：对比 `Game`（逻辑线程）、`Draw`（渲染线程）与 `GPU` 三者谁耗时最高决定瓶颈所在。",
      golden: "面试金句：降分辨率帧率涨 = GPU Bound，降分辨率帧率不动 = CPU Bound；UE 里用 `stat unit` 一眼看穿 Game/Draw/GPU 谁拖后腿。"
    },
    {
      id: "fc-perf-3",
      cat: "游戏性能与渲染基础",
      difficulty: "高频考题",
      front: "DrawCall、Overdraw 和 PSO（Shader 编译卡顿）分别是什么？为什么大世界游戏换新场景/放新技能容易第一下卡顿？",
      back: "• DrawCall：CPU 向 GPU 发送一次绘制命令的开销，过多零散材质/物件会导致渲染线程 CPU 瓶颈（靠合批 Instancing/Batching 降低）；\n• Overdraw（过度绘制）：屏幕同一像素被多层半透明特效（粒子/烟雾/UI遮罩）反复叠加绘制，瞬间打满移动/中端 GPU 带宽；\n• PSO（Pipeline State Object）卡顿：新技能/新地图首次用到未缓存的 Shader 组合时，运行时临时编译会导致单帧暴涨几百毫秒（需靠发版前 PSO 预收集/预编译覆盖）。",
      golden: "面试金句：首次放技能卡一下但第二次变流畅，八成是 PSO/Shader 预编译遗漏或资源同步加载（Sync Load）导致的主线程阻塞。"
    },
    {
      id: "fc-perf-4",
      cat: "游戏性能与渲染基础",
      difficulty: "核心必背",
      front: "移动端/PC 游戏内存测试怎么判断是否存在“内存泄漏（Memory Leak）”？PSS 和 GC 锯齿是什么意思？",
      back: "• Android 常用 PSS（Proportional Set Size，按比例摊销共享库后的真实物理内存占用）衡量内存水位；\n• 判断泄漏的标准测试法：设计循环往复路径（大世界↔副本↔抽卡↔背包反复切换 20 轮），每次回到同一基准点手动触发 GC 后记录内存——正常曲线呈“锯齿状平稳回归”，如果每次回基准点最低水位持续阶梯式抬升不回落，就高度疑似资源未卸载或引用未释放导致的内存泄漏，最终引发移动端 OOM 闪退。",
      golden: "面试金句：单看一次内存峰值不能定性泄漏，必须用“同场景循环往复 + 回基准点水位趋势”区分正常缓存与真实泄漏。"
    },

    // 3. Web全栈工程进阶 (4)
    {
      id: "fc-web-1",
      cat: "Web全栈工程进阶(Vue3/Flask/Mongo)",
      difficulty: "面试必问",
      front: "Flask 开发生产级质量平台时，为什么不能直接 `app.run()`？长耗时任务（如大表 Diff、批量解析）怎么避免阻塞 API？",
      back: "• `app.run()` 是单进程调试服务器，无法承受并发且不稳定；生产环境需用 WSGI 服务器（Gunicorn / uWSGI + Nginx 反向代理）启多 Worker 进程；\n• 长耗时任务必须异步解耦：Web 接口收到请求后只校验参数、写入任务状态 `PENDING` 并立即返回 `task_id`（HTTP 202），由 Celery / RQ + Redis 异步 Worker 消费执行，完成后更新 MongoDB 状态并触发飞书通知；前端通过轮询或 SSE/WebSocket 展示实时进度。",
      golden: "面试金句：Web 请求链路只做轻量鉴权与任务入队，把重计算彻底剥离给异步 Worker，是 Flask 平台稳定不雪崩的第一铁律。"
    },
    {
      id: "fc-web-2",
      cat: "Web全栈工程进阶(Vue3/Flask/Mongo)",
      difficulty: "面试必问",
      front: "MongoDB 存储海量 DataTable JSON 快照和自动化记录，如何设计 Schema、索引与防膨胀策略？",
      back: "1) 冷热分离/主副拆表：列表检索表（`diff_summary`）只存 CL、表名、提交人、改动行数、风险等级；大体积快照放独立集合（`table_snapshots`），超 16MB BSON 上限时用 GridFS 或对象存储（MinIO/S3）只存 URL；\n2) 复合索引遵循 ESR 原则（Equality 等值 -> Sort 排序 -> Range 范围），例如 `(table_name: 1, cl: -1)`；\n3) 查询必用 Projection（`{raw_json: 0}`）避免把几 MB 数据全拉进内存；\n4) 配合 TTL 索引自动清理 90 天前的非里程碑历史全量快照，只永久保留 Diff 摘要与核心大版本基线。",
      golden: "面试金句：MongoDB 存配置快照最大的坑是单文档过大与无 Projection 全字段拉取，拆表 + 复合索引 + TTL 是标准解法。"
    },
    {
      id: "fc-web-3",
      cat: "Web全栈工程进阶(Vue3/Flask/Mongo)",
      difficulty: "高频考题",
      front: "在 Vue 3 + TypeScript 平台里，展示几千行配置 Diff 或上万条自动化日志时页面卡顿，前端怎么做性能优化？",
      back: "1) 虚拟滚动（Virtual Scroll，如 vue-virtual-scroller）：DOM 中只渲染可视区域内的 30~50 行，彻底消除万级 DOM 节点重排卡顿；\n2) 数据响应性瘦身：对只读的大型 Diff 快照对象使用 `shallowRef` / `Object.freeze`，避免 Vue 3 Proxy 对几万个深层嵌套属性递归劫持造成内存和初始化暴涨；\n3) 交互分级：默认只渲染变更节点（Collapse Unchanged）、前端分页/服务端检索、搜索输入框加防抖（Debounce）。",
      golden: "面试金句：在 Vue 3 里展示大体积只读 JSON/Diff，`shallowRef` 避开深层 Proxy 劫持 + 虚拟滚动，能让页面瞬间从卡死变丝滑。"
    },
    {
      id: "fc-web-4",
      cat: "Web全栈工程进阶(Vue3/Flask/Mongo)",
      difficulty: "高频考题",
      front: "如果平台要接入多个项目组共用，API 幂等性、权限控制（RBAC）与安全校验要注意什么？",
      back: "1) Webhook 幂等防重：Perforce/Jenkins 重试回调可能重复发同一 CL，需用 `(project, table, cl)` 唯一索引 + Upsert，并校验 Webhook Secret 签名防伪造；\n2) RBAC 多租户权限：按“用户 -> 角色（管理员/QA/策划/只读）-> 项目空间 -> 菜单与操作权限”隔离，前后端双重校验（前端控路由/按钮显隐，后端 JWT/Session 中间件强鉴权）；\n3) 自动化输入防注入：严格校验路径参数（防目录穿越 `../`）和 MongoDB 查询参数类型（防 NoSQL 注入）。",
      golden: "面试金句：内部工具升格为多项目平台，必须补齐“签名验权 + 唯一索引幂等 + 后端强 RBAC”三道安全门。"
    },

    // 4. 服务端弱网、压测与防刷安全 (4)
    {
      id: "fc-srv-1",
      cat: "服务端弱网、压测与防刷安全",
      difficulty: "核心必背",
      front: "游戏服务器压测（Load / Stress Testing）的核心指标有哪些？机器人压测是怎么搭建的？",
      back: "核心指标：\n• 吞吐与容量：在线并发数（CCU）、每秒请求数（QPS / TPS）；\n• 响应质量：平均延迟、TP95 / TP99 延迟（99% 请求的响应上限）、错误率/超时率；\n• 资源水位：服务端 CPU、内存、GC 停顿、数据库 QPS/慢查询、网络带宽。\n\n压测机器人原理：剥离渲染与客户端引擎，直接按游戏网络协议（TCP/UDP/KCP + Protobuf）用 Go/Python 编写无头模拟客户端，按真实玩家行为权重编排剧本（登录->移动同步->进本战斗->背包消耗->聊天），单机即可模拟数千并发，阶梯加压找到系统拐点（崩溃或 TP99 飙升的临界 CCU）。",
      golden: "面试金句：游戏压测不是单接口 HTTP 洪泛，而是带长连接状态机的无头协议机器人模拟真实业务混合模型找容量拐点。"
    },
    {
      id: "fc-srv-2",
      cat: "服务端弱网、压测与防刷安全",
      difficulty: "高频考题",
      front: "为什么服务端接口要讲“幂等性”和“分布式锁”？在游戏背包/商店/领奖场景出问题会怎样？",
      back: "• 场景痛点：玩家弱网下狂点“领取邮件奖励”或“分解装备”，客户端 100ms 内发出 3 个相同协议包，若服务端无并发控制，3 个协程同时读到“未领取”并同时发奖 -> 线上严重刷道具（双花事故）！\n• 防御机制：\n  1) 请求带唯一业务序列号（ReqID/TransactionID）做幂等去重；\n  2) 按玩家 UID 加内存串行队列或分布式锁（Redis/Actor 单线程模型），确保同一玩家的资产变更严格串行化执行。",
      golden: "面试金句：测经济与背包系统必做“弱网同帧并发重放”，专门检验服务端对同一 UID 的资产操作有没有串行锁和幂等防重。"
    },
    {
      id: "fc-srv-3",
      cat: "服务端弱网、压测与防刷安全",
      difficulty: "高频考题",
      front: "客户端可信度原则是什么？为什么绝区零会出现“点 ESC 导致道具冷却时间异常”这类线上 Bug？",
      back: "• 核心原则：“Never Trust The Client（永不信任客户端）”。客户端只负责表现预测与输入上报，核心伤害结算、冷却到期、背包扣减、掉落判定必须以服务端权威时间（Server UTC）和权威状态为准。\n• 冷却异常根因：当道具冷却错误依赖客户端本地 `DeltaTime` 累加，或暂停菜单（ESC）修改了全局 `TimeScale` 却未和服务端时间戳对齐，就会出现暂停白嫖冷却或计时错乱。",
      golden: "面试金句：所有涉及倒计时、CD 和消耗的逻辑，测试第一刀就是切 ESC 暂停、切后台和改本地时钟，验证它是不是绑死了客户端帧时间。"
    },
    {
      id: "fc-srv-4",
      cat: "服务端弱网、压测与防刷安全",
      difficulty: "基础必知",
      front: "游戏常用的网络传输协议 TCP、UDP、KCP 各自有什么特点？对弱网测试有什么指导意义？",
      back: "• TCP：可靠有序，但弱网丢包会触发队头阻塞（Head-of-Line Blocking）和指数退避重传，适合登录、背包、商店、邮件、聊天等强一致系统；\n• UDP：无连接极低延迟但不可靠乱序，适合实时语音或高频非关键同步；\n• KCP（基于 UDP 的快速可靠协议）：以多耗 10%~20% 带宽换取比 TCP 低 30%~40% 的平均延迟，常用于 ARPG/MOBA 实时战斗同步。\n• 测试指导：弱网测系统/背包重点测“重传幂等与超时重连态”，测战斗重点测“高抖动（Jitter）下的位置拉回/技能吞输入/受击错位”。",
      golden: "面试金句：同样是弱网，系统/经济模块重点测丢包重传与幂等，动作战斗模块重点测延迟抖动（Jitter）下的同步拉扯。"
    },

    // 5. AI Agent 与 VLM 测开工程化 (4)
    {
      id: "fc-ai-1",
      cat: "AI Agent 与 VLM 测开工程化",
      difficulty: "冲刺加分",
      front: "如果要给你的 DataTable 变更检测系统升级成“AI 质量风险评估 Agent”，怎么设计架构才不是玩具？",
      back: "四步确定性工程闭环：\n1) 结构化输入（绝不喂原始大文件）：只喂 DeepDiff 提取的精简变更摘要 + 字段业务 Schema 注释；\n2) RAG 知识检索：按表名/模块从向量库检索历史线上 Bug（如这 4,134 条逃逸案例）与历史测试 Checklist；\n3) 强约束结构化输出（JSON Schema / Function Calling）：强制模型输出 `{risk_level, impact_modules, boundary_test_points, recommended_auto_cases}`；\n4) 闭环评估与人工反馈：推送到飞书卡片附“有用/误报”点赞点踩按钮，沉淀评测集持续优化 Prompt 与检索召回率。",
      golden: "面试金句：工业级 QA Agent 的核心不是换最强模型，而是“精简结构化上下文 + 历史 Bug RAG + JSON Schema 强约束输出 + 人工反馈评测集”。"
    },
    {
      id: "fc-ai-2",
      cat: "AI Agent 与 VLM 测开工程化",
      difficulty: "冲刺加分",
      front: "在游戏自动化测试中，多模态大模型（VLM）相比传统 OpenCV/Poco 的优势与边界是什么？",
      back: "• 传统 Poco 痛点：强依赖控件树且需植入 SDK（非侵入包体用不了），UI 改版即失效；\n• 传统 OpenCV 痛点：模板匹配对分辨率、光影、特效、动态角色极其脆弱，且无法理解语义级异常（如“文字被图标盖住”、“人物穿模进墙里”、“中文界面混入英文 Key”）；\n• VLM 最佳定位：做**低频、高价值的“语义级视觉裁判”**（对关键界面/演出抽帧巡检穿模、排版错乱、图文不符、贴图丢失），而高频基础点击/黑屏/帧率判定仍由轻量级规则+CV/OCR 完成，兼顾成本与速度。",
      golden: "面试金句：CV/OCR 负责快、准、省的确定性检查，VLM 负责传统算法写不出规则的语义级渲染与排版异常巡检，二者分层互补。"
    },
    {
      id: "fc-ai-3",
      cat: "AI Agent 与 VLM 测开工程化",
      difficulty: "高频考题",
      front: "怎么解决 AI 生成测试用例或分析 Bug 时的“幻觉问题（编造不存在的字段、泛泛而谈）”？",
      back: "防幻觉四板斧：\n1) Grounding（事实锚定）：所有字段名、枚举值、代码片段必须来自真实检索上下文，并在 Prompt 中要求输出引用来源（Citation）；\n2) 工具校验（Tool Verification）：Agent 输出的用例或配置检查规则，先经过确定性 Python 校验器核对字段/ID 是否真实存在，不存在自动打回重试（Self-Correction）；\n3) 少样本示范（Few-shot）：提供本团队最标准的 3 条高分用例/风险分析范本约束颗粒度；\n4) 离线评测集（Eval）：用 50 条历史真实需求和线上逃逸 Bug 跑离线回归，量化精确率（Precision）与漏报率（Recall）。",
      golden: "面试金句：对抗 AI 幻觉不能靠祈祷 Prompt，必须靠“RAG 锚定 + 确定性代码校验器 + 离线历史 Bug 评测集”。"
    },
    {
      id: "fc-ai-4",
      cat: "AI Agent 与 VLM 测开工程化",
      difficulty: "基础概念",
      front: "LangGraph / ReAct Agent 的核心工作流是什么？在测试开发场景中适合解决什么问题？",
      back: "• ReAct（Reason + Act）循环：模型思考下一步 -> 调用外部工具（查日志/查配置表/拉 Git Diff/跑接口）-> 观察返回结果 -> 决定继续深挖还是输出结论；\n• LangGraph 价值：把不可控的自由对话编排成确定性的**有向状态图（Stateful Graph）**，支持条件路由、循环上限防死循环、人工审批断点（Human-in-the-loop）；\n• 测开最佳场景：线上报错自动初步归因（收到报警 -> 自动拉崩溃堆栈 -> 检索最近 24h P4/Git 提交与 DataTable Diff -> 关联相似历史单 -> 输出疑似引入 CL 推送研发）。",
      golden: "面试金句：测开用 Agent 的本质是把“查日志->查提交->查历史单”这套资深 QA 的排查 SOP 编排成可调用工具的状态图。"
    },

    // 6. 主机与多端兼容性红线 (4)
    {
      id: "fc-plat-1",
      cat: "主机与多端兼容性红线",
      difficulty: "拓展加分",
      front: "PS5（TRC）/ Xbox（XR）主机提审最常见的几条基础合规红线有哪些？",
      back: "哪怕不是纯主机专项，懂这 5 条就能在跨端项目面试脱颖而出：\n1) 手柄断连处理：游戏进行中手柄断电/断开必须合理提示暂停，重连后焦点与操控无缝恢复；\n2) 账号与用户切换：主机切换/登出本地账号或断网，必须安全退回标题页且绝不串档；\n3) 平台术语与键位图标：严禁在 PS5 界面出现 Xbox 的 A/B/X/Y 或 PC 的“按 ESC/鼠标点击”字样（跨平台公告高频踩雷！）；\n4) 系统休眠/待机唤醒（Suspend/Resume）：待机数小时唤醒后网络重连、音频与时间同步不可卡死；\n5) 存档损坏与存储空间不足时的友好兜底提示。",
      golden: "面试金句：主机合规最核心的是“严禁跨平台键位文案串味”和“系统级打断（断柄/休眠/切号）后的安全收口”。"
    },
    {
      id: "fc-plat-2",
      cat: "主机与多端兼容性红线",
      difficulty: "高频考题",
      front: "移动端兼容性测试（iOS / Android）机型成千上万，如何科学选出最小高覆盖的 Top 机型矩阵？",
      back: "四维正交选型（通常 8~12 台即可覆盖 85%+ 线上风险）：\n1) GPU/SoC 芯片架构全覆盖（核心！）：高通骁龙（Adreno）、联发科天玑（Mali/Immortalis，终末地就曾爆天玑 9300-9500 黑屏！）、华为麒麟、苹果 A 系列；\n2) OS 大版本边界：最新正式/Beta 系统（如 Android 14/15、最新 iOS，易出权限与闪退）+ 最低支持系统；\n3) 内存与性能梯队：最低支持内存门槛机（如 4GB/6GB 压测 OOM）+ 主流中端机 + 旗舰高刷机；\n4) 屏幕异形适配：全面屏/灵动岛、超宽屏、折叠屏展开/折叠动态切换与平板横竖屏。",
      golden: "面试金句：移动端兼容不是盲目堆机型数量，核心是按“芯片 GPU 家族 × OS 大版本边界 × 最低内存红线 × 异形屏”正交覆盖。"
    },
    {
      id: "fc-plat-3",
      cat: "主机与多端兼容性红线",
      difficulty: "高频考题",
      front: "多端游戏（PC/移动端）做“键鼠 ↔ 手柄热切换”测试时，内部底层最容易出哪三类 Bug？",
      back: "结合四款游戏公告实证，热切换高频三宗罪：\n1) UI 重建导致状态丢失：切换输入模式触发了 HUD 重绘，导致正在运行的玩法倒计时消失（终末地 2026-07-16 真实 Bug）或输入框内容清空；\n2) 动效/事件重复触发：输入模式变更回调错误重新派发了选中事件，导致探测器标记动效重复播放；\n3) 焦点与光标互斥锁死：鼠标隐藏但手柄焦点未挂载到当前弹窗，导致玩家既看不到鼠标又按不动手柄，只能强杀进程。",
      golden: "面试金句：热切换最狠的测法不是在静止主界面切，而是卡在“倒计时玩法、强引导弹窗、标记选中态”进行中高频切输入设备。"
    },
    {
      id: "fc-plat-4",
      cat: "主机与多端兼容性红线",
      difficulty: "基础概念",
      front: "什么是游戏本地化（L10n）测试中的“伪本地化（Pseudo-Localization）”？它能提前拦截哪些多语言 Bug？",
      back: "在正式翻译完成前，用脚本把中文/英文自动拉长 30%~50% 并加上特殊重音符和首尾标记（如 `[Šţàŕţ Ġàɱè~~~]`）灌进包体跑一遍：\n• 立刻暴露 UI 文本框未做自适应导致的截断、换行重叠与爆框（德语/俄语/法语普遍比中文长 2 倍）；\n• 立刻暴露写死在代码里未走多语言表的硬编码字符串（没变伪字符的都是漏配）；\n• 立刻暴露字体库缺字（方块豆腐块 □）和占位符 `%s / {0}` 顺序错乱。",
      golden: "面试金句：崩铁单版本曾修 13 国语言文本，靠伪本地化 + 静态长度检查左移，比人肉切 13 种语言点 UI 效率高十倍。"
    }
  ],

  nonIntrusivePlan: {
    complianceNotice: "【严格合规与反作弊红线】面对原神、崩铁、绝区零、终末地四款真实线上商业客户端包体，方案坚持 100% 非侵入黑盒观测原则：严禁任何内存读写、DLL 注入、Hook、封包篡改、驱动级模拟或挂机刷资源行为；仅使用外部屏幕视觉采集（DXGI/MSS）、外部性能观测（PresentMon/psutil）、受控网络模拟与单人合法测试账号的 UI/渲染/启动/多端体验巡检，完全符合安全合规规范，且正是大厂面谈“无源码黑盒巡检/外包验收/线上监控”的极佳工程作品集！",
    architecture: [
      {
        layer: "Layer 1 · 外部零侵入采集层",
        tech: "dxcam / mss (DXGI 高速截屏) + PresentMon (DX11/12 帧时间采集) + psutil (CPU/内存/进程存活) + Windows CrashDump 监听",
        detail: "完全运行在游戏进程外部，零 SDK 注入，毫秒级采集画面帧与 1% Low FPS / FrameTime / 内存水位，自动检测客户端异常闪退与退出码。"
      },
      {
        layer: "Layer 2 · 视觉与语义断言引擎",
        tech: "OpenCV (黑屏/花屏/SSIM冻结检测) + RapidOCR / PaddleOCR (文本截断/倒计时/Key漏出) + 模板匹配 (手柄图标切换) + VLM 抽帧裁判",
        detail: "将四款游戏公告中的高频逃逸缺陷转化为自动化断言规则：黑屏闪烁、画面冻结、UI 图标缺失、倒计时消失、文本溢出、多端键位提示错乱。"
      },
      {
        layer: "Layer 3 · 受控状态机驱动层（轻量安全）",
        tech: "基于纯图像状态机（FSM）的菜单/界面巡检脚本 + 外部弱网工具（Clumsy CLI）联动",
        detail: "仅面向非对抗、非牟利的公共菜单/设置/背包/地图/拍照/登录热更流程做确定性遍历与弱网重连弹窗验证，绝不触碰战斗外挂/自动打怪刷资源红线。"
      },
      {
        layer: "Layer 4 · 标准化 JSON 上报与 GitHub Pages 展示",
        tech: "Python Runner 输出标准 JSON (`web/data/automation-runs.json`) -> GitHub Actions 自动部署 -> 本站“自动化数据看板”实时渲染趋势与异常截图",
        detail: "把你在简历里的“Python + Web 展示 + 报告闭环”真正做成面试官打开网页就能看到的活作品集！"
      }
    ],
    gameScenarios: [
      {
        game: "原神（PC 线上客户端）",
        badge: "大世界 · UI/相机/热切换",
        scenarios: [
          "冷启动 -> 版本检查 -> 进大世界全链路耗时基线与黑屏/卡死（SSIM > 0.999 持续 15s）自动告警",
          "主菜单 / 背包 / 角色 / 冒险手册 / 拍照界面遍历：OCR 检测文本溢出、未翻译 Key 及模型加载空白",
          "PC 键鼠 ↔ 手柄切换视觉验收：通过模板匹配检测界面右下角/底部按键 Prompt 是否同步刷新、界面是否残影",
          "固定锚点跑图/传送加载期间 PresentMon 采集 1% Low FPS 与 FrameTime > 50ms 卡顿毛刺统计"
        ],
        mappedOnlineBug: "对应原神 7.1/7.2 手柄浏览异常、模型/UI 表现异常、重连后状态恢复"
      },
      {
        game: "崩坏：星穹铁道（PC 线上客户端）",
        badge: "多系统 UI · 弱网重连",
        scenarios: [
          "多系统界面巡检（手机菜单 / 角色 / 遗器 / 指南 / 活动页）：OCR + 布局边缘检测，批量抓取文本截断、错位、红点残影",
          "多语言切换验证（简中 ↔ 英文/日文）：同界面双语截图自动对比与超长文本溢出预警",
          "外部弱网（Clumsy 注入 30% 丢包 / 5s 断网）下的重连弹窗识别 -> 断网恢复后主界面可交互性恢复校验",
          "高特效演示/试用关卡 PresentMon 帧率稳定性与显存/内存（psutil）长稳水位曲线记录"
        ],
        mappedOnlineBug: "对应崩铁 13 国语言文本溢出、网络波动对话/界面异常、手柄交互异常"
      },
      {
        game: "绝区零（PC 线上客户端）",
        badge: "高帧率性能 · 多分辨率",
        scenarios: [
          "VR 训练场 / 街区固定视角 PresentMon 高精度帧时间分布分析（P50 / P95 / P99 / 1% Low FPS 对比不同版本劣化）",
          "16:9 / 21:9 带鱼屏 / 窗口化动态缩放下的 UI 裁切检测（边缘像素裁剪 & 关键按钮可见性 OCR 校验）",
          "界面菜单 / ESC 暂停切出切回前后，OCR 校验界面倒计时/状态文案是否异常跳变或冻结",
          "动态壁纸 / 代理人展示界面抽帧送入 VLM 检查头发/眼睛/特效明显渲染异常与紫红缺贴图检测"
        ],
        mappedOnlineBug: "对应绝区零 3.2/3.3 ESC 暂停倒计时/CD 异常、分辨率拍照 UID 丢失、动态壁纸表现异常"
      },
      {
        game: "明日方舟：终末地（PC 线上客户端）",
        badge: "启动稳定 · 地图与手柄",
        scenarios: [
          "版本更新日冷启动 + 热更新全流程监控：自动捕获启动闪退、进程非正常退出码与 CrashDump 文件",
          "地图打开 / 缩放 / 标记筛选切换视觉巡检：检测底图丢失（纯色面积占比超阈值）、图标闪烁（帧间方差异常）",
          "界面操作中途键鼠 ↔ 手柄切换检测：校验倒计时文本区域 OCR 是否凭空消失、按键提示文案是否错乱",
          "编队改名/备注输入框边界字符测试 + VLM 辅助审查界面图标重叠/发光过曝异常"
        ],
        mappedOnlineBug: "对应终末地启动闪退、地图底图/标记异常、手柄热切换倒计时消失、编队字符上限异常"
      }
    ],
    pythonSnippet: `# non_intrusive_runner.py — 零侵入外部观测与标准 JSON 报告输出骨架
import json, time, datetime
import cv2, numpy as np, psutil  # 另可配合 dxcam / rapidocr_onnxruntime / PresentMon CLI

def detect_visual_anomaly(frame_bgr):
    """确定性 CV 检查：黑屏 / 纯色卡死 / 紫红缺贴图（UE/Unity 常见 Missing Material）"""
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    mean_luma, std_luma = float(gray.mean()), float(gray.std())
    if mean_luma < 5.0 and std_luma < 3.0:
        return {"pass": False, "type": "BLACK_SCREEN", "detail": f"mean={mean_luma:.1f}, std={std_luma:.1f}"}
    hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
    # 紫红色缺贴图色域 (H: 140~165, S>150, V>150)
    magenta_mask = cv2.inRange(hsv, np.array([140, 150, 150]), np.array([165, 255, 255]))
    magenta_ratio = float(np.count_nonzero(magenta_mask)) / magenta_mask.size
    if magenta_ratio > 0.03:
        return {"pass": False, "type": "MISSING_TEXTURE_MAGENTA", "detail": f"ratio={magenta_ratio:.2%}"}
    return {"pass": True, "type": "OK", "detail": f"luma={mean_luma:.1f}"}

def export_run_report(run_record, output_path="web/data/automation-runs.json"):
    """追加写入标准 JSON，git push 后 GitHub Pages 看板自动展示"""
    with open(output_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["runs"].insert(0, run_record)
    data["updatedAt"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)`
  }
};
