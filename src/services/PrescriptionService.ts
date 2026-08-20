import type { Prescription } from '@/models';
import { uid } from '@/utils/storage';
export const PrescriptionService = {
  blank(source: Prescription['source']): Prescription {
    return { prescriptionId: uid(), userId: null, source, od: null, os: null,
      pdMode: 'single', pd: 63, pdOd: null, pdOs: null,
      fileReference: null, uploadStatus: 'none', verificationStatus: 'n/a',
      uploadedAt: null, expirationDate: null, label: '' };
  },
  savedMock(): Prescription {
    return { ...this.blank('saved'), label: 'Dr. Chen · Mar 2026',
      od: { sph:'-3.25', cyl:'-0.50', axis:'180', add:'' }, os: { sph:'-3.00', cyl:'', axis:'', add:'' },
      pd: 63, verificationStatus: 'verified', expirationDate: '2028-03-01' };
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
