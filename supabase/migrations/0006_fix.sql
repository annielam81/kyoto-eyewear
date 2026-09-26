-- KYOTO 后台系统 · 0006 补 staff 实际工作流权限
-- 背景：0002 只给了 staff products 的 draft/needs_review/ready 写权限和 product_images 的读权限，
--   但 Admin 实际工作流还需要：上传/删改图片、写四个 Storage bucket、建 AI 任务、写审计日志。
-- 原则：幂等（DROP IF EXISTS + CREATE）；不扩大 publish（staff 仍不能 publish）、
--   不放开 prescriptions / customers / orders 等敏感数据。
-- 运行：在 Supabase SQL Editor 直接执行即可，可重复执行。

-- ==================================================================
-- 1. product_images：staff 可 INSERT / UPDATE / DELETE
-- ==================================================================
drop policy if exists product_images_staff_insert on public.product_images;
create policy product_images_staff_insert
  on public.product_images for insert to authenticated
  with check (public.is_staff_role());

drop policy if exists product_images_staff_update on public.product_images;
create policy product_images_staff_update
  on public.product_images for update to authenticated
  using (public.is_staff_role())
  with check (public.is_staff_role());

drop policy if exists product_images_staff_delete on public.product_images;
create policy product_images_staff_delete
  on public.product_images for delete to authenticated
  using (public.is_staff_role());

-- ==================================================================
-- 2. storage.objects：staff 可写四个图片 bucket；可读 kyoto-original（后台原图预览用签名 URL）
-- ==================================================================
drop policy if exists storage_staff_insert on storage.objects;
create policy storage_staff_insert
  on storage.objects for insert to authenticated
  with check (
    public.is_staff_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

drop policy if exists storage_staff_update on storage.objects;
create policy storage_staff_update
  on storage.objects for update to authenticated
  using (
    public.is_staff_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  )
  with check (
    public.is_staff_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

drop policy if exists storage_staff_delete on storage.objects;
create policy storage_staff_delete
  on storage.objects for delete to authenticated
  using (
    public.is_staff_role()
    and bucket_id in ('kyoto-original', 'kyoto-cleaned', 'kyoto-marketing', 'kyoto-thumbs')
  );

-- staff 读 kyoto-original（private bucket）：仅为后台生成签名预览 URL，不向顾客端暴露
drop policy if exists storage_staff_read_original on storage.objects;
create policy storage_staff_read_original
  on storage.objects for select to authenticated
  using (
    public.is_staff_role()
    and bucket_id = 'kyoto-original'
  );

-- ==================================================================
-- 3. ai_jobs：staff 可建任务、可看、可更新自己建的任务
-- ==================================================================
drop policy if exists ai_jobs_staff_select on public.ai_jobs;
create policy ai_jobs_staff_select
  on public.ai_jobs for select to authenticated
  using (public.is_staff_role());

drop policy if exists ai_jobs_staff_insert on public.ai_jobs;
create policy ai_jobs_staff_insert
  on public.ai_jobs for insert to authenticated
  with check (public.is_staff_role());

drop policy if exists ai_jobs_staff_update_own on public.ai_jobs;
create policy ai_jobs_staff_update_own
  on public.ai_jobs for update to authenticated
  using (public.is_staff_role() and created_by = auth.uid())
  with check (public.is_staff_role() and created_by = auth.uid());

-- ==================================================================
-- 4. audit_log：staff 可 INSERT（自己的操作被审计），读仍只有 admin
-- ==================================================================
drop policy if exists audit_log_staff_insert on public.audit_log;
create policy audit_log_staff_insert
  on public.audit_log for insert to authenticated
  with check (public.is_staff_role());
