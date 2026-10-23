import { describe, expect, it } from 'vitest';
import { checkUpload, safeFileName, sniffMime } from '@/lib/portal/files';

const enc = (s: string) => new TextEncoder().encode(s);
const bytes = (...n: number[]) => new Uint8Array(n);
const MB = 1024 * 1024;

describe('document upload checks', () => {
  it('detects real types from magic bytes', () => {
    expect(sniffMime(enc('%PDF-1.7\n...'))).toBe('application/pdf');
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0, 0))).toBe('image/jpeg');
    expect(sniffMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe('image/png');
    expect(sniffMime(enc('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(sniffMime(enc('MZ\x90\0'))).toBeNull(); // Windows executable
    expect(sniffMime(enc('<html><script>'))).toBeNull();
  });

  it('accepts a clean PDF and renames it safely', () => {
    const r = checkUpload(enc('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'), 'application/pdf', '../My Passport (1).PDF', 10 * MB);
    expect(r).toEqual({ ok: true, mime: 'application/pdf', ext: 'pdf', name: 'My-Passport-1.pdf' });
  });

  it('rejects disguised, oversized, empty and active-content files', () => {
    expect(checkUpload(enc('MZ\x90\0this is an exe'), 'application/pdf', 'cv.pdf', 10 * MB)).toEqual({ ok: false, reason: 'type' });
    expect(checkUpload(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/png', 'photo.png', 10 * MB)).toEqual({ ok: false, reason: 'mismatch' });
    expect(checkUpload(new Uint8Array(11 * MB).fill(0x25), 'application/pdf', 'big.pdf', 10 * MB)).toEqual({ ok: false, reason: 'too_large' });
    expect(checkUpload(new Uint8Array(0), 'application/pdf', 'x.pdf', 10 * MB)).toEqual({ ok: false, reason: 'empty' });
    expect(checkUpload(enc('%PDF-1.4\n<</OpenAction<</S/JavaScript/JS(app.alert(1))>>>>'), 'application/pdf', 'x.pdf', 10 * MB)).toEqual({ ok: false, reason: 'active_content' });
  });

  it('accepts a correct type when the browser sends no type', () => {
    expect(checkUpload(bytes(0xff, 0xd8, 0xff, 0xdb), '', 'scan.jpeg', 10 * MB)).toMatchObject({ ok: true, mime: 'image/jpeg', name: 'scan.jpg' });
  });

  it('keeps unicode-only names usable', () => {
    expect(safeFileName('राहदानी.pdf', 'pdf')).toBe('document.pdf');
    expect(safeFileName('a'.repeat(200) + '.pdf', 'pdf')).toHaveLength(84);
  });
});
