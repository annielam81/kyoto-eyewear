-- KYOTO 后台系统 · 0001 建表
-- 唯一事实来源: supabase/kyoto.ts（表结构必须与其中的 Row 接口一致）
-- 命名约定: DB 用 snake_case；TS 契约用 camelCase，映射时注意对应。

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- 通用 updated_at 触发器
-- ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------
-- profiles: 后台用户档案（id = auth.users.id）
-- ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('owner', 'admin', 'staff')),
  -- Publish 独立权限；处方访问独立权限（见 kyoto.ts AdminProfile）
  can_publish boolean not null default false,
  can_access_prescriptions boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- products: 商品（内部字段 cost / supplier / internal_notes / ai_meta 永远不进顾客 DTO）
-- ------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique,          -- 顾客端 id（现有 6 款 = 静态数据的 id）
  sku text not null unique,
  slug text not null unique,
  name jsonb not null,                     -- LocalizedText {en-US,zh-CN,es-US}
  collection_name text not null,
  name_zh text not null,
  series text not null check (series in ('essential', 'signature', 'atelier')),
  category text not null check (category in ('optical', 'sun')),
  shape text not null,
  colors jsonb not null default '[]',      -- ProductColor[]
  material jsonb not null,                 -- LocalizedText
  sizes jsonb not null default '[]',       -- ProductSize[]
  default_size text not null,
  measurements jsonb not null default '{}', -- ProductMeasurements
  art text,                                -- try-on 线稿 key，可空
  tint text,
  description jsonb not null,              -- LocalizedText
  fit jsonb not null,                      -- LocalizedText
  tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'needs_review', 'ready', 'published', 'archived')),
  regular_price numeric(10, 2) not null,
  launch_price numeric(10, 2),
  prescription_compatible boolean not null default false,
  rx_range text not null default '',
  available_lens_materials text[] not null default '{}',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  best_seller boolean not null default false,
  fsa_eligible boolean not null default false,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  provenance jsonb not null default '{}',  -- { fieldName: FieldMeta }
  -- 内部字段：绝不进顾客 DTO
  cost numeric(10, 2),
  supplier text,
  internal_notes text,
  ai_meta jsonb,
  seo jsonb,
  published_at timestamptz,
  created_by uuid,
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index idx_products_status on public.products (status);
create index idx_products_series on public.products (series);
create index idx_products_category on public.products (category);
create index idx_products_slug on public.products (slug);
create index idx_products_legacy_id on public.products (legacy_id);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- product_images: 商品图片（original = 原图，顾客端永远不可见）
-- ------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('original', 'cleaned', 'marketing', 'thumb')),
  role text not null default 'other'
    check (role in ('front', 'angle45', 'side', 'temple', 'other')),
  storage_path text not null,
  public_url text,
  width integer,
  height integer,
  bytes bigint,
  -- marketing 图必须为 true 并在 UI 打标 AI GENERATED MARKETING IMAGE
  ai_generated boolean not null default false,
  provenance text not null default 'MANUAL'
    check (provenance in ('VERIFIED', 'IMPORTED', 'MANUAL', 'AI_SUGGESTED', 'OCR_DETECTED', 'NEEDS_REVIEW')),
  created_at timestamptz not null default now()
);

create index idx_product_images_product on public.product_images (product_id);
create index idx_product_images_kind on public.product_images (kind);

-- ------------------------------------------------------------------
-- inventory: 库存（available = on_hand - reserved，派生，不许单独存）
-- ------------------------------------------------------------------
create table public.inventory (
  product_id uuid primary key references public.products (id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- inventory_ledger: 库存变动台账
-- ------------------------------------------------------------------
create table public.inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  before_qty integer not null,
  change integer not null,
  after_qty integer not null,
  reason text not null,
  actor uuid,
  created_at timestamptz not null default now()
);

create index idx_inventory_ledger_product on public.inventory_ledger (product_id, created_at desc);

-- ------------------------------------------------------------------
-- ai_jobs: AI 任务（结果必须落库，不许每次重新算）
-- ------------------------------------------------------------------
create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    check (kind in ('frame_analysis', 'image_process', 'temple_ocr', 'content_generate', 'translate', 'batch_import')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'needs_review', 'error')),
  product_ids uuid[] not null default '{}',
  input jsonb not null default '{}',
  result jsonb,
  provider text not null default '',
  usage jsonb,
  error text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index idx_ai_jobs_status on public.ai_jobs (status);

-- ------------------------------------------------------------------
-- audit_log: 审计日志（只追加，应用层不提供删除接口）
-- ------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_entity on public.audit_log (entity, entity_id, created_at desc);
create index idx_audit_log_actor on public.audit_log (actor, created_at desc);

-- ------------------------------------------------------------------
-- supplier_templates: 供应商表格列映射模板
-- ------------------------------------------------------------------
create table public.supplier_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  mapping jsonb not null default '{}',   -- { supplierColumnName: 'sku'|'color'|...|'ignore' }
  created_by uuid,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- customers: 顾客（id = 顾客 auth 用户 id，用于 RLS 本人读自己）
-- ------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  addresses jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- orders: 订单
-- ------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'prescription_review', 'processing', 'lab', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded')),
  items jsonb not null default '[]',
  prescription jsonb,
  lens jsonb,
  amounts jsonb,                           -- { subtotal, shipping, tax, total }
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_orders_customer on public.orders (customer_id, created_at desc);
create index idx_orders_status on public.orders (status);

-- ------------------------------------------------------------------
-- prescriptions: 处方（敏感数据，RLS 严格限制）
-- ------------------------------------------------------------------
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  od jsonb,
  os jsonb,
  pd text,
  method text not null default '',
  image_path text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_prescriptions_customer on public.prescriptions (customer_id);
create index idx_prescriptions_order on public.prescriptions (order_id);

-- ------------------------------------------------------------------
-- promotions: 促销
-- ------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'ended')),
  eligible jsonb not null default '{}',   -- { collections?: FrameSeries[]; productIds?: string[] }
  display_label jsonb not null default '{}' -- LocalizedText
);
