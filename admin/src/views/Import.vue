<!--
  admin/src/views/Import.vue — 供应商 Excel/CSV 导入。
  流程：上传表格 → xlsx 解析 → Column Mapping（自动 suggest + 用户确认，可存为
  supplier_templates）→ 上传照片 → 按 SKU/型号/文件名自动匹配分组
  （如 88005-C1-front.jpg → SKU 88005-C1）→ 匹配失败进人工匹配（两列点选）
  → 生成 drafts。整批不因个别失败中断。
  依赖：xlsx（需在 admin/package.json 中声明；本文件无权修改 package.json，
  若脚手架专员未加入该依赖，构建会失败——见最终报告）。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type {
  LocalizedText,
  ProductColor,
  ProductRow,
  SupplierTemplateRow,
} from '../../../supabase/kyoto';

const router = useRouter();

/* ---------------- 目标字段 ---------------- */
const TARGET_FIELDS = [
  { key: 'ignore', label: '忽略' },
  { key: 'sku', label: 'SKU（必填）' },
  { key: 'model', label: '型号（用于照片匹配）' },
  { key: 'color', label: '颜色' },
  { key: 'material', label: '材质' },
  { key: 'a', label: '镜片宽 A' },
  { key: 'b', label: '镜框高 B' },
  { key: 'dbl', label: '鼻梁 DBL' },
  { key: 'temple', label: '镜腿长' },
  { key: 'ed', label: '总宽 ED' },
  { key: 'cost', label: '成本' },
  { key: 'quantity', label: '数量（入库）' },
] as const;
type TargetKey = (typeof TARGET_FIELDS)[number]['key'];

/* ---------------- 状态 ---------------- */
type Phase = 'upload' | 'mapping' | 'photos' | 'match' | 'result';
const phase = ref<Phase>('upload');
const headers = ref<string[]>([]);
const rows = ref<Record<string, string>[]>([]);
const mapping = ref<Record<string, TargetKey>>({});
const fileName = ref('');
const err = ref('');

// 照片
interface PhotoItem {
  id: string;
  file: File;
  name: string;
  thumbUrl: string;
  matchedRow: number | null; // 自动/人工匹配到的 rows 下标
  autoMatched: boolean;
}
const photos = ref<PhotoItem[]>([]);

// 人工匹配
const selectedPhoto = ref<string | null>(null);

// 结果
interface RowResult {
  rowIndex: number;
  sku: string;
  ok: boolean;
  error: string;
  productId: string | null;
  photoCount: number;
}
const results = ref<RowResult[]>([]);
const importing = ref(false);

// 模板
const templates = ref<SupplierTemplateRow[]>([]);
const templateName = ref('');
const selectedTemplateId = ref('');

const doneCount = computed(() => results.value.filter((r) => r.ok).length);
const failCount = computed(() => results.value.filter((r) => !r.ok).length);
const unmatchedPhotos = computed(() => photos.value.filter((p) => p.matchedRow === null));

/* ---------------- 1. 解析表格 ---------------- */
async function onTableFile(e: Event) {
  err.value = '';
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  fileName.value = file.name;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
    if (aoa.length < 2) throw new Error('表格至少需要表头 + 1 行数据');
    const hdrs = (aoa[0] as string[]).map((h) => String(h ?? '').trim());
    headers.value = hdrs;
    rows.value = (aoa.slice(1) as string[][])
      .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
      .map((r) => {
        const obj: Record<string, string> = {};
        hdrs.forEach((h, i) => {
          obj[h] = String(r[i] ?? '').trim();
        });
        return obj;
      });
    autoSuggestMapping();
    await loadTemplates();
    phase.value = 'mapping';
  } catch (ex) {
    err.value = ex instanceof Error ? ex.message : '解析失败';
  } finally {
    input.value = '';
  }
}

/** 自动 suggest：按表头关键字猜测目标字段 */
function autoSuggestMapping() {
  const m: Record<string, TargetKey> = {};
  for (const h of headers.value) {
    const k = h.toLowerCase().replace(/[\s_\-]+/g, '');
    let guess: TargetKey = 'ignore';
    if (/^(sku|货号|款号|编号)/.test(k)) guess = 'sku';
    else if (/(型号|model|style)/.test(k)) guess = 'model';
    else if (/(颜色|色号|color|colour)/.test(k)) guess = 'color';
    else if (/(材质|material)/.test(k)) guess = 'material';
    else if (/^(a|镜片宽|镜框宽|52|lenswidth)/.test(k)) guess = 'a';
    else if (/^(b|镜框高|镜片高)/.test(k)) guess = 'b';
    else if (/(dbl|鼻梁|bridge)/.test(k)) guess = 'dbl';
    else if (/(镜腿|temple|脚)/.test(k)) guess = 'temple';
    else if (/(总宽|^ed$)/.test(k)) guess = 'ed';
    else if (/(成本|进价|cost|price)/.test(k)) guess = 'cost';
    else if (/(数量|库存|qty|quantity|stock)/.test(k)) guess = 'quantity';
    m[h] = guess;
  }
  mapping.value = m;
}

async function loadTemplates() {
  try {
    templates.value = await db.listSupplierTemplates();
  } catch {
    templates.value = [];
  }
}

function applyTemplate() {
  const t = templates.value.find((x) => x.id === selectedTemplateId.value);
  if (!t) return;
  const m: Record<string, TargetKey> = {};
  for (const h of headers.value) {
    m[h] = (t.mapping[h] as TargetKey) ?? 'ignore';
  }
  mapping.value = m;
}

async function saveTemplate() {
  if (!templateName.value.trim()) {
    alert('请先填写模板名称');
    return;
  }
  try {
    const session = await db.getSession();
    const actor = session?.userId ?? 'admin';
    const saved = await db.saveSupplierTemplate(
      templateName.value.trim(),
      { ...mapping.value },
      actor,
    );
    templates.value.push(saved);
    templateName.value = '';
    alert('模板已保存');
  } catch (e) {
    alert(e instanceof Error ? e.message : '保存失败');
  }
}

function mappingValid(): boolean {
  return Object.values(mapping.value).includes('sku');
}

/* ---------------- 2. 照片上传与自动匹配 ---------------- */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s_\-]+/g, '');
}

/** 行标识：sku 优先，其次 model（用于照片匹配） */
function rowKeys(rowIndex: number): string[] {
  const row = rows.value[rowIndex];
  const keys: string[] = [];
  for (const h of headers.value) {
    const t = mapping.value[h];
    if ((t === 'sku' || t === 'model') && row[h]) keys.push(norm(row[h]));
  }
  return keys.filter(Boolean);
}

/** 自动匹配：文件名包含某行 sku/model（取最长匹配），如 88005-C1-front.jpg → 88005-C1 */
function autoMatch() {
  for (const p of photos.value) {
    const fname = norm(p.name.replace(/\.[a-z0-9]+$/i, ''));
    let best: number | null = null;
    let bestLen = 0;
    rows.value.forEach((_, ri) => {
      for (const key of rowKeys(ri)) {
        if (key && fname.includes(key) && key.length > bestLen) {
          best = ri;
          bestLen = key.length;
        }
      }
    });
    p.matchedRow = best;
    p.autoMatched = best !== null;
  }
}

function onPhotoFiles(files: FileList | null) {
  if (!files) return;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    photos.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      thumbUrl: URL.createObjectURL(file),
      matchedRow: null,
      autoMatched: false,
    });
  }
  autoMatch();
}

/** 模板里不许写 `as` 断言：照片 input 的 change 统一走这里 */
function onPhotoInput(e: Event) {
  const input = e.target as HTMLInputElement;
  onPhotoFiles(input.files);
  input.value = '';
}

/** 人工匹配：先点照片，再点行 */
function pickPhoto(id: string) {
  selectedPhoto.value = selectedPhoto.value === id ? null : id;
}
function assignRow(rowIndex: number) {
  if (!selectedPhoto.value) return;
  const p = photos.value.find((x) => x.id === selectedPhoto.value);
  if (p) {
    p.matchedRow = rowIndex;
    p.autoMatched = false;
  }
  selectedPhoto.value = null;
}
function unassignPhoto(id: string) {
  const p = photos.value.find((x) => x.id === id);
  if (p) {
    p.matchedRow = null;
    p.autoMatched = false;
  }
}

/* ---------------- 3. 生成 drafts ---------------- */
function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function buildColor(raw: string): ProductColor[] {
  if (!raw) return [];
  const hexGuess = raw.match(/#[0-9a-fA-F]{3,6}/)?.[0] ?? '#888888';
  return [
    {
      key: norm(raw).slice(0, 32) || 'custom',
      hex: hexGuess,
      name: { 'en-US': raw, 'zh-CN': raw, 'es-US': raw } as LocalizedText,
    },
  ];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('读取图片失败'));
    r.readAsDataURL(file);
  });
}

async function runImport() {
  if (importing.value) return;
  importing.value = true;
  results.value = [];
  try {
    const session = await db.getSession();
    const actor = session?.userId ?? 'admin';
    const createdIds: string[] = [];

    for (let ri = 0; ri < rows.value.length; ri++) {
      const row = rows.value[ri];
      const res: RowResult = { rowIndex: ri, sku: '', ok: false, error: '', productId: null, photoCount: 0 };
      try {
        // 按 mapping 取值
        const val = (target: TargetKey): string => {
          const h = headers.value.find((hh) => mapping.value[hh] === target);
          return h ? row[h] ?? '' : '';
        };
        const sku = val('sku').trim();
        res.sku = sku;
        if (!sku) throw new Error('缺少 SKU（mapping 中未指定或该行 SKU 为空）');

        const draft: Partial<ProductRow> = {
          status: 'draft',
          sku,
          slug: norm(sku),
          name: { 'en-US': '', 'zh-CN': '', 'es-US': '' },
          collectionName: '',
          colors: buildColor(val('color')),
          material: val('material')
            ? ({ 'en-US': val('material'), 'zh-CN': val('material'), 'es-US': val('material') } as LocalizedText)
            : undefined,
          measurements: {
            ...(parseNum(val('a')) !== null ? { a: parseNum(val('a'))! } : {}),
            ...(parseNum(val('b')) !== null ? { b: parseNum(val('b'))! } : {}),
            ...(parseNum(val('dbl')) !== null ? { dbl: parseNum(val('dbl'))! } : {}),
            ...(parseNum(val('temple')) !== null ? { temple: parseNum(val('temple'))! } : {}),
            ...(parseNum(val('ed')) !== null ? { ed: parseNum(val('ed'))! } : {}),
          },
          cost: parseNum(val('cost')),
          supplier: fileName.value || 'supplier import',
          provenance: {
            sku: { provenance: 'IMPORTED' },
            colors: { provenance: 'IMPORTED' },
            material: { provenance: 'IMPORTED' },
            measurements: { provenance: 'IMPORTED' },
            cost: { provenance: 'IMPORTED' },
          },
        };
        const product = await db.createProduct(draft, actor);
        res.productId = product.id;
        createdIds.push(product.id);

        // 数量 → 入库
        const qty = parseNum(val('quantity'));
        if (qty !== null && qty > 0) {
          await db.adjustInventory(product.id, qty, `supplier import: ${fileName.value}`, actor);
        }

        // 匹配到的照片
        const matched = photos.value.filter((p) => p.matchedRow === ri);
        for (const p of matched) {
          const dataUrl = await fileToDataUrl(p.file);
          await db.addImage(
            product.id,
            { name: p.name, dataUrl, bytes: p.file.size },
            { kind: 'original', role: 'other', provenance: 'IMPORTED' },
            actor,
          );
          res.photoCount += 1;
        }
        res.ok = true;
      } catch (e) {
        // 个别失败不中断整批
        res.ok = false;
        res.error = e instanceof Error ? e.message : String(e);
      }
      results.value.push(res);
    }

    await db.createAiJob(
      'batch_import',
      {
        source: 'supplier_import',
        fileName: fileName.value,
        total: rows.value.length,
        ok: doneCount.value,
        failed: failCount.value,
      },
      createdIds,
      actor,
    );
    phase.value = 'result';
  } finally {
    importing.value = false;
  }
}

function resetAll() {
  phase.value = 'upload';
  headers.value = [];
  rows.value = [];
  mapping.value = {};
  for (const p of photos.value) URL.revokeObjectURL(p.thumbUrl);
  photos.value = [];
  results.value = [];
  err.value = '';
}

function goReview() {
  void router.push('/review');
}
</script>

<template>
  <div class="imp">
    <header>
      <h2>供应商导入</h2>
      <p class="muted">Excel / CSV → 列映射 → 照片匹配 → 生成 Draft。个别失败不中断整批。</p>
    </header>

    <ol class="phase-bar">
      <li :class="{ active: phase === 'upload' }">1 上传表格</li>
      <li :class="{ active: phase === 'mapping' }">2 列映射</li>
      <li :class="{ active: phase === 'photos' || phase === 'match' }">3 照片匹配</li>
      <li :class="{ active: phase === 'result' }">4 结果</li>
    </ol>

    <p v-if="err" class="err">{{ err }}</p>

    <!-- 1. 上传 -->
    <section v-if="phase === 'upload'" class="card">
      <h3>上传供应商表格（.xlsx / .csv）</h3>
      <input type="file" accept=".xlsx,.xls,.csv" @change="onTableFile" />
      <p class="muted">表头示例：SKU / 型号 / 颜色 / 材质 / A / B / DBL / 镜腿 / 成本 / 数量</p>
    </section>

    <!-- 2. 列映射 -->
    <section v-if="phase === 'mapping'" class="card">
      <h3>列映射（{{ rows.length }} 行数据）</h3>

      <div class="tpl-row">
        <select v-model="selectedTemplateId" @change="applyTemplate">
          <option value="">— 套用已存模板 —</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <input v-model="templateName" placeholder="模板名称（如：XX眼镜厂）" />
        <button class="btn" @click="saveTemplate">保存为模板</button>
      </div>

      <table class="dense">
        <thead>
          <tr><th>表格列</th><th>示例值</th><th>映射到</th></tr>
        </thead>
        <tbody>
          <tr v-for="h in headers" :key="h">
            <td><code>{{ h }}</code></td>
            <td class="muted">{{ rows[0]?.[h] ?? '' }}</td>
            <td>
              <select v-model="mapping[h]">
                <option v-for="f in TARGET_FIELDS" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!mappingValid()" class="err">必须指定 SKU 列才能继续。</p>
      <div class="row-btns">
        <button class="btn" @click="phase = 'upload'">← 重新上传</button>
        <button class="btn primary" :disabled="!mappingValid()" @click="phase = 'photos'">
          下一步：上传照片 →
        </button>
      </div>
    </section>

    <!-- 3. 照片匹配 -->
    <section v-if="phase === 'photos' || phase === 'match'" class="card">
      <h3>上传照片并匹配</h3>
      <p class="muted">
        自动匹配规则：文件名包含某行的 SKU / 型号即归组
        （如 <code>88005-C1-front.jpg</code> → SKU <code>88005-C1</code>）。
        未匹配的照片在下方人工匹配：先点照片，再点对应行。
      </p>
      <input type="file" accept="image/*" multiple @change="onPhotoInput" />

      <div class="match-cols">
        <div>
          <h4>照片（{{ photos.length }}，未匹配 {{ unmatchedPhotos.length }}）</h4>
          <ul class="plist">
            <li
              v-for="p in photos"
              :key="p.id"
              :class="{ sel: selectedPhoto === p.id, matched: p.matchedRow !== null }"
              @click="pickPhoto(p.id)"
            >
              <img :src="p.thumbUrl" alt="" />
              <div>
                <p class="fname">{{ p.name }}</p>
                <p class="muted">
                  {{ p.matchedRow !== null
                    ? `${p.autoMatched ? '自动' : '人工'}匹配 → 行 ${p.matchedRow + 1}`
                    : '未匹配（点击选中，再点右侧行）' }}
                </p>
              </div>
              <button v-if="p.matchedRow !== null" class="btn xs" @click.stop="unassignPhoto(p.id)">解除</button>
            </li>
          </ul>
        </div>
        <div>
          <h4>数据行（{{ rows.length }}）</h4>
          <ul class="rlist">
            <li
              v-for="(_, ri) in rows"
              :key="ri"
              :class="{ can: !!selectedPhoto }"
              @click="assignRow(ri)"
            >
              <strong>行 {{ ri + 1 }}</strong>
              <span class="muted">{{ rowKeys(ri).join(' / ') || '（无 SKU/型号）' }}</span>
              <span class="badge">{{ photos.filter((p) => p.matchedRow === ri).length }} 张</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="row-btns">
        <button class="btn" @click="phase = 'mapping'">← 返回映射</button>
        <button class="btn primary" :disabled="importing" @click="runImport">
          {{ importing ? '导入中…' : `生成 Draft（${rows.length} 行）` }}
        </button>
      </div>
    </section>

    <!-- 4. 结果 -->
    <section v-if="phase === 'result'" class="card">
      <h3>导入结果：{{ doneCount }} 成功 / {{ failCount }} 失败</h3>
      <ul class="rlist">
        <li v-for="r in results" :key="r.rowIndex" :class="{ fail: !r.ok }">
          <strong>行 {{ r.rowIndex + 1 }}</strong>
          <span class="muted">{{ r.sku || '（无 SKU）' }} · {{ r.photoCount }} 张图</span>
          <span v-if="r.ok" class="ok">✓ Draft 已建</span>
          <span v-else class="err">{{ r.error }}</span>
        </li>
      </ul>
      <div class="row-btns">
        <button class="btn" @click="resetAll">再导一批</button>
        <button class="btn primary" @click="goReview">去 Review →</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.imp { max-width: 1080px; margin: 0 auto; padding: 16px; }
.muted { color: #777; font-size: 13px; }
.err { color: #c62828; }
.ok { color: #2e7d32; font-weight: 700; }
.phase-bar { display: flex; gap: 8px; list-style: none; padding: 0; margin: 16px 0; flex-wrap: wrap; }
.phase-bar li { padding: 6px 12px; border: 1px solid #ddd; border-radius: 20px; font-size: 13px; color: #888; }
.phase-bar li.active { background: #1a2936; color: #fff; border-color: #1a2936; }
.card { border: 1px solid #e3e3e3; border-radius: 12px; padding: 16px; background: #fff; margin-bottom: 16px; }
.card h3 { margin: 0 0 12px; }
.tpl-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.tpl-row select, .tpl-row input { padding: 8px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; }
table.dense { width: 100%; border-collapse: collapse; font-size: 14px; }
table.dense th, table.dense td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
table.dense select { padding: 6px; border: 1px solid #ccc; border-radius: 6px; }
code { background: #f4f4f4; padding: 1px 6px; border-radius: 4px; }
.row-btns { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.btn.primary { background: #1a2936; color: #fff; border-color: #1a2936; }
.btn.xs { padding: 4px 8px; font-size: 12px; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.match-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
.match-cols h4 { margin: 0 0 8px; }
.plist, .rlist { list-style: none; padding: 0; margin: 0; max-height: 420px; overflow: auto; }
.plist li { display: flex; gap: 8px; align-items: center; border: 1px solid #eee; border-radius: 8px; padding: 6px; margin-bottom: 6px; cursor: pointer; }
.plist li.sel { border-color: #1a2936; box-shadow: 0 0 0 1px #1a2936; }
.plist li.matched { background: #f4faf4; }
.plist img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.fname { font-size: 12px; margin: 0; word-break: break-all; }
.rlist li { border: 1px solid #eee; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.rlist li.can { cursor: pointer; }
.rlist li.can:hover { border-color: #1a2936; }
.rlist li.fail { border-color: #ef9a9a; background: #fff8f8; }
.badge { margin-left: auto; background: #eee; border-radius: 12px; padding: 2px 10px; font-size: 12px; }
@media (max-width: 768px) {
  .match-cols { grid-template-columns: 1fr; }
  .row-btns { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
  .row-btns .btn { flex: 1; }
}
</style>
