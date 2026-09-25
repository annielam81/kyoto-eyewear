import type { Prescription } from '@/models';
import { uid } from '@/utils/storage';
export const PrescriptionService = {
  blank(source: Prescription['source']): Prescription {
    return { prescriptionId: uid(), userId: null, source, od: null, os: null,
      pdMode: 'single', pd: 63, pdOd: null, pdOs: null,
      fileReference: null, uploadStatus: 'none', verificationStatus: 'n/a',
      uploadedAt: null, issueDate: null, expirationDate: null, label: '' };
  },
  savedMock(): Prescription {
    return { ...this.blank('saved'), label: 'Dr. Chen · Mar 2026',
      od: { sph:'-3.25', cyl:'-0.50', axis:'180', add:'+2.00' }, os: { sph:'-3.00', cyl:'', axis:'', add:'+2.00' },
      pd: 63, verificationStatus: 'verified', prescriberName: 'Dr. Chen',
      issueDate: '2026-03-01', expirationDate: '2028-03-01' };
  },
  /** 度数档位（0 ≤±2 · 1 ±2–±4.5 · 2 ±4.5–±6 · 3 >±6）。
   *  取双眼 SPH、CYL 绝对值的较大者 —— 散光同样影响镜片厚度。没有可读的度数时返回 null —— 宁可不推荐，也不猜。 */
  bandFromRx(...vals: (string | null | undefined)[]): number | null {
    const mags = vals.map(v => Math.abs(parseFloat(String(v ?? '')))).filter(n => Number.isFinite(n));
    if (!mags.length) return null;
    const m = Math.max(...mags);
    return m < 2 ? 0 : m <= 4.5 ? 1 : m < 6 ? 2 : 3;
  },
  /** 从一份处方推出度数档位；缺度数则为 null。 */
  strengthBand(p: Prescription): number | null {
    return this.bandFromRx(p.od?.sph, p.os?.sph, p.od?.cyl, p.os?.cyl);
  },
  /** Customer-facing validity from stored expiration date. */
  validity(p: Prescription): import('@/models').RxValidity {
    if (!p.expirationDate) return 'unknown';
    const exp = new Date(p.expirationDate).getTime();
    const now = Date.now();
    if (exp < now) return 'expired';
    if (exp - now < 60 * 86400e3) return 'expiringSoon';
    return 'valid';
  },
  validate(p: Prescription): string[] {
    const bad: string[] = [];
    for (const eye of ['od','os'] as const) {
      const e = p[eye]; if (!e) continue;
      if (e.cyl && !e.axis) bad.push(`${eye}.axis`);   // CYL requires AXIS
      if (!e.cyl && e.axis) bad.push(`${eye}.cyl`);
    }
    return bad;
  },
};
