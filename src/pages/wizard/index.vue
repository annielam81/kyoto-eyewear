<template>
  <view class="page-pad wz">
    <WizardProgress :step="displayStep" :total="displayTotal" :title="stepTitle" @back="goBack"/>
    <!-- context bar -->
    <view v-if="frame" class="ctx">
      <view :class="['ctx-art',frame.tint]"><FrameArt :art="frame.art" :hex="selColor?.hex" style="height:80rpx"/></view>
      <view class="ctx-tx">
        <text class="ctx-n">{{frame.name[loc]}} · {{selColor?.name[loc]}} · {{w.sizeKey}}</text>
        <text class="ctx-p">${{frame.price + wizard.lensPrice}}</text>
      </view>
    </view>
    <!-- STEP 1 —— 处方（内容键仍为 s5）。选完镜框后第一步就是处方 -->
    <view v-if="w.step===STEP.rx&&w.use!=='nonrx'">
      <text class="h1">{{$t('wizard.s5.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s5.subtitle')}}</text>
      <!-- 母版 04：竖排方式列表。四种方式与业务逻辑完全沿用代码，
           「拍照」入口保留在上传页内部（相机 / 相册两个按钮），未删除任何能力。 -->
      <view class="rxlist">
        <view class="rxr" @click="goRx('upload')">
          <view class="rxr-ic" v-html="rxIcons.upload"></view>
          <view class="rxr-tx"><text class="rxr-n">{{$t('wizard.s5.upload')}}</text><text class="rxr-s">{{$t('wizard.s5.uploadS')}}</text></view>
        </view>
        <view class="rxr" @click="goManual">
          <view class="rxr-ic" v-html="rxIcons.manual"></view>
          <view class="rxr-tx"><text class="rxr-n">{{$t('wizard.s5.manual')}}</text><text class="rxr-s">{{$t('wizard.s5.manualS')}}</text></view>
        </view>
        <view class="rxr" :class="{expired:savedRxValidity==='expired'}" @click="useSaved">
          <view class="rxr-ic" v-html="rxIcons.saved"></view>
          <view class="rxr-tx">
            <text class="rxr-n">{{$t('wizard.s5.saved')}}</text>
            <text class="rxr-s">{{savedRx?.label}} · OD {{savedRx?.od?.sph}}</text>
            <text v-if="savedRxValidity==='expired'" class="rx-s-exp">{{$t('c3.rxs.expired')}} — {{$t('c3.myrx.expWarn')}}</text>
            <text v-else-if="savedRxValidity==='expiringSoon'" class="rx-s-exp soon">{{$t('c3.myrx.soonWarn')}}</text>
          </view>
        </view>
        <view class="rxr" @click="setLater">
          <view class="rxr-ic" v-html="rxIcons.later"></view>
          <view class="rxr-tx"><text class="rxr-n">{{$t('wizard.s5.later')}}</text><text class="rxr-s">{{$t('wizard.s5.laterS')}}</text></view>
        </view>
      </view>
      <view class="rx-note"><text>{{$t('wizard.s5.privacy')}}</text></view>
    </view>
    <!-- STEP 2 —— 镜片类型（内容键仍为 s2）-->
    <view v-else-if="w.step===STEP.type">
      <text class="h1">{{$t('wizard.s2.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s2.subtitle')}}</text>
      <OptionCard v-for="o in s2opts" :key="o.k" :icon="o.ic" :title="$t('wizard.s2.'+o.k)" :subtitle="$t('wizard.s2.'+o.k+'S')"
        :price-text="o.pr" :selected="w.type===o.k" :disabled="!typeAllowed(o.k)" @select="setType(o.k)">
        <!-- 渐进/双光硬性要求处方里有 ADD：没有就禁用，原因紧贴该选项显示。 -->
        <text v-if="!typeAllowed(o.k)" class="incompat">{{$t('wizard.s2.addRequired.'+o.k)}}</text>
      </OptionCard>
      <!-- 选中需要 ADD 的类型时，回显处方上读到的 ADD 值 -->
      <view v-if="needsAdd&&addOnFile" class="pick-hint">
        <text>{{$t('wizard.s2.addOnFile').replace('{add}',addOnFile)}}</text>
      </view>
    </view>
    <!-- STEP 3 —— 材质/厚度（内容键仍为 s3）-->
    <view v-else-if="w.step===STEP.material">
      <text class="h1">{{$t('wizard.s3.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s3.subtitle')}}</text>
      <!-- 直接列出可购买的 5 种材质。「推荐」只是徽标，不代表已选；
           兼容性规则照旧决定 disabled，客户必须主动点选才会计入订单。 -->
      <OptionCard v-for="m in LENS_MATERIALS" :key="m.id"
        :title="m.name[loc]" :label-text="m.label[loc]" :subtitle="m.description[loc]"
        :price-text="m.price?'+$'+m.price:$t('common.included')"
        :badge="m.id===wizard.recommendation?$t('common.recommended'):''"
        :selected="w.materialId===m.id" :disabled="!compat(m)"
        @select="wizard.set('materialId',m.id)">
        <view v-if="m.badges.length" class="rec-badges">
          <text v-for="bg in m.badges" :key="bg" class="badge-pill">{{bg==='impact'?$t('wizard.s3.badgeImpact'):$t('wizard.s3.badgeLight')}}</text>
        </view>
        <text v-if="!compat(m)" class="incompat">{{$t('wizard.s3.incompat')}}</text>
        <template v-else-if="m.id===wizard.recommendation">
          <text class="why-btn" @click.stop="whyOpen=!whyOpen">ⓘ {{$t('wizard.s3.why')}}</text>
          <text v-if="whyOpen" class="why-txt">{{whyText}}</text>
        </template>
      </OptionCard>
      <!-- 读不到处方（稍后提供 / 上传件未解析）时不假装知道推荐 -->
      <view v-if="!canRecommend" class="pick-hint"><text>{{$t('wizard.s3.noRecNote')}}</text></view>
      <view v-if="!w.materialId" class="pick-hint"><text>{{$t('wizard.s3.selectHint')}}</text></view>
    </view>
    <!-- STEP 4 —— 镀膜/升级（内容键仍为 s4）-->
    <view v-else-if="w.step===STEP.treatments">
      <text class="h1">{{$t('wizard.s4.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s4.subtitle')}}</text>
      <view v-for="g in treatGroups" :key="g.k">
        <text class="grp">{{$t('wizard.s4.'+g.k)}}</text>
        <view v-for="tr in g.items" :key="tr.id" class="treat-row" :class="{incl:g.k==='groupIncluded'}"
          @click="g.k!=='groupIncluded' && wizard.toggleTreatment(tr.id)">
          <!-- Included 恒为已选且不可取消；Optional 默认关闭，必须客户主动勾选 -->
          <view class="tck" :class="{on:g.k==='groupIncluded'||w.treatmentIds.includes(tr.id), lock:g.k==='groupIncluded'}">
            <text v-if="g.k==='groupIncluded'||w.treatmentIds.includes(tr.id)">✓</text>
          </view>
          <view class="treat-tx">
            <text class="treat-name">{{tr.name[loc]}}</text>
            <text class="treat-desc">{{tr.description[loc]}}</text>
          </view>
          <text v-if="g.k==='groupIncluded'" class="treat-pr incl">$0</text>
          <text v-else class="treat-pr">{{tr.price?'+$'+tr.price:'$0'}}</text>
        </view>
      </view>
    </view>
    <!-- STEP 5 —— 评审 / 加入购物车 -->
    <view v-else-if="w.step===STEP.review">
      <text class="h1">{{$t('wizard.s6.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s6.subtitle')}}</text>
      <view v-if="frame" :class="['rev-art',frame.tint]" style="height:232rpx;border-radius:20rpx;overflow:hidden;margin-bottom:24rpx">
        <FrameArt :art="frame.art" :hex="selColor?.hex" style="height:100%"/>
      </view>
      <PriceSummary :rows="reviewRows" @edit="editStep"/>
    </view>
    <!-- footer -->
    <view class="sticky-cta">
      <KyotoButton variant="pink" :disabled="!canContinue" @click="advance">
        {{w.step===STEP.review?$t('wizard.s6.addToCart')+' · $'+((frame?.price??0)+wizard.lensPrice):$t('common.continue')}}
      </KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onShow } from '@dcloudio/uni-app';
import WizardProgress from '@/components/WizardProgress.vue';
import OptionCard from '@/components/OptionCard.vue';
import PriceSummary from '@/components/PriceSummary.vue';
import FrameArt from '@/components/FrameArt.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useLensWizardStore, STEP, firstStep, flowFor } from '@/stores/lensWizard';
import { isLensTypeAvailable, isTreatmentVisible } from '@/config/launch-availability.config';
import { useCartStore } from '@/stores/cart';
import { useProductStore } from '@/stores/product';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LensRecommendationService, LENS_WHY } from '@/services/LensRecommendationService';
import { usePrescriptionStore } from '@/stores/prescription';
import { PrescriptionService } from '@/services/PrescriptionService';
import { lensTypeAllowed, TYPES_REQUIRING_ADD } from '@/config/frame-lens-rules.config';
import type { Locale, PrescriptionUse, PrescriptionType } from '@/models';
import { BRAND } from '@/config/brand-colors';
import { money } from '@/utils/format';
import { goBack as navBack, FALLBACK } from '@/utils/nav';
const { locale,t } = useI18n(); const loc = computed(()=>locale.value as Locale);
const wizard = useLensWizardStore(); const cart = useCartStore(); const products = useProductStore();
const rxStore = usePrescriptionStore();
const savedRx = computed(()=>rxStore.saved[0] ?? null);
const savedRxValidity = computed(()=>savedRx.value?PrescriptionService.validity(savedRx.value):'unknown');
const w = computed(()=>wizard.w);
const frame = computed(()=>wizard.frame);
const selColor = computed(()=>frame.value?.colors.find(c=>c.key===w.value.colorKey)??frame.value?.colors[0]);
const whyOpen = ref(false);
onShow(async ()=>{ await products.ensure();
  if (!wizard.w.frameId) uni.reLaunch({ url: FALLBACK.wizard });   // refresh/direct-entry guard
  // 兜底：从处方页返回、或从购物车恢复旧配置时，把不再成立的镜片类型收敛掉
  const cleared = wizard.reconcileLensType();
  if (cleared) uni.showToast({ title:t('wizard.s2.addRequired.'+cleared), icon:'none', duration:3200 });
});
// 用途(Purpose)已不再是界面步骤：由入口(镜框 category)与镜片类型派生，见 start() / setType()。
// 因此类型步固定给出全部三种，客户可随时改主意（旧版在 use==='readers' 时会把列表锁成单项）。
// 价格取自 TYPE_PRICES，不在界面里另写死数字
const s2opts=(['single','progressive','bifocal','readers'] as const).filter(isLensTypeAvailable).map(k=>({
  k, ic:{single:'◐',progressive:'◑',bifocal:'◒',readers:'＋'}[k],
  pr: TYPE_PRICES[k] ? '+$'+TYPE_PRICES[k] : '',
}));
// 渐进/双光是否需要 ADD，以及当前关联的处方里是否已有 ADD 值
const linkedRx = computed(()=> w.value.prescriptionId ? rxStore.byId(w.value.prescriptionId) ?? null : null);
const needsAdd = computed(()=> !!w.value.type && TYPES_REQUIRING_ADD.includes(w.value.type));
// 双光需要 ADD 才可选；处方里出现 ADD 后会自动变为可选（wizard.addAvailable 是响应式 getter）
const typeAllowed = (k:string)=> lensTypeAllowed(k as PrescriptionType, wizard.linkedPrescription);
const addOnFile = computed(()=>{
  const r=linkedRx.value; if(!r) return '';
  return [r.od?.add, r.os?.add].filter(Boolean).join(' / ');
});
// 只有能从处方读出度数档位时才给「推荐」徽标（稍后提供/仅上传图片 → 不推荐）
const canRecommend = computed(()=>w.value.strengthBand!=null);
const compat = (m:any)=>LensRecommendationService.compatible(m,w.value.strengthBand,frame.value??null);
const whyText = computed(()=>wizard.recommendation ? (LENS_WHY[locale.value]?.[wizard.recommendation]??'') : '');
// 镀膜页只列出对客户展示的项（隐藏项仍在数据与订单里，见 launch-availability.config）
const treatGroups = computed(()=>[
  {k:'groupIncluded',items:TREATMENTS.filter(t=>t.group==='included'&&isTreatmentVisible(t.id))},
  {k:'groupRecommended',items:TREATMENTS.filter(t=>t.group==='recommended'&&isTreatmentVisible(t.id))},
  {k:'groupOptional',items:TREATMENTS.filter(t=>t.group==='optional'&&isTreatmentVisible(t.id))},
].filter(g=>g.items.length));   // 某组被全部隐藏时不渲染空标题
const reviewRows = computed(()=>{
  const f=frame.value; if(!f) return [];
  const mat=wizard.material; const rows:any[]=[];
  rows.push({label:t('wizard.s6.frame'),value:`${f.name[loc.value]} · ${f.nameZH}`,sub:money(f.price)});
  rows.push({label:t('wizard.s6.color'),value:selColor.value?.name[loc.value]??''});
  rows.push({label:t('wizard.s6.size'),value:w.value.sizeKey??''});
  // 用途已由入口/类型派生，不再是客户可编辑的一步，这里仅作信息展示
  if(w.value.use) rows.push({label:t('wizard.s6.use'),value:t('wizard.s1.'+w.value.use)});
  // 类型步在发售期被跳过时，这一行只作信息展示（仍如实显示本单的镜片类型）
  if(w.value.type) rows.push({label:t('wizard.s6.type'),value:t('wizard.s2.'+w.value.type),sub:TYPE_PRICES[w.value.type]?'+$'+TYPE_PRICES[w.value.type]:t('common.included'),editable:stepInFlow(STEP.type),key:'type'});
  if(mat) rows.push({label:t('wizard.s6.materialLbl'),value:mat.name[loc.value],sub:mat.price?'+$'+mat.price:t('common.included'),editable:true,key:'mat'});
  const trNames=TREATMENTS.filter(x=>(x.group==='included'||w.value.treatmentIds.includes(x.id))&&isTreatmentVisible(x.id)).map(x=>x.name[loc.value]).join(', ');
  rows.push({label:t('wizard.s6.treatments'),value:trNames,editable:true,key:'tr'});
  const m=w.value.prescriptionMethod;
  const rxLbl=m==='saved'?t('wizard.s6.rxSaved'):(m==='upload'||m==='photo')?t('wizard.s6.rxUpload'):m==='later'?t('wizard.s6.rxLater'):t('wizard.s6.rxManual');
  if(w.value.use!=='nonrx') rows.push({label:t('wizard.s6.prescription'),value:rxLbl,editable:true,key:'rx'});
  rows.push({label:t('wizard.s6.total'),value:money(f.price+wizard.lensPrice),total:true});
  return rows;
});
const canContinue = computed(()=>{
  const s=w.value.step;
  if(s===STEP.rx) return !!w.value.prescriptionMethod;
  if(s===STEP.type) return !!w.value.type;
  if(s===STEP.material) return !!w.value.materialId;   // 未主动选材质则不能继续
  return true;                                          // 镀膜可全不选；评审步始终可加购
});

// 进度编号：处方路径干净 5 步；nonrx 只有镀膜+评审两步，也显示成 1/2、2/2，
// 不再出现旧版「1/6 直接跳到 5/6」的空洞编号。
const flowSteps = computed<number[]>(()=> flowFor(w.value.use));
/** 向导页头标题：复用各步既有的短标题 key，不新增文案。 */
const STEP_TITLE:Record<number,string>={
  [STEP.rx]:'wizard.s5.short', [STEP.type]:'wizard.s2.short', [STEP.material]:'wizard.s3.short',
  [STEP.treatments]:'wizard.s4.short', [STEP.review]:'wizard.s6.short',
};
/* 处方方式图标。不要在 v-html 字符串里写 rpx（webview 不认），尺寸由 .rxr-ic :deep(svg) 决定。 */
const RXI = (d:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="${BRAND.ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const rxIcons = {
  upload: RXI('<rect x="3" y="6" width="18" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.4"/><path d="M9 6l1.4-2h3.2L15 6"/>'),
  manual: RXI('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  saved:  RXI('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
  later:  RXI('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.6 6.5 12 13l8.4-6.5"/>'),
};
const stepTitle = computed(()=> t(STEP_TITLE[w.value.step] ?? 'wizard.s5.short'));
const stepInFlow = (s:number)=> flowSteps.value.includes(s);
const displayTotal = computed(()=> flowSteps.value.length);
const displayStep  = computed(()=> Math.max(1, flowSteps.value.indexOf(w.value.step)+1));
function setType(k:string){
  wizard.set('type',k as PrescriptionType);
  // 用途由类型派生：选「老花镜」即 readers；改回其他类型时恢复入口派生值。
  // 注意不要覆盖 'sun'（太阳镜镜框在 start() 已派生，影响 SUN_PREFERS_IMPACT 推荐分支）。
  if(k==='readers') wizard.set('use','readers' as PrescriptionUse);
  else if(w.value.use==='readers') wizard.set('use',(frame.value?.category==='sun'?'sun':'rx') as PrescriptionUse);
}
function setLater(){
  wizard.set('prescriptionMethod','later');
  wizard.set('prescriptionId', null);      // 断开旧处方关联，否则 ADD/档位会读到上一次的处方
  wizard.setStrengthBand(null);            // 稍后提供 → 无法评估，不推荐
  wizard.reconcileLensType();              // ADD 没了 → 已选的双光要清掉
  wizard.set('step',STEP.type);
}
function useSaved(){
  if(savedRxValidity.value==='expired'){ uni.showToast({title:t('c3.myrx.expWarn'),icon:'none',duration:3200}); return; }
  wizard.set('prescriptionMethod','saved'); wizard.set('prescriptionId', savedRx.value?.prescriptionId ?? null);
  // 已保存的处方里有真实 SPH，用它派生度数档位（推荐徽标 + 兼容性校验都依赖它）
  wizard.setStrengthBand(savedRx.value?PrescriptionService.strengthBand(savedRx.value):null);
  wizard.reconcileLensType();              // 换了处方 → 若新处方没有 ADD，清掉已选的双光
  wizard.set('step',STEP.type);
}
// 只「进入」流程不算完成：prescriptionMethod 一律由目标页在拿到结果后才写入
// （manual.vue / upload.vue 的 use()）。否则客户进去又退出，处方步会被误判为已完成。
const goManual=()=>{ uni.navigateTo({url:'/pages/prescription/manual'}); };
function goRx(src:string){
  // src 透传给上传页，由它在上传成功后写入真实来源（photo / upload）
  if(src==='upload'||src==='photo') uni.navigateTo({url:`/pages/prescription/upload?src=${src}`});
}
function editStep(key:string){
  const map:Record<string,number>={rx:STEP.rx,type:STEP.type,mat:STEP.material,tr:STEP.treatments};
  const target=map[key];
  // 当前流程外的步位（例如发售期被隐藏的类型步）不可跳转，避免隐藏页面从评审页漏出来
  if(target==null||!stepInFlow(target)) return;
  wizard.set('step',target);
}
function goBack(){
  // 同样沿序列后退：后退绝不会落进被跳过的类型步
  const seq=flowSteps.value; const i=seq.indexOf(w.value.step);
  if(i>0){ wizard.set('step', seq[i-1]); }
  else { const f = wizard.w.frameId ? `/pages/product/detail?id=${wizard.w.frameId}` : FALLBACK.wizard; navBack(f); }
}
function advance(){
  const s=w.value.step;

  if(s===STEP.review){
    if(!frame.value) return;
    const f=frame.value; const c=w.value;
    const cfg={configurationId:c.configurationId,use:c.use,type:c.type,strengthBand:c.strengthBand,
      preference:c.preference,materialId:c.materialId,treatmentIds:[...wizard.includedTreatmentIds,...c.treatmentIds],
      prescriptionMethod:c.prescriptionMethod,prescriptionId:c.prescriptionId};
    if(c.editCartItemId) cart.replaceConfigured(c.editCartItemId,f.id,f.sku,c.colorKey??'night',c.sizeKey??'M',f.price,cfg);
    else cart.addConfigured(f.id,f.sku,c.colorKey??'night',c.sizeKey??'M',f.price,cfg);
    wizard.reset();
    uni.navigateTo({url:'/pages/cart/index'});
    return;
  }
  // 沿当前发售配置下的流程序列前进（被跳过的步位不在序列里，因此永远不会出现）
  const seq=flowSteps.value; const i=seq.indexOf(s);
  wizard.set('step', seq[Math.min(i+1, seq.length-1)]);
}
</script>
<style lang="scss" scoped>
.wz{padding-bottom:200rpx}
/* 步骤标题：不做海报级尺寸，靠字重+留白分层 */
:deep(.h1){font-size:$fs-xl;letter-spacing:-.015em}
.ctx{display:flex;align-items:center;gap:16rpx;background:$card;border:1rpx solid $line;border-radius:$r-sm;padding:12rpx 16rpx;margin-bottom:$sp-4}
.ctx-art{width:100rpx;height:64rpx;border-radius:$r-xs;flex-shrink:0;overflow:hidden}
.ctx-n{font-size:$fs-xs;font-weight:$fw-semi;display:block}
.ctx-p{font-size:$fs-sm;font-weight:$fw-bold;color:$accent-ink;display:block;margin-top:2rpx;font-variant-numeric:tabular-nums}
.pick-hint{background:transparent;border:1rpx dashed $line-strong;border-radius:$r-sm;padding:22rpx;text-align:center;color:$muted;font-size:$fs-xs;line-height:1.6;margin-top:14rpx}
.rec-badges{display:flex;gap:10rpx;flex-wrap:wrap;margin:8rpx 0}
.incompat{font-size:$fs-xs;color:$sunrise;font-weight:$fw-semi;line-height:1.5}
.badge-pill{font-size:16rpx;padding:4rpx 12rpx;border-radius:$r-xs;background:transparent;border:1rpx solid $line-strong;color:$muted;font-weight:$fw-semi;letter-spacing:.08em;text-transform:uppercase}
.why-btn{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.why-txt{font-size:$fs-xs;color:$ink;line-height:1.6;margin-top:10rpx;display:block;background:$mist;padding:16rpx 18rpx;border-radius:$r-sm}
/* 母版 06：左勾选框 / 中文案 / 右价格。Included 与 Optional 用表面区分 */
.treat-row{display:flex;align-items:flex-start;gap:16rpx;padding:20rpx 22rpx;background:$card;
  border:1rpx solid $line;border-radius:$r-md;margin-bottom:12rpx;box-shadow:$shadow-soft}
.treat-row.incl{background:$mist;border-color:transparent;box-shadow:none}
.tck{width:40rpx;height:40rpx;border-radius:$r-xs;border:1rpx solid $line-strong;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:24rpx;color:transparent;background:$card}
.tck.on{background:$accent-strong;border-color:$accent-strong;color:#fff}
.tck.lock{background:$accent-strong;border-color:$accent-strong;color:#fff}
.treat-tx{flex:1}
.treat-name{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.treat-desc{display:block;font-size:$fs-xs;color:$muted;margin-top:4rpx}
.incl-tag{background:transparent;color:$muted;font-size:17rpx;letter-spacing:.08em;text-transform:uppercase;padding:0;font-weight:$fw-semi;white-space:nowrap}
.treat-right{display:flex;align-items:center;gap:14rpx}
.treat-pr{font-size:$fs-sm;font-weight:$fw-semi;color:$ink;white-space:nowrap;font-variant-numeric:tabular-nums;padding-top:2rpx}
.treat-pr.incl{color:$muted}
.sw{width:72rpx;height:42rpx;border-radius:$r-pill;background:$line-strong;position:relative;transition:$dur;flex-shrink:0}
.sw::after{content:"";position:absolute;top:5rpx;left:5rpx;width:32rpx;height:32rpx;border-radius:50%;background:$card;transition:$dur;box-shadow:0 2rpx 6rpx rgba(20,27,61,.18)}
.sw.on{background:$accent-strong}.sw.on::after{left:35rpx}
.rx-saved{display:flex;align-items:center;gap:18rpx;border:1rpx solid $line-strong;background:$card;border-radius:$r-md;padding:22rpx;margin-bottom:14rpx}
.rx-saved.expired{border-color:$sunrise;background:$tint-warn;opacity:.85}
.rx-s-exp{display:block;font-size:$fs-xs;color:$sunrise;margin-top:6rpx;line-height:1.5}
.rx-s-exp.soon{color:$ink}
.rx-s-ic{font-size:30rpx;width:48rpx;text-align:center;flex-shrink:0;color:$teal}
.rx-s-name{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.rx-s-sub{display:block;font-size:$fs-xs;color:$muted}
/* ---- 母版 04：处方方式竖排列表 ---- */
.rxlist{display:flex;flex-direction:column;gap:14rpx}
.rxr{display:flex;align-items:center;gap:18rpx;background:$card;border:1rpx solid $line;
  border-radius:$r-md;padding:20rpx;box-shadow:$shadow-soft}
.rxr.expired{border-color:$sunrise}
.rxr-ic{width:72rpx;height:72rpx;border-radius:$r-sm;background:$stone;flex-shrink:0;
  display:flex;align-items:center;justify-content:center}
.rxr-ic :deep(svg){width:36rpx;height:36rpx;display:block}
.rxr-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:4rpx}
.rxr-n{font-size:$fs-sm;font-weight:$fw-semi;color:$ink;line-height:1.3}
.rxr-s{font-size:18rpx;color:$muted;line-height:1.45}
.rx-note{margin-top:$sp-4;background:$mist;border-radius:$r-sm;padding:20rpx 22rpx;
  font-size:18rpx;color:$muted;line-height:1.6;text-align:center}
.rx-methods{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.rxm{background:$card;border:1rpx solid $line-strong;border-radius:$r-md;padding:24rpx 20rpx;display:flex;flex-direction:column;gap:8rpx}
.rxm.wide{grid-column:1/-1;flex-direction:row;align-items:center}
/* 宽磁贴翻成横向后，标题与说明被包在一个 view 里会退化成 inline（「Send it laterWe'll…」）。
   这里让内层也纵向排列，gap 与 .rxm 自身一致，两行的观感与其余磁贴相同。 */
.rxm-tx{display:flex;flex-direction:column;gap:8rpx;min-width:0;flex:1}
.rmic{font-size:32rpx;line-height:1.2}
.rmn{font-size:$fs-sm;font-weight:$fw-semi;color:$ink}
.rms{font-size:18rpx;color:$muted;line-height:1.45}
</style>
