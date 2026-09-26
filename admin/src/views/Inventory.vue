<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>库存管理</h1>
        <div class="sub">低库存预警 · 单品调整（写 ledger）· 出入库历史</div>
      </div>
    </div>

    <div class="section-title" style="margin-top:0">低库存（{{ lowItems.length }}）</div>
    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="lowItems.length === 0" class="empty">暂无低库存商品</div>
    <div v-else class="card" style="padding:0; overflow:hidden">
      <div class="table-wrap" style="border:none; border-radius:0">
        <table class="tbl">
          <thead>
            <tr>
              <th>SKU</th><th>产品</th><th>在库</th><th>预留</th><th>可用</th><th>阈值</th>
              <th class="desktop-only">调整</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in lowItems" :key="it.product.id" :class="{ selected: selectedId === it.product.id }" @click="select(it.product.id)" style="cursor:pointer">
              <td class="mono">{{ it.product.sku }}</td>
              <td><strong>{{ it.product.collectionName }}</strong></td>
              <td class="mono">{{ it.inventory.onHand }}</td>
              <td class="mono">{{ it.inventory.reserved }}</td>
              <td class="mono" style="color:var(--vermilion); font-weight:700">{{ it.inventory.onHand - it.inventory.reserved }}</td>
              <td class="mono">{{ it.inventory.lowStockThreshold }}</td>
              <td class="desktop-only" @click.stop>
                <div class="row">
                  <input v-model.number="adj[it.product.id]" type="number" class="input" style="width:90px" placeholder="+/-" />
                  <button class="btn btn-sm" @click="adjust(it.product.id)">调整</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 手机：选中行的调整 -->
      <div v-if="selectedId" class="mobile-adjust" style="padding:12px 14px; border-top:1px solid var(--line)">
        <div class="field">
          <label class="label">调整「{{ selectedName }}」库存</label>
          <div class="row">
            <input v-model.number="adj[selectedId]" type="number" class="input" style="width:110px" placeholder="+/- 数量" />
            <input v-model="reason" class="input" style="flex:1" placeholder="原因" />
            <button class="btn btn-sm btn-primary" @click="adjust(selectedId)">提交</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedId" class="section-title">出入库历史 · {{ selectedName }}</div>
    <div v-if="selectedId" class="card" style="padding:0; overflow:hidden">
      <div v-if="ledgerLoading" class="empty">加载中…</div>
      <div v-else-if="ledger.length === 0" class="empty">暂无记录</div>
      <div v-else class="table-wrap" style="border:none">
        <table class="tbl">
          <thead><tr><th>时间</th><th>变动前</th><th>变动</th><th>变动后</th><th>原因</th><th>操作人</th></tr></thead>
          <tbody>
            <tr v-for="l in ledger" :key="l.id">
              <td class="small muted">{{ fmtTime(l.createdAt) }}</td>
              <td class="mono">{{ l.beforeQty }}</td>
              <td class="mono" :style="l.change >= 0 ? 'color:var(--ok)' : 'color:var(--vermilion)'">
                {{ l.change >= 0 ? '+' : '' }}{{ l.change }}
              </td>
              <td class="mono"><strong>{{ l.afterQty }}</strong></td>
              <td>{{ l.reason }}</td>
              <td class="small muted">{{ l.actor ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';
import { useSessionStore } from '@/stores/session';
import type { InventoryLedgerRow, InventoryRow, ProductRow } from '../../../supabase/kyoto';

const session = useSessionStore();
const loading = ref(true);
const ledgerLoading = ref(false);
const lowItems = ref<{ product: ProductRow; inventory: InventoryRow }[]>([]);
const selectedId = ref<string | null>(null);
const selectedName = ref('');
const ledger = ref<InventoryLedgerRow[]>([]);
const adj = ref<Record<string, number | null>>({});
const reason = ref('');

const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { hour12: false });
const actor = () => session.profile?.email ?? 'unknown';

async function reload() {
  loading.value = true;
  try {
    lowItems.value = await getProvider().lowStock();
  } finally {
    loading.value = false;
  }
}

async function select(id: string) {
  selectedId.value = id;
  const it = lowItems.value.find(x => x.product.id === id);
  selectedName.value = it ? it.product.collectionName : '';
  ledgerLoading.value = true;
  try {
    ledger.value = await getProvider().inventoryLedger(id);
  } finally {
    ledgerLoading.value = false;
  }
}

async function adjust(productId: string) {
  const change = adj.value[productId];
  const r = reason.value.trim() || prompt('调整原因（必填）：', 'manual_adjust');
  if (change == null || change === 0 || !r) { alert('请填写数量和原因'); return; }
  try {
    await getProvider().adjustInventory(productId, change, r, actor());
    adj.value[productId] = null;
    reason.value = '';
    await reload();
    if (selectedId.value === productId) await select(productId);
  } catch (e) {
    alert(e instanceof Error ? e.message : '调整失败');
  }
}

onMounted(reload);
</script>

<style scoped>
@media (min-width: 900px) {
  .mobile-adjust { display: none; }
}
</style>
