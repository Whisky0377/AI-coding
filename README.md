# OfferFlow · 27届校招作战台

一个纯前端的求职投递工作台：首屏进度概览、可点击新增投递的日历、投递记录历史、可搜索的秋招岗位库、按行业自由分列的投递看板与面试复盘。岗位可一键加入投递记录，数据默认保存在浏览器本地（localStorage）。

## 在线访问

部署到 GitHub Pages 后，访问地址形如：
`https://<你的GitHub用户名>.github.io/<仓库名>/`

## 本地打开

直接双击 `index.html` 即可，无需任何服务器。

## 文件说明

- `index.html` — 页面结构与样式（GitHub Pages 入口）
- `job-board.js` — 全部交互逻辑；打开时自动读取 `openings.json`
- `openings.json` — 岗位数据（网页自动 fetch，可被每日任务自动更新）
- `scripts/update-openings.js` — 云端每日更新脚本
- `.github/workflows/daily-openings.yml` — GitHub Actions 每日自动更新工作流
- `candidates.json`（可选）— 候选池，供每日脚本自动合并新岗位
- `job-board.html` — 与 index.html 内容相同的备份副本
- `DEPLOY.md` — 部署与每日自动更新指南

## 每日自动更新

GitHub Actions 每天在云端刷新 `openings.json` 并自动提交，网页打开即拉取最新，无需手动上传。详见 `DEPLOY.md`。

## 注意

当前版本数据存储在浏览器本地，**不跨设备同步、不区分用户**。若需要“多设备同步 + 每人只看自己的数据”，需接入登录与云数据库（见 DEPLOY.md 末尾的“第二阶段”）。
