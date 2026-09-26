<template>
  <div class="page" :class="{ 'has-batchbar': selected.size > 0 }">
    <div class="page-head">
      <div>
        <h1>产品管理</h1>
        <div class="sub">共 {{ total }} 款 · 批量操作优先（BATCH FIRST）</div>
      </div>
      <div class="row">
        <button class="btn desktop-only" @click="triggerCamera">📷 拍照上架</button>
        <router-link class="btn btn-primary" to="/products/new">＋ 新增产品</router-link>
      </div>
    </div>
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" multiple style="display:none" @change="onCameraFiles" />

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <input v-model="q" class="input grow" placeholder="搜索 SKU / 系列名 / 中文名…" @input="debouncedReload" />
      <select v-model="fSeries" class="select" @change="reload">
        <option value="">全部系列</option>
        <option value="essential">Essential</option>
        <option value="signature">Signature</option>
        <option value="atelier">Atelier</option>
      </select>
      <select v-model="fStatus" class="select" @change="reload">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="needs_review">待审核</option>
        <option value="ready">已就绪</option>
        <option value="published">已发布</option>
        <option value="archived">已归档</option>
      </select>
      <select v-model="fShape" class="select" @change="reload">
        <option value="">全部框型</option>
        <option v-for="s in shapes" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="sort" class="select" @change="reload">
        <option value="updated_desc">最近更新</option>
        <option value="price_asc">价格 ↑</option>
        <option value="price_desc">价格 ↓</option>
        <option value="name_asc">名称 A-Z</option>
      </select>
    </div>

    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="items.length === 0" class="empty">没有符合条件的产品</div>
    <template v-else>
      <!-- 桌面 dense table -->
      <div class="table-wrap desktop-only">
        <table class="tbl">
          <thead>
            <tr>
              <th><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
              <th>图</th>
              <th>SKU</th>
              <th>名称</th>
              <th>系列</th>
              <th>框型</th>
              <th>颜色</th>
              <th>价格</th>
              <th>库存</th>
              <th>状态</th>
              <th class="hide-m">更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.id" :class="{ selected: selected.has(p.id) }" @click="openProduct(p.id)" style="cursor:pointer">
              <td @click.stop><input type="checkbox" :checked="selected.has(p.id)" @change="toggleOne(p.id)" /></td>
              <td @click.stop><router-link :to="`/products/${p.id}`"><ProdThumb :product-id="p.id" /></router-link></td>
              <td class="mono">{{ p.sku }}</td>
              <td><strong>{{ p.collectionName }}</strong><div class="small muted">{{ p.nameZH }}</div></td>
              <td>{{ seriesLabel(p.series) }}</td>
              <td>{{ p.shape }}</td>
              <td><span class="color-dots"><span v-for="c in p.colors" :key="c.key" class="color-dot" :style="{ background: c.hex }" :title="c.key" /></span></td>
              <td class="mono">${{ effPrice(p).toFixed(2) }}<div v-if="p.launchPrice != null" class="small muted" style="text-decoration:line-through">${{ p.regularPrice.toFixed(2) }}</div></td>
              <td class="mono" :style="stockOf(p.id) <= 10 ? 'color:var(--vermilion);font-weight:700' : ''">{{ stockOf(p.id) }}</td>
              <td><span class="badge" :class="'st-' + p.status">{{ statusLabel(p.status) }}</span></td>
              <td class="hide-m small muted">{{ fmtTime(p.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 手机 cards -->
      <div class="mobile-cards" style="display:grid; gap:10px">
        <div v-for="p in items" :key="p.id" class="card" :style="selected.has(p.id) ? 'border-color:var(--indigo)' : ''">
          <div class="spread">
            <label class="row" @click.stop><input type="checkbox" :checked="selected.has(p.id)" @change="toggleOne(p.id)" /><strong>{{ p.collectionName }}</strong></label>
            <span class="badge" :class="'st-' + p.status">{{ statusLabel(p.status) }}</span>
          </div>
          <div class="row" style="margin-top:8px" @click="openProduct(p.id)">
            <ProdThumb :product-id="p.id" />
            <div>
              <div class="mono small">{{ p.sku }}</div>
              <div class="small muted">{{ seriesLabel(p.series) }} · {{ p.shape }}</div>
              <div class="small"><strong>${{ effPrice(p).toFixed(2) }}</strong> · 库存 <span :style="stockOf(p.id) <= 10 ? 'color:var(--vermilion);font-weight:700' : ''">{{ stockOf(p.id) }}</span></div>
            </div>
          </div>
          <div class="row" style="margin-top:8px">
            <router-link class="btn btn-sm" :to="`/products/${p.id}`">编辑</router-link>
            <button v-if="session.canPublish" class="btn btn-sm btn-accent" :disabled="p.status === 'published'" @click="quickStatus(p.id, 'published')">发布</button>
            <button class="btn btn-sm" @click="quickStatus(p.id, p.status === 'published' ? 'draft' : 'ready')">
              {{ p.status === 'published' ? '下架' : '就绪' }}
            </button>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button class="btn btn-sm" :disabled="page <= 1" @click="page--; reload()">上一页</button>
        <span>第 {{ page }} 页 / 共 {{ total }} 款</span>
        <button class="btn btn-sm" :disabled="page * pageSize >= total" @click="page++; reload()">下一页</button>
      </div>
    </template>

    <!-- 底部批量操作栏 -->
    <div v-if="selected.size > 0" class="batchbar">
      <span class="count">已选 {{ selected.size }}</span>
      <button class="btn btn-sm" @click="batchStatus('ready')">Approve 选中</button>
      <button v-if="session.canPublish" class="btn btn-sm btn-accent" @click="batchStatus('published')">发布选中</button>
      <button class="btn btn-sm" @click="batchStatus('draft')">下架选中</button>
      <button class="btn btn-sm" @click="openBatchModal('series')">改系列</button>
      <button class="btn btn-sm" @click="openBatchModal('price')">改价</button>
      <button class="btn btn-sm" @click="openBatchModal('tags')">加标签</button>
      <button class="btn btn-sm" @click="exportCsv">导出 CSV</button>
      <button class="btn btn-sm btn-danger" @click="batchArchive">归档</button>
      <button class="btn btn-sm" @click="selected.clear()">取消</button>
    </div>

    <!-- 批量操作小弹窗 -->
    <div v-if="batchModal" class="modal-mask" @click.self="batchModal = null">
      <div class="card modal-box">
        <h3 style="margin-top:0">{{ batchModalTitle }}</h3>
        <div v-if="batchModal === 'series'" class="field">
          <select v-model="batchSeries" class="select">
            <option value="essential">Essential</option>
            <option value="signature">Signature</option>
            <option value="atelier">Atelier</option>
          </select>
        </div>
        <div v-if="batchModal === 'price'" class="field">
          <label class="label">统一售价 regularPrice（USD）</label>
          <input v-model.number="batchPrice" type="number" step="0.01" min="0" class="input" />
          <div class="hint">批量改价会写入审计日志，请谨慎操作。</div>
        </div>
        <div v-if="batchModal === 'tags'" class="field">
          <label class="label">追加标签（逗号分隔）</label>
          <input v-model="batchTags" class="input" placeholder="new, bestseller" />
        </div>
        <div class="row" style="justify-content:flex-end; margin-top:12px">
          <button class="btn" @click="batchModal = null">取消</button>
          <button class="btn btn-primary" @click="confirmBatchModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import { getProvider } from '@/lib/provider';
import { useSessionStore } from '@/stores/session';
import type { FrameSeries, ProductRow, ProductStatus } from '../../../supabase/kyoto';

/* 缩略图小组件：取第一张图，无图则占位 */
const ProdThumb = defineComponent({
  props: { productId: { type: String, required: true } },
  setup(props) {
    const url = ref<string | null>(null);
    getProvider().listImages(props.productId).then(imgs => {
      url.value = imgs[0]?.publicUrl ?? null;
    }).catch(() => {});
    return () => url.value
      ? h('img', { class: 'thumb', src: url.value, alt: '' })
      : h('div', { class: 'thumb-ph' }, '无图');
  },
});

const session = useSessionStore();
const route = useRoute();
const router = useRouter();

const items = ref<ProductRow[]>([]);
const total = ref(0);
const loading = ref(true);
const page = ref(1);
const pageSize = 20;
const q = ref('');
const fSeries = ref('');
const fStatus = ref((route.query.status as string) ?? '');
const fShape = ref('');
const sort = ref('updated_desc');
const shapes = ref<string[]>([]);
const stockMap = ref<Record<string, number>>({});
const selected = ref<Set<string>>(new Set());
const cameraInput = ref<HTMLInputElement | null>(null);

const batchModal = ref<null | 'series' | 'price' | 'tags'>(null);
const batchSeries = ref<FrameSeries>('essential');
const batchPrice = ref<number>(0);
const batchTags = ref('');

const batchModalTitle = computed(() =>
  batchModal.value === 'series' ? '批量改系列' : batchModal.value === 'price' ? '批量改价' : '批量加标签');

const allChecked = computed(() => items.value.length > 0 && items.value.every(p => selected.value.has(p.id)));

const effPrice = (p: ProductRow) => p.launchPrice ?? p.regularPrice;
const stockOf = (id: string) => stockMap.value[id] ?? 0;
const seriesLabel = (s: FrameSeries) => s === 'essential' ? 'Essential' : s === 'signature' ? 'Signature' : 'Atelier';
const statusLabel = (s: ProductStatus) =>
  ({ draft: '草稿', needs_review: '待审核', ready: '已就绪', published: '已发布', archived: '已归档' } as Record<string, string>)[s] ?? s;
const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { hour12: false });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedReload() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { page.value = 1; reload(); }, 350);
}

async function reload() {
  loading.value = true;
  try {
    const p = getProvider();
    const res = await p.listProducts({
      search: q.value, series: fSeries.value as FrameSeries | '', status: fStatus.value as ProductStatus | '',
      shape: fShape.value, sort: sort.value as 'updated_desc', page: page.value, pageSize,
    });
    items.value = res.items;
    total.value = res.total;
    // 库存快照
    const sm: Record<string, number> = {};
    await Promise.all(res.items.map(async (prod) => {
      const inv = await p.getInventory(prod.id).catch(() => null);
      sm[prod.id] = inv ? inv.onHand - inv.reserved : 0;
    }));
    stockMap.value = sm;
    // 框型下拉选项
    const all = await p.listProducts({ pageSize: 1000 });
    shapes.value = [...new Set(all.items.map(x => x.shape).filter(Boolean))].sort();
  } finally {
    loading.value = false;
  }
}

function toggleOne(id: string) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
}
function toggleAll() {
  if (allChecked.value) items.value.forEach(p => selected.value.delete(p.id));
  else items.value.forEach(p => selected.value.add(p.id));
}
function openProduct(id: string) { router.push(`/products/${id}`); }

const actor = () => session.profile?.email ?? 'unknown';

async function quickStatus(id: string, status: ProductStatus) {
  await getProvider().setProductStatus(id, status, actor());
  await reload();
}
async function batchStatus(status: ProductStatus) {
  if (!confirm(`确定将 ${selected.value.size} 款产品设为「${statusLabel(status)}」？`)) return;
  try {
    await getProvider().bulkSetStatus([...selected.value], status, actor());
    selected.value.clear();
    await reload();
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败');
  }
}
async function batchArchive() {
  if (!confirm(`确定归档 ${selected.value.size} 款产品？（归档≠删除，可恢复）`)) return;
  const p = getProvider();
  for (const id of selected.value) await p.archiveProduct(id, actor());
  selected.value.clear();
  await reload();
}

function openBatchModal(kind: 'series' | 'price' | 'tags') {
  batchModal.value = kind;
}
async function confirmBatchModal() {
  const ids = [...selected.value];
  const p = getProvider();
  try {
    if (batchModal.value === 'series') {
      await p.bulkUpdate(ids, { series: batchSeries.value }, actor());
    } else if (batchModal.value === 'price') {
      if (!(batchPrice.value > 0)) { alert('请输入有效价格'); return; }
      if (!confirm(`确定将 ${ids.length} 款产品的 regularPrice 统一设为 $${batchPrice.value.toFixed(2)}？`)) return;
      await p.bulkUpdate(ids, { regularPrice: batchPrice.value }, actor());
    } else if (batchModal.value === 'tags') {
      const tags = batchTags.value.split(',').map(t => t.trim()).filter(Boolean);
      for (const id of ids) {
        const prod = await p.getProduct(id);
        if (prod) await p.updateProduct(id, { tags: [...new Set([...prod.tags, ...tags])] }, actor());
      }
    }
    batchModal.value = null;
    selected.value.clear();
    await reload();
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败');
  }
}

function exportCsv() {
  const rows = items.value.filter(p => selected.value.has(p.id)).map(p => ({
    SKU: p.sku, 系列: seriesLabel(p.series), 名称: p.collectionName, 中文名: p.nameZH,
    框型: p.shape, 售价: effPrice(p), 原价: p.regularPrice, 状态: statusLabel(p.status),
    库存可用: stockOf(p.id),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kyoto-products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* 拍照入口（与 Dashboard 同逻辑） */
function triggerCamera() { cameraInput.value?.click(); }
async function onCameraFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files?.length) return;
  const read = (f: File) => new Promise<{ name: string; dataUrl: string }>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ name: f.name, dataUrl: r.result as string });
    r.onerror = rej;
    r.readAsDataURL(f);
  });
  const picked = await Promise.all(Array.from(files).slice(0, 10).map(read));
  try { sessionStorage.setItem('kyoto-capture-pending', JSON.stringify(picked)); } catch { /* ignore */ }
  (e.target as HTMLInputElement).value = '';
  await router.push({ path: '/upload', query: { mode: 'camera' } });
}

watch(() => route.query.status, (v) => { fStatus.value = (v as string) ?? ''; page.value = 1; reload(); });
onMounted(reload);
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; z-index: 60; background: rgba(26, 41, 54, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-box { width: 100%; max-width: 400px; }
.mobile-cards { display: none; }
@media (max-width: 899px) {
  .mobile-cards { display: grid !important; }
}
</style>
