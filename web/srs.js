/**
 * 艾宾浩斯遗忘曲线 + SM-2 间隔重复引擎（零依赖，file:// 与 https:// 通用）
 * 挂载于 window.QA_SRS
 */
(function (root) {
  "use strict";

  const MS_PER_DAY = 86400000;
  const TEN_MIN_DAYS = 10 / 1440;
  const DEFAULT_EF = 2.5;
  const MIN_EF = 1.3;
  const MAX_EF = 3.2;
  const MAX_HISTORY = 30;

  function round1(val) {
    return Math.round(val * 10) / 10;
  }

  function round2(val) {
    return Math.round(val * 100) / 100;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function parseTs(iso) {
    if (!iso) return NaN;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : NaN;
  }

  /**
   * 构造默认空记录
   */
  function createEmptyRecord(cardId) {
    return {
      id: cardId,
      reps: 0,
      lapses: 0,
      intervalDays: 0,
      easeFactor: DEFAULT_EF,
      lastReviewAt: null,
      nextReviewAt: null,
      lastRating: null,
      history: []
    };
  }

  /**
   * 规范化记录对象，避免外部导入脏数据
   */
  function normalizeRecord(cardId, raw) {
    if (!raw || typeof raw !== "object") return createEmptyRecord(cardId);
    const ef = Number(raw.easeFactor);
    const iv = Number(raw.intervalDays);
    const reps = Number(raw.reps);
    const lapses = Number(raw.lapses);
    const lr = Number(raw.lastRating);
    return {
      id: cardId || raw.id || "",
      reps: Number.isFinite(reps) && reps >= 0 ? Math.floor(reps) : 0,
      lapses: Number.isFinite(lapses) && lapses >= 0 ? Math.floor(lapses) : 0,
      intervalDays: Number.isFinite(iv) && iv >= 0 ? iv : 0,
      easeFactor: Number.isFinite(ef) ? clamp(round2(ef), MIN_EF, MAX_EF) : DEFAULT_EF,
      lastReviewAt: typeof raw.lastReviewAt === "string" ? raw.lastReviewAt : null,
      nextReviewAt: typeof raw.nextReviewAt === "string" ? raw.nextReviewAt : null,
      lastRating: [1, 2, 3, 4].includes(lr) ? lr : null,
      history: Array.isArray(raw.history) ? raw.history.slice(-MAX_HISTORY) : []
    };
  }

  /**
   * 计算实时记忆保持率 R(t) = 0.85 ^ (elapsedDays / effInterval)
   * 新卡未学返回 null；已学卡返回 5~100 整数百分比
   */
  function computeRetention(record, nowMs = Date.now()) {
    if (!record || !record.lastReviewAt) return null;
    const lastMs = parseTs(record.lastReviewAt);
    if (!Number.isFinite(lastMs)) return null;
    const elapsedDays = Math.max(0, (nowMs - lastMs) / MS_PER_DAY);
    const effInterval = Math.max(Number(record.intervalDays) || 0.25, 0.25);
    const retention = Math.pow(0.85, elapsedDays / effInterval) * 100;
    return clamp(Math.round(retention), 5, 100);
  }

  /**
   * 纯函数：计算评分后的下一次状态（供 previewIntervals 与 reviewCard 复用）
   * rating: 1=重来 | 2=困难 | 3=良好 | 4=简单
   */
  function calcNextState(record, rating, nowMs = Date.now()) {
    const rec = normalizeRecord(record && record.id, record);
    const r = [1, 2, 3, 4].includes(Number(rating)) ? Number(rating) : 3;
    let reps = rec.reps;
    let lapses = rec.lapses;
    let ef = rec.easeFactor;
    let intervalDays = rec.intervalDays;

    if (r === 1) {
      reps = 0;
      lapses += 1;
      intervalDays = TEN_MIN_DAYS;
      ef = clamp(round2(ef - 0.2), MIN_EF, MAX_EF);
    } else if (r === 2) {
      if (reps === 0) {
        intervalDays = 0.5;
        reps = 1;
      } else {
        intervalDays = Math.max(1, round1((intervalDays || 1) * 1.2));
        reps += 1;
      }
      ef = clamp(round2(ef - 0.15), MIN_EF, MAX_EF);
    } else if (r === 3) {
      if (reps === 0) intervalDays = 1;
      else if (reps === 1) intervalDays = 3;
      else if (reps === 2) intervalDays = 7;
      else intervalDays = Math.max(1, round1((intervalDays || 7) * ef));
      reps += 1;
    } else {
      if (reps === 0) intervalDays = 4;
      else if (reps === 1) intervalDays = 7;
      else intervalDays = Math.max(1, round1((intervalDays || 7) * ef * 1.3));
      reps += 1;
      ef = clamp(round2(ef + 0.15), MIN_EF, MAX_EF);
    }

    const nextReviewAt = new Date(nowMs + intervalDays * MS_PER_DAY).toISOString();
    return {
      reps,
      lapses,
      intervalDays,
      easeFactor: ef,
      lastRating: r,
      lastReviewAt: new Date(nowMs).toISOString(),
      nextReviewAt
    };
  }

  /**
   * 格式化间隔天数
   */
  function formatInterval(days) {
    const d = Number(days);
    if (!Number.isFinite(d) || d <= 0) return "立即";
    if (d < 1 / 24) {
      const mins = Math.max(1, Math.round(d * 1440));
      return `${mins}分钟后`;
    }
    if (d < 1) {
      const hrs = Math.max(1, Math.round(d * 24));
      return `${hrs}小时后`;
    }
    if (d < 30) {
      const shown = Number.isInteger(d) ? d : round1(d);
      return `${shown}天后`;
    }
    const months = round1(d / 30);
    return `${months}个月后`;
  }

  /**
   * 格式化距离到期时间描述
   */
  function formatDueDelta(nextReviewAt, nowMs = Date.now()) {
    const nextMs = parseTs(nextReviewAt);
    if (!Number.isFinite(nextMs)) return "未安排";
    const diffMs = nextMs - nowMs;
    if (diffMs <= 0) {
      const overdueDays = Math.abs(diffMs) / MS_PER_DAY;
      if (overdueDays >= 1) return `已逾期 ${round1(overdueDays)} 天`;
      const overdueHrs = Math.floor(Math.abs(diffMs) / 3600000);
      if (overdueHrs >= 1) return `已逾期 ${overdueHrs} 小时`;
      return "已到期";
    }
    const remDays = diffMs / MS_PER_DAY;
    if (remDays < 1 / 24) {
      return `${Math.max(1, Math.round(remDays * 1440))}分钟后`;
    }
    if (remDays < 1) {
      return `${Math.max(1, Math.round(remDays * 24))}小时后`;
    }
    return `${round1(remDays)}天后`;
  }

  /**
   * 预览 4 个评分档位的下一次间隔
   */
  function previewIntervals(record, nowMs = Date.now()) {
    const out = {};
    [1, 2, 3, 4].forEach(r => {
      const next = calcNextState(record, r, nowMs);
      out[r] = {
        intervalDays: next.intervalDays,
        label: formatInterval(next.intervalDays),
        nextReviewAt: next.nextReviewAt,
        easeFactor: next.easeFactor,
        reps: next.reps
      };
    });
    return out;
  }

  /**
   * 提交一次评分并更新 history
   */
  function reviewCard(record, rating, nowMs = Date.now()) {
    const prev = normalizeRecord(record && record.id, record);
    const retentionBefore = computeRetention(prev, nowMs);
    const next = calcNextState(prev, rating, nowMs);
    const entry = {
      at: next.lastReviewAt,
      rating: next.lastRating,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      retentionBefore
    };
    const history = prev.history.concat([entry]).slice(-MAX_HISTORY);
    return {
      id: prev.id,
      reps: next.reps,
      lapses: next.lapses,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      lastReviewAt: next.lastReviewAt,
      nextReviewAt: next.nextReviewAt,
      lastRating: next.lastRating,
      history
    };
  }

  /**
   * 将旧版简单状态 ("mastered" | "fuzzy" | "hard") 迁移为 SrsRecord
   */
  function migrateLegacyStatus(cardId, legacyStatus, nowMs = Date.now()) {
    const nowIso = new Date(nowMs).toISOString();
    if (legacyStatus === "mastered") {
      return {
        id: cardId,
        reps: 3,
        lapses: 0,
        intervalDays: 7,
        easeFactor: DEFAULT_EF,
        lastReviewAt: nowIso,
        nextReviewAt: new Date(nowMs + 7 * MS_PER_DAY).toISOString(),
        lastRating: 3,
        history: [{ at: nowIso, rating: 3, intervalDays: 7, easeFactor: DEFAULT_EF, retentionBefore: null }]
      };
    }
    if (legacyStatus === "fuzzy") {
      return {
        id: cardId,
        reps: 1,
        lapses: 0,
        intervalDays: 1,
        easeFactor: 2.35,
        lastReviewAt: nowIso,
        nextReviewAt: new Date(nowMs + 1 * MS_PER_DAY).toISOString(),
        lastRating: 2,
        history: [{ at: nowIso, rating: 2, intervalDays: 1, easeFactor: 2.35, retentionBefore: null }]
      };
    }
    if (legacyStatus === "hard") {
      return {
        id: cardId,
        reps: 0,
        lapses: 1,
        intervalDays: TEN_MIN_DAYS,
        easeFactor: 2.3,
        lastReviewAt: nowIso,
        nextReviewAt: nowIso,
        lastRating: 1,
        history: [{ at: nowIso, rating: 1, intervalDays: TEN_MIN_DAYS, easeFactor: 2.3, retentionBefore: null }]
      };
    }
    return null;
  }

  /**
   * 判定卡片当前所处记忆阶段: "new" | "due" | "learning" | "consolidated"
   */
  function getCardStage(record, nowMs = Date.now()) {
    if (!record || !record.lastReviewAt) return "new";
    const nextMs = parseTs(record.nextReviewAt);
    if (!Number.isFinite(nextMs) || nextMs <= nowMs) return "due";
    if ((Number(record.intervalDays) || 0) < 7 || record.lastRating === 1) return "learning";
    return "consolidated";
  }

  /**
   * 智能排序队列：due(保持率低->高) -> new -> learning(最近到期) -> consolidated(最近到期)
   */
  function buildSmartQueue(cards, fcRecords, nowMs = Date.now()) {
    const stageOrder = { due: 0, new: 1, learning: 2, consolidated: 3 };
    const map = fcRecords || {};
    return cards
      .map((card, idx) => {
        const rec = map[card.id] ? normalizeRecord(card.id, map[card.id]) : null;
        const stage = getCardStage(rec, nowMs);
        const retention = computeRetention(rec, nowMs);
        const nextMs = rec ? parseTs(rec.nextReviewAt) : Infinity;
        return { card, idx, stage, retention: retention === null ? -1 : retention, nextMs: Number.isFinite(nextMs) ? nextMs : Infinity };
      })
      .sort((a, b) => {
        const sa = stageOrder[a.stage];
        const sb = stageOrder[b.stage];
        if (sa !== sb) return sa - sb;
        if (a.stage === "due") {
          if (a.retention !== b.retention) return a.retention - b.retention;
          return a.nextMs - b.nextMs;
        }
        if (a.stage === "new") return a.idx - b.idx;
        if (a.nextMs !== b.nextMs) return a.nextMs - b.nextMs;
        return a.idx - b.idx;
      })
      .map(x => x.card);
  }

  /**
   * 统计整体 SRS 指标与未来 7 天复习排期预测
   */
  function computeStats(cards, fcRecords, nowMs = Date.now()) {
    const map = fcRecords || {};
    const list = Array.isArray(cards) ? cards : [];
    const total = list.length;
    let studied = 0;
    let newCount = 0;
    let dueCount = 0;
    let learningCount = 0;
    let consolidatedCount = 0;
    let hardCount = 0;
    let retentionSum = 0;
    let easeSum = 0;
    let todayReviews = 0;
    let totalReviews = 0;

    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const todayEndMs = todayStartMs + MS_PER_DAY;
    const forecast7d = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStartMs + i * MS_PER_DAY);
      const label = i === 0 ? "今天" : i === 1 ? "明天" : `${d.getMonth() + 1}/${d.getDate()}`;
      return { dayOffset: i, label, count: 0 };
    });

    list.forEach(c => {
      const rec = map[c.id] ? normalizeRecord(c.id, map[c.id]) : null;
      const stage = getCardStage(rec, nowMs);
      if (stage === "new") {
        newCount += 1;
        return;
      }
      studied += 1;
      if (stage === "due") dueCount += 1;
      else if (stage === "learning") learningCount += 1;
      else consolidatedCount += 1;

      if (rec.lastRating === 1 || rec.lapses > 0 && stage !== "consolidated") {
        hardCount += 1;
      }
      const ret = computeRetention(rec, nowMs);
      if (ret !== null) retentionSum += ret;
      easeSum += rec.easeFactor || DEFAULT_EF;

      totalReviews += rec.history.length;
      rec.history.forEach(h => {
        const hMs = parseTs(h.at);
        if (Number.isFinite(hMs) && hMs >= todayStartMs && hMs < todayEndMs) {
          todayReviews += 1;
        }
      });

      const nextMs = parseTs(rec.nextReviewAt);
      if (Number.isFinite(nextMs)) {
        if (nextMs <= nowMs || nextMs < todayEndMs) {
          forecast7d[0].count += 1;
        } else {
          const offset = Math.floor((nextMs - todayStartMs) / MS_PER_DAY);
          if (offset >= 1 && offset < 7) {
            forecast7d[offset].count += 1;
          }
        }
      }
    });

    return {
      total,
      studied,
      newCount,
      dueCount,
      learningCount,
      consolidatedCount,
      hardCount,
      avgRetention: studied ? Math.round(retentionSum / studied) : 0,
      avgEase: studied ? round2(easeSum / studied) : DEFAULT_EF,
      todayReviews,
      totalReviews,
      forecast7d
    };
  }

  /**
   * 艾宾浩斯遗忘与强化曲线 SVG（0~30天），并叠加当前卡片实时坐标点
   */
  function renderForgettingCurveSVG(record, nowMs = Date.now()) {
    const W = 430;
    const H = 210;
    const padL = 38;
    const padR = 16;
    const padT = 18;
    const padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xOf = day => padL + (clamp(day, 0, 30) / 30) * plotW;
    const yOf = pct => padT + (1 - clamp(pct, 0, 100) / 100) * plotH;

    // 1. 无复习自然遗忘曲线: R(t) = 20 + 80 * e^(-0.42 * t)
    const naturalPts = [];
    for (let d = 0; d <= 30; d += 0.5) {
      const r = 20 + 80 * Math.exp(-0.42 * d);
      naturalPts.push(`${xOf(d).toFixed(1)},${yOf(r).toFixed(1)}`);
    }

    // 2. 间隔重复强化曲线（1d / 3d / 7d / 15d 复习节点拉回 100%）
    const checkpoints = [0, 1, 3, 7, 15, 30];
    const srsSegments = [];
    for (let i = 0; i < checkpoints.length - 1; i++) {
      const start = checkpoints[i];
      const end = checkpoints[i + 1];
      const span = Math.max(1, end - start);
      const segPts = [];
      for (let t = start; t <= end + 0.001; t += span / 12) {
        const dt = Math.min(t, end) - start;
        const pct = Math.pow(0.85, dt / span) * 100;
        segPts.push(`${xOf(Math.min(t, end)).toFixed(1)},${yOf(pct).toFixed(1)}`);
      }
      srsSegments.push(segPts.join(" "));
    }

    const y85 = yOf(85).toFixed(1);
    const gridLines = [0, 25, 50, 75, 100].map(pct => {
      const y = yOf(pct).toFixed(1);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-width="1" />
              <text x="${padL - 6}" y="${Number(y) + 3}" text-anchor="end" font-size="10" fill="var(--text-muted)">${pct}%</text>`;
    }).join("");

    const xTicks = [0, 1, 3, 7, 15, 30].map(d => {
      const x = xOf(d).toFixed(1);
      return `<line x1="${x}" y1="${padT}" x2="${x}" y2="${H - padB}" stroke="var(--border)" stroke-dasharray="2,3" stroke-width="1" />
              <text x="${x}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${d}d</text>`;
    }).join("");

    // 当前选中卡片的实时点
    let markerSvg = `<text x="${padL + 8}" y="${padT + 14}" font-size="11" fill="var(--text-muted)">当前卡：新卡未学（评分后开始追踪遗忘曲线）</text>`;
    if (record && record.lastReviewAt) {
      const lastMs = parseTs(record.lastReviewAt);
      const elapsed = Number.isFinite(lastMs) ? Math.max(0, (nowMs - lastMs) / MS_PER_DAY) : 0;
      const ret = computeRetention(record, nowMs);
      const nextIv = Number(record.intervalDays) || 0;
      const clampedDay = clamp(elapsed, 0, 30);
      const cx = xOf(clampedDay).toFixed(1);
      const cy = yOf(ret).toFixed(1);
      const isDue = getCardStage(record, nowMs) === "due";
      const dotColor = isDue ? "var(--danger)" : "var(--success)";

      // 当前卡片专属理论曲线
      const cardCurve = [];
      const effIv = Math.max(nextIv, 0.25);
      for (let d = 0; d <= 30; d += 0.5) {
        const pct = Math.max(5, Math.pow(0.85, d / effIv) * 100);
        cardCurve.push(`${xOf(d).toFixed(1)},${yOf(pct).toFixed(1)}`);
      }
      const nextX = xOf(clamp(nextIv, 0, 30)).toFixed(1);
      const nextY = yOf(85).toFixed(1);

      markerSvg = `
        <polyline fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4,2" points="${cardCurve.join(" ")}" />
        <circle cx="${nextX}" cy="${nextY}" r="3.5" fill="var(--warning)" />
        <circle cx="${cx}" cy="${cy}" r="5.5" fill="${dotColor}" stroke="var(--bg-elev)" stroke-width="2" />
        <text x="${Math.min(Number(cx) + 8, W - 125)}" y="${Math.max(Number(cy) - 8, padT + 12)}" font-size="10.5" font-weight="700" fill="${dotColor}">当前卡 ${ret}% (${round1(elapsed)}d)</text>
      `;
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;">
        ${gridLines}
        ${xTicks}
        <line x1="${padL}" y1="${y85}" x2="${W - padR}" y2="${y85}" stroke="var(--success)" stroke-width="1.2" stroke-dasharray="5,3" />
        <text x="${W - padR - 2}" y="${Number(y85) - 4}" text-anchor="end" font-size="9.5" fill="var(--success)">85% 复习阈值线</text>
        <polyline fill="none" stroke="var(--danger)" stroke-width="1.8" stroke-dasharray="4,4" opacity="0.75" points="${naturalPts.join(" ")}" />
        ${srsSegments.map(pts => `<polyline fill="none" stroke="var(--primary)" stroke-width="2.2" points="${pts}" />`).join("")}
        ${markerSvg}
        <g transform="translate(${padL}, ${H - 2})">
          <text x="0" y="0" font-size="9.5" fill="var(--danger)">--- 无复习自然遗忘</text>
          <text x="108" y="0" font-size="9.5" fill="var(--primary)">── 间隔复习强化 (1/3/7/15d)</text>
          <text x="258" y="0" font-size="9.5" fill="var(--accent)">--- 当前卡衰减路径</text>
        </g>
      </svg>`;
  }

  /**
   * 未来 7 天每日复习排期柱状图 SVG
   */
  function renderForecast7dSVG(forecast7d) {
    const items = Array.isArray(forecast7d) && forecast7d.length ? forecast7d : [
      { dayOffset: 0, label: "今天", count: 0 },
      { dayOffset: 1, label: "明天", count: 0 },
      { dayOffset: 2, label: "+2d", count: 0 },
      { dayOffset: 3, label: "+3d", count: 0 },
      { dayOffset: 4, label: "+4d", count: 0 },
      { dayOffset: 5, label: "+5d", count: 0 },
      { dayOffset: 6, label: "+6d", count: 0 }
    ];
    const W = 430;
    const H = 210;
    const padL = 28;
    const padR = 14;
    const padT = 24;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxVal = Math.max(4, ...items.map(i => i.count));
    const slotW = plotW / items.length;
    const barW = Math.min(34, slotW * 0.56);

    const bars = items.map((item, idx) => {
      const h = (item.count / maxVal) * plotH;
      const x = padL + idx * slotW + (slotW - barW) / 2;
      const y = padT + plotH - h;
      const fill = item.dayOffset === 0 && item.count > 0 ? "var(--warning)" : "var(--primary)";
      return `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="5" fill="${fill}" opacity="${item.count ? 0.9 : 0.2}" />
        <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)">${item.count}</text>
        <text x="${(x + barW / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--text-secondary)">${item.label}</text>
      `;
    }).join("");

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;">
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="var(--border-strong)" stroke-width="1" />
        ${bars}
      </svg>`;
  }

  root.QA_SRS = {
    DEFAULT_EF,
    MIN_EF,
    MAX_EF,
    createEmptyRecord,
    normalizeRecord,
    computeRetention,
    calcNextState,
    previewIntervals,
    reviewCard,
    migrateLegacyStatus,
    getCardStage,
    formatInterval,
    formatDueDelta,
    buildSmartQueue,
    computeStats,
    renderForgettingCurveSVG,
    renderForecast7dSVG
  };
})(typeof window !== "undefined" ? window : globalThis);
