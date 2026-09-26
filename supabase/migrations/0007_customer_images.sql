-- KYOTO 后台系统 · 0007 顾客端图片视图
-- api_published_product_images：顾客端按商品（legacy_id）取公开图片的唯一数据源。
--   - 只含已发布 (status='published') 商品的图片
--   - 永远不含 kind='original' 的原图（原图仅后台可见）
--   - product_id 列 = products.legacy_id，对应 api_published_products.id（顾客端唯一键）
--   - cost / supplier / internal_notes / ai_meta 等敏感字段不在本视图
-- 说明：与 0004 同理，视图默认以所有者权限执行（security_invoker=false），
--   配合 grant select 给 anon / authenticated 即可；可重复执行。

create or replace view public.api_published_product_images as
select
  p.legacy_id as product_id,
  i.kind,
  i.role,
  i.public_url
from public.product_images i
join public.products p on p.id = i.product_id
where p.status = 'published'
  and i.kind <> 'original'
  and i.public_url is not null;

grant select on public.api_published_product_images to anon, authenticated;
