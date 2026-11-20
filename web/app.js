(function () {
  const STORAGE_KEY_MASTERY = "qa_prep_mastered_v1";
  const STORAGE_KEY_THEME = "qa_prep_theme_v1";
  const STORAGE_KEY_FC = "qa_prep_fc_status_v1";
  const STORAGE_KEY_BUGS = "qa_prep_bugs_v1";
  const STORAGE_KEY_GH = "qa_prep_github_repo_v1";

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
    // Flashcards
    fcCat: "ALL",
    fcFilterMode: "ALL", // ALL | TODO | HARD
    fcIndex: 0,
    fcFlipped: false,
    fcStatus: JSON.parse(safeGet(STORAGE_KEY_FC, "{}")), // { id: 'hard' | 'fuzzy' | 'mastered' }
    // Automation Hub
    autoData: window.DATA_HUB.defaultAutomationData,
    autoSource: "内置标准 Schema 演示集（托管至 GitHub Pages 时自动 fetch ./data/automation-runs.json）",
    autoGameFilter: "ALL",
    // Bug Feedback
    bugs: JSON.parse(safeGet(STORAGE_KEY_BUGS, "null")) || window.DATA_HUB.initialBugs,
    bugStatusFilter: "ALL",
    githubRepo: safeGet(STORAGE_KEY_GH, ""),
    ghIssues: null,
    ghError: "",
    // Mastery
    mastered: new Set(JSON.parse(safeGet(STORAGE_KEY_MASTERY, "[]")))
  };

  const SECTION_TITLES = {
    overview: "总览仪表盘 · 个人画像与数据洞察",
    jobs: "岗位精准匹配 · 27 个官方 JD 全景评估（已同步 Vue3+TS+Flask+MongoDB）",
    intro: "个人介绍话术库 · 3 套高分场景模板",
    qa: "工作经历 6 层深度追问 · 30 道通关题库",
    online: "线上逃逸 Bug 补齐 · 4,134 条公告提炼与必考题",
    methods: "游戏测试方法论 & 实战用例库",
    study: "欠缺知识诊断 & 交互式翻转学习卡片（24 张）",
    autohub: "四款游戏非侵入式自动化方案 & 数据展示看板",
    feedback: "Bug 反馈缺陷看板 & GitHub Pages 零后端部署方案"
  };

  function saveMastery() {
    safeSet(STORAGE_KEY_MASTERY, JSON.stringify([...state.mastered]));
    updateProgressBars();
  }

  function saveFcStatus() {
    safeSet(STORAGE_KEY_FC, JSON.stringify(state.fcStatus));
    updateProgressBars();
  }

  function saveBugs() {
    safeSet(STORAGE_KEY_BUGS, JSON.stringify(state.bugs));
  }

  function getTotalQuestionIds() {
    const ids = [];
    window.DATA_QA.forEach(t => t.layers.forEach(l => ids.push(`${t.id}-${l.layer}`)));
    window.DATA_ONLINE.interviewQAs.forEach(q => ids.push(q.id));
    return ids;
  }

  function updateProgressBars() {
    const allIds = getTotalQuestionIds();
    const done = allIds.filter(id => state.mastered.has(id)).length;
    const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;
    const label = document.getElementById("mastery-text");
    const bar = document.getElementById("mastery-bar");
    if (label) label.textContent = `${done} / ${allIds.length} (${pct}%)`;
    if (bar) bar.style.width = `${pct}%`;

    const allFcs = window.DATA_STUDY.flashcards;
    const fcDone = allFcs.filter(c => state.fcStatus[c.id] === "mastered").length;
    const fcPct = allFcs.length ? Math.round((fcDone / allFcs.length) * 100) : 0;
    const fcLabel = document.getElementById("fc-progress-text");
    const fcBar = document.getElementById("fc-progress-bar");
    if (fcLabel) fcLabel.textContent = `${fcDone} / ${allFcs.length} (${fcPct}%)`;
    if (fcBar) fcBar.style.width = `${fcPct}%`;
  }

  function escHtml(str) {
    return String(str ?? "")
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
    const maxR = 94;
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
      labelSvg += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="var(--text-secondary)" font-size="11" font-weight="600">${escHtml(it.label)} (${it.value})</text>`;
    });

    const dataPts = items.map((it, i) => pointAt(i, (it.value / 100) * maxR));
    const polyPts = dataPts.map(p => p.join(",")).join(" ");
    const dotsSvg = dataPts
      .map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--primary)" stroke="var(--bg-elev)" stroke-width="2" />`)
      .join("");

    return `
      <svg viewBox="-52 0 ${size + 104} ${size}" style="width:100%;max-width:420px;display:block;margin:0 auto;">
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

  /* ---------- Trend Chart SVG for Automation Hub ---------- */
  function renderTrendSVG(runs) {
    const ordered = [...runs].reverse();
    if (!ordered.length) return `<div style="color:var(--text-muted);padding:16px;">暂无运行数据</div>`;
    const W = 680, H = 200, padL = 44, padR = 24, padT = 20, padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const stepX = ordered.length > 1 ? plotW / (ordered.length - 1) : 0;

    const yPass = v => padT + plotH - ((Math.max(50, Math.min(100, v)) - 50) / 50) * plotH;
    const ptsPass = ordered.map((r, i) => [padL + i * stepX, yPass(r.passRate)]);
    const polyPass = ptsPass.map(p => p.join(",")).join(" ");

    let grid = "";
    [50, 75, 100].forEach(v => {
      const y = yPass(v);
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3" />`;
      grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="10.5">${v}%</text>`;
    });

    let dots = "";
    ordered.forEach((r, i) => {
      const [x, y] = ptsPass[i];
      const col = r.status === "PASS" ? "var(--success)" : r.status === "WARN" ? "var(--warning)" : "var(--danger)";
      dots += `<circle cx="${x}" cy="${y}" r="5" fill="${col}" stroke="var(--bg-elev)" stroke-width="2"><title>${escHtml(r.game)} ${escHtml(r.date)}: 通过率 ${r.passRate}% | 1% Low ${r.low1Fps} FPS</title></circle>`;
      dots += `<text x="${x}" y="${y - 9}" text-anchor="middle" fill="var(--text)" font-size="10.5" font-weight="700">${r.passRate}%</text>`;
      dots += `<text x="${x}" y="${H - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${escHtml(r.date.slice(5))} · ${escHtml(r.game.slice(0, 3))}</text>`;
    });

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:220px;display:block;">
        ${grid}
        <polyline fill="none" stroke="var(--primary)" stroke-width="2.5" points="${polyPass}" />
        ${dots}
      </svg>`;
  }

  /* ---------- 1. Overview ---------- */
  function renderOverview() {
    const p = window.DATA_JOBS.profileSummary;
    const sJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "S");
    const aJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "A");
    const html = `
      <div class="callout success">
        <strong>最新画像已同步：</strong>新增 <strong>Vue 3 + TypeScript + Python + Flask + MongoDB</strong> 全栈质量平台开发经历后，你的可投递高匹配岗位显著拓宽！
        米哈游「游戏测试开发-崩坏：因缘精灵」由 C 级跃升至 <strong>A 级 (83%)</strong>，鹰角「资深测开-明日方舟」跃升至 <strong>A 级 (81%)</strong>，鹰角「工具/Agent向」升至 <strong>S 级 (90%)</strong>！
      </div>

      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-label">首选 S 级投递岗</div>
          <div class="kpi-value" style="color:var(--success)">${sJobs.length} 个</div>
          <div class="kpi-sub">鹰角 UE测开(96%) / 系统向(91%) / 工具向(90%)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">强力 A 级投递岗</div>
          <div class="kpi-value" style="color:var(--primary)">${aJobs.length} 个</div>
          <div class="kpi-sub">绝区零 / 源初之结专项 / 因缘精灵测开 / 崩铁 / 星布谷地等</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">面试追问 + 学习卡片</div>
          <div class="kpi-value" style="color:var(--accent)">36 题 + 24 卡</div>
          <div class="kpi-sub">6层追问 + 线上必考 + 6大知识短板翻转卡片</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">非侵入自动化 + Pages</div>
          <div class="kpi-value">就绪</div>
          <div class="kpi-sub">4款包体黑盒巡检方案 + JSON看板 + GitHub部署</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">个人能力六维雷达图（已更新全栈平台维度） <span class="pill pill-s">Vue3+Flask+UE</span></h3>
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
          <h3 class="card-title">当前短板与精准补齐入口</h3>
          <ul style="margin:0;padding-left:18px;">
            ${p.gaps.map(g => `<li style="margin-bottom:8px;">${escHtml(g)}</li>`).join("")}
          </ul>
          <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="window.__goSec('study')">刷 24 张短板学习卡片 -></button>
            <button class="btn btn-sm" onclick="window.__goSec('autohub')">看非侵入自动化看板 -></button>
            <button class="btn btn-sm" onclick="window.__goSec('feedback')">GitHub Pages 部署 & 反馈 -></button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("view-overview").innerHTML = html;
  }

  /* ---------- 2. Jobs ---------- */
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
      <div class="callout success">
        <strong>同步 Vue 3 + TS + Python + Flask + MongoDB 全栈经历后的投递升级建议：</strong>
        <br/>• <strong>鹰角网络（S 级 3 岗全中）</strong>：第一志愿「游戏测试开发工程师-(UE项目) 96%」、第二志愿「资深游戏测试工程师—系统向(UE项目) 91%」与「资深测开-工具/Agent向 90%」，备选「资深测开-明日方舟 81%」。
        <br/>• <strong>米哈游（新增全栈测开黑马）</strong>：除「绝区零 (85%)」「源初之结专项 (84%)」「崩铁 (83%)」「星布谷地 (82%)」外，<strong>「游戏测试开发-崩坏：因缘精灵 (83%)」</strong> 已正式进入高匹配可投池（Vue3+TS+Python+Flask+MongoDB 精准命中全栈平台要求）。
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

  /* ---------- 3. Self Intros ---------- */
  function renderIntro() {
    const intros = window.DATA_JOBS.selfIntros;
    const cur = intros.find(i => i.id === state.introTab) || intros[0];

    const html = `
      <div class="callout">
        <strong>自我介绍设计心法：</strong>已同步融入 <strong>Vue 3 + TypeScript + Python + Flask + MongoDB</strong> 全栈平台经历，用“<strong>全栈质量平台 + UE配置左移工具链 + 白盒代码定位</strong>”主动把面试官引向你的绝对主场。
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

        <h4 style="margin:18px 0 8px;font-size:14.5px;">话题“埋钩子”拆解</h4>
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

  /* ---------- 4. 6-Layer QA ---------- */
  function renderQA() {
    const html = `
      <div class="callout">
        <strong>交互式 6 层递进通关演练：</strong>专题二已同步升级为 <strong>Vue3+TS+Flask+MongoDB 全栈架构、大 Diff 渲染优化、Flask 异步解耦、MongoDB 复合索引与多租户中台演进</strong> 深度追问！
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
      head.addEventListener("click", () => head.closest(".layer-node").classList.toggle("open"));
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
        if (closed) { closed.classList.add("open"); closed.scrollIntoView({ behavior: "smooth", block: "center" }); }
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

  /* ---------- 5. Online Bugs ---------- */
  function renderOnline() {
    const data = window.DATA_ONLINE;
    const filteredArcs = data.archetypes.filter(a => state.onlineGame === "ALL" || a.games.includes(state.onlineGame));

    const html = `
      <div class="callout warn">
        <strong>如何正确使用本板块补齐“无完整上线经历”短板？</strong>
        <br/>将其转化为<strong>“基于 4 款顶级商业项目 4,134 条真实线上逃逸缺陷样本的系统复盘”</strong>：面对线上应急、脏数据补发、多端兼容性与跨版本防回归追问，直接输出底层归因、标准 SOP 与防线方案。
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

  /* ---------- 6. Methods & Test Cases ---------- */
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

  /* ---------- 7. Knowledge Gaps & Interactive Flashcards ---------- */
  function getFilteredFlashcards() {
    return window.DATA_STUDY.flashcards.filter(c => {
      if (state.fcCat !== "ALL" && c.cat !== state.fcCat) return false;
      const st = state.fcStatus[c.id];
      if (state.fcFilterMode === "TODO" && st === "mastered") return false;
      if (state.fcFilterMode === "HARD" && st !== "hard") return false;
      return true;
    });
  }

  function renderStudy() {
    const data = window.DATA_STUDY;
    const cats = ["ALL", ...data.gapOverview.map(g => g.cat)];
    const deck = getFilteredFlashcards();
    if (state.fcIndex >= deck.length) state.fcIndex = 0;
    const cur = deck[state.fcIndex];

    const statusBadge = id => {
      const st = state.fcStatus[id];
      if (st === "mastered") return `<span class="pill pill-s">已掌握 ✓</span>`;
      if (st === "hard") return `<span class="pill pill-c">需强化复习</span>`;
      if (st === "fuzzy") return `<span class="pill pill-b">有点印象</span>`;
      return `<span class="pill pill-muted">未学习</span>`;
    };

    const html = `
      <div class="callout">
        <strong>针对性短板补齐：</strong>结合你更新后的技术栈（Vue3+TS+Flask+MongoDB + UE工具链）与目标 JD，梳理出 <strong>6 大最易被面试官深挖的知识盲区</strong>，并制成 <strong>24 张间隔记忆翻转学习卡片</strong>。点击卡片翻转看精解与面试金句，自评结果自动保存在本地浏览器。
      </div>

      <h3 style="margin:0 0 12px;font-size:16.5px;">一、六大欠缺知识诊断地图</h3>
      <div class="grid-3">
        ${data.gapOverview.map(g => `
          <div class="card" style="padding:15px;">
            <div class="card-title" style="font-size:14.5px;margin-bottom:6px;">
              <span>${escHtml(g.cat)}</span>
              <span class="pill ${g.priority.startsWith("P0") ? "pill-c" : g.priority.startsWith("P1") ? "pill-a" : "pill-muted"}">${escHtml(g.priority)}</span>
            </div>
            <div style="font-size:12.8px;color:var(--text-secondary);margin-bottom:6px;"><strong>为什么补：</strong>${escHtml(g.why)}</div>
            <div style="font-size:12.5px;color:var(--primary);"><strong>核心知识点：</strong>${escHtml(g.focus)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:22px 0 12px;font-size:16.5px;">二、交互式翻转学习卡片（Flashcards）</h3>
      <div class="filter-bar">
        ${cats.map(c => `
          <button class="filter-chip ${state.fcCat === c ? "active" : ""}" data-fccat="${escHtml(c)}">
            ${c === "ALL" ? `全部领域 (${data.flashcards.length})` : c}
          </button>
        `).join("")}
      </div>

      <div class="filter-bar">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">刷卡模式：</span>
        <button class="filter-chip ${state.fcFilterMode === "ALL" ? "active" : ""}" data-fcmode="ALL">全部卡片</button>
        <button class="filter-chip ${state.fcFilterMode === "TODO" ? "active" : ""}" data-fcmode="TODO">只看未掌握</button>
        <button class="filter-chip ${state.fcFilterMode === "HARD" ? "active" : ""}" data-fcmode="HARD">只看需强化</button>
        <button class="btn btn-sm" id="fc-random-btn" style="margin-left:auto;">🎲 随机抽卡</button>
        <button class="btn btn-sm" id="fc-reset-btn">重置刷卡记录</button>
      </div>

      <div class="fc-stage">
        ${cur ? `
          <div class="fc-card ${state.fcFlipped ? "flipped" : ""}" id="fc-active-card">
            <div class="fc-meta">
              <div>
                <span class="pill pill-purple">${escHtml(cur.cat)}</span>
                <span class="pill pill-a" style="margin-left:5px;">${escHtml(cur.difficulty)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                ${statusBadge(cur.id)}
                <strong>第 ${state.fcIndex + 1} / ${deck.length} 张</strong>
              </div>
            </div>

            ${!state.fcFlipped ? `
              <div class="fc-front-q">${escHtml(cur.front)}</div>
              <div class="fc-hint">👆 点击卡片任意位置，翻转查看硬核解析与面试金句</div>
            ` : `
              <div style="font-weight:700;color:var(--text-muted);font-size:13px;margin-bottom:8px;">问题：${escHtml(cur.front)}</div>
              <div class="fc-answer">${escHtml(cur.back)}</div>
              <div class="fc-golden">💡 ${escHtml(cur.golden)}</div>
            `}
          </div>

          <div class="fc-controls">
            <button class="btn" id="fc-prev-btn">← 上一张</button>
            <button class="btn" style="border-color:var(--danger);color:var(--danger);" data-fcrate="hard">还没懂（加入强化）</button>
            <button class="btn" style="border-color:var(--warning);color:var(--warning);" data-fcrate="fuzzy">有点印象</button>
            <button class="btn btn-primary" style="background:var(--success);border-color:var(--success);" data-fcrate="mastered">已掌握 ✓</button>
            <button class="btn" id="fc-next-btn">下一张 →</button>
          </div>
        ` : `
          <div class="card" style="text-align:center;padding:36px;">
            <h3>🎉 当前筛选条件下已全部掌握或无待复习卡片！</h3>
            <button class="btn btn-primary" id="fc-show-all-btn">切换回全部卡片</button>
          </div>
        `}
      </div>

      <h4 style="margin:22px 0 10px;font-size:15px;">卡片总览速查表（点击直接跳至该卡）</h4>
      <div class="grid-3">
        ${deck.map((c, idx) => `
          <div class="card" style="padding:13px;cursor:pointer;${idx === state.fcIndex ? "border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft);" : ""}" data-fcjump="${idx}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11.5px;color:var(--text-muted);">${escHtml(c.cat)}</span>
              ${statusBadge(c.id)}
            </div>
            <div style="font-size:13.2px;font-weight:600;line-height:1.45;">${escHtml(c.front)}</div>
          </div>
        `).join("")}
      </div>
    `;

    const container = document.getElementById("view-study");
    container.innerHTML = html;

    container.querySelectorAll("[data-fccat]").forEach(b => {
      b.addEventListener("click", () => { state.fcCat = b.dataset.fccat; state.fcIndex = 0; state.fcFlipped = false; renderStudy(); });
    });
    container.querySelectorAll("[data-fcmode]").forEach(b => {
      b.addEventListener("click", () => { state.fcFilterMode = b.dataset.fcmode; state.fcIndex = 0; state.fcFlipped = false; renderStudy(); });
    });
    document.getElementById("fc-active-card")?.addEventListener("click", () => {
      state.fcFlipped = !state.fcFlipped;
      renderStudy();
    });
    document.getElementById("fc-prev-btn")?.addEventListener("click", () => {
      if (!deck.length) return;
      state.fcIndex = (state.fcIndex - 1 + deck.length) % deck.length;
      state.fcFlipped = false;
      renderStudy();
    });
    document.getElementById("fc-next-btn")?.addEventListener("click", () => {
      if (!deck.length) return;
      state.fcIndex = (state.fcIndex + 1) % deck.length;
      state.fcFlipped = false;
      renderStudy();
    });
    document.getElementById("fc-random-btn")?.addEventListener("click", () => {
      if (!deck.length) return;
      state.fcIndex = Math.floor(Math.random() * deck.length);
      state.fcFlipped = false;
      renderStudy();
    });
    document.getElementById("fc-reset-btn")?.addEventListener("click", () => {
      state.fcStatus = {};
      saveFcStatus();
      renderStudy();
    });
    document.getElementById("fc-show-all-btn")?.addEventListener("click", () => {
      state.fcFilterMode = "ALL";
      state.fcIndex = 0;
      renderStudy();
    });
    container.querySelectorAll("[data-fcrate]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!cur) return;
        state.fcStatus[cur.id] = btn.dataset.fcrate;
        saveFcStatus();
        const nextDeck = getFilteredFlashcards();
        if (nextDeck.length) state.fcIndex = (state.fcIndex + 1) % nextDeck.length;
        else state.fcIndex = 0;
        state.fcFlipped = false;
        renderStudy();
      });
    });
    container.querySelectorAll("[data-fcjump]").forEach(card => {
      card.addEventListener("click", () => {
        state.fcIndex = Number(card.dataset.fcjump);
        state.fcFlipped = false;
        renderStudy();
        document.getElementById("fc-active-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- 8. Non-Intrusive Automation & Data Dashboard ---------- */
  function renderAutoHub() {
    const plan = window.DATA_STUDY.nonIntrusivePlan;
    const runsAll = state.autoData.runs || [];
    const runs = runsAll.filter(r => state.autoGameFilter === "ALL" || r.game === state.autoGameFilter);

    const avgPass = runs.length ? (runs.reduce((s, r) => s + r.passRate, 0) / runs.length).toFixed(1) : "0.0";
    const avgCold = runs.length ? (runs.reduce((s, r) => s + r.coldStartSec, 0) / runs.length).toFixed(1) : "0.0";
    const avgLow1 = runs.length ? (runs.reduce((s, r) => s + r.low1Fps, 0) / runs.length).toFixed(1) : "0.0";
    const totalFindings = runs.reduce((s, r) => s + (r.findings?.length || 0), 0);

    const html = `
      <div class="callout warn">
        ${escHtml(plan.complianceNotice)}
      </div>

      <h3 style="margin:0 0 12px;font-size:17px;">一、自动化巡检数据展示看板（支持未来真实 JSON 持续接入）</h3>
      <div class="card" style="margin-bottom:18px;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="font-size:12.8px;color:var(--text-muted);">
            <strong>当前数据源：</strong>${escHtml(state.autoSource)} &nbsp;|&nbsp; 最后更新：<strong>${escHtml(state.autoData.updatedAt || "-")}</strong>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <label class="btn btn-primary btn-sm" style="cursor:pointer;">
              📂 导入本地 JSON 报告
              <input type="file" id="import-auto-json" accept=".json" style="display:none;" />
            </label>
            <button class="btn btn-sm" id="export-auto-json">⬇ 导出当前 JSON 模板</button>
          </div>
        </div>

        <div class="filter-bar">
          ${["ALL", "原神", "崩坏：星穹铁道", "绝区零", "明日方舟：终末地"].map(g => `
            <button class="filter-chip ${state.autoGameFilter === g ? "active" : ""}" data-agame="${escHtml(g)}">
              ${g === "ALL" ? `全部游戏 (${runsAll.length} 轮)` : g}
            </button>
          `).join("")}
        </div>

        <div class="grid-4">
          <div class="kpi-card">
            <div class="kpi-label">巡检总轮次</div>
            <div class="kpi-value">${runs.length}</div>
            <div class="kpi-sub">非侵入外部黑盒采集</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">平均用例通过率</div>
            <div class="kpi-value" style="color:var(--success)">${avgPass}%</div>
            <div class="kpi-sub">CV / OCR / VLM 综合断言</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">平均冷启动 / 1% Low FPS</div>
            <div class="kpi-value" style="color:var(--primary)">${avgCold}s / ${avgLow1}</div>
            <div class="kpi-sub">PresentMon + 进程探针基线</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">累计拦截异常条目</div>
            <div class="kpi-value" style="color:var(--danger)">${totalFindings} 条</div>
            <div class="kpi-sub">可一键转入 Bug 反馈看板</div>
          </div>
        </div>

        <div style="margin-bottom:18px;">
          <div style="font-size:13.5px;font-weight:700;margin-bottom:6px;">历史巡检通过率趋势</div>
          ${renderTrendSVG(runs)}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run ID / 日期</th>
                <th>游戏与版本</th>
                <th>非侵入巡检套件</th>
                <th>状态 / 通过率</th>
                <th>性能基线 (冷启/FPS/内存)</th>
                <th>检出异常详情</th>
              </tr>
            </thead>
            <tbody>
              ${runs.map(r => `
                <tr>
                  <td>
                    <div style="font-weight:700;font-family:monospace;">${escHtml(r.id)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${escHtml(r.date)}</div>
                  </td>
                  <td>
                    <div style="font-weight:700;">${escHtml(r.game)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${escHtml(r.version)}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${escHtml(r.suite)}</div>
                    <div style="font-size:11.8px;color:var(--accent);margin-top:3px;">${escHtml(r.mode)}</div>
                  </td>
                  <td>
                    <span class="pill status-${escHtml(r.status)}">${escHtml(r.status)} · ${r.passRate}%</span>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">通过 ${r.passedCases}/${r.totalCases}</div>
                  </td>
                  <td style="font-size:12.6px;">
                    冷启动：<strong>${r.coldStartSec}s</strong><br/>
                    均帧 / 1% Low：<strong>${r.avgFps} / ${r.low1Fps}</strong><br/>
                    内存水位：<strong>${r.memMb} MB</strong>
                  </td>
                  <td>
                    ${r.findings && r.findings.length ? r.findings.map(f => `
                      <div class="quote-item" style="margin-bottom:6px;">
                        <span class="pill ${f.severity === "P0" || f.severity === "P1" ? "pill-c" : "pill-b"}" style="margin-right:4px;">${escHtml(f.severity)}</span>
                        <strong>${escHtml(f.rule)}</strong>：${escHtml(f.msg)}
                      </div>
                    `).join("") : `<span style="color:var(--success);font-weight:600;">✓ 零异常</span>`}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">二、面向线上真实包体的四层非侵入自动化架构</h3>
      <div class="grid-2">
        ${plan.architecture.map(a => `
          <div class="card">
            <div class="card-title" style="font-size:15px;">${escHtml(a.layer)}</div>
            <div style="font-size:12.5px;color:var(--primary);font-weight:600;margin-bottom:8px;">技术栈：${escHtml(a.tech)}</div>
            <div style="font-size:13.4px;color:var(--text-secondary);">${escHtml(a.detail)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">三、四款游戏差异化非侵入巡检落地方案</h3>
      <div class="grid-2">
        ${plan.gameScenarios.map(gs => `
          <div class="card">
            <div class="card-title">
              <span>${escHtml(gs.game)}</span>
              <span class="pill pill-purple">${escHtml(gs.badge)}</span>
            </div>
            <ul style="margin:0 0 10px;padding-left:18px;font-size:13.4px;">
              ${gs.scenarios.map(s => `<li style="margin-bottom:6px;">${escHtml(s)}</li>`).join("")}
            </ul>
            <div style="font-size:12.5px;color:var(--success);background:var(--success-soft);padding:6px 10px;border-radius:6px;">
              <strong>呼应线上真实逃逸案例：</strong>${escHtml(gs.mappedOnlineBug)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">四、Python 非侵入脚本接入契约（跑完直接写入 <code>web/data/automation-runs.json</code>）</h3>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">Python 外部检测与 JSON 上报骨架 <button class="btn btn-sm" id="copy-py-btn">复制代码</button></div>
          <pre class="code-block"><code>${escHtml(plan.pythonSnippet)}</code></pre>
        </div>
        <div class="card">
          <div class="card-title">标准 JSON Schema（看板自动识别） <button class="btn btn-sm" id="copy-schema-btn">复制 Schema</button></div>
          <pre class="code-block"><code>${escHtml(window.DATA_HUB.jsonSchemaDoc)}</code></pre>
        </div>
      </div>
    `;

    const container = document.getElementById("view-autohub");
    container.innerHTML = html;

    container.querySelectorAll("[data-agame]").forEach(btn => {
      btn.addEventListener("click", () => { state.autoGameFilter = btn.dataset.agame; renderAutoHub(); });
    });

    document.getElementById("import-auto-json")?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!Array.isArray(parsed.runs)) throw new Error("JSON 缺少 runs 数组");
          state.autoData = parsed;
          state.autoSource = `本地导入文件：${file.name}`;
          renderAutoHub();
        } catch (err) {
          alert("导入失败，请确认 JSON 符合标准 Schema：" + err.message);
        }
      };
      reader.readAsText(file, "utf-8");
    });

    document.getElementById("export-auto-json")?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.autoData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "automation-runs.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("copy-py-btn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(plan.pythonSnippet);
    });
    document.getElementById("copy-schema-btn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(window.DATA_HUB.jsonSchemaDoc);
    });
  }

  /* ---------- 9. Bug Feedback & GitHub Pages Deployment ---------- */
  function renderFeedback() {
    const filteredBugs = state.bugs.filter(b => state.bugStatusFilter === "ALL" || b.status === state.bugStatusFilter);

    const html = `
      <div class="callout success">
        <strong>纯静态 GitHub Pages 如何实现真正的 Bug 反馈闭环？</strong>
        <br/>本模块采用<strong>双模架构</strong>：① <strong>本地缺陷看板</strong>（表单即时提单、状态流转、一键导出 Markdown/JSON，适合离线演示与复盘）；② <strong>GitHub Issues 零后端持久化</strong>（填写你的 <code>owner/repo</code> 后，一键生成结构化 Issue 提交入库，并直接通过公开 API 拉取展示仓库里的真实 Bug Issues！）。
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">提交新 Bug 反馈单</h3>
          <form id="bug-submit-form">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">所属游戏</label>
                <select class="form-select" id="bf-game">
                  <option>明日方舟：终末地</option>
                  <option>绝区零</option>
                  <option>崩坏：星穹铁道</option>
                  <option>原神</option>
                  <option>在研UE项目 / 其他</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">严重级别</label>
                <select class="form-select" id="bf-sev">
                  <option value="P0">P0 · 阻塞/闪退/资损</option>
                  <option value="P1" selected>P1 · 核心功能/状态异常</option>
                  <option value="P2">P2 · UI表现/偶现异常</option>
                  <option value="P3">P3 · 文案/体验优化</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">模块标签</label>
                <input class="form-input" id="bf-mod" placeholder="如：手柄热切换 / 背包 / 弱网重连" required />
              </div>
              <div class="form-field">
                <label class="form-label">关联自动化 Run ID（选填）</label>
                <input class="form-input" id="bf-runid" placeholder="如：RUN-20261120-01" />
              </div>
              <div class="form-field full">
                <label class="form-label">Bug 标题</label>
                <input class="form-input" id="bf-title" placeholder="简明描述：触发条件 + 异常表现" required />
              </div>
              <div class="form-field full">
                <label class="form-label">复现步骤</label>
                <textarea class="form-textarea" id="bf-steps" placeholder="1. 前置条件...&#10;2. 关键操作...&#10;3. 观察结果..." required></textarea>
              </div>
              <div class="form-field">
                <label class="form-label">预期结果</label>
                <input class="form-input" id="bf-exp" placeholder="应符合怎样的规则/表现" required />
              </div>
              <div class="form-field">
                <label class="form-label">实际结果</label>
                <input class="form-input" id="bf-act" placeholder="实际发生的异常现象" required />
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
              <button type="submit" class="btn btn-primary">保存到本地缺陷看板</button>
              <button type="button" class="btn" id="submit-gh-issue-btn">🚀 同时打开 GitHub Issue 提交</button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3 class="card-title">GitHub Issues 零后端联动配置</h3>
          <div class="form-field">
            <label class="form-label">你的 GitHub 仓库（格式：<code>username/repo-name</code>）</label>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="gh-repo-input" value="${escHtml(state.githubRepo)}" placeholder="例如：yourname/game-qa-portfolio" />
              <button class="btn btn-primary btn-sm" id="save-gh-repo-btn">保存</button>
              <button class="btn btn-sm" id="fetch-gh-issues-btn">拉取真实 Issues</button>
            </div>
          </div>
          <p style="font-size:12.5px;color:var(--text-muted);margin:6px 0 12px;">
            配置后：点击左侧“同时打开 GitHub Issue 提交”将自动预填标题、标签与 Markdown 复现模板；点击“拉取真实 Issues”会通过 GitHub Public API 实时拉取你仓库的 Bug 记录（Public 仓库无需 Token）。
          </p>

          ${state.ghError ? `<div class="pitfall-tag" style="margin-bottom:10px;">${escHtml(state.ghError)}</div>` : ""}
          ${state.ghIssues ? `
            <div style="max-height:240px;overflow-y:auto;">
              <div style="font-size:12.5px;font-weight:700;margin-bottom:6px;">GitHub 仓库实时 Issues（${state.ghIssues.length} 条）：</div>
              ${state.ghIssues.length ? state.ghIssues.map(is => `
                <div class="quote-item">
                  <span class="pill ${is.state === "open" ? "pill-c" : "pill-s"}" style="margin-right:6px;">#${is.number} ${escHtml(is.state)}</span>
                  <a href="${escHtml(is.html_url)}" target="_blank" rel="noopener"><strong>${escHtml(is.title)}</strong> ↗</a>
                </div>
              `).join("") : `<div style="font-size:13px;color:var(--text-muted);">该仓库暂无 Issues</div>`}
            </div>
          ` : `
            <div style="background:var(--bg-subtle);padding:12px;border-radius:8px;font-size:12.8px;color:var(--text-secondary);">
              <strong>为什么推荐 GitHub Pages + GitHub Issues？</strong><br/>
              面试官打开你的在线作品集网址，既能直接看 4,134 条线上缺陷分析与非侵入自动化跑出来的 JSON 图表，又能点进真实可协作的 Bug Issue 闭环——0 服务器费用、长期在线不宕机！
            </div>
          `}
        </div>
      </div>

      <h3 style="margin:22px 0 12px;font-size:17px;">缺陷反馈看板（共 ${state.bugs.length} 条）</h3>
      <div class="filter-bar">
        ${["ALL", "待确认", "修复中", "已回归关闭"].map(st => `
          <button class="filter-chip ${state.bugStatusFilter === st ? "active" : ""}" data-bst="${escHtml(st)}">
            ${st === "ALL" ? `全部 (${state.bugs.length})` : `${st} (${state.bugs.filter(b => b.status === st).length})`}
          </button>
        `).join("")}
        <button class="btn btn-sm" id="export-bugs-md" style="margin-left:auto;">📋 导出 Markdown 报告</button>
        <button class="btn btn-sm" id="export-bugs-json">⬇ 导出 JSON</button>
      </div>

      <div>
        ${filteredBugs.map(b => `
          <div class="bug-card">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:7px;">
                <span style="font-family:monospace;font-weight:700;">${escHtml(b.id)}</span>
                <span class="pill ${b.severity === "P0" || b.severity === "P1" ? "pill-c" : "pill-b"}">${escHtml(b.severity)}</span>
                <span class="pill pill-muted">${escHtml(b.game)}</span>
                <span class="pill pill-purple">${escHtml(b.module)}</span>
                ${b.runId ? `<span class="pill pill-a">关联 ${escHtml(b.runId)}</span>` : ""}
                <strong>${escHtml(b.title)}</strong>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <select class="form-select bug-status-sel" data-bid="${escHtml(b.id)}" style="width:auto;padding:4px 8px;font-size:12px;">
                  ${["待确认", "修复中", "已回归关闭"].map(s => `<option ${b.status === s ? "selected" : ""}>${s}</option>`).join("")}
                </select>
                <button class="btn btn-sm bug-del-btn" data-bid="${escHtml(b.id)}">删除</button>
              </div>
            </div>
            <div class="grid-3" style="margin-bottom:0;font-size:13px;color:var(--text-secondary);">
              <div style="white-space:pre-line;"><strong>复现步骤：</strong>\n${escHtml(b.steps)}</div>
              <div><strong>预期结果：</strong>${escHtml(b.expected)}</div>
              <div><strong>实际结果：</strong>${escHtml(b.actual)}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:26px 0 12px;font-size:17px;">GitHub Pages 一键部署方案（已在本项目配置好 Workflow）</h3>
      <div class="grid-2">
        ${window.DATA_HUB.githubDeploySteps.map(s => `
          <div class="card">
            <div class="card-title" style="font-size:15px;">${escHtml(s.step)}</div>
            <div style="white-space:pre-line;font-size:13.4px;color:var(--text-secondary);">${escHtml(s.detail)}</div>
          </div>
        `).join("")}
      </div>
    `;

    const container = document.getElementById("view-feedback");
    container.innerHTML = html;

    function readForm() {
      return {
        id: "BUG-" + (1000 + state.bugs.length + 1),
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        game: document.getElementById("bf-game").value,
        severity: document.getElementById("bf-sev").value,
        module: document.getElementById("bf-mod").value.trim(),
        runId: document.getElementById("bf-runid").value.trim(),
        title: document.getElementById("bf-title").value.trim(),
        steps: document.getElementById("bf-steps").value.trim(),
        expected: document.getElementById("bf-exp").value.trim(),
        actual: document.getElementById("bf-act").value.trim(),
        status: "待确认"
      };
    }

    document.getElementById("bug-submit-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const rec = readForm();
      state.bugs.unshift(rec);
      saveBugs();
      renderFeedback();
    });

    document.getElementById("submit-gh-issue-btn")?.addEventListener("click", () => {
      const repo = (document.getElementById("gh-repo-input")?.value || state.githubRepo).trim();
      if (!repo || !repo.includes("/")) {
        alert("请先在右侧填入正确的 GitHub 仓库路径（如 username/repo-name）！");
        return;
      }
      const rec = readForm();
      if (!rec.title) { alert("请先填写 Bug 标题！"); return; }
      const title = `[${rec.severity}][${rec.game}][${rec.module || "系统"}] ${rec.title}`;
      const body = `### 基本信息\n- 游戏：${rec.game}\n- 模块：${rec.module}\n- 严重级别：${rec.severity}\n- 关联自动化 Run：${rec.runId || "无"}\n\n### 复现步骤\n${rec.steps}\n\n### 预期结果\n${rec.expected}\n\n### 实际结果\n${rec.actual}\n`;
      const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent("bug," + rec.severity)}`;
      window.open(url, "_blank", "noopener");
    });

    document.getElementById("save-gh-repo-btn")?.addEventListener("click", () => {
      state.githubRepo = document.getElementById("gh-repo-input").value.trim();
      safeSet(STORAGE_KEY_GH, state.githubRepo);
      alert("已保存仓库配置：" + state.githubRepo);
    });

    document.getElementById("fetch-gh-issues-btn")?.addEventListener("click", async () => {
      const repo = document.getElementById("gh-repo-input").value.trim();
      state.githubRepo = repo;
      safeSet(STORAGE_KEY_GH, repo);
      if (!repo || !repo.includes("/")) { state.ghError = "请输入正确的 username/repo 格式"; renderFeedback(); return; }
      state.ghError = "";
      try {
        const resp = await fetch(`https://api.github.com/repos/${repo}/issues?state=all&per_page=15`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}（请确认仓库为 Public 且拼写正确）`);
        state.ghIssues = await resp.json();
      } catch (err) {
        state.ghError = "拉取失败：" + err.message;
      }
      renderFeedback();
    });

    container.querySelectorAll("[data-bst]").forEach(btn => {
      btn.addEventListener("click", () => { state.bugStatusFilter = btn.dataset.bst; renderFeedback(); });
    });

    container.querySelectorAll(".bug-status-sel").forEach(sel => {
      sel.addEventListener("change", () => {
        const item = state.bugs.find(b => b.id === sel.dataset.bid);
        if (item) { item.status = sel.value; saveBugs(); renderFeedback(); }
      });
    });

    container.querySelectorAll(".bug-del-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.bugs = state.bugs.filter(b => b.id !== btn.dataset.bid);
        saveBugs();
        renderFeedback();
      });
    });

    document.getElementById("export-bugs-md")?.addEventListener("click", () => {
      const md = state.bugs.map(b => `## [${b.id}][${b.severity}][${b.status}] ${b.game} - ${b.title}\n- 模块：${b.module} | 关联 Run：${b.runId || "-"}\n- 复现步骤：\n${b.steps}\n- 预期：${b.expected}\n- 实际：${b.actual}\n`).join("\n");
      navigator.clipboard?.writeText(md).then(() => alert("已复制全部缺陷 Markdown 报告到剪贴板！"));
    });

    document.getElementById("export-bugs-json")?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.bugs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bug-feedback-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ---------- Global Search ---------- */
  function runSearch(query) {
    const q = query.trim().toLowerCase();
    const resBox = document.getElementById("search-results");
    if (!q) { resBox.style.display = "none"; resBox.innerHTML = ""; return; }

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
    window.DATA_STUDY.flashcards.forEach(c => {
      if ((c.cat + c.front + c.back + c.golden).toLowerCase().includes(q)) {
        hits.push({ sec: "study", tag: `学习卡片 · ${c.cat}`, title: c.front, sub: c.golden });
      }
    });
    window.DATA_ONLINE.archetypes.forEach(a => {
      if ((a.title + a.rootCause + a.quotes.map(x => x.text).join("")).toLowerCase().includes(q)) {
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
    (state.autoData.runs || []).forEach(r => {
      if ((r.id + r.game + r.suite + JSON.stringify(r.findings || [])).toLowerCase().includes(q)) {
        hits.push({ sec: "autohub", tag: `自动化 · ${r.id}`, title: `${r.game} - ${r.suite}`, sub: `${r.status} (${r.passRate}%)` });
      }
    });
    state.bugs.forEach(b => {
      if ((b.id + b.game + b.title + b.module + b.actual).toLowerCase().includes(q)) {
        hits.push({ sec: "feedback", tag: `Bug · ${b.id}`, title: `[${b.severity}] ${b.title}`, sub: `${b.game} · ${b.status}` });
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
          ${hits.slice(0, 18).map(h => `
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

  /* ---------- Try live JSON fetch on HTTP(S) / GitHub Pages ---------- */
  async function tryFetchLiveAutomationJson() {
    if (window.location.protocol === "file:") return;
    try {
      const resp = await fetch("./data/automation-runs.json?t=" + Date.now());
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.runs)) {
          state.autoData = json;
          state.autoSource = "在线实时加载：./data/automation-runs.json (GitHub Pages)";
          renderAutoHub();
        }
      }
    } catch {}
  }

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
    renderStudy();
    renderAutoHub();
    renderFeedback();
    updateProgressBars();
    tryFetchLiveAutomationJson();

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
    document.getElementById("global-search")?.addEventListener("input", e => runSearch(e.target.value));
  });
})();
