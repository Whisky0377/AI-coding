"use strict";
(() => {
  const list = document.getElementById("interviewResourceList");
  const status = document.getElementById("interviewResourceStatus");
  const filter = document.getElementById("interviewPlatform");
  const refresh = document.getElementById("refreshInterviewResources");
  if (!list || !status || !filter || !refresh) return;
  let items = [];
  function text(tag, value, className) {
    const el = document.createElement(tag);
    el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function render() {
    list.replaceChildren();
    const selected = items.filter(item => !filter.value || item.platform === filter.value);
    for (const item of selected) {
      const card = text("article", "", "interview-resource-card");
      const link = text("a", item.title);
      link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      const heading = text("h3", ""); heading.append(link); card.append(heading);
      card.append(text("p", [item.platform, item.format, item.author || "原帖查看", "原帖：" + (item.publishedAt || "日期未核实")].join(" · "), "interview-resource-meta"));
      card.append(text("p", item.summary || ""));
      if (item.practice) card.append(text("p", "练习建议：" + item.practice));
      card.append(text("p", (item.verification || "请以原帖为准") + " · 核验：" + (item.checkedAt || "未标注"), "interview-resource-meta"));
      list.append(card);
    }
    if (!selected.length) list.append(text("p", "当前分类暂无内容。"));
  }
  async function load() {
    refresh.disabled = true;
    status.textContent = "正在获取最新经验清单…";
    try {
      const response = await fetch("./interview-resources.json?t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("内容格式异常");
      const valid = data.items.filter(item => {
        try { return item && typeof item.title === "string" && new URL(item.url).protocol === "https:"; }
        catch { return false; }
      });
      items = valid;
      render();
      status.textContent = "清单更新：" + (data.updatedAt || "未标注") + " · 共 " + items.length + " 篇 · 计划每日 08:00（北京时间）核验；以实际更新日期为准";
    } catch (error) {
      status.textContent = "经验清单加载失败，请稍后点击刷新。" + (items.length ? " 当前保留上次已加载内容。" : "");
    } finally { refresh.disabled = false; }
  }
  filter.addEventListener("change", render);
  refresh.addEventListener("click", load);
  load();
})();
