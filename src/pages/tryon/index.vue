<template>
  <view class="cam">
    <!-- 真机自拍 / 相册照片，全屏显示 -->
    <image v-if="photo" class="feed" :src="photo" mode="aspectFill"></image>
    <!-- top bar -->
    <view class="try-topbar">
      <view class="cb" @click="exitCam">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </view>
      <view class="tb-mid">
        <KyotoWordmark :height="14" color="#fff"/>
      </view>
      <view style="display:flex;gap:12rpx">
        <view v-if="photo" class="cb" :class="{on:adjusting}" @click="adjusting=!adjusting">⤧</view>
        <view v-if="photo" class="cb" @click="compare">⫼</view>
      </view>
    </view>
    <!-- 起始页：选照片来源 -->
    <view v-if="!photo" class="perm">
      <view class="perm-art" v-html="permArt"></view>
      <KyotoWordmark :height="20"/>
      <text class="h1" style="margin-top:20rpx">{{$t('tryon.permTitle')}}</text>
      <text class="sub" style="margin:16rpx 0 32rpx">{{$t('tryon.permBody')}}</text>
      <KyotoButton variant="pink" @click="takePhoto('camera')">{{$t('tryon.takePhoto')}}</KyotoButton>
      <KyotoButton variant="ghost" style="margin-top:14rpx" @click="takePhoto('album')">{{$t('tryon.chooseAlbum')}}</KyotoButton>
      <KyotoButton variant="ghost" style="margin-top:14rpx" @click="exitCam">{{$t('common.back')}}</KyotoButton>
    </view>
    <!-- 自拍试戴 -->
    <view v-else>
      <!-- frame overlay（可拖动） -->
      <view class="overlay"
        :style="{marginLeft:ox+'px',marginTop:oy+'px',width:(700*oscale)+'rpx'}"
        @touchstart="onDragStart" @touchmove.stop.prevent="onDragMove">
        <FrameArt :art="selFrame?.art??'round'" :hex="selColor?.hex??'#0D1B2A'" style="width:100%;height:auto"/>
      </view>
      <!-- adjust controls -->
      <view v-if="adjusting" class="adjust-ctrl">
        <view class="cb sm" @click="oy-=8">↑</view>
        <view class="cb sm" @click="ox-=8">←</view>
        <view class="cb sm" @click="ox+=8">→</view>
        <view class="cb sm" @click="oy+=8">↓</view>
        <view class="cb sm" @click="zoom(-0.1)">－</view>
        <view class="cb sm" @click="zoom(0.1)">＋</view>
        <view class="cb sm on" @click="adjusting=false">✓</view>
      </view>
      <view class="hint"><text class="hint-tx">{{adjusting?$t('tryon.adjust'):$t('tryon.dragHint')}}</text></view>
      <!-- bottom controls -->
      <view class="bottom">
        <scroll-view scroll-x class="frame-row">
          <view v-for="(f,i) in frames" :key="f.id" :class="['fbt',{on:frameIdx===i}]" @click="setFrame(i)">
            <FrameArt :art="f.art" :hex="f.colors[0].hex" style="height:90rpx;width:130rpx"/>
            <text class="fbt-pr">${{sp(f)}}</text>
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
      <!-- A/B compare (split screen, 同一张自拍) -->
      <view v-if="comparing" class="cmp">
        <view class="cmp-half">
          <image class="feed zoom" :src="photo" mode="aspectFill"></image>
          <view class="cmp-frame"><FrameArt :art="selFrame?.art??'round'" :hex="selColor?.hex" style="width:440rpx"/></view>
          <view class="cmp-lab"><text class="cmp-ab">A</text><text>{{selFrame?.name['en-US']}} · ${{selFrame?sp(selFrame):''}}</text></view>
          <view class="cmp-pick" @click="chooseCmp(0)">{{$t('tryon.chooseThis')}}</view>
        </view>
        <view class="cmp-half">
          <image class="feed zoom" :src="photo" mode="aspectFill"></image>
          <view class="cmp-frame"><FrameArt :art="cmpB?.art??'round'" :hex="cmpB?.colors[0].hex" style="width:440rpx"/></view>
          <view class="cmp-lab"><text class="cmp-ab">B</text><text>{{cmpB?.name['en-US']}} · ${{cmpB?sp(cmpB):''}}</text></view>
          <view class="cmp-pick" @click="chooseCmp(1)">{{$t('tryon.chooseThis')}}</view>
        </view>
        <view class="cb cmp-close" @click="comparing=false">✕</view>
      </view>
      <!-- 合成用隐藏 canvas -->
      <canvas canvas-id="snapCanvas" :style="{width:cw+'px',height:ch+'px',position:'absolute',left:'-9999px',top:'0'}"></canvas>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, nextTick, getCurrentInstance } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import FrameArt from '@/components/FrameArt.vue';
import { useProductStore } from '@/stores/product';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import { frameSellPrice } from '@/config/pricing.config';
import type { Frame } from '@/models';
import { goBack as navBack, FALLBACK } from '@/utils/nav';
import { BRAND } from '@/config/brand-colors';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const instance = getCurrentInstance();
const products = useProductStore(); const fav = useFavoritesStore(); const cart = useCartStore();
const sp = (f: Frame) => frameSellPrice(f);
const exitCam=()=>navBack(FALLBACK.pdp);
const frameIdx = ref(0); const colorIdx = ref(0);
/* 自拍试戴状态 */
const photo = ref('');                 // 自拍 / 相册照片本地路径
const ox = ref(0), oy = ref(0);         // 眼镜偏移（px，可拖动）
const oscale = ref(1);                  // 眼镜缩放
const adjusting = ref(false);
const snapSaved = ref(false);
const comparing = ref(false);
const cw = ref(900), ch = ref(1200);    // 合成 canvas 尺寸
const frames = computed(()=>products.frames.length?products.frames:[]);
const selFrame = computed(()=>frames.value[frameIdx.value]);
const selColor = computed(()=>selFrame.value?.colors[colorIdx.value]??selFrame.value?.colors[0]);
onLoad(async (opts:any)=>{
  await products.ensure();
  if(opts?.frame){ const i=frames.value.findIndex(f=>f.id===opts.frame); if(i>=0) frameIdx.value=i; }
});
const setFrame = (i:number)=>{ frameIdx.value=i; colorIdx.value=0; };
const toggleFav = ()=>fav.toggle(selFrame.value?.id??'');
const compare = ()=>{ if(frames.value.length>1) comparing.value=true; };
const cmpB = computed(()=>frames.value[(frameIdx.value+1)%frames.value.length]);
function chooseCmp(i:number){ if(i===1){ frameIdx.value=(frameIdx.value+1)%frames.value.length; colorIdx.value=0; } comparing.value=false; }
/* ---- 照片来源 ---- */
function takePhoto(src:'camera'|'album'){
  uni.chooseImage({ count:1, sourceType:[src], sizeType:['compressed'],
    success:(res)=>{ photo.value = res.tempFilePaths[0]; ox.value=0; oy.value=0; oscale.value=1; },
  });
}
/* ---- 拖动 / 缩放眼镜 ---- */
let dragX=0, dragY=0;
function onDragStart(e:any){ const t=e.changedTouches[0]; dragX=t.clientX; dragY=t.clientY; }
function onDragMove(e:any){
  const t=e.changedTouches[0];
  ox.value=Math.max(-300,Math.min(300,ox.value+t.clientX-dragX));
  oy.value=Math.max(-300,Math.min(300,oy.value+t.clientY-dragY));
  dragX=t.clientX; dragY=t.clientY;
}
function zoom(d:number){ oscale.value=Math.max(0.6,Math.min(1.8,+(oscale.value+d).toFixed(2))); }
function addToCart(){
  const f=selFrame.value; if(!f) return;
  cart.addFrameOnly(f.id,f.sku,selColor.value?.key??'night',f.defaultSize,sp(f));
  uni.showToast({title:'Added',icon:'none'});
}
/* ---- 快门：canvas 合成自拍 + 眼镜，存相册 ---- */
function getImageInfo(src:string):Promise<{width:number;height:number;path:string}>{
  return new Promise((res,rej)=>uni.getImageInfo({src,success:res,fail:rej}));
}
function rr(ctx:any,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
/** 把 FrameArt 的线稿画到 canvas 上（与组件内 ARTS 同构）。 */
function drawFrameArt(ctx:any,art:string,hex:string,cx:number,cy:number,w:number){
  const s=w/200, x0=cx-w/2, y0=cy-w*0.2;
  const X=(v:number)=>x0+v*s, Y=(v:number)=>y0+v*s;
  const bridge=(a:number,b:number,c:number,d:number)=>{ ctx.beginPath(); ctx.moveTo(X(a),Y(b)); ctx.quadraticCurveTo(X(c),Y(d),X(2*c-a),Y(b)); ctx.stroke(); };
  const line=(a:number,b:number,c:number,d:number)=>{ ctx.beginPath(); ctx.moveTo(X(a),Y(b)); ctx.lineTo(X(c),Y(d)); ctx.stroke(); };
  ctx.save(); ctx.strokeStyle=hex; ctx.lineWidth=4*s; ctx.lineCap='round'; ctx.lineJoin='round';
  const lensFill='rgba(255,255,255,0.32)';
  if(art==='square'){
    for(const xv of [25,113]){ rr(ctx,X(xv),Y(18),62*s,46*s,10*s); ctx.fillStyle=lensFill; ctx.fill(); ctx.stroke(); }
    bridge(87,32,100,23); line(25,30,7,22); line(175,30,193,22);
  }else if(art==='cat'){
    for(const xo of [0,88]){
      ctx.beginPath(); ctx.moveTo(X(25+xo),Y(42));
      ctx.quadraticCurveTo(X(25+xo),Y(20),X(57+xo),Y(20));
      ctx.quadraticCurveTo(X(87+xo),Y(20),X(87+xo),Y(42));
      ctx.quadraticCurveTo(X(87+xo),Y(62),X(57+xo),Y(62));
      ctx.quadraticCurveTo(X(25+xo),Y(62),X(25+xo),Y(42));
      ctx.closePath(); ctx.fillStyle=lensFill; ctx.fill(); ctx.stroke();
    }
    bridge(87,36,100,26); line(25,34,6,20); line(175,34,194,20);
  }else if(art==='sun'){
    ctx.fillStyle=hex; ctx.globalAlpha=0.82;
    for(const xo of [0,86]){
      ctx.beginPath(); ctx.moveTo(X(25+xo),Y(30)); ctx.lineTo(X(89+xo),Y(30)); ctx.lineTo(X(89+xo),Y(40));
      ctx.quadraticCurveTo(X(89+xo),Y(66),X(57+xo),Y(66));
      ctx.quadraticCurveTo(X(25+xo),Y(66),X(25+xo),Y(40));
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha=1; bridge(89,34,100,26); line(25,32,7,24); line(175,32,193,24);
  }else if(art==='aviator'){
    ctx.fillStyle=hex; ctx.globalAlpha=0.4;
    const lens=(pts:number[])=>{ ctx.beginPath(); ctx.moveTo(X(pts[0]),Y(pts[1]));
      for(let i=2;i<pts.length;i+=4){ ctx.quadraticCurveTo(X(pts[i]),Y(pts[i+1]),X(pts[i+2]),Y(pts[i+3])); }
      ctx.closePath(); ctx.fill(); };
    lens([28,26, 90,26,89,32, 85,56,83,68, 59,68,33,68, 29,50,25,32, 24,26,28,26]);
    lens([114,26, 176,26,175,32, 171,50,167,68, 141,68,117,68, 115,56,111,32, 110,26,114,26]);
    ctx.globalAlpha=1; bridge(89,30,100,22); line(28,30,8,22); line(172,30,192,22);
  }else{ // round（默认）
    for(const cv of [55,145]){ ctx.beginPath(); ctx.arc(X(cv),Y(42),28*s,0,7); ctx.fillStyle=lensFill; ctx.fill(); ctx.stroke(); }
    bridge(83,38,100,26); line(27,36,8,26); line(173,36,192,26);
  }
  ctx.restore();
}
async function snap(){
  if(!photo.value) return;
  try{
    const sys=uni.getSystemInfoSync();
    const W=900, H=Math.round(900*sys.windowHeight/sys.windowWidth);
    cw.value=W; ch.value=H; await nextTick();
    const info=await getImageInfo(photo.value);
    const ctx=uni.createCanvasContext('snapCanvas', instance as any);
    const sc=Math.max(W/info.width,H/info.height), dw=info.width*sc, dh=info.height*sc;
    ctx.drawImage(photo.value,(W-dw)/2,(H-dh)/2,dw,dh);
    // 眼镜位置：屏幕坐标 → canvas 坐标
    const kx=W/sys.windowWidth, ky=H/sys.windowHeight;
    const owPx=(700*oscale.value)/750*sys.windowWidth;
    const artW=owPx*0.72; // 与 FrameArt 内层 svg 的 72% 对齐
    drawFrameArt(ctx, selFrame.value?.art??'round', selColor.value?.hex??'#0D1B2A',
      (sys.windowWidth/2+ox.value)*kx, (sys.windowHeight*0.42+oy.value)*ky, artW*kx);
    await new Promise<void>(r=>ctx.draw(false,()=>r()));
    const tmp=await new Promise<string>((res,rej)=>uni.canvasToTempFilePath({
      canvasId:'snapCanvas', destWidth:W, destHeight:H, success:(o:any)=>res(o.tempFilePath), fail:rej }));
    await new Promise<void>((res,rej)=>uni.saveImageToPhotosAlbum({filePath:tmp,success:()=>res(),fail:rej}));
    snapSaved.value=true; setTimeout(()=>snapSaved.value=false,1500);
  }catch(e){ uni.showToast({title:t('tryon.saveFail'),icon:'none'}); }
}
// 同样不要在 v-html 里写 rpx —— max-width 交给 .perm-art 的编译期 CSS
const permArt = `<svg viewBox="0 0 280 180" style="width:100%"><circle cx="140" cy="90" r="80" fill="${BRAND.tintVermilion}"/><rect x="72" y="58" width="136" height="90" rx="16" fill="#fff" stroke="${BRAND.ink}" stroke-width="3.5"/><circle cx="140" cy="103" r="24" fill="none" stroke="${BRAND.ink}" stroke-width="3.5"/><circle cx="140" cy="103" r="9" fill="${BRAND.vermilion}"/><rect x="114" y="48" width="52" height="16" rx="7" fill="${BRAND.ink}"/></svg>`;
</script>
<style lang="scss" scoped>
.cam{position:fixed;inset:0;background:#1a1714;color:#fff;overflow:hidden}
.feed{position:absolute;inset:0;width:100%;height:100%}
.feed.zoom{transform:scale(1.25) translateY(6%)}
.try-topbar{position:absolute;top:calc(24rpx + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:0 30rpx;z-index:10;background:transparent;margin:0}
.tb-mid{display:flex;flex-direction:column;align-items:center;gap:6rpx}
.cb{width:72rpx;height:72rpx;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:28rpx;color:#fff}
.cb svg{width:36rpx;height:36rpx;stroke:currentColor;fill:none;stroke-width:2}.cb.on{background:$accent-strong}
.cb.sm{width:60rpx;height:60rpx;font-size:24rpx}
.overlay{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:5;filter:drop-shadow(0 8rpx 16rpx rgba(0,0,0,.4))}
.adjust-ctrl{position:absolute;left:50%;top:54%;transform:translateX(-50%);display:flex;gap:12rpx;z-index:8}
.hint{position:absolute;bottom:460rpx;left:0;right:0;text-align:center;z-index:6;pointer-events:none}
.hint-tx{background:rgba(13,27,42,.55);backdrop-filter:blur(6px);padding:12rpx 28rpx;border-radius:$r-pill;font-size:$fs-xs;color:rgba(255,255,255,.9)}
.bottom{position:absolute;left:0;right:0;bottom:0;padding:18rpx 18rpx calc(30rpx + #{$safe-b});background:linear-gradient(transparent,rgba(13,27,42,.88) 40%);z-index:7}
.frame-row{white-space:nowrap;margin-bottom:16rpx}
.fbt{display:inline-flex;flex-direction:column;align-items:center;margin-right:14rpx;border:3rpx solid transparent;border-radius:$r-sm;background:rgba(255,255,255,.12);backdrop-filter:blur(6px);overflow:hidden;position:relative}
.fbt.on{border-color:$accent;background:rgba(228,61,48,.16)}
.fbt-pr{font-size:18rpx;color:#fff;padding:4rpx 0 8rpx;display:block;text-align:center}
.color-row{display:flex;align-items:center;margin-bottom:16rpx}
.sw{width:48rpx;height:48rpx;border-radius:50%;border:4rpx solid transparent;margin-right:14rpx}
.sw.on{border-color:#fff}
.ctrl-row{display:flex;align-items:center;justify-content:space-between}
.shutter{width:120rpx;height:120rpx;border-radius:50%;border:6rpx solid #fff;display:flex;align-items:center;justify-content:center}
.shutter-inner{width:96rpx;height:96rpx;border-radius:50%;background:#fff}
.add-btn{background:$accent-strong;color:#fff;border-radius:$r-pill;padding:22rpx 28rpx;font-size:$fs-xs;font-weight:$fw-semi;white-space:nowrap}
.snap-saved{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(13,27,42,.88);color:#fff;padding:24rpx 36rpx;border-radius:$r-md;font-size:$fs-sm;z-index:20;text-align:center}
.perm-art{width:100%;max-width:520rpx}
.perm{position:absolute;inset:0;background:$paper;color:$night;display:flex;flex-direction:column;padding:calc(80rpx + env(safe-area-inset-top)) 48rpx calc(60rpx + #{$safe-b});align-items:flex-start}
.perm-art{align-self:center;max-width:520rpx;width:100%;margin-bottom:30rpx}
.cmp{position:absolute;top:0;left:0;right:0;bottom:0;background:$night;z-index:30;display:flex;flex-direction:column}
.cmp-half{flex:1;position:relative;overflow:hidden;border-bottom:3rpx solid rgba(255,255,255,.15)}
.cmp-frame{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:2;filter:drop-shadow(0 6rpx 12rpx rgba(0,0,0,.4))}
.cmp-lab{position:absolute;left:24rpx;bottom:20rpx;background:rgba(13,27,42,.6);backdrop-filter:blur(6px);padding:10rpx 20rpx;border-radius:$r-pill;font-size:20rpx;display:flex;gap:12rpx;align-items:center;color:#fff;z-index:3}
.cmp-ab{color:$gold;font-weight:$fw-bold}
.cmp-pick{position:absolute;right:24rpx;bottom:20rpx;background:$accent-strong;border-radius:$r-pill;padding:12rpx 22rpx;font-size:20rpx;font-weight:$fw-semi;color:#fff;z-index:3}
.cmp-close{position:absolute;top:calc(24rpx + env(safe-area-inset-top));left:30rpx;z-index:31}
</style>
