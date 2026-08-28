# 第二阶段：接入 Supabase（登录 + 多设备同步 + 数据隔离）

做完这步后：
- 同学各自注册账号，**各看各的数据**，互相看不到；
- 手机录入、电脑登录同一账号即可看到（**跨设备同步**）；
- 推荐岗位仍是公共的（大家看同一份）。

全程约 10 分钟，免费。

---

## 第一步：创建 Supabase 项目

1. 打开 https://supabase.com → `Start your project` → 用 GitHub 登录。
2. `New project`：
   - Name 随意，例如 `job-track`
   - Database Password 设一个（自己记住即可，前端用不到）
   - Region 选离你近的（如 Singapore）
3. 点 `Create new project`，等 1–2 分钟初始化完成。

## 第二步：建表 + 开启数据隔离（RLS）

1. 左侧 `SQL Editor` → `New query`。
2. 打开本仓库的 `supabase-schema.sql`，把内容**全部复制**粘进去。
3. 点 `Run`。看到 Success 即建好两张表并开启了行级安全。

## 第三步：拿到两个密钥

1. 左侧 `Project Settings`（齿轮）→ `API`（或 `Data API`）。
2. 复制这两个值：
   - **Project URL**，形如 `https://abcdefg.supabase.co`
   - **anon public** key（很长一串，anon 公钥可安全放前端）

## 第四步：填进 config.js

打开本仓库 `config.js`，把两个值填进去：

```js
window.SUPABASE_URL = "https://你的项目.supabase.co";
window.SUPABASE_ANON_KEY = "你的 anon public key";
```

保存后**上传 config.js 到 GitHub 仓库**（覆盖上传）。

## 第五步（推荐）：关闭邮箱验证，省去流程麻烦

同学注册后如果要求验证邮箱会比较烦。可选择关闭：

- Supabase 左侧 `Authentication` → `Providers` → `Email`
- 关掉 `Confirm email`（Enable email confirmations 取消勾选）→ 保存

这样注册后可直接登录。（若你更看重安全，可保留验证。）

## 完成

打开你的线上网址 `https://whisky0377.github.io/AI-coding/`：
- 顶部会显示「未登录（本地）」+「登录 / 注册」按钮；
- 注册并登录后，徽章变「已云端同步」，数据开始跨设备同步；
- 第一次登录会把你本机已有的本地数据自动迁移上云。

---

## 常见问题

- **没填 config.js 会怎样？** 网页自动退回“本地模式”，功能照常，只是不登录、不同步。
- **anon key 放前端安全吗？** 安全。它是公开可用的匿名密钥，真正的数据保护由 RLS（行级安全）在数据库侧强制执行：每个人只能读写 `user_id = 自己` 的行。
- **要分享给同学：** 直接发线上网址即可，他们各自注册账号，数据互不可见。
- **每日岗位自动更新**（第一阶段的 GitHub Actions）与本阶段互不影响，继续照常工作。
