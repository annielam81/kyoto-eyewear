import type { Address } from '@/models';
/** PRODUCTION-INTEGRATION-REQUIRED: swap rule-based checks for a real
 *  address-validation provider (USPS/SmartyStreets/etc). Interface stays. */
export type AddressField = keyof Address;
export const AddressValidationService = {
  validate(a: Partial<Address>): Partial<Record<AddressField, string>> {
    const e: Partial<Record<AddressField, string>> = {};
    if (!a.firstName?.trim()) e.firstName = 'required';
    if (!a.lastName?.trim())  e.lastName  = 'required';
    if (!a.line1?.trim())     e.line1     = 'required';
    if (!a.city?.trim())      e.city      = 'required';
    if (!a.stateCode)         e.stateCode = 'state';
    if (!a.zip?.trim())       e.zip = 'required';
    else if (!/^\d{5}(-\d{4})?$/.test(a.zip.trim())) e.zip = 'zip';
    if (!a.phone?.trim())     e.phone = 'required';
    else if ((a.phone.match(/\d/g) ?? []).length < 10) e.phone = 'phone';
    if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) e.email = 'email';
    return e;
  },
  isValid(a: Partial<Address>): boolean { return Object.keys(this.validate(a)).length === 0; },
};
