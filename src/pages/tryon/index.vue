<template>
  <view class="cam">
    <view class="feed" v-html="faceSvg"></view>
    <!-- top bar -->
    <view class="top-bar">
      <view class="cb" @click="exitCam">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </view>
      <KyotoWordmark :height="14" color="#fff"/>
      <view style="display:flex;gap:12rpx">
        <view class="cb" :class="{on:adjusting}" @click="adjusting=!adjusting">⤧</view>
        <view class="cb" @click="compare">⫼</view>
      </view>
    </view>
    <!-- permission screen -->
    <view v-if="!granted" class="perm">
      <view class="perm-art" v-html="permArt"></view>
      <KyotoWordmark :height="20"/>
      <text class="h1" style="margin-top:20rpx">{{$t('tryon.permTitle')}}</text>
      <text class="sub" style="margin:16rpx 0 32rpx">{{$t('tryon.permBody')}}</text>
      <KyotoButton variant="pink" @click="grantCam">{{$t('tryon.allow')}}</KyotoButton>
      <KyotoButton variant="ghost" style="margin-top:14rpx" @click="exitCam">{{$t('tryon.notNow')}}</KyotoButton>
    </view>
    <!-- camera live view -->
    <view v-else>
      <view :class="['guide',{ok:aligned}]"></view>
      <!-- frame overlay -->
      <view v-if="aligned" class="overlay" :style="{transform:`translate(-50%,-50%) translate(${dx}rpx,${dy}rpx)`}">
        <FrameArt :art="selFrame?.art??'round'" :hex="selColor?.hex??'#0D1B2A'" style="width:400rpx;height:auto"/>
      </view>
      <!-- adjust controls -->
      <view v-if="adjusting&&aligned" class="adjust-ctrl">
        <view class="cb sm" @click="dx-=8">←</view>
        <view class="cb sm" @click="dy-=8">↑</view>
        <view class="cb sm" @click="dy+=8">↓</view>
        <view class="cb sm" @click="dx+=8">→</view>
        <view class="cb sm on" @click="dx=0;dy=0;adjusting=false">✓</view>
      </view>
      <view class="hint"><text class="hint-tx">{{aligned?$t('tryon.alignOk'):$t('tryon.align')}}</text></view>
      <!-- bottom controls -->
      <view class="bottom">
        <scroll-view scroll-x class="frame-row">
          <view v-for="(f,i) in frames" :key="f.id" :class="['fbt',{on:frameIdx===i}]" @click="setFrame(i)">
            <FrameArt :art="f.art" :hex="f.colors[0].hex" style="height:90rpx;width:130rpx"/>
            <text class="fbt-pr">${{f.price}}</text>
          </view>
        </scroll-view>
        <view class="color-row">
          <text class="sub" style="font-size:18rpx;color:rgba(255,255,255,.7);margin-right:12rpx">{{$t('product.color')}}</text>
          <view v-for="(c,i) in selFrame?.colors??[]" :key="c.key" :class="['sw',{on:colorIdx===i}]" :style="{background:c.hex}" @click="colorIdx=i"></view>
        </view>
        <view class="ctrl-row">
          <view :class="['cb',{on:fav.has(selFrame?.id??'')}]" @click="toggleFav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.6-9.3-8.6C.8 9 2.4 4.8 6.3 4.2c2.1-.3 4 .8 5.7 2.6 1.7-1.8 3.6-2.9 5.7-2.6 3.9.6 5.5 4.8 3.6 8.2C19 16.4 12 21 12 21z"/></svg>
          </view>
          <view class="shutter" @click="snap">
            <view class="shutter-inner"></view>
          </view>
          <view class="add-btn" @click="addToCart">{{$t('tryon.addToCart')}}</view>
        </view>
      </view>
      <view v-if="snapSaved" class="snap-saved">📸 {{$t('tryon.saved')}}</view>
      <!-- A/B compare (split screen) -->
      <view v-if="comparing" class="cmp">
        <view class="cmp-half">
          <view class="feed" v-html="faceSvg"></view>
          <view class="cmp-frame"><FrameArt :art="selFrame?.art??'round'" :hex="selColor?.hex" style="width:330rpx"/></view>
          <view class="cmp-lab"><text class="cmp-ab">A</text><text>{{selFrame?.name['en-US']}} · ${{selFrame?.price}}</text></view>
          <view class="cmp-pick" @click="chooseCmp(0)">{{$t('tryon.chooseThis')}}</view>
        </view>
        <view class="cmp-half">
          <view class="feed" v-html="faceSvg"></view>
          <view class="cmp-frame"><FrameArt :art="cmpB?.art??'round'" :hex="cmpB?.colors[0].hex" style="width:330rpx"/></view>
          <view class="cmp-lab"><text class="cmp-ab">B</text><text>{{cmpB?.name['en-US']}} · ${{cmpB?.price}}</text></view>
          <view class="cmp-pick" @click="chooseCmp(1)">{{$t('tryon.chooseThis')}}</view>
        </view>
        <view class="cb cmp-close" @click="comparing=false">✕</view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import FrameArt from '@/components/FrameArt.vue';
import { useProductStore } from '@/stores/product';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import { VirtualTryOnService } from '@/services/VirtualTryOnService';
const products = useProductStore(); const fav = useFavoritesStore(); const cart = useCartStore();
const exitCam=()=>uni.navigateBack({fail:()=>uni.reLaunch({url:'/pages/home/index'})});
const frameIdx = ref(0); const colorIdx = ref(0);
const granted = ref(false); const aligned = ref(false);
const adjusting = ref(false); const dx = ref(0); const dy = ref(0); const snapSaved = ref(false);
const comparing = ref(false);
const frames = computed(()=>products.frames.length?products.frames:[]);
const selFrame = computed(()=>frames.value[frameIdx.value]);
const selColor = computed(()=>selFrame.value?.colors[colorIdx.value]??selFrame.value?.colors[0]);
onLoad(async (opts:any)=>{
  await products.ensure();
  if(opts?.frame){ const i=frames.value.findIndex(f=>f.id===opts.frame); if(i>=0) frameIdx.value=i; }
});
async function grantCam(){
  const r = await VirtualTryOnService.requestPermission();
  if(r==='granted'){ granted.value=true; VirtualTryOnService.startMockAlignment(s=>{ aligned.value=s.aligned; }); }
}
const setFrame = (i:number)=>{ frameIdx.value=i; colorIdx.value=0; };
const toggleFav = ()=>fav.toggle(selFrame.value?.id??'');
const compare = ()=>{ if(frames.value.length>1) comparing.value=true; };
const cmpB = computed(()=>frames.value[(frameIdx.value+1)%frames.value.length]);
function chooseCmp(i:number){ if(i===1){ frameIdx.value=(frameIdx.value+1)%frames.value.length; colorIdx.value=0; } comparing.value=false; }
function snap(){ snapSaved.value=true; setTimeout(()=>snapSaved.value=false,1500); }
function addToCart(){
  const f=selFrame.value; if(!f) return;
  cart.addFrameOnly(f.id,f.sku,selColor.value?.key??'night',f.defaultSize,f.price);
  uni.showToast({title:'Added',icon:'none'});
}
const faceSvg = `<svg viewBox="0 0 390 844" style="width:100%;height:100%" preserveAspectRatio="xMidYMid slice"><rect width="390" height="844" fill="#2b2620"/><radialGradient id="sk2" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#d9b59a"/><stop offset="1" stop-color="#9b7358"/></radialGradient><ellipse cx="195" cy="360" rx="110" ry="145" fill="url(#sk2)"/><path d="M85 300q10-160 110-150t110 150q-34-72-110-80t-110 80z" fill="#2a1d17"/><rect x="148" y="480" width="98" height="72" fill="#c48e6e"/><path d="M55 800q20-190 140-190t140 190z" fill="#FFF5E6"/></svg>`;
const permArt = `<svg viewBox="0 0 280 180" style="width:100%;max-width:520rpx"><circle cx="140" cy="90" r="80" fill="#FDE2EB"/><rect x="72" y="58" width="136" height="90" rx="16" fill="#fff" stroke="#0D1B2A" stroke-width="3.5"/><circle cx="140" cy="103" r="24" fill="none" stroke="#0D1B2A" stroke-width="3.5"/><circle cx="140" cy="103" r="9" fill="#FF4F8B"/><rect x="114" y="48" width="52" height="16" rx="7" fill="#0D1B2A"/></svg>`;
</script>
<style lang="scss" scoped>
.cam{position:fixed;inset:0;background:#1a1714;color:#fff;overflow:hidden}
.feed{position:absolute;inset:0}
.top-bar{position:absolute;top:calc(24rpx + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:0 30rpx;z-index:10}
.cb{width:72rpx;height:72rpx;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:28rpx;color:#fff}
.cb svg{width:36rpx;height:36rpx;stroke:currentColor;fill:none;stroke-width:2}.cb.on{background:$sakura}
.cb.sm{width:60rpx;height:60rpx;font-size:24rpx}
.guide{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);width:460rpx;height:600rpx;border:4rpx dashed rgba(255,255,255,.5);border-radius:50%;pointer-events:none;transition:border-color .4s}
.guide.ok{border-color:$teal;border-style:solid}
.overlay{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:5;pointer-events:none;filter:drop-shadow(0 8rpx 16rpx rgba(0,0,0,.4))}
.adjust-ctrl{position:absolute;left:50%;top:54%;transform:translateX(-50%);display:flex;gap:12rpx;z-index:8}
.hint{position:absolute;bottom:460rpx;left:0;right:0;text-align:center;z-index:6}
.hint-tx{background:rgba(13,27,42,.55);backdrop-filter:blur(6px);padding:12rpx 28rpx;border-radius:$r-pill;font-size:$fs-xs;color:rgba(255,255,255,.9)}
.bottom{position:absolute;left:0;right:0;bottom:0;padding:18rpx 18rpx calc(30rpx + #{$safe-b});background:linear-gradient(transparent,rgba(13,27,42,.88) 40%);z-index:7}
.frame-row{white-space:nowrap;margin-bottom:16rpx}
.fbt{display:inline-flex;flex-direction:column;align-items:center;margin-right:14rpx;border:3rpx solid transparent;border-radius:$r-sm;background:rgba(255,255,255,.12);backdrop-filter:blur(6px);overflow:hidden;position:relative}
.fbt.on{border-color:$sakura;background:rgba(255,79,139,.2)}
.fbt-pr{font-size:18rpx;color:#fff;padding:4rpx 0 8rpx;display:block;text-align:center}
.color-row{display:flex;align-items:center;margin-bottom:16rpx}
.sw{width:48rpx;height:48rpx;border-radius:50%;border:4rpx solid transparent;margin-right:14rpx}
.sw.on{border-color:#fff}
.ctrl-row{display:flex;align-items:center;justify-content:space-between}
.shutter{width:120rpx;height:120rpx;border-radius:50%;border:6rpx solid #fff;display:flex;align-items:center;justify-content:center}
.shutter-inner{width:96rpx;height:96rpx;border-radius:50%;background:#fff}
.add-btn{background:$sakura;color:#fff;border-radius:$r-pill;padding:22rpx 28rpx;font-size:$fs-xs;font-weight:$fw-semi;white-space:nowrap}
.snap-saved{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(13,27,42,.88);color:#fff;padding:24rpx 36rpx;border-radius:$r-md;font-size:$fs-sm;z-index:20;text-align:center}
.perm{position:absolute;inset:0;background:$paper;color:$night;display:flex;flex-direction:column;padding:calc(80rpx + env(safe-area-inset-top)) 48rpx calc(60rpx + #{$safe-b});align-items:flex-start}
.perm-art{align-self:center;max-width:520rpx;width:100%;margin-bottom:30rpx}
.cmp{position:absolute;top:0;left:0;right:0;bottom:0;background:$night;z-index:30;display:flex;flex-direction:column}
.cmp-half{flex:1;position:relative;overflow:hidden;border-bottom:3rpx solid rgba(255,255,255,.15)}
.cmp-half .feed{position:absolute;top:0;left:0;right:0;bottom:0;transform:scale(1.25) translateY(6%)}
.cmp-frame{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:2;filter:drop-shadow(0 6rpx 12rpx rgba(0,0,0,.4))}
.cmp-lab{position:absolute;left:24rpx;bottom:20rpx;background:rgba(13,27,42,.6);backdrop-filter:blur(6px);padding:10rpx 20rpx;border-radius:$r-pill;font-size:20rpx;display:flex;gap:12rpx;align-items:center;color:#fff;z-index:3}
.cmp-ab{color:$gold;font-weight:$fw-bold}
.cmp-pick{position:absolute;right:24rpx;bottom:20rpx;background:$sakura;border-radius:$r-pill;padding:12rpx 22rpx;font-size:20rpx;font-weight:$fw-semi;color:#fff;z-index:3}
.cmp-close{position:absolute;top:calc(24rpx + env(safe-area-inset-top));left:30rpx;z-index:31}
</style>
