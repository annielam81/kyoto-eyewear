import { request } from './client';
import { SHIPPING_METHODS } from '@/config/shipping-methods.config';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS } from '@/config/treatments.config';
export const ConfigApi = {
  shippingMethods: () => request('/config/shipping', () => SHIPPING_METHODS),
  lensCatalog: () => request('/config/lens', () => ({ materials: LENS_MATERIALS, treatments: TREATMENTS })),
};
