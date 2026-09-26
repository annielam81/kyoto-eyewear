-- KYOTO 后台系统 · 0005 种子数据：6 款现有产品迁移
--
-- 数据照抄 src/services/ProductService.ts（FRAMES），价格体系照抄
-- src/config/pricing.config.ts（essential regular 89.99 / launch 79.99；
-- signature 129.99；atelier 189.99）。任何人不许另发明价格。
-- status 全部 'published'（太阳镜的顾客端隐藏由 launch-availability 开关控制，DB 保持 published）。
-- provenance 全字段 VERIFIED，并注明 migrated from static catalog。
-- inventory：每款 on_hand=50、reserved=0、threshold=5。

-- 固定 UUID，保证 seed 可复跑、inventory/ledger 能关联
--   arashiyama 75530b60-6a59-4c42-ab13-f1843672489c
--   gion       8c91036c-a17b-4815-ab28-5d92daf78ed5
--   tsukimi    556f6102-baa9-45f1-9f5b-aa2fdc36a66a
--   tasogare   a910d717-7cc5-4a1d-b35b-bcad4cba7c8f
--   kamo       5a0eddce-c926-42d0-bf53-91e8678f9524
--   fushimi    09ba7999-1798-499b-b30e-25c5b82da9af

-- 全字段 VERIFIED 的 provenance 构造器（key 用 kyoto.ts 的 camelCase 字段名）
create or replace function public.seed_verified_provenance()
returns jsonb
language sql
immutable
as $$
  select
    jsonb_object_agg(f, '{"provenance":"VERIFIED","confidence":"high"}'::jsonb)
    || '{"migration":{"provenance":"VERIFIED","confidence":"high","note":"migrated from static catalog"}}'::jsonb
  from unnest(array[
    'sku','slug','name','collectionName','nameZh','series','category','shape',
    'colors','material','sizes','defaultSize','art','tint','description','fit','tags',
    'regularPrice','launchPrice','prescriptionCompatible','rxRange','availableLensMaterials',
    'featured','newArrival','bestSeller','fsaEligible','rating','reviewCount'
  ]) as f;
$$;

-- ================= arashiyama（岚山 / signature / optical / round）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  '75530b60-6a59-4c42-ab13-f1843672489c', 'arashiyama', 'KY-AR-001', 'arashiyama',
  $$ {"en-US":"Arashiyama","zh-CN":"岚山","es-US":"Arashiyama"} $$,
  'Arashiyama', '岚山', 'signature', 'optical', 'round',
  $$ [
    {"key":"night","hex":"#0D1B2A","name":{"en-US":"Night","zh-CN":"夜空蓝","es-US":"Noche"}},
    {"key":"tortoise","hex":"#8B5A2B","name":{"en-US":"Tortoise","zh-CN":"玳瑁","es-US":"Carey"}},
    {"key":"sakura","hex":"#FF4F8B","name":{"en-US":"Sakura","zh-CN":"樱花粉","es-US":"Sakura"}},
    {"key":"teal","hex":"#0B7C6E","name":{"en-US":"Teal","zh-CN":"山水青","es-US":"Verde azulado"}}
  ] $$,
  $$ {"en-US":"Acetate","zh-CN":"板材","es-US":"Acetato"} $$,
  $$ [
    {"key":"S","lensWidth":46,"bridge":19,"temple":140},
    {"key":"M","lensWidth":49,"bridge":20,"temple":145},
    {"key":"L","lensWidth":52,"bridge":21,"temple":150}
  ] $$,
  'M', 'round', 'tint-sakura',
  $$ {"en-US":"Italian acetate, vintage round silhouette.","zh-CN":"意大利板材,复古圆框。","es-US":"Acetato italiano, silueta redonda vintage."} $$,
  $$ {"en-US":"Medium fit · suits oval, round and square faces. The keyhole bridge sits comfortably on low-to-medium nose bridges.","zh-CN":"中号版型 · 适合鹅蛋脸、圆脸与方脸。锁孔鼻梁对低中鼻梁也很友好。","es-US":"Ajuste medio · va bien con rostros ovalados, redondos y cuadrados. El puente tipo keyhole es cómodo para puentes nasales bajos y medios."} $$,
  array['bestseller'],
  'published', 129.99, null,
  true, 'SPH −10.00 to +6.00 · CYL to −4.00',
  array['std150','poly','hi160','hi167','hi174'],
  true, false, true, true, 4.8, 128,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= gion（祇园 / atelier / optical / square）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  '8c91036c-a17b-4815-ab28-5d92daf78ed5', 'gion', 'KY-GI-002', 'gion',
  $$ {"en-US":"Gion","zh-CN":"祇园","es-US":"Gion"} $$,
  'Gion', '祇园', 'atelier', 'optical', 'square',
  $$ [
    {"key":"gunmetal","hex":"#444444","name":{"en-US":"Gunmetal","zh-CN":"枪灰","es-US":"Gris metálico"}},
    {"key":"silver","hex":"#B8B8B8","name":{"en-US":"Silver","zh-CN":"银","es-US":"Plata"}},
    {"key":"gold","hex":"#FFC83D","name":{"en-US":"Gold","zh-CN":"金","es-US":"Dorado"}}
  ] $$,
  $$ {"en-US":"Titanium","zh-CN":"纯钛","es-US":"Titanio"} $$,
  $$ [
    {"key":"M","lensWidth":51,"bridge":18,"temple":145},
    {"key":"L","lensWidth":54,"bridge":19,"temple":150}
  ] $$,
  'M', 'square', 'tint-teal',
  $$ {"en-US":"Pure titanium, square silhouette.","zh-CN":"纯钛方框。","es-US":"Titanio puro, silueta cuadrada."} $$,
  $$ {"en-US":"Pure titanium at just 11g — all-day comfort.","zh-CN":"纯钛仅 11g,整天佩戴无压感。","es-US":"Titanio puro de solo 11 g — comodidad todo el día."} $$,
  array[]::text[],
  'published', 189.99, null,
  true, 'SPH −10.00 to +6.00 · CYL to −4.00',
  array['std150','poly','hi160','hi167','hi174'],
  false, false, false, true, 4.7, 86,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= tsukimi（月见 / signature / optical / cat-eye）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  '556f6102-baa9-45f1-9f5b-aa2fdc36a66a', 'tsukimi', 'KY-TS-003', 'tsukimi',
  $$ {"en-US":"Tsukimi","zh-CN":"月见","es-US":"Tsukimi"} $$,
  'Tsukimi', '月见', 'signature', 'optical', 'cat-eye',
  $$ [
    {"key":"amber","hex":"#8B5A2B","name":{"en-US":"Amber","zh-CN":"琥珀","es-US":"Ámbar"}},
    {"key":"night","hex":"#0D1B2A","name":{"en-US":"Night","zh-CN":"夜空蓝","es-US":"Noche"}},
    {"key":"sunset","hex":"#FF6A3D","name":{"en-US":"Sunset","zh-CN":"日出橙","es-US":"Atardecer"}}
  ] $$,
  $$ {"en-US":"Acetate","zh-CN":"板材","es-US":"Acetato"} $$,
  $$ [
    {"key":"S","lensWidth":47,"bridge":19,"temple":140},
    {"key":"M","lensWidth":50,"bridge":20,"temple":145}
  ] $$,
  'M', 'cat', 'tint-gold',
  $$ {"en-US":"Cat-eye with amber tortoise finish.","zh-CN":"琥珀玳瑁猫眼框。","es-US":"Cat-eye con acabado carey ámbar."} $$,
  $$ {"en-US":"Upswept lines with subtle lift for any face shape.","zh-CN":"上扬线条,修饰任何脸型。","es-US":"Líneas elevadas que favorecen cualquier rostro."} $$,
  array['new'],
  'published', 129.99, null,
  true, 'SPH −10.00 to +6.00 · CYL to −4.00',
  array['std150','poly','hi160','hi167','hi174'],
  false, true, false, true, 4.9, 42,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= tasogare（黄昏 / essential / sun / square）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  'a910d717-7cc5-4a1d-b35b-bcad4cba7c8f', 'tasogare', 'KY-TA-004', 'tasogare',
  $$ {"en-US":"Tasogare","zh-CN":"黄昏","es-US":"Tasogare"} $$,
  'Tasogare', '黄昏', 'essential', 'sun', 'square',
  $$ [
    {"key":"night","hex":"#0D1B2A","name":{"en-US":"Night","zh-CN":"夜空蓝","es-US":"Noche"}},
    {"key":"havana","hex":"#5A3E2B","name":{"en-US":"Havana","zh-CN":"哈瓦那棕","es-US":"Habana"}}
  ] $$,
  $$ {"en-US":"Acetate","zh-CN":"板材","es-US":"Acetato"} $$,
  $$ [
    {"key":"M","lensWidth":52,"bridge":20,"temple":145}
  ] $$,
  'M', 'sun', 'tint-sunrise',
  $$ {"en-US":"Classic shades, UV400.","zh-CN":"经典墨镜,UV400。","es-US":"Gafas clásicas, UV400."} $$,
  $$ {"en-US":"UV400 polarized-ready. Built for road trips and beach days.","zh-CN":"UV400,开车与海边通用。","es-US":"Listas para polarizado UV400. Para viajes y días de playa."} $$,
  array[]::text[],
  'published', 89.99, 79.99,
  true, 'SPH −8.00 to +4.00',
  array['std150','poly','hi160','hi167'],
  false, false, false, true, 4.6, 64,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= kamo（鸭川 / atelier / optical / round）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  '5a0eddce-c926-42d0-bf53-91e8678f9524', 'kamo', 'KY-KA-005', 'kamo',
  $$ {"en-US":"Kamo","zh-CN":"鸭川","es-US":"Kamo"} $$,
  'Kamo', '鸭川', 'atelier', 'optical', 'round',
  $$ [
    {"key":"teal","hex":"#0B7C6E","name":{"en-US":"Teal","zh-CN":"山水青","es-US":"Verde azulado"}},
    {"key":"gunmetal","hex":"#444444","name":{"en-US":"Gunmetal","zh-CN":"枪灰","es-US":"Gris metálico"}}
  ] $$,
  $$ {"en-US":"Titanium","zh-CN":"纯钛","es-US":"Titanio"} $$,
  $$ [
    {"key":"S","lensWidth":46,"bridge":20,"temple":140},
    {"key":"M","lensWidth":49,"bridge":21,"temple":145}
  ] $$,
  'M', 'round', 'tint-teal',
  $$ {"en-US":"Slim round titanium.","zh-CN":"细圆钛框。","es-US":"Titanio redondo delgado."} $$,
  $$ {"en-US":"Slim round titanium with adjustable nose pads.","zh-CN":"细圆钛框,可调鼻托。","es-US":"Titanio redondo delgado con plaquetas ajustables."} $$,
  array['new'],
  'published', 189.99, null,
  true, 'SPH −10.00 to +6.00 · CYL to −4.00',
  array['std150','poly','hi160','hi167','hi174'],
  false, true, false, true, 4.7, 31,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= fushimi（伏见 / essential / sun / aviator）=================
insert into public.products (
  id, legacy_id, sku, slug, name, collection_name, name_zh, series, category, shape,
  colors, material, sizes, default_size, art, tint, description, fit, tags,
  status, regular_price, launch_price,
  prescription_compatible, rx_range, available_lens_materials,
  featured, new_arrival, best_seller, fsa_eligible, rating, review_count,
  provenance, published_at, version
) values (
  '09ba7999-1798-499b-b30e-25c5b82da9af', 'fushimi', 'KY-FU-006', 'fushimi',
  $$ {"en-US":"Fushimi","zh-CN":"伏见","es-US":"Fushimi"} $$,
  'Fushimi', '伏见', 'essential', 'sun', 'aviator',
  $$ [
    {"key":"gold","hex":"#FFC83D","name":{"en-US":"Gold","zh-CN":"金","es-US":"Dorado"}},
    {"key":"silver","hex":"#B8B8B8","name":{"en-US":"Silver","zh-CN":"银","es-US":"Plata"}}
  ] $$,
  $$ {"en-US":"Metal","zh-CN":"金属","es-US":"Metal"} $$,
  $$ [
    {"key":"M","lensWidth":52,"bridge":19,"temple":145}
  ] $$,
  'M', 'aviator', 'tint-gold',
  $$ {"en-US":"Gold aviator sunglasses.","zh-CN":"金色飞行员太阳镜。","es-US":"Gafas de sol aviador doradas."} $$,
  $$ {"en-US":"Gold metal aviator with gradient amber lenses.","zh-CN":"金色飞行员框,渐变茶色镜片。","es-US":"Aviador dorado con lentes ámbar degradados."} $$,
  array['new'],
  'published', 89.99, 79.99,
  true, 'SPH −8.00 to +4.00',
  array['std150','poly','hi160','hi167'],
  false, true, false, true, 4.5, 23,
  public.seed_verified_provenance(), now(), 1
)
on conflict (legacy_id) do nothing;

-- ================= 库存：每款 on_hand=50、reserved=0、threshold=5 =================
insert into public.inventory (product_id, on_hand, reserved, low_stock_threshold)
select id, 50, 0, 5 from public.products
where legacy_id in ('arashiyama', 'gion', 'tsukimi', 'tasogare', 'kamo', 'fushimi')
on conflict (product_id) do nothing;

-- 库存台账：期初入库记录（可复跑，已有 seed_initial 记录则跳过）
insert into public.inventory_ledger (product_id, before_qty, change, after_qty, reason, actor)
select p.id, 0, 50, 50, 'seed_initial', null
from public.products p
where p.legacy_id in ('arashiyama', 'gion', 'tsukimi', 'tasogare', 'kamo', 'fushimi')
  and not exists (
    select 1 from public.inventory_ledger l
    where l.product_id = p.id and l.reason = 'seed_initial'
  );

-- 种子辅助函数使命完成，删掉（不留在生产库）
drop function public.seed_verified_provenance();
