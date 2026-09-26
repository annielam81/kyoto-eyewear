<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>{{ isNew ? '新增产品' : `编辑 · ${form.collectionName || form.sku}` }}</h1>
        <div class="sub mono">{{ isNew ? '未保存' : form.sku }} · v{{ form.version || 1 }}</div>
      </div>
      <div class="row">
        <router-link class="btn" to="/products">返回列表</router-link>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
      </div>
    </div>

    <div v-if="loading" class="empty">加载中…</div>
    <div v-else class="editor-grid">
      <!-- 左：图片 -->
      <div class="editor-col">
        <details class="acc" open>
          <summary>图片 <span class="small muted">{{ images.length }} 张</span></summary>
          <div class="body">
            <div v-for="kind in (['original', 'cleaned', 'marketing'] as const)" :key="kind" style="margin-bottom:14px">
              <div class="row" style="margin-bottom:6px">
                <strong class="small">{{ kindLabel(kind) }}</strong>
                <span v-if="kind === 'marketing'" class="badge ai-tag">AI GENERATED MARKETING IMAGE</span>
              </div>
              <div class="img-grid">
                <div v-for="img in imagesByKind(kind)" :key="img.id" class="img-cell">
                  <img v-if="img.publicUrl" :src="img.publicUrl" alt="" />
                  <div class="meta">
                    <span class="badge" :class="'prov-' + img.provenance">{{ img.provenance }}</span>
                    <span class="badge" v-if="img.aiGenerated">AI 生成</span>
                    <span class="muted">{{ img.role }}</span>
                  </div>
                  <div class="ops">
                    <a v-if="img.publicUrl" class="btn btn-sm" :href="img.publicUrl" target="_blank" rel="noopener">查看</a>
                    <a v-if="img.publicUrl" class="btn btn-sm" :href="img.publicUrl" :download="img.storagePath.split('/').pop()">下载</a>
                    <button v-if="kind === 'original'" class="btn btn-sm" @click="restoreOriginal(img.id)">恢复</button>
                    <button class="btn btn-sm btn-danger" @click="removeImage(img.id)">删除</button>
                  </div>
                </div>
              </div>
              <div v-if="imagesByKind(kind).length === 0" class="small muted">暂无</div>
            </div>
            <div class="hint small muted">图片上传/替换在「批量上传」中完成，此处仅管理。</div>
          </div>
        </details>

        <details class="acc" open>
          <summary>库存</summary>
          <div class="body">
            <dl class="kv">
              <dt>在库 on_hand</dt><dd class="mono"><strong>{{ inv?.onHand ?? 0 }}</strong></dd>
              <dt>已预留 reserved</dt><dd class="mono">{{ inv?.reserved ?? 0 }}</dd>
              <dt>可用 available</dt><dd class="mono"><strong>{{ available }}</strong></dd>
              <dt>低库存阈值</dt><dd class="mono">{{ inv?.lowStockThreshold ?? 10 }}</dd>
            </dl>
            <div class="field" style="margin-top:10px">
              <label class="label">调整库存（写 ledger）</label>
              <div class="row">
                <input v-model.number="adjQty" type="number" class="input" style="width:110px" placeholder="+/- 数量" />
                <input v-model="adjReason" class="input" style="flex:1" placeholder="原因，如盘点/退货/报损" />
              </div>
            </div>
            <button class="btn btn-sm" :disabled="!adjQty || !adjReason.trim()" @click="adjustStock">提交调整</button>
          </div>
        </details>
      </div>

      <!-- 中：信息 -->
      <div class="editor-col">
        <details class="acc" open>
          <summary>基本信息</summary>
          <div class="body">
            <div class="field">
              <label class="label">SKU *</label>
              <input v-model="form.sku" class="input mono" :disabled="!isNew" />
            </div>
            <div class="field">
              <label class="label">系列名（英文） <ProvBadge field="collectionName" /></label>
              <input v-model="form.collectionName" class="input" />
            </div>
            <div class="field">
              <label class="label">中文名 <ProvBadge field="nameZH" /></label>
              <input v-model="form.nameZH" class="input" />
            </div>
            <LocaleField label="名称（三语）" field="name" v-model="form.name" />
            <div class="row">
              <div class="field" style="flex:1">
                <label class="label">系列 <ProvBadge field="series" /></label>
                <select v-model="form.series" class="select">
                  <option value="essential">Essential</option>
                  <option value="signature">Signature</option>
                  <option value="atelier">Atelier</option>
                </select>
              </div>
              <div class="field" style="flex:1">
                <label class="label">类目</label>
                <select v-model="form.category" class="select">
                  <option value="optical">光学镜</option>
                  <option value="sun">太阳镜</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="field" style="flex:1">
                <label class="label">框型 shape <ProvBadge field="shape" /></label>
                <input v-model="form.shape" class="input" placeholder="round / square / …" />
              </div>
              <div class="field" style="flex:1">
                <label class="label">试戴线稿 art</label>
                <input v-model="form.art" class="input" placeholder="round / square / cat / sun / aviator" />
              </div>
            </div>
            <LocaleField label="材质（三语）" field="material" v-model="form.material" />
          </div>
        </details>

        <details class="acc" open>
          <summary>价格 <span class="small muted">（顾客看到 launchPrice ?? regularPrice）</span></summary>
          <div class="body">
            <div class="row">
              <div class="field" style="flex:1">
                <label class="label">regularPrice (USD) <ProvBadge field="regularPrice" /></label>
                <input v-model.number="form.regularPrice" type="number" step="0.01" min="0" class="input mono" />
              </div>
              <div class="field" style="flex:1">
                <label class="label">launchPrice（可空） <ProvBadge field="launchPrice" /></label>
                <input v-model.number="form.launchPrice" type="number" step="0.01" min="0" class="input mono" placeholder="空 = 无促销价" />
              </div>
            </div>
            <div class="hint small muted">铁律：价格只允许按业务既有数值维护，本工具不编造价格；每次改价写入审计日志。</div>
          </div>
        </details>

        <details class="acc">
          <summary>颜色</summary>
          <div class="body">
            <div v-for="(c, i) in form.colors" :key="i" class="row" style="margin-bottom:8px">
              <input v-model="c.key" class="input mono" style="width:90px" placeholder="key" />
              <input v-model="c.hex" type="color" style="width:40px;height:38px;border:1px solid var(--line);border-radius:8px;padding:2px" />
              <input v-model="c.name['en-US']" class="input" style="flex:1" placeholder="EN" />
              <input v-model="c.name['zh-CN']" class="input" style="flex:1" placeholder="中文" />
              <button class="btn btn-sm btn-danger" @click="form.colors.splice(i, 1)">删</button>
            </div>
            <button class="btn btn-sm" @click="addColor">＋ 加颜色</button>
          </div>
        </details>

        <details class="acc">
          <summary>尺寸与测量 <ProvBadge field="measurements.a" /></summary>
          <div class="body">
            <div v-for="(s, i) in form.sizes" :key="i" class="row" style="margin-bottom:8px">
              <input v-model="s.key" class="input" style="width:60px" placeholder="S/M/L" />
              <input v-model.number="s.lensWidth" type="number" class="input" style="width:80px" placeholder="镜宽" />
              <input v-model.number="s.bridge" type="number" class="input" style="width:80px" placeholder="鼻梁" />
              <input v-model.number="s.temple" type="number" class="input" style="width:80px" placeholder="镜腿" />
              <button class="btn btn-sm btn-danger" @click="form.sizes.splice(i, 1)">删</button>
            </div>
            <button class="btn btn-sm" @click="form.sizes.push({ key: 'M', lensWidth: 50, bridge: 20, temple: 145 })">＋ 加尺寸</button>
            <div class="field" style="margin-top:10px">
              <label class="label">默认尺寸</label>
              <input v-model="form.defaultSize" class="input" style="width:120px" />
            </div>
            <div class="row">
              <div class="field" style="flex:1"><label class="label">A 镜框宽</label><input v-model.number="form.measurements.a" type="number" class="input mono" /></div>
              <div class="field" style="flex:1"><label class="label">B 镜框高</label><input v-model.number="form.measurements.b" type="number" class="input mono" /></div>
              <div class="field" style="flex:1"><label class="label">DBL 鼻梁</label><input v-model.number="form.measurements.dbl" type="number" class="input mono" /></div>
              <div class="field" style="flex:1"><label class="label">Temple 镜腿</label><input v-model.number="form.measurements.temple" type="number" class="input mono" /></div>
              <div class="field" style="flex:1"><label class="label">ED 有效直径</label><input v-model.number="form.measurements.ed" type="number" class="input mono" /></div>
            </div>
          </div>
        </details>

        <details class="acc">
          <summary>描述与标签</summary>
          <div class="body">
            <LocaleField label="描述（三语）" field="description" v-model="form.description" textarea />
            <LocaleField label="佩戴建议（三语）" field="fit" v-model="form.fit" textarea />
            <div class="field">
              <label class="label">标签</label>
              <div class="tag-input-row">
                <span v-for="t in form.tags" :key="t" class="chip">{{ t }}<button @click="form.tags = form.tags.filter(x => x !== t)">×</button></span>
              </div>
              <div class="row" style="margin-top:6px">
                <input v-model="newTag" class="input" style="flex:1" placeholder="输入标签回车添加" @keyup.enter="addTag" />
                <button class="btn btn-sm" @click="addTag">添加</button>
              </div>
            </div>
            <div class="row">
              <label class="row small"><input type="checkbox" v-model="form.featured" /> 精选</label>
              <label class="row small"><input type="checkbox" v-model="form.newArrival" /> 新品</label>
              <label class="row small"><input type="checkbox" v-model="form.bestSeller" /> 畅销</label>
              <label class="row small"><input type="checkbox" v-model="form.fsaEligible" /> FSA</label>
              <label class="row small"><input type="checkbox" v-model="form.prescriptionCompatible" /> 可配镜</label>
            </div>
            <div class="field" style="margin-top:8px">
              <label class="label">处方范围 rxRange</label>
              <input v-model="form.rxRange" class="input mono" />
            </div>
          </div>
        </details>

        <details class="acc">
          <summary>SEO</summary>
          <div class="body">
            <LocaleField label="SEO 标题" field="seoTitle" v-model="seoTitle" />
            <LocaleField label="SEO 描述" field="seoDescription" v-model="seoDescription" textarea />
            <div class="field">
              <label class="label">slug</label>
              <input v-model="form.slug" class="input mono" />
            </div>
          </div>
        </details>

        <details class="acc">
          <summary>内部字段 <span class="small muted">（永不暴露给顾客端）</span></summary>
          <div class="body">
            <div class="row">
              <div class="field" style="flex:1"><label class="label">成本 cost (USD)</label><input v-model.number="form.cost" type="number" step="0.01" class="input mono" /></div>
              <div class="field" style="flex:1"><label class="label">供应商 supplier</label><input v-model="form.supplier" class="input" /></div>
            </div>
            <div class="field">
              <label class="label">内部备注 internalNotes</label>
              <textarea v-model="form.internalNotes" class="textarea"></textarea>
            </div>
          </div>
        </details>
      </div>

      <!-- 右：状态 / 发布 / AI -->
      <div class="editor-col">
        <div class="card">
          <h3>状态与发布</h3>
          <div class="row" style="margin-bottom:10px">
            <span class="badge" :class="'st-' + form.status">{{ statusLabel(form.status) }}</span>
            <span v-if="lowConfFields.length" class="badge prov-NEEDS_REVIEW">{{ lowConfFields.length }} 个字段待确认</span>
          </div>
          <div class="row">
            <button class="btn btn-sm" :disabled="isNew || form.status === 'needs_review'" @click="changeStatus('needs_review')">提交审核</button>
            <button class="btn btn-sm" :disabled="isNew || form.status === 'ready'" @click="changeStatus('ready')">Approve → 就绪</button>
          </div>
          <div class="row" style="margin-top:8px">
            <button v-if="session.canPublish" class="btn btn-sm btn-accent" :disabled="isNew || form.status === 'published'" @click="changeStatus('published')">发布 Publish</button>
            <button class="btn btn-sm" :disabled="isNew || form.status === 'draft'" @click="changeStatus('draft')">下架 → 草稿</button>
          </div>
          <div v-if="!session.canPublish" class="hint small muted" style="margin-top:6px">当前账号无 publish 权限，发布按钮已隐藏。</div>
          <div class="row" style="margin-top:8px">
            <button class="btn btn-sm btn-danger" :disabled="isNew || form.status === 'archived'" @click="archive">归档（不删除）</button>
          </div>
          <div v-if="lowConfFields.length" class="small" style="margin-top:10px">
            <div class="muted" style="margin-bottom:4px">待确认字段（低置信度）：</div>
            <div class="prov-row">
              <span v-for="f in lowConfFields" :key="f" class="badge prov-NEEDS_REVIEW">{{ f }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>来源徽章说明</h3>
          <div class="prov-row">
            <span class="badge prov-VERIFIED">VERIFIED</span>
            <span class="badge prov-IMPORTED">IMPORTED</span>
            <span class="badge prov-MANUAL">MANUAL</span>
            <span class="badge prov-AI_SUGGESTED">AI_SUGGESTED</span>
            <span class="badge prov-OCR_DETECTED">OCR_DETECTED</span>
            <span class="badge prov-NEEDS_REVIEW">NEEDS REVIEW</span>
          </div>
          <div class="small muted" style="margin-top:8px">低置信度字段不许自动确认，需人工核对后在审核中心确认。</div>
        </div>

        <div class="card">
          <h3>AI 助手</h3>
          <div class="small muted">AI 分析 / 文案生成在「AI 工作室」中按产品触发，结果落库后回填到本页。本页不自动调用 AI。</div>
          <router-link class="btn btn-sm" style="margin-top:8px" to="/ai-studio">前往 AI 工作室</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProvider } from '@/lib/provider';
import { useSessionStore } from '@/stores/session';
import type {
  ImageKind, LocalizedText, ProductImageRow, ProductRow, ProductStatus,
} from '../../../supabase/kyoto';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const isNew = computed(() => route.params.id === 'new' || route.path.endsWith('/new'));
const loading = ref(true);
const saving = ref(false);
const images = ref<ProductImageRow[]>([]);
const inv = ref<{ onHand: number; reserved: number; lowStockThreshold: number } | null>(null);
const adjQty = ref<number | null>(null);
const adjReason = ref('');
const newTag = ref('');
const seoTitle = ref<LocalizedText>({ 'en-US': '', 'zh-CN': '', 'es-US': '' });
const seoDescription = ref<LocalizedText>({ 'en-US': '', 'zh-CN': '', 'es-US': '' });

const L = (en = '', zh = '', es = ''): LocalizedText => ({ 'en-US': en, 'zh-CN': zh, 'es-US': es });

function blankForm(): ProductRow {
  return {
    id: '', legacyId: '', sku: '', slug: '',
    name: L(), collectionName: '', nameZH: '',
    series: 'essential', category: 'optical', shape: '', colors: [],
    material: L(), sizes: [], defaultSize: 'M', measurements: {},
    art: null, tint: null, description: L(), fit: L(), tags: [],
    status: 'draft', regularPrice: 0, launchPrice: null,
    prescriptionCompatible: true, rxRange: '',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167'],
    featured: false, newArrival: false, bestSeller: false, fsaEligible: false,
    rating: 0, reviewCount: 0, provenance: {},
    cost: null, supplier: null, internalNotes: null, aiMeta: null, seo: null,
    publishedAt: null, createdBy: null, updatedAt: '', version: 1,
  };
}
const form = reactive<ProductRow>(blankForm());
const provenance = ref<Record<string, { provenance: string; confidence?: string }>>({});

const available = computed(() => (inv.value ? inv.value.onHand - inv.value.reserved : 0));
const imagesByKind = (kind: ImageKind) => images.value.filter(i => i.kind === kind);
const lowConfFields = computed(() =>
  Object.entries(provenance.value).filter(([, m]) => m.confidence === 'low' || m.provenance === 'NEEDS_REVIEW').map(([k]) => k));

const statusLabel = (s: ProductStatus) =>
  ({ draft: '草稿', needs_review: '待审核', ready: '已就绪', published: '已发布', archived: '已归档' } as Record<string, string>)[s] ?? s;
const kindLabel = (k: ImageKind) => k === 'original' ? '原图 original' : k === 'cleaned' ? '精修图 cleaned' : '营销图 marketing';

/* 字段来源徽章 */
const ProvBadge = defineComponent({
  props: { field: { type: String, required: true } },
  setup(props) {
    return () => {
      const m = provenance.value[props.field];
      if (!m) return null;
      return h('span', { class: ['badge', 'prov-' + m.provenance], style: 'margin-left:6px' },
        [m.provenance, m.confidence ? ` · ${m.confidence}` : '']);
    };
  },
});

/* 三语字段编辑器 */
const LocaleField = defineComponent({
  props: {
    label: { type: String, required: true },
    field: { type: String, required: true },
    modelValue: { type: Object as () => LocalizedText, required: true },
    textarea: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const tab = ref<'en-US' | 'zh-CN' | 'es-US'>('en-US');
    const set = (locale: 'en-US' | 'zh-CN' | 'es-US', v: string) =>
      emit('update:modelValue', { ...props.modelValue, [locale]: v });
    return () => h('div', { class: 'field' }, [
      h('label', { class: 'label' }, [
        props.label,
        (() => {
          const m = provenance.value[props.field];
          return m ? h('span', { class: ['badge', 'prov-' + m.provenance], style: 'margin-left:6px' }, m.provenance) : null;
        })(),
      ]),
      h('div', { class: 'locale-tabs' }, (['en-US', 'zh-CN', 'es-US'] as const).map(lc =>
        h('button', { type: 'button', class: tab.value === lc ? 'on' : '', onClick: () => { tab.value = lc; } },
          lc === 'en-US' ? 'EN' : lc === 'zh-CN' ? '中文' : 'ES'))),
      props.textarea
        ? h('textarea', { class: 'textarea', value: props.modelValue[tab.value], onInput: (e: Event) => set(tab.value, (e.target as HTMLTextAreaElement).value) })
        : h('input', { class: 'input', value: props.modelValue[tab.value], onInput: (e: Event) => set(tab.value, (e.target as HTMLInputElement).value) }),
    ]);
  },
});

const actor = () => session.profile?.email ?? 'unknown';

async function load() {
  loading.value = true;
  try {
    const p = getProvider();
    if (isNew.value) {
      Object.assign(form, blankForm());
      provenance.value = {};
      images.value = [];
      inv.value = null;
    } else {
      const id = route.params.id as string;
      const prod = await p.getProduct(id);
      if (!prod) { await router.replace('/products'); return; }
      Object.assign(form, JSON.parse(JSON.stringify(prod)));
      provenance.value = prod.provenance ?? {};
      images.value = await p.listImages(id);
      const iv = await p.getInventory(id);
      inv.value = iv ? { onHand: iv.onHand, reserved: iv.reserved, lowStockThreshold: iv.lowStockThreshold } : null;
      if (prod.seo) {
        seoTitle.value = { ...L(), ...prod.seo.title };
        seoDescription.value = { ...L(), ...prod.seo.description };
      }
    }
  } finally {
    loading.value = false;
  }
}

function collectPatch(): Partial<ProductRow> {
  const { id, legacyId, createdBy, updatedAt, version, rating, reviewCount, publishedAt, ...rest } = form;
  void id; void legacyId; void createdBy; void updatedAt; void version; void rating; void reviewCount; void publishedAt;
  return {
    ...rest,
    seo: (seoTitle.value['en-US'] || seoDescription.value['en-US'])
      ? { title: { ...seoTitle.value }, description: { ...seoDescription.value }, slug: form.slug }
      : null,
  };
}

async function save() {
  // SKU 规则：Draft 允许空 SKU（拍照/批量上传建的 Draft 初始无 SKU，Review 环节填写）；
  // 流向 ready/published 时 provider 层会校验 SKU 非空。
  if (!form.sku.trim() && !confirm('SKU 为空：该产品将保存为草稿，发布前必须填写 SKU。继续保存？')) return;
  saving.value = true;
  try {
    const p = getProvider();
    if (isNew.value) {
      const created = await p.createProduct(collectPatch(), actor());
      await router.replace(`/products/${created.id}`);
    } else {
      const updated = await p.updateProduct(form.id, collectPatch(), actor());
      Object.assign(form, JSON.parse(JSON.stringify(updated)));
      provenance.value = updated.provenance ?? {};
      alert('已保存');
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

async function changeStatus(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    draft: '下架为草稿', needs_review: '提交审核', ready: '设为就绪', published: '发布', archived: '归档',
  };
  if (!confirm(`确定${labels[status]}「${form.collectionName || form.sku}」？`)) return;
  try {
    const updated = await getProvider().setProductStatus(form.id, status, actor());
    Object.assign(form, JSON.parse(JSON.stringify(updated)));
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败');
  }
}

async function archive() {
  if (!confirm(`确定归档「${form.collectionName || form.sku}」？归档后不在前台展示，可恢复。`)) return;
  await getProvider().archiveProduct(form.id, actor());
  await router.push('/products');
}

async function adjustStock() {
  if (adjQty.value == null || adjQty.value === 0 || !adjReason.value.trim()) return;
  try {
    await getProvider().adjustInventory(form.id, adjQty.value, adjReason.value.trim(), actor());
    const iv = await getProvider().getInventory(form.id);
    inv.value = iv ? { onHand: iv.onHand, reserved: iv.reserved, lowStockThreshold: iv.lowStockThreshold } : null;
    adjQty.value = null;
    adjReason.value = '';
    alert('库存已调整并写入 ledger');
  } catch (e) {
    alert(e instanceof Error ? e.message : '调整失败');
  }
}

async function removeImage(id: string) {
  if (!confirm('确定删除这张图片？')) return;
  await getProvider().removeImage(id, actor());
  images.value = images.value.filter(i => i.id !== id);
}

async function restoreOriginal(id: string) {
  // 恢复 = 将该原图重新标记为当前主图（mock：仅写审计）
  if (!confirm('将该原图恢复为当前主图？')) return;
  try {
    await getProvider().updateProduct(form.id, { aiMeta: { ...(form.aiMeta ?? {}), restoredOriginalImageId: id, restoredAt: new Date().toISOString() } }, actor());
    alert('已标记恢复');
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败');
  }
}

function addColor() {
  form.colors.push({ key: '', hex: '#000000', name: L('', '', '') });
}
function addTag() {
  const t = newTag.value.trim();
  if (t && !form.tags.includes(t)) form.tags.push(t);
  newTag.value = '';
}

onMounted(load);
</script>
