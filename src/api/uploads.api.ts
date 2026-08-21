import { request } from './client';
import { UploadService, type UploadResult } from '@/services/UploadService';
import type { PrescriptionDocument } from '@/models/domain';
import { uid } from '@/utils/storage';
export const UploadsApi = {
  async uploadPrescriptionDoc(source: 'camera' | 'library' | 'file', mockExt = 'jpg'): Promise<{ result: UploadResult; doc: PrescriptionDocument }> {
    return request('/uploads', async () => {
      const result = await UploadService.upload(source, mockExt);
      const doc: PrescriptionDocument = {
        id: uid(), ownerUserId: null,
        fileType: result.ext as PrescriptionDocument['fileType'],
        originalFilename: result.name, storageRef: result.fileReference,
        uploadStatus: 'done', createdAt: new Date().toISOString(),
      };
      return { result, doc };
    });
  },
};
