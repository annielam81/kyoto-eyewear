# KYOTO Admin · 后台管理系统

Vite + Vue 3 + TypeScript 构建的内部后台，与 uni-app 顾客端完全独立。
数据访问唯一契约：`../supabase/kyoto.ts`（DbProvider 接口 / Row 类型 / toCustomerProduct），不另发明。

## 本地运行

```bash
cd admin
npm install
npm run dev      # http://localhost:5174
npm run build    # 类型检查 + 生产构建
```

## 数据模式：Mock / Supabase 自动切换

`src/lib/provider.ts` 的 `getProvider()` 按环境变量决定：

| 环境变量 | 结果 |
|---|---|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` 都未设置 | **LocalMockProvider**（默认） |
| 两个都设置了 | **SupabaseProvider**（读写真实库） |

切换到 Supabase：`cp .env.example .env`，填入两个变量后重启 dev server。
**真实 secret 永远不要提交到 git**（`.env` 已在 `.gitignore`）。

## Mock 模式说明

- 数据持久化在浏览器 `localStorage`，key 为 `kyoto-admin-mock-v1`；种子是 6 款真实产品数据（含库存、ledger、审计、订单、AI 任务）。
- 内置登录账号（**密码统一 `kyoto123`，仅本地演示用**）：
  - `owner@kyoto.local` — 店主：全部权限
  - `admin@kyoto.local` — 管理员：可发布、可看处方
  - `staff@kyoto.local` — 店员：**不可发布、不可看处方**
- staff 的 publish 限制双重 enforced：UI 隐藏发布按钮 + provider 层抛 `PublishForbiddenError` 拒绝。
- 「设置」页可一键把 Mock 数据重置回种子。

## 功能地图（路由）

| 路由 | 视图文件 | 状态 |
|---|---|---|
| `/login` | `src/views/Login.vue` | ✅ 本专员 |
| `/` | `src/views/Dashboard.vue` | ✅ 本专员 |
| `/products` `/products/new` `/products/:id` | `Products.vue` / `ProductEditor.vue` | ✅ 本专员 |
| `/inventory` | `Inventory.vue` | ✅ 本专员 |
| `/audit` | `AuditLog.vue` | ✅ 本专员 |
| `/settings` | `Settings.vue` | ✅ 本专员 |
| `/upload` | `BatchUpload.vue` | 由其他专员开发 |
| `/import` | `Import.vue` | 由其他专员开发 |
| `/review` | `Review.vue` | 由其他专员开发 |
| `/ai-studio` | `AIStudio.vue` | 由其他专员开发 |
| `/orders` | `Orders.vue` | 由其他专员开发 |
| `/prescriptions` | `Prescriptions.vue` | 由其他专员开发（需处方权限） |
| `/customers` | `Customers.vue` | 由其他专员开发 |
| `/promotions` | `Promotions.vue` | 由其他专员开发 |

路由用 `import.meta.glob('./views/*.vue')` 懒加载：上表"其他专员"的文件一旦提交即被自动加载，
提交前访问会显示"建设中"占位（`_UnderConstruction.vue`），无需改路由。

### 给视图专员的约定

- `/products/new` 与 `/products/:id` 共用 `ProductEditor.vue`，用 `route.params.id` 区分（`'new'` = 新建）。
- `/upload?mode=camera` 表示从手机拍照入口进入；拍照选中的文件会暂存在 `sessionStorage['kyoto-capture-pending']`
 （`[{ name, dataUrl }]`），BatchUpload 视图负责读取并清空。
- 所有视图通过 `getProvider()` 拿 DbProvider，用 `useSessionStore()` 拿登录态；
  角色 helper（`isOwner/isAdmin/canPublish/canAccessPrescriptions`）在 `src/lib/auth.ts`。
- **铁律**：不许改价/编价（价格只按业务既有数值维护，改价写审计）；
  staff 不许 publish（UI 隐藏 + provider 层拒绝）；
  `cost / supplier / internalNotes / aiMeta` 等内部字段绝不进入顾客端（只用 `toCustomerProduct` 映射）。

## 移动端

手机优先：底部导航、Quick Actions 置顶、产品列表变卡片、批量操作栏固定在底部
（含 `env(safe-area-inset-bottom)` 适配刘海屏）。拍照入口使用
`<input type="file" accept="image/*" capture="environment">`（Dashboard 与产品列表页）。
