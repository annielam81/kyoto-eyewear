<!--
  admin/src/components/PhotoCapture.vue — 手机拍照上架（四步）。
  正面 → 45° → 侧面 → 镜腿。每步可 Skip；可"从相册选"(<input type=file accept=image/*>)
  或"拍照"(加 capture="environment")；一步可拍多张。
  完成后：provider.createProduct 建 Draft → addImage(kind='original', provenance='MANUAL')
  → createAiJob('frame_analysis') → 跳转 /review。
  由 BatchUpload.vue 在 ?mode=camera 时渲染（路由注释约定）。
  图片管线：original 永久保留（查看/下载/恢复）；cleaned 只做去背/裁剪/居中/标准化
  （mock 阶段用原图占位并标注）；marketing 图必须打标 "AI GENERATED MARKETING IMAGE"。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type { ImageRole, ProductRow } from '../../../supabase/kyoto';

const emit = defineEmits<{ (e: 'done', productId: string): void }>();
const router = useRouter();

interface StepDef {
  key: ImageRole;
  label: string;
  hint: string;
}
const STEPS: StepDef[] = [
  { key: 'front', label: '正面', hint: '镜架正面平视，居中' },
  { key: 'angle45', label: '45°', hint: '斜 45° 展示镜框弧度' },
  { key: 'side', label: '侧面', hint: '侧面展示镜腿与铰链' },
  { key: 'temple', label: '镜腿', hint: '镜腿内侧文字（供 OCR），尽量清晰' },
];

interface PickedPhoto {
  id: string;
  file: File;
  url: string; // 本地预览
  dataUrl: string;
  width: number;
  height: number;
}

const stepIndex = ref(0);
const photos = ref<Record<ImageRole, PickedPhoto[]>>({
  front: [],
  angle45: [],
  side: [],
  temple: [],
  other: [],
});
const submitting = ref(false);
const errorMsg = ref('');
const fileInputs = ref<Record<string, HTMLInputElement | null>>({});
function setInputRef(which: 'camera' | 'album', role: ImageRole, el: unknown) {
  if (el instanceof HTMLInputElement) {
    fileInputs.value[`${which}-${role}`] = el;
  }
}

const step = computed(() => STEPS[stepIndex.value]);
const totalPhotos = computed(() =>
  (Object.keys(photos.value) as ImageRole[]).reduce((n, k) => n + photos.value[k].length, 0),
);
const skippedCount = computed(
  () => STEPS.filter((s) => photos.value[s.key].length === 0).length,
);

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

async function onFiles(role: ImageRole, files: FileList | null) {
  if (!files || files.length === 0) return;
  errorMsg.value = '';
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const dataUrl = await fileToDataUrl(file);
      const { width, height } = await probeSize(dataUrl);
      photos.value[role].push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
        dataUrl,
        width,
        height,
      });
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : '图片处理失败';
    }
  }
}

function removePhoto(role: ImageRole, id: string) {
  const list = photos.value[role];
  const i = list.findIndex((p) => p.id === id);
  if (i >= 0) {
    URL.revokeObjectURL(list[i].url);
    list.splice(i, 1);
  }
}

function skipStep() {
  if (stepIndex.value < STEPS.length - 1) stepIndex.value += 1;
}
function prevStep() {
  if (stepIndex.value > 0) stepIndex.value -= 1;
}
function nextStep() {
  if (stepIndex.value < STEPS.length - 1) stepIndex.value += 1;
}

function triggerInput(which: 'camera' | 'album', role: ImageRole) {
  fileInputs.value[`${which}-${role}`]?.click();
}

/** 模板里不许写 `as` 断言：file input 的 change 统一走这里 */
function onInputChange(role: ImageRole, e: Event) {
  const input = e.target as HTMLInputElement;
  void onFiles(role, input.files);
  input.value = ''; // 允许重复选择同一文件
}

/** 完成：建 Draft + original 图 + frame_analysis job → /review */
async function finish() {
  if (submitting.value) return;
  submitting.value = true;
  errorMsg.value = '';
  try {
    const session = await db.getSession();
    const actor = session?.userId ?? 'admin';
    const draft: Partial<ProductRow> = {
      status: 'draft',
      name: { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      collectionName: '',
    };
    const product = await db.createProduct(draft, actor);

    const roles = STEPS.map((s) => s.key).filter((k) => photos.value[k].length > 0);
    let imageCount = 0;
    for (const role of roles) {
      for (const p of photos.value[role]) {
        await db.addImage(
          product.id,
          {
            name: p.file.name || `${role}.jpg`,
            dataUrl: p.dataUrl,
            bytes: p.file.size,
            width: p.width || undefined,
            height: p.height || undefined,
          },
          { kind: 'original', role, provenance: 'MANUAL' },
          actor,
        );
        imageCount += 1;
      }
    }

    // AI 帧分析任务：只建 job、不自动改状态、不自动发布
    await db.createAiJob(
      'frame_analysis',
      { source: 'photo_capture', roles, imageCount, skipped: STEPS.length - roles.length },
      [product.id],
      actor,
    );

    emit('done', product.id);
    await router.push('/review');
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '提交失败，请重试';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="pc">
    <header class="pc-head">
      <h2>拍照上架</h2>
      <p class="muted">四步拍摄同一款镜架，完成后生成 Draft 并进入 Review。</p>
    </header>

    <!-- 步骤指示 -->
    <ol class="steps">
      <li
        v-for="(s, i) in STEPS"
        :key="s.key"
        :class="{ active: i === stepIndex, done: photos[s.key].length > 0 }"
        @click="stepIndex = i"
      >
        <span class="dot">{{ photos[s.key].length > 0 ? '✓' : i + 1 }}</span>
        <span class="lbl">{{ s.label }}</span>
      </li>
    </ol>

    <section class="card">
      <h3>第 {{ stepIndex + 1 }} 步：{{ step.label }}</h3>
      <p class="muted">{{ step.hint }}</p>

      <!-- 已选照片 -->
      <div v-if="photos[step.key].length" class="thumbs">
        <figure v-for="p in photos[step.key]" :key="p.id">
          <img :src="p.url" alt="已选照片" />
          <button type="button" class="rm" @click="removePhoto(step.key, p.id)" aria-label="删除">×</button>
        </figure>
      </div>
      <p v-else class="muted empty">本步暂无照片（可跳过，也可拍多张）。</p>

      <div class="actions">
        <button type="button" class="btn primary" @click="triggerInput('camera', step.key)">
          📷 拍照
        </button>
        <button type="button" class="btn" @click="triggerInput('album', step.key)">
          🖼 从相册选
        </button>
        <button type="button" class="btn ghost" @click="skipStep">跳过本步 →</button>
      </div>

      <!-- 隐藏的 file input：拍照加 capture="environment"，相册不加 -->
      <input
        :ref="(el) => setInputRef('camera', step.key, el)"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        @change="onInputChange(step.key, $event)"
      />
      <input
        :ref="(el) => setInputRef('album', step.key, el)"
        type="file"
        accept="image/*"
        multiple
        hidden
        @change="onInputChange(step.key, $event)"
      />
    </section>

    <nav class="pager">
      <button type="button" class="btn" :disabled="stepIndex === 0" @click="prevStep">← 上一步</button>
      <span class="muted">{{ totalPhotos }} 张已选 · {{ skippedCount }} 步跳过</span>
      <button
        v-if="stepIndex < STEPS.length - 1"
        type="button"
        class="btn"
        @click="nextStep"
      >
        下一步 →
      </button>
      <button
        v-else
        type="button"
        class="btn primary"
        :disabled="submitting || totalPhotos === 0"
        @click="finish"
      >
        {{ submitting ? '提交中…' : `完成上架（${totalPhotos} 张）` }}
      </button>
    </nav>

    <p v-if="errorMsg" class="err">{{ errorMsg }}</p>

    <aside class="pipeline-note">
      <strong>图片管线说明</strong>
      <ul>
        <li>original 原图永久保留，可查看 / 下载 / 恢复。</li>
        <li>cleaned 只做去背 / 裁剪 / 居中 / 标准化；mock 阶段用原图占位并标注。</li>
        <li>marketing 图必须打标 <code>AI GENERATED MARKETING IMAGE</code>。</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.pc { max-width: 560px; margin: 0 auto; padding: 16px; }
.pc-head h2 { margin: 0 0 4px; }
.muted { color: #777; font-size: 13px; }
.steps { display: flex; gap: 8px; list-style: none; padding: 0; margin: 16px 0; }
.steps li {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px; border: 1px solid #ddd; border-radius: 10px; cursor: pointer;
  font-size: 13px; background: #fff;
}
.steps li.active { border-color: #1a2936; box-shadow: 0 0 0 1px #1a2936; }
.steps li.done { background: #eef7ee; border-color: #9ccc9c; }
.dot {
  width: 26px; height: 26px; border-radius: 50%; background: #eee;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.steps li.done .dot { background: #4caf50; color: #fff; }
.card { border: 1px solid #e3e3e3; border-radius: 12px; padding: 16px; background: #fff; }
.card h3 { margin: 0 0 4px; }
.thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.thumbs figure { position: relative; margin: 0; width: 96px; height: 96px; }
.thumbs img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
.rm {
  position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%;
  border: none; background: #d32f2f; color: #fff; font-size: 16px; line-height: 1; cursor: pointer;
}
.empty { padding: 12px 0; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.btn {
  border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 10px 14px;
  font-size: 14px; cursor: pointer;
}
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936; }
.btn.ghost { border-style: dashed; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pager {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-top: 16px;
}
.err { color: #c62828; margin-top: 12px; }
.pipeline-note {
  margin-top: 20px; font-size: 12px; color: #666; background: #faf7f2;
  border: 1px dashed #ccc; border-radius: 8px; padding: 10px 14px;
}
.pipeline-note ul { margin: 6px 0 0; padding-left: 18px; }
.pipeline-note code { background: #eee; padding: 1px 4px; border-radius: 4px; }
</style>
