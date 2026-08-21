/** Unified back navigation with per-page safe fallbacks (H5 direct entry / no history). */
export function goBack(fallbackUrl = '/pages/home/index') {
  const pages = getCurrentPages?.() ?? [];
  if (pages.length > 1) uni.navigateBack({ fail: () => uni.reLaunch({ url: fallbackUrl }) });
  else uni.reLaunch({ url: fallbackUrl });
}
export const FALLBACK = {
  pdp: '/pages/frames/index',
  wizard: '/pages/frames/index',
  rx: '/pages/wizard/index',
  checkout: '/pages/cart/index',
  orderDetail: '/pages/order/list',
  accountSub: '/pages/account/index',
  home: '/pages/home/index',
} as const;
