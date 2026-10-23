import 'server-only';
import { requireViewer } from '@/lib/auth/viewer';
import { getCounsellors, getDestinations, getPageContent } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { APP_STAGES, stageIndex, type Application, type PortalContent, type StudentDocument } from '@/types/portal';
import { getMyApplications, getMyDocuments, getMyNotifications } from './student';

export type DocSlot = {
  key: string;
  label: string;
  hint: string | null;
  required: boolean;
  latest: StudentDocument | null;
};

/** Per application: one checklist slot per document type, showing the most recent upload. */
export function checklist(app: Application, docs: StudentDocument[], content: PortalContent, locale: string): DocSlot[] {
  return content.document_types.map((t) => ({
    key: t.key,
    label: l(t.label, locale) ?? t.key,
    hint: l(t.hint, locale) ?? null,
    required: t.required,
    latest: docs.filter((d) => d.application_id === app.id && d.doc_type === t.key).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
  }));
}

/** Required documents that still need the student: never uploaded, or sent back for re-upload. */
export const needsStudent = (slots: DocSlot[]) => slots.filter((s) => s.required && (!s.latest || s.latest.status === 'reupload_needed'));

export const isPreDepartureUnlocked = (apps: Application[]) => apps.some((a) => stageIndex(a.stage) >= stageIndex('visa_granted'));

/** Everything a portal page needs for the signed-in student. Call inside <Suspense>. */
export async function loadPortal(locale: string, path: string) {
  const viewer = await requireViewer(locale, `/${locale}${path}`);
  const [apps, docs, notifications, content, counsellors, destinations] = await Promise.all([
    getMyApplications(viewer),
    getMyDocuments(viewer),
    getMyNotifications(viewer),
    getPageContent('portal'),
    getCounsellors(),
    getDestinations(),
  ]);
  const flagOf = (slug: string) => destinations.find((d) => d.slug === slug)?.iso2 ?? slug;
  const countryName = (slug: string) => l(destinations.find((d) => d.slug === slug)?.name, locale) ?? slug;
  const counsellorName = (slug: string | null) => (slug ? (counsellors.find((c) => c.slug === slug)?.name ?? slug) : null);
  const docLabel = (key: string) => l(content.document_types.find((t) => t.key === key)?.label, locale) ?? key;
  const slots = new Map(apps.map((a) => [a.id, checklist(a, docs, content, locale)]));
  return {
    viewer,
    apps,
    docs,
    notifications,
    content,
    slots,
    unread: notifications.filter((n) => !n.read_at).length,
    countryName,
    flagOf,
    counsellorName,
    docLabel,
    stages: APP_STAGES,
    /** Request time, for "overdue" and relative dates. */
    now: Date.now(),
  };
}
