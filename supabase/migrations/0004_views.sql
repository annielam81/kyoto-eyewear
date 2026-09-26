-- KYOTO 后台系统 · 0004 顾客安全视图
--
-- api_published_products：顾客端唯一允许直连的数据源（配合 anon key）。
--  - 只含 status='published' 的商品
--  - 只含顾客字段：cost / supplier / internal_notes / ai_meta / audit 永远不出镜
--  - 库存只暴露 in_stock / low_stock 两个布尔，不暴露 on_hand / reserved 精确数
--
-- 说明：视图默认以所有者权限执行（security_invoker=false），内部 LEFT JOIN
-- inventory 时不会把 inventory 表的精确数字泄露给 anon；对外只输出两个 bool。

create or replace view public.api_published_products as
select
  p.legacy_id              as id,          -- 顾客端唯一键 = 静态数据 id
  p.sku,
  p.slug,
  p.name,
  p.collection_name,
  p.name_zh,
  p.series,
  coalesce(p.launch_price, p.regular_price) as price,  -- 顾客实际看到的价格
  p.launch_price,
  p.regular_price,
  p.category,
  p.shape,
  p.material,
  p.colors,
  p.sizes,
  p.default_size,
  p.art,
  p.description,
  p.fit,
  p.tags,
  p.prescription_compatible,
  p.rx_range,
  p.available_lens_materials,
  p.featured,
  p.new_arrival,
  p.best_seller,
  p.fsa_eligible,
  p.rating,
  p.review_count,
  coalesce((i.on_hand - i.reserved) > 0, false) as in_stock,
  coalesce(
    (i.on_hand - i.reserved) > 0
    and (i.on_hand - i.reserved) <= i.low_stock_threshold,
    false
  ) as low_stock
from public.products p
left join public.inventory i on i.product_id = p.id
where p.status = 'published';

-- 顾客端（anon / 登录顾客）可读视图
grant select on public.api_published_products to anon, authenticated;
