import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { PortalShell, PortalSkeleton } from '@/components/portal/portal-shell';
import { StatusChip } from '@/components/portal/status-chip';
import { UploadForm } from '@/components/portal/upload-form';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { loadPortal } from '@/lib/portal/view';
import type { DocStatus } from '@/types/portal';
import { removeDocument } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('portalDocs') };
}

export default async function DocumentsPage({ searchParams }: PageProps<'/[locale]/portal/documents'>) {
  const locale = await currentLocale();
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <Documents locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

const sizeLabel = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

async function Documents({ locale, searchParams }: { locale: string; searchParams: PageProps<'/[locale]/portal/documents'>['searchParams'] }) {
  const [p, sp, t, format] = await Promise.all([loadPortal(locale, '/portal/documents'), searchParams, getTranslations('portal.docs'), getFormatter()]);
  const preset = typeof sp.type === 'string' ? sp.type : undefined;
  const statusLabel = (s: DocStatus) => t(`status.${s}`);
  const types = p.content.document_types.map((d) => ({ value: d.key, label: l(d.label, locale) ?? d.key }));
  const apps = p.apps.map((a) => ({ value: a.id, label: [a.university, p.countryName(a.country)].filter(Boolean).join(' — ') }));

  return (
    <PortalShell active="documents" viewer={p.viewer} unread={p.unread} locale={locale}>
      <header className="portal-head">
        <h1>{t('title')}</h1>
        <p className="muted">{t('intro')}</p>
      </header>

      {p.apps.length > 0 && (
        <section className="portal-card" id="upload">
          <h2 className="portal-card-title"><Upload size={20} aria-hidden /> {t('upload')}</h2>
          <UploadForm applications={apps} types={types} maxMb={p.content.max_upload_mb} preset={preset} />
        </section>
      )}

      {p.apps.map((a) => (
        <section key={a.id} className="portal-card" aria-labelledby={`cl-${a.id}`}>
          <h2 id={`cl-${a.id}`} className="portal-card-title">{t('checklist')}{p.apps.length > 1 && <small className="muted"> · {a.university ?? p.countryName(a.country)}</small>}</h2>
          <ul className="doc-checklist">
            {p.slots.get(a.id)!.map((s) => (
              <li key={s.key} className={s.latest ? `is-${s.latest.status}` : 'is-missing'}>
                <div>
                  <strong>{s.label}</strong> <small className="muted">{s.required ? t('required') : t('optional')}</small>
                  {s.hint && <p className="muted doc-hint">{s.hint}</p>}
                  {s.latest?.status === 'reupload_needed' && s.latest.counsellor_comment && (
                    <p className="doc-comment"><strong>{t('comment')}:</strong> {s.latest.counsellor_comment}</p>
                  )}
                </div>
                {s.latest ? (
                  <StatusChip status={s.latest.status} label={statusLabel(s.latest.status)} />
                ) : (
                  <a href={`?type=${s.key}#upload`} className="doc-chip is-missing">{t('missing')}</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="portal-card">
        <h2 className="portal-card-title">{t('all')}</h2>
        {p.docs.length === 0 ? (
          <p className="muted">{t('noDocs')}</p>
        ) : (
          <ul className="doc-list">
            {p.docs.map((d) => (
              <li key={d.id}>
                <div className="doc-main">
                  <strong>{p.docLabel(d.doc_type)}</strong>
                  <small className="muted">{d.file_name} · {sizeLabel(d.size_bytes)} · {format.dateTime(new Date(d.created_at), { dateStyle: 'medium' })}</small>
                  {d.counsellor_comment && <p className="doc-comment"><strong>{t('comment')}:</strong> {d.counsellor_comment}</p>}
                </div>
                <StatusChip status={d.status} label={statusLabel(d.status)} />
                <div className="doc-actions">
                  <a href={`/api/portal/documents/${d.id}`} className="icon-btn" aria-label={`${t('download')} ${d.file_name}`} title={t('download')}><Download size={18} /></a>
                  {d.status !== 'verified' && (
                    <form action={removeDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="icon-btn" aria-label={`${t('delete')} ${d.file_name}`} title={t('delete')}><Trash2 size={18} /></button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalShell>
  );
}
