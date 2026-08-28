"use strict";

/* ================= 存储键 ================= */
const OFFER_KEY = "offerBoardRecords";
const REVIEW_KEY = "interviewReview";
const OPENING_KEY = "autumnOpenings";
const OPENING_VER_KEY = "autumnOpeningsSeedVersion";
const OPENING_SEED_VERSION = "2026-08-17";

/* ================= Supabase 云同步（可选，未配置则走本地模式） ================= */
let sb = null;              // supabase client
let currentUser = null;    // 已登录用户
let cloudReady = false;    // 是否已接入云端（配置有效）
const CLOUD_TABLE = { offers: "offers", reviews: "reviews" };

function cloudEnabled() { return cloudReady && !!currentUser; }

function initSupabase() {
  const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
  if (!url || !key || typeof window.supabase === "undefined") return false;
  try { sb = window.supabase.createClient(url, key); cloudReady = true; return true; }
  catch { return false; }
}

/* 读取某类数据的整包数组（登录态从云端，否则本地） */
async function cloudLoad(table, localKey) {
  if (!cloudEnabled()) {
    const raw = localStorage.getItem(localKey);
    try { const p = raw ? JSON.parse(raw) : []; return Array.isArray(p) ? p : (p || []); } catch { return []; }
  }
  const { data, error } = await sb.from(table).select("data").eq("user_id", currentUser.id).maybeSingle();
  if (error || !data) return [];
  return Array.isArray(data.data) ? data.data : (data.data || []);
}

/* 写入某类数据整包（登录态 upsert 到云端；同时也写本地做缓存） */
async function cloudSave(table, localKey, arr) {
  localStorage.setItem(localKey, JSON.stringify(arr));
  if (!cloudEnabled()) return;
  await sb.from(table).upsert({ user_id: currentUser.id, data: arr, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

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
  { company: "携程 Trip.com", post: "用户运营 / 海外市场运营", sector: "互联网", base: "上海", status: "open", channel: "携程校园招聘官网", link: "https://careers.trip.com/campus", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "在线旅游龙头，海外运营需要语言能力，西语可切拉美市场，福利与晋升好。" },
  { company: "爱奇艺", post: "内容运营 / 会员运营", sector: "互联网", base: "北京", status: "open", channel: "爱奇艺校园招聘官网", link: "https://careers.iqiyi.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "长视频平台，会员/内容运营，运营方法论通用，双非可投。" },
  { company: "Shopee（东南亚电商）", post: "跨境运营 / 招商运营（GLP管培）", sector: "跨境电商", base: "深圳/上海", status: "open", channel: "Shopee 校园招聘官网", link: "https://careers.shopee.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届外企秋招已开，出海电商运营，管培生对双非本硕友好，运营经历对口。" },
  { company: "联想 Lenovo", post: "市场与销售 / 管培生 Future Leaders", sector: "互联网", base: "北京/深圳/上海", status: "open", channel: "联想校园招聘官网", link: "https://talent.lenovo.com.cn", apply_limit: "网申8/5-11/13，岗位招满即止（以官网为准）", addedDate: "2026-08-17", deadline: "2026-11-13", reason: "27届已全面启动，含Future Leaders管培+市场销售，运营/市场方向对口，双非可投，网申截止11/13明确。" },
  { company: "vivo", post: "用户运营 / 市场运营（蓝极星）", sector: "消费电子/出海", base: "深圳/东莞", status: "open", channel: "vivo校园招聘官网", link: "https://vivo.zhiye.com", apply_limit: "以官网为准", addedDate: "2026-08-17", deadline: "", reason: "27届蓝极星项目已开，手机出海海外市场运营需要语言能力，西语可切海外市场，双非量大。" },
  { company: "网易游戏（互娱）", post: "游戏运营 / 市场 / 用户运营", sector: "游戏", base: "广州/杭州/上海", status: "open", channel: "网易游戏校园招聘官网", link: "https://game.campus.163.com", apply_limit: "以官网为准", addedDate: "2026-08-17", deadline: "", reason: "27届7/21启动，运营/市场/产品类年薪20-28万+房补餐补，福利极好；社区/发行运营方法论通用，广告投放经验可迁移。" },
  { company: "平安银行（信用卡中心 / 汽车消费金融中心）", post: "信用卡中心培训生 / 运营培训生", sector: "消费金融", base: "上海/深圳/全国", status: "open", channel: "中国平安校园招聘官网（PAB营地计划）", link: "https://campus.pingan.com/", apply_limit: "网申2026-08-10至11-06，一般每人限投1-2个岗位（以官网为准）", addedDate: "2026-08-14", deadline: "2026-11-06", reason: "27届8月10日已启动网申；信用卡中心+汽车消费金融中心培训生做卡中心运营/风控/客户经营轮岗，与你信用卡产品运营、广告投放/效果营销经历高度对口，双非本硕友好、年薪17万+。" },
  { company: "XTransfer", post: "跨境支付运营 / 客户运营（外贸B2B收付款）", sector: "金融科技/支付", base: "上海/深圳", status: "open", channel: "XTransfer 校园招聘官网（北森）", link: "https://xtransfer.zhiye.com/Campus", apply_limit: "以官网为准（网申/内推 6月15日-9月30日）", addedDate: "2026-08-15", deadline: "2026-09-30", reason: "27届秋招网申进行中；跨境B2B收付款平台，外贸客户覆盖拉美/西语区市场，西语+金融/支付实习双背景高度对口，广告投放与用户运营经验可迁移到获客与商户运营，双非友好。" },
  { company: "OPPO", post: "海外运营 / 用户运营（销售服务类）", sector: "消费电子/出海", base: "深圳/东莞/西安/海外", status: "open", channel: "OPPO 2027届校园招聘官网", link: "https://careers.oppo.com/university/oppo/campus", apply_limit: "每人最多申请2个岗位（以官网为准），招满即止", addedDate: "2026-08-15", deadline: "", reason: "27届全球校招进行中；OPPO在拉美/西语区有成熟出海业务，海外/用户运营岗与西语语言+运营背景强匹配，广告投放与信用卡产品运营经验可迁移到市场与用户增长。" },
  { company: "淘宝闪购（阿里巴巴）", post: "用户运营 / AI产品运营 / 商品运营", sector: "互联网", base: "上海/杭州/北京", status: "open", channel: "淘宝闪购2027届校招官网（一站投递）", link: "https://talent.ele.me/campus/home?lang=zh", apply_limit: "阿里系每业务集团1次机会，最多投3个意向（以官网为准）", addedDate: "2026-08-16", deadline: "", reason: "饿了么升级为淘宝闪购后大量新增HC，27届8月已开放；用户运营/商品运营/AI产品运营与你产品运营+广告投放经历直接对口，属阿里独立业务线（与集团一站不同入口），双非可投。" },
  { company: "字节跳动", post: "行业运营 / 商业化运营（巨量引擎·抖音电商）", sector: "互联网", base: "北京/上海/深圳/杭州", status: "open", channel: "字节校园招聘官网", link: "https://jobs.bytedance.com/campus", apply_limit: "2027校招全年4次机会，年内2次，单次≤2岗（招满即止）", addedDate: "2026-08-13", deadline: "2027-05-31", reason: "27届8月3日已启动；你感兴趣的行业运营，广告投放+信用卡运营经历高度契合商业化运营，双非看重实习含金量。" },
  { company: "字节跳动", post: "用户运营 / 增长运营", sector: "互联网", base: "北京/杭州", status: "open", channel: "字节校园招聘官网", link: "https://jobs.bytedance.com/campus", apply_limit: "同上：全年4次，年内2次，单次≤2岗", addedDate: "2026-08-13", deadline: "2027-05-31", reason: "27届已开；用户增长/促活运营，广告投放的数据与转化经验直接可迁移，双非友好。" },
  { company: "阿里巴巴", post: "运营 / 商家运营 / 用户运营", sector: "互联网", base: "杭州/北京/上海/成都", status: "open", channel: "阿里校园招聘官网（一站投递）", link: "https://talent.alibaba.com/campus/home", apply_limit: "每个业务集团1次机会，最多选2个意向", addedDate: "2026-08-13", deadline: "", reason: "27届8月启动，本硕博均可（双非本科有机会）；淘天/本地生活运营岗多，运营方法论通用。" },
  { company: "阿里国际 AIDC", post: "海外运营 / 跨境招商运营（速卖通/Lazada）", sector: "跨境电商", base: "杭州/深圳", status: "open", channel: "阿里国际校园招聘", link: "https://talent.alibaba.com/campus/home", apply_limit: "每业务集团1次，最多2个意向", addedDate: "2026-08-13", deadline: "", reason: "西语可切拉美/西语区市场，跨境运营与你产品运营实习对口，双非可投。" },
  { company: "腾讯", post: "用户运营 / 内容运营 / 商业化运营", sector: "互联网", base: "深圳/北京/上海", status: "open", channel: "腾讯校园招聘官网", link: "https://join.qq.com/campus.html", apply_limit: "以官网为准（一般≤2个岗位）", addedDate: "2026-08-13", deadline: "", reason: "27届秋招开放；广告/内容/用户运营方向多，广告投放经验对口广告线，双非可投。" },
  { company: "百度", post: "用户运营 / 商业产品运营", sector: "互联网", base: "北京", status: "open", channel: "百度校园招聘官网", link: "https://talent.baidu.com/jobs/list", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届开放；商业化/搜索广告运营与你广告投放经历强相关，双非友好。" },
  { company: "美团", post: "用户运营 / 到店行业运营 / 商业分析", sector: "互联网", base: "北京/上海", status: "open", channel: "美团校园招聘官网", link: "https://campus.meituan.com", apply_limit: "以官网为准（惯例≤2岗）", addedDate: "2026-08-13", deadline: "", reason: "到店/到家行业运营与你的行业运营兴趣一致，运营方法论通用，双非量大。" },
  { company: "京东", post: "用户运营 / 商业化运营（新星计划）", sector: "互联网", base: "北京", status: "open", channel: "京东校园招聘官网", link: "https://campus.jd.com", apply_limit: "新星计划最多2个（主投+调剂）；管培生TET仅1个", addedDate: "2026-08-13", deadline: "", reason: "电商用户/商业化运营，广告投放经验对口京东零售商业化，双非本硕可投。" },
  { company: "拼多多 / Temu", post: "用户运营 / 类目运营 / 海外运营", sector: "跨境电商", base: "上海/深圳", status: "open", channel: "PDD 校园招聘官网", link: "https://careers.pddglobalhr.com", apply_limit: "提前批最多2个（含调剂），后续批次不影响", addedDate: "2026-08-13", deadline: "", reason: "Temu 出海高速扩张，西语切拉美站；运营节奏快、双非友好、给薪有竞争力。" },
  { company: "快手", post: "商业化运营 / 用户运营（磁力引擎）", sector: "互联网", base: "北京", status: "open", channel: "快手校园招聘官网", link: "https://zhaopin.kuaishou.cn", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "磁力引擎商业化投放运营，与你广告投放经历强相关，双非可投。" },
  { company: "哔哩哔哩", post: "产品运营 / 内容运营 / 商业化运营", sector: "互联网", base: "上海/北京/深圳", status: "open", channel: "B站校园招聘官网", link: "https://jobs.bilibili.com/campus", apply_limit: "以官网为准（惯例≤2岗）", addedDate: "2026-08-13", deadline: "", reason: "27届8月3日启动；社区+内容+商业化运营与你广告投放/内容运营契合，双非友好。" },
  { company: "小米", post: "用户运营 / 新零售运营 / 海外运营", sector: "消费电子/出海", base: "北京/武汉", status: "open", channel: "小米校园招聘官网", link: "https://job.xiaomi.com/campus", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届开放；生态链+海外市场运营，语言+运营组合有竞争力，双非量大。" },
  { company: "贝壳找房", post: "用户运营 / 城市运营", sector: "互联网", base: "北京/成都", status: "open", channel: "贝壳校园招聘官网", link: "https://job.ke.com/campus", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "平台+城市运营，运营岗多、门槛相对友好，适合双非本硕补充投递。" },
  { company: "米哈游 miHoYo", post: "用户运营 / 发行运营 / 社区运营", sector: "游戏", base: "上海", status: "open", channel: "米哈游校园招聘官网", link: "https://campus.mihoyo.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届8月3日启动；社区/发行运营方法论通用，广告投放经验可迁移到买量发行。" },
  { company: "蚂蚁集团（支付宝）", post: "行业运营 / 商家运营 / 用户运营", sector: "金融科技/支付", base: "杭州/上海", status: "open", channel: "蚂蚁校园招聘官网", link: "https://talent.antgroup.com/campus", apply_limit: "以官网为准（惯例≤2岗）", addedDate: "2026-08-13", deadline: "", reason: "支付宝行业/商家运营与你行业运营意向一致，信用卡运营与支付场景相通，双非可投。" },
  { company: "连连数科 LianLian", post: "跨境支付运营 / 商户运营", sector: "金融科技/支付", base: "杭州/上海", status: "soon", channel: "官网校招", link: "https://www.lianlianpay.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "跨境支付牌照齐全，金融+运营双背景强匹配，稳增长赛道，双非可投。" },
  { company: "PingPong", post: "海外市场运营 / 跨境金融运营", sector: "金融科技/支付", base: "杭州", status: "soon", channel: "官网校招", link: "https://www.pingpongx.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "跨境收款龙头，拉美是增长市场，西语+金融运营组合稀缺。" },
  { company: "Airwallex 空中云汇", post: "全球支付运营 / 客户成功", sector: "金融科技/支付", base: "上海/香港", status: "open", channel: "官网校招 / 内推", link: "https://www.airwallex.com/cn/careers", apply_limit: "外企一般不限次数（以招聘页为准）", addedDate: "2026-08-13", deadline: "", reason: "出海金融科技独角兽，重视语言与运营，金融类实习非常对口。" },
  { company: "PayPal 中国", post: "跨境支付运营 / 商户运营", sector: "金融科技/支付", base: "上海", status: "soon", channel: "官网校招 / 内推", link: "https://careers.pypl.com", apply_limit: "外企一般不限次数（以招聘页为准）", addedDate: "2026-08-13", deadline: "", reason: "金融+数字经济双背景强匹配，西语可服务拉美商户，金融实习加分。" },
  { company: "度小满金融", post: "用户运营 / 商业化运营", sector: "金融科技/支付", base: "北京", status: "soon", channel: "官网校招 / 内推", link: "https://duxiaoman.zhiye.com", apply_limit: "参照百度系，一般≤2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "信贷+理财运营，广告投放/效果营销经验对口，数字经济背景加分，双非可投。" },
  { company: "奇富科技（360数科）", post: "用户运营 / 增长运营", sector: "金融科技/支付", base: "上海", status: "soon", channel: "官网校招", link: "https://www.360shuke.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "信贷科技，用户增长+效果投放运营，广告投放与金融实习双对口，学历要求相对友好。" },
  { company: "招商银行信用卡中心（招银网络科技）", post: "用户运营 / 权益运营 / 数字化营销", sector: "消费金融", base: "深圳/上海", status: "open", channel: "招银网络科技校园招聘", link: "https://career.cmbchina.com", apply_limit: "银行系一般每人限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "27届8月已启动；信用卡产品运营经历最对口，掌上生活App用户/权益运营，广告投放加分。" },
  { company: "中信银行信用卡中心", post: "渠道运营 / 效果投放 / 用户增长", sector: "消费金融", base: "深圳", status: "open", channel: "信用卡中心招聘官网", link: "https://creditcard.ecitic.com/zhaopin/", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "岗位直接要求信息流投放(抖音/朋友圈)+数据分析+活动策划，几乎踩中你全部经历。" },
  { company: "招联消费金融", post: "用户运营 / 活动运营 / 投放运营", sector: "消费金融", base: "深圳", status: "soon", channel: "招联金融校园招聘官网", link: "https://mucfc.hotjob.cn", apply_limit: "通常限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "持牌消金龙头，用户运营+效果投放，金融类实习与广告投放双匹配，本科可投。" },
  { company: "马上消费金融", post: "用户运营 / 增长运营", sector: "消费金融", base: "重庆/北京", status: "soon", channel: "官网校招", link: "https://www.msxf.com/joinus", apply_limit: "通常限报1个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "头部消金，用户生命周期运营，金融实习+数据运营对口，非一线城市竞争相对小，双非友好。" },
  { company: "海尔消费金融", post: "用户运营 / 数据运营", sector: "消费金融", base: "青岛/上海", status: "open", channel: "海尔消金校园招聘", link: "https://haiercf.zhiye.com", apply_limit: "以官网为准（部分岗位偏硕博）", addedDate: "2026-08-13", deadline: "", reason: "持牌产融结合消金，运营+数据方向，金融实习对口；注意部分岗位要求硕博。" },
  { company: "乐信 分期乐", post: "用户运营 / 权益运营", sector: "消费金融", base: "深圳", status: "soon", channel: "乐信招聘官网", link: "https://www.lexin.com/join", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "分期消费平台，用户/权益运营与信用卡运营高度相通，年轻团队对双非相对友好。" },
  { company: "哈银消费金融", post: "运营 / 数据分析", sector: "消费金融", base: "哈尔滨/北京", status: "soon", channel: "校招官网 / 公众号", link: "https://mucfc.hotjob.cn", apply_limit: "以公告为准（本科可投）", addedDate: "2026-08-13", deadline: "", reason: "国有持牌消金，明确招本科生，运营岗门槛友好，适合双非稳妥投递（链接为示例，以其公告入口为准）。" },
  { company: "京东科技 / 京东金融", post: "用户运营 / 商业化运营", sector: "消费金融", base: "北京", status: "open", channel: "京东金融校招入口", link: "https://qifu.jd.com", apply_limit: "随京东校招（新星2个/管培1个）", addedDate: "2026-08-13", deadline: "", reason: "白条等消费金融业务，用户运营+营销，信用卡运营经历对口，双非可投。" },
  { company: "拓竹科技 Bambu Lab", post: "海外运营 / 拉美市场运营", sector: "消费电子/出海", base: "深圳", status: "soon", channel: "校招官网 / 公众号", link: "https://bambulab.zhiye.com", apply_limit: "中小企业一般不限次数（以招聘页为准）", addedDate: "2026-08-13", deadline: "", reason: "CES常客3D打印独角兽，西语切拉美电商运营，产品运营实习对口，双非友好。" },
  { company: "安克创新 Anker", post: "海外品牌运营管培生 / 用户运营", sector: "消费电子/出海", base: "深圳/长沙", status: "soon", channel: "校招官网", link: "https://anker.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "出海标杆，多语种区域运营，广告投放+产品运营背景匹配。" },
  { company: "SHEIN", post: "海外运营管培生（西语区）/ 内容运营", sector: "跨境电商", base: "广州", status: "open", channel: "官网校招", link: "https://careers.shein.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "西语区拉美重点市场，内容/用户运营实习直接可用，双非本硕大量在招。" },
  { company: "Temu（拼多多海外）", post: "招商运营 / 海外运营", sector: "跨境电商", base: "上海/广州", status: "open", channel: "Temu 招聘官网", link: "https://www.temu.com/careers", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "出海高增长，西语切拉美站，招商/运营岗多、双非友好、给薪高。" },
  { company: "Insta360 影石", post: "海外内容运营 / 社媒运营", sector: "消费电子/出海", base: "深圳", status: "open", channel: "校招官网", link: "https://insta360.zhiye.com", apply_limit: "一般不限次数（以招聘页为准）", addedDate: "2026-08-13", deadline: "", reason: "CES常胜军，内容+社媒运营，西语覆盖西语区社媒，广告投放经验对口。" },
  { company: "传音控股 Transsion", post: "新兴市场用户运营 / 运营管培", sector: "消费电子/出海", base: "深圳", status: "soon", channel: "校招官网", link: "https://transsion.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "非洲+拉美布局，小语种运营人才紧缺，数字经济背景加分，双非友好。" },
  { company: "大疆 DJI", post: "海外市场运营 / 品牌运营", sector: "消费电子/出海", base: "深圳", status: "soon", channel: "官网校招", link: "https://we.dji.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "全球品牌，区域市场运营岗，语言+运营组合有竞争力。" },
  { company: "涂鸦智能 Tuya", post: "海外生态运营 / 客户运营", sector: "人工智能", base: "杭州", status: "soon", channel: "校招官网", link: "https://tuya.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "WAIC活跃IoT平台，全球客户运营，数字经济背景契合，双非友好。" },
  { company: "帆软软件", post: "客户交付与运营 / 市场运营", sector: "互联网", base: "南京/无锡/成都/杭州", status: "open", channel: "帆软校园招聘", link: "https://www.fanruan.com/campus", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届8月提前批已开，客户交付与运营岗，运营方法论通用，双非友好、需求量大。" },
  { company: "Shopee（东南亚电商）", post: "跨境运营 / 招商运营（LDP管培）", sector: "跨境电商", base: "深圳/上海", status: "open", channel: "Shopee 校园招聘", link: "https://careers.shopee.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届外企秋招已开，出海电商运营，管培生对双非本硕友好，运营经历对口。" },
  { company: "科大讯飞 iFLYTEK", post: "海外产品运营 / 生态运营", sector: "人工智能", base: "合肥/北京", status: "soon", channel: "官网校招", link: "https://campus.iflytek.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "WAIC/AI展常客，翻译与国际化业务，语言背景天然贴合，双非量大。" },
  { company: "石头科技 Roborock", post: "海外市场运营 / 电商运营", sector: "消费电子/出海", base: "北京", status: "soon", channel: "官网校招", link: "https://roborock.zhiye.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "AWE/CES明星企业，欧洲+拉美扩张，西语区运营需求上升。" },
  { company: "科沃斯 Ecovacs", post: "海外区域运营（欧洲/拉美）", sector: "消费电子/出海", base: "苏州", status: "soon", channel: "官网校招", link: "https://ecovacs.zhiye.com", apply_limit: "一般限报1-2个岗位（以公告为准）", addedDate: "2026-08-13", deadline: "", reason: "扫地机出海头部，多语种区域运营，产品运营实习可迁移，双非友好。" },
  { company: "宝洁 P&G", post: "品牌管理 / 市场运营管培生", sector: "快消/零售", base: "广州/上海", status: "open", channel: "宝洁校园招聘官网", link: "https://www.pgcareers.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "顶级快消管培，不卡专业、看重英语与逻辑，品牌/市场运营与你广告投放经历对口，福利与晋升行业标杆。" },
  { company: "联合利华 Unilever", post: "UFLP 管培生（市场/客户发展）", sector: "快消/零售", base: "上海", status: "open", channel: "联合利华校园招聘官网", link: "https://careers.unilever.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "UFLP 全球轮岗管培，年薪高、成长快；市场/渠道运营方向，双非有机会，英语好加分。" },
  { company: "欧莱雅 L'Oréal", post: "管培生 / 电商运营 / 市场营销", sector: "快消/零售", base: "上海", status: "open", channel: "欧莱雅校园招聘官网", link: "https://careers.loreal.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "美妆龙头，电商/数字营销运营与你广告投放高度对口，福利与培养体系优秀。" },
  { company: "玛氏 Mars", post: "MLDP 管培生（市场/销售）", sector: "快消/零售", base: "上海", status: "open", channel: "玛氏校园招聘官网", link: "https://www.mars.com/careers", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "顶级雇主品牌，管培生年薪高，市场运营方向，工作氛围与福利口碑极好。" },
  { company: "雀巢 Nestlé", post: "管培生 / 市场运营", sector: "快消/零售", base: "上海/北京", status: "open", channel: "雀巢校园招聘官网", link: "https://www.nestle.com.cn/zhcn/jobs", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "全球食品饮料龙头，市场/渠道运营岗，稳定福利好，双非可投。" },
  { company: "亿滋 Mondelēz", post: "管培生（市场/销售/供应链）", sector: "快消/零售", base: "上海/苏州", status: "open", channel: "亿滋校园招聘官网", link: "https://www.mondelezinternational.com/careers", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "奥利奥/趣多多母公司，管培生福利好，市场运营方向，对双非友好。" },
  { company: "达能 Danone", post: "管培生 / 市场与电商", sector: "快消/零售", base: "上海", status: "open", channel: "达能校园招聘官网", link: "https://careers.danone.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "食品饮料外企，电商/市场运营，福利与工作生活平衡口碑好。" },
  { company: "雅培 Abbott", post: "管培生 / 市场运营", sector: "快消/零售", base: "上海", status: "open", channel: "雅培校园招聘官网", link: "https://www.abbott.com.cn/careers.html", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "27届外企秋招已开，医疗健康消费品，市场运营方向，外企福利与晋升好。" },
  { company: "亚马逊 Amazon", post: "运营管培 / 客户体验运营", sector: "人工智能", base: "北京/上海/深圳", status: "open", channel: "Amazon Student Programs", link: "https://www.amazon.jobs/en/teams/internships-for-students", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "全球科技巨头，运营/项目管理方向，英语好+数据运营对口，薪酬福利行业顶尖。" },
  { company: "微软 Microsoft", post: "MACH 运营 / 商业项目管培", sector: "人工智能", base: "北京/上海/苏州", status: "open", channel: "Microsoft Students", link: "https://careers.microsoft.com/students", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "顶级科技外企，商业运营/项目方向，工作生活平衡与晋升口碑极好，双非有机会。" },
  { company: "特斯拉 Tesla", post: "运营管培 / 市场运营", sector: "汽车/新能源", base: "上海", status: "open", channel: "特斯拉招聘官网", link: "https://www.tesla.cn/careers", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "新能源标杆，运营/市场方向，成长快、平台强，英语与数据能力加分。" },
  { company: "小红书", post: "社区运营 / 商业化运营 / 用户运营", sector: "互联网", base: "上海/北京", status: "open", channel: "小红书校园招聘官网", link: "https://job.xiaohongshu.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "内容社区高增长，社区/商业化运营与你广告投放+内容运营高度契合，福利好、氛围年轻。" },
  { company: "网易", post: "用户运营 / 产品运营", sector: "互联网", base: "杭州/广州/北京", status: "open", channel: "网易校园招聘官网", link: "https://campus.163.com", apply_limit: "以官网为准", addedDate: "2026-08-13", deadline: "", reason: "福利待遇口碑好的大厂，游戏/电商/传媒运营岗多，双非有机会。" },
];

/* ================= 状态 ================= */
const offerFilters = { company: "", post: "", processStage: "", base: "", priority: "" };
let activeOfferType = "互联网";
let activeOfferId = "";
let pendingConfirm = null;
let reviewRecords = [];
let openingRecords = [];
let openingQuery = "";
let openingOpenOnly = false;

const $ = (id) => document.getElementById(id);
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function safeUrl(v) {
  try {
    const url = new URL(String(v || ""), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function renderDashboard() {
  const offers = allOffers();
  const interviewing = offers.filter((o) => /面|面试/.test(offerMeta(o).stage)).length;
  const openTargets = openingRecords.filter((o) => o.status === "open").length;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).getTime();
  const recentOffers = offers.filter((o) => {
    const ts = o.sendDate ? new Date(`${o.sendDate}T00:00:00`).getTime() : 0;
    return ts >= start && ts <= today.getTime();
  });
  const todayText = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(today);
  if ($("todayLabel")) $("todayLabel").textContent = `${todayText} · 2027 届校招`;
  if ($("metricOffers")) $("metricOffers").textContent = offers.length;
  if ($("metricInterviews")) $("metricInterviews").textContent = interviewing;
  if ($("metricRecentOffers")) $("metricRecentOffers").textContent = recentOffers.length;
  if ($("metricOpenings")) $("metricOpenings").textContent = openTargets;
  if ($("metricOffersNote")) $("metricOffersNote").textContent = offers.length ? `覆盖 ${new Set(offers.map((o) => o.sector || "其他")).size} 个行业方向` : "开始记录第一份申请";
  if ($("metricRecentNote")) $("metricRecentNote").textContent = recentOffers.length ? `最近一笔：${fmtHistoryDate(recentOffers.slice().sort((a, b) => (b.sendDate || "").localeCompare(a.sendDate || ""))[0].sendDate)}` : "还没有投递记录";
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
function saveOffers() { localStorage.setItem(OFFER_KEY, JSON.stringify(offerData)); if (cloudEnabled()) cloudSave(CLOUD_TABLE.offers, OFFER_KEY, offerData); }
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
  renderApplicationHistory();
  renderDashboard();
}

/* ================= 日历 ================= */
const now = new Date();
const CY = now.getFullYear(), CM = now.getMonth(), CD = now.getDate();
let selYear = CY, selMonth = CM;

function initMonth() {
  const sel = $("monthSelect");
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const year = CY + yearOffset;
    for (let month = 0; month < 12; month++) {
      const o = document.createElement("option");
      o.value = `${year}-${month}`;
      o.textContent = `${year}年 ${month + 1}月`;
      if (year === CY && month === CM) o.selected = true;
      sel.appendChild(o);
    }
  }
  sel.addEventListener("change", (e) => {
    const [year, month] = e.target.value.split("-").map(Number);
    selYear = year; selMonth = month; renderCalendar();
  });
}
/* 某天新增岗位（按 addedDate） */
function newOpeningsOn(ds) {
  return openingRecords.filter((o) => (o.addedDate || "").slice(0, 10) === ds);
}
/* 某天投递截止岗位（按 deadline） */
function deadlineOpeningsOn(ds) {
  return openingRecords.filter((o) => (o.deadline || "").slice(0, 10) === ds);
}
/* 某天的投递记录（按投递日期） */
function offersOn(ds) {
  return allOffers().filter((o) => (o.sendDate || "").slice(0, 10) === ds);
}
function renderCalendar() {
  const cal = $("calendar");
  while (cal.children.length > 7) cal.removeChild(cal.lastChild);
  const first = new Date(selYear, selMonth, 1).getDay() || 7;
  const days = new Date(selYear, selMonth + 1, 0).getDate();
  for (let i = 1; i < first; i++) { const e = document.createElement("div"); e.className = "cal-day muted"; cal.appendChild(e); }
  for (let d = 1; d <= days; d++) {
    const ds = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "cal-day" + (selYear === CY && selMonth === CM && d === CD ? " today" : "");
    cell.dataset.date = ds;
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", `${selYear}年${selMonth + 1}月${d}日，查看详情`);
    cell.innerHTML = `<span class="num">${d}</span>`;
    const newCount = newOpeningsOn(ds).length;
    const dlCount = deadlineOpeningsOn(ds).length;
    const offerCount = offersOn(ds).length;
    if (newCount || dlCount || offerCount) {
      const rings = document.createElement("div"); rings.className = "cal-rings";
      if (offerCount) { const b = document.createElement("span"); b.className = "cal-ring blue"; b.textContent = offerCount; b.title = `${offerCount} 条投递记录`; rings.appendChild(b); }
      if (dlCount) { const r = document.createElement("span"); r.className = "cal-ring red"; r.textContent = dlCount; r.title = `${dlCount} 个岗位今日截止`; rings.appendChild(r); }
      if (newCount) { const g = document.createElement("span"); g.className = "cal-ring green"; g.textContent = newCount; g.title = `${newCount} 个新增岗位`; rings.appendChild(g); }
      cell.appendChild(rings);
    }
    cell.addEventListener("click", () => openDayModal(ds));
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDayModal(ds); }
    });
    cal.appendChild(cell);
  }
}

/* ================= 投递记录历史 ================= */
function fmtHistoryDate(d) {
  if (!d) return "无日期";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
}
function renderApplicationHistory() {
  const list = $("applicationHistoryList"), empty = $("applicationHistoryEmpty");
  if (!list) return;
  list.innerHTML = "";
  const sorted = allOffers().slice().sort((a, b) => (b.sendDate || "0000").localeCompare(a.sendDate || "0000"));
  if (!sorted.length) { empty.classList.remove("hidden"); renderDashboard(); return; }
  empty.classList.add("hidden");
  sorted.forEach((o) => {
    const dt = o.sendDate ? new Date(`${o.sendDate}T00:00:00`) : null;
    const day = dt && !Number.isNaN(dt.getTime()) ? dt.getDate() : "—";
    const month = dt && !Number.isNaN(dt.getTime()) ? `${dt.getMonth() + 1}月` : "无日期";
    const stage = offerMeta(o).stage || "投递";
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-date"><div><strong>${esc(day)}</strong><span>${esc(month)}</span></div></div>
      <div>
        <div class="history-company">${esc(o.company)}</div>
        <div class="history-meta">${esc(o.post)} · ${esc(stage)}${o.base ? ` · ${esc(o.base)}` : ""}</div>
      </div>
      <div class="history-actions">
        <button type="button" class="icon-btn edit-history-offer" data-id="${esc(o.id)}" aria-label="编辑 ${esc(o.company)} 投递记录">✎</button>
        <button type="button" class="icon-btn del delete-history-offer" data-id="${esc(o.id)}" aria-label="删除 ${esc(o.company)} 投递记录">×</button>
      </div>`;
    list.appendChild(item);
  });
  renderDashboard();
}

/* ===== 日期详情弹窗：岗位动态 + 当天投递记录 ===== */
let activeDayDate = "";
function fmtDayTitle(ds) {
  const dt = new Date(`${ds}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return ds;
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
}
function openDayModal(ds) {
  activeDayDate = ds;
  $("dayModalTitle").textContent = fmtDayTitle(ds);
  const dls = deadlineOpeningsOn(ds);
  const news = newOpeningsOn(ds);
  const dayOffers = offersOn(ds);

  // 红：投递截止
  const dlBlock = $("dayDeadlineBlock"), dlList = $("dayDeadlineList");
  dlList.innerHTML = "";
  if (dls.length) {
    dlBlock.classList.remove("hidden");
    dls.forEach((o) => {
      const el = document.createElement("div"); el.className = "day-job";
      const url = safeUrl(o.link);
      const link = url ? `<a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">投递</a>` : "";
      el.innerHTML = `<div class="day-job-main"><div class="day-job-company">${esc(o.company)}</div><div class="day-job-post">${esc(o.post)}</div></div>${link}`;
      dlList.appendChild(el);
    });
  } else { dlBlock.classList.add("hidden"); }

  // 绿：新增岗位
  const newBlock = $("dayNewBlock"), newList = $("dayNewList");
  newList.innerHTML = "";
  if (news.length) {
    newBlock.classList.remove("hidden");
    news.forEach((o) => {
      const el = document.createElement("div"); el.className = "day-job";
      const url = safeUrl(o.link);
      const link = url ? `<a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">投递</a>` : "";
      el.innerHTML = `<div class="day-job-main"><div class="day-job-company">${esc(o.company)}</div><div class="day-job-post">${esc(o.post)}</div></div>${link}`;
      newList.appendChild(el);
    });
  } else { newBlock.classList.add("hidden"); }

  const offerBlock = $("dayOfferBlock"), offerList = $("dayOfferList");
  offerList.innerHTML = "";
  if (dayOffers.length) {
    offerBlock.classList.remove("hidden");
    dayOffers.forEach((o) => {
      const meta = offerMeta(o);
      const el = document.createElement("div"); el.className = "day-job day-offer";
      el.innerHTML = `<div class="day-job-main"><div class="day-job-company">${esc(o.company)}</div><div class="day-job-post">${esc(o.post)} · ${esc(meta.stage || "投递")}${o.base ? ` · ${esc(o.base)}` : ""}</div></div>
        <button type="button" class="btn btn-quiet btn-sm edit-day-offer" data-id="${esc(o.id)}">编辑</button>`;
      offerList.appendChild(el);
    });
  } else { offerBlock.classList.add("hidden"); }

  $("dayEmpty").classList.toggle("hidden", dls.length || news.length || dayOffers.length);
  openModal("dayModal");
}

/* ================= 秋招岗位 ================= */
function mkOpening(f = {}) {
  const sector = f.sector === "消费电子出海" ? "消费电子/出海" : (f.sector || "");
  return { id: f.id || uid(), company: f.company || "", post: f.post || "", sector, base: f.base || "", status: f.status === "open" ? "open" : "soon", channel: f.channel || "", link: f.link || "", apply_limit: f.apply_limit || "", reason: f.reason || "", userAdded: !!f.userAdded, isNew: !!f.isNew, isDaily: !!f.isDaily, addedDate: f.addedDate || "", deadline: f.deadline || "" };
}
/* 远程岗位数据地址：与页面同目录的 openings.json（GitHub Pages 上可直接访问） */
const OPENINGS_URL = "./openings.json";
const OPENING_REMOTE_VER_KEY = "autumnOpeningsRemoteVersion";
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
/* 岗位去重键：公司+岗位 */
function openingKey(o) { return `${String(o.company || "").trim()}|${String(o.post || "").trim()}`; }
/*
 * 拉取远程 openings.json —— 纯追加合并，绝不覆盖已有岗位。
 * 规则：本地现有岗位（含内置推荐、每日已追加、用户手动新增）全部保留；
 *      只把远程里“本地还没有的”新岗位追加到末尾，并标记 isNew 显示“新”角标。
 */
async function fetchRemoteOpenings() {
  try {
    const res = await fetch(`${OPENINGS_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const remote = Array.isArray(data.openings) ? data.openings : (Array.isArray(data) ? data : null);
    if (!remote) return;
    // 远程今日推荐集合（isDaily）
    const dailyKeys = new Set(remote.filter((r) => r && r.isDaily).map(openingKey));
    const existMap = new Map(openingRecords.map((o) => [openingKey(o), o]));
    let added = 0;
    remote.forEach((r) => {
      if (!r || !r.company || !r.post) return;
      const k = openingKey(r);
      if (existMap.has(k)) {
        // 已有：同步“今日推荐”标记，其余字段保留本地
        existMap.get(k).isDaily = dailyKeys.has(k);
        return;
      }
      const rec = mkOpening({ ...r, isNew: true, isDaily: dailyKeys.has(k) });
      openingRecords.push(rec);
      existMap.set(k, rec);
      added++;
    });
    // 今日推荐置顶（保留其余顺序，历史全部保留）
    openingRecords.sort((a, b) => (b.isDaily ? 1 : 0) - (a.isDaily ? 1 : 0));
    const remoteVer = data.version || data.updatedAt || String(remote.length);
    localStorage.setItem(OPENING_REMOTE_VER_KEY, remoteVer);
    saveOpenings(); renderOpenings(); renderCalendar();
  } catch (e) {
    /* 离线或本地直接打开 file:// 时 fetch 可能失败，忽略，继续用本地数据 */
  }
}
function saveOpenings() { localStorage.setItem(OPENING_KEY, JSON.stringify(openingRecords)); }
async function resetOpenings() {
  // 先回退到内置 seed，保证即使离线也能恢复
  openingRecords = OPENING_SEED.map(mkOpening);
  localStorage.setItem(OPENING_KEY, JSON.stringify(openingRecords));
  localStorage.setItem(OPENING_VER_KEY, OPENING_SEED_VERSION);
  renderOpenings();
  // 再尝试拉取云端最新（成功会覆盖为最新推荐）
  localStorage.removeItem(OPENING_REMOTE_VER_KEY);
  await fetchRemoteOpenings();
}
/*
 * 拉取最新岗位（纯追加，不覆盖、不删除任何已有岗位）：
 *  1) 把内置 seed 里“本地还没有的”补进来（防止早期版本缺失）
 *  2) 再拉云端 openings.json 追加新岗位
 */
async function pullLatestOpenings() {
  const seen = new Set(openingRecords.map(openingKey));
  let added = 0;
  OPENING_SEED.forEach((s) => {
    const k = openingKey(s);
    if (seen.has(k)) return;
    seen.add(k);
    openingRecords.push(mkOpening(s));
    added++;
  });
  if (added > 0) { saveOpenings(); renderOpenings(); }
  localStorage.removeItem(OPENING_REMOTE_VER_KEY);
  await fetchRemoteOpenings();
}
function renderOpenings() {
  const list = $("openingList"), empty = $("openingEmpty");
  const total = openingRecords.length;
  const open = openingRecords.filter((o) => o.status === "open").length;
  const q = openingQuery.trim().toLocaleLowerCase("zh-CN");
  const visible = openingRecords.filter((o) => {
    if (openingOpenOnly && o.status !== "open") return false;
    if (!q) return true;
    return [o.company, o.post, o.sector, o.base, o.channel].some((v) => String(v || "").toLocaleLowerCase("zh-CN").includes(q));
  });
  $("openingsMeta").textContent = visible.length === total
    ? `共 ${total} 个目标 · 已开放 ${open} · 即将开放 ${total - open}`
    : `找到 ${visible.length} 个岗位 · 目标池共 ${total} 个`;
  list.innerHTML = "";
  if (!visible.length) { empty.textContent = total ? "没有符合条件的岗位，试试其他关键词。" : "暂无岗位，点“新增岗位”添加，或“拉取最新岗位”。"; empty.classList.remove("hidden"); renderDashboard(); return; }
  empty.classList.add("hidden");
  visible.forEach((it, i) => {
    const card = document.createElement("article"); card.className = "opening-card";
    const label = it.status === "open" ? "已开放" : "即将开放";
    const url = safeUrl(it.link);
    const link = url ? `<a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">投递</a>` : "";
    card.innerHTML = `
      <div class="opening-index">${i + 1}</div>
      <div class="opening-main">
        <div class="opening-title-row">
          <span class="opening-company">${esc(it.company)}</span>
          <span class="opening-post">${esc(it.post)}</span>
          <span class="badge ${it.status}">${label}</span>
          ${it.isDaily ? `<span class="badge daily">今日</span>` : ""}
          ${it.isNew ? `<span class="badge new">新</span>` : ""}
          ${it.sector ? `<span class="badge sector">${esc(it.sector)}</span>` : ""}
        </div>
        <div class="opening-meta">${it.base ? "📍 " + esc(it.base) : ""}${it.channel ? " ｜ " + esc(it.channel) : ""}</div>
        ${it.apply_limit ? `<div class="opening-limit">🎯 投递次数：${esc(it.apply_limit)}</div>` : ""}
        ${it.reason ? `<div class="opening-reason">${esc(it.reason)}</div>` : ""}
      </div>
      <div class="opening-actions">${link}<button type="button" class="btn btn-ghost btn-sm track-opening" data-id="${esc(it.id)}">加入投递</button><button type="button" class="btn btn-outline danger btn-sm del-opening" data-id="${esc(it.id)}">删除</button></div>`;
    list.appendChild(card);
  });
  renderDashboard();
}
function openingById(id) { return openingRecords.find((o) => o.id === id) || null; }
function saveOpening(e) {
  e.preventDefault();
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const rec = mkOpening({
    company: $("opCompany").value.trim(), post: $("opPost").value.trim(),
    sector: $("opSector").value.trim(), base: $("opBase").value.trim(),
    status: $("opStatus").value, channel: $("opChannel").value.trim(),
    link: $("opLink").value.trim(), apply_limit: $("opLimit").value.trim(),
    reason: $("opReason").value.trim(), userAdded: true,
    addedDate: today, deadline: ($("opDeadline") ? $("opDeadline").value : "") || "",
  });
  if (!rec.company || !rec.post) return;
  openingRecords.unshift(rec); saveOpenings(); renderOpenings(); renderCalendar(); closeModal("openingModal");
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
function saveReviews() { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewRecords)); if (cloudEnabled()) cloudSave(CLOUD_TABLE.reviews, REVIEW_KEY, reviewRecords); }
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
  const sendDate = $("sendDateInput").value;
  return { id: $("offerId").value || uid(), company: $("companyInput").value.trim(), post: $("postInput").value.trim(), sector, process: `${sendDate} ${$("processStageInput").value.trim()}`, remark: $("remarkInput").value.trim(), latest: $("latestInput").value.trim(), sendDate, base: $("baseInput").value.trim(), priority: $("priorityInput").value };
}
function applyType(sector, mode) {
  activeOfferType = SECTORS.includes(sector) ? sector : "其他"; $("typeInput").value = activeOfferType;
  $("offerModalTitle").textContent = mode === "edit" ? "修改投递记录" : "新增投递记录";
  $("offerModalSub").textContent = mode === "edit" ? "修改投递信息，可调整所属行业。" : "填写投递信息并选择所属行业，提交后写入本地数据。";
  $("offerSave").textContent = mode === "edit" ? "保存修改" : "新增投递记录";
}
function fillOffer(r) {
  $("offerId").value = r?.id || ""; $("companyInput").value = r?.company || ""; $("postInput").value = r?.post || "";
  $("latestInput").value = r?.latest || ""; $("sendDateInput").value = r?.sendDate || ""; $("baseInput").value = r?.base || "";
  $("priorityInput").value = r?.priority || "高"; $("remarkInput").value = r?.remark || "";
  const m = String(r?.process || "").match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
  $("processStageInput").value = m?.[2] || "投递";
}
function openOfferModal(type, r = null) { activeOfferId = r?.id || ""; applyType(type, r?.id ? "edit" : "create"); fillOffer(r); openModal("offerModal"); setTimeout(() => $("companyInput").focus(), 0); }
function openOfferForDate(ds) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = ds || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if ($("dayModal").classList.contains("open")) closeModal("dayModal");
  openOfferModal("互联网", { process: `${date} 投递`, sendDate: date, priority: "高" });
}
function trackOpeningAsOffer(opening) {
  if (!opening) return;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  openOfferModal(opening.sector || "其他", {
    company: opening.company,
    post: opening.post,
    base: opening.base,
    process: `${today} 投递`,
    sendDate: today,
    priority: "高",
    remark: opening.link ? `投递链接：${opening.link}` : "",
  });
}
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

  // 日期详情弹窗
  $("dayClose").addEventListener("click", () => closeModal("dayModal"));
  $("dayAddOfferBtn").addEventListener("click", () => openOfferForDate(activeDayDate));
  $("dayOfferList").addEventListener("click", (e) => {
    const edit = e.target.closest(".edit-day-offer");
    if (!edit) return;
    const record = offerById(edit.dataset.id);
    if (record) { closeModal("dayModal"); openOfferModal(record.sector || "其他", record); }
  });

  // 投递历史
  $("historyAddOfferBtn").addEventListener("click", () => openOfferForDate());
  $("applicationHistoryList").addEventListener("click", (e) => {
    const edit = e.target.closest(".edit-history-offer");
    if (edit) { const record = offerById(edit.dataset.id); if (record) openOfferModal(record.sector || "其他", record); return; }
    const del = e.target.closest(".delete-history-offer");
    if (!del) return;
    const record = offerById(del.dataset.id);
    openConfirm({ title: "删除投递记录", desc: "删除后会同时从历史、看板和日历移除。", msg: "确定删除这条投递记录吗？", highlight: record ? `${record.company} · ${record.post}` : "这条记录", onOk: () => deleteOffer(del.dataset.id) });
  });

  // 秋招
  $("openOpeningBtn").addEventListener("click", () => { $("openingForm").reset(); $("opStatus").value = "open"; openModal("openingModal"); setTimeout(() => $("opCompany").focus(), 0); });
  $("openingSearch").addEventListener("input", (e) => { openingQuery = e.target.value; renderOpenings(); });
  $("openOnlyToggle").addEventListener("change", (e) => { openingOpenOnly = e.target.checked; renderOpenings(); });
  $("openingClose").addEventListener("click", () => closeModal("openingModal"));
  $("openingCancel").addEventListener("click", () => closeModal("openingModal"));
  $("resetOpeningsBtn").addEventListener("click", () => pullLatestOpenings());
  $("openingList").addEventListener("click", (e) => {
    const track = e.target.closest(".track-opening");
    if (track) { trackOpeningAsOffer(openingById(track.dataset.id)); return; }
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
  $("heroOfferBtn").addEventListener("click", () => openOfferForDate());
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
  ["offerModal", "openingModal", "reviewModal", "confirmModal", "dayModal"].forEach((id) => {
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

/* ================= 登录 / 云同步流程 ================= */
let authMode = "login"; // login | signup

function updateAccountBar() {
  const badge = $("cloudBadge"), who = $("whoami"), loginBtn = $("loginBtn"), logoutBtn = $("logoutBtn");
  if (!badge) return;
  if (!cloudReady) {
    badge.textContent = "本地模式"; badge.className = "cloud-badge off";
    who.textContent = ""; loginBtn.classList.add("hidden"); logoutBtn.classList.add("hidden");
    return;
  }
  if (currentUser) {
    badge.textContent = "已云端同步"; badge.className = "cloud-badge on";
    who.textContent = currentUser.email || "";
    loginBtn.classList.add("hidden"); logoutBtn.classList.remove("hidden");
  } else {
    badge.textContent = "未登录（本地）"; badge.className = "cloud-badge off";
    who.textContent = ""; loginBtn.classList.remove("hidden"); logoutBtn.classList.add("hidden");
  }
}

function setAuthMode(mode) {
  authMode = mode;
  $("authTitle").textContent = mode === "signup" ? "注册" : "登录";
  $("authSubmit").textContent = mode === "signup" ? "注册" : "登录";
  $("authSwitch").innerHTML = mode === "signup"
    ? '已有账号？<a id="authToggle">去登录</a>'
    : '还没有账号？<a id="authToggle">注册一个</a>';
  $("authToggle").addEventListener("click", () => setAuthMode(mode === "signup" ? "login" : "signup"));
  const msg = $("authMsg"); msg.textContent = ""; msg.className = "auth-msg";
}

function openAuthModal() { setAuthMode("login"); $("authEmail").value = ""; $("authPassword").value = ""; openModal("authModal"); setTimeout(() => $("authEmail").focus(), 0); }
function closeAuthModal() { closeModal("authModal"); }

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  const msg = $("authMsg");
  if (!email || password.length < 6) { msg.textContent = "请输入邮箱和至少 6 位密码。"; msg.className = "auth-msg err"; return; }
  msg.textContent = "处理中…"; msg.className = "auth-msg";
  try {
    if (authMode === "signup") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      msg.textContent = "注册成功。若开启了邮箱验证，请查收邮件后再登录。"; msg.className = "auth-msg ok";
      setAuthMode("login");
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    msg.textContent = "登录成功。"; msg.className = "auth-msg ok";
    closeAuthModal();
  } catch (err) {
    msg.textContent = "失败：" + (err && err.message ? err.message : "请重试"); msg.className = "auth-msg err";
  }
}

async function handleLogout() {
  if (sb) await sb.auth.signOut();
}

/* 登录后：把云端投递与复盘数据拉下来覆盖内存与本地并重渲染。
 * 若云端为空而本地有数据 → 视为首次登录，把本地数据迁移上云。 */
async function syncPullAll() {
  if (!cloudEnabled()) return;
  const [cOffers, cRev] = await Promise.all([
    cloudLoad(CLOUD_TABLE.offers, OFFER_KEY),
    cloudLoad(CLOUD_TABLE.reviews, REVIEW_KEY),
  ]);
  const cloudEmpty = (!cOffers || !cOffers.length) && (!cRev || !cRev.length);
  const localHas = offerData.length || reviewRecords.length;
  if (cloudEmpty && localHas) {
    // 首次登录：本地 → 云端
    await Promise.all([
      cloudSave(CLOUD_TABLE.offers, OFFER_KEY, offerData),
      cloudSave(CLOUD_TABLE.reviews, REVIEW_KEY, reviewRecords),
    ]);
  } else {
    // 云端 → 内存/本地
    offerData = (cOffers || []).map(normalizeOffer);
    reviewRecords = (cRev || []).map(mkReview);
    localStorage.setItem(OFFER_KEY, JSON.stringify(offerData));
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewRecords));
  }
  renderTables(); renderCalendar(); renderReviews(); renderApplicationHistory();
}

async function setupAuth() {
  if (!initSupabase()) { updateAccountBar(); return; }
  $("loginBtn").addEventListener("click", openAuthModal);
  $("logoutBtn").addEventListener("click", handleLogout);
  $("authClose").addEventListener("click", closeAuthModal);
  $("authCancel").addEventListener("click", closeAuthModal);
  $("authForm").addEventListener("submit", handleAuthSubmit);
  $("authModal").addEventListener("click", (e) => { if (e.target.id === "authModal") closeAuthModal(); });

  // 恢复已有会话
  const { data } = await sb.auth.getSession();
  currentUser = data && data.session ? data.session.user : null;
  updateAccountBar();
  if (currentUser) await syncPullAll();

  // 监听登录态变化
  sb.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session ? session.user : null;
    updateAccountBar();
    if (currentUser) await syncPullAll();
  });
}

/* ================= 初始化 ================= */
initMonth();
fillSectorSelect();
renderTables();
renderCalendar();
renderApplicationHistory();
reviewRecords = loadReviews();
renderReviews();
openingRecords = loadOpenings();
renderOpenings();
resetOfferForm();
bind();
/* 打开页面后自动补齐岗位（追加式，不覆盖/不删除已有）：
 * 先用内置 seed 补齐（file:// 直接打开也能生效），再尝试拉云端 openings.json。 */
pullLatestOpenings();
/* 初始化登录 / 云同步（未配置 Supabase 时自动退回本地模式） */
setupAuth();
