# 部署 & 每日自动更新指南

你的仓库：`Whisky0377/AI-coding`，已启用 GitHub Pages。
线上地址：`https://whisky0377.github.io/AI-coding/`

全程浏览器操作，不需要安装 git。

---

## 一、把看板上传到仓库（首次）

在仓库页点 `Add file` → `Upload files`，从 `C:\Users\didi\Desktop\27fall` 拖入这些文件：

必传：
- `index.html`（页面入口，会覆盖仓库里旧的 index.html）
- `job-board.js`（全部逻辑，必须传，否则白屏）
- `openings.json`（岗位数据，网页会自动读取它）

建议一起传（实现每日云端自动更新）：
- `scripts/update-openings.js`
- `.github/workflows/daily-openings.yml`

可选：
- `README.md`（不想覆盖仓库现有说明就别传）
- `candidates.json`（候选池，见第三节；没有可不传）

第二阶段（登录+云同步，见 `SUPABASE.md`）还需传：
- `config.js`（填好 Supabase 密钥后上传）
- `supabase-schema.sql`（仅供参考，可不传到 Pages，但建议留仓库）
- `index.html` 已内置 Supabase SDK 引用，无需额外操作

> 拖文件夹（`scripts/`、`.github/`）时，GitHub 网页上传会保留目录结构，直接拖对应文件夹即可。

传完点 `Commit changes`，等 1–2 分钟，打开 `https://whisky0377.github.io/AI-coding/` 查看。

---

## 二、每日自动更新（核心）

已配置 GitHub Actions 工作流 `.github/workflows/daily-openings.yml`：

- 每天北京时间约 09:00 在 **GitHub 云端自动运行**（你电脑关机也照跑）。
- 运行 `scripts/update-openings.js` 刷新 `openings.json`（更新版本号/时间戳，并从候选池补充新岗位）。
- 自动把改动 commit 回仓库 → GitHub Pages 自动重新部署。
- 网页每次打开会自动 `fetch openings.json`，永远显示最新岗位，**你再也不用手动上传**。

首次上传工作流后，可到仓库 `Actions` 标签页 → 选 `Daily openings update` → 点 `Run workflow` 手动跑一次验证。

> 如果 Actions 提示没有推送权限：仓库 `Settings` → `Actions` → `General` → 底部 `Workflow permissions` 选 `Read and write permissions` 并保存。

---

## 三、让每日更新“更聪明”（可选）

GitHub 云端无法调用 SmartWork 的联网智能搜索，所以云端脚本只做轻量刷新。
要让它每天补充“智能挑选的新岗位”，用候选池机制：

1. 让本地 SmartWork 定时任务把优质新岗位写进一个 `candidates.json`
   （结构：`{ "openings": [ {company, post, sector, base, status, channel, link, apply_limit, reason}, ... ] }`）。
2. 把 `candidates.json` 上传到仓库。
3. 云端脚本每天会自动把候选池里“主清单还没有的岗位”补进 `openings.json`。

这样：SmartWork 负责“智能选岗”写候选池，GitHub Actions 负责“云端每天合并发布”，两边各司其职。

---

## 四、以后手动改内容

改完本地文件 → 仓库 `Add file` → `Upload files` → 覆盖上传 → `Commit`，1–2 分钟生效。
但岗位数据（openings.json）已交给自动更新，通常不用手动动。

---

## 五、下一阶段：多设备同步 + 每人只看自己的数据

当前投递/提醒/复盘数据仍存各自浏览器本地（不同步、不分账号）。
要做到“手机录入电脑可见、分享给同学但互相看不到”，需接入登录 + 云数据库：

- **Supabase**（免费）：邮箱登录 + PostgreSQL + 行级安全 RLS（数据按用户隔离）。
- 需要把 `job-board.js` 里 localStorage 的读写替换为 Supabase 读写，并建数据表、配登录。

需要时让 SmartWork 继续帮你完成这一步。
