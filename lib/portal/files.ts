/**
 * Upload safety for student documents. The browser-declared type is never trusted: the real type
 * is read from the file's magic bytes, PDFs with active content are refused, file names are
 * sanitised, and stored objects are named by id (the original name is only metadata).
 * Files are always served back as downloads (`Content-Disposition: attachment`, `nosniff`).
 */
export const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
export type AllowedMime = keyof typeof ALLOWED_TYPES;

export type FileCheck = { ok: true; mime: AllowedMime; ext: string; name: string } | { ok: false; reason: 'empty' | 'too_large' | 'type' | 'mismatch' | 'active_content' };

const starts = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);

/** Real content type from the first bytes, or null if it isn't one we accept. */
export function sniffMime(b: Uint8Array): AllowedMime | null {
  if (starts(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  if (starts(b, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'; // RIFF....WEBP
  return null;
}

/** PDF features that can run code or carry payloads. Never needed for an admission document. */
const PDF_ACTIVE = /\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA|OpenAction|AA)\b/;

export function hasActivePdfContent(b: Uint8Array) {
  // latin1 keeps a 1:1 byte→char mapping, so binary streams don't break the scan.
  return PDF_ACTIVE.test(new TextDecoder('latin1').decode(b));
}

/** "../My Passport (1).PDF" → "My-Passport-1.pdf" */
export function safeFileName(name: string, ext: string) {
  const base = name
    .replace(/\.[^.]*$/, '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 80);
  return `${base || 'document'}.${ext}`;
}

export function checkUpload(bytes: Uint8Array, declaredType: string, name: string, maxBytes: number): FileCheck {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty' };
  if (bytes.byteLength > maxBytes) return { ok: false, reason: 'too_large' };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, reason: 'type' };
  // Browsers sometimes send "" or a generic type; a *different* allowed type is a red flag.
  if (declaredType && declaredType in ALLOWED_TYPES && declaredType !== mime) return { ok: false, reason: 'mismatch' };
  if (mime === 'application/pdf' && hasActivePdfContent(bytes)) return { ok: false, reason: 'active_content' };
  const ext = ALLOWED_TYPES[mime];
  return { ok: true, mime, ext, name: safeFileName(name, ext) };
}
