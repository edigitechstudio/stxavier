import { describe, expect, it } from 'vitest';
import { isValidNepaliPhone, normalizeNepaliPhone } from '@/lib/validation/phone';

describe('Nepali phone validation', () => {
  it.each(['9845762340', '+977 984-5762340', '977-9812345678', '9612345678', '01-5333081', '015333081', '061-123456', '+977 1 5333081'])(
    'accepts %s',
    (n) => expect(isValidNepaliPhone(n)).toBe(true),
  );
  it.each(['12345', '98457623', '9545762340', 'abcdefghij', '+1 415 555 0100', '15333081'])('rejects %s', (n) =>
    expect(isValidNepaliPhone(n)).toBe(false),
  );
  it('normalizes separators', () => expect(normalizeNepaliPhone('+977 984-576 2340')).toBe('+9779845762340'));
});
