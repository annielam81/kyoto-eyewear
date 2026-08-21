import { request } from './client';
import { ProfileService, type Profile } from '@/services/ProfileService';
/** Auth provider connection is Phase 4B. Mock profile only; no passwords in frontend models. */
export const UsersApi = {
  profile: () => request('/me', () => ProfileService.get()),
  updateProfile: (p: Profile) => request('/me', () => ProfileService.update(p)),
};
