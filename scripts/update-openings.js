#!/usr/bin/env node
/*
 * 云端每日更新脚本（由 GitHub Actions 定时调用）。
 *
 * 作用：刷新 openings.json 的 version / updatedAt，让网页能感知到“今日已更新”。
 * 说明：GitHub Actions 是纯云端环境，无法调用 SmartWork 的联网智能搜索，
 *      所以这里只做“轻量刷新 + 候选池轮换”。真正的“智能选岗”仍由本地
 *      SmartWork 定时任务把优质新岗位追加进 candidates.json（见下）。
 *
 * 候选池机制：
 *  - openings.json  = 网页实际展示的岗位（主清单）
 *  - candidates.json（可选）= 你/SmartWork 维护的更大候选池
 *    若存在 candidates.json，脚本会把其中尚未出现在主清单里的岗位补进来。
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OPENINGS = path.join(ROOT, "openings.json");
const CANDIDATES = path.join(ROOT, "candidates.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function keyOf(o) {
  return `${(o.company || "").trim()}|${(o.post || "").trim()}`;
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main() {
  const current = readJson(OPENINGS, { openings: [] });
  let openings = Array.isArray(current.openings) ? current.openings : [];

  // 从候选池补充未出现的岗位
  const candidates = readJson(CANDIDATES, null);
  let added = 0;
  if (candidates && Array.isArray(candidates.openings)) {
    const seen = new Set(openings.map(keyOf));
    for (const c of candidates.openings) {
      if (!c || !c.company || !c.post) continue;
      if (seen.has(keyOf(c))) continue;
      openings.push(c);
      seen.add(keyOf(c));
      added++;
    }
  }

  const out = {
    version: today(),
    updatedAt: new Date().toISOString(),
    source: added > 0 ? "candidates+seed" : "seed",
    openings,
  };

  fs.writeFileSync(OPENINGS, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`updated openings.json: total=${openings.length}, newlyAdded=${added}, version=${out.version}`);
}

main();
