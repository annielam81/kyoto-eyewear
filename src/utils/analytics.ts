/**
 * 轻量埋点接口（launch 阶段）。
 *
 * 项目当前没有 analytics 系统：这里只定义事件名 + 统一入口，
 * 默认 no-op（dev 下 console.debug），不引入任何第三方依赖。
 *
 * 以后接 GA4 / Meta Pixel / TikTok Events 时，只需：
 *  1. 把下面的 ENABLED 打开（或按构建环境切换）；
 *  2. 在 dispatch() 里把事件转发给 gtag / fbq / ttq。
 *
 * 调用点已经按事件语义埋好，搜索 `trackEvent(` 即可看到全部。
 */
export type AnalyticsEvent =
  | 'view_product'
  | 'start_virtual_tryon'
  | 'complete_virtual_tryon'
  | 'favorite_frame'
  | 'start_prescription'
  | 'complete_prescription'
  | 'select_lens_upgrade'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

/** 第三方投放对接完成后改为 true（或按环境变量切换）。 */
const ENABLED = false;

function dispatch(event: AnalyticsEvent, payload: AnalyticsPayload): void {
  // GA4:  window.gtag?.('event', event, payload)
  // Meta:  window.fbq?.('trackCustom', event, payload)
  // TikTok: window.ttq?.track(event, payload)
  void event;
  void payload;
}

/** 统一埋点入口：ENABLED=false 时为 no-op；埋点失败绝不能影响购买流程。 */
export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (!ENABLED) return;
  try {
    dispatch(event, payload);
  } catch {
    /* 埋点失败绝不能影响购买流程 */
  }
}
