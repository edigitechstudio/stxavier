import { describe, expect, it } from 'vitest';
import { parseLeadFilter, toCsv } from '@/lib/admin/filters';
import { safeNext } from '@/lib/auth/safe-next';

describe('post-login redirects', () => {
  it('allows same-site paths only', () => {
    expect(safeNext('/en/portal/documents', '/en/portal')).toBe('/en/portal/documents');
    expect(safeNext('//evil.example', '/en/portal')).toBe('/en/portal');
    expect(safeNext('https://evil.example', '/en/portal')).toBe('/en/portal');
    expect(safeNext('/\\evil.example', '/en/portal')).toBe('/en/portal');
    expect(safeNext(null, '/admin')).toBe('/admin');
  });
});

describe('lead filters', () => {
  it('accepts known values and converts days to Nepal-time bounds', () => {
    const f = parseLeadFilter(new URLSearchParams('status=new&source=booking&q= ram &from=2026-10-01&to=2026-10-31'));
    expect(f).toMatchObject({ status: 'new', source: 'booking', q: 'ram' });
    expect(f.from).toBe('2026-09-30T18:15:00.000Z'); // 00:00 NPT
    expect(f.to).toBe('2026-10-31T18:14:59.000Z'); // 23:59:59 NPT
  });
  it('drops unknown values', () => {
    expect(parseLeadFilter({ status: 'hacked', source: "x'; drop", from: 'yesterday' })).toMatchObject({ status: undefined, source: undefined, from: undefined });
  });
});

describe('CSV export', () => {
  it('quotes and neutralises spreadsheet formulas', () => {
    const csv = toCsv([
      ['Name', 'Note'],
      ['=HYPERLINK("http://x")', 'a, "b"\nc'],
      ['+977-1-5333081', null],
    ]);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines[0]).toBe('Name,Note');
    expect(lines[1]).toBe(`"'=HYPERLINK(""http://x"")","a, ""b""\nc"`);
    expect(lines[2]).toBe("'+977-1-5333081,");
  });
});
