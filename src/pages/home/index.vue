<template>
  <view class="home" :class="themeClass">
    <!-- HEADER：汉堡菜单 | 品牌 | 搜索+购物袋（对标参考稿） -->
    <view class="hdr">
      <view class="hds"><view class="hbtn" @click="openMenu" v-html="icMenu"></view></view>
      <view class="brand">
        <text class="bname">KYOTO</text>
        <text class="des">EYEWEAR</text>
      </view>
      <view class="hds r">
        <view class="hbtn lang" @click="openLang"><text>{{ langLabel }}</text></view>
        <view class="hbtn" @click="nav('/pages/frames/index', true)" v-html="icSearch"></view>
        <view class="hbtn" @click="nav('/pages/cart/index')">
          <view class="bag" v-html="icBag"></view>
          <text v-if="cart.count" class="cbadge">{{ cart.count }}</text>
        </view>
      </view>
    </view>

    <view class="page-pad hbody">
      <!-- HERO·宝塔：宝塔樱花实拍 + 衬线标题 + 印章（默认主题） -->
      <view v-if="!isSunset" class="hero">
        <image class="himg" src="@/static/img/hero-kyoto.jpg" mode="aspectFill" />
        <view class="hwash"></view>
        <view class="hin">
          <view class="hcopy">
            <text class="kicker">{{ $t('home.hero.eyebrow') }}</text>
            <text class="ta" :class="{ 'ta-zh': $i18n.locale === 'zh-CN' }">{{ $t('home.hero.titleA') }}</text>
            <text class="tb">{{ $t('home.hero.titleB') }}</text>
            <text class="hsub">{{ $t('home.hero.subtitle') }}</text>
            <view class="cta" @click="nav('/pages/frames/index', true)">
              <text>{{ $t('home.hero.cta') }}</text>
              <view class="arr" v-html="icArrow"></view>
            </view>
          </view>
          <view class="hside">
            <text class="stamp">京都</text>
            <text class="motto">{{ $t('home.hero.motto') }}</text>
          </view>
        </view>
        <view class="dots"><view class="dot on"></view><view class="dot"></view><view class="dot"></view></view>
      </view>

      <!-- HERO·日出：品牌主视觉原图 + 几何无衬线标语 -->
      <view v-else class="hero-sun">
        <image class="hsun-img" src="@/static/img/hero-sunset.jpg" mode="widthFix" />
        <view class="hsun-body">
          <text class="hsun-slogan">{{ $t('home.hero.slogan') }}</text>
          <text class="hsun-slogan-en">SEE CLEARLY, SEE FURTHER.</text>
          <view class="hsun-ctas">
            <view class="cta" @click="nav('/pages/frames/index', true)">
              <text>{{ $t('home.hero.cta') }}</text>
              <view class="arr" v-html="icArrow"></view>
            </view>
            <view class="cta ghost" @click="nav('/pages/tryon/index?frame=arashiyama')">
              <text>{{ $t('home.hero.ctaTryOn') }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- FOUNDING OFFER：深靛底卡 + 象牙字，保持高级感；信息完整但不做成廉价促销横幅 -->
      <view class="sec">
        <view class="fo">
          <text class="fo-eyebrow">{{ $t('home.foundingOffer.eyebrow') }}</text>
          <view class="fo-price">
            <text class="fo-p">${{ promoPrice }}</text>
            <text class="fo-u">{{ $t('home.foundingOffer.unit') }}</text>
          </view>
          <text class="fo-reg">{{ $t('home.foundingOffer.regular') }} ${{ regularPrice }}</text>
          <text class="fo-inc-t">{{ $t('home.foundingOffer.includesTitle') }}</text>
          <view class="fo-inc">
            <text class="fo-li"><text class="ck">✓ </text>{{ $t('home.foundingOffer.inc1') }}</text>
            <text class="fo-li"><text class="ck">✓ </text>{{ $t('home.foundingOffer.inc2') }}</text>
            <text class="fo-li"><text class="ck">✓ </text>{{ $t('home.foundingOffer.inc3') }}</text>
            <text class="fo-li"><text class="ck">✓ </text>{{ $t('home.foundingOffer.inc4') }}</text>
          </view>
          <text class="fo-note">{{ $t('home.foundingOffer.note') }}</text>
          <view class="fo-ctas">
            <view class="cta" @click="nav('/pages/frames/index', true)">
              <text>{{ $t('home.foundingOffer.ctaShop') }}</text>
              <view class="arr" v-html="icArrow"></view>
            </view>
            <view class="cta ghost-ivory" @click="nav('/pages/tryon/index?frame=arashiyama')">
              <text>{{ $t('home.foundingOffer.ctaTryOn') }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- QUICK SERVICES：服务项已全部展示，不需要“查看全部”（之前误跳到镜框页） -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.servicesTitle') }}</text>
        </view>
        <view class="qgrid">
          <view v-for="q in quick" :key="q.k" class="qcard" @click="q.go()">
            <view class="qic" v-html="q.icon"></view>
            <text class="ql">{{ $t('home.services.'+q.k) }}</text>
          </view>
        </view>
      </view>

      <!-- BESTSELLERS -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.bestsellers') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <scroll-view scroll-x class="hs"><view class="hsin">
          <view v-for="f in best" :key="f.id" class="hcard"><ProductCard :frame="f" mode="best" @open="openDetail" /></view>
        </view></scroll-view>
      </view>

      <!-- HOW IT WORKS：4 步极简说明，不做大面积教程 -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.howItWorks.title') }}</text>
        </view>
        <view class="hiw">
          <view v-for="i in 4" :key="i" class="hiw-s">
            <text class="hiw-n">{{ i }}</text>
            <text class="hiw-t">{{ $t('home.howItWorks.s'+i+'t') }}</text>
            <text class="hiw-d">{{ $t('home.howItWorks.s'+i+'s') }}</text>
          </view>
        </view>
      </view>

      <!-- SIGNATURE COLLECTION -->
      <view v-if="signature.length" class="sec">
        <view class="sechd">
          <text class="h2">{{ seriesName('signature') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <text class="sec-sub">{{ seriesTagline('signature') }}</text>
        <scroll-view scroll-x class="hs"><view class="hsin">
          <view v-for="f in signature" :key="f.id" class="hcard"><ProductCard :frame="f" mode="best" @open="openDetail" /></view>
        </view></scroll-view>
      </view>

      <!-- ATELIER COLLECTION -->
      <view v-if="atelier.length" class="sec">
        <view class="sechd">
          <text class="h2">{{ seriesName('atelier') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <text class="sec-sub">{{ seriesTagline('atelier') }}</text>
        <scroll-view scroll-x class="hs"><view class="hsin">
          <view v-for="f in atelier" :key="f.id" class="hcard"><ProductCard :frame="f" mode="best" @open="openDetail" /></view>
        </view></scroll-view>
      </view>

      <!-- CONTACT LENS PROMO — launch 时隐藏 -->
      <view v-if="showContactLenses" class="promo">
        <view class="pbg" v-html="promoBg"></view>
        <view class="pin">
          <text class="pt">{{ $t('home.subscription.title') }}</text>
          <text class="psb">{{ $t('home.subscription.subtitle') }}</text>
          <view class="pcta">{{ $t('home.subscription.cta') }}</view>
        </view>
      </view>

      <!-- NEW ARRIVALS -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.newArrivals') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <view class="ngrid">
          <view v-for="f in news" :key="f.id" class="ncard"><ProductCard :frame="f" mode="new" @open="openDetail" /></view>
        </view>
      </view>
      <!-- TRUST：只写已有政策与事实，不编造承诺 -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.trust.title') }}</text>
        </view>
        <view class="trust">
          <view v-for="i in 6" :key="i" class="tr">
            <text class="tr-ck">✓</text>
            <text class="tr-t">{{ $t('home.trust.i'+i) }}</text>
          </view>
        </view>
      </view>
    </view>

    <KyotoBottomNav active="home" />

    <!-- FSA / HSA 说明弹窗 -->
    <view v-if="showFsa" class="sheet-mask" @click="showFsa = false">
      <view class="sheet" @click.stop>
        <text class="sheet-t">{{ $t('home.fsaSheet.title') }}</text>
        <text class="sheet-b">{{ $t('home.fsaSheet.body') }}</text>
        <KyotoButton variant="night" @click="showFsa = false">{{ $t('common.done') }}</KyotoButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import ProductCard from '@/components/ProductCard.vue';

import { useProductStore } from '@/stores/product';
import { useCartStore } from '@/stores/cart';
import { useAppStore } from '@/stores/app';
import { useThemeStore } from '@/stores/theme';
import { i18n } from '@/i18n';
import type { FrameSeries, Locale } from '@/models';
import { isContactLensAvailable } from '@/config/launch-availability.config';
import { SERIES_INFO, SERIES_PRICE, OPENING_PROMO } from '@/config/pricing.config';
import { BRAND } from '@/config/brand-colors';

const products = useProductStore();
const cart = useCartStore();
const app = useAppStore();
const theme = useThemeStore();

/* 外观主题：pagoda（默认）/ sunset 可切换，只影响视觉层 */
const isSunset = computed(() => theme.name === 'sunset');
const themeClass = computed(() => `theme-${theme.name}`);

/* 汉堡菜单：5 个主页面 + 3 种语言 */
const locales: { code: Locale; label: string; short: string }[] = [
  { code: 'en-US', label: 'English', short: 'EN' },
  { code: 'zh-CN', label: '中文', short: '中' },
  { code: 'es-US', label: 'Español', short: 'ES' },
];
const langLabel = computed(() => locales.find((l) => l.code === app.locale)?.short ?? 'EN');
const openLang = () => {
  uni.showActionSheet({
    itemList: locales.map((l) => l.label),
    success: (res) => app.setLocale(locales[res.tapIndex].code),
  });
};
const openMenu = () => {
  const t = i18n.global.t;
  const navItems = [
    { label: t('nav.home'), url: '/pages/home/index' },
    { label: t('nav.shop'), url: '/pages/frames/index' },
    { label: t('nav.tryOn'), url: '/pages/tryon/index' },
    { label: t('nav.cart'), url: '/pages/cart/index' },
    { label: t('nav.account'), url: '/pages/account/index' },
  ];
  uni.showActionSheet({
    itemList: [...navItems.map((n) => n.label), ...locales.map((l) => l.label)],
    success: (res) => {
      const i = res.tapIndex;
      if (i < navItems.length) nav(navItems[i].url, true);
      else app.setLocale(locales[i - navItems.length].code);
    },
  });
};

onShow(() => products.ensure());

const best = computed(() =>
  products.sellable.filter(
    f => f.bestSeller || ['gion', 'tasogare'].includes(f.id)
  )
);

const news = computed(() =>
  products.sellable.filter(f => f.newArrival).slice(0, 4)
);

/* 系列板块：名称/标语走 pricing.config 的三语配置；价格数字走同一配置，保证一致 */
const loc = computed(() => app.locale as Locale);
const seriesName = (k: FrameSeries) => SERIES_INFO[k].name[loc.value];
const seriesTagline = (k: FrameSeries) => SERIES_INFO[k].tagline[loc.value];
const signature = computed(() => products.sellable.filter(f => f.series === 'signature'));
const atelier = computed(() => products.sellable.filter(f => f.series === 'atelier'));
const promoPrice = OPENING_PROMO.promoPrice;
const regularPrice = SERIES_PRICE.essential;

const nav = (url: string, relaunch = false) =>
  relaunch
    ? uni.reLaunch({ url })
    : uni.navigateTo({ url });

const openDetail = (id: string) =>
  uni.navigateTo({
    url: `/pages/product/detail?id=${id}`,
  });

/* -------------------------------------------------------
   图标：v-html 运行时注入；svg 自身不写宽高，
   尺寸一律由下面 CSS 的 :deep(svg) 决定。
   （之前内联写了 width/height:100%，会覆盖 CSS，
   在没有固定尺寸的容器里把图标撑得巨大——已修复）
------------------------------------------------------- */
const I = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block">${d}</svg>`;

const icMenu = I('<path d="M4 7h16M4 12h16M4 17h16"/>');
const icSearch = I('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16 16"/>');
const icBag = I('<path d="M5.5 8h13l-1 12.5a1 1 0 0 1-1 .5h-11a1 1 0 0 1-1-.5z"/><path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7"/>');
const icArrow = I('<path d="M4 12h15M13.5 6l6 6-6 6"/>');

const quick = [
  {
    k: 'virtualTryOn',
    icon: I('<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13" r="3.4"/><path d="M8.6 7l1.3-2.2h4.2L15.4 7"/>'),
    go: () => uni.navigateTo({ url: '/pages/tryon/index?frame=arashiyama' }),
  },
  {
    k: 'uploadRx',
    icon: I('<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 20h15"/>'),
    go: () => uni.navigateTo({ url: '/pages/prescription/upload' }),
  },
  {
    k: 'shopEyeglasses',
    icon: I('<circle cx="7" cy="15" r="3.4"/><circle cx="17" cy="15" r="3.4"/><path d="M10.4 15h3.2M3.6 14.2 2 12.5M20.4 14.2 22 12.5"/>'),
    go: () => uni.reLaunch({ url: '/pages/frames/index' }),
  },
  {
    k: 'fsa',
    icon: I('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 14.5h4"/>'),
    go: () => { showFsa.value = true; },
  },
];

/* FSA / HSA 说明弹窗 */
const showFsa = ref(false);

const showContactLenses = isContactLensAvailable();

const promoBg = `
<svg
  viewBox="0 0 350 130"
  preserveAspectRatio="xMidYMid slice"
  style="width:100%;height:100%"
>
  <rect width="350" height="130" fill="${BRAND.ink}"/>

  <g
    fill="none"
    stroke="rgba(255,245,230,.14)"
    stroke-width="1.4"
  >
    <circle cx="260" cy="130" r="46"/>
    <circle cx="260" cy="130" r="32"/>
    <circle cx="316" cy="108" r="46"/>
    <circle cx="316" cy="108" r="32"/>
  </g>

  <circle
    cx="300"
    cy="32"
    r="26"
    fill="${BRAND.vermilion}"
  />

  <path
    d="M280 38Q300 24 320 38"
    fill="none"
    stroke="${BRAND.ink}"
    stroke-width="3"
  />
</svg>
`;
</script>

<style lang="scss" scoped>
.home{background:$paper;min-height:100vh}
/* header：实底 + 安全区，和 KyotoHeader 同一处理（真机不透字） */
.hdr{display:flex;align-items:center;justify-content:space-between;
  padding:calc(#{$sp-2} + env(safe-area-inset-top)) $sp-3 18rpx;
  position:sticky;top:0;z-index:$z-nav;background:$paper;border-bottom:1rpx solid $line}
.hds{min-width:150rpx;display:flex;align-items:center;gap:10rpx}
.hds.r{justify-content:flex-end}
.brand{display:flex;flex-direction:column;align-items:center;gap:2rpx}
.bname{font-family:'Cinzel',serif;font-weight:600;font-size:46rpx;letter-spacing:.30em;color:$ink;padding-left:.30em;line-height:1}
.des{font-size:15rpx;letter-spacing:.42em;color:$muted;font-weight:$fw-med;padding-left:.42em}
.hbtn{position:relative;color:$ink;padding:6rpx;display:flex;align-items:center}
.hbtn.lang text{font-size:26rpx;font-weight:700;letter-spacing:.08em}
.hbtn :deep(svg){width:44rpx;height:44rpx;display:block}
.bag{display:flex;align-items:center}
.cbadge{position:absolute;top:-4rpx;right:-6rpx;background:$accent-strong;color:#fff;font-size:17rpx;
  font-weight:$fw-semi;min-width:30rpx;height:30rpx;border-radius:$r-pill;display:flex;
  align-items:center;justify-content:center;padding:0 7rpx;font-variant-numeric:tabular-nums}
/* hero */
.hbody{padding-top:18rpx}
.hero{position:relative;border-radius:$r-lg;overflow:hidden;min-height:440rpx}
.himg{position:absolute;left:0;top:0;width:100%;height:100%}
.hwash{position:absolute;left:0;top:0;right:0;bottom:0;
  background:
    linear-gradient(90deg, rgba(250,247,242,.80) 0%, rgba(250,247,242,.32) 52%, rgba(250,247,242,0) 80%),
    linear-gradient(180deg, rgba(250,247,242,.10) 0%, rgba(250,247,242,0) 45%, rgba(250,247,242,.38) 82%, $paper 100%)}
.hin{position:relative;display:flex;justify-content:space-between;padding:46rpx 36rpx 64rpx}
.hcopy{display:flex;flex-direction:column;max-width:66%}
.kicker{font-size:20rpx;font-weight:$fw-bold;letter-spacing:.3em;color:$accent-strong;margin-bottom:16rpx}
.ta{font-family:$font-serif;font-size:54rpx;font-weight:600;color:$ink;line-height:1.18}
.ta-zh{font-size:40rpx;letter-spacing:.04em}
.tb{font-family:$font-serif;font-size:54rpx;font-weight:400;color:$ink;line-height:1.28}
.hsub{font-size:$fs-xs;color:$muted;margin-top:16rpx;line-height:1.7;white-space:pre-line}
.cta{margin-top:24rpx;align-self:flex-start;display:flex;align-items:center;gap:12rpx;
  background:$accent-strong;color:#fff;border-radius:$r-pill;padding:18rpx 36rpx;
  font-size:$fs-sm;font-weight:$fw-semi;box-shadow:0 14rpx 30rpx -14rpx rgba(205,55,43,.6)}
.cta:active{transform:scale(.96)}
.arr{display:flex;align-items:center}
.arr :deep(svg){width:28rpx;height:28rpx;display:block}
.hside{display:flex;flex-direction:column;align-items:center;gap:18rpx;padding-top:4rpx}
.stamp{font-family:$font-jp;font-size:22rpx;font-weight:600;color:$accent-strong;
  border:2rpx solid $accent-strong;border-radius:8rpx;padding:12rpx 7rpx;
  writing-mode:vertical-rl;letter-spacing:6rpx;line-height:1}
.motto{font-family:$font-serif;font-size:15rpx;letter-spacing:5rpx;color:$muted;writing-mode:vertical-rl}
.dots{position:absolute;left:0;right:0;bottom:24rpx;display:flex;justify-content:center;gap:10rpx}
.dot{width:10rpx;height:10rpx;border-radius:50%;background:rgba(20,27,61,.16)}
.dot.on{width:38rpx;border-radius:6rpx;background:$ink}
/* ---- 日出主题：品牌主视觉原图 + 几何无衬线标语 ---- */
.hero-sun{border-radius:$r-lg;overflow:hidden;background:$card;border:1rpx solid $line;box-shadow:$shadow-soft}
.hsun-img{width:100%;display:block}
.hsun-body{padding:28rpx 28rpx 32rpx}
.hsun-slogan{font-family:'Sora','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;
  font-weight:800;font-size:40rpx;color:$ink;line-height:1.35;display:block}
.hsun-slogan-en{font-family:'Sora',sans-serif;font-weight:700;font-size:20rpx;
  letter-spacing:.28em;color:$teal;margin-top:10rpx;display:block}
.hsun-ctas{display:flex;gap:16rpx;margin-top:24rpx}
.hsun-ctas .cta{margin-top:0}
.cta.ghost{background:transparent;color:$ink;border:2rpx solid $ink;box-shadow:none}
/* 日出主题下，展示标题从衬线(Cinzel)换成几何无衬线(Sora) */
.theme-sunset .bname{font-family:'Sora',sans-serif;font-weight:800;letter-spacing:.24em}
.theme-sunset .h2{font-family:'Sora','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;
  font-weight:800;letter-spacing:.01em}
/* sections */
.sec{margin-top:42rpx}
.sechd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18rpx}
.h2{font-family:$font-serif;font-size:36rpx;font-weight:600;color:$ink}
.all{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
/* quick services */
.qgrid{display:flex;gap:16rpx}
.qcard{flex:1;min-width:0;background:$card;border:1rpx solid $line;border-radius:$r-md;
  padding:24rpx 8rpx;display:flex;flex-direction:column;align-items:center;gap:14rpx}
.qcard:active{transform:scale(.97)}
.qic{width:88rpx;height:88rpx;border-radius:50%;background:$paper;display:flex;
  align-items:center;justify-content:center;color:$ink;box-shadow:$shadow-card;border:1rpx solid $line}
.qic :deep(svg){width:44rpx;height:44rpx;display:block}
.ql{font-size:20rpx;color:$ink;font-weight:$fw-med;text-align:center;line-height:1.4}
/* product rows */
.hs{margin-right:-$sp-3}
.hsin{display:flex;gap:18rpx;padding:4rpx $sp-3 14rpx 2rpx}
.hcard{flex:0 0 310rpx;width:310rpx}
.ngrid{display:flex;flex-wrap:wrap;gap:18rpx}
.ncard{flex:1 1 40%;min-width:0}
/* contact lens promo */
.promo{position:relative;overflow:hidden;min-height:200rpx;margin-top:$sp-4;color:$paper;border-radius:$r-md}
.pbg{position:absolute;inset:0}
.pin{position:relative;max-width:72%;padding:28rpx;display:flex;flex-direction:column;gap:8rpx}
.pt{color:#fff;font-size:$fs-md;font-weight:$fw-bold}
.psb{font-size:$fs-xs;line-height:1.5;opacity:.8}
.pcta{align-self:flex-start;margin-top:12rpx;padding:12rpx 24rpx;color:#fff;
  background:$accent-strong;border-radius:$r-sm;font-size:$fs-xs;font-weight:$fw-semi}
/* ---- FOUNDING OFFER：深靛底卡 + 象牙字，金色眉题；信息完整但不做成廉价促销横幅 ---- */
.fo{background:$ink;border-radius:$r-lg;padding:44rpx 38rpx;color:$paper;position:relative;overflow:hidden}
.fo-eyebrow{font-size:20rpx;font-weight:$fw-bold;letter-spacing:.32em;color:$gold;display:block;margin-bottom:20rpx}
.fo-price{display:flex;align-items:baseline;gap:16rpx}
.fo-p{font-family:'Sora',sans-serif;font-weight:800;font-size:88rpx;color:#fff;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.fo-u{font-size:22rpx;font-weight:$fw-bold;letter-spacing:.24em;color:rgba(255,245,230,.85)}
.fo-reg{font-size:$fs-xs;color:rgba(255,245,230,.55);margin-top:10rpx;display:block;font-variant-numeric:tabular-nums}
.fo-inc-t{font-size:18rpx;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,245,230,.6);font-weight:$fw-semi;margin:28rpx 0 12rpx;display:block}
.fo-inc{display:flex;flex-direction:column;gap:8rpx}
.fo-li{font-size:$fs-sm;color:$paper;line-height:1.5;display:block}
.fo-li .ck{color:$gold;font-weight:$fw-bold}
.fo-note{font-size:$fs-xs;color:rgba(255,245,230,.62);line-height:1.65;margin-top:22rpx;display:block}
.fo-ctas{display:flex;gap:16rpx;margin-top:28rpx}
.fo-ctas .cta{margin-top:0}
.cta.ghost-ivory{background:transparent;color:$paper;border:2rpx solid rgba(255,245,230,.7);box-shadow:none}
/* ---- HOW IT WORKS：4 步极简 ---- */
.hiw{display:flex;gap:12rpx}
.hiw-s{flex:1;min-width:0;background:$card;border:1rpx solid $line;border-radius:$r-md;padding:24rpx 10rpx;text-align:center}
.hiw-n{font-family:$font-serif;font-size:44rpx;font-weight:600;color:$accent-strong;display:block;line-height:1}
.hiw-t{font-size:22rpx;font-weight:$fw-semi;color:$ink;display:block;margin-top:12rpx}
.hiw-d{font-size:17rpx;color:$muted;line-height:1.5;display:block;margin-top:6rpx}
/* ---- 系列副标题 ---- */
.sec-sub{font-size:$fs-xs;color:$muted;margin:-6rpx 0 16rpx;display:block;line-height:1.6}
/* ---- TRUST：只写已有政策与事实 ---- */
.trust{display:grid;grid-template-columns:1fr 1fr;gap:12rpx}
.tr{display:flex;align-items:flex-start;gap:12rpx;background:$card;border:1rpx solid $line;border-radius:$r-sm;padding:18rpx}
.tr-ck{color:$teal;font-weight:$fw-bold;font-size:24rpx;line-height:1.4;flex-shrink:0}
.tr-t{font-size:20rpx;color:$ink;line-height:1.5;font-weight:$fw-med}
/* FSA / HSA 说明弹窗 */
.sheet-mask{position:fixed;inset:0;background:rgba(20,27,61,.45);display:flex;
  align-items:flex-end;justify-content:center;z-index:60}
.sheet{width:100%;background:$card;border-radius:$r-lg $r-lg 0 0;padding:40rpx 36rpx 48rpx;
  display:flex;flex-direction:column;gap:18rpx}
.sheet-t{font-size:$fs-md;font-weight:$fw-semi;color:$ink}
.sheet-b{font-size:$fs-sm;line-height:1.65;color:$ink;opacity:.82}
</style>
