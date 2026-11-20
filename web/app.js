(function () {
  const STORAGE_KEY_MASTERY = "qa_prep_mastered_v1";
  const STORAGE_KEY_THEME = "qa_prep_theme_v1";
  const STORAGE_KEY_FC = "qa_prep_fc_status_v1";
  const STORAGE_KEY_BUGS = "qa_prep_bugs_v2";
  const STORAGE_KEY_GH = "qa_prep_github_repo_v1";
  const STORAGE_KEY_ROADMAP = "qa_prep_roadmap_done_v1";

  function safeGet(k, fallback) {
    try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch {}
  }

  const DEFAULT_REPO = window.DATA_HUB.defaultRepo || "supercoko/Game_QA_Experience_Web";
  const IS_PRIVATE = window.QA_APP_MODE === "private";
  const DATA_BASE = IS_PRIVATE ? "../data" : "./data";
  const FORBIDDEN_ORIGINS = new Set(["mock", "demo", "fake", "synthetic", "simulated", "sample", "fabricated"]);

  const state = {
    activeTab: "overview",
    jobTier: "ALL",
    jobCompany: "ALL",
    introTab: (window.DATA_JOBS && window.DATA_JOBS.selfIntros && window.DATA_JOBS.selfIntros[0]?.id) || "",
    onlineGame: "ALL",
    tcModule: "ALL",
    // Flashcards
    fcCat: "ALL",
    fcFilterMode: "ALL", // ALL | TODO | HARD
    fcIndex: 0,
    fcFlipped: false,
    fcStatus: JSON.parse(safeGet(STORAGE_KEY_FC, "{}")), // { id: 'hard' | 'fuzzy' | 'mastered' }
    // Roadmap checklist
    roadmapDone: new Set(JSON.parse(safeGet(STORAGE_KEY_ROADMAP, "[]"))),
    // Automation Hub & CI Ingestion (Strict Real-Data-Only)
    autoData: window.DATA_HUB.defaultAutomationData,
    autoSource: "仓库基线：web/data/automation-runs.json（仅真实数据）",
    autoGameFilter: "ALL",
    expandedRuns: new Set(),
    ciWorkflowRuns: null,
    ciLoading: false,
    ciError: "",
    ciLastSynced: "",
    ciDraftJson: "",
    ciDispatchMsg: "",
    ciDispatchErr: "",
    ciTokenMemory: "",
    // Bug Feedback
    bugs: JSON.parse(safeGet(STORAGE_KEY_BUGS, "null")) || window.DATA_HUB.initialBugs,
    bugStatusFilter: "ALL",
    bugPrefill: null,
    githubRepo: safeGet(STORAGE_KEY_GH, DEFAULT_REPO) || DEFAULT_REPO,
    ghIssues: null,
    ghError: "",
    // Mastery
    mastered: new Set(JSON.parse(safeGet(STORAGE_KEY_MASTERY, "[]")))
  };

  const SECTION_TITLES = IS_PRIVATE ? {
    overview: "总览与校准策略（本地私有模式）",
    jobs: "岗位匹配评估 · 27 个官方 JD",
    intro: "个人介绍话术 · 3 套精简版（60s / 2min）",
    qa: "工作经历与必考追问 · 36 题（已拆分实际做过 vs 延伸思路）",
    online: "四款游戏版本修复条目分析 · 4,134 条公告梳理",
    methods: "游戏测试方法论 & 实战用例库",
    roadmap: "求职复盘诊断 & 6 周并行投递路线",
    study: "技术知识卡片 · 43 张（含 UE → Unity 迁移与通用测试方法）",
    autohub: "非侵入自动化观测工具（原神已实现）& CI 真实数据看板",
    feedback: "缺陷记录看板 & GitHub Pages 部署说明"
  } : {
    overview: "能力概览与作品集总览",
    online: "四款商业游戏版本修复条目分析（4,134 条）",
    methods: "游戏测试方法论 & 实战用例库",
    study: "游戏 QA 技术知识卡片库",
    autohub: "非侵入自动化观测工具 & CI 真实数据看板",
    feedback: "缺陷记录看板 & 架构说明"
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
    if (IS_PRIVATE && Array.isArray(window.DATA_QA)) {
      window.DATA_QA.forEach(t => t.layers.forEach(l => ids.push(`${t.id}-${l.layer}`)));
    }
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

  /* ---------- Automation Run Helpers (Schema v2 + Anti-Mock Validation) ---------- */
  function getRunMetrics(r) {
    const m = r.metrics || {};
    return {
      coldStartSec: m.coldStartSec !== undefined ? m.coldStartSec : (r.coldStartSec ?? null),
      avgFps: m.avgFps !== undefined ? m.avgFps : (r.avgFps ?? null),
      low1Fps: m.low1Fps !== undefined ? m.low1Fps : (r.low1Fps ?? null),
      p99FrameTimeMs: m.p99FrameTimeMs ?? null,
      hitchCount50ms: m.hitchCount50ms ?? null,
      hitchCount100ms: m.hitchCount100ms ?? null,
      memMbAvg: m.memMbAvg !== undefined ? m.memMbAvg : (r.memMb ?? null),
      memMbPeak: m.memMbPeak ?? null,
      framesAnalyzed: m.framesAnalyzed ?? null,
      teleportLoadsSec: Array.isArray(m.teleportLoadsSec) ? m.teleportLoadsSec : []
    };
  }

  function fmtNum(val, suffix = "", digits = 1) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return "未采集";
    return Number(val).toFixed(digits) + suffix;
  }

  function avgNullable(arr, digits = 1) {
    const valid = arr.filter(v => v !== null && v !== undefined && !Number.isNaN(Number(v))).map(Number);
    if (!valid.length) return null;
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(digits);
  }

  function validateClientRunPayload(run) {
    const errs = [];
    if (!run || typeof run !== "object") return ["报告必须是 JSON 对象"];
    for (const k of ["id", "game", "gameKey", "version", "suite", "mode", "timestamp", "date", "status", "dataOrigin"]) {
      if (typeof run[k] !== "string" || !run[k].trim()) errs.push(`缺少字段 ${k}`);
    }
    const origin = String(run.dataOrigin || "").trim().toLowerCase();
    if (FORBIDDEN_ORIGINS.has(origin) || !["real_capture", "real_replay"].includes(origin)) {
      errs.push(`dataOrigin='${run.dataOrigin}' 不合规：仅接受 real_capture / real_replay，拒绝编造/模拟数据`);
    }
    if (!["PASS", "WARN", "FAIL"].includes(run.status)) errs.push(`非法状态 status='${run.status}'`);
    if (!Array.isArray(run.cases)) errs.push("缺少 cases 数组");
    if (!Array.isArray(run.findings)) errs.push("缺少 findings 数组");
    return errs;
  }

  function extractRunsFromImportedJson(parsed) {
    if (parsed && Array.isArray(parsed.runs)) {
      return { isStore: true, store: parsed, runs: parsed.runs };
    }
    if (parsed && parsed.run && typeof parsed.run === "object") {
      return { isStore: false, store: null, runs: [parsed.run] };
    }
    if (parsed && typeof parsed === "object" && parsed.id && parsed.game) {
      return { isStore: false, store: null, runs: [parsed] };
    }
    throw new Error("未识别的 JSON 格式（需为单轮 report.json 或标准 automation-runs.json）");
  }

  /* ---------- Trend Chart SVG for Automation Hub ---------- */
  function renderTrendSVG(runs) {
    const ordered = [...runs].filter(r => r.passRate !== null && r.passRate !== undefined).reverse();
    if (!ordered.length) return `<div style="color:var(--text-muted);padding:14px 4px;font-size:13px;">尚无真实巡检通过率数据，运行原神非侵入工具并接入 CI 后将自动绘制趋势曲线。</div>`;
    const W = 680, H = 200, padL = 44, padR = 24, padT = 20, padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const stepX = ordered.length > 1 ? plotW / (ordered.length - 1) : 0;

    const yPass = v => padT + plotH - ((Math.max(0, Math.min(100, v))) / 100) * plotH;
    const ptsPass = ordered.map((r, i) => [
      ordered.length === 1 ? padL + plotW / 2 : padL + i * stepX,
      yPass(Number(r.passRate))
    ]);
    const polyPass = ptsPass.map(p => p.join(",")).join(" ");

    let grid = "";
    [0, 50, 100].forEach(v => {
      const y = yPass(v);
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3" />`;
      grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="10.5">${v}%</text>`;
    });

    let dots = "";
    ordered.forEach((r, i) => {
      const [x, y] = ptsPass[i];
      const m = getRunMetrics(r);
      const col = r.status === "PASS" ? "var(--success)" : r.status === "WARN" ? "var(--warning)" : "var(--danger)";
      dots += `<circle cx="${x}" cy="${y}" r="5.5" fill="${col}" stroke="var(--bg-elev)" stroke-width="2"><title>${escHtml(r.game)} ${escHtml(r.date)}: 通过率 ${r.passRate}% | 1% Low ${fmtNum(m.low1Fps, " FPS")}</title></circle>`;
      dots += `<text x="${x}" y="${y - 9}" text-anchor="middle" fill="var(--text)" font-size="10.5" font-weight="700">${r.passRate}%</text>`;
      dots += `<text x="${x}" y="${H - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${escHtml((r.date || "").slice(5))} · ${escHtml((r.game || "").slice(0, 3))}</text>`;
    });

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:220px;display:block;">
        ${grid}
        ${ordered.length > 1 ? `<polyline fill="none" stroke="var(--primary)" stroke-width="2.5" points="${polyPass}" />` : ""}
        ${dots}
      </svg>`;
  }

  /* ---------- 1. Overview ---------- */
  function renderOverview() {
    const pub = window.DATA_PUBLIC_PROFILE;
    const realRuns = state.autoData.runs || [];
    const fcCount = window.DATA_STUDY.flashcards.length;

    if (!IS_PRIVATE) {
      const html = `
        <div class="callout">
          <strong>${escHtml(pub.title)}</strong> · ${escHtml(pub.years)}
          <br/>${escHtml(pub.positioning)}
        </div>

        <div class="grid-4">
          <div class="kpi-card">
            <div class="kpi-label">版本修复条目分析</div>
            <div class="kpi-value" style="color:var(--primary)">${window.DATA_ONLINE.summary.totalBugs.toLocaleString()} 条</div>
            <div class="kpi-sub">4 款商业游戏 · ${window.DATA_ONLINE.summary.totalDocs} 篇大版本公告</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">方法论与实战用例</div>
            <div class="kpi-value" style="color:var(--success)">${window.DATA_METHODS.methodologies.length} + ${window.DATA_METHODS.testCases.length}</div>
            <div class="kpi-sub">8 大方法论 + 14 条核心边界用例</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">QA 技术知识卡片</div>
            <div class="kpi-value" style="color:var(--accent)">${fcCount} 张</div>
            <div class="kpi-sub">${window.DATA_STUDY.gapOverview.length} 大领域（含 UE→Unity 概念迁移）</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">非侵入自动化实测</div>
            <div class="kpi-value" style="color:var(--primary)">${realRuns.length ? `${realRuns.length} 轮实测` : "原神已实现"}</div>
            <div class="kpi-sub">仅真实采集数据 · CI Schema v2 校验</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 class="card-title">能力侧重点六维概览（自评） <span class="pill pill-a">UE · Vue3/Flask · 白盒定位</span></h3>
            ${renderRadarSVG(pub.radar)}
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${escHtml(pub.radarNote)}</div>
          </div>
          <div class="card">
            <h3 class="card-title">四款游戏 4,134 条版本修复公告分类统计</h3>
            ${renderPatternBars(window.DATA_ONLINE.summary.patternStats)}
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 class="card-title">核心工程与测试实践</h3>
            <ul style="margin:0;padding-left:18px;">
              ${pub.highlights.map(s => `<li style="margin-bottom:8px;">${escHtml(s)}</li>`).join("")}
            </ul>
          </div>
          <div class="card">
            <h3 class="card-title">作品集模块导航</h3>
            <div style="display:grid;gap:10px;">
              ${pub.portfolioModules.map(m => `
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;" onclick="window.__goSec('${m.sec}')">
                  <div style="font-weight:700;color:var(--primary);margin-bottom:4px;">${escHtml(m.title)} →</div>
                  <div style="font-size:12.8px;color:var(--text-secondary);">${escHtml(m.desc)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
      document.getElementById("view-overview").innerHTML = html;
      return;
    }

    const p = window.DATA_JOBS.profileSummary;
    const sJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "S");
    const aJobs = window.DATA_JOBS.jobs.filter(j => j.tier === "A");
    const totalQA = (window.DATA_QA || []).reduce((acc, t) => acc + t.layers.length, 0) + window.DATA_ONLINE.interviewQAs.length;
    const note = window.DATA_JOBS.strategyNote;
    const html = `
      <div class="callout warn">
        <strong>${escHtml(note.title)}</strong>
        <ul style="margin:6px 0 8px;padding-left:18px;">
          ${note.bullets.slice(0, 3).map(b => `<li style="margin-bottom:4px;">${escHtml(b)}</li>`).join("")}
        </ul>
        <button class="btn btn-primary btn-sm" onclick="window.__goSec('roadmap')">查看完整复盘诊断 & 6 周并行路线 →</button>
      </div>

      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-label">校准后第一优先（S 级）</div>
          <div class="kpi-value" style="color:var(--success)">${sJobs.length} 个</div>
          <div class="kpi-sub">${escHtml(sJobs.map(j => j.short || j.title).join(" / "))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">第二优先（A 级）</div>
          <div class="kpi-value" style="color:var(--primary)">${aJobs.length} 个</div>
          <div class="kpi-sub">${escHtml(aJobs.map(j => j.short || j.title).join(" / "))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">追问题库 + 技术卡片</div>
          <div class="kpi-value" style="color:var(--accent)">${totalQA} 题 + ${fcCount} 卡</div>
          <div class="kpi-sub">含离职/空窗期/反问清单、Unity 迁移、通用测试方法</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">非侵入自动化实测</div>
          <div class="kpi-value" style="color:var(--primary)">${realRuns.length ? `${realRuns.length} 轮实测` : "原神已实现"}</div>
          <div class="kpi-sub">真实数据 · 已脱敏 UID 与本地路径</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">能力六维雷达图（自评参考） <span class="pill pill-a">UE · Vue3/Flask · 白盒定位</span></h3>
          ${renderRadarSVG(p.radar)}
        </div>
        <div class="card">
          <h3 class="card-title">四款游戏 4,134 条版本修复公告分类统计</h3>
          ${renderPatternBars(window.DATA_ONLINE.summary.patternStats)}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">已有优势（面向业务/系统 QA 岗）</h3>
          <ul style="margin:0;padding-left:18px;">
            ${pub.highlights.map(s => `<li style="margin-bottom:8px;">${escHtml(s)}</li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <h3 class="card-title">客观短板与风险提示</h3>
          <ul style="margin:0;padding-left:18px;">
            ${p.gaps.map(g => `<li style="margin-bottom:8px;">${escHtml(g)}</li>`).join("")}
          </ul>
          <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="window.__goSec('study')">刷 ${fcCount} 张技术知识卡片 →</button>
            <button class="btn btn-sm" onclick="window.__goSec('qa')">演练 36 道追问（含离职/反问） →</button>
            <button class="btn btn-sm" onclick="window.__goSec('autohub')">查看自动化看板 →</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("view-overview").innerHTML = html;
  }

  /* ---------- 2. Jobs ---------- */
  function renderJobs() {
    if (!IS_PRIVATE || !window.DATA_JOBS) return;
    const jobs = window.DATA_JOBS.jobs;
    const filtered = jobs.filter(j => {
      if (state.jobTier !== "ALL" && j.tier !== state.jobTier) return false;
      if (state.jobCompany !== "ALL" && j.company !== state.jobCompany) return false;
      return true;
    });

    const tierMeta = {
      S: { cls: "pill-s", text: "S 级 · 第一优先" },
      A: { cls: "pill-a", text: "A 级 · 第二优先" },
      B: { cls: "pill-b", text: "B 级 · 需准备/暂缓" },
      C: { cls: "pill-c", text: "C 级 · 不匹配" }
    };
    const note = window.DATA_JOBS.strategyNote;

    const html = `
      <div class="callout warn">
        <strong>${escHtml(note.title)}</strong>
        <ul style="margin:6px 0 0;padding-left:18px;">
          ${note.bullets.map(b => `<li style="margin-bottom:4px;">${escHtml(b)}</li>`).join("")}
        </ul>
      </div>

      <div class="filter-bar">
        <span style="font-size:13px;font-weight:700;color:var(--text-muted);">推荐等级：</span>
        ${["ALL", "S", "A", "B", "C"].map(t => `
          <button class="filter-chip ${state.jobTier === t ? "active" : ""}" data-tier="${t}">
            ${t === "ALL" ? `全部 (${jobs.length})` : `${t} 级 (${jobs.filter(j => j.tier === t).length})`}
          </button>`).join("")}
        <span style="margin-left:8px;font-size:13px;font-weight:700;color:var(--text-muted);">公司：</span>
        ${["ALL", ...new Set(jobs.map(j => j.company))].map(c => `
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
    if (!IS_PRIVATE || !window.DATA_JOBS) return;
    const intros = window.DATA_JOBS.selfIntros;
    const cur = intros.find(i => i.id === state.introTab) || intros[0];

    const html = `
      <div class="callout">
        <strong>口述原则：</strong>1 分钟版控制在 60~70 秒（约 260 字），2 分钟版控制在 2 分钟内（约 500 字），只讲真实经历，技术栈细节留给面试官追问。
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
    if (!IS_PRIVATE || !window.DATA_QA) return;
    const totalCount = window.DATA_QA.reduce((acc, t) => acc + t.layers.length, 0);
    const html = `
      <div class="callout">
        <strong>深度追问演练（共 ${totalCount} 题）：</strong>每道题已严格拆分<strong>【实际做过】</strong>与<strong>【如果继续迭代 / 延伸思路】</strong>，避免把未落地的方案说成已做过；新增专题六（离职原因、空窗期、Unity 迁移、职级对齐与反问面试官）。
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn btn-primary btn-sm" id="qa-expand-all">展开全部 ${totalCount} 题</button>
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
      <div class="callout">
        <strong>${escHtml(data.summary.scopeNote || "")}</strong>
      </div>

      <div class="grid-4">
        ${data.summary.games.map(g => `
          <div class="kpi-card" style="border-top:3px solid ${g.color}">
            <div class="kpi-label">${escHtml(g.name)} · ${g.docs} 篇公告</div>
            <div class="kpi-value" style="color:${g.color}">${g.bugs.toLocaleString()} 条</div>
            <div class="kpi-sub">${escHtml(g.note)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:22px 0 12px;font-size:17px;">一、八类典型版本修复专题（源自公开更新公告）</h3>
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
              <strong>工程关联：</strong>${escHtml(a.linkToSelf)}
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

      <h3 style="margin:26px 0 12px;font-size:17px;">二、线上质量保障与应急典型问题拆解（6 题）</h3>
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
              <th style="width:175px;">关联修复条目 / 实践</th>
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
        <strong>游戏 QA 技术知识卡片库（共 ${data.gapOverview.length} 大领域 · ${data.flashcards.length} 张）：</strong>覆盖线上发布运维、性能与渲染、Web 全栈工程、弱网安全、AI/VLM 工程化、多端规范、核心业务建模、通用测试方法与 UE → Unity 概念迁移。点击卡片可翻转查看详解与要点，阅读状态保存在本地浏览器。
      </div>

      <h3 style="margin:0 0 12px;font-size:16.5px;">一、${data.gapOverview.length} 大技术知识地图</h3>
      <div class="grid-3">
        ${data.gapOverview.map(g => `
          <div class="card" style="padding:15px;">
            <div class="card-title" style="font-size:14.5px;margin-bottom:6px;">
              <span>${escHtml(g.cat)}</span>
              <span class="pill ${g.priority.startsWith("P0") ? "pill-c" : g.priority.startsWith("P1") ? "pill-a" : "pill-muted"}">${escHtml(g.priority)}</span>
            </div>
            <div style="font-size:12.8px;color:var(--text-secondary);margin-bottom:6px;"><strong>学习目标：</strong>${escHtml(g.why)}</div>
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

  /* ---------- ★ Real Interview Diagnosis & 6-Week Parallel Roadmap ---------- */
  function renderRoadmap() {
    if (!IS_PRIVATE || !window.DATA_ROADMAP) return;
    const rm = window.DATA_ROADMAP;
    const allTasks = rm.roadmapWeeks.flatMap(w => w.tasks);
    const doneTasks = allTasks.filter(t => state.roadmapDone.has(t.id)).length;
    const pct = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0;

    const html = `
      <div class="callout warn">
        <strong>${escHtml(rm.diagnosis.headline)}</strong>
        <br/>${escHtml(rm.diagnosis.summary)}
      </div>

      <h3 style="margin:0 0 12px;font-size:17px;">一、真实面试反馈深度解剖（为什么会被拒？症结在哪里？）</h3>
      <div class="grid-3">
        ${rm.diagnosis.feedbacks.map(f => `
          <div class="card" style="border-top:3px solid var(--danger);">
            <div class="card-title" style="font-size:14.5px;margin-bottom:8px;">
              <span>${escHtml(f.source)}</span>
              <span class="pill pill-c">真实信号</span>
            </div>
            <div style="font-weight:700;color:var(--danger);background:var(--danger-soft);padding:7px 10px;border-radius:6px;margin-bottom:10px;font-size:13px;">
              原话：“${escHtml(f.quote)}”
            </div>
            <div style="font-size:13.2px;color:var(--text-secondary);margin-bottom:10px;">
              <strong>底层真相：</strong>${escHtml(f.truth)}
            </div>
            <div style="font-size:13px;color:var(--primary);background:var(--primary-soft);padding:8px 10px;border-radius:6px;">
              <strong>止血动作：</strong>${escHtml(f.action)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:22px 0 12px;font-size:17px;">二、战略抉择：立刻选定主战赛道（停止两头摇摆）</h3>
      <div class="grid-2">
        ${rm.diagnosis.routeChoice.map((rc, i) => `
          <div class="card" style="border-left:4px solid ${i === 0 ? "var(--success)" : "var(--warning)"};">
            <div class="card-title" style="font-size:15px;">
              <span>${escHtml(rc.name)}</span>
              <span class="pill ${i === 0 ? "pill-s" : "pill-b"}">${escHtml(rc.fit)}</span>
            </div>
            <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:8px;">
              目标岗位池：${escHtml(rc.targets)}
            </div>
            <div style="font-size:13.4px;color:var(--text-secondary);">${escHtml(rc.why)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">三、专治“系统侧面试说不太清楚”：四层架构万能逐字模板</h3>
      ${rm.speakingTemplates.map(tpl => `
        <div class="card" style="margin-bottom:16px;">
          <div class="card-title">${escHtml(tpl.title)}</div>
          <div class="pitfall-tag" style="margin-bottom:12px;">${escHtml(tpl.wrongWay)}</div>
          <div class="grid-2" style="margin-bottom:0;">
            ${tpl.layers.map(l => `
              <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
                <div style="font-weight:700;color:var(--primary);font-size:13.5px;margin-bottom:6px;">${escHtml(l.step)}</div>
                <div style="font-size:13.3px;line-height:1.7;color:var(--text);">${escHtml(l.script)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}

      <h3 style="margin:24px 0 12px;font-size:17px;">四、四块短板务实补齐方案（战斗 / 任务 / 商业化与上线 / UE→Unity 迁移）</h3>
      <div class="grid-2">
        ${rm.missingDomains.map(d => `
          <div class="card">
            <div class="card-title" style="font-size:14.8px;">${escHtml(d.domain)}</div>
            <div style="font-size:12.5px;color:var(--success);background:var(--success-soft);padding:7px 9px;border-radius:6px;margin-bottom:10px;">
              <strong>可借力的既有筹码：</strong>${escHtml(d.leverage)}
            </div>
            <ul style="margin:0 0 10px;padding-left:17px;font-size:13px;">
              ${d.framework.map(fw => `<li style="margin-bottom:5px;">${escHtml(fw)}</li>`).join("")}
            </ul>
            <div style="font-size:12.8px;color:var(--primary);background:var(--primary-soft);padding:8px 10px;border-radius:6px;margin-bottom:10px;">
              ${escHtml(d.practiceTask)}
            </div>
            <div style="font-size:12.8px;color:var(--text-secondary);background:var(--bg-subtle);padding:8px 10px;border-radius:6px;">
              ${escHtml(d.interviewScript)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">
        五、6 周并行突围执行清单（已完成 ${doneTasks} / ${allTasks.length} · ${pct}%）
      </h3>
      <div class="progress-track" style="height:10px;margin-bottom:16px;">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>

      <div class="grid-2">
        ${rm.roadmapWeeks.map(w => `
          <div class="card">
            <div class="card-title">
              <span>${escHtml(w.phase)} · ${escHtml(w.title)}</span>
            </div>
            <div style="font-size:12.8px;color:var(--accent);background:var(--accent-soft);padding:6px 10px;border-radius:6px;margin-bottom:12px;">
              <strong>阶段目标：</strong>${escHtml(w.goal)}
            </div>
            <div style="display:grid;gap:8px;">
              ${w.tasks.map(t => {
                const checked = state.roadmapDone.has(t.id);
                return `
                  <label style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:${checked ? "var(--success-soft)" : "var(--bg)"};cursor:pointer;font-size:13.2px;">
                    <input type="checkbox" class="rm-chk" data-rmid="${escHtml(t.id)}" ${checked ? "checked" : ""} style="margin-top:3px;" />
                    <span style="${checked ? "text-decoration:line-through;color:var(--text-muted);" : ""}">${escHtml(t.text)}</span>
                  </label>`;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;

    const container = document.getElementById("view-roadmap");
    container.innerHTML = html;
    container.querySelectorAll(".rm-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.dataset.rmid;
        if (chk.checked) state.roadmapDone.add(id);
        else state.roadmapDone.delete(id);
        safeSet(STORAGE_KEY_ROADMAP, JSON.stringify([...state.roadmapDone]));
        renderRoadmap();
      });
    });
  }

  /* ---------- 8. Non-Intrusive Automation & CI Real-Data Dashboard ---------- */
  function renderCiBadge(run) {
    const ci = run.ci || {};
    const provider = ci.provider || "local-cli";
    const label = provider === "github-actions"
      ? `GitHub CI${ci.jobRunNumber ? ` #${ci.jobRunNumber}` : ""}`
      : provider === "jenkins"
        ? `Jenkins${ci.jobRunNumber ? ` #${ci.jobRunNumber}` : ""}`
        : provider === "local-preview"
          ? "本地预览(未入库)"
          : "本地 CLI";
    const pillCls = provider === "github-actions" ? "pill-s" : provider === "jenkins" ? "pill-a" : "pill-muted";
    const linkHtml = ci.jobUrl
      ? `<a href="${escHtml(ci.jobUrl)}" target="_blank" rel="noopener" class="pill ${pillCls}">${escHtml(label)} ↗</a>`
      : `<span class="pill ${pillCls}">${escHtml(label)}</span>`;
    const subParts = [];
    if (ci.triggeredBy) subParts.push(ci.triggeredBy);
    if (ci.commitSha) subParts.push(ci.commitSha.slice(0, 7));
    return `
      <div>${linkHtml}</div>
      ${subParts.length ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;font-family:monospace;">${escHtml(subParts.join(" · "))}</div>` : ""}
    `;
  }

  function renderAutoHub() {
    const plan = window.DATA_STUDY.nonIntrusivePlan;
    const runsAll = state.autoData.runs || [];
    const runs = runsAll.filter(r => state.autoGameFilter === "ALL" || r.game === state.autoGameFilter);
    const ciSummary = state.autoData.ci || {};

    const avgPass = avgNullable(runs.map(r => r.passRate), 1);
    const avgCold = avgNullable(runs.map(r => getRunMetrics(r).coldStartSec), 1);
    const avgLow1 = avgNullable(runs.map(r => getRunMetrics(r).low1Fps), 1);
    const totalFindings = runs.reduce((s, r) => s + (r.findings?.length || 0), 0);

    const repoSlug = state.githubRepo || DEFAULT_REPO;
    const cliPushCmd = `cd automation\n$env:GITHUB_TOKEN = "<具备 Contents:Write 的 Fine-grained PAT>"\nuv run qa-observer genshin observe --duration 120 --ci-push --ci-repo ${repoSlug}`;

    const html = `
      <div class="callout warn">
        ${escHtml(plan.complianceNotice)}
      </div>

      <div class="callout success">
        <strong>真实数据与 CI 门禁策略（Real-Data-Only）：</strong>
        本站已彻底移除全部编造/演示巡检数据。所有展示记录均须来自真实工具执行（<code>dataOrigin: real_capture | real_replay</code>），由 <code>.github/workflows/ingest-automation-run.yml</code> 校验 Schema v2 并自动触发 GitHub Pages 重新部署；未挂载 PresentMon / OCR 的指标如实标注“未采集”。
      </div>

      <h3 style="margin:0 0 12px;font-size:17px;">一、真实巡检数据展示看板（Schema v2 · 零编造数据）</h3>
      <div class="card" style="margin-bottom:18px;">
        <div class="ci-strip">
          <span><strong>数据源：</strong>${escHtml(state.autoSource)}</span>
          <span>|</span>
          <span><strong>策略：</strong><span class="pill pill-s">${escHtml(state.autoData.policy || "real-data-only")}</span></span>
          <span>|</span>
          <span><strong>最后 CI 入库：</strong>${escHtml(ciSummary.lastIngestAt || state.autoData.updatedAt || "尚无真实入库记录")}</span>
          ${ciSummary.lastJobUrl ? `<a href="${escHtml(ciSummary.lastJobUrl)}" target="_blank" rel="noopener">最近入库 Job ↗</a>` : ""}
        </div>

        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;">
          <div class="filter-bar" style="margin-bottom:0;">
            ${["ALL", "原神", "崩坏：星穹铁道", "绝区零", "明日方舟：终末地"].map(g => {
              const cnt = g === "ALL" ? runsAll.length : runsAll.filter(r => r.game === g).length;
              return `
                <button class="filter-chip ${state.autoGameFilter === g ? "active" : ""}" data-agame="${escHtml(g)}">
                  ${g === "ALL" ? `全部游戏 (${cnt})` : `${g} (${cnt})`}
                </button>`;
            }).join("")}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="sync-remote-json-btn">🔄 同步仓库最新数据</button>
            <label class="btn btn-sm" style="cursor:pointer;">
              📂 导入真实 report.json 预览
              <input type="file" id="import-auto-json" accept=".json" style="display:none;" />
            </label>
            <button class="btn btn-sm" id="export-auto-json">⬇ 导出当前 JSON</button>
          </div>
        </div>

        <div class="grid-4">
          <div class="kpi-card">
            <div class="kpi-label">真实巡检总轮次</div>
            <div class="kpi-value">${runs.length}</div>
            <div class="kpi-sub">仅统计实测 / 真实回放记录</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">平均用例通过率</div>
            <div class="kpi-value" style="color:${avgPass !== null ? "var(--success)" : "var(--text-muted)"}">${avgPass !== null ? `${avgPass}%` : "--"}</div>
            <div class="kpi-sub">跳过项 (SKIP) 不计入分母</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">实测冷启动 / 1% Low FPS</div>
            <div class="kpi-value" style="color:${(avgCold !== null || avgLow1 !== null) ? "var(--primary)" : "var(--text-muted)"}">${avgCold !== null ? `${avgCold}s` : "--"} / ${avgLow1 !== null ? avgLow1 : "--"}</div>
            <div class="kpi-sub">仅汇总真实挂载 PresentMon 的轮次</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">实测检出异常条目</div>
            <div class="kpi-value" style="color:${totalFindings > 0 ? "var(--danger)" : "var(--success)"}">${totalFindings} 条</div>
            <div class="kpi-sub">支持一键转入 Bug 反馈单</div>
          </div>
        </div>

        ${runs.length ? `
          <div style="margin-bottom:18px;">
            <div style="font-size:13.5px;font-weight:700;margin-bottom:6px;">真实巡检通过率趋势</div>
            ${renderTrendSVG(runs)}
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run ID / 时间</th>
                  <th>游戏与版本</th>
                  <th>套件 / 模式</th>
                  <th>CI 接入来源</th>
                  <th>状态 / 通过率</th>
                  <th>实测性能基线</th>
                  <th>检出异常 (Findings)</th>
                </tr>
              </thead>
              <tbody>
                ${runs.map(r => {
                  const m = getRunMetrics(r);
                  const env = r.environment || {};
                  const isExp = state.expandedRuns.has(r.id);
                  const originLabel = r.dataOrigin === "real_replay" ? "真实回放" : "实机采集";
                  return `
                    <tr>
                      <td>
                        <div style="font-weight:700;font-family:monospace;">${escHtml(r.id)}</div>
                        <div style="font-size:12px;color:var(--text-muted);">${escHtml(r.date || "")}</div>
                        <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">
                          <span class="pill pill-muted">${originLabel}</span>
                          <button class="btn btn-sm toggle-run-detail" data-runid="${escHtml(r.id)}" style="padding:2px 7px;font-size:11px;">
                            ${isExp ? "收起明细 ▲" : `用例明细 (${(r.cases || []).length}) ▼`}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style="font-weight:700;">${escHtml(r.game)}</div>
                        <div style="font-size:12px;color:var(--text-muted);">版本：${escHtml(r.version || "unknown")}</div>
                      </td>
                      <td>
                        <div style="font-weight:600;">${escHtml(r.suite)}</div>
                        <div style="font-size:11.8px;color:var(--accent);margin-top:3px;">mode: ${escHtml(r.mode)} · 耗时 ${escHtml(r.durationSec ?? "-")}s</div>
                      </td>
                      <td>${renderCiBadge(r)}</td>
                      <td>
                        <span class="pill status-${escHtml(r.status)}">${escHtml(r.status)}${r.passRate !== null && r.passRate !== undefined ? ` · ${r.passRate}%` : ""}</span>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                          通过 ${r.passedCases ?? 0}/${r.totalCases ?? 0}${r.skippedCases ? ` (跳过 ${r.skippedCases})` : ""}
                        </div>
                      </td>
                      <td style="font-size:12.4px;">
                        冷启动：<strong>${fmtNum(m.coldStartSec, "s", 1)}</strong><br/>
                        均帧 / 1% Low：<strong>${fmtNum(m.avgFps, "", 1)} / ${fmtNum(m.low1Fps, "", 1)}</strong><br/>
                        P99 帧时间：<strong>${fmtNum(m.p99FrameTimeMs, "ms", 1)}</strong><br/>
                        内存均/峰：<strong>${fmtNum(m.memMbAvg, "MB", 0)} / ${fmtNum(m.memMbPeak, "MB", 0)}</strong><br/>
                        分析帧数：<strong>${m.framesAnalyzed ?? "未采集"}</strong>
                      </td>
                      <td>
                        ${r.findings && r.findings.length ? r.findings.map((f, fIdx) => `
                          <div class="quote-item" style="margin-bottom:6px;">
                            <span class="pill ${f.severity === "P0" || f.severity === "P1" ? "pill-c" : "pill-b"}" style="margin-right:4px;">${escHtml(f.severity)}</span>
                            <strong>${escHtml(f.rule)}</strong>：${escHtml(f.msg)}
                            <div style="margin-top:5px;">
                              <button class="btn btn-sm finding-to-bug-btn" data-runid="${escHtml(r.id)}" data-fidx="${fIdx}" style="padding:2px 8px;font-size:11.5px;">转入 Bug 反馈 -></button>
                            </div>
                          </div>
                        `).join("") : `<span style="color:var(--success);font-weight:600;">✓ 零异常</span>`}
                      </td>
                    </tr>
                    ${isExp ? `
                      <tr>
                        <td colspan="7" style="background:var(--bg-subtle);padding:12px 14px;">
                          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:8px;">
                            <strong>采集环境：</strong>OS=${escHtml(env.os || "-")} | 分辨率=${escHtml(env.resolution || "未采集")} |
                            捕获后端=${escHtml(env.captureBackend || "未采集")} | PresentMon=${env.presentmonAttached ? "已挂载" : "未挂载"} |
                            OCR=${escHtml(env.ocrEngine || "未启用")} | 传送加载(s)=${escHtml(m.teleportLoadsSec.length ? m.teleportLoadsSec.join(", ") : "无")}
                          </div>
                          <div class="case-detail-box">
                            <table style="font-size:12.6px;">
                              <thead>
                                <tr>
                                  <th style="width:130px;">用例 ID</th>
                                  <th style="width:240px;">检测项名称</th>
                                  <th style="width:80px;">结果</th>
                                  <th style="width:80px;">耗时</th>
                                  <th>实测详情</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${(r.cases || []).map(c => `
                                  <tr>
                                    <td style="font-family:monospace;font-weight:700;">${escHtml(c.caseId)}</td>
                                    <td>${escHtml(c.name)}</td>
                                    <td><span class="pill status-${escHtml(c.status)}">${escHtml(c.status)}</span></td>
                                    <td>${escHtml(c.durationSec ?? 0)}s</td>
                                    <td>${escHtml(c.detail || "")}</td>
                                  </tr>
                                `).join("")}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ` : ""}
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <h4>📭 当前暂无真实巡检记录入库（已清零全部编造数据）</h4>
            <p>
              原神非侵入自动化工具（<span class="mono-inline">automation/src/qa_observer/games/genshin.py</span>）与 GitHub Actions CI 自动入库流水线已全部就绪。
              在本机运行一次真实观测或录屏回放，通过 CI 推送或本地导入，即可在此实时展示真实性能基线、用例明细与异常证据！
            </p>
            <pre class="code-block" style="text-align:left;max-width:780px;margin:0 auto 12px;"><code>${escHtml(cliPushCmd)}</code></pre>
            <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" id="empty-copy-cli-btn">📋 复制原神运行 + CI 上报命令</button>
              <button class="btn btn-sm" id="empty-sync-ci-btn">🔄 拉取 GitHub Actions 流水线状态</button>
            </div>
          </div>
        `}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">二、CI 自动化数据接入中心（GitHub Actions / Jenkins / 在线 Dispatch）</h3>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">
            <span>GitHub Actions 实时流水线状态</span>
            <span class="pill pill-a">Public API · 零后端</span>
          </div>
          <div class="form-field">
            <label class="form-label">目标 GitHub 仓库（<code>owner/repo</code>，与 Bug 反馈页共用配置）</label>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="ci-repo-input" value="${escHtml(repoSlug)}" placeholder="supercoko/Game_QA_Experience_Web" />
              <button class="btn btn-primary btn-sm" id="fetch-ci-runs-btn">${state.ciLoading ? "拉取中..." : "拉取 CI 状态"}</button>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
            实时查询 <span class="mono-inline">ingest-automation-run.yml</span>、<span class="mono-inline">ci-quality-gate.yml</span> 与 <span class="mono-inline">deploy-pages.yml</span> 的最近执行记录。
            ${state.ciLastSynced ? `上次同步：<strong>${escHtml(state.ciLastSynced)}</strong>` : ""}
          </div>
          ${state.ciError ? `<div class="pitfall-tag" style="margin-bottom:10px;">${escHtml(state.ciError)}</div>` : ""}
          ${state.ciWorkflowRuns ? `
            <div style="max-height:280px;overflow-y:auto;">
              ${state.ciWorkflowRuns.length ? state.ciWorkflowRuns.map(wr => {
                const st = wr.conclusion || wr.status || "queued";
                const stCls = st === "success" ? "pill-s" : (st === "failure" || st === "cancelled") ? "pill-c" : "pill-b";
                return `
                  <div class="quote-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div>
                      <span class="pill ${stCls}" style="margin-right:6px;">${escHtml(st)}</span>
                      <strong>${escHtml(wr.name)} #${wr.run_number}</strong>
                      <div style="font-size:11.8px;color:var(--text-muted);margin-top:2px;">
                        事件：${escHtml(wr.event)} · Commit ${escHtml((wr.head_sha || "").slice(0, 7))} · ${escHtml((wr.created_at || "").replace("T", " ").slice(0, 16))}
                      </div>
                    </div>
                    <a class="btn btn-sm" href="${escHtml(wr.html_url)}" target="_blank" rel="noopener">日志 ↗</a>
                  </div>`;
              }).join("") : `<div style="font-size:13px;color:var(--text-muted);">仓库暂未查到工作流运行记录，推送新代码或触发一次 CI 上报后即可在此查看。</div>`}
            </div>
          ` : `
            <div style="background:var(--bg-subtle);padding:12px;border-radius:8px;font-size:12.8px;color:var(--text-secondary);">
              点击右上角<strong>“拉取 CI 状态”</strong>可直连 GitHub Actions Public API，展示本仓库真实的 CI 数据入库、质量门禁和 Pages 发布记录（Public 仓库无需 Token）。
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-title">
            <span>在线推送真实报告至 CI（repository_dispatch）</span>
            <span class="pill pill-purple">反编造校验</span>
          </div>
          <div class="form-field">
            <label class="form-label">选择或粘贴由 <code>qa-observer genshin</code> 生成的真实 <code>report.json</code></label>
            <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
              <label class="btn btn-sm" style="cursor:pointer;">
                📄 从本地加载 report.json
                <input type="file" id="ci-load-draft-file" accept=".json" style="display:none;" />
              </label>
              <button class="btn btn-sm" id="ci-validate-draft-btn">✓ 校验 Schema v2</button>
              <button class="btn btn-sm" id="ci-copy-curl-btn">📋 复制 curl / CLI 上报命令</button>
            </div>
            <textarea class="form-textarea" id="ci-draft-json" style="font-family:monospace;font-size:12px;min-height:110px;" placeholder="粘贴真实单轮 report.json（仅接受 dataOrigin=real_capture 或 real_replay）...">${escHtml(state.ciDraftJson)}</textarea>
          </div>
          <div class="form-field">
            <label class="form-label">GitHub Fine-grained PAT（仅当前会话内存使用，绝不写入浏览器存储；需 Contents: Write）</label>
            <div style="display:flex;gap:8px;">
              <input class="form-input" type="password" id="ci-pat-input" value="${escHtml(state.ciTokenMemory)}" placeholder="github_pat_...（选填，留空可复制 CLI 命令在终端上报）" />
              <button class="btn btn-primary btn-sm" id="ci-dispatch-btn">🚀 触发 CI 入库</button>
            </div>
          </div>
          ${state.ciDispatchMsg ? `<div class="callout success" style="margin:8px 0 0;padding:8px 12px;font-size:12.8px;">${escHtml(state.ciDispatchMsg)}</div>` : ""}
          ${state.ciDispatchErr ? `<div class="pitfall-tag" style="margin-top:8px;">${escHtml(state.ciDispatchErr)}</div>` : ""}
        </div>
      </div>

      <div class="grid-2">
        ${(window.DATA_HUB.ciChannels || []).map(ch => `
          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:14.5px;margin-bottom:6px;">
              <span>${escHtml(ch.name)}</span>
            </div>
            <div style="font-size:12px;color:var(--primary);font-family:monospace;margin-bottom:6px;">${escHtml(ch.workflow)} · ${escHtml(ch.trigger)}</div>
            <div style="font-size:13px;color:var(--text-secondary);">${escHtml(ch.detail)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">三、面向线上真实包体的四层非侵入自动化架构</h3>
      <div class="grid-2">
        ${plan.architecture.map(a => `
          <div class="card">
            <div class="card-title" style="font-size:15px;">${escHtml(a.layer)}</div>
            <div style="font-size:12.5px;color:var(--primary);font-weight:600;margin-bottom:8px;">技术栈：${escHtml(a.tech)}</div>
            <div style="font-size:13.4px;color:var(--text-secondary);">${escHtml(a.detail)}</div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">四、四款游戏差异化非侵入巡检落地方案（原神已落地工具）</h3>
      <div class="grid-2">
        ${plan.gameScenarios.map(gs => {
          const isImpl = gs.gameKey === "genshin";
          return `
            <div class="card" style="${isImpl ? "border-left:4px solid var(--success);" : ""}">
              <div class="card-title">
                <span>${escHtml(gs.game)}</span>
                <span class="pill ${isImpl ? "pill-s" : "pill-muted"}">${escHtml(gs.implStatus || gs.badge)}</span>
              </div>
              ${gs.configPath ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">配置：<span class="mono-inline">${escHtml(gs.configPath)}</span> &nbsp;|&nbsp; 模块：<span class="mono-inline">${escHtml(gs.adapterPath || "")}</span></div>` : ""}
              <ul style="margin:0 0 10px;padding-left:18px;font-size:13.4px;">
                ${gs.scenarios.map(s => `<li style="margin-bottom:6px;">${escHtml(s)}</li>`).join("")}
              </ul>
              <div style="font-size:12.5px;color:var(--success);background:var(--success-soft);padding:6px 10px;border-radius:6px;">
                <strong>呼应线上真实逃逸案例：</strong>${escHtml(gs.mappedOnlineBug)}
              </div>
            </div>`;
        }).join("")}
      </div>

      <h3 style="margin:24px 0 12px;font-size:17px;">五、原神非侵入工具实际 CLI 用法 & Schema v2 数据契约</h3>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">原神工具实操与 CI 上报命令（<code>automation/</code>） <button class="btn btn-sm" id="copy-py-btn">复制命令</button></div>
          <pre class="code-block"><code>${escHtml(plan.pythonSnippet)}</code></pre>
        </div>
        <div class="card">
          <div class="card-title">Schema v2 标准格式（含 CI 溯源字段） <button class="btn btn-sm" id="copy-schema-btn">复制 Schema</button></div>
          <pre class="code-block"><code>${escHtml(window.DATA_HUB.jsonSchemaDoc)}</code></pre>
        </div>
      </div>
    `;

    const container = document.getElementById("view-autohub");
    container.innerHTML = html;

    async function fetchCiWorkflowRuns() {
      const repo = (document.getElementById("ci-repo-input")?.value || state.githubRepo || DEFAULT_REPO).trim();
      if (!repo || !repo.includes("/")) {
        state.ciError = "请输入正确的 owner/repo 格式";
        renderAutoHub();
        return;
      }
      state.githubRepo = repo;
      safeSet(STORAGE_KEY_GH, repo);
      state.ciLoading = true;
      state.ciError = "";
      renderAutoHub();
      try {
        const resp = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=10`, {
          headers: { Accept: "application/vnd.github+json" }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}（请确认仓库为 Public 且拼写正确）`);
        const data = await resp.json();
        state.ciWorkflowRuns = Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
        state.ciLastSynced = new Date().toLocaleTimeString();
      } catch (err) {
        state.ciError = "拉取 GitHub Actions 状态失败：" + err.message;
      } finally {
        state.ciLoading = false;
        renderAutoHub();
      }
    }

    async function syncRemoteAutomationJson() {
      const repo = (document.getElementById("ci-repo-input")?.value || state.githubRepo || DEFAULT_REPO).trim();
      const candidates = [];
      if (window.location.protocol !== "file:") {
        candidates.push({ url: `${DATA_BASE}/automation-runs.json?t=` + Date.now(), label: `在线实时加载：${DATA_BASE}/automation-runs.json` });
      }
      if (repo && repo.includes("/")) {
        candidates.push({
          url: `https://raw.githubusercontent.com/${repo}/HEAD/web/data/automation-runs.json?t=${Date.now()}`,
          label: `GitHub Raw 同步：${repo}@HEAD`
        });
      }
      for (const c of candidates) {
        try {
          const resp = await fetch(c.url);
          if (!resp.ok) continue;
          const json = await resp.json();
          if (Array.isArray(json.runs)) {
            state.autoData = json;
            state.autoSource = `${c.label}（${json.runs.length} 条真实记录）`;
            renderOverview();
            renderAutoHub();
            return;
          }
        } catch {}
      }
      alert("未能从在线地址拉取最新 JSON，请确认网络连通或使用“导入真实 report.json 预览”。");
    }

    container.querySelectorAll("[data-agame]").forEach(btn => {
      btn.addEventListener("click", () => { state.autoGameFilter = btn.dataset.agame; renderAutoHub(); });
    });

    container.querySelectorAll(".toggle-run-detail").forEach(btn => {
      btn.addEventListener("click", () => {
        const rid = btn.dataset.runid;
        if (state.expandedRuns.has(rid)) state.expandedRuns.delete(rid);
        else state.expandedRuns.add(rid);
        renderAutoHub();
      });
    });

    container.querySelectorAll(".finding-to-bug-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const run = (state.autoData.runs || []).find(r => r.id === btn.dataset.runid);
        const f = run?.findings?.[Number(btn.dataset.fidx)];
        if (!run || !f) return;
        state.bugPrefill = {
          game: run.game,
          severity: f.severity || "P1",
          module: f.caseId || f.rule || "非侵入巡检",
          runId: run.id,
          title: `[${f.rule}] ${f.msg.slice(0, 48)}`,
          steps: `1. 运行 qa-observer (${run.mode}) 巡检套件：${run.suite}（版本 ${run.version}）；\n2. 观测规则触发：${f.rule}（Case ${f.caseId}）；\n3. 复核对应证据截图：${f.evidencePath || "见本地 automation/reports/runs/" + run.id}。`,
          expected: "客户端运行、渲染与 UI 表现符合基线阈值，无视觉/文本/性能告警。",
          actual: f.msg
        };
        renderFeedback();
        switchSection("feedback");
      });
    });

    document.getElementById("sync-remote-json-btn")?.addEventListener("click", syncRemoteAutomationJson);
    document.getElementById("fetch-ci-runs-btn")?.addEventListener("click", fetchCiWorkflowRuns);
    document.getElementById("empty-sync-ci-btn")?.addEventListener("click", fetchCiWorkflowRuns);
    document.getElementById("empty-copy-cli-btn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(cliPushCmd).then(() => alert("已复制原神实操 + CI 上报命令！"));
    });

    document.getElementById("import-auto-json")?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const extracted = extractRunsFromImportedJson(parsed);
          for (const r of extracted.runs) {
            const errs = validateClientRunPayload(r);
            if (errs.length) throw new Error(errs.join("；"));
          }
          if (extracted.isStore) {
            state.autoData = extracted.store;
          } else {
            const existing = [...(state.autoData.runs || [])];
            for (const r of extracted.runs) {
              const previewRun = { ...r, ci: { ...(r.ci || {}), provider: (r.ci && r.ci.provider) || "local-preview" } };
              const idx = existing.findIndex(x => x.id === previewRun.id);
              if (idx >= 0) existing[idx] = previewRun;
              else existing.unshift(previewRun);
            }
            state.autoData = { ...state.autoData, runs: existing, updatedAt: new Date().toISOString().slice(0, 19) + "Z" };
          }
          state.autoSource = `本地真实文件预览：${file.name}`;
          renderOverview();
          renderAutoHub();
        } catch (err) {
          alert("导入被拒绝（严格反编造校验）：" + err.message);
        }
      };
      reader.readAsText(file, "utf-8");
    });

    document.getElementById("ci-load-draft-file")?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.ciDraftJson = String(reader.result || "");
        state.ciDispatchMsg = "";
        state.ciDispatchErr = "";
        renderAutoHub();
      };
      reader.readAsText(file, "utf-8");
    });

    document.getElementById("ci-draft-json")?.addEventListener("input", e => {
      state.ciDraftJson = e.target.value;
    });
    document.getElementById("ci-pat-input")?.addEventListener("input", e => {
      state.ciTokenMemory = e.target.value.trim();
    });

    document.getElementById("ci-validate-draft-btn")?.addEventListener("click", () => {
      state.ciDispatchMsg = "";
      state.ciDispatchErr = "";
      try {
        const parsed = JSON.parse(state.ciDraftJson || "");
        const extracted = extractRunsFromImportedJson(parsed);
        if (!extracted.runs.length) throw new Error("未包含任何巡检记录");
        for (const r of extracted.runs) {
          const errs = validateClientRunPayload(r);
          if (errs.length) throw new Error(errs.join("；"));
        }
        state.ciDispatchMsg = `✓ 校验通过：共 ${extracted.runs.length} 条真实记录（${extracted.runs[0].id}），符合 Schema v2 且非编造数据，可安全上报 CI！`;
      } catch (err) {
        state.ciDispatchErr = "校验未通过：" + err.message;
      }
      renderAutoHub();
    });

    document.getElementById("ci-copy-curl-btn")?.addEventListener("click", () => {
      const repo = (document.getElementById("ci-repo-input")?.value || state.githubRepo || DEFAULT_REPO).trim();
      const cmd = `# CLI 一键推送（推荐）：\nuv run qa-observer ci push --report reports/runs/<RUN-ID>/report.json --repo ${repo}\n\n# 或通过 GitHub Actions API (curl) 触发 repository_dispatch：\ncurl -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/${repo}/dispatches -d '{"event_type":"automation-run-report","client_payload":{"run":<REAL_REPORT_JSON>}}'`;
      navigator.clipboard?.writeText(cmd).then(() => alert("已复制 CI 上报命令！"));
    });

    document.getElementById("ci-dispatch-btn")?.addEventListener("click", async () => {
      const repo = (document.getElementById("ci-repo-input")?.value || state.githubRepo || DEFAULT_REPO).trim();
      const pat = (document.getElementById("ci-pat-input")?.value || state.ciTokenMemory).trim();
      state.ciDispatchMsg = "";
      state.ciDispatchErr = "";
      try {
        if (!repo || !repo.includes("/")) throw new Error("请先填写正确的 GitHub 仓库 owner/repo");
        if (!pat) throw new Error("请填入具备仓库 Contents: Write 权限的 GitHub Fine-grained PAT，或使用 CLI 命令在终端上报");
        const parsed = JSON.parse(state.ciDraftJson || "");
        const extracted = extractRunsFromImportedJson(parsed);
        if (extracted.runs.length !== 1) throw new Error("在线 Dispatch 每次请提交单轮真实 report.json");
        const run = extracted.runs[0];
        const errs = validateClientRunPayload(run);
        if (errs.length) throw new Error(errs.join("；"));

        const resp = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${pat}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event_type: "automation-run-report",
            client_payload: { run, submitted_by: "web-dashboard" }
          })
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`GitHub API HTTP ${resp.status}: ${text.slice(0, 180)}`);
        }
        state.ciDispatchMsg = `🚀 已成功触发 GitHub Actions CI 入库（${run.id}）！约 20~40 秒后点击“拉取 CI 状态”与“同步仓库最新数据”即可看到最新记录。`;
      } catch (err) {
        state.ciDispatchErr = "CI 上报失败：" + err.message;
      }
      renderAutoHub();
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
    const pf = state.bugPrefill || {};

    const html = `
      <div class="callout success">
        <strong>纯静态 GitHub Pages 如何实现真正的 Bug 反馈闭环？</strong>
        <br/>本模块采用<strong>真实数据双模架构（已清零全部编造示例缺陷）</strong>：① <strong>本地缺陷看板</strong>（表单手工提单或从第 8 节真实自动化 Finding 一键带入，状态流转并导出 Markdown/JSON）；② <strong>GitHub Issues 零后端持久化</strong>（填写 <code>${escHtml(state.githubRepo || DEFAULT_REPO)}</code> 一键生成结构化 Issue 落库，并实时拉取仓库真实 Issues！）。
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">提交新 Bug 反馈单 ${state.bugPrefill ? `<span class="pill pill-a">已带入真实自动化异常</span>` : ""}</h3>
          <form id="bug-submit-form">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">所属游戏</label>
                <select class="form-select" id="bf-game">
                  ${["原神", "崩坏：星穹铁道", "绝区零", "明日方舟：终末地", "在研UE项目 / 其他"].map(g => `<option ${pf.game === g ? "selected" : ""}>${g}</option>`).join("")}
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">严重级别</label>
                <select class="form-select" id="bf-sev">
                  ${[
                    ["P0", "P0 · 阻塞/闪退/资损"],
                    ["P1", "P1 · 核心功能/状态异常"],
                    ["P2", "P2 · UI表现/偶现异常"],
                    ["P3", "P3 · 文案/体验优化"]
                  ].map(([val, lbl]) => `<option value="${val}" ${(pf.severity || "P1") === val ? "selected" : ""}>${lbl}</option>`).join("")}
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">模块标签</label>
                <input class="form-input" id="bf-mod" value="${escHtml(pf.module || "")}" placeholder="如：手柄热切换 / 背包 / 弱网重连" required />
              </div>
              <div class="form-field">
                <label class="form-label">关联自动化 Run ID（选填）</label>
                <input class="form-input" id="bf-runid" value="${escHtml(pf.runId || "")}" placeholder="如：RUN-YS-20261120-183000-a1b2" />
              </div>
              <div class="form-field full">
                <label class="form-label">Bug 标题</label>
                <input class="form-input" id="bf-title" value="${escHtml(pf.title || "")}" placeholder="简明描述：触发条件 + 异常表现" required />
              </div>
              <div class="form-field full">
                <label class="form-label">复现步骤</label>
                <textarea class="form-textarea" id="bf-steps" placeholder="1. 前置条件...&#10;2. 关键操作...&#10;3. 观察结果..." required>${escHtml(pf.steps || "")}</textarea>
              </div>
              <div class="form-field">
                <label class="form-label">预期结果</label>
                <input class="form-input" id="bf-exp" value="${escHtml(pf.expected || "")}" placeholder="应符合怎样的规则/表现" required />
              </div>
              <div class="form-field">
                <label class="form-label">实际结果</label>
                <input class="form-input" id="bf-act" value="${escHtml(pf.actual || "")}" placeholder="实际发生的异常现象" required />
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
              <input class="form-input" id="gh-repo-input" value="${escHtml(state.githubRepo)}" placeholder="例如：supercoko/Game_QA_Experience_Web" />
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
              <strong>为什么推荐 GitHub Pages + GitHub Actions CI + GitHub Issues？</strong><br/>
              面试官打开你的在线作品集网址，看到的是 100% 真实巡检入库的 CI 图表与真实的 GitHub Issues 协作闭环，零虚构数据、0 服务器费用、长期在线！
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
        ${filteredBugs.length ? filteredBugs.map(b => `
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
        `).join("") : `
          <div class="empty-state" style="margin-bottom:18px;">
            <h4>📋 当前尚无本地缺陷记录（已移除编造样例 Bug）</h4>
            <p>可通过上方表单记录实测发现的问题，或在“第 8 节 · 非侵入自动化 & CI 看板”中对真实检出的异常点击“转入 Bug 反馈”，也可直接点击右侧“拉取真实 Issues”同步 GitHub 仓库缺陷。</p>
          </div>
        `}
      </div>

      <h3 style="margin:26px 0 12px;font-size:17px;">GitHub Pages & CI 数据入库一键部署方案（已配置完整 Workflow）</h3>
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
      state.bugPrefill = null;
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
    if (IS_PRIVATE && window.DATA_JOBS) {
      window.DATA_JOBS.jobs.forEach(j => {
        if ((j.title + j.company + j.direction + j.hits.join("") + j.advice).toLowerCase().includes(q)) {
          hits.push({ sec: "jobs", tag: `岗位 · ${j.tier}级`, title: `${j.company} - ${j.title} (${j.score}%)`, sub: j.advice });
        }
      });
    }
    if (IS_PRIVATE && Array.isArray(window.DATA_QA)) {
      window.DATA_QA.forEach(t => {
        t.layers.forEach(l => {
          if ((l.q + l.answer + l.intent).toLowerCase().includes(q)) {
            hits.push({ sec: "qa", tag: `追问 · ${l.layer}`, title: l.q, sub: t.title });
          }
        });
      });
    }
    window.DATA_STUDY.flashcards.forEach(c => {
      if ((c.cat + c.front + c.back + c.golden).toLowerCase().includes(q)) {
        hits.push({ sec: "study", tag: `知识卡片 · ${c.cat}`, title: c.front, sub: c.golden });
      }
    });
    window.DATA_ONLINE.archetypes.forEach(a => {
      if ((a.title + a.rootCause + a.quotes.map(x => x.text).join("")).toLowerCase().includes(q)) {
        hits.push({ sec: "online", tag: "版本修复专题", title: a.title, sub: a.rootCause });
      }
    });
    window.DATA_ONLINE.interviewQAs.forEach(o => {
      if ((o.q + o.answer).toLowerCase().includes(q)) {
        hits.push({ sec: "online", tag: "线上质量专题", title: o.q, sub: o.intent });
      }
    });
    window.DATA_METHODS.testCases.forEach(tc => {
      if ((tc.title + tc.steps + tc.expected + tc.onlineRef).toLowerCase().includes(q)) {
        hits.push({ sec: "methods", tag: `用例 · ${tc.id}`, title: tc.title, sub: tc.onlineRef });
      }
    });
    (state.autoData.runs || []).forEach(r => {
      if ((r.id + r.game + r.suite + JSON.stringify(r.findings || [])).toLowerCase().includes(q)) {
        const pr = r.passRate !== null && r.passRate !== undefined ? ` (${r.passRate}%)` : "";
        hits.push({ sec: "autohub", tag: `自动化 · ${r.id}`, title: `${r.game} - ${r.suite}`, sub: `${r.status}${pr}` });
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
      const resp = await fetch(`${DATA_BASE}/automation-runs.json?t=` + Date.now());
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.runs)) {
          state.autoData = json;
          state.autoSource = json.runs.length
            ? `在线实时加载：${DATA_BASE}/automation-runs.json（${json.runs.length} 条 CI/实测记录）`
            : `在线实时加载：${DATA_BASE}/automation-runs.json（当前 0 条，等待真实 CI 入库）`;
          renderOverview();
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
    renderRoadmap();
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
