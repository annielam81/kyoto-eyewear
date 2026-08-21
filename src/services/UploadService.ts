export interface UploadResult { fileReference: string; name: string; ext: string; size: string; previewable: boolean; mock: true }
export const ACCEPTED_TYPES = ['pdf','jpg','jpeg','png','heic'];
const PREVIEWABLE = ['jpg','jpeg','png'];   // HEIC/PDF: placeholder in H5, conversion handled by future backend
/** Mock upload; NOT production medical storage. */
export const UploadService = {
  async upload(_source: 'camera' | 'library' | 'file', mockExt = 'jpg'): Promise<UploadResult> {
    await new Promise(r => setTimeout(r, 700));
    const ext = ACCEPTED_TYPES.includes(mockExt) ? mockExt : 'jpg';
    return { fileReference: `mock://prescription_dr_chen.${ext}`, name: `prescription_dr_chen.${ext}`,
      ext, size: '2.1 MB', previewable: PREVIEWABLE.includes(ext), mock: true };
  },
};
