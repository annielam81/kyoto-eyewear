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
      od: { sph:'-3.25', cyl:'-0.50', axis:'180', add:'' }, os: { sph:'-3.00', cyl:'', axis:'', add:'' },
      pd: 63, verificationStatus: 'verified', prescriberName: 'Dr. Chen',
      issueDate: '2026-03-01', expirationDate: '2028-03-01' };
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
