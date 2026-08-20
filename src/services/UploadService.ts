export interface UploadResult { fileReference: string; size: string; mock: true }
export const ACCEPTED_TYPES = ['pdf','jpg','jpeg','png','heic'];
/** Mock upload; NOT production medical storage. */
export const UploadService = {
  async upload(_source: 'camera' | 'library' | 'file'): Promise<UploadResult> {
    await new Promise(r => setTimeout(r, 700));
    return { fileReference: 'mock://prescription_dr_chen.jpg', size: '2.1 MB', mock: true };
  },
};
