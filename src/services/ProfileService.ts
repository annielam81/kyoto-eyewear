import { load, save } from '@/utils/storage';
export interface Profile { firstName: string; lastName: string; email: string; phone: string }
const KEY = 'kyoto.profile';
/** Mock. PRODUCTION-INTEGRATION-REQUIRED: real account API + email/phone verification. */
export const ProfileService = {
  get(): Profile { return load<Profile>(KEY, { firstName:'Anni', lastName:'', email:'', phone:'' }); },
  update(p: Profile): Profile { save(KEY, p); return p; },
};
