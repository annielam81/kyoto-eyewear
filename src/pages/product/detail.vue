<template>
  <view class="pd">
    <view class="hdr-abs">
      <view class="ib" @click="uni.navigateBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </view>
      <KyotoWordmark :height="16"/>
      <view style="display:flex;gap:12rpx">
        <view class="ib" :class="{on:fav.has(frame?.id??'')}" @click="toggleFav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.6-9.3-8.6C.8 9 2.4 4.8 6.3 4.2c2.1-.3 4 .8 5.7 2.6 1.7-1.8 3.6-2.9 5.7-2.6 3.9.6 5.5 4.8 3.6 8.2C19 16.4 12 21 12 21z"/></svg>
        </view>
        <view class="ib" @click="uni.navigateTo({url:'/pages/cart/index'})">
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
        <view class="tryon-btn" @click="goTryOn">📷 {{$t('product.tryOn')}}</view>
      </view>
      <!-- name + price -->
      <view class="page-pad">
        <view class="np">
          <view>
            <text class="h1" style="font-size:44rpx">{{frame.name[loc]}}</text>
            <text class="zhname">{{frame.nameZH}}</text>
          </view>
          <view class="prbox">
            <text class="pr">${{frame.price}}</text>
            <text class="prsmall">{{$t('product.lensesFrom')}} $0</text>
          </view>
        </view>
        <view class="badges">
          <text class="tag teal">✓ {{$t('product.fsa')}}</text>
          <text class="tag soft">{{$t('product.freeLens')}}</text>
          <text class="tag mist">{{$t('product.returns')}}</text>
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
            <g fill="none" stroke="#0D1B2A" stroke-width="2.2">
              <circle cx="92" cy="44" r="32"/><circle cx="228" cy="44" r="32"/>
              <path d="M124 40q36-14 72 0M60 38L22 28M260 38L298 28"/>
            </g>
            <g stroke="#FF4F8B" stroke-width="1.5" fill="#FF4F8B" font-size="9" font-family="Sora,sans-serif">
              <path d="M60 86h64M60 82v8M124 82v8"/>
              <text x="92" y="79" text-anchor="middle" stroke="none">{{selSize.lensWidth}}</text>
              <path d="M126 12h68M126 8v8M194 8v8"/>
              <text x="160" y="26" text-anchor="middle" stroke="none">{{selSize.bridge}}</text>
            </g>
            <g stroke="#0B7C6E" stroke-width="1.5" fill="#0B7C6E" font-size="9" font-family="Sora,sans-serif">
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
        <!-- info rows -->
        <view class="infolist">
          <view class="it"><text class="ic2">👤</text><view><text class="ih">{{$t('product.fit')}}</text><text class="is">{{frame.fit[loc]}}</text></view></view>
          <view class="it"><text class="ic2">✦</text><view><text class="ih">{{$t('product.material')}}</text><text class="is">{{frame.frameMaterial[loc]}}</text></view></view>
          <view class="it"><text class="ic2">◎</text><view><text class="ih">{{$t('product.rxCompat')}}</text><text class="is">{{frame.rxRange}}</text></view></view>
        </view>
        <!-- accordions -->
        <view class="acc" v-for="a in accs" :key="a.k">
          <view class="ah" @click="openAcc=openAcc===a.k?null:a.k">
            <text>{{$t(a.title)}}</text><text>{{openAcc===a.k?'−':'+'}}</text>
          </view>
          <text v-if="openAcc===a.k" class="ab">{{$t(a.body)}}</text>
        </view>
        <!-- reviews -->
        <view class="sec-hd"><text class="h2">{{$t('product.reviews')}} ★★★★★ {{frame.rating}}</text></view>
        <view v-for="r in reviews" :key="r.who" class="review">
          <view class="rwho"><text>{{r.who}}</text><text class="stars">★★★★★</text></view>
          <text class="rbody">{{r.body}}</text>
        </view>
        <!-- related -->
        <text class="h2" style="margin:32rpx 0 18rpx">{{$t('product.related')}}</text>
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
        <KyotoButton variant="ghost" size="sm" @click="addFrameOnly">{{$t('product.frameOnly')}}<br/><text style="font-weight:500;font-size:20rpx;opacity:.7">${{frame?.price}}</text></KyotoButton>
        <KyotoButton variant="pink" @click="startWizard">{{$t('product.addLenses')}} →</KyotoButton>
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
const { locale } = useI18n();
const loc = computed(()=>locale.value as Locale);
const products = useProductStore(); const fav = useFavoritesStore();
const cart = useCartStore(); const wizard = useLensWizardStore();
const frameId = ref('arashiyama'); const colorIdx = ref(0); const sizeIdx = ref(0);
const viewIdx = ref(0); const openAcc = ref<string|null>(null);
const views = ['front','side','deg'] as const;
const viewLabels = computed(()=>['Front','Side','45°']);
const frame = computed(()=>products.byId(frameId.value));
const selColor = computed(()=>frame.value?.colors[colorIdx.value]??{hex:'#0D1B2A',key:'night',name:{'en-US':'Night','zh-CN':'夜空蓝','es-US':'Noche'}});
const selSize = computed(()=>frame.value?.sizes[sizeIdx.value]??{key:'M',lensWidth:49,bridge:20,temple:145});
const related = computed(()=>products.frames.filter(f=>f.id!==frameId.value).slice(0,4));
const accs = [{k:'ship',title:'product.shippingTitle',body:'product.shipping'},{k:'war',title:'product.warrantyTitle',body:'product.warranty'}];
const reviews = [{who:'Maya K. · M · Night',body:'Light as air, the keyhole bridge never slips. Got the 1.60 blue-light — zero glare on calls.'},{who:'Wen L. · S · Sakura',body:'Bought for my daughter. Fit guide was spot on. Love the sakura pink.'}];
onLoad((opts:any)=>{ if(opts?.id) frameId.value=opts.id; products.ensure(); });
const toggleFav = ()=>{ const added=fav.toggle(frame.value?.id??''); uni.showToast({title:added?'Saved':'Removed',icon:'none'}); };
const goTryOn = ()=>uni.navigateTo({url:`/pages/tryon/index?frame=${frameId.value}`});
const switchFrame = (id:string)=>{ frameId.value=id; colorIdx.value=0; sizeIdx.value=0; viewIdx.value=0; };
const addFrameOnly = ()=>{ if(!frame.value) return; cart.addFrameOnly(frame.value.id,frame.value.sku,selColor.value.key,selSize.value.key,frame.value.price); uni.showToast({title:'Added to cart',icon:'none'}); };
const startWizard = ()=>{ if(!frame.value) return; wizard.start(frame.value.id,selColor.value.key,selSize.value.key); uni.navigateTo({url:'/pages/wizard/index'}); };
</script>
<style lang="scss" scoped>
.pd{background:$paper;min-height:100vh;padding-bottom:200rpx}
.hdr-abs{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:calc(16rpx + env(safe-area-inset-top)) $sp-3 16rpx;background:rgba(255,245,230,.95);backdrop-filter:blur(10px);z-index:50}
.ib{width:72rpx;height:72rpx;border-radius:50%;background:#fff;border:2rpx solid $line;display:flex;align-items:center;justify-content:center}
.ib svg{width:36rpx;height:36rpx}.ib.on{background:$sakura;color:#fff;border-color:$sakura}
.gal{padding-top:calc(110rpx + env(safe-area-inset-top));position:relative}
.vtabs{position:absolute;top:calc(120rpx + env(safe-area-inset-top));left:$sp-3;display:flex;gap:10rpx}
.vt{font-size:20rpx;padding:8rpx 18rpx;border-radius:$r-pill;background:rgba(255,255,255,.7);color:$muted;backdrop-filter:blur(6px)}
.vt.on{background:$night;color:#fff}
.dots{position:absolute;bottom:28rpx;left:50%;transform:translateX(-50%);display:flex;gap:12rpx}
.dot{width:12rpx;height:12rpx;border-radius:50%;background:rgba(13,27,42,.22)}
.dot.on{background:$night;width:36rpx;border-radius:6rpx}
.tryon-btn{position:absolute;right:$sp-3;bottom:28rpx;background:$night;color:#fff;border-radius:$r-pill;padding:18rpx 28rpx;font-size:22rpx;font-weight:$fw-semi}
.np{display:flex;justify-content:space-between;align-items:flex-start;gap:18rpx;margin-top:30rpx}
.zhname{font-family:'Noto Sans SC',sans-serif;font-size:$fs-sm;color:$muted;letter-spacing:.2em;display:block;margin-top:4rpx}
.prbox{text-align:right}.pr{font-size:44rpx;font-weight:$fw-bold;color:$sunrise;display:block}
.prsmall{font-size:$fs-xs;color:$muted;display:block}
.badges{display:flex;gap:10rpx;flex-wrap:wrap;margin-top:16rpx}
.tag{font-size:19rpx;letter-spacing:.08em;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi;text-transform:uppercase}
.tag.teal{background:$tint-teal2;color:$teal}.tag.soft{background:#FFF0F5;color:$sakura}.tag.mist{background:$mist;color:$night}
.sel-lbl{display:block;font-size:$fs-xs;color:$muted;margin:32rpx 0 14rpx}
.sel-lbl-row{display:flex;justify-content:space-between;align-items:center;margin:32rpx 0 14rpx}
.guide-lnk{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.swatches{display:flex;gap:20rpx}
.sw{width:64rpx;height:64rpx;border-radius:50%;border:4rpx solid transparent;cursor:pointer}
.sw.on{border-color:$night;box-shadow:inset 0 0 0 6rpx $paper}
.sizes{display:flex;gap:16rpx}
.szb{flex:1;border:3rpx solid $line;background:#fff;border-radius:$r-sm;padding:18rpx 10rpx;text-align:center;position:relative}
.szb.on{border-color:$night;background:$night;color:#fff}
.szb.rec::after{content:"✓";position:absolute;top:-14rpx;right:14rpx;background:$teal;color:#fff;font-size:18rpx;padding:2rpx 10rpx;border-radius:$r-pill}
.sk{display:block;font-size:$fs-sm;font-weight:$fw-bold}
.smm{display:block;font-size:19rpx;color:$muted;margin-top:4rpx}
.szb.on .smm{color:rgba(255,255,255,.7)}
.measure{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-top:16rpx}
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16rpx;margin-top:18rpx;text-align:center}
.mv{display:block;font-size:$fs-md;font-weight:$fw-bold}
.mk{font-size:$fs-xs;color:$muted}
.infolist{margin-top:12rpx}
.it{display:flex;gap:20rpx;padding:22rpx 0;border-bottom:2rpx solid $line;font-size:$fs-sm}
.it:last-child{border:none}
.ic2{font-size:28rpx;width:40rpx;text-align:center;flex-shrink:0;padding-top:2rpx}
.ih{display:block;font-size:$fs-sm;font-weight:$fw-semi;margin-bottom:4rpx}
.is{font-size:$fs-xs;color:$muted;line-height:1.6}
.acc{border-top:2rpx solid $line}.ah{display:flex;justify-content:space-between;padding:26rpx 0;font-size:$fs-sm;font-weight:$fw-semi}
.ab{font-size:$fs-xs;color:$muted;line-height:1.7;padding-bottom:20rpx}
.sec-hd{margin:28rpx 0 16rpx}
.review{padding:22rpx 0;border-top:2rpx solid $line}
.rwho{display:flex;justify-content:space-between;font-size:20rpx;color:$muted;margin-bottom:8rpx}
.stars{color:$gold}
.rbody{font-size:$fs-xs;line-height:1.6}
.cta2{display:grid;grid-template-columns:1fr 1.6fr;gap:14rpx}
</style>
