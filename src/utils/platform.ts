/** Platform capability hints. H5-verified heuristics; native behavior marked inferred. */
export function isXHS(): boolean {
  // #ifdef H5
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('xhsapp') || ua.includes('discover/');
  // #endif
  return false;
}
export function applePayUiAllowed(): boolean {
  // UI/mock only. Hide inside 小红书 in-app browser where Apple Pay cannot exist.
  return !isXHS();
}
export function cameraLikelyAvailable(): boolean {
  // #ifdef H5
  if (isXHS()) return false;                       // in-app browser: assume restricted → fallback
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  // #endif
  return true;
}
