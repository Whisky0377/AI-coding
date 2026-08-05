"use strict";

/* ================= 存储键 ================= */
const OFFER_KEY = "offerBoardRecords";
const REVIEW_KEY = "interviewReview";
const OPENING_KEY = "autumnOpenings";
const OPENING_VER_KEY = "autumnOpeningsSeedVersion";
const REMINDER_KEY = "trackReminders";
const OPENING_SEED_VERSION = "2026-08-05b";

/* 可选行业清单（下拉展示 + 新增投递时选择）。可自由扩展。 */
const SECTORS = [
  "互联网", "银行", "国企", "消费电子/出海", "金融科技/支付", "消费金融",
  "人工智能", "汽车/新能源", "跨境电商", "快消/零售", "游戏", "教育",
  "医疗健康", "地产/物业", "传媒/内容", "咨询", "制造业", "物流供应链", "其他",
];
/* 行业配色（用于日历标签/圆点；未列出的行业走调色板兜底） */
const SECTOR_COLOR = {
  互联网: "#34c759", 银行: "#ff9500", 国企: "#5e5ce6", "消费电子/出海": "#0071e3",
  "金融科技/支付": "#00b3a4", 消费金融: "#ff2d55", 人工智能: "#af52de",
  "汽车/新能源": "#30b0c7", 跨境电商: "#ff9f0a", "快消/零售": "#ffcc00",
  游戏: "#bf5af2", 教育: "#5ac8fa", 医疗健康: "#32d74b", "地产/物业": "#a2845e",
  "传媒/内容": "#ff6482", 咨询: "#64d2ff", 制造业: "#8e8e93", 物流供应链: "#ac8e68",
};
const PALETTE = ["#0071e3", "#34c759", "#ff9500", "#5e5ce6", "#ff2d55", "#00b3a4", "#af52de", "#30b0c7"];
function sectorColor(sector) {
  if (SECTOR_COLOR[sector]) return SECTOR_COLOR[sector];
  let h = 0;
  for (let i = 0; i < String(sector).length; i++) h = (h * 31 + String(sector).charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
/* 三列默认展示的行业（可在页面上改，保存在本地） */
const COLUMN_KEYS = ["col1", "col2", "col3"];
const DEFAULT_COLUMNS = { col1: "互联网", col2: "银行", col3: "国企" };
const COLUMN_STORAGE_KEY = "trackColumnSectors";

/*
 * 岗位种子清单（27届 · 西语本科+数字经济硕士 · 双非本硕 · 实习偏产品运营/金融/广告投放）
 * 结合用户背景：做过广告投放、信用卡产品运营，且对字节跳动行业运营感兴趣。
 * 尽量覆盖运营类岗位（行业运营/用户运营/产品运营/商业化投放/内容运营/海外运营）。
 * apply_limit = 各企业秋招投递次数限制（来自公开信息，均建议以官网公告为准）。
 */
const OPENING_SEED = [
  // —— 字节跳动：行业运营（用户明确感兴趣） ——
  { company: "字节跳动", post: "行业运营 / 商业化运营（巨量引擎·抖音电商）", sector: "行业运营", base: "北京/上海/深圳", status: "open", channel: "官网校招 / 内推", link: "https://jobs.bytedance.com/campus", apply_limit: "2027校招按年度分段：2026年段2次+2027年段2次，单次投递≤2个岗位（以官网为准）", reason: "你明确感兴趣的行业运营；广告投放+信用卡运营经历高度契合巨量引擎/抖音电商商业化运营。双非可投，看重实习含金量。" },
  { company: "字节跳动", post: "用户运营 / 增长运营", sector: "用户运营", base: "北京/杭州", status: "open", channel: "官网校招 / 内推", link: "https://jobs.bytedance.com/campus", apply_limit: "同上：年度分段共4次，单次≤2岗（以官网为准）", reason: "用户增长/促活运营，广告投放的数据与转化经验直接可迁移，双非本硕友好。" },
  // —— 信用卡 / 消费金融运营（你的信用卡产品运营经历直接对口） ——
  { company: "招商银行信用卡中心（招银网络科技）", post: "用户运营 / 权益运营 / 数字化营销", sector: "信用卡运营", base: "深圳/上海", status: "open", channel: "招商银行校园招聘官网", link: "https://career.cmbchina.com", apply_limit: "银行系一般每人限报1-2个岗位（以招聘公告为准）", reason: "信用卡产品运营经历最对口；掌上生活App用户/权益运营，广告投放经验加分，双非本硕可投。" },
  { company: "中信银行信用卡中心", post: "渠道运营 / 效果投放 / 用户增长", sector: "信用卡运营", base: "深圳", status: "open", channel: "信用卡中心招聘官网", link: "https://creditcard.ecitic.com/zhaopin/", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "岗位直接要求信息流投放(抖音/朋友圈)+数据分析+活动策划，几乎踩中你全部经历。" },
  { company: "招联消费金融", post: "用户运营 / 活动运营 / 投放运营", sector: "消费金融", base: "深圳", status: "soon", channel: "招联金融校园招聘官网 / 内推", link: "https://mucfc.hotjob.cn", apply_limit: "通常限报1-2个岗位（以公告为准）", reason: "持牌消金龙头，用户运营+效果投放，金融类实习与广告投放双匹配，双非友好。" },
  { company: "马上消费金融", post: "用户运营 / 增长运营", sector: "消费金融", base: "重庆/北京", status: "soon", channel: "官网校招", link: "https://www.msxf.com/joinus", apply_limit: "通常限报1个岗位（以公告为准）", reason: "头部消金，用户生命周期运营，金融实习+数据运营背景对口，非一线城市竞争相对小。" },
  { company: "度小满金融", post: "用户运营 / 商业化运营", sector: "金融科技", base: "北京", status: "soon", channel: "官网校招 / 内推", link: "https://duxiaoman.zhiye.com", apply_limit: "参照百度系，一般≤2个岗位（以公告为准）", reason: "信贷+理财运营，广告投放/效果营销经验对口，数字经济背景加分。" },
  { company: "蚂蚁集团（支付宝）", post: "行业运营 / 用户运营 / 商家运营", sector: "金融科技", base: "杭州/上海", status: "open", channel: "蚂蚁校招官网", link: "https://talent.antgroup.com", apply_limit: "阿里系官方未统一公示，行业惯例≤2个岗位（以官网为准）", reason: "支付宝行业/商家运营与你的行业运营意向一致，信用卡运营与支付场景相通。" },
  // —— 互联网大厂运营（投递次数已核） ——
  { company: "美团", post: "用户运营 / 商业分析 / 到店行业运营", sector: "本地生活运营", base: "北京/上海", status: "open", channel: "美团校园招聘官网", link: "https://campus.meituan.com", apply_limit: "官方未统一公示，行业惯例≤2个岗位（以官网为准）", reason: "到店/到家行业运营与你的行业运营兴趣一致，运营方法论通用，双非可投。" },
  { company: "京东", post: "用户运营 / 商业化运营（新星计划）", sector: "电商运营", base: "北京", status: "open", channel: "京东校园招聘官网", link: "https://campus.jd.com", apply_limit: "新星计划最多2个（主投+调剂）；管培生(TET)仅1个", reason: "电商用户/商业化运营，广告投放经验对口京东零售商业化，双非本硕可投。" },
  { company: "拼多多 / Temu", post: "用户运营 / 类目运营 / 海外运营", sector: "电商运营", base: "上海/深圳", status: "open", channel: "PDD 校园招聘官网", link: "https://careers.pddglobalhr.com", apply_limit: "提前批最多2个（含调剂），后续批次不影响", reason: "Temu 出海高速扩张，西语可切拉美站；运营岗节奏快、双非友好、给薪有竞争力。" },
  { company: "快手", post: "商业化运营 / 用户运营（磁力引擎）", sector: "商业化运营", base: "北京", status: "open", channel: "快手校园招聘官网", link: "https://campus.kuaishou.cn", apply_limit: "官方未统一公示，行业惯例≤2个岗位（以官网为准）", reason: "磁力引擎商业化投放运营，与你广告投放经历强相关。" },
  // —— 消费电子 / 出海（西语+数字经济优势，双非友好，含运营岗） ——
  { company: "拓竹科技 Bambu Lab", post: "海外运营 / 拉美市场运营", sector: "消费电子出海", base: "深圳", status: "soon", channel: "校招官网 / 公众号", link: "https://bambulab.zhiye.com", apply_limit: "中小企业一般不限次数（以招聘页为准）", reason: "CES 常客 3D 打印独角兽，西语切拉美电商运营，产品运营实习对口，双非友好。" },
  { company: "安克创新 Anker", post: "海外品牌运营管培生 / 用户运营", sector: "消费电子出海", base: "深圳/长沙", status: "soon", channel: "校招官网", link: "https://anker.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "出海标杆，多语种区域运营，广告投放+产品运营背景匹配。" },
  { company: "SHEIN", post: "海外运营管培生（西语区）/ 内容运营", sector: "跨境电商", base: "广州", status: "open", channel: "官网校招", link: "https://careers.shein.com", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "西语区拉美重点市场，内容/用户运营实习直接可用，双非本硕大量在招。" },
  { company: "Insta360 影石", post: "海外内容运营 / 社媒运营", sector: "消费电子出海", base: "深圳", status: "open", channel: "校招官网", link: "https://insta360.zhiye.com", apply_limit: "一般不限次数（以招聘页为准）", reason: "CES 常胜军，内容+社媒运营，西语覆盖西语区社媒，广告投放经验对口。" },
  { company: "传音控股 Transsion", post: "新兴市场用户运营 / 运营管培", sector: "消费电子出海", base: "深圳", status: "soon", channel: "校招官网", link: "https://transsion.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "非洲+拉美布局，小语种运营人才紧缺，数字经济背景加分。" },
  { company: "涂鸦智能 Tuya", post: "海外生态运营 / 客户运营", sector: "人工智能", base: "杭州", status: "soon", channel: "校招官网", link: "https://tuya.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "WAIC 活跃 IoT 平台，全球客户运营，数字经济背景契合，双非友好。" },
  // —— 跨境支付 / 金融科技（金融实习+数字经济双背景） ——
  { company: "Airwallex 空中云汇", post: "全球支付运营 / 客户成功", sector: "金融科技", base: "上海/香港", status: "open", channel: "官网校招 / 内推", link: "https://www.airwallex.com/cn/careers", apply_limit: "外企一般不限次数（以招聘页为准）", reason: "出海金融科技独角兽，重视语言与运营，金融类实习非常对口。" },
  { company: "连连数科 LianLian", post: "跨境支付运营 / 商户运营", sector: "金融科技", base: "杭州/上海", status: "soon", channel: "官网校招", link: "https://www.lianlianpay.com", apply_limit: "一般限报1-2个岗位（以公告为准）", reason: "跨境支付牌照齐全，金融+运营双背景强匹配，稳增长赛道，双非可投。" },
];

/* ================= 状态 ================= */
const offerFilters = { company: "", post: "", processStage: "", base: "", priority: "" };
let activeOfferType = "互联网";
let activeOfferId = "";
let pendingConfirm = null;
let reviewRecords = [];
let openingRecords = [];
let reminderRecords = [];

const $ = (id) => document.getElementById(id);
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ================= Offer 数据（扁平数组，每条带 sector 行业） ================= */
const GROUP_TO_SECTOR = { internet: "互联网", bank: "银行", stateOwned: "国企" };
function normalizeOffer(o) {
  const sector = o.sector || o.type || "其他";
  return { ...o, sector };
}
function loadOffers() {
  const raw = localStorage.getItem(OFFER_KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.map(normalizeOffer);
    // 迁移旧结构 { internet:[], bank:[], stateOwned:[] }
    const merged = [];
    ["internet", "bank", "stateOwned"].forEach((g) => {
      if (Array.isArray(p[g])) p[g].forEach((it) => merged.push(normalizeOffer({ ...it, sector: it.sector || it.type || GROUP_TO_SECTOR[g] })));
    });
    return merged;
  } catch { return []; }
}
let offerData = loadOffers();
function saveOffers() { localStorage.setItem(OFFER_KEY, JSON.stringify(offerData)); }
function allOffers() { return offerData.slice(); }

/* 列-行业配置 */
function loadColumns() {
  const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
  if (!raw) return { ...DEFAULT_COLUMNS };
  try { const p = JSON.parse(raw); return { ...DEFAULT_COLUMNS, ...(p && typeof p === "object" ? p : {}) }; } catch { return { ...DEFAULT_COLUMNS }; }
}
let columnSectors = loadColumns();
function saveColumns() { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnSectors)); }

function offerMeta(o) {
  const v = String(o?.process || "");
  const m = v.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
  const date = m?.[1] || "";
  const stage = (m?.[2] || v).trim();
  const ts = date ? new Date(`${date}T00:00:00`).getTime() : 0;
  return { date, stage, ts: Number.isNaN(ts) ? 0 : ts };
}
function offerFieldValue(o, f) {
  const meta = offerMeta(o);
  return { company: (o.company || "").trim(), post: (o.post || "").trim(), processStage: meta.stage, base: (o.base || "").trim(), priority: (o.priority || "").trim() }[f];
}
function filterPlaceholder(f) {
  return { company: "全部公司", post: "全部岗位", processStage: "全部进展", base: "全部 Base", priority: "全部优先级" }[f];
}
function filterOptions(f) {
  const counts = new Map();
  allOffers().forEach((o) => { const v = offerFieldValue(o, f); if (v) counts.set(v, (counts.get(v) || 0) + 1); });
  const arr = [...counts.entries()];
  if (f === "priority") { const ord = { 高: 0, 中: 1, 低: 2 }; return arr.sort(([a], [b]) => (ord[a] ?? 9) - (ord[b] ?? 9)); }
  return arr.sort(([a], [b]) => a.localeCompare(b, "zh-CN"));
}
function renderFilterSelect(f, id) {
  const sel = $(id); const cur = offerFilters[f];
  sel.innerHTML = "";
  const def = document.createElement("option"); def.value = ""; def.textContent = filterPlaceholder(f); sel.appendChild(def);
  let ok = cur === "";
  filterOptions(f).forEach(([v, c]) => { const o = document.createElement("option"); o.value = v; o.textContent = `${v} (${c})`; if (v === cur) { o.selected = true; ok = true; } sel.appendChild(o); });
  if (!ok) { offerFilters[f] = ""; sel.value = ""; }
}
function renderFilters() {
  renderFilterSelect("company", "companyFilter");
  renderFilterSelect("post", "postFilter");
  renderFilterSelect("processStage", "processStageFilter");
  renderFilterSelect("base", "baseFilter");
  renderFilterSelect("priority", "priorityFilter");
}
function matchFilters(o) { return Object.entries(offerFilters).every(([f, v]) => !v || offerFieldValue(o, f) === v); }
/* 按行业取该行业下、且满足全局筛选的投递记录 */
function offersBySector(sector) {
  return offerData
    .filter((o) => (o.sector || "其他") === sector && matchFilters(o))
    .slice()
    .sort((a, b) => {
      const mb = offerMeta(b), ma = offerMeta(a);
      if (mb.ts !== ma.ts) return mb.ts - ma.ts;
      return (a.company || "").localeCompare(b.company || "", "zh-CN");
    });
}
function renderSummary() {
  const shown = allOffers().filter(matchFilters).length;
  const total = allOffers().length;
  $("filterSummary").textContent = shown === total
    ? `共 ${total} 条投递记录，按流程日期从近到远排序。`
    : `筛选后展示 ${shown} / ${total} 条，按流程日期从近到远排序。`;
}
function renderTable(id, data) {
  const tb = document.querySelector(`#${id} tbody`); tb.innerHTML = "";
  if (!data.length) { tb.innerHTML = '<tr><td colspan="3" class="table-empty">暂无投递记录</td></tr>'; return; }
  data.forEach((it) => {
    const { date, stage } = offerMeta(it);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="cell-company">${esc(it.company)}</div>
        <div class="cell-sub">${esc(it.post)}${it.base ? " · " + esc(it.base) : ""}</div>
        <div class="row-actions">
          <button type="button" class="btn btn-quiet btn-sm edit-offer" data-id="${esc(it.id)}">修改</button>
          <button type="button" class="btn btn-danger-quiet btn-sm del-offer" data-id="${esc(it.id)}">删除</button>
        </div>
      </td>
      <td><div>${esc(stage)}</div><div class="cell-sub">${esc(date)}</div></td>
      <td><span class="pill pri-${esc(it.priority)}">${esc(it.priority)}</span></td>`;
    tb.appendChild(tr);
  });
}
const COLUMN_TABLE = { col1: "col1Table", col2: "col2Table", col3: "col3Table" };
const COLUMN_SELECT = { col1: "col1Sector", col2: "col2Sector", col3: "col3Sector" };
const COLUMN_DOT = { col1: "col1Dot", col2: "col2Dot", col3: "col3Dot" };
function renderColumnSelectors() {
  COLUMN_KEYS.forEach((key) => {
    const sel = $(COLUMN_SELECT[key]);
    if (!sel) return;
    sel.innerHTML = "";
    SECTORS.forEach((s) => {
      const o = document.createElement("option");
      o.value = s; o.textContent = s;
      if (s === columnSectors[key]) o.selected = true;
      sel.appendChild(o);
    });
    const dot = $(COLUMN_DOT[key]);
    if (dot) dot.style.background = sectorColor(columnSectors[key]);
  });
}
function renderTables() {
  renderFilters(); renderSummary(); renderColumnSelectors();
  COLUMN_KEYS.forEach((key) => {
    renderTable(COLUMN_TABLE[key], offersBySector(columnSectors[key]));
  });
}

/* ================= 日历 ================= */
const now = new Date();
const CY = now.getFullYear(), CM = now.getMonth(), CD = now.getDate();
let selYear = CY, selMonth = CM;

function initMonth() {
  const sel = $("monthSelect");
  for (let i = 0; i < 12; i++) { const o = document.createElement("option"); o.value = i; o.textContent = `${CY}年 ${i + 1}月`; if (i === CM) o.selected = true; sel.appendChild(o); }
  sel.addEventListener("change", (e) => { selMonth = parseInt(e.target.value, 10); renderCalendar(); });
}
function interviewMap() {
  return allOffers().reduce((m, o) => {
    const [d] = String(o.process || "").split(" ");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return m;
    (m[d] = m[d] || []).push({ label: `${o.company}·${o.post}`, sector: o.sector || o.type || "其他" });
    return m;
  }, {});
}
function reminderMap() {
  return reminderRecords.reduce((m, r) => { if (r.date) (m[r.date] = m[r.date] || []).push(r); return m; }, {});
}
function renderCalendar() {
  const cal = $("calendar");
  while (cal.children.length > 7) cal.removeChild(cal.lastChild);
  const first = new Date(selYear, selMonth, 1).getDay() || 7;
  const days = new Date(selYear, selMonth + 1, 0).getDate();
  const iMap = interviewMap(), rMap = reminderMap();
  for (let i = 1; i < first; i++) { const e = document.createElement("div"); e.className = "cal-day muted"; cal.appendChild(e); }
  for (let d = 1; d <= days; d++) {
    const ds = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "cal-day" + (selYear === CY && selMonth === CM && d === CD ? " today" : "");
    cell.dataset.date = ds;
    cell.innerHTML = `<span class="num">${d}</span>`;
    (iMap[ds] || []).forEach((ev) => {
      const t = document.createElement("span"); t.className = "cal-tag"; t.textContent = ev.label; t.title = ev.label;
      t.style.background = sectorColor(ev.sector); cell.appendChild(t);
    });
    if (rMap[ds] && rMap[ds].length) {
      const row = document.createElement("div"); row.className = "cal-dot-row";
      rMap[ds].forEach((r) => { const dot = document.createElement("span"); dot.className = "cal-mini-dot"; dot.style.background = r.done ? "#34c759" : "#ff3b30"; row.appendChild(dot); });
      cell.appendChild(row);
    }
    cell.addEventListener("click", () => openReminderModal("", ds));
    cal.appendChild(cell);
  }
}

/* ================= 提醒事项 ================= */
function loadReminders() {
  const raw = localStorage.getItem(REMINDER_KEY);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
function saveReminders() { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderRecords)); }
function fmtReminderDate(d) {
  if (!d) return "无日期";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
}
function renderReminders() {
  const list = $("reminderList"), empty = $("reminderEmpty");
  list.innerHTML = "";
  if (!reminderRecords.length) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  const sorted = reminderRecords.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.date || "9999").localeCompare(b.date || "9999");
  });
  sorted.forEach((r) => {
    const item = document.createElement("div");
    item.className = "reminder-item" + (r.done ? " done" : "");
    item.innerHTML = `
      <input type="checkbox" class="reminder-check" data-id="${esc(r.id)}" ${r.done ? "checked" : ""} />
      <div class="reminder-main">
        <div class="reminder-text">${esc(r.text)}</div>
        <div class="reminder-date">${esc(fmtReminderDate(r.date))}</div>
      </div>
      <div class="reminder-actions">
        <button type="button" class="icon-btn edit-reminder" data-id="${esc(r.id)}" title="编辑">✎</button>
        <button type="button" class="icon-btn del del-reminder" data-id="${esc(r.id)}" title="删除">🗑</button>
      </div>`;
    list.appendChild(item);
  });
}
function reminderById(id) { return reminderRecords.find((r) => r.id === id) || null; }
function openReminderModal(id = "", presetDate = "") {
  const r = id ? reminderById(id) : null;
  $("reminderId").value = r?.id || "";
  $("reminderText").value = r?.text || "";
  $("reminderDate").value = r?.date || presetDate || "";
  $("reminderModalTitle").textContent = r ? "编辑提醒" : "添加提醒";
  openModal("reminderModal");
  setTimeout(() => $("reminderText").focus(), 0);
}
function saveReminder(e) {
  e.preventDefault();
  const id = $("reminderId").value;
  const text = $("reminderText").value.trim();
  const date = $("reminderDate").value;
  if (!text) return;
  const existing = id ? reminderById(id) : null;
  if (existing) { existing.text = text; existing.date = date; }
  else { reminderRecords.unshift({ id: uid(), text, date, done: false }); }
  saveReminders(); renderReminders(); renderCalendar(); closeModal("reminderModal");
}

/* ================= 秋招岗位 ================= */
function mkOpening(f = {}) {
  return { id: f.id || uid(), company: f.company || "", post: f.post || "", sector: f.sector || "", base: f.base || "", status: f.status === "open" ? "open" : "soon", channel: f.channel || "", link: f.link || "", apply_limit: f.apply_limit || "", reason: f.reason || "" };
}
function loadOpenings() {
  const raw = localStorage.getItem(OPENING_KEY);
  const ver = localStorage.getItem(OPENING_VER_KEY);
  if (!raw && ver !== OPENING_SEED_VERSION) {
    const seeded = OPENING_SEED.map(mkOpening);
    localStorage.setItem(OPENING_KEY, JSON.stringify(seeded));
    localStorage.setItem(OPENING_VER_KEY, OPENING_SEED_VERSION);
    return seeded;
  }
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.map(mkOpening) : []; } catch { return []; }
}
function saveOpenings() { localStorage.setItem(OPENING_KEY, JSON.stringify(openingRecords)); }
function resetOpenings() {
  openingRecords = OPENING_SEED.map(mkOpening);
  localStorage.setItem(OPENING_KEY, JSON.stringify(openingRecords));
  localStorage.setItem(OPENING_VER_KEY, OPENING_SEED_VERSION);
  renderOpenings();
}
function renderOpenings() {
  const list = $("openingList"), empty = $("openingEmpty");
  const total = openingRecords.length;
  const open = openingRecords.filter((o) => o.status === "open").length;
  $("openingsMeta").textContent = `共 ${total} 个目标 · 已开放 ${open} · 即将开放 ${total - open}`;
  list.innerHTML = "";
  if (!total) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  openingRecords.forEach((it, i) => {
    const card = document.createElement("div"); card.className = "opening-card";
    const label = it.status === "open" ? "已开放" : "即将开放";
    const link = it.link ? `<a class="btn btn-primary btn-sm" href="${esc(it.link)}" target="_blank" rel="noopener">投递</a>` : "";
    card.innerHTML = `
      <div class="opening-index">${i + 1}</div>
      <div class="opening-main">
        <div class="opening-title-row">
          <span class="opening-company">${esc(it.company)}</span>
          <span class="opening-post">${esc(it.post)}</span>
          <span class="badge ${it.status}">${label}</span>
          ${it.sector ? `<span class="badge sector">${esc(it.sector)}</span>` : ""}
        </div>
        <div class="opening-meta">${it.base ? "📍 " + esc(it.base) : ""}${it.channel ? " ｜ " + esc(it.channel) : ""}</div>
        ${it.apply_limit ? `<div class="opening-limit">🎯 投递次数：${esc(it.apply_limit)}</div>` : ""}
        ${it.reason ? `<div class="opening-reason">${esc(it.reason)}</div>` : ""}
      </div>
      <div class="opening-actions">${link}<button type="button" class="btn btn-outline danger btn-sm del-opening" data-id="${esc(it.id)}">删除</button></div>`;
    list.appendChild(card);
  });
}
function openingById(id) { return openingRecords.find((o) => o.id === id) || null; }
function saveOpening(e) {
  e.preventDefault();
  const rec = mkOpening({
    company: $("opCompany").value.trim(), post: $("opPost").value.trim(),
    sector: $("opSector").value.trim(), base: $("opBase").value.trim(),
    status: $("opStatus").value, channel: $("opChannel").value.trim(),
    link: $("opLink").value.trim(), apply_limit: $("opLimit").value.trim(),
    reason: $("opReason").value.trim(),
  });
  if (!rec.company || !rec.post) return;
  openingRecords.unshift(rec); saveOpenings(); renderOpenings(); closeModal("openingModal");
}

/* ================= 复盘 ================= */
function mkReview(f = {}) {
  const iso = new Date().toISOString();
  return { id: f.id || uid(), title: f.title || "", selfIntro: f.selfIntro || "", interviewQues: f.interviewQues || "", askQues: f.askQues || "", reviewRemark: f.reviewRemark || "", createdAt: f.createdAt || iso, updatedAt: f.updatedAt || iso };
}
function loadReviews() {
  const raw = localStorage.getItem(REVIEW_KEY);
  if (!raw) return [];
  try {
    let p = JSON.parse(raw);
    if (p && !Array.isArray(p)) {
      const has = [p.title, p.selfIntro, p.interviewQues, p.askQues, p.reviewRemark].some((v) => String(v || "").trim());
      p = has ? [p] : [];
    }
    return Array.isArray(p) ? p.map(mkReview) : [];
  } catch { return []; }
}
function saveReviews() { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewRecords)); }
function reviewTime(iso) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d); }
function reviewPreview(r) { const s = [r.reviewRemark, r.interviewQues, r.askQues, r.selfIntro].find((v) => String(v || "").trim()); return s ? String(s).trim().replace(/\s+/g, " ").slice(0, 80) : "点击查看这条复盘的详细内容。"; }
function reviewTitle(r, i) { const s = [r.title, r.reviewRemark, r.interviewQues, r.selfIntro].find((v) => String(v || "").trim()); return s ? String(s).trim().replace(/\s+/g, " ").slice(0, 26) : `复盘记录 ${i + 1}`; }
function renderReviews() {
  const list = $("reviewList"), empty = $("reviewEmpty"); list.innerHTML = "";
  if (!reviewRecords.length) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  reviewRecords.forEach((r, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "review-card"; b.dataset.id = r.id;
    b.innerHTML = `<div class="review-card-head"><span class="review-card-title">${esc(reviewTitle(r, i))}</span><span class="review-card-time">${esc(reviewTime(r.updatedAt))}</span></div><div class="review-card-preview">${esc(reviewPreview(r))}</div>`;
    list.appendChild(b);
  });
}
function reviewById(id) { return reviewRecords.find((r) => r.id === id) || null; }
function openReviewModal(id = "") {
  const r = id ? reviewById(id) : null;
  $("reviewId").value = r?.id || ""; $("reviewTitle").value = r?.title || "";
  $("selfIntro").value = r?.selfIntro || ""; $("interviewQues").value = r?.interviewQues || "";
  $("askQues").value = r?.askQues || ""; $("reviewRemark").value = r?.reviewRemark || "";
  $("reviewSaveTip").classList.add("hidden");
  $("reviewDelete").classList.toggle("hidden", !r?.id);
  $("reviewModalTitle").textContent = r ? "查看 / 编辑复盘" : "新增面试复盘";
  $("reviewModalSub").textContent = r ? "修改后保存会覆盖本地记录。" : "填写复盘内容，保存后追加到列表。";
  openModal("reviewModal");
}
function saveReview(e) {
  e.preventDefault();
  const id = $("reviewId").value; const ex = id ? reviewById(id) : null;
  const rec = mkReview({ id: ex?.id || id, createdAt: ex?.createdAt, title: $("reviewTitle").value.trim(), selfIntro: $("selfIntro").value.trim(), interviewQues: $("interviewQues").value.trim(), askQues: $("askQues").value.trim(), reviewRemark: $("reviewRemark").value.trim(), updatedAt: new Date().toISOString() });
  if (![rec.title, rec.selfIntro, rec.interviewQues, rec.askQues, rec.reviewRemark].some((v) => v.trim())) return;
  if (ex) reviewRecords = reviewRecords.map((it) => (it.id === ex.id ? rec : it)); else reviewRecords.unshift(rec);
  saveReviews(); renderReviews();
  const tip = $("reviewSaveTip"); tip.classList.remove("hidden");
  setTimeout(() => tip.classList.add("hidden"), 1000);
  setTimeout(() => closeModal("reviewModal"), 220);
}
function handleDeleteReview() {
  const id = $("reviewId").value; if (!id) return;
  closeModal("reviewModal");
  openConfirm({ title: "删除复盘记录", desc: "删除后立即从本地移除，无法恢复。", msg: "确定删除这条复盘吗？", highlight: reviewTitle(reviewById(id) || {}, 0), onOk: () => { reviewRecords = reviewRecords.filter((r) => r.id !== id); saveReviews(); renderReviews(); } });
}

/* ================= 投递弹窗 ================= */
function fillSectorSelect() {
  const sel = $("typeInput");
  sel.innerHTML = "";
  SECTORS.forEach((s) => { const o = document.createElement("option"); o.value = s; o.textContent = s; sel.appendChild(o); });
}
function mkOffer() {
  const sector = $("typeInput").value;
  return { id: $("offerId").value || uid(), company: $("companyInput").value.trim(), post: $("postInput").value.trim(), sector, process: `${$("processDateInput").value} ${$("processStageInput").value.trim()}`, remark: $("remarkInput").value.trim(), latest: $("latestInput").value.trim(), sendDate: $("sendDateInput").value, base: $("baseInput").value.trim(), priority: $("priorityInput").value };
}
function applyType(sector, mode) {
  activeOfferType = sector; $("typeInput").value = sector;
  $("offerModalTitle").textContent = mode === "edit" ? "修改投递记录" : "新增投递记录";
  $("offerModalSub").textContent = mode === "edit" ? "修改投递信息，可调整所属行业。" : "填写投递信息并选择所属行业，提交后写入本地数据。";
  $("offerSave").textContent = mode === "edit" ? "保存修改" : "新增投递记录";
}
function fillOffer(r) {
  $("offerId").value = r?.id || ""; $("companyInput").value = r?.company || ""; $("postInput").value = r?.post || "";
  $("latestInput").value = r?.latest || ""; $("sendDateInput").value = r?.sendDate || ""; $("baseInput").value = r?.base || "";
  $("priorityInput").value = r?.priority || "高"; $("remarkInput").value = r?.remark || "";
  const m = String(r?.process || "").match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
  $("processDateInput").value = m?.[1] || ""; $("processStageInput").value = m?.[2] || "投递";
}
function openOfferModal(type, r = null) { activeOfferId = r?.id || ""; applyType(type, r ? "edit" : "create"); fillOffer(r); openModal("offerModal"); setTimeout(() => $("companyInput").focus(), 0); }
function resetOfferForm(type = activeOfferType) { $("offerForm").reset(); $("offerId").value = ""; $("priorityInput").value = "高"; activeOfferId = ""; applyType(type, "create"); }
function offerById(id) { return allOffers().find((o) => o.id === id) || null; }
function saveOffer(e) {
  e.preventDefault();
  const rec = mkOffer();
  if (!rec.sector) return;
  if (activeOfferId) { offerData = offerData.map((it) => (it.id === rec.id ? rec : it)); }
  else { offerData.unshift(rec); }
  saveOffers(); renderTables(); renderCalendar(); resetOfferForm(rec.sector); closeModal("offerModal");
}
function deleteOffer(id) { offerData = offerData.filter((it) => it.id !== id); saveOffers(); renderTables(); renderCalendar(); }

/* ================= 弹窗通用 ================= */
function anyModalOpen() { return document.querySelector(".modal.open"); }
function openModal(id) { const m = $(id); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
function closeModal(id) { const m = $(id); m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); if (!anyModalOpen()) document.body.style.overflow = ""; }
function openConfirm({ title, desc, msg, highlight, onOk }) {
  pendingConfirm = typeof onOk === "function" ? onOk : null;
  $("confirmTitle").textContent = title || "确认删除";
  $("confirmDesc").textContent = desc || "删除后会立即从本地移除。";
  $("confirmMsg").childNodes[0].textContent = `${msg || "确定删除吗？"} `;
  $("confirmHighlight").textContent = highlight || "这条记录";
  openModal("confirmModal");
}

/* ================= 事件绑定 ================= */
function bind() {
  // 筛选
  [["companyFilter", "company"], ["postFilter", "post"], ["processStageFilter", "processStage"], ["baseFilter", "base"], ["priorityFilter", "priority"]].forEach(([id, f]) => {
    $(id).addEventListener("change", (e) => { offerFilters[f] = e.target.value; renderTables(); });
  });
  $("resetFiltersBtn").addEventListener("click", () => { Object.keys(offerFilters).forEach((f) => (offerFilters[f] = "")); renderTables(); });

  // 表单提交
  $("offerForm").addEventListener("submit", saveOffer);
  $("openingForm").addEventListener("submit", saveOpening);
  $("reviewForm").addEventListener("submit", saveReview);
  $("reminderForm").addEventListener("submit", saveReminder);

  // 提醒
  $("openReminderBtn").addEventListener("click", () => openReminderModal());
  $("reminderClose").addEventListener("click", () => closeModal("reminderModal"));
  $("reminderCancel").addEventListener("click", () => closeModal("reminderModal"));
  $("reminderList").addEventListener("click", (e) => {
    const del = e.target.closest(".del-reminder");
    if (del) { const r = reminderById(del.dataset.id); openConfirm({ title: "删除提醒", msg: "确定删除这条提醒吗？", highlight: r?.text || "这条提醒", onOk: () => { reminderRecords = reminderRecords.filter((x) => x.id !== del.dataset.id); saveReminders(); renderReminders(); renderCalendar(); } }); return; }
    const edit = e.target.closest(".edit-reminder");
    if (edit) openReminderModal(edit.dataset.id);
  });
  $("reminderList").addEventListener("change", (e) => {
    const chk = e.target.closest(".reminder-check");
    if (!chk) return;
    const r = reminderById(chk.dataset.id); if (r) { r.done = chk.checked; saveReminders(); renderReminders(); renderCalendar(); }
  });

  // 秋招
  $("openOpeningBtn").addEventListener("click", () => { $("openingForm").reset(); $("opStatus").value = "open"; openModal("openingModal"); setTimeout(() => $("opCompany").focus(), 0); });
  $("openingClose").addEventListener("click", () => closeModal("openingModal"));
  $("openingCancel").addEventListener("click", () => closeModal("openingModal"));
  $("resetOpeningsBtn").addEventListener("click", () => openConfirm({ title: "恢复推荐清单", desc: "会用默认 20 家推荐覆盖当前列表。", msg: "确定恢复默认推荐清单吗？", highlight: "会覆盖你手动增删的岗位", onOk: resetOpenings }));
  $("openingList").addEventListener("click", (e) => {
    const del = e.target.closest(".del-opening"); if (!del) return;
    const r = openingById(del.dataset.id);
    openConfirm({ title: "删除目标岗位", msg: "确定删除这个目标岗位吗？", highlight: r ? `${r.company} · ${r.post}` : "这个岗位", onOk: () => { openingRecords = openingRecords.filter((x) => x.id !== del.dataset.id); saveOpenings(); renderOpenings(); } });
  });

  // 复盘
  $("openReviewBtn").addEventListener("click", () => openReviewModal());
  $("reviewClose").addEventListener("click", () => closeModal("reviewModal"));
  $("reviewCancel").addEventListener("click", () => closeModal("reviewModal"));
  $("reviewDelete").addEventListener("click", handleDeleteReview);
  $("reviewList").addEventListener("click", (e) => { const b = e.target.closest(".review-card"); if (b) openReviewModal(b.dataset.id || ""); });

  // 列行业下拉：切换该列展示的行业
  COLUMN_KEYS.forEach((key) => {
    const sel = $(COLUMN_SELECT[key]);
    if (sel) sel.addEventListener("change", (e) => { columnSectors[key] = e.target.value; saveColumns(); renderTables(); });
  });

  // 投递：每列“新增”按钮，默认带该列当前行业
  document.querySelectorAll(".open-offer[data-col]").forEach((b) =>
    b.addEventListener("click", () => openOfferModal(columnSectors[b.dataset.col] || "互联网")));
  $("offerClose").addEventListener("click", () => closeModal("offerModal"));
  $("offerCancel").addEventListener("click", () => { resetOfferForm(activeOfferType); closeModal("offerModal"); });
  ["col1Table", "col2Table", "col3Table"].forEach((id) => {
    $(id).addEventListener("click", (e) => {
      const ed = e.target.closest(".edit-offer"); if (ed) { const r = offerById(ed.dataset.id); if (r) openOfferModal(r.sector || "其他", r); return; }
      const del = e.target.closest(".del-offer"); if (!del) return;
      const r = offerById(del.dataset.id);
      openConfirm({ title: "删除投递记录", desc: "删除后会从本地记录和日历移除。", msg: "确定删除这条投递记录吗？", highlight: r ? `${r.company} · ${r.post}` : "这条记录", onOk: () => deleteOffer(del.dataset.id) });
    });
  });

  // 确认弹窗
  $("confirmClose").addEventListener("click", () => closeModal("confirmModal"));
  $("confirmCancel").addEventListener("click", () => closeModal("confirmModal"));
  $("confirmOk").addEventListener("click", () => { if (pendingConfirm) pendingConfirm(); pendingConfirm = null; closeModal("confirmModal"); });

  // 点遮罩关闭
  ["offerModal", "openingModal", "reminderModal", "reviewModal", "confirmModal"].forEach((id) => {
    $(id).addEventListener("click", (e) => { if (e.target.id === id) { if (id === "offerModal") resetOfferForm(activeOfferType); closeModal(id); } });
  });

  // Esc 关闭
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = anyModalOpen(); if (!open) return;
    if (open.id === "offerModal") resetOfferForm(activeOfferType);
    closeModal(open.id);
  });
}

/* ================= 初始化 ================= */
initMonth();
fillSectorSelect();
renderTables();
reminderRecords = loadReminders();
renderReminders();
renderCalendar();
reviewRecords = loadReviews();
renderReviews();
openingRecords = loadOpenings();
renderOpenings();
resetOfferForm();
bind();
