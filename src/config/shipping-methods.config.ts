import type { Locale } from '@/models';
export interface ShippingMethod {
  id: string; name: Record<Locale,string>; etaDays: [number, number];
  price: number; freeOver: number | null;
}
/** Business rules live here, never in pages. */
export const SHIPPING_METHODS: ShippingMethod[] = [
  { id:'standard', etaDays:[5,8], price:6,  freeOver:50,
    name:{'en-US':'Standard','zh-CN':'标准配送','es-US':'Estándar'} },
  { id:'express',  etaDays:[2,3], price:15, freeOver:null,
    name:{'en-US':'Express','zh-CN':'加急配送','es-US':'Exprés'} },
];
