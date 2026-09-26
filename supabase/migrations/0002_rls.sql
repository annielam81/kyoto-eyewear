-- KYOTO 后台系统 · 0002 RLS 策略
-- 角色: anon（顾客端，未登录）/ authenticated（登录用户）/ profiles.role = owner|admin|staff

-- ------------------------------------------------------------------
-- helper: 是否 admin 角色（owner/admin）。SECURITY DEFINER 避免自递归 RLS。
-- ------------------------------------------------------------------
create or replace function public.is_admin_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('owner', 'admin')
  );
$$;

-- staff 判定（SECURITY DEFINER，同理）
create or replace function public.is_staff_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  );
$$;

-- ==================================================================
-- profiles：本人读自己 + admin 读全表
-- ==================================================================
alter table public.profiles enable row level security;

create policy profiles_select_self
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy profiles_select_admin
  on public.profiles for select to authenticated
  using (public.is_admin_role());

create policy profiles_admin_write
  on public.profiles for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- ==================================================================
-- products
--   anon: 只能 SELECT status='published'
--   owner/admin: 全权
--   staff: 可读全表；可 INSERT/UPDATE，但新 status 只能是 draft/needs_review/ready（不许 staff publish）
-- ==================================================================
alter table public.products enable row level security;

create policy products_anon_published
  on public.products for select to anon
  using (status = 'published');

create policy products_customer_published
  on public.products for select to authenticated
  using (status = 'published');

create policy products_admin_all
  on public.products for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy products_staff_select
  on public.products for select to authenticated
  using (public.is_staff_role());

create policy products_staff_insert
  on public.products for insert to authenticated
  with check (
    public.is_staff_role()
    and status in ('draft', 'needs_review', 'ready')
  );

create policy products_staff_update
  on public.products for update to authenticated
  using (public.is_staff_role())
  with check (
    public.is_staff_role()
    and status in ('draft', 'needs_review', 'ready')
  );

-- ==================================================================
-- product_images
--   anon: 只能读 kind<>'original' 且所属产品已 published 的图
--   登录顾客: 同 anon 范围
--   staff: 读全表；admin: 全权
-- ==================================================================
alter table public.product_images enable row level security;

create policy product_images_anon_published
  on public.product_images for select to anon
  using (
    kind <> 'original'
    and exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );

create policy product_images_customer_published
  on public.product_images for select to authenticated
  using (
    kind <> 'original'
    and exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );

create policy product_images_staff_select
  on public.product_images for select to authenticated
  using (public.is_staff_role());

create policy product_images_admin_all
  on public.product_images for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- ==================================================================
-- 仅 admin 角色：inventory / inventory_ledger / ai_jobs / audit_log / supplier_templates
-- ==================================================================
alter table public.inventory enable row level security;
alter table public.inventory_ledger enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.audit_log enable row level security;
alter table public.supplier_templates enable row level security;

create policy inventory_admin_all
  on public.inventory for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy inventory_ledger_admin_all
  on public.inventory_ledger for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy ai_jobs_admin_all
  on public.ai_jobs for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy audit_log_admin_all
  on public.audit_log for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy supplier_templates_admin_all
  on public.supplier_templates for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- ==================================================================
-- customers / orders / prescriptions：本人读自己 + admin 全权
-- ==================================================================
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.prescriptions enable row level security;

create policy customers_self_select
  on public.customers for select to authenticated
  using (id = auth.uid());

create policy customers_admin_all
  on public.customers for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy orders_self_select
  on public.orders for select to authenticated
  using (customer_id = auth.uid());

create policy orders_admin_all
  on public.orders for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

create policy prescriptions_self_select
  on public.prescriptions for select to authenticated
  using (customer_id = auth.uid());

create policy prescriptions_admin_all
  on public.prescriptions for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- ==================================================================
-- promotions
--   anon/顾客: 只能读 status='active'
--   admin: 全权；staff: 读全表
-- ==================================================================
alter table public.promotions enable row level security;

create policy promotions_anon_active
  on public.promotions for select to anon
  using (status = 'active');

create policy promotions_customer_active
  on public.promotions for select to authenticated
  using (status = 'active');

create policy promotions_staff_select
  on public.promotions for select to authenticated
  using (public.is_staff_role());

create policy promotions_admin_all
  on public.promotions for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());
