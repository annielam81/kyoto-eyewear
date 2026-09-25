<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useProductStore } from '@/stores/product';
onLaunch(() => { useProductStore().ensure(); });
</script>
<style lang="scss">
@font-face{font-family:'Cinzel';font-weight:400 700;font-display:swap;src:url('@/static/fonts/Cinzel-latin.woff2') format('woff2')}
@font-face{font-family:'Sora';font-weight:100 800;font-display:swap;src:url('@/static/fonts/Sora-latin.woff2') format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-weight:400 700;font-display:swap;src:url('@/static/fonts/PlusJakartaSans-latin.woff2') format('woff2')}
@font-face{font-family:'Noto Serif JP';font-weight:600;font-display:swap;src:url('@/static/fonts/NotoSerifJP-kanji.woff2') format('woff2');unicode-range:U+4EAC,U+90FD}
page, body{background:$paper;color:$night;font-family:$font-ui;line-height:$lh;-webkit-font-smoothing:antialiased}
.page-pad{padding:0 $sp-3 calc(#{$nav-h} + 80rpx + #{$safe-b})}
.safe-top{padding-top:$safe-t}
/* 共享页面顶栏（wordmark + 语言切换）。
 * 它 owning iOS 状态栏 inset，并且必须是 **sticky + 不透明**：
 * 自定义导航 + 沉浸式状态栏下，页面内容会一直滚到状态栏/灵动岛底下，
 * 只加 padding-top 只能管住「初始位置」，滚动后区块标题依然会钻进状态栏
 * ——这正是真机上「热卖 / KYOTO EDIT 进入状态栏」的原因。
 * 这里用与 KyotoHeader 相同的做法：sticky 吸顶 + $paper 实底遮罩 + 负边距出血到屏幕边缘。 */
.top-bar{position:sticky;top:0;z-index:$z-nav;display:flex;align-items:center;justify-content:space-between;
  margin:0 (-$sp-3);padding:calc(#{$sp-2} + #{$safe-t}) $sp-3 18rpx;background:$paper}
/* 没有顶栏的页面（如订单确认）用这个只做状态栏遮罩 */
.safe-scrim{position:sticky;top:0;z-index:$z-nav;margin:0 (-$sp-3);height:calc(#{$safe-t} + #{$sp-2});background:$paper}
/* unified clearance for content above fixed bottom nav / CTA */
.above-nav{padding-bottom:calc(#{$nav-h} + 56rpx + #{$safe-b})}

/* ---- editorial 共享排版件（配色沿用现有 token，不引入新颜色）---- */
/* 小标签：大写 + 宽字距，用于分节眉标与元信息 */
.eyebrow{font-size:$fs-xs;letter-spacing:$ls-eyebrow;text-transform:uppercase;font-weight:$fw-semi;color:$muted}
/* 分节头：左侧眉标+标题，右侧操作。比原来的 .sec 更矮，把高度让给商品 */
.sec-h{display:flex;align-items:flex-end;justify-content:space-between;gap:$sp-3;margin:40rpx 0 20rpx}
.sec-h .sh-l{display:flex;flex-direction:column;gap:4rpx;min-width:0}
.sec-h .sh-t{font-size:$fs-lg;font-weight:$fw-bold;letter-spacing:-.01em;line-height:1.2;color:$ink}
.sec-h .sh-a{font-size:$fs-xs;font-weight:$fw-semi;color:$accent-ink;white-space:nowrap;padding-bottom:4rpx}
/* 细分割线 */
.rule{height:2rpx;background:$line;margin:$sp-4 0}
/* 信息行：左标签右值，编辑感，不用 emoji */
.info-row{display:flex;align-items:baseline;justify-content:space-between;gap:$sp-3;
  padding:20rpx 0;border-bottom:2rpx solid $line}
.info-row:last-child{border-bottom:none}
.info-row .ir-k{font-size:$fs-xs;letter-spacing:.06em;text-transform:uppercase;color:$muted;font-weight:$fw-semi;flex-shrink:0}
.info-row .ir-v{font-size:$fs-sm;color:$ink;text-align:right;line-height:1.5}
/* ---- 设计系统（对应视觉母版 10 · UI Elements）----
 * 这些是全 App 共用的组件气质，不要在每个页面各写一套。 */
/* 徽标：Badge(Indigo) / Best Seller(Vermilion) / New(Aqua) */
.k-badge{display:inline-flex;align-items:center;font-size:16rpx;letter-spacing:.06em;
  padding:4rpx 12rpx;border-radius:$r-xs;font-weight:$fw-semi;line-height:1.5;
  background:$ink;color:$paper}
.k-badge.best{background:$accent-strong;color:#fff}
.k-badge.new{background:transparent;color:$teal;border:1rpx solid $teal}
/* 图标按钮：细描边圆形，母版 Icon Button */
.k-iconbtn{width:68rpx;height:68rpx;border-radius:50%;background:$card;border:1rpx solid $line-strong;
  display:flex;align-items:center;justify-content:center;color:$ink;flex-shrink:0}
.k-iconbtn :deep(svg){width:34rpx;height:34rpx;display:block}
/* 卡面：母版里所有白卡统一这一套（白底 + 发丝线 + 轻阴影 + 小圆角） */
.k-card{background:$card;border:1rpx solid $line;border-radius:$r-md;box-shadow:$shadow-soft}
/* 数量步进器 */
.k-step{display:flex;align-items:center;gap:$sp-2}
.k-step .kb-q{width:52rpx;height:52rpx;border:1rpx solid $line-strong;border-radius:$r-xs;
  display:flex;align-items:center;justify-content:center;font-size:$fs-md;color:$ink;background:$card}
.k-step .kb-n{font-size:$fs-sm;font-weight:$fw-semi;min-width:44rpx;text-align:center;
  font-variant-numeric:tabular-nums}
/* 序号（01 / 02 …），editorial 网格用 */
.ordinal{font-size:$fs-xs;font-weight:$fw-semi;letter-spacing:.1em;color:$line-strong;font-variant-numeric:tabular-nums}
h1,.h1{font-size:$fs-h1;font-weight:$fw-bold;line-height:1.22;letter-spacing:-.01em}
.h2{font-size:$fs-lg;font-weight:$fw-bold}
.sub{color:$muted;font-size:$fs-sm;line-height:1.6}
.grp{font-size:$fs-xs;letter-spacing:.12em;color:$muted;font-weight:$fw-semi;margin:28rpx 0 14rpx;text-transform:uppercase}
.sticky-cta{position:fixed;left:0;right:0;bottom:0;padding:24rpx $sp-3 calc(28rpx + #{$safe-b});background:linear-gradient(transparent,$paper 30%);z-index:$z-nav}
.chip{display:inline-flex;border:3rpx solid $line;border-radius:$r-pill;padding:12rpx 26rpx;font-size:$fs-sm;color:$muted;background:#fff;margin-right:14rpx}
.chip.on{background:$night;border-color:$night;color:#fff}
</style>
