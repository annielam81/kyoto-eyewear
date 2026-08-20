/** Abstraction for a future AR engine. Phase 3 ships UI shell + mock alignment only. */
export interface TryOnSession { aligned: boolean }
export const VirtualTryOnService = {
  supported(): boolean {
    // H5 (incl. 小红书 in-app browser): camera may be restricted → graceful fallback handled by UI.
    return true;
  },
  async requestPermission(): Promise<'granted' | 'denied'> {
    // PRODUCTION-INTEGRATION-REQUIRED: real camera permission per platform.
    await new Promise(r => setTimeout(r, 300));
    return 'granted';
  },
  async startMockAlignment(cb: (s: TryOnSession) => void): Promise<void> {
    setTimeout(() => cb({ aligned: true }), 1400);
  },
};
