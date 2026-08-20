export type PaymentMethod = 'apple' | 'card' | 'fsa';
export interface PaymentResult { ok: boolean; mock: true }
/** UI + interface + mock states only. Real processor integration in a later phase. */
export const PaymentService = {
  available(): PaymentMethod[] { return ['apple','card','fsa']; },
  async pay(_method: PaymentMethod, _amount: number): Promise<PaymentResult> {
    await new Promise(r => setTimeout(r, 900));
    return { ok: true, mock: true };
  },
};
