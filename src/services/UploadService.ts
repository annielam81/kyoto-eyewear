export interface UploadResult { fileReference: string; name: string; ext: string; size: string; previewable: boolean; mock: true }
export const ACCEPTED_TYPES = ['pdf','jpg','jpeg','png','heic'];
const PREVIEWABLE = ['jpg','jpeg','png'];   // HEIC/PDF: placeholder in H5, conversion handled by future backend
/** Mock upload; NOT production medical storage. */
export const UploadService = {
  async upload(source: 'camera' | 'library' | 'file', mockExt = 'jpg'): Promise<UploadResult> {
    let name = `prescription_dr_chen.${ACCEPTED_TYPES.includes(mockExt) ? mockExt : 'jpg'}`;
    // #ifdef APP-PLUS
    // Native: real picker (camera / album). Upload itself stays mock — no backend.
    try {
      const res: any = await new Promise((resolve, reject) => uni.chooseImage({
        count: 1, sourceType: source === 'camera' ? ['camera'] : ['album'],
        success: resolve, fail: reject,
      }));
      const p = String(res?.tempFilePaths?.[0] ?? '');
      name = p.split('/').pop() || name;
    } catch { throw new Error('cancelled'); }   // user cancelled picker → caller keeps prior state
    // #endif
    await new Promise(r => setTimeout(r, 500));
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ACCEPTED_TYPES.includes(ext) ? ext : 'jpg';
    return { fileReference: `mock://${name}`, name, ext: safeExt, size: '2.1 MB',
      previewable: PREVIEWABLE.includes(safeExt), mock: true };
  },
};
