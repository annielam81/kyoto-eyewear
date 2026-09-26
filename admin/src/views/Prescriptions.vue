<!--
admin/src/views/Prescriptions.vue — 处方真实列表 + 详情（走 provider）。
详情显示 OD / OS / SPH / CYL / AXIS / ADD / PD / method / image / verificationStatus。
AI 不许自动修正处方数据——本文件不调用任何 AI 接口，所有数据只读展示。
权限：需 profile.canAccessPrescriptions，否则显示无权限页。
约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { onMounted, ref} from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type { PrescriptionRow} from '../../../supabase/kyoto';

const list = ref<PrescriptionRow[]>([]);
const loading = ref(false);
const err = ref('');
const selected = ref<PrescriptionRow | null>(null);
const allowed = ref(false);
const checked = ref(false);

const RX_FIELDS = ['SPH', 'CYL', 'AXIS', 'ADD'] as const;

async function load() {
loading.value = true;
err.value = '';
try {
const session = await db.getSession();
allowed.value =!!session?.profile?.canAccessPrescriptions;
checked.value = true;
if (!allowed.value) return;
list.value = await db.listPrescriptions();
} catch (e) {
err.value = e instanceof Error? e.message: '加载失败';
} finally {
loading.value = false;
}
}

function eyeTable(eye: Record<string, string> | null): string {
if (!eye) return '—';
return RX_FIELDS.map((f) => `${f}: ${eye[f]?? '—'}`).join(' ');
}

const STATUS_LABEL: Record<PrescriptionRow['verificationStatus'], string> = {
pending: '待审核',
verified: '已确认',
rejected: '已驳回',
};

onMounted(load);
</script>

<template>
<div class="pg">
<header>
<h2>处方</h2>
<p class="muted">处方数据仅人工审核展示，AI 不做任何自动修正。</p>
</header>

<p v-if="err" class="err">{{ err}}</p>
<p v-if="loading" class="muted">加载中…</p>

<!-- 无权限 -->
<div v-if="checked &&!allowed" class="noperm">
<h3>⛔ 无权限</h3>
<p>你的账号没有处方访问权限（canAccessPrescriptions = false）。</p>
<p class="muted">如需处理处方，请联系 owner / admin 开通权限。</p>
</div>

<template v-if="checked && allowed">
<div v-if="!loading && list.length === 0" class="empty">
<p>暂无处方</p>
<p class="muted">当前 provider 中没有任何处方数据——这是真实空状态，不是占位页面。</p>
</div>

<div v-else class="layout">
<section class="panel">
<table class="dense desktop-only">
<thead>
<tr><th>ID</th><th>方式</th><th>PD</th><th>状态</th><th>创建时间</th></tr>
</thead>
<tbody>
<tr
v-for="p in list"
:key="p.id"
:class="{ sel: selected?.id === p.id}"
@click="selected = p"
>
<td class="mono">{{ p.id.slice(0, 8)}}…</td>
<td>{{ p.method || '—'}}</td>
<td class="mono">{{ p.pd?? '—'}}</td>
<td>
<span class="badge":class="'vs-' + p.verificationStatus">
{{ STATUS_LABEL[p.verificationStatus]}}
</span>
</td>
<td class="muted">{{ new Date(p.createdAt).toLocaleString()}}</td>
</tr>
</tbody>
</table>
<ul class="cards mobile-only">
<li
v-for="p in list"
:key="p.id"
class="card"
:class="{ sel: selected?.id === p.id}"
@click="selected = p"
>
<div>
<p class="mono">{{ p.id.slice(0, 8)}}…</p>
<p class="muted">{{ p.method || '—'}} · PD {{ p.pd?? '—'}}</p>
</div>
<span class="badge":class="'vs-' + p.verificationStatus">
{{ STATUS_LABEL[p.verificationStatus]}}
</span>
</li>
</ul>
</section>

<aside v-if="selected" class="panel detail">
<div class="dhead">
<h3 class="mono">{{ selected.id}}</h3>
<button class="btn xs" @click="selected = null">关闭</button>
</div>

<h4>OD（右眼）</h4>
<p class="rx">{{ eyeTable(selected.od)}}</p>
<h4>OS（左眼）</h4>
<p class="rx">{{ eyeTable(selected.os)}}</p>

<dl class="kv">
<dt>PD</dt><dd class="mono">{{ selected.pd?? '—'}}</dd>
<dt>录入方式</dt><dd>{{ selected.method || '—'}}</dd>
<dt>审核状态</dt>
<dd>
<span class="badge":class="'vs-' + selected.verificationStatus">
{{ STATUS_LABEL[selected.verificationStatus]}}
</span>
</dd>
<dt>关联订单</dt><dd class="mono">{{ selected.orderId?? '—'}}</dd>
</dl>

<h4>处方图片</h4>
<p v-if="selected.imagePath" class="mono">{{ selected.imagePath}}</p>
<p v-else class="muted">无图片</p>

<h4>备注</h4>
<p class="muted">{{ selected.notes || '无'}}</p>

<p class="warnline">
⚠ 处方数据不经过 AI 修正；任何修改必须由有权限的人工完成（当前 provider 仅提供只读列表）。
</p>
</aside>
</div>
</template>
</div>
</template>

<style scoped>
.pg { max-width: 1280px; margin: 0 auto; padding: 16px;}
.muted { color: #777; font-size: 13px;}
.err { color: #c62828;}
.mono { font-family: ui-monospace, monospace; font-size: 12px;}
.noperm { padding: 48px 24px; text-align: center; border: 1px solid #ef9a9a; border-radius: 12px; background: #fff8f8; margin-top: 16px;}
.empty { padding: 48px 24px; text-align: center; border: 1px dashed #ccc; border-radius: 12px; color: #888;}
.layout { display: grid; grid-template-columns: 1fr 420px; gap: 16px; margin-top: 12px;}
.panel { border: 1px solid #e3e3e3; border-radius: 12px; padding: 12px; background: #fff;}
table.dense { width: 100%; border-collapse: collapse; font-size: 13px;}
table.dense th, table.dense td { border-bottom: 1px solid #eee; padding: 8px; text-align: left;}
table.dense tbody tr { cursor: pointer;}
table.dense tbody tr:hover, tr.sel, li.sel { background: #f5f8fc;}
.badge { background: #eee; border-radius: 10px; padding: 2px 8px; font-size: 11px;}
.badge.vs-verified { background: #e8f5e9; color: #2e7d32;}
.badge.vs-pending { background: #fff8e1; color: #f57f00;}
.badge.vs-rejected { background: #ffebee; color: #c62828;}
.cards { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px;}
.card { border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; cursor: pointer; background: #fff;}
.card p { margin: 0 0 4px;}
.detail.dhead { display: flex; justify-content: space-between; align-items: center; gap: 8px;}
.detail h3 { margin: 0; word-break: break-all;}
.detail h4 { margin: 14px 0 6px; font-size: 14px;}
.rx { font-family: ui-monospace, monospace; font-size: 13px; background: #f8f8f8; border-radius: 8px; padding: 8px 12px;}
.kv { display: grid; grid-template-columns: 90px 1fr; gap: 4px 8px; font-size: 13px; margin: 8px 0;}
.kv dt { color: #777;}
.kv dd { margin: 0;}
.warnline { color: #b26a00; font-size: 12px; margin-top: 12px; background: #fffdf5; border: 1px dashed #f0c36d; border-radius: 8px; padding: 8px 10px;}
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer;}
.btn.xs { padding: 4px 8px; font-size: 12px;}
.desktop-only { display: table;}
.mobile-only { display: none;}
@media (max-width: 900px) {
.desktop-only { display: none;}
.mobile-only { display: grid;}
.layout { grid-template-columns: 1fr;}
}
</style>
