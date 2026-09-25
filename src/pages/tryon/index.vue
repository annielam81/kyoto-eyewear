<template>
  <view class="cam">
    <!-- ============ PICK ============ -->
    <view v-if="step==='pick'" class="perm">
      <view class="perm-art">
        <view class="pa-face"><view class="pa-glass"><view class="pa-l"></view><view class="pa-b"></view><view class="pa-l"></view></view></view>
      </view>
      <text class="h1">{{$t('tryon.permTitle')}}</text>
      <text class="sub perm-sub">{{$t('tryon.permBody')}}</text>
      <view class="perm-cta">
        <view class="perm-btn primary" @tap="choose('camera')"><text class="pb-t">{{$t('tryon.takePhoto')}}</text></view>
        <view class="perm-btn" @tap="choose('album')"><text class="pb-t">{{$t('tryon.chooseAlbum')}}</text></view>
      </view>
      <text class="perm-back" @tap="goBack">‹ {{$t('common.back')}}</text>
    </view>

    <!-- ============ CALIBRATE ============ -->
    <view v-else-if="step==='cal'" class="cal">
      <image class="feed" :src="photo" mode="aspectFit"></image>
      <view class="try-topbar">
        <view class="cb" @tap="step='pick'"><text class="cb-t">✕</text></view>
        <view class="tb-mid"><KyotoWordmark :size="14"/></view>
        <view style="width:72rpx"></view>
      </view>
      <view class="cal-tip">
        <text class="cal-title">{{$t('tryon.calTitle')}}</text>
        <text class="cal-body">{{$t('tryon.calBody')}}</text>
      </view>
      <view class="cardbox" :style="cardStyle" @touchstart.stop="cTS" @touchmove.stop="cTM" @touchend="cTE">
        <view class="card-c tl"></view><view class="card-c tr"></view><view class="card-c bl"></view><view class="card-c br"></view>
      </view>
      <view class="cal-bar">
        <view class="cal-resize">
          <view class="cb sm" @tap="cardW=clamp(cardW/1.08,150,1100)"><text class="cb-t">－</text></view>
          <view class="cb sm" @tap="cardW=clamp(cardW*1.08,150,1100)"><text class="cb-t">＋</text></view>
        </view>
        <view class="cal-start" @tap="finishCal"><text class="cs-t">{{$t('tryon.calStart')}}</text></view>
      </view>
      <view class="cal-links">
        <text class="cl-t" @tap="step='pick'">{{$t('tryon.calRetake')}}</text>
        <text class="cl-dot">·</text>
        <text class="cl-t" @tap="skipCal">{{$t('tryon.calSkip')}}</text>
      </view>
    </view>

    <!-- ============ TRY ============ -->
    <view v-else class="try">
      <image v-if="photo" class="feed" :src="photo" mode="aspectFit"></image>
      <view class="try-topbar">
        <view class="cb" @tap="close"><text class="cb-t">✕</text></view>
        <view class="tb-mid"><KyotoWordmark :size="14"/></view>
        <view class="tb-right">
          <view class="cb" @tap="showAdj=!showAdj"><text class="cb-t">⤧</text></view>
          <view class="cb" @tap="openCompare"><text class="cb-t">⫼</text></view>
        </view>
      </view>
      <view class="size-badge" @tap="step='cal'">
        <text class="sb-t">{{ calibrated ? $t('tryon.trueSize') : $t('tryon.estSize') }} · {{ frontMm }}mm</text>
      </view>
      <view class="overlay" :style="ovFor(cur)" @touchstart.stop="oTS" @touchmove.stop="oTM" @touchend="oTE">
        <FrameArt :art="cur.art" :hex="curColor.hex"/>
      </view>
      <view v-if="showAdj" class="nudge">
        <view class="cb sm" @tap="oy-=8"><text class="cb-t">↑</text></view>
        <view class="nudge-row">
          <view class="cb sm" @tap="ox-=8"><text class="cb-t">←</text></view>
          <view class="cb sm" @tap="ox+=8"><text class="cb-t">→</text></view>
        </view>
        <view class="cb sm" @tap="oy+=8"><text class="cb-t">↓</text></view>
      </view>
      <view v-if="!showAdj" class="hint"><text class="hint-tx">{{$t('tryon.dragHint')}}</text></view>
      <view class="bottom">
        <scroll-view class="frame-row" scroll-x>
          <view v-for="f in frames" :key="f.id" class="fbt" :class="{on:f.id===cur.id}" @tap="pickFrame(f)">
            <FrameArt :art="f.art" hex="#8a8f98"/>
            <text class="fbt-pr">${{ seriesPrice(f) }}</text>
          </view>
        </scroll-view>
        <view class="color-row">
          <text class="sub cr-lb">{{$t('product.color')}}</text>
          <view v-for="c in cur.colors" :key="c.key" class="sw" :class="{on:c.key===curColor.key}"
                :style="{background:c.hex}" @tap="ci=cur.colors.indexOf(c)"></view>
        </view>
        <view class="ctrl-row">
          <view style="width:120rpx"></view>
          <view class="shutter" @tap="snap"><view class="shutter-inner"></view></view>
          <view class="add-btn" @tap="addCart"><text class="ab-t">{{$t('tryon.addToCart')}}</text></view>
        </view>
      </view>
      <view v-if="snapSaved" class="snap-saved"><text class="ss-t">✓ {{$t('tryon.saved')}}</text></view>
      <view v-if="comparing" class="cmp">
        <view class="cmp-half top">
          <view class="cmp-full" :style="{width:winW+'px',height:winH+'px',top:'0px'}">
            <image :src="photo" mode="aspectFit" :style="{position:'absolute',left:photoRect.x+'px',top:photoRect.y+'px',width:photoRect.w+'px',height:photoRect.h+'px'}"></image>
            <view class="overlay" :style="ovFor(cmpA)"><FrameArt :art="cmpA.art" :hex="cmpAColor"/></view>
            <text class="cmp-lab">A</text>
          </view>
        </view>
        <view class="cmp-half bot">
          <view class="cmp-full" :style="{width:winW+'px',height:winH+'px',top:(-winH/2)+'px'}">
            <image :src="photo" mode="aspectFit" :style="{position:'absolute',left:photoRect.x+'px',top:photoRect.y+'px',width:photoRect.w+'px',height:photoRect.h+'px'}"></image>
            <view class="overlay" :style="ovFor(cmpB)"><FrameArt :art="cmpB.art" :hex="cmpBColor"/></view>
            <text class="cmp-lab">B</text>
          </view>
        </view>
        <view class="cmp-ab">
          <view class="cmp-pick" :class="{on:cur.id===cmpA.id}" @tap="pickCmp(cmpA)"><text class="cp-t">A · {{$t('tryon.chooseThis')}}</text></view>
          <view class="cmp-pick" :class="{on:cur.id===cmpB.id}" @tap="pickCmp(cmpB)"><text class="cp-t">B · {{$t('tryon.chooseThis')}}</text></view>
        </view>
        <view class="cb cmp-close" @tap="comparing=false"><text class="cb-t">✕</text></view>
      </view>
      <canvas canvas-id="snapCanvas" id="snapCanvas"
        :style="{width:cw+'px',height:ch+'px',position:'absolute',left:'-9999px',top:'0'}"></canvas>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import FrameArt from '@/components/FrameArt.vue';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import { useProductStore } from '@/stores/product';
import { useCartStore } from '@/stores/cart';
import { frameSellPrice } from '@/config/pricing.config';

const store = useProductStore();
const cart = useCartStore();
const sys = uni.getSystemInfoSync();
const winW = sys.windowWidth, winH = sys.windowHeight;
const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

type Step = 'pick'|'cal'|'try';
const step = ref<Step>('pick');
const photo = ref('');
const frames = computed(()=>((store.frames||[]) as any[]).filter(f=>f.prescriptionCompatible));
const cur = ref<any>({}); const ci = ref(0);
const curColor = computed(()=>cur.value.colors?.[ci.value] ?? {hex:'#141B3D'});
const seriesPrice = (f:any)=>frameSellPrice(f);

/* ---- 真实尺寸：镜框正面总宽(mm) × 照片比例 ---- */
const FRONT_FRAC: Record<string,number> = { round:0.73, square:0.75, cat:0.75, sun:0.75, aviator:0.72 };
const CARD_MM = 85.6, CARD_RATIO = 85.6/53.98;
const ppm = ref(5);
const calibrated = ref(false);
const frontMm = computed(()=>{
  const ss = cur.value.sizes || [];
  const s = ss.find((x:any)=>x.key===cur.value.defaultSize) || ss[0];
  return s ? Math.round(s.lensWidth*2 + s.bridge + 10) : 130;
});
function frameBox(f:any){
  const ss = f.sizes || [];
  const s = ss.find((x:any)=>x.key===f.defaultSize) || ss[0];
  const mm = s ? s.lensWidth*2 + s.bridge + 10 : 130;
  const wpx = mm * ppm.value / (0.72 * (FRONT_FRAC[f.art] ?? 0.74));
  return { wpx, wrpx: wpx/winW*750, hpx: wpx*80/200 };
}
/* 眼镜位置：相对锚点（屏幕中央 / 42% 高度）的偏移 */
const ox = ref(0), oy = ref(0);
function ovFor(f:any){
  const b = frameBox(f), pr = photoRect.value;
  const cx = pr.x + pr.w/2 + ox.value, cy = pr.y + pr.h*0.42 + oy.value;
  return { left:(cx-b.wpx/2)+'px', top:(cy-b.hpx/2)+'px', width:b.wrpx+'rpx' };
}

/* ---- 照片在屏幕上的实际显示区域（aspectFit，完整显示不裁切） ---- */
function fitRect(iw:number, ih:number, cw:number, ch:number){
  const sc = Math.min(cw/iw, ch/ih), w = iw*sc, h = ih*sc;
  return { x:(cw-w)/2, y:(ch-h)/2, w, h, s:sc };
}
const photoRect = ref({ x:0, y:0, w:winW, h:winH, s:1 });

/* ---- 校准 ---- */
const cardW = ref(420), ccx = ref(0), ccy = ref(0);
const cardStyle = computed(()=>{
  const w = cardW.value, h = w/CARD_RATIO, pr = photoRect.value;
  const cx = pr.x + pr.w/2 + ccx.value, cy = pr.y + pr.h*0.42 + ccy.value;
  return { width:w+'px', height:h+'px', left:(cx-w/2)+'px', top:(cy-h/2)+'px' };
});
let cSX=0, cSY=0, cOX=0, cOY=0;
function cTS(e:any){ const t=e.touches[0]; cSX=t.clientX; cSY=t.clientY; cOX=ccx.value; cOY=ccy.value; }
function cTM(e:any){ const t=e.touches[0]; ccx.value=cOX+(t.clientX-cSX); ccy.value=cOY+(t.clientY-cSY); }
function cTE(){}
function enterCal(){ ccx.value=0; ccy.value=0; cardW.value=Math.round(winW*0.36); step.value='cal'; }
function finishCal(){ ppm.value = cardW.value / CARD_MM; calibrated.value = true; enterTry(); }
function skipCal(){ ppm.value = 5; calibrated.value = false; enterTry(); }
function enterTry(){ ox.value=0; oy.value=0; showAdj.value=false; comparing.value=false; step.value='try'; }

/* ---- 试戴交互（只拖动，不缩放） ---- */
const showAdj = ref(false);
let oSX=0, oSY=0, oOX=0, oOY=0;
function oTS(e:any){ const t=e.touches[0]; oSX=t.clientX; oSY=t.clientY; oOX=ox.value; oOY=oy.value; }
function oTM(e:any){ const t=e.touches[0]; ox.value=oOX+(t.clientX-oSX); oy.value=oOY+(t.clientY-oSY); }
function oTE(){}
function pickFrame(f:any){ cur.value=f; ci.value=0; }

/* ---- 对比 ---- */
const comparing = ref(false);
const cmpA = ref<any>({}), cmpB = ref<any>({});
const cmpAColor = ref('#141B3D'), cmpBColor = ref('#141B3D');
function openCompare(){
  const others = frames.value.filter(f=>f.id!==cur.value.id);
  cmpA.value = cur.value; cmpB.value = others[0] || cur.value;
  cmpAColor.value = curColor.value.hex; cmpBColor.value = (others[0]?.colors?.[0]?.hex) || '#141B3D';
  comparing.value = true;
}
function pickCmp(f:any){ cur.value=f; ci.value=0; comparing.value=false; }

/* ---- 拍照快门：合成保存 ---- */
const cw = 900, ch = 1200;
const snapSaved = ref(false);
let snapTimer:any = null;
async function snap(){
  if(!photo.value) return;
  try{
    const info = await uni.getImageInfo({ src: photo.value }) as any;
    const iw = info.width, ih = info.height;
    const ctx = uni.createCanvasContext('snapCanvas');
    const s2 = Math.min(cw/iw, ch/ih), dw = iw*s2, dh = ih*s2, dx = (cw-dw)/2, dy = (ch-dh)/2;
    ctx.drawImage(photo.value, dx, dy, dw, dh);
    const pr = photoRect.value, k = dw/pr.w;
    const b = frameBox(cur.value);
    const owPx = b.wpx*k, ohPx = owPx*80/200;
    const gcx = pr.x + pr.w/2 + ox.value, gcy = pr.y + pr.h*0.42 + oy.value;
    const cxPx = dx + (gcx-pr.x)*k, cyPx = dy + (gcy-pr.y)*k;
    const lx = cxPx-owPx/2, ty = cyPx-ohPx/2;
    const hex = curColor.value.hex;
    ctx.setStrokeStyle(hex); ctx.setFillStyle('rgba(255,255,255,.55)'); ctx.setLineWidth(Math.max(6,owPx*0.02));
    const lw = owPx*0.36, lh = ohPx*0.72, y0 = ty+ohPx*0.14;
    ctx.beginPath();
    (ctx as any).roundRect(lx+owPx*0.05, y0, lw, lh, lh*0.28); ctx.fill(); ctx.stroke();
    (ctx as any).roundRect(lx+owPx*0.59, y0, lw, lh, lh*0.28); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx+owPx*0.43,y0+lh*0.3); ctx.quadraticCurveTo(lx+owPx*0.5,y0+lh*0.1,lx+owPx*0.57,y0+lh*0.3); ctx.stroke();
    ctx.draw(false);
    await new Promise<void>((res)=>ctx.draw(true,()=>res()));
    const tmp = await uni.canvasToTempFilePath({ canvasId:'snapCanvas' }) as any;
    await uni.saveImageToPhotosAlbum({ filePath: tmp.tempFilePath });
    snapSaved.value = true;
    clearTimeout(snapTimer); snapTimer = setTimeout(()=>snapSaved.value=false, 2200);
  }catch(e){ /* 保存失败保持静默 */ }
}

/* ---- 照片选择 / 购物车 / 返回 ---- */
function choose(src:'camera'|'album'){
  uni.chooseImage({ count:1, sizeType:['compressed'],
    sourceType: src==='camera' ? ['camera'] : ['album'],
    success:(r:any)=>{
      photo.value = r.tempFilePaths[0];
      uni.getImageInfo({ src: photo.value,
        success:(info:any)=>{ photoRect.value = fitRect(info.width, info.height, winW, winH); enterCal(); },
        fail:()=>{ photoRect.value = { x:0, y:0, w:winW, h:winH, s:1 }; enterCal(); } });
    },
  });
}
function addCart(){ cart.add(cur.value.id, { colorKey: curColor.value.key }, 1); uni.showToast({ title:'✓', icon:'none' }); }
function exitTryon(){
  photo.value=''; step.value='pick'; comparing.value=false;
  if (getCurrentPages().length > 1) uni.navigateBack();
  else uni.reLaunch({ url:'/pages/home/index' });
}
function goBack(){ exitTryon(); }
function close(){ exitTryon(); }

onLoad(()=>{ store.ensure(); });
onShow(()=>{ store.ensure(); });
onMounted(()=>{
  store.ensure();
  const list = frames.value;
  cur.value = list[0] || {};
});
</script>

<style lang="scss" scoped>
.cam{position:fixed;top:0;left:0;right:0;bottom:0;background:#1a1714;overflow:hidden}
.feed{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%}
/* 顶栏：类名避开 App.vue 全局 .top-bar（纸色底） */
.try-topbar{position:absolute;top:calc(24rpx + env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:0 30rpx;z-index:10;background:transparent;margin:0}
.tb-mid{display:flex;align-items:center}
.tb-right{display:flex;gap:18rpx}
.cb{width:72rpx;height:72rpx;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center}
.cb.sm{width:88rpx;height:88rpx}
.cb-t{color:#fff;font-size:30rpx;font-weight:600}
/* 起始页 */
.perm{position:absolute;top:0;left:0;right:0;bottom:0;background:#1a1714;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 60rpx;z-index:5}
.perm-art{width:420rpx;height:300rpx;position:relative;margin-bottom:20rpx}
.pa-face{position:absolute;left:50%;top:0;transform:translateX(-50%);width:280rpx;height:280rpx;border-radius:50%;background:radial-gradient(circle at 50% 35%,#4a4239,#2b2521 70%)}
.pa-glass{position:absolute;left:50%;top:38%;transform:translateX(-50%);display:flex;align-items:center}
.pa-l{width:90rpx;height:70rpx;border:6rpx solid #B83227;border-radius:45rpx;background:rgba(255,255,255,.25)}
.pa-b{width:36rpx;height:20rpx;border-top:6rpx solid #B83227;border-radius:50%}
.perm .h1{color:#FFF5E6;font-size:44rpx;margin:10rpx 0 18rpx}
.perm-sub{color:rgba(255,245,230,.72);text-align:center;line-height:1.7}
.perm-cta{display:flex;flex-direction:column;gap:22rpx;margin-top:44rpx;width:100%}
.perm-btn{height:104rpx;border-radius:58rpx;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center}
.perm-btn.primary{background:#B83227}
.pb-t{color:#fff;font-size:32rpx;font-weight:600}
.perm-back{margin-top:34rpx;color:rgba(255,245,230,.55);font-size:28rpx;padding:16rpx}
/* 校准 */
.cal{position:absolute;top:0;left:0;right:0;bottom:0;z-index:5}
.cal-tip{position:absolute;top:calc(150rpx + env(safe-area-inset-top));left:40rpx;right:40rpx;background:rgba(20,16,13,.78);backdrop-filter:blur(10px);border-radius:24rpx;padding:28rpx 30rpx;z-index:6}
.cal-title{color:#FFF5E6;font-size:32rpx;font-weight:700;display:block;margin-bottom:10rpx}
.cal-body{color:rgba(255,245,230,.78);font-size:26rpx;line-height:1.7;display:block}
.cardbox{position:absolute;left:0;top:0;z-index:6;touch-action:none}
.cardbox::before{content:'';position:absolute;inset:0;border:4rpx dashed #FF6A3D;border-radius:8rpx;background:rgba(255,106,61,.08)}
.card-c{position:absolute;width:34rpx;height:34rpx;border:6rpx solid #FF6A3D}
.card-c.tl{left:-6rpx;top:-6rpx;border-right:0;border-bottom:0}
.card-c.tr{right:-6rpx;top:-6rpx;border-left:0;border-bottom:0}
.card-c.bl{left:-6rpx;bottom:-6rpx;border-right:0;border-top:0}
.card-c.br{right:-6rpx;bottom:-6rpx;border-left:0;border-top:0}
.cal-bar{position:absolute;left:40rpx;right:40rpx;bottom:calc(150rpx + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;z-index:6}
.cal-resize{display:flex;gap:20rpx}
.cal-start{background:#B83227;border-radius:58rpx;padding:0 64rpx;height:104rpx;display:flex;align-items:center}
.cs-t{color:#fff;font-size:32rpx;font-weight:700}
.cal-links{position:absolute;left:0;right:0;bottom:calc(56rpx + env(safe-area-inset-bottom));display:flex;justify-content:center;align-items:center;gap:18rpx;z-index:6}
.cl-t{color:rgba(255,245,230,.75);font-size:26rpx;padding:12rpx}
.cl-dot{color:rgba(255,245,230,.4)}
/* 试戴 */
.try{position:absolute;top:0;left:0;right:0;bottom:0;z-index:5}
.size-badge{position:absolute;top:calc(120rpx + env(safe-area-inset-top));left:50%;transform:translateX(-50%);background:rgba(20,16,13,.66);border:1rpx solid rgba(255,255,255,.25);border-radius:40rpx;padding:10rpx 26rpx;z-index:6}
.sb-t{color:#FFF5E6;font-size:24rpx;letter-spacing:.04em}
.overlay{position:absolute;left:0;top:0;z-index:5;touch-action:none}
.hint{position:absolute;left:50%;transform:translateX(-50%);bottom:460rpx;background:rgba(20,16,13,.62);padding:14rpx 30rpx;border-radius:40rpx;z-index:6}
.hint-tx{color:#FFF5E6;font-size:26rpx}
.nudge{position:absolute;left:50%;transform:translateX(-50%);bottom:440rpx;display:flex;flex-direction:column;align-items:center;gap:14rpx;z-index:7}
.nudge-row{display:flex;gap:14rpx}
.bottom{position:absolute;left:0;right:0;bottom:0;padding:0 30rpx calc(30rpx + env(safe-area-inset-bottom));z-index:7;background:linear-gradient(transparent,rgba(20,16,13,.72) 32%)}
.frame-row{white-space:nowrap;margin-bottom:18rpx}
.fbt{display:inline-block;width:172rpx;margin-right:18rpx;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);border-radius:20rpx;padding:14rpx 10rpx 10rpx;text-align:center;border:2rpx solid transparent;vertical-align:top}
.fbt.on{border-color:#FF6A3D;background:rgba(255,106,61,.22)}
.fbt-pr{display:block;color:#fff;font-size:24rpx;margin-top:6rpx}
.color-row{display:flex;align-items:center;gap:20rpx;margin-bottom:20rpx}
.cr-lb{color:rgba(255,245,230,.8)}
.sw{width:64rpx;height:64rpx;border-radius:50%;border:3rpx solid transparent}
.sw.on{border-color:#fff;transform:scale(1.12)}
.ctrl-row{display:flex;align-items:center;justify-content:space-between}
.shutter{width:132rpx;height:132rpx;border-radius:50%;border:6rpx solid #fff;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12)}
.shutter-inner{width:96rpx;height:96rpx;border-radius:50%;background:#fff}
.add-btn{background:#B83227;border-radius:52rpx;padding:0 44rpx;height:96rpx;display:flex;align-items:center}
.ab-t{color:#fff;font-size:30rpx;font-weight:700}
.snap-saved{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);background:rgba(20,16,13,.8);padding:20rpx 40rpx;border-radius:48rpx;z-index:20}
.ss-t{color:#fff;font-size:28rpx}
/* 对比 */
.cmp{position:absolute;top:0;left:0;right:0;bottom:0;z-index:30;background:#1a1714}
.cmp-half{position:absolute;left:0;right:0;height:50%;overflow:hidden}
.cmp-half.top{top:0;border-bottom:2rpx solid rgba(255,255,255,.35)}
.cmp-half.bot{bottom:0}
.cmp-full{position:absolute;left:0}
.cmp-lab{position:absolute;left:30rpx;top:calc(20rpx + env(safe-area-inset-top));width:56rpx;height:56rpx;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:28rpx;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:2}
.cmp-half.bot .cmp-lab{top:20rpx}
.cmp-ab{position:absolute;left:40rpx;right:40rpx;bottom:calc(40rpx + env(safe-area-inset-bottom));display:flex;gap:20rpx;z-index:31}
.cmp-pick{flex:1;height:92rpx;border-radius:50rpx;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;border:2rpx solid transparent}
.cmp-pick.on{border-color:#FF6A3D;background:rgba(255,106,61,.25)}
.cp-t{color:#fff;font-size:28rpx;font-weight:600}
.cmp-close{position:absolute;right:30rpx;top:calc(20rpx + env(safe-area-inset-top));z-index:31}
</style>
