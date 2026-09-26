<template>
  <div class="page dash">
    <div class="page-head">
      <div>
        <h1>仪表盘</h1>
        <div class="sub">{{ today }} · {{ session.profile?.displayName }}（{{ roleLabel }}）</div>
      </div>
      <router-link class="btn btn-primary" to="/products/new">＋ 新增产品</router-link>
    </div>

    <!-- 手机优先：Quick Actions 在前（CSS order） -->
    <section class="qa-sec">
      <div class="section-title" style="margin-top:0">快捷操作</div>
      <div class="qa-grid">
        <button class="qa" @click="triggerCamera">
          <span class="ico">📷</span>
          <span class="t">拍照上架</span>
          <span class="d">手机拍摄镜框 → 批量上传</span>
        </button>
        <router-link class="qa" to="/upload">
          <span class="ico">🖼</span>
          <span class="t">AI 批量上传</span>
          <span class="d">多图上传 · AI 识别填充</span>
        </router-link>
        <router-link class="qa" to="/import">
          <span class="ico">📄</span>
          <span class="t">导入供应商文件</span>
          <span class="d">Excel/CSV 映射导入</span>
        </router-link>
        <router-link class="qa" to="/products/new">
          <span class="ico">＋</span>
          <span class="t">新增产品</span>
          <span class="d">手动创建产品档案</span>
        </router-link>
      </div>
      <!-- 拍照入口：input capture，选中后把文件暂存并跳转到 /upload?mode=camera（拍照流程视图由另一位专员实现） -->
      <input
        ref="cameraInput" type="file" accept="image/*" capture="environment"
        multiple style="display:none" @change="onCameraFiles" />
    </section>

    <section class="stats-sec">
      <div class="section-title">概览</div>
      <div v-if="loading" class="muted small">加载中…</div>
      <div v-else class="stats">
        <router-link class="stat-card" to="/products" style="text-decoration:none">
          <div class="num">{{ stats.total }}</div><div class="lbl">产品总数</div>
        </router-link>
        <router-link class="stat-card" to="/products?status=published" style="text-decoration:none">
          <div class="num">{{ stats.published }}</div><div class="lbl">已发布</div>
        </router-link>
        <router-link class="stat-card" to="/products?status=draft" style="text-decoration:none">
          <div class="num">{{ stats.drafts }}</div><div class="lbl">草稿</div>
        </router-link>
        <router-link class="stat-card alert" to="/review" style="text-decoration:none">
          <div class="num">{{ stats.needsReview }}</div><div class="lbl">待审核</div>
        </router-link>
        <router-link class="stat-card alert" to="/inventory" style="text-decoration:none">
          <div class="num">{{ stats.lowStock }}</div><div class="lbl">低库存</div>
        </router-link>
        <router-link class="stat-card" to="/orders" style="text-decoration:none">
          <div class="num">{{ stats.orders }}</div><div class="lbl">订单（近）</div>
        </router-link>
        <router-link class="stat-card" to="/ai-studio" style="text-decoration:none">
          <div class="num">{{ stats.aiJobs }}</div><div class="lbl">AI 任务</div>
        </router-link>
        <router-link class="stat-card" to="/audit" style="text-decoration:none">
          <div class="num">{{ stats.audit }}</div><div class="lbl">审计记录</div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getProvider } from '@/lib/provider';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const router = useRouter();
const cameraInput = ref<HTMLInputElement | null>(null);

const today = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
const roleLabel = computed(() => {
  const r = session.profile?.role;
  return r === 'owner' ? '店主' : r === 'admin' ? '管理员' : '店员';
});

const loading = ref(true);
const stats = ref({ total: 0, published: 0, drafts: 0, needsReview: 0, lowStock: 0, orders: 0, aiJobs: 0, audit: 0 });

onMounted(async () => {
  try {
    const p = getProvider();
    const [all, low, orders, jobs, audit] = await Promise.all([
      p.listProducts({ pageSize: 1000 }),
      p.lowStock(),
      p.listOrders(),
      p.listAiJobs(),
      p.auditList({ limit: 1 }),
    ]);
    const items = all.items;
    stats.value = {
      total: all.total,
      published: items.filter(i => i.status === 'published').length,
      drafts: items.filter(i => i.status === 'draft').length,
      needsReview: items.filter(i => i.status === 'needs_review').length,
      lowStock: low.length,
      orders: orders.length,
      aiJobs: jobs.filter(j => j.status === 'queued' || j.status === 'processing' || j.status === 'needs_review').length,
      audit: audit.length,
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function triggerCamera() {
  cameraInput.value?.click();
}

/** 拍照后：文件转 dataURL 暂存 sessionStorage，跳转批量上传（mode=camera） */
async function onCameraFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  const read = (f: File) => new Promise<{ name: string; dataUrl: string }>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ name: f.name, dataUrl: r.result as string });
    r.onerror = rej;
    r.readAsDataURL(f);
  });
  const picked = await Promise.all(Array.from(files).slice(0, 10).map(read));
  try {
    sessionStorage.setItem('kyoto-capture-pending', JSON.stringify(picked));
  } catch { /* quota 忽略 */ }
  (e.target as HTMLInputElement).value = '';
  await router.push({ path: '/upload', query: { mode: 'camera' } });
}
</script>
