<template>
  <view class="page-pad">
    <!-- HEADER -->
    <view class="top-bar home-top">
      <KyotoWordmark :height="19" />
      <LanguageSelector compact />
    </view>

    <!-- HERO -->
    <view class="hero">
      <view class="h-art" v-html="heroArt"></view>
      <view class="h-scrim"></view>

      <view class="h-copy">
        <view class="h-eyebrow">
          <view class="h-eyebrow-line"></view>
          <text>SPRING COLLECTION</text>
        </view>

        <text class="h-t">{{ $t('home.hero.title') }}</text>
        <text class="h-s">{{ $t('home.hero.subtitle') }}</text>

        <view
          class="h-cta"
          @click="nav('/pages/frames/index', true)"
        >
          <text>{{ $t('home.hero.cta') }}</text>
          <text class="h-arrow">→</text>
        </view>
      </view>
    </view>

    <!-- QUICK SERVICES -->
    <view class="svc">
      <view
        v-for="q in quick"
        :key="q.k"
        class="sv"
        @click="q.go()"
      >
        <view class="sv-ic" v-html="q.icon"></view>
        <text class="sv-l">{{ $t('home.services.' + q.k) }}</text>
      </view>
    </view>

    <!-- BESTSELLERS -->
    <view class="sh">
      <text class="sh-t">{{ $t('home.bestsellers') }}</text>
      <text
        class="sh-a"
        @click="nav('/pages/frames/index', true)"
      >
        {{ $t('common.seeAll') }} ›
      </text>
    </view>

    <scroll-view scroll-x class="hs">
      <view class="hs-in">
        <view
          v-for="f in best"
          :key="f.id"
          class="hcard"
        >
          <ProductCard
            :frame="f"
            @open="openDetail"
          />
        </view>
      </view>
    </scroll-view>

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
    <view class="sh">
      <text class="sh-t">{{ $t('home.newArrivals') }}</text>
      <text
        class="sh-a"
        @click="nav('/pages/frames/index', true)"
      >
        {{ $t('common.seeAll') }} ›
      </text>
    </view>

    <scroll-view scroll-x class="hs">
      <view class="hs-in">
        <view
          v-for="f in news"
          :key="f.id"
          class="hcard"
        >
          <ProductCard
            :frame="f"
            @open="openDetail"
          />
        </view>
      </view>
    </scroll-view>

    <KyotoBottomNav active="home" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';

import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import ProductCard from '@/components/ProductCard.vue';

import { useProductStore } from '@/stores/product';
import { isContactLensAvailable } from '@/config/launch-availability.config';
import { BRAND } from '@/config/brand-colors';

const products = useProductStore();

onShow(() => products.ensure());

const best = computed(() =>
  products.frames.filter(
    f => f.bestSeller || ['gion', 'tasogare'].includes(f.id)
  )
);

const news = computed(() =>
  products.frames.filter(f => f.newArrival)
);

const nav = (url: string, relaunch = false) =>
  relaunch
    ? uni.reLaunch({ url })
    : uni.navigateTo({ url });

const openDetail = (id: string) =>
  uni.navigateTo({
    url: `/pages/product/detail?id=${id}`,
  });

/* -------------------------------------------------------
   QUICK SERVICES
------------------------------------------------------- */

const I = (d: string) => `
<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="${BRAND.ink}"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  ${d}
</svg>`;

const quick = [
  {
    k: 'virtualTryOn',
    icon: I(
      '<rect x="3" y="6" width="18" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.6"/><path d="M9 6l1.5-2h3L15 6"/>'
    ),
    go: () =>
      uni.navigateTo({
        url: '/pages/tryon/index?frame=arashiyama',
      }),
  },
  {
    k: 'uploadRx',
    icon: I(
      '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'
    ),
    go: () =>
      uni.navigateTo({
        url: '/pages/prescription/upload',
      }),
  },
  {
    k: 'reorder',
    icon: I(
      '<path d="M3 12a9 9 0 1 1 3 6.7M3 20v-5h5"/>'
    ),
    go: () =>
      uni.navigateTo({
        url: '/pages/order/list',
      }),
  },
  {
    k: 'fsa',
    icon: I(
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'
    ),
    go: () =>
      uni.showToast({
        title: 'FSA / HSA',
        icon: 'none',
      }),
  },
];

/* -------------------------------------------------------
   KYOTO HERO ART
   重点：不是 icon 塔。
   使用分层建筑 + 山水 + 日轮 + 樱花。
------------------------------------------------------- */

const heroArt = `
<svg
  viewBox="0 0 390 230"
  preserveAspectRatio="xMidYMid slice"
  xmlns="http://www.w3.org/2000/svg"
  style="width:100%;height:100%"
>
  <defs>
    <linearGradient id="kyotoSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFDF8"/>
      <stop offset=".62" stop-color="#FFF8ED"/>
      <stop offset="1" stop-color="${BRAND.paper}"/>
    </linearGradient>

    <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BRAND.indigo}" stop-opacity=".09"/>
      <stop offset="1" stop-color="${BRAND.indigo}" stop-opacity=".04"/>
    </linearGradient>

    <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BRAND.indigo}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${BRAND.indigo}" stop-opacity=".09"/>
    </linearGradient>

    <linearGradient id="mountainNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BRAND.indigo}" stop-opacity=".30"/>
      <stop offset="1" stop-color="${BRAND.indigo}" stop-opacity=".17"/>
    </linearGradient>

    <filter id="mistBlur">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>

  <!-- WARM IVORY SKY -->
  <rect width="390" height="230" fill="url(#kyotoSky)"/>

  <!-- VERY SUBTLE JAPANESE PAPER LINES -->
  <g
    stroke="${BRAND.gold}"
    stroke-opacity=".045"
    stroke-width=".6"
  >
    <path d="M0 42C70 38 116 47 190 42S320 36 390 42"/>
    <path d="M0 54C86 49 140 60 216 54S330 48 390 52"/>
  </g>

  <!-- VERMILION SUN -->
  <circle
    cx="292"
    cy="77"
    r="47"
    fill="${BRAND.vermilion}"
    fill-opacity=".87"
  />

  <!-- FAR HIGASHIYAMA -->
  <path
    d="
      M0 145
      C22 141 35 133 53 130
      C72 126 83 136 101 133
      C123 129 135 115 153 113
      C172 111 184 126 203 126
      C222 125 235 105 255 106
      C277 107 287 124 307 123
      C327 122 343 111 360 113
      C373 114 383 120 390 123
      L390 230 L0 230 Z
    "
    fill="url(#mountainFar)"
  />

  <!-- DISTANT MIST -->
  <g
    fill="#FFFDF8"
    fill-opacity=".72"
    filter="url(#mistBlur)"
  >
    <ellipse cx="208" cy="132" rx="112" ry="8"/>
    <ellipse cx="309" cy="145" rx="94" ry="7"/>
  </g>

  <!-- MID MOUNTAINS -->
  <path
    d="
      M0 169
      C22 164 37 153 58 151
      C80 148 91 161 111 159
      C133 157 145 140 165 139
      C185 138 198 151 216 151
      C239 150 249 132 271 134
      C293 136 306 150 326 149
      C348 147 366 137 390 142
      L390 230 L0 230 Z
    "
    fill="url(#mountainMid)"
  />

  <!-- KYOTO HAZE BANDS -->
  <g fill="#FFF9F0">
    <path
      d="
        M103 140
        C135 135 164 138 190 137
        C219 136 244 132 273 135
        C250 140 223 142 195 142
        C160 143 133 146 103 140Z
      "
      fill-opacity=".72"
    />
    <path
      d="
        M65 157
        C105 153 139 158 175 155
        C205 153 236 150 266 153
        C238 159 210 160 178 160
        C137 161 103 164 65 157Z
      "
      fill-opacity=".62"
    />
  </g>

  <!-- ==================================================
       FIVE STOREY KYOTO PAGODA
       Individual roofs + bodies = no solid clip-art blob
  =================================================== -->
  <g transform="translate(271 31)">

    <!-- SORIN -->
    <g
      fill="none"
      stroke="${BRAND.ink}"
      stroke-linecap="round"
    >
      <path
        d="M49 0V28"
        stroke-width="1.5"
        stroke-opacity=".95"
      />
      <path
        d="M44 6H54
           M43 10H55
           M44 14H54
           M44.5 18H53.5
           M45 22H53"
        stroke-width="1.25"
        stroke-opacity=".92"
      />
      <path
        d="M49 0
           C46 3 46 5 49 7
           C52 5 52 3 49 0Z"
        fill="${BRAND.ink}"
        stroke="none"
      />
    </g>

    <!-- TOP FINIAL BASE -->
    <path
      d="M43 29 L55 29 L58 34 L40 34 Z"
      fill="${BRAND.ink}"
      fill-opacity=".88"
    />

    <!-- STOREY 5 BODY -->
    <path
      d="M42 34 L56 34 L57 47 L41 47 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".73"
    />
    <path
      d="M47 36H51V47H47Z"
      fill="${BRAND.ink}"
      fill-opacity=".70"
    />

    <!-- ROOF 5 -->
    <path
      d="
        M49 43
        C40 47 31 49 22 49
        C29 53 38 54 49 53
        C60 54 69 53 76 49
        C67 49 58 47 49 43Z
      "
      fill="${BRAND.ink}"
      fill-opacity=".93"
    />
    <path
      d="M25 49 Q49 57 73 49"
      fill="none"
      stroke="${BRAND.gold}"
      stroke-opacity=".22"
      stroke-width=".8"
    />

    <!-- STOREY 4 -->
    <path
      d="M39 52 L59 52 L61 68 L37 68 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".72"
    />
    <path
      d="M45 54H53V68H45Z"
      fill="${BRAND.ink}"
      fill-opacity=".65"
    />

    <!-- ROOF 4 -->
    <path
      d="
        M49 63
        C36 68 24 70 13 69
        C22 75 34 76 49 74
        C64 76 76 75 85 69
        C74 70 62 68 49 63Z
      "
      fill="${BRAND.ink}"
      fill-opacity=".92"
    />
    <path
      d="M17 69 Q49 79 81 69"
      fill="none"
      stroke="${BRAND.gold}"
      stroke-opacity=".20"
      stroke-width=".8"
    />

    <!-- STOREY 3 -->
    <path
      d="M35 73 L63 73 L66 91 L32 91 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".74"
    />
    <path
      d="M41 76H47V91H41Z
         M51 76H57V91H51Z"
      fill="${BRAND.ink}"
      fill-opacity=".60"
    />

    <!-- ROOF 3 -->
    <path
      d="
        M49 85
        C33 91 18 94 4 92
        C15 100 31 101 49 98
        C67 101 83 100 94 92
        C80 94 65 91 49 85Z
      "
      fill="${BRAND.ink}"
      fill-opacity=".94"
    />
    <path
      d="M8 92 Q49 105 90 92"
      fill="none"
      stroke="${BRAND.gold}"
      stroke-opacity=".18"
      stroke-width=".9"
    />

    <!-- STOREY 2 -->
    <path
      d="M31 97 L67 97 L70 119 L28 119 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".76"
    />
    <path
      d="M37 100H44V119H37Z
         M47 100H54V119H47Z
         M57 100H64V119H57Z"
      fill="${BRAND.ink}"
      fill-opacity=".59"
    />

    <!-- ROOF 2 -->
    <path
      d="
        M49 111
        C29 119 12 121 -5 119
        C8 128 27 130 49 126
        C71 130 90 128 103 119
        C86 121 69 119 49 111Z
      "
      fill="${BRAND.ink}"
      fill-opacity=".95"
    />
    <path
      d="M0 119 Q49 135 98 119"
      fill="none"
      stroke="${BRAND.gold}"
      stroke-opacity=".18"
      stroke-width=".9"
    />

    <!-- STOREY 1 -->
    <path
      d="M26 125 L72 125 L76 151 L22 151 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".78"
    />

    <!-- WOODEN STRUCTURE -->
    <g
      stroke="${BRAND.ink}"
      stroke-opacity=".62"
      stroke-width="1"
    >
      <path d="M31 128V151"/>
      <path d="M40 127V151"/>
      <path d="M49 126V151"/>
      <path d="M58 127V151"/>
      <path d="M67 128V151"/>
      <path d="M27 138H71"/>
    </g>

    <!-- ROOF 1 -->
    <path
      d="
        M49 142
        C25 151 4 154 -15 151
        C0 162 24 164 49 159
        C74 164 98 162 113 151
        C94 154 73 151 49 142Z
      "
      fill="${BRAND.ink}"
      fill-opacity=".96"
    />
    <path
      d="M-9 151 Q49 170 107 151"
      fill="none"
      stroke="${BRAND.gold}"
      stroke-opacity=".20"
      stroke-width="1"
    />

    <!-- LOWER BODY -->
    <path
      d="M20 159 L78 159 L82 184 L16 184 Z"
      fill="${BRAND.indigo}"
      fill-opacity=".80"
    />

    <g
      stroke="${BRAND.ink}"
      stroke-opacity=".65"
      stroke-width="1"
    >
      <path d="M27 160V183"/>
      <path d="M38 160V183"/>
      <path d="M49 160V183"/>
      <path d="M60 160V183"/>
      <path d="M71 160V183"/>
    </g>

    <!-- STONE BASE -->
    <path
      d="M12 184H86L92 190H6Z"
      fill="${BRAND.ink}"
      fill-opacity=".78"
    />
  </g>

  <!-- NEAR MOUNTAINS -->
  <path
    d="
      M0 194
      C26 187 48 174 70 176
      C91 177 105 190 126 187
      C151 184 166 169 188 170
      C211 171 225 188 248 186
      C273 183 287 169 310 171
      C338 173 358 185 390 180
      L390 230 L0 230 Z
    "
    fill="url(#mountainNear)"
  />

  <!-- LOWER MIST -->
  <g fill="#FFF9F0" fill-opacity=".58">
    <path
      d="
        M95 192
        C139 187 178 193 218 190
        C251 188 286 184 321 188
        C290 195 253 196 218 196
        C174 196 133 199 95 192Z
      "
    />
  </g>

  <!-- DISTANT KYOTO ROOFLINE -->
  <g
    fill="${BRAND.indigo}"
    fill-opacity=".14"
  >
    <path d="M159 204l14-8 15 8h-5v10h-19v-10z"/>
    <path d="M190 208l11-6 12 6h-4v8h-15v-8z"/>
    <path d="M216 205l16-9 17 9h-5v10h-23v-10z"/>
  </g>

  <!-- CHERRY BLOSSOM BRANCH -->
  <g>
    <path
      d="
        M390 166
        C371 170 359 178 347 188
        C337 196 327 204 309 214
        M364 177
        C357 169 351 163 343 158
        M347 188
        C354 190 363 195 369 202
        M331 201
        C326 193 320 188 313 184
      "
      fill="none"
      stroke="${BRAND.ink}"
      stroke-opacity=".70"
      stroke-width="2"
      stroke-linecap="round"
    />

    <!-- blossom clusters -->
    <g fill="#FFF4EC" stroke="${BRAND.vermilion}" stroke-opacity=".30" stroke-width=".5">
      <g transform="translate(343 158)">
        <circle cx="-3" cy="0" r="3"/>
        <circle cx="0" cy="-3" r="3"/>
        <circle cx="3" cy="0" r="3"/>
        <circle cx="0" cy="3" r="3"/>
        <circle cx="0" cy="0" r="1.2" fill="${BRAND.vermilion}"/>
      </g>

      <g transform="translate(360 175)">
        <circle cx="-3" cy="0" r="3.2"/>
        <circle cx="0" cy="-3" r="3.2"/>
        <circle cx="3" cy="0" r="3.2"/>
        <circle cx="0" cy="3" r="3.2"/>
        <circle cx="0" cy="0" r="1.2" fill="${BRAND.vermilion}"/>
      </g>

      <g transform="translate(370 201)">
        <circle cx="-3" cy="0" r="3.1"/>
        <circle cx="0" cy="-3" r="3.1"/>
        <circle cx="3" cy="0" r="3.1"/>
        <circle cx="0" cy="3" r="3.1"/>
        <circle cx="0" cy="0" r="1.1" fill="${BRAND.vermilion}"/>
      </g>

      <g transform="translate(314 184)">
        <circle cx="-2.8" cy="0" r="2.8"/>
        <circle cx="0" cy="-2.8" r="2.8"/>
        <circle cx="2.8" cy="0" r="2.8"/>
        <circle cx="0" cy="2.8" r="2.8"/>
        <circle cx="0" cy="0" r="1" fill="${BRAND.vermilion}"/>
      </g>

      <g transform="translate(329 202)">
        <circle cx="-3" cy="0" r="3"/>
        <circle cx="0" cy="-3" r="3"/>
        <circle cx="3" cy="0" r="3"/>
        <circle cx="0" cy="3" r="3"/>
        <circle cx="0" cy="0" r="1.1" fill="${BRAND.vermilion}"/>
      </g>
    </g>
  </g>

  <!-- WARM FOREGROUND -->
  <path
    d="
      M0 218
      C66 214 113 221 170 217
      C225 214 279 220 329 216
      C350 214 372 215 390 217
      L390 230 L0 230 Z
    "
    fill="${BRAND.gold}"
    fill-opacity=".10"
  />
</svg>
`;

/* -------------------------------------------------------
   CONTACT LENS PROMO
------------------------------------------------------- */

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

/* =======================================================
   HEADER
======================================================= */

.home-top{
  position:relative;
  z-index:10;
  background:$paper;
}

/* =======================================================
   HERO
======================================================= */

.hero{
  position:relative;
  overflow:hidden;

  min-height:450rpx;

  display:flex;

  border:1rpx solid rgba(13,27,42,.08);
  border-radius:$r-lg;

  background:#fff9ef;

  box-shadow:
    0 18rpx 46rpx -34rpx rgba(13,27,42,.28);
}

.h-art{
  position:absolute;
  inset:0;
}

.h-art :deep(svg){
  display:block;
  width:100%;
  height:100%;
}

/* left readability layer */
.h-scrim{
  position:absolute;
  inset:0;

  background:
    linear-gradient(
      90deg,
      rgba(255,249,239,.99) 0%,
      rgba(255,249,239,.96) 24%,
      rgba(255,249,239,.83) 39%,
      rgba(255,249,239,.42) 53%,
      rgba(255,249,239,0) 68%
    );
}

/* copy */
.h-copy{
  position:relative;
  z-index:2;

  width:58%;
  max-width:58%;

  padding:
    38rpx
    24rpx
    34rpx
    30rpx;

  display:flex;
  flex-direction:column;
  align-items:flex-start;

  gap:11rpx;
}

.h-eyebrow{
  display:flex;
  align-items:center;
  gap:10rpx;

  margin-bottom:2rpx;

  color:$ink;

  font-size:18rpx;
  font-weight:$fw-semi;

  letter-spacing:.20em;
  line-height:1;
}

.h-eyebrow-line{
  width:3rpx;
  height:25rpx;

  border-radius:99rpx;

  background:$accent-strong;
}

.h-t{
  max-width:100%;

  color:$ink;

  font-size:44rpx;
  font-weight:$fw-bold;

  letter-spacing:-.025em;
  line-height:1.12;
}

.h-s{
  max-width:94%;

  color:$muted;

  font-size:23rpx;
  line-height:1.5;
}

.h-cta{
  margin-top:8rpx;

  min-height:64rpx;

  padding:0 28rpx;

  display:flex;
  align-items:center;
  justify-content:center;

  gap:14rpx;

  color:#fff;
  background:$accent-strong;

  border-radius:$r-pill;

  font-size:$fs-sm;
  font-weight:$fw-semi;

  letter-spacing:.01em;

  box-shadow:
    0 13rpx 28rpx -15rpx rgba(205,55,43,.65);
}

.h-arrow{
  font-size:30rpx;
  font-weight:400;
  line-height:1;

  transform:translateY(-1rpx);
}

/* =======================================================
   QUICK SERVICES
======================================================= */

.svc{
  display:grid;
  grid-template-columns:1fr 1fr;

  gap:14rpx;

  margin-top:22rpx;
}

.sv{
  min-width:0;

  display:flex;
  align-items:center;

  gap:16rpx;

  padding:17rpx 18rpx;

  background:rgba(255,255,255,.72);

  border:
    1rpx
    solid
    rgba(13,27,42,.08);

  border-radius:$r-sm;

  box-shadow:
    0 12rpx 30rpx -27rpx rgba(13,27,42,.30);
}

.sv-ic{
  width:62rpx;
  height:62rpx;

  flex-shrink:0;

  display:flex;
  align-items:center;
  justify-content:center;

  border-radius:50%;

  background:#f4ede3;
}

.sv-ic :deep(svg){
  display:block;

  width:34rpx;
  height:34rpx;
}

.sv-l{
  min-width:0;

  color:$ink;

  font-size:$fs-xs;
  font-weight:$fw-semi;

  line-height:1.25;
}

/* =======================================================
   SECTION HEADINGS
======================================================= */

.sh{
  margin:
    42rpx
    0
    18rpx;

  display:flex;
  align-items:flex-end;
  justify-content:space-between;

  gap:$sp-3;
}

.sh-t{
  color:$ink;

  font-size:34rpx;
  font-weight:$fw-bold;

  letter-spacing:-.025em;
  line-height:1.15;
}

.sh-a{
  padding-bottom:2rpx;

  color:$muted;

  font-size:$fs-xs;
  font-weight:$fw-med;

  white-space:nowrap;
}

/* =======================================================
   PRODUCT STRIPS
======================================================= */

.hs{
  width:100%;

  white-space:nowrap;
}

.hs-in{
  display:flex;

  gap:$sp-3;

  padding-bottom:$sp-2;
}

.hcard{
  width:268rpx;

  flex:
    0
    0
    268rpx;
}

/* =======================================================
   CONTACT PROMO
======================================================= */

.promo{
  position:relative;

  overflow:hidden;

  min-height:200rpx;

  margin-top:$sp-4;

  color:$paper;

  border-radius:$r-md;
}

.pbg{
  position:absolute;
  inset:0;
}

.pin{
  position:relative;

  max-width:72%;

  padding:28rpx;

  display:flex;
  flex-direction:column;

  gap:8rpx;
}

.pt{
  color:#fff;

  font-size:$fs-md;
  font-weight:$fw-bold;
}

.psb{
  font-size:$fs-xs;

  line-height:1.5;

  opacity:.8;
}

.pcta{
  align-self:flex-start;

  margin-top:12rpx;

  padding:
    12rpx
    24rpx;

  color:#fff;
  background:$accent-strong;

  border-radius:$r-sm;

  font-size:$fs-xs;
  font-weight:$fw-semi;
}

</style>
