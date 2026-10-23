'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Link2, Printer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

/** Formatting helpers. NPR uses Indian-style grouping (12,34,567), which Nepali readers expect. */
export function useFormatters() {
  const locale = useLocale();
  const nf = (opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale === 'ne' ? 'ne-NP' : 'en-IN', opts);
  return {
    npr: (n: number) => `${locale === 'ne' ? 'रु.' : 'NPR'} ${nf({ maximumFractionDigits: 0 }).format(Math.round(n))}`,
    money: (n: number, currency: string) =>
      new Intl.NumberFormat(locale === 'ne' ? 'ne-NP' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n),
    num: (n: number, dp = 0) => nf({ minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n),
    date: (iso: string, style: 'long' | 'medium' = 'long') =>
      new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', { dateStyle: style, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)),
  };
}

/** Print only the tool's `.print-area` (the browser's dialog lets visitors "Save as PDF"). */
export function printToolSummary() {
  document.body.classList.add('printing');
  const done = () => {
    document.body.classList.remove('printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}

/** Keeps tool state in the URL query so results can be shared and bookmarked. */
export function writeQuery(params: Record<string, string | number | undefined>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  }
  window.history.replaceState(null, '', url);
}

export function readQuery(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
}

/**
 * Two-way URL sync for shareable tool state: restores from the query string once after mount,
 * and only then starts writing changes back. (Writing before the restore would overwrite a
 * shared link with defaults — e.g. under React's development double-invoked effects.)
 */
export function useQuerySync(apply: (q: URLSearchParams) => void, values: Record<string, string | number | undefined>) {
  const ready = useRef(false);
  const applyRef = useRef(apply);

  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    const q = readQuery();
    const id = window.setTimeout(() => {
      applyRef.current(q);
      ready.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const key = JSON.stringify(values);
  useEffect(() => {
    if (ready.current) writeQuery(JSON.parse(key) as Record<string, string | number | undefined>);
  }, [key]);
}

export function ToolActions({ share = true, pdf = true, children }: { share?: boolean; pdf?: boolean; children?: ReactNode }) {
  const t = useTranslations('tools');
  const [copied, setCopied] = useState(false);
  return (
    <div className="tool-actions no-print">
      {pdf && (
        <button type="button" className="btn btn-dark btn-sm" onClick={printToolSummary}>
          <Printer size={16} aria-hidden /> {t('savePdf')}
        </button>
      )}
      {share && (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard unavailable */
            }
          }}
        >
          {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />} {copied ? t('copied') : t('share')}
        </button>
      )}
      {children}
      <span className="sr-only" role="status">{copied ? t('copied') : ''}</span>
    </div>
  );
}

/** Branded header that only appears on the printed / PDF version. */
export function PrintHeader({ title }: { title: string }) {
  const t = useTranslations('tools');
  return (
    <div className="print-only" style={{ marginBottom: 16 }}>
      <strong style={{ fontSize: 18 }}>St. Xavier Educational Network</strong>
      <div style={{ fontSize: 16, marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 11, marginTop: 4 }}>{t('generatedBy')}</div>
    </div>
  );
}

/** Segmented single-choice control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
