#!/usr/bin/env node
/*
 * Daily openings updater (run by GitHub Actions).
 *
 * Behaviour:
 *  1) Merge candidates.json into openings.json (append-only, dedup by company+post).
 *     -> Never removes previously recommended jobs.
 *  2) Pick 10 "today" jobs by daily rotation over the whole pool, mark them isDaily=true
 *     and move them to the FRONT so the newest 10 stay on top; all others kept below.
 *  3) Refresh version/updatedAt so the web page knows there is an update.
 *
 * GitHub Actions cannot run SmartWork web search, so it only rotates/merges verified data.
 * The SmartWork local task keeps appending fresh verified jobs into candidates.json.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OPENINGS = path.join(ROOT, "openings.json");
const CANDIDATES = path.join(ROOT, "candidates.json");
const DAILY_COUNT = 10;

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function keyOf(o) { return `${(o.company || "").trim()}|${(o.post || "").trim()}`; }
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
// days since epoch, used to rotate the daily window deterministically
function dayIndex() { return Math.floor(Date.now() / 86400000); }

function main() {
  const current = readJson(OPENINGS, { openings: [] });
  let openings = Array.isArray(current.openings) ? current.openings : [];

  // 1) merge candidates (append-only, dedup)
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

  // clear previous daily flags
  openings.forEach((o) => { delete o.isDaily; });

  // 2) rotate a window of DAILY_COUNT across the pool by day
  const n = openings.length;
  const picks = [];
  if (n > 0) {
    const start = (dayIndex() * DAILY_COUNT) % n;
    for (let i = 0; i < Math.min(DAILY_COUNT, n); i++) {
      picks.push(openings[(start + i) % n]);
    }
  }
  const pickKeys = new Set(picks.map(keyOf));
  picks.forEach((o) => { o.isDaily = true; });
  const rest = openings.filter((o) => !pickKeys.has(keyOf(o)));
  const reordered = [...picks, ...rest];

  const out = {
    version: today(),
    updatedAt: new Date().toISOString(),
    grad_year: "2027",
    dailyCount: picks.length,
    source: added > 0 ? "candidates+rotate" : "rotate",
    openings: reordered,
  };

  fs.writeFileSync(OPENINGS, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`openings.json: total=${reordered.length}, newlyAdded=${added}, dailyTop=${picks.length}, version=${out.version}`);
}

main();
