/**
 * KYOTO 品牌色的 **JS 侧单一来源**，与 src/styles/tokens.scss 一一对应。
 *
 * 为什么需要这一份：首页 hero、splash、welcome、试戴引导等插画是写在 `<script setup>` 里的
 * SVG 模板字符串（`const heroBg = \`<svg …fill="…">\``）。模板字符串拿不到 SCSS 变量，
 * 所以这些颜色过去只能硬编码在各个页面里——那正是「颜色散落在页面中」的根源。
 *
 * 改配色时两边都要改，因此下面每个值都标注了对应的 SCSS token 名，方便对齐核对。
 * 这里刻意不放任何**产品实物颜色**（镜框的 Night / Tortoise / Gunmetal 等在
 * ProductService 里，属于商品属性而非品牌色，不能跟着品牌改色一起动）。
 */
export const BRAND = {
  paper: '#FFF5E6',       // $paper      象牙白底
  ink: '#141B3D',         // $ink        极深藍靛（正文/剪影）
  indigo: '#1D286C',      // $indigo     藍，hero 主背景
  vermilion: '#E43D30',   // $vermilion  朱，hero 日轮
  aqua: '#00B8B0',        // $aqua       水色，hero 山水/波浪
  gold: '#E8A33D',        // $gold       强金，hero CTA 底
  goldSoft: '#F2C9AC',    // $gold-soft  柔金
  purple: '#5A2D82',      // $purple     深紫，极少量
  teal: '#00726D',        // $teal       水色加深（原生组件 prop / 小字可读变体）
  tintAqua: '#DBF2F0',    // $tint-aqua
  tintVermilion: '#FAE6E2', // $tint-vermilion
} as const;
