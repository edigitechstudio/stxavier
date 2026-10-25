import { LEAD_SOURCES, LEAD_STATUSES, type LeadFilter, type LeadSourceKey, type LeadStatus } from '@/types/portal';

type Params = Record<string, string | string[] | undefined> | URLSearchParams;
const get = (p: Params, k: string) => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};
const isoDay = (v: string | undefined, end = false) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${end ? '23:59:59' : '00:00:00'}+05:45`).toISOString() : undefined);

/** Lead list filters from the URL. Shared by the leads page and the CSV export. */
export function parseLeadFilter(p: Params): LeadFilter & { fromDay?: string; toDay?: string } {
  const status = get(p, 'status');
  const source = get(p, 'source');
  const fromDay = get(p, 'from');
  const toDay = get(p, 'to');
  return {
    status: LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
    source: LEAD_SOURCES.includes(source as LeadSourceKey) ? (source as LeadSourceKey) : undefined,
    q: get(p, 'q')?.slice(0, 80),
    from: isoDay(fromDay),
    to: isoDay(toDay, true),
    fromDay,
    toDay,
  };
}

/** RFC 4180 CSV with formula-injection protection (cells starting with = + - @ are prefixed). */
export function toCsv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
