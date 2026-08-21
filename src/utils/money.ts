/** Money = integer minor units (cents). Avoids floating-point pricing drift.
 *  UI keeps whole-dollar display for now; API/domain contracts are cents. */
export const toCents = (dollars: number): number => Math.round(dollars * 100);
export const fromCents = (cents: number): number => cents / 100;
export const addCents = (...c: number[]): number => c.reduce((a, b) => a + b, 0);
export const formatCents = (cents: number): string =>
  (cents % 100 === 0) ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
