<!--
  admin/src/views/Promotions.vue — 促销基础结构。
  字段：名称 / 起止 / 状态 / 适用系列或产品 / displayLabel 三语。
  预置 Founding Offer：Essential regular $89.99 / launch $79.99，active。
  价格照抄现有业务数据（MEMORY/业务约定），本文件不发明、不修改任何价格。
  不许 fake countdown：只展示真实起止时间，不渲染"仅剩 X 天/小时"类倒计时。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type { FrameSeries, Locale, LocalizedText, PromotionRow } from '../../../supabase/kyoto';

/** 预置促销：价格照抄业务数据，不许改 */
const FOUNDING_OFFER_SEED: Omit<PromotionRow, 'id'> = {
  name: 'Founding Offer',
  startsAt: null,
  endsAt: null,
  status: 'active',
  eligible: { collections: ['essential'] },
  displayLabel: {
    'en-US': 'Founding Offer — Essential $79.99 (reg. $89.99)',
    'zh-CN': '开业特惠 — Essential 系列 $79.99（原价 $89.99）',
    'es-US': 'Oferta de lanzamiento — Essential $79.99 (reg. $89.99)',
  },
};

const LOCALES: { key: Locale; label: string }[] = [
  { key: 'en-US', label: 'EN' },
  { key: 'zh-CN', label: '中文' },
  { key: 'es-US', label: 'ES' },
];
const SERIES: FrameSeries[] = ['essential', 'signature', 'atelier'];

const list = ref<PromotionRow[]>([]);
const loading = ref(false);
const err = ref('');
const actor = ref('admin');

// 表单
const editing = ref<PromotionRow | null>(null);
const fName = ref('');
const fStartsAt = ref('');
const fEndsAt = ref('');
const fStatus = ref<PromotionRow['status']>('draft');
const fCollections = ref<FrameSeries[]>([]);
const fProductIds = ref('');
const fLabel = ref<LocalizedText>({ 'en-US': '', 'zh-CN': '', 'es-US': '' });

const STATUS_LABEL: Record<PromotionRow['status'], string> = {
  draft: '草稿',
  active: '进行中',
  ended: '已结束',
};

function toInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromInputValue(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

async function load() {
  loading.value = true;
  err.value = '';
  try {
    const session = await db.getSession();
    actor.value = session?.userId ?? 'admin';
    const promos = await db.listPromotions();
    // 预置 Founding Offer（不存在才建，不重复）
    if (!promos.some((p) => p.name === FOUNDING_OFFER_SEED.name)) {
      const seeded = await db.savePromotion({ ...FOUNDING_OFFER_SEED }, actor.value);
      list.value = [seeded, ...promos];
    } else {
      list.value = promos;
    }
  } catch (e) {
    err.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

function startCreate() {
  editing.value = null;
  fName.value = '';
  fStartsAt.value = '';
  fEndsAt.value = '';
  fStatus.value = 'draft';
  fCollections.value = [];
  fProductIds.value = '';
  fLabel.value = { 'en-US': '', 'zh-CN': '', 'es-US': '' };
}

function startEdit(p: PromotionRow) {
  editing.value = p;
  fName.value = p.name;
  fStartsAt.value = toInputValue(p.startsAt);
  fEndsAt.value = toInputValue(p.endsAt);
  fStatus.value = p.status;
  fCollections.value = [...(p.eligible.collections ?? [])];
  fProductIds.value = (p.eligible.productIds ?? []).join(', ');
  fLabel.value = { ...p.displayLabel };
}

async function save() {
  if (!fName.value.trim()) {
    err.value = '请填写促销名称';
    return;
  }
  err.value = '';
  const payload: Partial<PromotionRow> = {
    ...(editing.value ? { id: editing.value.id } : {}),
    name: fName.value.trim(),
    startsAt: fromInputValue(fStartsAt.value),
    endsAt: fromInputValue(fEndsAt.value),
    status: fStatus.value,
    eligible: {
      ...(fCollections.value.length ? { collections: fCollections.value } : {}),
      ...(fProductIds.value.trim()
        ? { productIds: fProductIds.value.split(',').map((s) => s.trim()).filter(Boolean) }
        : {}),
    },
    displayLabel: { ...fLabel.value },
  };
  try {
    const saved = await db.savePromotion(payload, actor.value);
    const i = list.value.findIndex((p) => p.id === saved.id);
    if (i >= 0) list.value[i] = saved;
    else list.value.unshift(saved);
    startCreate();
  } catch (e) {
    err.value = e instanceof Error ? e.message : '保存失败';
  }
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}
function eligibleText(p: PromotionRow): string {
  const parts: string[] = [];
  if (p.eligible.collections?.length) parts.push('系列: ' + p.eligible.collections.join(', '));
  if (p.eligible.productIds?.length) parts.push(`${p.eligible.productIds.length} 款指定商品`);
  return parts.join('；') || '全场';
}

onMounted(() => {
  startCreate();
  void load();
});
</script>

<template>
  <div class="pg">
    <header>
      <h2>促销</h2>
      <p class="muted">名称 / 起止 / 状态 / 适用范围 / 三语展示文案。不做虚假倒计时，只展示真实时间。</p>
    </header>

    <p v-if="err" class="err">{{ err }}</p>
    <p v-if="loading" class="muted">加载中…</p>

    <div class="layout">
      <!-- 列表 -->
      <section class="panel">
        <h3>促销列表（{{ list.length }}）</h3>
        <div v-if="list.length === 0" class="empty muted">暂无促销，可右侧新建。</div>
        <ul class="plist">
          <li v-for="p in list" :key="p.id" class="pitem">
            <div class="phead">
              <strong>{{ p.name }}</strong>
              <span class="badge" :class="'st-' + p.status">{{ STATUS_LABEL[p.status] }}</span>
            </div>
            <p class="muted">{{ eligibleText(p) }}</p>
            <p class="muted">{{ fmtDate(p.startsAt) }} → {{ fmtDate(p.endsAt) }}</p>
            <p class="label-line" v-for="l in LOCALES" :key="l.key">
              <span class="badge">{{ l.label }}</span> {{ p.displayLabel[l.key] }}
            </p>
            <button class="btn xs" @click="startEdit(p)">编辑</button>
          </li>
        </ul>
      </section>

      <!-- 新建/编辑 -->
      <aside class="panel">
        <h3>{{ editing ? '编辑促销' : '新建促销' }}</h3>
        <div class="form">
          <label>名称 <input v-model="fName" placeholder="如：Founding Offer" /></label>
          <div class="frow">
            <label>开始 <input v-model="fStartsAt" type="datetime-local" /></label>
            <label>结束 <input v-model="fEndsAt" type="datetime-local" /></label>
          </div>
          <label>状态
            <select v-model="fStatus">
              <option value="draft">草稿</option>
              <option value="active">进行中</option>
              <option value="ended">已结束</option>
            </select>
          </label>
          <fieldset>
            <legend>适用系列（可多选）</legend>
            <label v-for="s in SERIES" :key="s" class="chk">
              <input type="checkbox" :value="s" v-model="fCollections" /> {{ s }}
            </label>
          </fieldset>
          <label>指定商品 ID（逗号分隔，可空）
            <input v-model="fProductIds" placeholder="uuid1, uuid2" />
          </label>
          <label v-for="l in LOCALES" :key="l.key">
            展示文案（{{ l.label }}）
            <input v-model="fLabel[l.key]" />
          </label>
          <div class="btnrow">
            <button class="btn primary" @click="save">保存</button>
            <button v-if="editing" class="btn" @click="startCreate">取消编辑</button>
          </div>
          <p class="warnline">
            价格不在促销里维护——商品价格以商品自身的 regularPrice / launchPrice 为准
            （如 Founding Offer：Essential regular $89.99 / launch $79.99，照抄业务数据）。
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pg { max-width: 1280px; margin: 0 auto; padding: 16px; }
.muted { color: #777; font-size: 13px; }
.err { color: #c62828; }
.layout { display: grid; grid-template-columns: 1fr 380px; gap: 16px; margin-top: 12px; }
.panel { border: 1px solid #e3e3e3; border-radius: 12px; padding: 16px; background: #fff; }
.panel h3 { margin: 0 0 12px; }
.empty { padding: 24px; text-align: center; border: 1px dashed #ccc; border-radius: 10px; }
.plist { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.pitem { border: 1px solid #eee; border-radius: 10px; padding: 12px; }
.phead { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.badge { background: #eee; border-radius: 10px; padding: 2px 8px; font-size: 11px; }
.badge.st-active { background: #e8f5e9; color: #2e7d32; }
.badge.st-draft { background: #f5f5f5; color: #666; }
.badge.st-ended { background: #ffebee; color: #c62828; }
.label-line { font-size: 13px; margin: 4px 0; }
.form label { display: block; font-size: 13px; margin: 10px 0; }
.form input, .form select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; margin-top: 4px; }
.frow { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
fieldset { border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; margin: 10px 0; }
legend { font-size: 13px; padding: 0 6px; }
.chk { display: inline-flex !important; align-items: center; gap: 6px; margin: 4px 12px 4px 0 !important; }
.chk input { width: auto !important; margin: 0 !important; }
.btnrow { display: flex; gap: 8px; margin-top: 12px; }
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936; }
.btn.xs { padding: 4px 8px; font-size: 12px; margin-top: 8px; }
.warnline { color: #b26a00; font-size: 12px; margin-top: 12px; background: #fffdf5; border: 1px dashed #f0c36d; border-radius: 8px; padding: 8px 10px; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .btnrow { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
  .btnrow .btn { flex: 1; }
}
</style>
