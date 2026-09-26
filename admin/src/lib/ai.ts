/**
* admin/src/lib/ai.ts — MockAiService（AiService 契约的 mock 实现）。
*
* 唯一契约：../../../supabase/kyoto.ts（DbProvider / AiService / FieldMeta / provenance / confidence）。
* 本文件不另发明任何类型。
*
* （mock 也不许违反）
* - 绝不编造 SKU / 尺寸 / 材质 / 库存 / 成本 / 供应商：这些字段 mock 一律返回空（null / ''），由用户填写。
* - shape / color / style 可以给"建议"+confidence（provenance 恒为 AI_SUGGESTED）。
* - generateProductContent 只基于传入的 VerifiedProductData 生成三语内容，三语必须基于同一份数据，
* 不许各说各话；数据里没有的事实不许出现在文案里。
* - suggestCollection 只给建议 + reasons，不许自动定价、不许写价格。
* - OCR 结果 provenance 恒为 OCR_DETECTED；mock 下 rawText 为空、各尺寸为 null（不编造数字）。
*
* 以后接真实 provider：只需在本文件实现新的 XxxAiService 类，并在 getAiService() 里换掉
* new MockAiService()，所有调用方（views）一行不改。密钥永远在服务端，本文件不碰密钥。
*/
import type {
AiService,
Confidence,
FrameAnalysisResult,
FrameSeries,
GeneratedContent,
Locale,
LocalizedText,
Provenance,
TempleOcrResult,
VerifiedProductData,
} from '../../../supabase/kyoto';

export const LOCALES: Locale[] = ['en-US', 'zh-CN', 'es-US'];

export function trilingual(en: string, zh: string, es: string): LocalizedText {
return { 'en-US': en, 'zh-CN': zh, 'es-US': es};
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
high: 'High',
medium: 'Medium',
low: 'Low',
};

export const PROVENANCE_LABEL: Record<Provenance, string> = {
VERIFIED: '已确认 VERIFIED',
IMPORTED: '导入 IMPORTED',
MANUAL: '人工 MANUAL',
AI_SUGGESTED: 'AI 建议 AI_SUGGESTED',
OCR_DETECTED: 'OCR 识别 OCR_DETECTED',
NEEDS_REVIEW: '待审核 NEEDS_REVIEW',
};

function cap(s: string): string {
return s? s.charAt(0).toUpperCase() + s.slice(1): s;
}

/** 同一份数据 → 三语 descriptor，保证三语"说同一件事"。 */
interface Concept {
shape: string;
colorEn: string;
colorZh: string;
colorEs: string;
styles: string[];
hasMeasurements: boolean;
}

function toConcept(data: VerifiedProductData): Concept {
const c0 = data.colors?.[0];
return {
shape: (data.shape || 'frame').trim() || 'frame',
colorEn: c0?.name['en-US'] || '',
colorZh: c0?.name['zh-CN'] || '',
colorEs: c0?.name['es-US'] || '',
styles: (data.styles?? []).filter(Boolean),
hasMeasurements:!!data.measurements && Object.keys(data.measurements).length > 0,
};
}

export class MockAiService implements AiService {
readonly providerName = 'mock';
readonly isMock = true;

/** 帧分析：只建议 shape/color/style；材质/尺寸/SKU/库存/成本一律不碰。 */
async analyzeFrameImage(_imageRef: string): Promise<FrameAnalysisResult> {
return {
shape: 'round',
shapeConfidence: 'medium',
colors: [
{
key: 'noir',
hex: '#1c1c1e',
name: trilingual('Noir Black', '玄黑', 'Negro'),
confidence: 'medium',
},
],
styles: ['minimalist', 'classic'],
materialSuggestion: null, // 铁律：mock 不编造材质
materialConfidence: null,
warnings: [
'MOCK 模式：shape / color / style 为占位建议，必须人工核对后确认。',
'SKU / 尺寸 / 材质 / 库存 / 成本 / 供应商永不由 AI 填写。',
],
provenance: 'AI_SUGGESTED', // 恒为 AI_SUGGESTED
mock: true,
};
}

/**
* 图像处理：mock 阶段 cleaned = 原图占位（不做真实去背）。
* 管线说明：original 永久保留（查看/下载/恢复）；cleaned 只做去背/裁剪/居中/标准化；
* marketing 图必须打标 "AI GENERATED MARKETING IMAGE"。
*/
async processProductImage(
imageRef: string,
): Promise<{ cleanedRef: string; width: number; height: number; mock: boolean}> {
return {
cleanedRef: imageRef, // mock：用原图占位，UI 必须标注"去背占位图"
width: 0,
height: 0,
mock: true,
};
}

/**
* 镜腿 OCR：mock 下恒返回空结果（绝不编造尺寸数字），provenance 恒为 OCR_DETECTED。
* 用户需在 AIStudio 手动填写 → 确认后才变为 VERIFIED。
*/
async extractTempleText(_imageRef: string): Promise<TempleOcrResult> {
return {
rawText: '',
lensWidth: null,
bridge: null,
temple: null,
modelNumber: null,
colorCode: null,
confidence: 'low', // low 置信度：不许自动 confirm，必须人工填写/确认
provenance: 'OCR_DETECTED', // 恒为 OCR_DETECTED
mock: true,
};
}

/**
* 三语文案生成：只基于 VerifiedProductData；三语共用同一 Concept，不许各说各话；
* 数据里没有的事实（材质/尺寸/价格/SKU）不许出现在文案里。
*/
async generateProductContent(data: VerifiedProductData): Promise<GeneratedContent> {
const c = toConcept(data);
const colorPartEn = c.colorEn? ` in ${c.colorEn}`: '';
const colorPartZh = c.colorZh? ` ${c.colorZh}`: '';
const colorPartEs = c.colorEs? ` en ${c.colorEs}`: '';
const stylePart = c.styles.length > 0? c.styles.join(', '): 'timeless';

const name = trilingual(
`Kyoto ${cap(c.shape)} Optical Frame${colorPartEn} (AI draft)`,
`京都${c.shape}${colorPartZh}光学镜架（AI 草稿）`,
`Montura óptica Kyoto ${c.shape}${colorPartEs} (borrador IA)`,
);
const shortDescription = trilingual(
`AI draft: ${c.shape} frame${colorPartEn}, ${stylePart} style. Verify all details before publishing.`,
`AI 草稿：${c.shape}镜架${colorPartZh}，${stylePart}风格。发布前请核对全部信息。`,
`Borrador IA: montura ${c.shape}${colorPartEs}, estilo ${stylePart}. Verifique los detalles antes de publicar.`,
);
const fullDescription = trilingual(
`AI draft long description for the Kyoto ${c.shape} optical frame${colorPartEn}. ` +
`Designed in a ${stylePart} style for everyday wear. ` +
`Material, measurements, pricing and availability must be filled in manually — this draft contains no fabricated specs.`,
`京都${c.shape}光学镜架${colorPartZh}的 AI 草稿长描述。${stylePart}风格，适合日常佩戴。` +
`材质、尺寸、价格与库存请人工填写——本草稿不包含任何编造的规格。`,
`Descripción larga (borrador IA) de la montura óptica Kyoto ${c.shape}${colorPartEs}. ` +
`Estilo ${stylePart} para uso diario. ` +
`El material, las medidas, el precio y la disponibilidad deben completarse manualmente; este borrador no inventa especificaciones.`,
);
const seoTitle = trilingual(
`${cap(c.shape)} Optical Frame${colorPartEn} | Kyoto Eyewear (AI draft)`,
`${c.shape}${colorPartZh}光学镜架 | 京都眼镜（AI 草稿）`,
`Montura óptica ${c.shape}${colorPartEs} | Kyoto Eyewear (borrador IA)`,
);
const seoDescription = shortDescription;
const tags = ['ai-draft', c.shape,...c.styles].filter(Boolean);

return { name, shortDescription, fullDescription, seoTitle, seoDescription, tags, mock: true};
}

/**
* 翻译：mock 无法做真实翻译，返回带 [MOCK] 标记的占位，要求人工校对。
* 只翻译传入 content 的字段，不新增事实。
*/
async translateProductContent(
content: GeneratedContent,
target: Locale,
): Promise<Partial<GeneratedContent>> {
const mark = (t: LocalizedText): LocalizedText => {
const out: LocalizedText = {...t};
const src = t['en-US'] || t['zh-CN'] || t['es-US'] || '';
out[target] = `[MOCK 翻译占位·需人工校对] ${src}`;
return out;
};
return {
name: mark(content.name),
shortDescription: mark(content.shortDescription),
fullDescription: mark(content.fullDescription),
seoTitle: mark(content.seoTitle),
seoDescription: mark(content.seoDescription),
mock: true,
};
}

/**
* 系列建议：只给建议 + reasons + confidence。不许自动定价，不许写任何价格数字。
*/
async suggestCollection(
data: VerifiedProductData,
): Promise<{ series: FrameSeries; confidence: Confidence; reasons: string[]; mock: boolean}> {
const series: FrameSeries = data.collectionHint?? 'essential';
return {
series,
confidence: 'low',
reasons: [
'MOCK 模式：未做真实成本/定位分析，此为占位建议。',
'系列归属必须由人工结合成本与品牌定位确认；AI 不做定价、不输出价格。',
],
mock: true,
};
}
}

/* ------------------------------------------------------------------ */
/* 工厂：以后接真实 provider，只改这里 */
/* ------------------------------------------------------------------ */
let _instance: AiService | null = null;

/** 全应用统一入口。换真实 AI provider 时只改这个函数内部。 */
export function getAiService(): AiService {
if (!_instance) _instance = new MockAiService();
return _instance;
}

/** 仅供测试/重置。 */
export function __resetAiService(next?: AiService | null): void {
_instance = next?? null;
}
