-- KYOTO 后台系统 · 0003 Storage buckets + storage.objects 策略
-- buckets: kyoto-original（private，原图，顾客端永远不可见）
--          kyoto-cleaned / kyoto-marketing / kyoto-thumbs（public）

-- ------------------------------------------------------------------
-- buckets（幂等：已存在则更新 public 标记）
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('kyoto-original',  'kyoto-original',  false),
  ('kyoto-cleaned',   'kyoto-cleaned',   true),
  ('kyoto-marketing', 'kyoto-marketing', true),
  ('kyoto-thumbs',    'kyoto-thumbs',    true)
on conflict (id) do update
  set public = excluded.public;

-- ------------------------------------------------------------------
-- storage.objects 策略
--   public bucket: anon / 登录用户可读
--   全部 bucket: 只有 admin 角色（owner/admin）可写（insert/update/delete）
--   kyoto-original 为 private: 只有 admin 可读
-- ------------------------------------------------------------------

-- public buckets 读（anon）
create policy storage_anon_public_read
  on storage.objects for select to anon
  using (bucket_id in ('kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs'));

-- public buckets 读（登录用户）
create policy storage_customer_public_read
  on storage.objects for select to authenticated
  using (bucket_id in ('kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs'));

-- admin 读全部 buckets（含 kyoto-original）
create policy storage_admin_read
  on storage.objects for select to authenticated
  using (
    public.is_admin_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

-- admin 写全部 buckets
create policy storage_admin_insert
  on storage.objects for insert to authenticated
  with check (
    public.is_admin_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

create policy storage_admin_update
  on storage.objects for update to authenticated
  using (
    public.is_admin_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  )
  with check (
    public.is_admin_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

create policy storage_admin_delete
  on storage.objects for delete to authenticated
  using (
    public.is_admin_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );
