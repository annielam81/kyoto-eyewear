<template>
  <view class="pd">
    <view class="hdr-abs">
      <view class="ib" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </view>
      <KyotoWordmark :height="16"/>
      <view style="display:flex;gap:12rpx">
        <view class="ib" :class="{on:fav.has(frame?.id??'')}" @click="toggleFav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.6-9.3-8.6C.8 9 2.4 4.8 6.3 4.2c2.1-.3 4 .8 5.7 2.6 1.7-1.8 3.6-2.9 5.7-2.6 3.9.6 5.5 4.8 3.6 8.2C19 16.4 12 21 12 21z"/></svg>
        </view>
        <view class="ib" @click="goCart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12zM6 6L5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
        </view>
      </view>
    </view>
    <view v-if="frame">
      <!-- gallery -->
      <view :class="['gal', frame.tint]">
        <FrameArt :art="frame.art" :hex="selColor.hex" :view="views[viewIdx]" style="height:560rpx"/>
        <view class="vtabs">
          <text v-for="(v,i) in viewLabels" :key="v" :class="['vt',{on:viewIdx===i}]" @click="viewIdx=i">{{v}}</text>
        </view>
        <view class="dots"><text v-for="(_,i) in views" :key="i" :class="['dot',{on:viewIdx===i}]" @click="viewIdx=i"></text></view>
        <view class="tryon-btn" @click="goTryOn">{{$t('product.tryOn')}}</view>
      </view>
      <!-- name + price -->
      <view class="page-pad">
        <!-- 母版 03：名称 → 价格 → 评分 → 描述，左对齐竖排 -->
        <view class="np">
          <text class="pname">{{frame.name[loc]}}</text>
          <text class="zhname">{{frame.nameZH}}</text>
          <text class="seriesline">{{ seriesName }} · {{ seriesTagline }}</text>
          <text class="pr">${{sellPrice}}<text v-if="onPromo" class="was"> ${{frame.price}}</text></text>
          <text class="pairline">{{ $t('product.completePair') }}</text>
          <view class="rate">
            <text class="stars">★★★★★</text>
            <text class="rnum">{{frame.rating}}</text>
            <text class="rcnt">({{frame.reviewCount}})</text>
          </view>
          <text class="pdesc">{{frame.description[loc]}}</text>
        </view>
        <view class="badges">
          <text class="btag">{{$t('product.fsa')}}</text>
          <text class="btag">{{$t('product.freeLens')}}</text>
          <text class="btag">{{$t('product.returns')}}</text>
        </view>
        <!-- color -->
        <text class="sel-lbl">{{$t('product.color')}} · <b>{{selColor.name[loc]}}</b></text>
        <view class="swatches">
          <view v-for="(c,i) in frame.colors" :key="c.key" :class="['sw',{on:colorIdx===i}]"
            :style="{background:c.hex}" @click="colorIdx=i"></view>
        </view>
        <!-- size -->
        <view class="sel-lbl-row">
          <text class="sel-lbl">{{$t('product.size')}} · <b>{{selSize.key}}</b></text>
          <text class="guide-lnk">{{$t('product.sizeGuide')}} ›</text>
        </view>
        <view class="sizes">
          <view v-for="s in frame.sizes" :key="s.key" :class="['szb',{on:sizeIdx===frame.sizes.indexOf(s)},{rec:s.key==='M'}]"
            @click="sizeIdx=frame.sizes.indexOf(s)">
            <text class="sk">{{s.key}}</text>
            <text class="smm">{{s.lensWidth}}-{{s.bridge}}-{{s.temple}}</text>
          </view>
        </view>
        <!-- measurements svg -->
        <view class="measure">
          <svg viewBox="0 0 320 96" style="width:100%;height:auto">
            <g fill="none" stroke="${BRAND.ink}" stroke-width="2.2">
              <circle cx="92" cy="44" r="32"/><circle cx="228" cy="44" r="32"/>
              <path d="M124 40q36-14 72 0M60 38L22 28M260 38L298 28"/>
            </g>
            <g stroke="${BRAND.vermilion}" stroke-width="1.5" fill="${BRAND.vermilion}" font-size="9" font-family="Sora,sans-serif">
              <path d="M60 86h64M60 82v8M124 82v8"/>
              <text x="92" y="79" text-anchor="middle" stroke="none">{{selSize.lensWidth}}</text>
              <path d="M126 12h68M126 8v8M194 8v8"/>
              <text x="160" y="26" text-anchor="middle" stroke="none">{{selSize.bridge}}</text>
            </g>
            <g stroke="${BRAND.aqua}" stroke-width="1.5" fill="${BRAND.aqua}" font-size="9" font-family="Sora,sans-serif">
              <path d="M262 66L300 56M262 62v8M300 52v8"/>
              <text x="290" y="78" text-anchor="middle" stroke="none">{{selSize.temple}}</text>
            </g>
          </svg>
          <view class="mgrid">
            <view><text class="mv">{{selSize.lensWidth}} mm</text><text class="mk">{{$t('product.lensWidth')}}</text></view>
            <view><text class="mv">{{selSize.bridge}} mm</text><text class="mk">{{$t('product.bridge')}}</text></view>
            <view><text class="mv">{{selSize.temple}} mm</text><text class="mk">{{$t('product.temple')}}</text></view>
          </view>
        </view>
        <!-- frame details —— editorial 信息行，无 emoji -->
        <view class="infolist">
          <view class="info-row"><text class="ir-k">{{$t('product.fit')}}</text><text class="ir-v">{{frame.fit[loc]}}</text></view>
          <view class="info-row"><text class="ir-k">{{$t('product.material')}}</text><text class="ir-v">{{frame.frameMaterial[loc]}}</text></view>
          <view class="info-row"><text class="ir-k">{{$t('product.rxCompat')}}</text><text class="ir-v">{{frame.rxRange}}</text></view>
        </view>
        <!-- accordions -->
        <view class="acc" v-for="a in accs" :key="a.k">
          <view class="ah" @click="openAcc=openAcc===a.k?null:a.k">
            <text>{{$t(a.title)}}</text><text>{{openAcc===a.k?'−':'+'}}</text>
          </view>
          <text v-if="openAcc===a.k" class="ab">{{$t(a.body)}}</text>
        </view>
        <!-- reviews -->
        <view class="sec-h">
          <view class="sh-l"><text class="eyebrow">{{frame.reviewCount}} · {{$t('product.reviews')}}</text><text class="sh-t">{{frame.rating}} / 5</text></view>
          <text class="sh-a stars">★★★★★</text>
        </view>
        <view v-for="r in reviews" :key="r.who" class="review">
          <view class="rwho"><text>{{r.who}}</text><text class="stars">★★★★★</text></view>
          <text class="rbody">{{r.body}}</text>
        </view>
        <!-- related -->
        <view class="sec-h"><view class="sh-l"><text class="sh-t">{{$t('product.related')}}</text></view></view>
        <scroll-view scroll-x><view class="hs-in" style="display:flex;gap:18rpx;padding-bottom:10rpx">
          <view v-for="f2 in related" :key="f2.id" style="flex:0 0 280rpx">
            <ProductCard :frame="f2" @open="switchFrame"/>
          </view>
        </view></scroll-view>
      </view>
    </view>
    <!-- sticky CTA -->
    <view class="sticky-cta">
      <view class="cta2">
        <!-- 母版 03 的层级：主操作 Vermilion 在上，次操作 Indigo 在下。
             业务流程仍以代码为准 —— 主 CTA 是「配处方镜片」，不是母版示意的 Try On。 -->
        <KyotoButton variant="pink" :class="{long:$t('product.addLenses').length>22}" @click="startWizard">{{$t('product.addLenses')}}</KyotoButton>
        <KyotoButton variant="night" @click="addFrameOnly">{{$t('product.frameOnly')}} · ${{sellPrice ?? frame?.price}}</KyotoButton>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import FrameArt from '@/components/FrameArt.vue';
import ProductCard from '@/components/ProductCard.vue';
import { useProductStore } from '@/stores/product';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import { useLensWizardStore } from '@/stores/lensWizard';
import type { Locale } from '@/models';
import { frameSellPrice, frameOnPromo, SERIES_INFO } from '@/config/pricing.config';
const { locale } = useI18n();
const loc = computed(()=>locale.value as Locale);
const products = useProductStore(); const fav = useFavoritesStore();
const cart = useCartStore(); const wizard = useLensWizardStore();
import { goBack as navBack, FALLBACK } from '@/utils/nav';
import { BRAND } from '@/config/brand-colors';
const goBack=()=>navBack(FALLBACK.pdp);
const goCart=()=>uni.navigateTo({url:'/pages/cart/index'});
const frameId = ref('arashiyama'); const colorIdx = ref(0); const sizeIdx = ref(0);
const viewIdx = ref(0); const openAcc = ref<string|null>(null);
const views = ['front','side','deg'] as const;
const viewLabels = computed(()=>['Front','Side','45°']);
const frame = computed(()=>products.byId(frameId.value));
const sellPrice = computed(()=>frame.value?frameSellPrice(frame.value):0);
const onPromo = computed(()=>!!frame.value&&frameOnPromo(frame.value));
const seriesName = computed(()=>frame.value?SERIES_INFO[frame.value.series].name[loc.value]:'');
const seriesTagline = computed(()=>frame.value?SERIES_INFO[frame.value.series].tagline[loc.value]:'');
const selColor = computed(()=>frame.value?.colors[colorIdx.value]??{hex:'#0D1B2A',key:'night',name:{'en-US':'Night','zh-CN':'夜空蓝','es-US':'Noche'}});
const selSize = computed(()=>frame.value?.sizes[sizeIdx.value]??{key:'M',lensWidth:49,bridge:20,temple:145});
const related = computed(()=>products.sellable.filter(f=>f.id!==frameId.value).slice(0,4));
const accs = [{k:'ship',title:'product.shippingTitle',body:'product.shipping'},{k:'war',title:'product.warrantyTitle',body:'product.warranty'}];
const reviews = [{who:'Maya K. · M · Night',body:'Light as air, the keyhole bridge never slips. Got the 1.60 blue-light — zero glare on calls.'},{who:'Wen L. · S · Sakura',body:'Bought for my daughter. Fit guide was spot on. Love the sakura pink.'}];
function initSize(){ const f=products.byId(frameId.value); if(f){ const i=f.sizes.findIndex(x=>x.key===f.defaultSize); sizeIdx.value=i>=0?i:0; } }
onLoad(async (opts:any)=>{ if(opts?.id) frameId.value=opts.id; await products.ensure(); initSize(); });
const toggleFav = ()=>{ const added=fav.toggle(frame.value?.id??''); uni.showToast({title:added?'Saved':'Removed',icon:'none'}); };
const goTryOn = ()=>uni.navigateTo({url:`/pages/tryon/index?frame=${frameId.value}`});
const switchFrame = (id:string)=>{ frameId.value=id; colorIdx.value=0; viewIdx.value=0; initSize(); };
const addFrameOnly = ()=>{ if(!frame.value) return; cart.addFrameOnly(frame.value.id,frame.value.sku,selColor.value.key,selSize.value.key,sellPrice.value); uni.showToast({title:'Added to cart',icon:'none'}); };
// 「配处方镜片」已表达处方意图，不再让客户再选一次用途；
// 用途从镜框自身派生：太阳镜镜框 → 'sun'（触发 SUN_PREFERS_IMPACT 推荐分支），其余 → 'rx'。
const startWizard = ()=>{ if(!frame.value) return;
  wizard.start(frame.value.id,selColor.value.key,selSize.value.key, frame.value.category==='sun'?'sun':'rx');
  uni.navigateTo({url:'/pages/wizard/index'}); };
</script>
<style lang="scss" scoped>
.pd{background:$paper;min-height:100vh;padding-bottom:200rpx}
.hdr-abs{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:calc(16rpx + env(safe-area-inset-top)) $sp-3 16rpx;background:rgba(255,245,230,.95);backdrop-filter:blur(10px);z-index:50}
.ib{width:68rpx;height:68rpx;border-radius:50%;background:$card;border:1rpx solid $line-strong;display:flex;align-items:center;justify-content:center;color:$ink}
.ib svg{width:36rpx;height:36rpx}.ib.on{background:$accent-strong;color:#fff;border-color:$accent-strong}
/* 产品图区域拿最大视觉权重；底色只做极浅承托，不抢镜 */
.gal{padding-top:calc(104rpx + env(safe-area-inset-top));position:relative}
.vtabs{position:absolute;top:calc(120rpx + env(safe-area-inset-top));left:$sp-3;display:flex;gap:10rpx}
.vt{font-size:18rpx;letter-spacing:.06em;padding:7rpx 16rpx;border-radius:$r-xs;background:rgba(255,255,255,.72);color:$muted;font-weight:$fw-med;backdrop-filter:blur(6px)}
.vt.on{background:$ink;color:$paper;font-weight:$fw-semi}
.dots{position:absolute;bottom:28rpx;left:50%;transform:translateX(-50%);display:flex;gap:12rpx}
.dot{width:8rpx;height:8rpx;border-radius:50%;background:rgba(20,27,61,.2)}
.dot.on{background:$ink;width:28rpx;border-radius:4rpx}
.tryon-btn{position:absolute;right:$sp-3;bottom:26rpx;background:$ink;color:$paper;border-radius:$r-sm;padding:14rpx 24rpx;font-size:$fs-xs;font-weight:$fw-semi;letter-spacing:.04em}
.np{display:flex;flex-direction:column;align-items:flex-start;gap:6rpx;margin-top:$sp-4}
.pname{font-size:40rpx;font-weight:$fw-bold;letter-spacing:-.015em;line-height:1.2;color:$ink}
.zhname{font-family:'Noto Sans SC',sans-serif;font-size:$fs-xs;color:$muted;letter-spacing:.16em;display:block;margin-top:6rpx}
.pr{font-size:36rpx;font-weight:$fw-bold;color:$ink;display:block;line-height:1.2;margin-top:6rpx;font-variant-numeric:tabular-nums}
.pr .was{font-size:24rpx;color:$muted;font-weight:$fw-reg;text-decoration:line-through;margin-left:10rpx}
.seriesline{font-size:22rpx;color:$accent-strong;font-weight:$fw-semi;letter-spacing:.08em;margin-top:10rpx;display:block}
.pairline{font-size:22rpx;color:$muted;line-height:1.6;margin-top:8rpx;display:block}
.rate{display:flex;align-items:baseline;gap:8rpx;margin-top:4rpx}
.rnum{font-size:$fs-xs;font-weight:$fw-semi;color:$ink;font-variant-numeric:tabular-nums}
.rcnt{font-size:18rpx;color:$muted;font-variant-numeric:tabular-nums}
.pdesc{font-size:$fs-xs;color:$muted;line-height:1.6;margin-top:10rpx}

.badges{display:flex;gap:10rpx;flex-wrap:wrap;margin-top:$sp-2}
.btag{font-size:17rpx;letter-spacing:.08em;padding:6rpx 14rpx;border-radius:$r-xs;font-weight:$fw-semi;
  text-transform:uppercase;color:$muted;border:1rpx solid $line-strong}
.tag{font-size:19rpx;letter-spacing:.08em;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi;text-transform:uppercase}
.tag.teal{background:$tint-teal2;color:$teal}.tag.soft{background:$tint-accent;color:$accent-ink}.tag.mist{background:$mist;color:$night}
.sel-lbl{display:block;font-size:18rpx;letter-spacing:.08em;text-transform:uppercase;color:$muted;font-weight:$fw-semi;margin:$sp-5 0 14rpx}
.sel-lbl-row{display:flex;justify-content:space-between;align-items:baseline;margin:$sp-5 0 14rpx}
.sel-lbl-row .sel-lbl{margin:0}
.guide-lnk{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.swatches{display:flex;gap:20rpx}
.sw{width:56rpx;height:56rpx;border-radius:50%;border:3rpx solid transparent}
.sw.on{border-color:$ink;box-shadow:inset 0 0 0 5rpx $paper}
.sizes{display:flex;gap:16rpx}
.szb{flex:1;border:1rpx solid $line-strong;background:$card;border-radius:$r-sm;padding:16rpx 10rpx;text-align:center;position:relative}
.szb.on{border-color:$ink;background:$ink;color:$paper}
.szb.rec::after{content:"";position:absolute;top:-1rpx;left:50%;transform:translateX(-50%);width:28rpx;height:3rpx;background:$accent;border-radius:$r-pill}
.sk{display:block;font-size:$fs-sm;font-weight:$fw-bold}
.smm{display:block;font-size:19rpx;color:$muted;margin-top:4rpx}
.szb.on .smm{color:rgba(255,255,255,.7)}
.measure{background:$card;border:1rpx solid $line;border-radius:$r-md;padding:24rpx;margin-top:$sp-2}
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16rpx;margin-top:18rpx;text-align:center}
.mv{display:block;font-size:$fs-md;font-weight:$fw-bold;font-variant-numeric:tabular-nums}
.mk{font-size:17rpx;letter-spacing:.06em;text-transform:uppercase;color:$muted;font-weight:$fw-med}
.infolist{margin-top:$sp-4;border-top:2rpx solid $line}
.acc{border-top:2rpx solid $line}
.ah{display:flex;justify-content:space-between;align-items:center;padding:24rpx 0;font-size:$fs-sm;font-weight:$fw-semi;color:$ink}
.ab{font-size:$fs-xs;color:$muted;line-height:1.7;padding-bottom:20rpx}

.review{padding:20rpx 0;border-top:2rpx solid $line}
.rwho{display:flex;justify-content:space-between;font-size:20rpx;color:$muted;margin-bottom:8rpx}
.stars{color:$gold}
.rbody{font-size:$fs-xs;line-height:1.6}
/* 母版 03：两颗全宽 CTA 竖排 —— 主操作 Vermilion，次操作 Indigo */
.cta2{display:flex;flex-direction:column;gap:12rpx}
</style>
