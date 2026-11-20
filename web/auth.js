(function (root) {
  "use strict";

  const cachePrefix = "qa_learning_v1:";
  const guest = { username: "guest", displayName: "访客" };
  let user = guest;
  let records = new Map();
  let pending = new Map();
  let clock = 0;
  let client;
  let authReady = false;
  let syncTimer;
  let running;
  let syncAgain = false;
  const status = { syncing: false, lastError: "", lastSyncAt: null, localError: "" };
  const listeners = new Set();
  const config = root.QA_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.key && /^https?:$/.test(root.location.protocol));
  const keyOf = row => JSON.stringify([row.kind, row.item_id]);
  const newer = (a, b) => !b || a.changed_at > b.changed_at ||
    (a.changed_at === b.changed_at && a.change_id > b.change_id);
  const outboxPrefix = () => cachePrefix + user.username + ":outbox:";

  function read(key, fallback) {
    try { return JSON.parse(root.localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function emit(event) {
    listeners.forEach(listener => listener(event));
  }

  function merge(rows, target = records) {
    let changed = false;
    for (const row of rows) {
      const key = keyOf(row);
      clock = Math.max(clock, row.changed_at);
      if (newer(row, target.get(key))) {
        target.set(key, row);
        changed = true;
      }
    }
    return changed;
  }

  function persist() {
    try {
      root.localStorage.setItem(cachePrefix + user.username, JSON.stringify({
        records: [...records.values()]
      }));
    } catch {
      status.localError = "浏览器无法保存本地记录";
    }
  }

  function readOutbox() {
    const entries = [];
    try {
      const prefix = outboxPrefix();
      for (let index = 0; index < root.localStorage.length; index++) {
        const key = root.localStorage.key(index);
        if (key?.startsWith(prefix)) {
          const row = read(key, null);
          if (row) entries.push([key, row]);
        }
      }
    } catch {
      status.localError = "浏览器无法读取待同步记录";
    }
    const rows = entries.map(([, row]) => row);
    merge(rows, pending);
    const changed = merge(rows);
    return { entries, changed };
  }

  function activate(nextUser) {
    user = nextUser;
    const saved = read(cachePrefix + user.username, {});
    records = new Map();
    pending = new Map();
    clock = 0;
    merge(saved.records || []);
    status.lastError = "";
    status.lastSyncAt = null;
    status.localError = "";
    status.syncing = false;
    if (user !== guest) readOutbox();
    emit("account");
  }

  function makeRow(kind, item_id, value, changed_at = Math.max(Date.now(), clock + 1)) {
    const change_id = root.crypto.randomUUID ? root.crypto.randomUUID() : fallbackUuid();
    return { kind, item_id, value, changed_at, change_id };
  }

  function fallbackUuid() {
    const bytes = root.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
  }

  function save(rows) {
    merge(rows);
    status.localError = "";
    if (user !== guest) {
      merge(rows, pending);
      try {
        for (const row of rows) {
          root.localStorage.setItem(outboxPrefix() + row.change_id, JSON.stringify(row));
        }
      } catch {
        status.localError = "浏览器无法保存待同步记录，请保持页面打开";
      }
    }
    pruneActivity();
    persist();
    emit("status");
    if (user !== guest) scheduleSync(500);
  }

  function recordChange(kind, id, value, action) {
    const row = makeRow(kind, id, value);
    const activity = makeRow("activity", row.change_id, {
      at: new Date(row.changed_at).toISOString(), type: action, targetId: id
    }, row.changed_at);
    save([row, activity]);
  }

  function getCurrentProgress(source = records) {
    const progress = {
      mastered: Object.create(null), fcRecords: Object.create(null), roadmapDone: [], activityLog: []
    };
    const reset = source.get(keyOf({ kind: "card_reset", item_id: "all" }));
    const activity = [];
    for (const row of source.values()) {
      if (row.kind === "mastered" && row.value) progress.mastered[row.item_id] = row.value;
      if (row.kind === "card" && newer(row, reset)) {
        progress.fcRecords[row.item_id] = root.QA_SRS.normalizeRecord(row.item_id, row.value);
      }
      if (row.kind === "roadmap" && row.value) progress.roadmapDone.push(row.item_id);
      if (row.kind === "activity") activity.push(row);
    }
    activity.sort((a, b) => b.changed_at - a.changed_at || b.change_id.localeCompare(a.change_id));
    progress.activityLog = activity.slice(0, 200).map(row => row.value);
    return progress;
  }

  function pruneActivity() {
    const activity = [...records.values()].filter(row => row.kind === "activity");
    activity.sort((a, b) => b.changed_at - a.changed_at || b.change_id.localeCompare(a.change_id));
    for (const row of activity.slice(200)) {
      const key = keyOf(row);
      if (!pending.has(key)) records.delete(key);
    }
  }

  function scheduleSync(delay = 0) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sync, delay);
  }

  function sync() {
    if (!client || user === guest) return Promise.resolve(false);
    if (running) {
      syncAgain = true;
      return running;
    }
    const account = user.username;
    const isCurrent = () => user.username === account;
    status.syncing = true;
    status.lastError = "";
    emit("status");

    running = (async () => {
      let changed = false;
      try {
        do {
          const outbox = readOutbox();
          changed = outbox.changed || changed;
          const batch = [...pending.values()].slice(0, 100);
          const { data, error } = await client.rpc("qa_exchange_learning", { p_account: account, p_changes: batch });
          if (!isCurrent()) return false;
          if (error) throw error;
          changed = merge(data) || changed;
          for (const row of batch) {
            const key = keyOf(row);
            if (pending.get(key)?.change_id === row.change_id) pending.delete(key);
          }
          pruneActivity();
          persist();
          const sent = new Map(batch.map(row => [keyOf(row), row]));
          for (const [key, row] of outbox.entries) {
            if (sent.has(keyOf(row)) && !newer(row, sent.get(keyOf(row)))) {
              root.localStorage.removeItem(key);
            }
          }
        } while (pending.size && isCurrent());
        if (!pending.size) status.localError = "";
        status.lastSyncAt = new Date().toISOString();
        return true;
      } catch {
        if (isCurrent()) status.lastError = "同步失败，待同步记录已保留，可重试";
        return false;
      } finally {
        running = null;
        if (isCurrent()) {
          status.syncing = false;
          if (changed) emit("progress");
          emit("status");
        }
        if (syncAgain) {
          syncAgain = false;
          scheduleSync();
        }
      }
    })();
    return running;
  }

  function legacySources() {
    const old = read("qa_prep_accounts_v2", {});
    const sources = Object.entries(old.users || {})
      .filter(([, account]) => hasProgress(account?.progress))
      .map(([id, account]) => ({
        id: "account:" + id, name: account.displayName || id, progress: account.progress
      }));
    if (sources.length === 0) {
      const mastered = read("qa_prep_mastered_v1", []);
      const cards = read("qa_prep_fc_status_v1", {});
      const progress = {
        mastered: Object.fromEntries(Array.isArray(mastered) ? mastered.map(id => [id, true]) : []),
        roadmapDone: read("qa_prep_roadmap_done_v1", []),
        fcRecords: Object.fromEntries(Object.entries(cards).map(([id, value]) =>
          [id, root.QA_SRS.migrateLegacyStatus(id, value)]).filter(([, value]) => value))
      };
      if (hasProgress(progress)) sources.push({ id: "legacy", name: "旧版浏览器进度", progress });
    }
    return sources;
  }

  function hasProgress(progress) {
    return Boolean(progress && (Object.keys(progress.mastered || {}).length ||
      Object.keys(progress.fcRecords || {}).length || progress.roadmapDone?.length || progress.activityLog?.length));
  }

  function importProgress(progress) {
    if (!progress || typeof progress !== "object" || !hasProgress(progress)) {
      throw new Error("没有可导入的学习记录");
    }
    // Older exports have no tombstones. Import only records newer than a known edit.
    const rows = [];
    function add(kind, itemId, value, at) {
      if (!itemId || itemId.length > 200) return;
      const row = makeRow(kind, itemId, value, Math.max(0, Date.parse(at) || 1));
      const key = keyOf(row);
      const current = records.get(key);
      if (!current || row.changed_at > current.changed_at) rows.push(row);
    }
    for (const [id, value] of Object.entries(progress.mastered || {})) {
      if (value === true || value?.mastered) {
        add("mastered", id, {
          mastered: true, updatedAt: value.updatedAt || null, reviewCount: Number(value.reviewCount) || 1
        }, value.updatedAt);
      }
    }
    for (const [id, value] of Object.entries(progress.fcRecords || {})) {
      if (value && typeof value === "object") {
        const card = root.QA_SRS.normalizeRecord(id, value);
        add("card", id, card, card.lastReviewAt);
      }
    }
    if (Array.isArray(progress.roadmapDone)) {
      for (const id of new Set(progress.roadmapDone.map(String))) add("roadmap", id, true);
    }
    if (Array.isArray(progress.activityLog)) {
      for (const entry of progress.activityLog.slice(0, 200)) {
        if (!entry || typeof entry !== "object") continue;
        const id = "import:" + JSON.stringify([entry.at, entry.type, entry.targetId]).slice(0, 190);
        add("activity", id, {
          at: entry.at, type: entry.type, targetId: entry.targetId
        }, entry.at);
      }
    }
    save([...new Map(rows.map(row => [keyOf(row), row])).values()]);
    emit("progress");
  }

  function getLocalSources() {
    const savedGuest = read(cachePrefix + guest.username, {});
    const guestRecords = new Map((savedGuest.records || []).map(row => [keyOf(row), row]));
    const guestProgress = getCurrentProgress(guestRecords);
    const sources = legacySources();
    if (user !== guest && hasProgress(guestProgress)) {
      sources.unshift({ id: "guest", name: "此浏览器的访客进度", progress: guestProgress });
    }
    return sources;
  }

  async function init() {
    if (read(cachePrefix + guest.username, null)) activate(guest);
    if (!read(cachePrefix + guest.username, null)) {
      const oldGuest = legacySources().find(source => source.id === "account:guest" || source.id === "legacy");
      if (oldGuest) importProgress(oldGuest.progress);
    }
    if (!configured) return;
    root.addEventListener("online", () => client ? scheduleSync() : connect());
    await connect();
  }

  async function connect() {
    try {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.89.0/+esm");
      client = createClient(config.url, config.key, {
        auth: { flowType: "pkce", storageKey: "qa_prep_supabase_session_v1" }
      });
      client.auth.onAuthStateChange((event, session) => {
        setTimeout(() => {
          authReady = true;
          const sessionUser = session?.user;
          if (sessionUser?.id !== (user === guest ? undefined : user.username)) {
            activate(sessionUser ? {
              username: sessionUser.id,
              displayName: sessionUser.user_metadata?.user_name || sessionUser.email || "GitHub 用户"
            } : guest);
          }
          emit("status");
          if (sessionUser && event !== "TOKEN_REFRESHED") scheduleSync();
        }, 0);
      });
      const callbackError = new URL(root.location.href).searchParams.get("error_description");
      if (callbackError) {
        const cleanUrl = new URL(root.location.href);
        for (const key of ["error", "error_code", "error_description"]) cleanUrl.searchParams.delete(key);
        root.history.replaceState(null, "", cleanUrl);
        status.lastError = "GitHub 登录未完成，可重新发起登录";
        emit("status");
      }
      root.addEventListener("focus", () => scheduleSync());
      root.setInterval(() => {
        if (root.document.visibilityState === "visible") scheduleSync();
      }, 60000);
    } catch {
      status.lastError = "暂时无法连接 GitHub 登录服务";
      emit("status");
    }
  }

  async function login() {
    if (!client || !authReady) throw new Error("GitHub 登录服务尚未就绪");
    const redirectPath = root.location.pathname.replace(/\/index\.html$/, "/");
    const redirectTo = new URL(redirectPath, root.location.origin).href;
    const { error } = await client.auth.signInWithOAuth({ provider: "github", options: { redirectTo } });
    if (error) throw error;
  }

  async function logout() {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
    if (user !== guest) activate(guest);
  }

  async function getPrivatePrep() {
    if (!client || user === guest) return null;
    const { data, error } = await client.rpc("qa_get_private_prep");
    if (error) throw error;
    return data;
  }

  root.QA_AUTH = {
    init, login, logout, sync, getPrivatePrep, getCurrentProgress, getLocalSources, importProgress,
    getCurrentUser: () => user,
    getCloudState: () => ({ ...status, configured, authReady, pending: pending.size }),
    onChange: listener => listeners.add(listener),
    setMastered(id, checked) {
      const key = keyOf({ kind: "mastered", item_id: id });
      const previous = records.get(key)?.value;
      recordChange("mastered", id, checked ? {
        mastered: true, updatedAt: new Date().toISOString(), reviewCount: (previous?.reviewCount || 0) + 1
      } : false, checked ? "qa_check" : "qa_uncheck");
    },
    saveFcRecord(id, card) {
      recordChange("card", id, root.QA_SRS.normalizeRecord(id, card), "fc_review");
    },
    toggleRoadmapTask(id, checked) {
      recordChange("roadmap", id, checked, checked ? "roadmap_done" : "roadmap_undo");
    },
    resetCards() {
      recordChange("card_reset", "all", true, "reset_cards");
    }
  };
})(window);
