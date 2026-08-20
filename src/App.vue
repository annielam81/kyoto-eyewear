<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useProductStore } from '@/stores/product';
onLaunch(() => { useProductStore().ensure(); });
</script>
<style lang="scss">
@font-face{font-family:'Sora';src:local('Sora');font-display:swap}
page, body{background:$paper;color:$night;font-family:$font-ui;line-height:$lh;-webkit-font-smoothing:antialiased}
.page-pad{padding:0 $sp-3 220rpx}
h1,.h1{font-size:$fs-h1;font-weight:$fw-bold;line-height:1.22;letter-spacing:-.01em}
.h2{font-size:$fs-lg;font-weight:$fw-bold}
.sub{color:$muted;font-size:$fs-sm;line-height:1.6}
.grp{font-size:$fs-xs;letter-spacing:.12em;color:$muted;font-weight:$fw-semi;margin:28rpx 0 14rpx;text-transform:uppercase}
.sticky-cta{position:fixed;left:0;right:0;bottom:0;padding:24rpx $sp-3 calc(28rpx + #{$safe-b});background:linear-gradient(transparent,$paper 30%);z-index:$z-nav}
.chip{display:inline-flex;border:3rpx solid $line;border-radius:$r-pill;padding:12rpx 26rpx;font-size:$fs-sm;color:$muted;background:#fff;margin-right:14rpx}
.chip.on{background:$night;border-color:$night;color:#fff}
</style>
