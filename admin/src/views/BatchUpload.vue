<!--
  admin/src/views/BatchUpload.vue — 桌面批量上架（拖拽 / 多选；手机走相册多选）。
  一次 30–100 款，每款 = 一个文件 = 一个 Draft。
  文件级状态机：uploading → analyzing → ready | needs_review | error。
  - 单文件失败不阻断整批；失败项可 Retry。
  - 每款完成后立即落库（Draft + original 图 + ai_job），网络中断不丢已完成项。
  - AI 只给建议（provenance=AI_SUGGESTED），永不自动发布。
  图片管线：original 永久保留；cleaned 只做去背/裁剪/居中/标准化（mock 原图占位+标注）；
  marketing 图必须打标 "AI GENERATED MARKETING IMAGE"。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import { getAiService } from '@/lib/ai';
import type { ProductRow } from '../../../supabase/kyoto';
import PhotoCapture from '@/components/PhotoCapture.vue';

const router = useRouter();
const route = useRoute();
/** 路由约定：/upload?mode=camera 为手机拍照上架入口，渲染四步拍照组件 */
const isCameraMode = computed(() => route.query.mode === 'camera');

type FileStatus = 'queued' | 'uploading' | 'analyzing' | 'ready' | 'needs_review' | 'error';

interface BatchItem {
  id: string;
  file: File;
  thumbUrl: string;
  status: FileStatus;
  error: string;
  productId: string | null;
  note: string;
}

const CONCURRENCY = 3;
const MAX_BATCH = 100;

const items = ref<BatchItem[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
function openPicker() {
  fileInputRef.value?.click();
}

/** 模板里不许写 `as` 断言：file input 的 change 统一走这里 */
function onPickerChange(e: Event) {
  const input = e.target as HTMLInputElement;
  addFiles(input.files);
  input.value = '';
}
const running = ref(false);
const dragOver = ref(false);
const doneCount = computed(() => items.value.filter((i) => ['ready', 'needs_review'].includes(i.status)).length);
const errorCount = computed(() => items.value.filter((i) => i.status === 'error').length);
const progress = computed(() =>
  items.value.length === 0 ? 0 : Math.round((doneCount.value / items.value.length) * 100),
);

const STATUS_LABEL: Record<FileStatus, string> = {
  queued: '排队',
  uploading: '上传中',
  analyzing: 'AI 分析中',
  ready: '就绪',
  needs_review: '待人工审核',
  error: '失败',
};

function addFiles(files: FileList | File[] | null) {
  if (!files) return;
  const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (items.value.length + incoming.length > MAX_BATCH) {
    alert(`一批最多 ${MAX_BATCH} 款，当前已选 ${items.value.length}，请分批上传。`);
    return;
  }
  for (const file of incoming) {
    items.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      thumbUrl: URL.createObjectURL(file),
      status: 'queued',
      error: '',
      productId: null,
      note: '',
    });
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  dragOver.value = false;
  addFiles(e.dataTransfer?.files ?? null);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('读取图片失败'));
    r.readAsDataURL(file);
  });
}

function probeSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/** 单款管线：Draft → original 图 → AI 分析(只建议) → ai_job 落库 */
async function processItem(item: BatchItem, actor: string) {
  item.status = 'uploading';
  item.error = '';
  try {
    const dataUrl = await fileToDataUrl(item.file);
    const { width, height } = await probeSize(dataUrl);

    const draft: Partial<ProductRow> = {
      status: 'draft',
      name: { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      collectionName: '',
      provenance: {},
    };
    const product = await db.createProduct(draft, actor);
    item.productId = product.id;

    await db.addImage(
      product.id,
      {
        name: item.file.name,
        dataUrl,
        bytes: item.file.size,
        width: width || undefined,
        height: height || undefined,
      },
      { kind: 'original', role: 'other', provenance: 'MANUAL' },
      actor,
    );

    item.status = 'analyzing';
    const ai = getAiService();
    let analysisNote = '';
    try {
      const res = await ai.analyzeFrameImage(product.id);
      // 只写入 AI_SUGGESTED 建议字段；SKU/尺寸/材质/库存/成本/供应商永不由 AI 填写
      const patch: Partial<ProductRow> = {
        shape: res.shape,
        colors: res.colors.map((c) => ({ key: c.key, hex: c.hex, name: c.name })),
        provenance: {
          shape: { provenance: 'AI_SUGGESTED', confidence: res.shapeConfidence },
          colors: { provenance: 'AI_SUGGESTED', confidence: 'medium' },
        },
      };
      await db.updateProduct(product.id, patch, actor);
      item.status = res.shapeConfidence === 'low' ? 'needs_review' : 'ready';
      analysisNote = res.warnings.join(' ');
    } catch (aiErr) {
      // AI 失败不阻断：Draft 与原图已落库，标记待人工审核
      item.status = 'needs_review';
      analysisNote = `AI 分析失败（已保留 Draft）：${aiErr instanceof Error ? aiErr.message : String(aiErr)}`;
    }

    await db.createAiJob(
      'frame_analysis',
      { source: 'batch_upload', fileName: item.file.name, note: analysisNote },
      [product.id],
      actor,
    );
    item.note = analysisNote;
  } catch (e) {
    item.status = 'error';
    item.error = e instanceof Error ? e.message : '处理失败';
  }
}

async function startBatch() {
  if (running.value) return;
  const pending = items.value.filter((i) => i.status === 'queued' || i.status === 'error');
  if (pending.length === 0) return;
  running.value = true;
  try {
    const session = await db.getSession();
    const actor = session?.userId ?? 'admin';
    // 有限并发；单个失败不阻断整批
    const queue = [...pending];
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) await processItem(item, actor);
      }
    });
    await Promise.all(workers);
  } finally {
    running.value = false;
  }
}

function retryItem(item: BatchItem) {
  item.status = 'queued';
  item.error = '';
  void startBatch();
}

function clearFinished() {
  for (const i of items.value) URL.revokeObjectURL(i.thumbUrl);
  items.value = [];
}

function goReview() {
  void router.push('/review');
}
</script>

<template>
  <!-- 手机拍照入口：/upload?mode=camera -->
  <PhotoCapture v-if="isCameraMode" />
  <div v-else class="bu">
    <header>
      <h2>批量上传</h2>
      <p class="muted">一次 30–100 款（每款一张主图）。每款生成 Draft + original 图 + AI 分析任务，结果即时落库。</p>
    </header>

    <!-- 拖拽区（桌面）/ 文件选择（手机走相册多选） -->
    <div
      class="dropzone"
      :class="{ over: dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop="onDrop"
      @click="openPicker"
    >
      <p>📥 拖拽图片到这里，或点击选择（可多选）</p>
      <p class="muted">手机端将打开相册多选</p>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        hidden
        @change="onPickerChange"
      />
    </div>

    <div v-if="items.length" class="toolbar">
      <div class="progress">
        <div class="bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="toolbar-row">
        <span>{{ doneCount }} / {{ items.length }} 完成 · {{ errorCount }} 失败</span>
        <div class="btns">
          <button class="btn primary" :disabled="running" @click="startBatch">
            {{ running ? '处理中…' : '开始上架' }}
          </button>
          <button class="btn" :disabled="running" @click="clearFinished">清空</button>
          <button class="btn" @click="goReview">去 Review →</button>
        </div>
      </div>
    </div>

    <ul class="grid">
      <li v-for="item in items" :key="item.id" :class="['card', item.status]">
        <img :src="item.thumbUrl" alt="待上架图片" />
        <div class="meta">
          <p class="name" :title="item.file.name">{{ item.file.name }}</p>
          <p class="status">{{ STATUS_LABEL[item.status] }}</p>
          <p v-if="item.error" class="err">{{ item.error }}</p>
          <p v-if="item.note" class="muted note">{{ item.note }}</p>
        </div>
        <button
          v-if="item.status === 'error'"
          class="btn retry"
          :disabled="running"
          @click="retryItem(item)"
        >
          Retry
        </button>
      </li>
    </ul>

    <aside class="pipeline-note">
      <strong>图片管线说明</strong>
      <ul>
        <li>original 原图永久保留，可查看 / 下载 / 恢复。</li>
        <li>cleaned 只做去背 / 裁剪 / 居中 / 标准化；mock 阶段用原图占位并标注。</li>
        <li>marketing 图必须打标 <code>AI GENERATED MARKETING IMAGE</code>。</li>
        <li>已完成项已写入数据库：网络中断不会丢失，失败项可单独 Retry。</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.bu { max-width: 1080px; margin: 0 auto; padding: 16px; }
.muted { color: #777; font-size: 13px; }
.dropzone {
  border: 2px dashed #bbb; border-radius: 12px; padding: 36px 16px; text-align: center;
  cursor: pointer; background: #fafafa; margin: 16px 0;
}
.dropzone.over { border-color: #1a2936; background: #f0f4f8; }
.toolbar { margin-bottom: 12px; }
.progress { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.bar { height: 100%; background: #1a2936; transition: width 0.3s; }
.toolbar-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; flex-wrap: wrap; gap: 8px; }
.btns { display: flex; gap: 8px; }
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.card { border: 1px solid #e3e3e3; border-radius: 10px; overflow: hidden; background: #fff; position: relative; }
.card img { width: 100%; height: 140px; object-fit: cover; display: block; }
.card .meta { padding: 8px 10px; }
.name { font-size: 12px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status { font-size: 12px; font-weight: 700; margin: 4px 0 0; }
.card.uploading .status, .card.analyzing .status { color: #1565c0; }
.card.ready .status { color: #2e7d32; }
.card.needs_review .status { color: #ef6c00; }
.card.error .status { color: #c62828; }
.card.ready { border-color: #9ccc9c; }
.card.error { border-color: #ef9a9a; }
.err { color: #c62828; font-size: 12px; margin: 4px 0 0; }
.note { margin: 4px 0 0; }
.retry { position: absolute; top: 8px; right: 8px; }
.pipeline-note { margin-top: 20px; font-size: 12px; color: #666; background: #faf7f2; border: 1px dashed #ccc; border-radius: 8px; padding: 10px 14px; }
.pipeline-note ul { margin: 6px 0 0; padding-left: 18px; }
.pipeline-note code { background: #eee; padding: 1px 4px; border-radius: 4px; }
@media (max-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .toolbar-row { flex-direction: column; align-items: stretch; }
  .btns { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
  .btns .btn { flex: 1; }
}
</style>
