<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useProductStore } from '@/stores/product';
onLaunch(() => { useProductStore().ensure(); });
</script>
<style lang="scss">
@font-face{font-family:'Sora';src:local('Sora');font-display:swap}
page, body{background:$paper;color:$night;font-family:$font-ui;line-height:$lh;-webkit-font-smoothing:antialiased}
.page-pad{padding:0 $sp-3 calc(220rpx + #{$safe-b})}
.safe-top{padding-top:$safe-t}
/* shared page top bar (wordmark + language switcher). Owns the iOS status-bar inset so
   pages never re-declare padding-top and silently clobber it via the padding shorthand. */
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:calc(#{$sp-2} + #{$safe-t}) 0 22rpx}
/* unified clearance for content above fixed bottom nav / CTA */
.above-nav{padding-bottom:calc(170rpx + env(safe-area-inset-bottom))}
h1,.h1{font-size:$fs-h1;font-weight:$fw-bold;line-height:1.22;letter-spacing:-.01em}
.h2{font-size:$fs-lg;font-weight:$fw-bold}
.sub{color:$muted;font-size:$fs-sm;line-height:1.6}
.grp{font-size:$fs-xs;letter-spacing:.12em;color:$muted;font-weight:$fw-semi;margin:28rpx 0 14rpx;text-transform:uppercase}
.sticky-cta{position:fixed;left:0;right:0;bottom:0;padding:24rpx $sp-3 calc(28rpx + #{$safe-b});background:linear-gradient(transparent,$paper 30%);z-index:$z-nav}
.chip{display:inline-flex;border:3rpx solid $line;border-radius:$r-pill;padding:12rpx 26rpx;font-size:$fs-sm;color:$muted;background:#fff;margin-right:14rpx}
.chip.on{background:$night;border-color:$night;color:#fff}
</style>
