'use client';
import { useRef, useState } from 'react';
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Option = { value: string; label: string };

/** Drag-and-drop or pick a file; posts to /api/portal/documents, then refreshes the page. */
export function UploadForm({ applications, types, maxMb, preset }: { applications: Option[]; types: Option[]; maxMb: number; preset?: string }) {
  const t = useTranslations('portal.docs');
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pick = (f: File | undefined | null) => {
    setDone(false);
    setError(null);
    if (!f) return;
    if (f.size > maxMb * 1024 * 1024) {
      setError(t('errors.too_large', { mb: maxMb }));
      return;
    }
    setFile(f);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError(t('errors.choose'));
    const data = new FormData(e.currentTarget);
    data.set('file', file);
    setBusy(true);
    setError(null);
    const res = await fetch('/api/portal/documents', { method: 'POST', body: data }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setFile(null);
      setDone(true);
      if (input.current) input.current.value = '';
      router.refresh();
      return;
    }
    const code = ((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? 'generic';
    const known = ['empty', 'too_large', 'type', 'mismatch', 'active_content', 'not_found', 'choose', 'rate_limited'];
    setError(t(`errors.${(known.includes(code) ? code : 'generic') as 'generic'}`, { mb: maxMb }));
  }

  return (
    <form className="lead-form upload-form" onSubmit={submit} noValidate>
      <div className="form-row">
        {applications.length > 1 ? (
          <label>
            {t('application')}
            <select name="application_id" defaultValue={applications[0]?.value}>
              {applications.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </label>
        ) : (
          <input type="hidden" name="application_id" value={applications[0]?.value ?? ''} />
        )}
        <label>
          {t('type')}
          <select name="doc_type" defaultValue={preset ?? types[0]?.value} key={preset}>
            {types.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <label
        className={`dropzone ${drag ? 'is-drag' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      >
        <UploadCloud size={30} aria-hidden />
        <strong>{file ? file.name : t('file')}</strong>
        <small>{t('limits', { mb: maxMb })}</small>
        <input ref={input} type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}
      {done && <p className="upload-done" role="status"><CheckCircle2 size={18} aria-hidden /> {t('success')}</p>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !file}>
        {busy ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {t('uploading')}</> : <><UploadCloud size={18} aria-hidden /> {t('upload')}</>}
      </button>
    </form>
  );
}
