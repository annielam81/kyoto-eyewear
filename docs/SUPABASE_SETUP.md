# KYOTO Supabase 后端搭建指南

> 面向：第一次把 KYOTO 后台系统接到 Supabase 的人。
> 预计 20–30 分钟。需要：一个 Supabase 账号、浏览器、本仓库代码。

---

## 0. 先看懂三样东西

| 东西 | 位置 | 作用 |
|---|---|---|
| 契约（唯一事实来源） | `supabase/kyoto.ts` | 所有表结构、顾客 DTO、权限规则都以它为准 |
| 数据库迁移 | `supabase/migrations/0001`–`0005` | 按顺序执行，建表 → RLS → Storage → 视图 → 种子数据 |
| 环境变量模板 | `.env.example` | 复制成 `.env` 再填真实值（`.env` 已在 `.gitignore`，不许提交） |

---

## 1. 创建 Supabase 项目

1. 打开 <https://supabase.com> → 登录 → **New project**。
2. Name 填 `kyoto-eyewear`（随便起，记下来就行）。
3. Database Password：设一个强密码，**记到密码管理器里**（以后直连数据库用）。
4. Region：选离你最近的（美国东岸选 `US East (N. Virginia)`）。
5. 点 **Create new project**，等 1–2 分钟初始化完成。

## 2. 按顺序跑 migrations

1. 左侧栏进 **SQL Editor** → **New query**。
2. 按顺序把下面 5 个文件的内容**整个复制**进编辑器、点 **Run**，一个一个来：
   1. `supabase/migrations/0001_schema.sql` —— 建表（profiles / products / product_images / inventory / inventory_ledger / ai_jobs / audit_log / supplier_templates / customers / orders / prescriptions / promotions）
   2. `supabase/migrations/0002_rls.sql` —— 开 RLS + 全部策略（anon 只能看 published 商品；staff 不能 publish；库存/台账/AI/审计只有 owner+admin 能碰）
   3. `supabase/migrations/0003_storage.sql` —— 4 个 bucket + 读写策略
   4. `supabase/migrations/0004_views.sql` —— 顾客安全视图 `api_published_products`（只暴露顾客字段 + in_stock/low_stock 两个布尔）
   5. `supabase/migrations/0005_seed.sql` —— 6 款现有产品 + 每款 50 件库存
3. 每个跑完确认右下角显示 **Success**。报错就停下来，把报错信息贴给开发，不要跳过。

> 备选：装了 Supabase CLI 的可以用 `supabase db push`，效果一样。

## 3. 确认 buckets 建好了

1. 左侧栏进 **Storage**，应该看到 4 个 bucket：
   - `kyoto-original`（private：原图，顾客端永远不可见）
   - `kyoto-cleaned`（public）
   - `kyoto-marketing`（public）
   - `kyoto-thumbs`（public）
2. 少了哪个，回第 2 步重跑 `0003_storage.sql`（它是幂等的，可重复执行）。

## 4. 建第一个 owner 用户

> ⚠️ 这是**唯一一次**需要动 SQL 建用户的地方。之后的用户都在 Admin 后台里由 owner 添加。

1. 先在 **Authentication → Users** 点 **Add user → Create new user**，填邮箱、设密码，记住这个邮箱。
2. 到 **SQL Editor** 跑下面这条（把邮箱换成你刚建的）：

```sql
-- 把刚注册的用户提为 owner（id 从 auth.users 取，不用手填）
insert into public.profiles (id, email, display_name, role, can_publish, can_access_prescriptions)
select id, email, 'Owner', 'owner', true, true
from auth.users
where email = '你刚注册的邮箱@example.com'
on conflict (id) do update
  set role = 'owner', can_publish = true, can_access_prescriptions = true;
```

3. 验证：跑 `select email, role from public.profiles;`，应该看到你那行是 `owner`。

## 5. 填 .env 并启动 admin

1. 在仓库根目录复制模板：

```bash
cp .env.example .env
```

2. 去 Supabase 项目 **Settings → API**，把下面三个值填进 `.env`：
   - `SUPABASE_URL` / `VITE_SUPABASE_URL` ← Project URL
   - `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` ← anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` ← service_role key（**仅服务端用，不许进前端代码**）
3. 回到 `admin/` 目录（Vite + Vue3 后台），按它 README 的说明 `npm install && npm run dev`，用第 4 步的 owner 账号登录。

## 6. 烟雾测试（确认都通了）

在 SQL Editor 里跑：

```sql
-- 6 款产品都在、都是 published
select legacy_id, sku, regular_price, launch_price, status from public.products;
-- 库存每款 50 件可用
select p.legacy_id, (i.on_hand - i.reserved) as available
from public.products p join public.inventory i on i.product_id = p.id;
-- 顾客视图：看不到 cost/supplier/internal_notes/ai_meta
select id, price, in_stock, low_stock from public.api_published_products;
```

---

## 还没接的东西（以后再做）

| 没接 | 说明 |
|---|---|
| AI Key | `AI_*` 全在 `.env.example` 里注释着。等用户提供 key 后再填，只许出现在服务端环境变量 |
| Edge Functions | AI 图片处理 / 内容生成等服务端逻辑还没写，写好后单独部署 |
| 顾客端直连 | 顾客 App/网页现在还是读静态数据，切到 `api_published_products` 是下一步 |
| 真机验证 | 目前 migrations 只做过 SQL 语法解析校验，没有连真实 Supabase 项目跑过；第 2 步第一次执行时如有报错请记录下来 |

## 出问题找谁

- RLS 报 `permission denied`：先查 `public.profiles` 里自己的 `role` 对不对（第 4 步）。
- 图片 403：检查 bucket 的 public 标记和 `0003` 的 storage 策略是否都跑成功了。
- 其他：把 SQL Editor 的完整报错信息贴给开发。
