(function () {
  const STORAGE_KEY_MASTERY = "qa_prep_mastered_v1";
  const STORAGE_KEY_THEME = "qa_prep_theme_v1";

  function safeGet(k, fallback) {
    try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch {}
  }

  const state = {
    activeTab: "overview",
    jobTier: "ALL",
    jobCompany: "ALL",
    introTab: window.DATA_JOBS.selfIntros[0].id,
    onlineGame: "ALL",
    tcModule: "ALL",
    searchQuery: "",
    mastered: new Set(JSON.parse(safeGet(STORAGE_KEY_MASTERY, "[]")))
  };

  const SECTION_TITLES = {
    overview: "总览仪表盘 · 个人画像与数据洞察",
    jobs: "岗位精准匹配 · 27 个官方 JD 全景评估",
    intro: "个人介绍话术库 · 3 套高分场景模板",
    qa: "工作经历 6 层深度追问 · 30 道通关题库",
    online: "线上逃逸 Bug 补齐 · 4,134 条公告提炼与必考题",
    methods: "游戏测试方法论 & 实战用例库"
  };

  function saveMastery() {
    safeSet(STORAGE_KEY_MASTERY, JSON.stringify([...state.mastered]));
    updateMasteryUI();
  }

  function getTotalQuestionIds() {
    const ids = [];
    window.DATA_QA.forEach(t => t.layers.forEach(l => ids.push(`${t.id}-${l.layer}`)));
    window.DATA_ONLINE.interviewQAs.forEach(q => ids.push(q.id));
    return ids;
  }

  function updateMasteryUI() {
    const allIds = getTotalQuestionIds();
    const done = allIds.filter(id => state.mastered.has(id)).length;
    const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;
    const label = document.getElementById("mastery-text");
    const bar = document.getElementById("mastery-bar");
    if (label) label.textContent = `${done} / ${allIds.length} (${pct}%)`;
    if (bar) bar.style.width = `${pct}%`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function switchSection(secId) {
    state.activeTab = secId;
    document.querySelectorAll(".section-view").forEach(el => el.classList.remove("active"));
    const target = document.getElementById(`view-${secId}`);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sec === secId);
    });
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = SECTION_TITLES[secId] || "";

    document.getElementById("sidebar")?.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- Radar SVG ---------- */
  function renderRadarSVG(items) {
    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 96;
    const count = items.length;
    const levels = [25, 50, 75, 100];

    const pointAt = (i, r) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    let gridSvg = "";
    levels.forEach(lv => {
      const r = (lv / 100) * maxR;
      const pts = items.map((_, i) => pointAt(i, r).join(",")).join(" ");
      gridSvg += `<polygon points="${pts}" fill="none" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="${lv === 100 ? "" : "3,3"}" />`;
    });

    let axisSvg = "";
    let labelSvg = "";
    items.forEach((it, i) => {
      const [x, y] = pointAt(i, maxR);
      axisSvg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border-strong)" stroke-width="1" />`;
      const [lx, ly] = pointAt(i, maxR + 24);
      const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
      labelSvg += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="var(--text-secondary)" font-size="11.5" font-weight="600">${escHtml(it.label)} (${it.value})</text>`;
    });

    const dataPts = items.map((it, i) => pointAt(i, (it.value / 100) * maxR));
    const polyPts = dataPts.map(p => p.join(",")).join(" ");
    const dotsSvg = dataPts
      .map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--primary)" stroke="var(--bg-elev)" stroke-width="2" />`)
      .join("");

    return `
      <svg viewBox="-38 0 ${size + 76} ${size}" style="width:100%;max-width:390px;display:block;margin:0 auto;">
        ${gridSvg}
        ${axisSvg}
        <polygon points="${polyPts}" fill="var(--primary-soft)" stroke="var(--primary)" stroke-width="2.2" />
        ${dotsSvg}
        ${labelSvg}
      </svg>`;
  }

  /* ---------- Stacked Pattern Bars ---------- */
  function renderPatternBars(stats) {
    const maxVal = Math.max(...stats.map(s => s.ys + s.sr + s.zzz + s.zmd));
    const legend = `
      <div class="legend-row">
        <span><i class="legend-dot" style="background:#3b82f6"></i>原神 (2,022)</span>
        <span><i class="legend-dot" style="background:#8b5cf6"></i>崩铁 (1,613)</span>
        <span><i class="legend-dot" style="background:#f59e0b"></i>绝区零 (367)</span>
        <span><i class="legend-dot" style="background:#10b981"></i>终末地 (132)</span>
      </div>`;
    const rows = stats
      .map(s => {
        const total = s.ys + s.sr + s.zzz + s.zmd;
        const w = v => ((v / maxVal) * 100).toFixed(2) + "%";
        return `
          <div class="bar-row">
            <div style="color:var(--text-secondary);font-weight:500;">${escHtml(s.label)}</div>
            <div class="bar-track" title="原神 ${s.ys} | 崩铁 ${s.sr} | 绝区零 ${s.zzz} | 终末地 ${s.zmd}">
              <div class="bar-seg" style="width:${w(s.ys)};background:#3b82f6"></div>
              <div class="bar-seg" style="width:${w(s.sr)};background:#8b5cf6"></div>
              <div class="bar-seg" style="width:${w(s.zzz)};background:#f59e0b"></div>
              <div class="bar-seg" style="width:${w(s.zmd)};background:#10b981"></div>
            </div>
            <div style="text-align:right;font-weight:700;color:var(--text);">${total}</div>
          </div>`;
      })
      .join("");
    return legend + rows;
  }

  /* ---------- Render Overview ---------- */
  function renderOverview() {
    const p = window.DATA_JOBS.profileSummary;
    const sJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "S");
    const aJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "A");
    const html = `
      <div class="callout success">
        <strong>核心战略定位：</strong>${escHtml(p.positioning)}（${escHtml(p.years)}）。
        你的绝对差异化优势在于 <strong>UE 质量工具链全链路闭环 + 白盒读 Lua/服务端代码定位 + 商业大作跨端支援</strong>；最大短板是主项目为在研项目、缺少长线线上运维实战——本页面已通过 <strong>4 款顶级游戏 4,134 条真实线上逃逸 Bug</strong> 完成体系化补齐。
      </div>

      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-label">首选 S 级投递岗</div>
          <div class="kpi-value" style="color:var(--success)">${sJobs.length} 个</div>
          <div class="kpi-sub">鹰角 UE 测开 (95%) / 系统向 (90%) / 工具向 (86%)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">强力 A 级投递岗</div>
          <div class="kpi-value" style="color:var(--primary)">${aJobs.length} 个</div>
          <div class="kpi-sub">绝区零 / 崩铁 / 星布谷地 / 原神 / 源初之结专项</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">深度面试追问库</div>
          <div class="kpi-value" style="color:var(--accent)">36 题</div>
          <div class="kpi-sub">5 专题 × 6 层递进追问 (30) + 线上必考 (6)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">线上逃逸 Bug 样本</div>
          <div class="kpi-value">4,134 条</div>
          <div class="kpi-sub">覆盖原神 / 崩铁 / 绝区零 / 终末地 111 篇公告</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">个人能力六维雷达图 <span class="pill pill-a">UE + 工具 + 白盒</span></h3>
          ${renderRadarSVG(p.radar)}
        </div>
        <div class="card">
          <h3 class="card-title">四款游戏 4,134 条线上逃逸 Bug 高频模式</h3>
          ${renderPatternBars(window.DATA_ONLINE.summary.patternStats)}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">核心竞争力优势（面试必打王牌）</h3>
          <ul style="margin:0;padding-left:18px;">
            ${p.strengths.map(s => `<li style="margin-bottom:8px;">${escHtml(s)}</li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <h3 class="card-title">客观短板与破局策略</h3>
          <ul style="margin:0;padding-left:18px;">
            ${p.gaps.map(g => `<li style="margin-bottom:8px;">${escHtml(g)}</li>`).join("")}
          </ul>
          <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="window.__goSec('jobs')">查看 27 个岗位匹配详情 -></button>
            <button class="btn btn-sm" onclick="window.__goSec('qa')">开始 6 层追问演练 -></button>
            <button class="btn btn-sm" onclick="window.__goSec('online')">复习线上逃逸案例 -></button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("view-overview").innerHTML = html;
  }

  /* ---------- Render Jobs ---------- */
  function renderJobs() {
    const jobs = window.DATA_JOBS.jobs;
    const filtered = jobs.filter(j => {
      if (state.jobTier !== "ALL" && j.tier !== state.jobTier) return false;
      if (state.jobCompany !== "ALL" && j.company !== state.jobCompany) return false;
      return true;
    });

    const tierMeta = {
      S: { cls: "pill-s", text: "S 级 · 首选必投" },
      A: { cls: "pill-a", text: "A 级 · 强力推荐" },
      B: { cls: "pill-b", text: "B 级 · 谨慎备选" },
      C: { cls: "pill-c", text: "C 级 · 建议避坑" }
    };

    const html = `
      <div class="callout">
        <strong>投递策略建议（双线精准投放）：</strong>
        <br/>• <strong>鹰角网络</strong>：优先锁定 UE 引擎生态——<strong>第一志愿「游戏测试开发工程师-(UE项目) 95%」</strong>，第二志愿「资深游戏测试工程师—系统向(UE项目) 90%」或「资深测开-工具/Agent向 86%」。
        <br/>• <strong>米哈游</strong>：优先投递<strong>「游戏测试工程师-绝区零 (84%)」「崩坏：星穹铁道 (82%)」「星布谷地 (81%)」「原神 (80%)」</strong>，以及自动化方向强匹配的<strong>「资深游戏测试工程师(专项向)-源初之结 (79%)」</strong>。
        <br/>• <strong>主动避坑</strong>：5年+硬门槛负责人岗、纯底层图形/渲染/鸿蒙性能调优岗、主机深度提审岗与 Golang/Vue 全栈平台岗（匹配度低于 55%）。
      </div>

      <div class="filter-bar">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">推荐等级：</span>
        ${["ALL", "S", "A", "B", "C"].map(t => `
          <button class="filter-chip ${state.jobTier === t ? "active" : ""}" data-tier="${t}">
            ${t === "ALL" ? `全部 (${jobs.length})` : `${t} 级 (${jobs.filter(j => j.tier === t).length})`}
          </button>`).join("")}
        <span style="margin-left:8px;font-size:13px;font-weight:700;color:var(--text-muted);">公司：</span>
        ${["ALL", "鹰角网络", "米哈游"].map(c => `
          <button class="filter-chip ${state.jobCompany === c ? "active" : ""}" data-comp="${c}">
            ${c === "ALL" ? "全部公司" : c}
          </button>`).join("")}
      </div>

      <div>
        ${filtered.map(j => {
          const tm = tierMeta[j.tier];
          const barColor = j.tier === "S" ? "var(--success)" : j.tier === "A" ? "var(--primary)" : j.tier === "B" ? "var(--warning)" : "var(--danger)";
          return `
            <div class="job-card tier-${j.tier}">
              <div class="job-head">
                <div>
                  <div class="job-title-row">
                    <span class="pill ${tm.cls}">${tm.text}</span>
                    <span class="pill pill-muted">${escHtml(j.company)}</span>
                    <span class="pill pill-purple">${escHtml(j.direction)}</span>
                    <h3 class="job-title">${escHtml(j.title)}</h3>
                  </div>
                  <div style="font-size:12.5px;color:var(--text-muted);margin-top:5px;">
                    年限要求：${escHtml(j.expReq)} &nbsp;|&nbsp; <a href="${escHtml(j.url)}" target="_blank" rel="noopener">查看官方职位原帖 ↗</a>
                  </div>
                </div>
                <div class="score-bar-wrap">
                  <div style="flex:1;">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">综合匹配度</div>
                    <div class="progress-track"><div class="progress-fill" style="width:${j.score}%;background:${barColor}"></div></div>
                  </div>
                  <div class="score-num" style="color:${barColor}">${j.score}%</div>
                </div>
              </div>
              <div class="job-cols">
                <div>
                  <div class="job-col-label" style="color:var(--success)">核心命中点</div>
                  <ul style="margin:0;padding-left:16px;">${j.hits.map(h => `<li>${escHtml(h)}</li>`).join("")}</ul>
                </div>
                <div>
                  <div class="job-col-label" style="color:var(--warning)">主要短板/风险</div>
                  <ul style="margin:0;padding-left:16px;">${j.gaps.map(g => `<li>${escHtml(g)}</li>`).join("")}</ul>
                </div>
                <div>
                  <div class="job-col-label" style="color:var(--primary)">投递与简历微调建议</div>
                  <div>${escHtml(j.advice)}</div>
                </div>
              </div>
            </div>`;
        }).join("")}
      </div>
    `;

    const container = document.getElementById("view-jobs");
    container.innerHTML = html;
    container.querySelectorAll("[data-tier]").forEach(b => {
      b.addEventListener("click", () => { state.jobTier = b.dataset.tier; renderJobs(); });
    });
    container.querySelectorAll("[data-comp]").forEach(b => {
      b.addEventListener("click", () => { state.jobCompany = b.dataset.comp; renderJobs(); });
    });
  }

  /* ---------- Render Self Intros ---------- */
  function renderIntro() {
    const intros = window.DATA_JOBS.selfIntros;
    const cur = intros.find(i => i.id === state.introTab) || intros[0];

    const html = `
      <div class="callout">
        <strong>自我介绍设计心法：</strong>不要平铺直叙报流水账，而是用“<strong>标签定位 -> 2~3 个硬核锚点案例（主动埋钩子） -> 坦诚短板与针对性补齐 -> 岗位契合度收尾</strong>”的结构，把面试官引向你最擅长的主场（DataTable Diff、白盒查代码定位、UE 自动化）。
      </div>

      <div class="tab-bar">
        ${intros.map(it => `
          <button class="tab-btn ${it.id === cur.id ? "active" : ""}" data-intro="${it.id}">${escHtml(it.label)}</button>
        `).join("")}
      </div>

      <div class="card">
        <div class="card-title">
          <div>
            <span>${escHtml(cur.label)}</span>
            <div style="font-size:12.5px;font-weight:400;color:var(--text-muted);margin-top:3px;">
              适用场景：${escHtml(cur.target)} &nbsp;|&nbsp; 预计口述时长：<strong>${escHtml(cur.duration)}</strong>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="copy-intro-btn">一键复制话术</button>
        </div>

        <div class="script-box">${escHtml(cur.script)}</div>

        <h4 style="margin:18px 0 8px;font-size:14.5px;">话题“埋钩子”拆解（如何引导面试官按你的节奏追问）</h4>
        <div class="hook-list">
          ${cur.hooks.map(h => `
            <div class="hook-item">
              <div style="font-weight:700;color:var(--primary);margin-bottom:4px;">钩子：${escHtml(h.trigger)}</div>
              <div style="color:var(--text-secondary);">${escHtml(h.effect)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const container = document.getElementById("view-intro");
    container.innerHTML = html;
    container.querySelectorAll("[data-intro]").forEach(btn => {
      btn.addEventListener("click", () => { state.introTab = btn.dataset.intro; renderIntro(); });
    });
    document.getElementById("copy-intro-btn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(cur.script).then(() => {
        const b = document.getElementById("copy-intro-btn");
        if (b) { b.textContent = "已复制到剪贴板 ✓"; setTimeout(() => (b.textContent = "一键复制话术"), 1800); }
      });
    });
  }

  /* ---------- Render 6-Layer QA ---------- */
  function renderQA() {
    const html = `
      <div class="callout">
        <strong>交互式 6 层递进通关演练：</strong>覆盖简历全部 5 大核心板块，每个板块拆解 <strong>L1 基础架构/事实 -> L2 关键细节/选型 -> L3 踩坑与深水区 -> L4 容错/协作/扩展 -> L5 工程度量/体系化 -> L6 高阶演进/AI与中台视野</strong> 共 6 层追问。点击任意问题展开答案，或点击“模拟下一层追问”逐级攻克并勾选“已掌握”。
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn btn-primary btn-sm" id="qa-expand-all">展开全部 30 题</button>
        <button class="btn btn-sm" id="qa-collapse-all">收起全部（仅保留 L1）</button>
      </div>

      ${window.DATA_QA.map(track => `
        <div class="track-card" data-track="${track.id}">
          <div class="track-header">
            <div>
              <h3 style="margin:0 0 5px;font-size:16px;">${escHtml(track.title)}</h3>
              <div style="font-size:12.5px;color:var(--text-muted);">
                <span class="pill pill-purple" style="margin-right:6px;">${escHtml(track.tag)}</span>
                对应经历：${escHtml(track.resumeRef)}
              </div>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm btn-next-layer" data-tid="${track.id}">模拟下一层追问 ↓</button>
              <button class="btn btn-sm btn-toggle-track" data-tid="${track.id}">展开/收起本专题</button>
            </div>
          </div>

          <div class="layer-stepper">
            ${track.layers.map((l, idx) => {
              const qid = `${track.id}-${l.layer}`;
              const isMastered = state.mastered.has(qid);
              return `
                <div class="layer-node ${idx === 0 ? "open" : ""} ${isMastered ? "mastered" : ""}" data-layer="${l.layer}" data-qid="${qid}">
                  <div class="layer-head">
                    <div class="layer-q">${escHtml(l.layer)} 追问：${escHtml(l.q)}</div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;cursor:pointer;" onclick="event.stopPropagation()">
                        <input type="checkbox" class="mastery-chk" data-qid="${qid}" ${isMastered ? "checked" : ""} /> 已掌握
                      </label>
                    </div>
                  </div>
                  <div class="layer-body">
                    <div class="intent-tag"><strong>面试官考察意图：</strong>${escHtml(l.intent)}</div>
                    <div class="answer-text">${l.answer}</div>
                    <div class="pitfall-tag"><strong>避坑警示：</strong>${escHtml(l.pitfall)}</div>
                  </div>
                </div>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    `;

    const container = document.getElementById("view-qa");
    container.innerHTML = html;

    container.querySelectorAll(".layer-head").forEach(head => {
      head.addEventListener("click", () => {
        head.closest(".layer-node").classList.toggle("open");
      });
    });

    container.querySelectorAll(".mastery-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const qid = chk.dataset.qid;
        const node = chk.closest(".layer-node");
        if (chk.checked) { state.mastered.add(qid); node.classList.add("mastered"); }
        else { state.mastered.delete(qid); node.classList.remove("mastered"); }
        saveMastery();
      });
    });

    container.querySelectorAll(".btn-next-layer").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = container.querySelector(`[data-track="${btn.dataset.tid}"]`);
        const closed = card.querySelector(".layer-node:not(.open)");
        if (closed) {
          closed.classList.add("open");
          closed.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    container.querySelectorAll(".btn-toggle-track").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = container.querySelector(`[data-track="${btn.dataset.tid}"]`);
        const nodes = [...card.querySelectorAll(".layer-node")];
        const allOpen = nodes.every(n => n.classList.contains("open"));
        nodes.forEach((n, i) => n.classList.toggle("open", !allOpen || i === 0));
      });
    });

    document.getElementById("qa-expand-all")?.addEventListener("click", () => {
      container.querySelectorAll(".layer-node").forEach(n => n.classList.add("open"));
    });
    document.getElementById("qa-collapse-all")?.addEventListener("click", () => {
      container.querySelectorAll(".track-card").forEach(c => {
        c.querySelectorAll(".layer-node").forEach((n, i) => n.classList.toggle("open", i === 0));
      });
    });
  }

  /* ---------- Render Online Bugs ---------- */
  function renderOnline() {
    const data = window.DATA_ONLINE;
    const filteredArcs = data.archetypes.filter(a => state.onlineGame === "ALL" || a.games.includes(state.onlineGame));

    const html = `
      <div class="callout warn">
        <strong>如何正确使用本板块补齐“无完整上线经历”短板？</strong>
        <br/>切忌伪造“我参与过这些游戏的线上运维”，而是将其转化为<strong>“基于 4 款顶级商业项目 4,134 条真实线上逃逸缺陷样本的系统复盘”</strong>：在面试被问及线上应急、脏数据补发、多端兼容性与跨版本防回归时，直接给出底层归因、标准 SOP 与可落地的防线方案。
      </div>

      <div class="grid-4">
        ${data.summary.games.map(g => `
          <div class="kpi-card" style="border-top:3px solid ${g.color}">
            <div class="kpi-label">${escHtml(g.name)} · ${g.docs} 篇官方公告</div>
            <div class="kpi-value" style="color:${g.color}">${g.bugs.toLocaleString()} 条</div>
            <div class="kpi-sub">${escHtml(g.note)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:22px 0 12px;font-size:17px;">一、八大高频线上逃逸 Bug 专题（源自真实公告原文）</h3>
      <div class="filter-bar">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">按涉及游戏筛选：</span>
        ${["ALL", "原神", "崩铁", "绝区零", "终末地"].map(g => `
          <button class="filter-chip ${state.onlineGame === g ? "active" : ""}" data-ogame="${g}">
            ${g === "ALL" ? "全部游戏" : g}
          </button>`).join("")}
      </div>

      <div class="grid-2">
        ${filteredArcs.map(a => `
          <div class="card">
            <div class="card-title">
              <span>${escHtml(a.title)}</span>
              <span class="pill pill-c">${escHtml(a.severity)}</span>
            </div>
            <div style="font-size:12.8px;color:var(--success);background:var(--success-soft);padding:7px 10px;border-radius:6px;margin-bottom:10px;">
              <strong>与你个人经历的衔接点：</strong>${escHtml(a.linkToSelf)}
            </div>
            <div style="font-size:13.4px;margin-bottom:10px;">
              <strong>典型技术根因：</strong>${escHtml(a.rootCause)}
            </div>
            <div style="margin-bottom:10px;">
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px;">四款游戏真实线上修复实证：</div>
              ${a.quotes.map(q => `
                <div class="quote-item">
                  <span class="quote-meta">[${escHtml(q.game)} ${escHtml(q.ver)}]</span>${escHtml(q.text)}
                </div>
              `).join("")}
            </div>
            <div style="font-size:13.3px;color:var(--primary);background:var(--primary-soft);padding:8px 10px;border-radius:6px;">
              <strong>测试防线落地：</strong>${escHtml(a.defense)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:26px 0 12px;font-size:17px;">二、线上项目必考面试高频题与高分应答（6 题）</h3>
      <div class="track-card">
        <div class="layer-stepper">
          ${data.interviewQAs.map((item, idx) => {
            const isMastered = state.mastered.has(item.id);
            return `
              <div class="layer-node ${idx === 0 ? "open" : ""} ${isMastered ? "mastered" : ""}" data-layer="Q${idx + 1}" data-qid="${item.id}">
                <div class="layer-head">
                  <div class="layer-q">${escHtml(item.q)}</div>
                  <label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="mastery-chk" data-qid="${item.id}" ${isMastered ? "checked" : ""} /> 已掌握
                  </label>
                </div>
                <div class="layer-body">
                  <div class="intent-tag"><strong>面试官考察意图：</strong>${escHtml(item.intent)}</div>
                  <div class="answer-text">${item.answer}</div>
                </div>
              </div>`;
          }).join("")}
        </div>
      </div>
    `;

    const container = document.getElementById("view-online");
    container.innerHTML = html;

    container.querySelectorAll("[data-ogame]").forEach(b => {
      b.addEventListener("click", () => { state.onlineGame = b.dataset.ogame; renderOnline(); });
    });
    container.querySelectorAll(".layer-head").forEach(h => {
      h.addEventListener("click", () => h.closest(".layer-node").classList.toggle("open"));
    });
    container.querySelectorAll(".mastery-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const qid = chk.dataset.qid;
        const node = chk.closest(".layer-node");
        if (chk.checked) { state.mastered.add(qid); node.classList.add("mastered"); }
        else { state.mastered.delete(qid); node.classList.remove("mastered"); }
        saveMastery();
      });
    });
  }

  /* ---------- Render Methods & Test Cases ---------- */
  function renderMethods() {
    const data = window.DATA_METHODS;
    const modules = ["ALL", ...new Set(data.testCases.map(tc => tc.module))];
    const filteredTCs = data.testCases.filter(tc => state.tcModule === "ALL" || tc.module === state.tcModule);

    const html = `
      <h3 style="margin:0 0 14px;font-size:17px;">一、现代多端大型 3D 游戏八大测试方法论体系</h3>
      <div class="grid-2">
        ${data.methodologies.map(m => `
          <div class="card">
            <div class="card-title">
              <span>${escHtml(m.name)}</span>
              <span class="pill pill-a">${escHtml(m.level)}</span>
            </div>
            <p style="margin:0 0 10px;color:var(--text-secondary);font-size:13.6px;">${escHtml(m.summary)}</p>
            <ol style="margin:0 0 12px;padding-left:18px;font-size:13.4px;">
              ${m.steps.map(st => `<li style="margin-bottom:5px;">${escHtml(st)}</li>`).join("")}
            </ol>
            <div style="font-size:12.5px;color:var(--text-muted);border-top:1px dashed var(--border);padding-top:8px;">
              <strong>实证映射：</strong>${escHtml(m.mappedBugs)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:26px 0 12px;font-size:17px;">二、高价值实战测试用例库（${filteredTCs.length} 条精选核心案例）</h3>
      <div class="filter-bar">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">按模块筛选：</span>
        ${modules.map(mod => `
          <button class="filter-chip ${state.tcModule === mod ? "active" : ""}" data-mod="${mod}">
            ${mod === "ALL" ? `全部模块 (${data.testCases.length})` : mod}
          </button>`).join("")}
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:105px;">编号 / 级别</th>
              <th style="width:170px;">用例名称与自动化分层</th>
              <th style="width:200px;">前置条件</th>
              <th>核心操作步骤</th>
              <th>核心断言与预期结果</th>
              <th style="width:175px;">关联线上逃逸/经历</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTCs.map(tc => `
              <tr>
                <td>
                  <div style="font-weight:700;font-family:monospace;">${escHtml(tc.id)}</div>
                  <div style="margin-top:4px;">
                    <span class="pill ${tc.priority === "P0" ? "pill-c" : "pill-b"}">${escHtml(tc.priority)}</span>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">${escHtml(tc.module)}</div>
                </td>
                <td>
                  <div style="font-weight:700;margin-bottom:6px;">${escHtml(tc.title)}</div>
                  <span class="pill pill-purple">${escHtml(tc.autoLayer)}</span>
                </td>
                <td style="font-size:13px;color:var(--text-secondary);">${escHtml(tc.precondition)}</td>
                <td style="white-space:pre-line;font-size:13px;">${escHtml(tc.steps)}</td>
                <td style="white-space:pre-line;font-size:13px;">${escHtml(tc.expected)}</td>
                <td style="font-size:12.5px;color:var(--primary);">${escHtml(tc.onlineRef)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const container = document.getElementById("view-methods");
    container.innerHTML = html;
    container.querySelectorAll("[data-mod]").forEach(btn => {
      btn.addEventListener("click", () => { state.tcModule = btn.dataset.mod; renderMethods(); });
    });
  }

  /* ---------- Global Search ---------- */
  function runSearch(query) {
    const q = query.trim().toLowerCase();
    const resBox = document.getElementById("search-results");
    if (!q) {
      resBox.style.display = "none";
      resBox.innerHTML = "";
      return;
    }

    const hits = [];
    window.DATA_JOBS.jobs.forEach(j => {
      if ((j.title + j.company + j.direction + j.hits.join("") + j.advice).toLowerCase().includes(q)) {
        hits.push({ sec: "jobs", tag: `岗位 · ${j.tier}级`, title: `${j.company} - ${j.title} (${j.score}%)`, sub: j.advice });
      }
    });
    window.DATA_QA.forEach(t => {
      t.layers.forEach(l => {
        if ((l.q + l.answer + l.intent).toLowerCase().includes(q)) {
          hits.push({ sec: "qa", tag: `6层追问 · ${l.layer}`, title: l.q, sub: t.title });
        }
      });
    });
    window.DATA_ONLINE.archetypes.forEach(a => {
      const txt = a.title + a.rootCause + a.quotes.map(x => x.text).join("");
      if (txt.toLowerCase().includes(q)) {
        hits.push({ sec: "online", tag: "线上逃逸专题", title: a.title, sub: a.rootCause });
      }
    });
    window.DATA_ONLINE.interviewQAs.forEach(o => {
      if ((o.q + o.answer).toLowerCase().includes(q)) {
        hits.push({ sec: "online", tag: "线上必考题", title: o.q, sub: o.intent });
      }
    });
    window.DATA_METHODS.testCases.forEach(tc => {
      if ((tc.title + tc.steps + tc.expected + tc.onlineRef).toLowerCase().includes(q)) {
        hits.push({ sec: "methods", tag: `用例 · ${tc.id}`, title: tc.title, sub: tc.onlineRef });
      }
    });

    resBox.style.display = "block";
    if (!hits.length) {
      resBox.innerHTML = `<div class="search-results-banner">未找到包含「<strong>${escHtml(query)}</strong>」的内容。</div>`;
      return;
    }
    resBox.innerHTML = `
      <div class="search-results-banner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong>全局搜索「${escHtml(query)}」命中 ${hits.length} 条结果</strong>
          <button class="btn btn-sm" id="clear-search-btn">清除搜索</button>
        </div>
        <div style="display:grid;gap:6px;max-height:260px;overflow-y:auto;">
          ${hits.slice(0, 15).map(h => `
            <div style="padding:8px 10px;background:var(--bg-elev);border-radius:6px;border:1px solid var(--border);cursor:pointer;" onclick="window.__goSec('${h.sec}')">
              <span class="pill pill-a" style="margin-right:6px;">${escHtml(h.tag)}</span>
              <strong>${escHtml(h.title)}</strong>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${escHtml(h.sub)}</div>
            </div>
          `).join("")}
        </div>
      </div>`;
    document.getElementById("clear-search-btn")?.addEventListener("click", () => {
      const inp = document.getElementById("global-search");
      if (inp) inp.value = "";
      runSearch("");
    });
  }

  /* ---------- Init ---------- */
  function initTheme() {
    const saved = safeGet(STORAGE_KEY_THEME, "light");
    document.documentElement.setAttribute("data-theme", saved);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = saved === "dark" ? "☀ 浅色" : "☾ 深色";
  }

  window.__goSec = switchSection;

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderOverview();
    renderJobs();
    renderIntro();
    renderQA();
    renderOnline();
    renderMethods();
    updateMasteryUI();

    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => switchSection(btn.dataset.sec));
    });

    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      document.getElementById("sidebar")?.classList.toggle("open");
    });

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", cur);
      safeSet(STORAGE_KEY_THEME, cur);
      document.getElementById("theme-toggle").textContent = cur === "dark" ? "☀ 浅色" : "☾ 深色";
    });

    document.getElementById("print-btn")?.addEventListener("click", () => window.print());

    const searchInput = document.getElementById("global-search");
    searchInput?.addEventListener("input", e => runSearch(e.target.value));
  });
})();
