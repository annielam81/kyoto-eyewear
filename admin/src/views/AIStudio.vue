<!--
  admin/src/views/AIStudio.vue — AI 工作台。
  - AI Jobs 列表 + 手动触发：Analyze / Process Image / OCR / Generate Content /
    Translate / Regenerate / Suggest Collection。全部必须用户主动点击才触发，
    页面打开不许自动调 AI（本文件无任何 onMounted 自动 AI 调用）。
  - OCR：展示 rawText + 识别出的 lensWidth/bridge/temple，标 OCR DETECTED；
    Confirm / Edit / Reject；确认后才变 VERIFIED。
  - AI 命名：Accept / Edit / Regenerate；不许自动重命名现有商品。
  - 每个结果显示 provenance + confidence（High/Medium/Low；Low 不许自动 confirm）。
  - 每次结果落库 ai_jobs，不重复计算。
  图片管线：original 永久保留；cleaned 只做去背/裁剪/居中/标准化（mock 原图占位+标注）；
  marketing 图必须打标 "AI GENERATED MARKETING IMAGE"。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import { CONFIDENCE_LABEL, PROVENANCE_LABEL, getAiService, trilingual } from '@/lib/ai';
import type {
  AiJobRow,
  Confidence,
  GeneratedContent,
  Locale,
  LocalizedText,
  ProductRow,
  TempleOcrResult,
} from '../../../supabase/kyoto';

const LOCALES: { key: Locale; label: string }[] = [
  { key: 'en-US', label: 'EN' },
  { key: 'zh-CN', label: '中文' },
  { key: 'es-US', label: 'ES' },
];

/* ---------------- 商品选择 ---------------- */
const productQuery = ref('');
const products = ref<ProductRow[]>([]);
const selectedProduct = ref<ProductRow | null>(null);
const jobs = ref<AiJobRow[]>([]);
const loading = ref(false);
const err = ref('');
const actor = ref('admin');

async function searchProducts() {
  try {
    const { items } = await db.listProducts({
      search: productQuery.value.trim() || undefined,
      pageSize: 20,
    });
    products.value = items;
  } catch (e) {
    err.value = e instanceof Error ? e.message : '搜索失败';
  }
}

function selectProduct(p: ProductRow) {
  selectedProduct.value = p;
  ocrResult.value = null;
  contentResult.value = null;
  collectionResult.value = null;
  editingOcr.value = false;
  editingName.value = false;
  void loadJobs();
}

async function loadJobs() {
  try {
    const all = await db.listAiJobs();
    jobs.value = selectedProduct.value
      ? all.filter((j) => j.productIds.includes(selectedProduct.value!.id))
      : all;
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Jobs 加载失败';
  }
}

/* ---------------- 通用：创建 job → 调 AI → 更新 job ---------------- */
/** AI 结果转纯数据快照后落库 ai_jobs（不许每次重新算）。 */
function toRecord<T>(r: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(r)) as Record<string, unknown>;
}

async function runJob<T>(
  kind: AiJobRow['kind'],
  input: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T | null> {
  if (!selectedProduct.value) {
    err.value = '请先选择一款商品';
    return null;
  }
  err.value = '';
  const pid = selectedProduct.value.id;
  let job: AiJobRow | null = null;
  try {
    job = await db.createAiJob(kind, input, [pid], actor.value);
    await db.updateAiJob(job.id, { status: 'processing' });
    const res = await fn();
    await db.updateAiJob(job.id, {
      status: 'ready',
      result: toRecord(res),
      provider: getAiService().providerName,
    });
    await loadJobs();
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (job) {
      await db.updateAiJob(job.id, { status: 'error', error: msg }).catch(() => {});
      await loadJobs();
    }
    err.value = msg;
    return null;
  }
}

/* ---------------- 1. 帧分析 ---------------- */
const analysisResult = ref<Record<string, unknown> | null>(null);
const analyzing = ref(false);
/** 模板里不许写 `as` 断言：分析结果的字段经由这几个 computed 暴露 */
const analysisShapeConf = computed<Confidence>(() =>
  analysisResult.value ? (analysisResult.value.shapeConfidence as Confidence) : 'medium',
);
const analysisColors = computed<{ name: LocalizedText }[]>(() =>
  analysisResult.value ? (analysisResult.value.colors as { name: LocalizedText }[]) : [],
);
const analysisWarnings = computed<string[]>(() =>
  analysisResult.value ? (analysisResult.value.warnings as string[]) : [],
);
async function doAnalyze() {
  if (!selectedProduct.value) return;
  analyzing.value = true;
  try {
    const res = await runJob(
      'frame_analysis',
      { trigger: 'manual', productId: selectedProduct.value.id },
      () => getAiService().analyzeFrameImage(selectedProduct.value!.id),
    );
    analysisResult.value = res as unknown as Record<string, unknown>;
  } finally {
    analyzing.value = false;
  }
}

/* ---------------- 2. 图像处理 ---------------- */
const processedRef = ref('');
const processing = ref(false);
async function doProcessImage() {
  if (!selectedProduct.value) return;
  processing.value = true;
  try {
    const images = await db.listImages(selectedProduct.value.id);
    const first = images[0];
    if (!first) {
      err.value = '该商品暂无图片';
      return;
    }
    const res = await runJob(
      'image_process',
      { trigger: 'manual', imageId: first.id },
      () => getAiService().processProductImage(first.id),
    );
    if (res) processedRef.value = res.cleanedRef;
  } finally {
    processing.value = false;
  }
}

/* ---------------- 3. OCR ---------------- */
const ocrResult = ref<TempleOcrResult | null>(null);
const ocrRunning = ref(false);
const editingOcr = ref(false);
const ocrForm = ref({ rawText: '', lensWidth: '', bridge: '', temple: '', modelNumber: '', colorCode: '' });

async function doOcr() {
  if (!selectedProduct.value) return;
  ocrRunning.value = true;
  try {
    const res = await runJob(
      'temple_ocr',
      { trigger: 'manual', productId: selectedProduct.value.id },
      () => getAiService().extractTempleText(selectedProduct.value!.id),
    );
    if (res) {
      ocrResult.value = res;
      ocrForm.value = {
        rawText: res.rawText,
        lensWidth: res.lensWidth?.toString() ?? '',
        bridge: res.bridge?.toString() ?? '',
        temple: res.temple?.toString() ?? '',
        modelNumber: res.modelNumber ?? '',
        colorCode: res.colorCode ?? '',
      };
    }
  } finally {
    ocrRunning.value = false;
  }
}

const numOrNull = (s: string): number | null => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

/** Low 置信度不许直接 confirm：必须先 Edit 填写/核对 */
const canConfirmOcr = computed(
  () => !!ocrResult.value && ocrResult.value.confidence !== 'low',
);

async function confirmOcr() {
  if (!selectedProduct.value || !ocrResult.value || !canConfirmOcr.value) return;
  const p = selectedProduct.value;
  const sizes = [
    {
      key: 'default',
      lensWidth: numOrNull(ocrForm.value.lensWidth) ?? 0,
      bridge: numOrNull(ocrForm.value.bridge) ?? 0,
      temple: numOrNull(ocrForm.value.temple) ?? 0,
    },
  ];
  const provenance = {
    ...(p.provenance ?? {}),
    'sizes': {
      provenance: 'VERIFIED' as const,
      confidence: ocrResult.value.confidence,
      confirmedBy: actor.value,
      confirmedAt: new Date().toISOString(),
    },
  };
  const updated = await db.updateProduct(p.id, { sizes, defaultSize: 'default', provenance }, actor.value);
  selectedProduct.value = updated;
  ocrResult.value = { ...ocrResult.value, provenance: 'VERIFIED' };
  editingOcr.value = false;
}

function rejectOcr() {
  ocrResult.value = null;
  editingOcr.value = false;
}

/* ---------------- 4/5. 文案生成 / 翻译 / 命名 ---------------- */
const contentResult = ref<GeneratedContent | null>(null);
const contentRunning = ref(false);
const editingName = ref(false);
const nameForm = ref<LocalizedText>(trilingual('', '', ''));
const targetLocale = ref<Locale>('es-US');

function verifiedDataOf(p: ProductRow) {
  return {
    shape: p.shape || undefined,
    colors: p.colors?.length ? p.colors : undefined,
    material: p.material?.['en-US'] ? p.material : undefined,
    measurements: p.measurements,
    styles: p.aiMeta?.['styles'] as string[] | undefined,
  };
}

async function doGenerate() {
  if (!selectedProduct.value) return;
  contentRunning.value = true;
  try {
    const res = await runJob(
      'content_generate',
      { trigger: 'manual', productId: selectedProduct.value.id },
      () => getAiService().generateProductContent(verifiedDataOf(selectedProduct.value!)),
    );
    if (res) {
      contentResult.value = res;
      nameForm.value = { ...res.name };
    }
  } finally {
    contentRunning.value = false;
  }
}

async function doRegenerate() {
  await doGenerate(); // 重新生成 = 再调一次（用户主动）
}

async function doTranslate() {
  if (!selectedProduct.value || !contentResult.value) {
    err.value = '请先生成文案再翻译';
    return;
  }
  contentRunning.value = true;
  try {
    const base = contentResult.value;
    const res = await runJob(
      'translate',
      { trigger: 'manual', target: targetLocale.value },
      () => getAiService().translateProductContent(base, targetLocale.value),
    );
    if (res) {
      const merged: GeneratedContent = { ...base };
      (['name', 'shortDescription', 'fullDescription', 'seoTitle', 'seoDescription'] as const).forEach((k) => {
        const part = res[k] as LocalizedText | undefined;
        if (part) merged[k] = { ...merged[k], ...part };
      });
      contentResult.value = merged;
      nameForm.value = { ...merged.name };
    }
  } finally {
    contentRunning.value = false;
  }
}

/**
 * Accept 命名：用户显式确认后才写入；写入时 provenance=VERIFIED（人工确认过）。
 * 绝不自动重命名现有商品——本文件没有任何自动改名的路径。
 */
async function acceptName() {
  if (!selectedProduct.value || !contentResult.value) return;
  const p = selectedProduct.value;
  const name = editingName.value ? nameForm.value : contentResult.value.name;
  const updated = await db.updateProduct(
    p.id,
    {
      name,
      provenance: {
        ...(p.provenance ?? {}),
        name: {
          provenance: 'VERIFIED',
          confirmedBy: actor.value,
          confirmedAt: new Date().toISOString(),
        },
      },
    },
    actor.value,
  );
  selectedProduct.value = updated;
  editingName.value = false;
}

/** 应用整套文案（含 SEO/tags）——同样需用户显式点击 */
async function applyContent() {
  if (!selectedProduct.value || !contentResult.value) return;
  const p = selectedProduct.value;
  const c = contentResult.value;
  const updated = await db.updateProduct(
    p.id,
    {
      name: c.name,
      description: c.fullDescription,
      tags: c.tags,
      seo: { title: c.seoTitle, description: c.seoDescription, slug: p.slug },
      provenance: {
        ...(p.provenance ?? {}),
        name: { provenance: 'VERIFIED', confirmedBy: actor.value, confirmedAt: new Date().toISOString() },
        description: { provenance: 'VERIFIED', confirmedBy: actor.value, confirmedAt: new Date().toISOString() },
      },
    },
    actor.value,
  );
  selectedProduct.value = updated;
}

/* ---------------- 6. 系列建议 ---------------- */
const collectionResult = ref<{ series: string; confidence: Confidence; reasons: string[]; mock: boolean } | null>(null);
const suggesting = ref(false);
async function doSuggestCollection() {
  if (!selectedProduct.value) return;
  suggesting.value = true;
  try {
    const res = await runJob(
      'frame_analysis',
      { trigger: 'manual-suggest-collection', productId: selectedProduct.value.id },
      () => getAiService().suggestCollection(verifiedDataOf(selectedProduct.value!)),
    );
    if (res) collectionResult.value = res;
  } finally {
    suggesting.value = false;
  }
}

onMounted(async () => {
  try {
    const session = await db.getSession();
    actor.value = session?.userId ?? 'admin';
  } catch {
    /* 无会话也可用 mock */
  }
  await searchProducts();
  await loadJobs();
});
</script>

<template>
  <div class="studio">
    <header>
      <h2>AI Studio</h2>
      <p class="muted">
        所有 AI 调用必须手动触发（页面打开不会自动调用）。
        结果落库 <code>ai_jobs</code>；mock 结果带 <span class="badge mock">MOCK</span> 标记。
      </p>
    </header>

    <p v-if="err" class="err">{{ err }}</p>

    <div class="layout">
      <!-- 左：商品选择 -->
      <aside class="panel">
        <h3>选择商品</h3>
        <div class="searchrow">
          <input v-model="productQuery" placeholder="搜索 SKU / 名称" @keyup.enter="searchProducts" />
          <button class="btn" @click="searchProducts">搜索</button>
        </div>
        <ul class="plist">
          <li
            v-for="p in products"
            :key="p.id"
            :class="{ sel: selectedProduct?.id === p.id }"
            @click="selectProduct(p)"
          >
            <strong class="mono">{{ p.sku || '（无 SKU）' }}</strong>
            <span class="muted">{{ p.name['zh-CN'] || p.name['en-US'] || '未命名' }}</span>
            <span class="badge">{{ p.status }}</span>
          </li>
        </ul>
        <p v-if="products.length === 0" class="muted">暂无商品。</p>
      </aside>

      <!-- 右：工作区 -->
      <section class="panel main">
        <div v-if="!selectedProduct" class="muted">← 先选择一款商品，再手动触发 AI 任务。</div>

        <template v-else>
          <h3>
            {{ selectedProduct.sku || '（无 SKU）' }}
            <span class="muted">{{ selectedProduct.name['zh-CN'] || selectedProduct.name['en-US'] }}</span>
          </h3>

          <!-- 手动触发按钮组 -->
          <div class="triggers">
            <button class="btn" :disabled="analyzing" @click="doAnalyze">
              {{ analyzing ? '分析中…' : '🔍 Analyze 帧分析' }}
            </button>
            <button class="btn" :disabled="processing" @click="doProcessImage">
              {{ processing ? '处理中…' : '🖼 Process Image 图像处理' }}
            </button>
            <button class="btn" :disabled="ocrRunning" @click="doOcr">
              {{ ocrRunning ? '识别中…' : '🔤 OCR 镜腿文字' }}
            </button>
            <button class="btn" :disabled="contentRunning" @click="doGenerate">
              {{ contentRunning ? '生成中…' : '✍️ Generate Content 生成文案' }}
            </button>
            <button class="btn" :disabled="contentRunning" @click="doRegenerate">↻ Regenerate 重新生成</button>
            <div class="trow">
              <select v-model="targetLocale">
                <option v-for="l in LOCALES" :key="l.key" :value="l.key">{{ l.label }}</option>
              </select>
              <button class="btn" :disabled="contentRunning" @click="doTranslate">🌐 Translate 翻译</button>
            </div>
            <button class="btn" :disabled="suggesting" @click="doSuggestCollection">
              {{ suggesting ? '建议中…' : '🏷 Suggest Collection 系列建议' }}
            </button>
          </div>

          <!-- 帧分析结果 -->
          <div v-if="analysisResult" class="result">
            <h4>帧分析结果 <span class="badge mock">MOCK</span></h4>
            <p>
              provenance <strong>{{ PROVENANCE_LABEL['AI_SUGGESTED'] }}</strong>
              · shape 建议 <strong>{{ analysisResult.shape }}</strong>
              ({{ CONFIDENCE_LABEL[analysisShapeConf] }})
            </p>
            <p class="muted">颜色建议：{{ analysisColors.map((c) => c.name['zh-CN']).join('、') }}</p>
            <ul class="muted">
              <li v-for="w in analysisWarnings" :key="w">{{ w }}</li>
            </ul>
          </div>

          <!-- 图像处理结果 -->
          <div v-if="processedRef" class="result">
            <h4>图像处理 <span class="badge mock">MOCK</span></h4>
            <p class="muted">
              cleaned 为原图占位（mock 阶段未做真实去背 / 裁剪 / 居中 / 标准化）。
              管线：original 永久保留；marketing 图必须打标
              <code>AI GENERATED MARKETING IMAGE</code>。
            </p>
            <p class="mono">{{ processedRef }}</p>
          </div>

          <!-- OCR 结果 -->
          <div v-if="ocrResult" class="result">
            <h4>
              OCR 结果
              <span class="badge ocr">{{ PROVENANCE_LABEL[ocrResult.provenance] }}</span>
              <span class="badge" :class="'conf-' + ocrResult.confidence">
                {{ CONFIDENCE_LABEL[ocrResult.confidence] }}
              </span>
              <span v-if="ocrResult.mock" class="badge mock">MOCK</span>
            </h4>
            <p class="muted">rawText：</p>
            <pre class="raw">{{ ocrResult.rawText || '（mock 未识别出文字）' }}</pre>
            <div v-if="!editingOcr" class="kv">
              <span>镜片宽 lensWidth：<strong>{{ ocrResult.lensWidth ?? '—' }}</strong></span>
              <span>鼻梁 bridge：<strong>{{ ocrResult.bridge ?? '—' }}</strong></span>
              <span>镜腿 temple：<strong>{{ ocrResult.temple ?? '—' }}</strong></span>
              <span>型号：<strong>{{ ocrResult.modelNumber ?? '—' }}</strong></span>
              <span>色号：<strong>{{ ocrResult.colorCode ?? '—' }}</strong></span>
            </div>
            <div v-else class="form">
              <label>rawText <textarea v-model="ocrForm.rawText" rows="2"></textarea></label>
              <div class="frow">
                <label>lensWidth <input v-model="ocrForm.lensWidth" inputmode="decimal" /></label>
                <label>bridge <input v-model="ocrForm.bridge" inputmode="decimal" /></label>
                <label>temple <input v-model="ocrForm.temple" inputmode="decimal" /></label>
              </div>
              <div class="frow">
                <label>型号 <input v-model="ocrForm.modelNumber" /></label>
                <label>色号 <input v-model="ocrForm.colorCode" /></label>
              </div>
            </div>
            <div class="btnrow">
              <button
                class="btn primary"
                :disabled="!canConfirmOcr"
                :title="canConfirmOcr ? '确认为 VERIFIED' : 'Low 置信度：请先 Edit 填写/核对后再确认'"
                @click="confirmOcr"
              >
                Confirm 确认
              </button>
              <button class="btn" @click="editingOcr = !editingOcr">
                {{ editingOcr ? '取消编辑' : 'Edit 编辑' }}
              </button>
              <button class="btn danger" @click="rejectOcr">Reject 驳回</button>
            </div>
            <p v-if="!canConfirmOcr" class="warnline">
              Low 置信度不许直接 Confirm——请先 Edit 手动填写并核对，确认后字段变为 VERIFIED。
            </p>
          </div>

          <!-- AI 命名 / 文案 -->
          <div v-if="contentResult" class="result">
            <h4>AI 文案 <span class="badge mock">MOCK</span>
              <span class="badge">{{ PROVENANCE_LABEL['AI_SUGGESTED'] }}</span>
            </h4>
            <div v-if="!editingName">
              <p v-for="l in LOCALES" :key="l.key" class="name-line">
                <span class="badge">{{ l.label }}</span> {{ contentResult.name[l.key] }}
              </p>
            </div>
            <div v-else class="form">
              <label v-for="l in LOCALES" :key="l.key">
                名称（{{ l.label }}）
                <input v-model="nameForm[l.key]" />
              </label>
            </div>
            <div class="btnrow">
              <button class="btn primary" @click="acceptName">Accept 采用命名</button>
              <button class="btn" @click="editingName = !editingName">
                {{ editingName ? '取消编辑' : 'Edit 编辑' }}
              </button>
              <button class="btn" @click="doRegenerate">↻ Regenerate</button>
              <button class="btn" @click="applyContent">应用整套文案（含 SEO/tags）</button>
            </div>
            <p class="warnline">绝不自动重命名现有商品——只有你点 Accept / 应用后才会写入。</p>
            <details>
              <summary>短描述 / 长描述 / SEO / tags</summary>
              <div v-for="l in LOCALES" :key="l.key" class="locale-block">
                <p><span class="badge">{{ l.label }}</span></p>
                <p class="muted">{{ contentResult.shortDescription[l.key] }}</p>
                <p class="muted">{{ contentResult.fullDescription[l.key] }}</p>
                <p class="muted">SEO：{{ contentResult.seoTitle[l.key] }} — {{ contentResult.seoDescription[l.key] }}</p>
              </div>
              <p class="muted">tags: {{ contentResult.tags.join(', ') }}</p>
            </details>
          </div>

          <!-- 系列建议 -->
          <div v-if="collectionResult" class="result">
            <h4>系列建议 <span class="badge mock">MOCK</span></h4>
            <p>
              建议系列 <strong>{{ collectionResult.series }}</strong>
              · 置信度 {{ CONFIDENCE_LABEL[collectionResult.confidence] }}
            </p>
            <ul class="muted">
              <li v-for="r in collectionResult.reasons" :key="r">{{ r }}</li>
            </ul>
            <p class="warnline">AI 只给建议，不做定价、不输出价格；系列归属由人工确认。</p>
          </div>
        </template>
      </section>
    </div>

    <!-- Jobs 历史 -->
    <section class="panel jobs">
      <h3>AI Jobs（{{ jobs.length }}）</h3>
      <p v-if="jobs.length === 0" class="muted">暂无任务。上面的按钮每点一次就会落库一条 job。</p>
      <table v-else class="dense">
        <thead>
          <tr><th>类型</th><th>状态</th><th>provider</th><th>时间</th><th>错误</th></tr>
        </thead>
        <tbody>
          <tr v-for="j in jobs" :key="j.id">
            <td class="mono">{{ j.kind }}</td>
            <td><span class="badge" :class="'st-' + j.status">{{ j.status }}</span></td>
            <td class="mono">{{ j.provider }}</td>
            <td class="muted">{{ new Date(j.createdAt).toLocaleString() }}</td>
            <td class="err">{{ j.error ?? '' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.studio { max-width: 1280px; margin: 0 auto; padding: 16px; }
.muted { color: #777; font-size: 13px; }
.err { color: #c62828; }
.mono { font-family: ui-monospace, monospace; font-size: 12px; }
.layout { display: grid; grid-template-columns: 300px 1fr; gap: 16px; margin-top: 12px; }
.panel { border: 1px solid #e3e3e3; border-radius: 12px; padding: 16px; background: #fff; }
.panel h3 { margin: 0 0 12px; }
.searchrow { display: flex; gap: 8px; margin-bottom: 10px; }
.searchrow input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
.plist { list-style: none; padding: 0; margin: 0; max-height: 480px; overflow: auto; }
.plist li { border: 1px solid #eee; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; cursor: pointer; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.plist li.sel { border-color: #1a2936; box-shadow: 0 0 0 1px #1a2936; }
.badge { background: #eee; border-radius: 10px; padding: 2px 8px; font-size: 11px; }
.badge.mock { background: #fff3cd; color: #856404; border: 1px dashed #e0a800; }
.badge.ocr { background: #e3f2fd; color: #1565c0; }
.badge.conf-high { background: #e8f5e9; color: #2e7d32; }
.badge.conf-medium { background: #fff8e1; color: #f57f00; }
.badge.conf-low { background: #ffebee; color: #c62828; }
.badge.st-ready { background: #e8f5e9; color: #2e7d32; }
.badge.st-error { background: #ffebee; color: #c62828; }
.badge.st-processing, .badge.st-queued { background: #e3f2fd; color: #1565c0; }
.badge.st-needs_review { background: #fff8e1; color: #f57f00; }
.triggers { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
.trow { display: flex; gap: 8px; align-items: center; }
.trow select { padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
.result { border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px; margin: 12px 0; background: #fcfcfc; }
.result h4 { margin: 0 0 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.raw { background: #f4f4f4; border-radius: 8px; padding: 10px; font-size: 13px; white-space: pre-wrap; }
.kv { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; margin: 8px 0; }
.form label { display: block; font-size: 13px; margin: 8px 0; }
.form input, .form textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; margin-top: 4px; }
.frow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.btnrow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936; }
.btn.danger { background: #b83227; color: #fff; border-color: #b83227; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.warnline { color: #b26a00; font-size: 12px; margin-top: 8px; }
.name-line { margin: 6px 0; font-size: 14px; }
.locale-block { border-top: 1px dashed #ddd; padding: 8px 0; }
details summary { cursor: pointer; font-size: 14px; margin: 8px 0; }
.jobs { margin-top: 16px; }
table.dense { width: 100%; border-collapse: collapse; font-size: 13px; }
table.dense th, table.dense td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
code { background: #f4f4f4; padding: 1px 6px; border-radius: 4px; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .btnrow { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
  .btnrow .btn { flex: 1; }
  .frow { grid-template-columns: 1fr; }
}
</style>
