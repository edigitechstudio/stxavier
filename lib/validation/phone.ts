/**
 * Nepali phone numbers: mobiles (96/97/98 + 8 digits) and landlines (area code + 6–7 digits).
 * Landlines need their trunk "0" (01-5333081) unless written internationally (+977 1 5333081).
 * Spaces, dashes and brackets are ignored.
 */
export function normalizeNepaliPhone(input: string): string {
  return input.replace(/[\s()-]/g, '');
}

export function isValidNepaliPhone(input: string): boolean {
  const n = normalizeNepaliPhone(input);
  const international = /^\+?977/.test(n);
  const local = n.replace(/^\+?977/, '');
  if (/^9[678]\d{8}$/.test(local)) return true;
  return international ? /^0?[1-9]\d?\d{6,7}$/.test(local) : /^0[1-9]\d?\d{6,7}$/.test(local);
}
