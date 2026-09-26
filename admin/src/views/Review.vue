<!--
admin/src/views/Review.vue — Batch Review：一行一款。
列：照片 / SKU / 名称 / shape / 颜色 / 材质 / 系列 / 价格 / 库存 / warnings。
inline edit；Approve Selected（→ready）；Publish Selected（→published，需 canPublish）。
AI 永远只建 Draft；本文件不包含任何自动发布路径——发布只能由用户
显式点击触发，且需 profile.canPublish。
图片管线：original 永久保留（查看/下载/恢复）；cleaned 只做去背/裁剪/居中/标准化
（mock 原图占位+标注）；marketing 图必须打标 "AI GENERATED MARKETING IMAGE"。
约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch} from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import { PROVENANCE_LABEL} from '@/lib/ai';
import type { InventoryRow, ProductRow} from '../../../supabase/kyoto';

type Tab = 'draft' | 'needs_review' | 'ready' | 'all';

interface RowVM {
product: ProductRow;
thumb: string | null;
inventory: InventoryRow | null;
warnings: string[];
}

const tab = ref<Tab>('draft');
const search = ref('');
const rows = ref<RowVM[]>([]);
const loading = ref(false);
const selected = ref<Set<string>>(new Set());
const err = ref('');
const canPublish = ref(false);
const actor = ref('admin');

const TABS: { key: Tab; label: string}[] = [
{ key: 'draft', label: '草稿'},
{ key: 'needs_review', label: '待审核'},
{ key: 'ready', label: '就绪'},
{ key: 'all', label: '全部'},
];

const allSelected = computed(
() => rows.value.length > 0 && rows.value.every((r) => selected.value.has(r.product.id)),
);

function toggleAll() {
if (allSelected.value) selected.value.clear();
else rows.value.forEach((r) => selected.value.add(r.product.id));
}

function computeWarnings(p: ProductRow, inv: InventoryRow | null, hasImage: boolean): string[] {
const w: string[] = [];
if (!hasImage) w.push('无图片');
if (!p.sku) w.push('缺少 SKU');
if (!p.regularPrice || p.regularPrice <= 0) w.push('未定价');
if (!p.shape) w.push('缺少 shape');
if (!p.material ||!p.material['en-US']) w.push('缺少材质');
const prov = p.provenance?? {};
for (const [field, meta] of Object.entries(prov)) {
if ((meta.provenance === 'AI_SUGGESTED' || meta.provenance === 'OCR_DETECTED') &&!meta.confirmedBy) {
w.push(`${field} 为${PROVENANCE_LABEL[meta.provenance]}未确认`);
}
}
if (inv && inv.onHand - inv.reserved <= 0) w.push('库存为 0');
return w;
}

async function load() {
loading.value = true;
err.value = '';
try {
const session = await db.getSession();
actor.value = session?.userId?? 'admin';
canPublish.value =!!session?.profile?.canPublish;

const params = {
status: tab.value === 'all'? ('' as const): tab.value,
search: search.value.trim() || undefined,
pageSize: 50,
};
const { items} = await db.listProducts(params);
const vms: RowVM[] = await Promise.all(
items.map(async (p) => {
const [images, inv] = await Promise.all([
db.listImages(p.id).catch(() => []),
db.getInventory(p.id).catch(() => null),
]);
const first = images.find((i) => i.kind === 'original')?? images[0];
return {
product: p,
thumb: first?.publicUrl?? null,
inventory: inv,
warnings: computeWarnings(p, inv,!!first),
};
}),
);
rows.value = vms;
selected.value.clear();
} catch (e) {
err.value = e instanceof Error? e.message: '加载失败';
} finally {
loading.value = false;
}
}

/** inline edit：单个字段即时保存（模板里不许写 `as` 断言，统一走这几个 handler） */
async function saveField(vm: RowVM, patch: Partial<ProductRow>) {
try {
const updated = await db.updateProduct(vm.product.id, patch, actor.value);
vm.product = updated;
vm.warnings = computeWarnings(updated, vm.inventory,!!vm.thumb);
} catch (e) {
err.value = e instanceof Error? e.message: '保存失败';
}
}

function onSkuChange(vm: RowVM, e: Event) {
  saveField(vm, { sku: (e.target as HTMLInputElement).value });
}
function onNameChange(vm: RowVM, e: Event) {
  saveField(vm, { name: { ...vm.product.name, 'zh-CN': (e.target as HTMLInputElement).value } });
}
function onShapeChange(vm: RowVM, e: Event) {
  saveField(vm, { shape: (e.target as HTMLInputElement).value });
}
function onSeriesChange(vm: RowVM, e: Event) {
  saveField(vm, { series: (e.target as HTMLSelectElement).value as ProductRow['series'] });
}
function onPriceChange(vm: RowVM, e: Event) {
  saveField(vm, { regularPrice: parseFloat((e.target as HTMLInputElement).value) || 0 });
}

/** Approve：draft/needs_review → ready（用户显式点击） */
async function approveSelected() {
const ids = [...selected.value];
if (ids.length === 0) return;
try {
await db.bulkSetStatus(ids, 'ready', actor.value);
await load();
} catch (e) {
err.value = e instanceof Error? e.message: 'Approve 失败';
}
}

/**
* Publish：→ published。仅用户显式点击 + canPublish。
* 注意：代码里没有任何自动 publish 的路径（AI 只建 Draft）。
*/
async function publishSelected() {
if (!canPublish.value) {
err.value = '当前账号没有发布权限（canPublish=false）';
return;
}
const ids = [...selected.value];
if (ids.length === 0) return;
if (!confirm(`确认发布 ${ids.length} 款商品？发布后顾客端可见。`)) return;
try {
await db.bulkSetStatus(ids, 'published', actor.value);
await load();
} catch (e) {
err.value = e instanceof Error? e.message: 'Publish 失败';
}
}

async function archiveOne(vm: RowVM) {
if (!confirm(`归档 ${vm.product.sku || vm.product.id}？`)) return;
try {
await db.archiveProduct(vm.product.id, actor.value);
await load();
} catch (e) {
err.value = e instanceof Error? e.message: '归档失败';
}
}

function colorDots(p: ProductRow): string {
return p.colors.map((c) => c.name['zh-CN'] || c.name['en-US']).join(' / ') || '—';
}
function fmtPrice(p: ProductRow): string {
const r = p.regularPrice? `$${p.regularPrice.toFixed(2)}`: '未定价';
const l = p.launchPrice? ` / launch $${p.launchPrice.toFixed(2)}`: '';
return r + l;
}
function stockOf(vm: RowVM): string {
if (!vm.inventory) return '—';
return String(vm.inventory.onHand - vm.inventory.reserved);
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
if (searchTimer) clearTimeout(searchTimer);
searchTimer = setTimeout(load, 400);
});
watch(tab, load);

onMounted(load);
</script>

<template>
<div class="rv">
<header class="top">
<div>
<h2>Review 审核上架</h2>
<p class="muted">AI 只建 Draft；发布必须人工点选{{
canPublish? '': '（你当前无发布权限）'
}}。</p>
</div>
<input v-model="search" class="search" placeholder="搜索 SKU / 名称…" />
</header>

<nav class="tabs">
<button
v-for="t in TABS"
:key="t.key"
:class="{ active: tab === t.key}"
@click="tab = t.key"
>
{{ t.label}}
</button>
</nav>

<p v-if="err" class="err">{{ err}}</p>
<p v-if="loading" class="muted">加载中…</p>
<p v-if="!loading && rows.length === 0" class="empty">
暂无商品。去「拍照上架 / 批量上传 / 供应商导入」创建 Draft。
</p>

<!-- 桌面：dense table -->
<table v-if="rows.length" class="dense desktop-only">
<thead>
<tr>
<th><input type="checkbox":checked="allSelected" @change="toggleAll" /></th>
<th>照片</th>
<th>SKU</th>
<th>名称</th>
<th>Shape</th>
<th>颜色</th>
<th>材质</th>
<th>系列</th>
<th>价格</th>
<th>库存</th>
<th>Warnings</th>
<th></th>
</tr>
</thead>
<tbody>
<tr v-for="vm in rows":key="vm.product.id":class="{ warn: vm.warnings.length > 0}">
<td><input type="checkbox":checked="selected.has(vm.product.id)" @change="selected.has(vm.product.id)? selected.delete(vm.product.id): selected.add(vm.product.id)" /></td>
<td>
<img v-if="vm.thumb":src="vm.thumb" class="thumb" alt="" />
<span v-else class="muted">无图</span>
</td>
<td>
<input
class="cell-input mono"
:value="vm.product.sku"
@change="onSkuChange(vm, $event)"
/>
</td>
<td>
<input
class="cell-input"
:value="vm.product.name['zh-CN'] || vm.product.name['en-US']"
placeholder="名称（中文）"
@change="onNameChange(vm, $event)"
/>
</td>
<td>
<input
class="cell-input sm"
:value="vm.product.shape"
@change="onShapeChange(vm, $event)"
/>
</td>
<td class="muted">{{ colorDots(vm.product)}}</td>
<td class="muted">{{ vm.product.material?.['zh-CN'] || vm.product.material?.['en-US'] || '—'}}</td>
<td>
<select
:value="vm.product.series"
@change="onSeriesChange(vm, $event)"
>
<option value="essential">essential</option>
<option value="signature">signature</option>
<option value="atelier">atelier</option>
</select>
</td>
<td>
<input
class="cell-input sm"
type="number"
step="0.01"
:value="vm.product.regularPrice || ''"
placeholder="定价"
@change="onPriceChange(vm, $event)"
/>
</td>
<td>{{ stockOf(vm)}}</td>
<td>
<ul v-if="vm.warnings.length" class="warns">
<li v-for="w in vm.warnings":key="w">{{ w}}</li>
</ul>
<span v-else class="ok">✓</span>
</td>
<td><button class="btn xs" @click="archiveOne(vm)">归档</button></td>
</tr>
</tbody>
</table>

<!-- 手机：cards -->
<ul class="cards mobile-only">
<li v-for="vm in rows":key="vm.product.id" class="card":class="{ warn: vm.warnings.length > 0}">
<label class="sel">
<input type="checkbox":checked="selected.has(vm.product.id)" @change="selected.has(vm.product.id)? selected.delete(vm.product.id): selected.add(vm.product.id)" />
</label>
<img v-if="vm.thumb":src="vm.thumb" class="cthumb" alt="" />
<div class="cbody">
<p class="csku mono">{{ vm.product.sku || '（无 SKU）'}}</p>
<input
class="cell-input"
:value="vm.product.name['zh-CN'] || vm.product.name['en-US']"
placeholder="名称"
@change="onNameChange(vm, $event)"
/>
<p class="muted">
{{ vm.product.shape || '—'}} · {{ colorDots(vm.product)}} ·
{{ vm.product.series}} · {{ fmtPrice(vm.product)}} · 库存 {{ stockOf(vm)}}
</p>
<ul v-if="vm.warnings.length" class="warns">
<li v-for="w in vm.warnings":key="w">{{ w}}</li>
</ul>
</div>
</li>
</ul>

<!-- 底部动作栏 -->
<footer class="actionbar">
<span class="muted">已选 {{ selected.size}} 款</span>
<button class="btn primary":disabled="selected.size === 0" @click="approveSelected">
Approve Selected → ready
</button>
<button
class="btn danger"
:disabled="selected.size === 0 ||!canPublish"
:title="canPublish? '发布到顾客端': '无发布权限'"
@click="publishSelected"
>
Publish Selected → published
</button>
</footer>

<aside class="pipeline-note">
<strong>图片管线说明</strong>：original 永久保留（查看 / 下载 / 恢复）；
cleaned 只做去背 / 裁剪 / 居中 / 标准化（mock 阶段用原图占位并标注）；
marketing 图必须打标 <code>AI GENERATED MARKETING IMAGE</code>。
</aside>
</div>
</template>

<style scoped>
.rv { max-width: 1280px; margin: 0 auto; padding: 16px;}
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;}
.muted { color: #777; font-size: 13px;}
.search { padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; min-width: 220px;}
.tabs { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap;}
.tabs button { border: 1px solid #ddd; background: #fff; border-radius: 20px; padding: 6px 14px; cursor: pointer; font-size: 14px;}
.tabs button.active { background: #1a2936; color: #fff; border-color: #1a2936;}
.err { color: #c62828;}
.empty { padding: 32px; text-align: center; color: #888; border: 1px dashed #ccc; border-radius: 12px;}
table.dense { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff;}
table.dense th, table.dense td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; vertical-align: middle;}
table.dense thead th { background: #faf7f2; font-weight: 700;}
tr.warn td { background: #fffdf5;}
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;}
.cell-input { border: 1px solid transparent; border-radius: 6px; padding: 6px; font-size: 13px; width: 100%; max-width: 180px;}
.cell-input:hover,.cell-input:focus { border-color: #bbb; outline: none; background: #fffbe8;}
.cell-input.sm { max-width: 90px;}
.cell-input.mono,.mono { font-family: ui-monospace, monospace;}
select { padding: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px;}
.warns { margin: 0; padding-left: 16px; color: #b26a00; font-size: 12px;}
.ok { color: #2e7d32;}
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer;}
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936;}
.btn.danger { background: #b83227; color: #fff; border-color: #b83227;}
.btn.xs { padding: 4px 8px; font-size: 12px;}
.btn:disabled { opacity: 0.45; cursor: not-allowed;}
.cards { list-style: none; padding: 0; display: grid; gap: 10px;}
.card { display: flex; gap: 10px; border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px; background: #fff; position: relative;}
.card.warn { border-color: #f0c36d;}
.sel { position: absolute; top: 8px; right: 8px;}
.cthumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; flex-shrink: 0;}
.cbody { flex: 1; min-width: 0;}
.csku { font-size: 12px; margin: 0 0 4px;}
.actionbar {
display: flex; gap: 10px; align-items: center; margin-top: 16px; padding: 12px;
background: #faf7f2; border-radius: 10px; flex-wrap: wrap;
}
.pipeline-note { margin-top: 16px; font-size: 12px; color: #666; background: #faf7f2; border: 1px dashed #ccc; border-radius: 8px; padding: 10px 14px;}
.pipeline-note code { background: #eee; padding: 1px 4px; border-radius: 4px;}
.desktop-only { display: table;}
.mobile-only { display: none;}
@media (max-width: 768px) {
.desktop-only { display: none;}
.mobile-only { display: grid;}
.actionbar { position: sticky; bottom: 0; border-top: 1px solid #ddd;}
.actionbar.btn { flex: 1;}
}
</style>
