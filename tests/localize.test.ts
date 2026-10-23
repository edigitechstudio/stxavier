import { describe, expect, it } from 'vitest';
import { l } from '@/lib/i18n/localize';

describe('l() — localized field resolver', () => {
  const v = { en: 'Study in UK', ne: 'बेलायतमा अध्ययन' };

  it('returns the requested locale', () => {
    expect(l(v, 'ne')).toBe('बेलायतमा अध्ययन');
    expect(l(v, 'en')).toBe('Study in UK');
  });

  it('falls back to English when Nepali is missing or empty', () => {
    expect(l({ en: 'IELTS' }, 'ne')).toBe('IELTS');
    expect(l({ en: 'IELTS', ne: '' }, 'ne')).toBe('IELTS');
    expect(l({ en: 'IELTS', ne: null }, 'ne')).toBe('IELTS');
  });

  it('handles missing values', () => {
    expect(l(null, 'en')).toBeUndefined();
    expect(l(undefined, 'ne')).toBeUndefined();
  });
});
