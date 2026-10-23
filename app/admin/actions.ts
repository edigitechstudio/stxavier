'use server';
import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getViewer, isStaff } from '@/lib/auth/viewer';
import { CONTENT_TAGS, getPageContent, type ContentTable } from '@/lib/content';
import { env } from '@/lib/env';
import { l } from '@/lib/i18n/localize';
import {
  addException,
  addLeadNote,
  createApplication,
  notify,
  removeException,
  reviewDocument,
  saveWeeklyHours,
  setBookingStatus,
  setLeadStatus,
  setRole,
  setStage,
  studentLocale,
  updateApplication,
} from '@/lib/portal/admin';
import { BOOKING_MODES } from '@/types/booking';
import { APP_STAGES, DOC_STATUSES, LEAD_STATUSES } from '@/types/portal';

/**
 * Admin server actions. Each one re-verifies the signed-in user's role before touching data —
 * server actions are public endpoints, so page-level protection is not enough.
 */
async function staff() {
  const v = await getViewer();
  if (!isStaff(v)) throw new Error('Forbidden');
  return v;
}
async function admin() {
  const v = await staff();
  if (v.role !== 'admin') throw new Error('Admins only');
  return v;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const opt = (f: FormData, k: string) => str(f, k) || null;
const id = z.string().min(1).max(100);

// ---- Leads ------------------------------------------------------------------------
export async function updateLeadStatus(f: FormData) {
  await staff();
  await setLeadStatus(id.parse(str(f, 'id')), z.enum(LEAD_STATUSES).parse(str(f, 'status')));
  refresh();
}

export async function addNote(f: FormData) {
  const v = await staff();
  const body = z.string().min(1).max(4000).parse(str(f, 'body'));
  await addLeadNote(v, id.parse(str(f, 'id')), body);
  refresh();
}

// ---- Bookings ---------------------------------------------------------------------
export async function updateBookingStatus(f: FormData) {
  await staff();
  await setBookingStatus(id.parse(str(f, 'id')), z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).parse(str(f, 'status')));
  refresh();
}

// ---- Availability -------------------------------------------------------------------
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export async function saveHours(f: FormData) {
  await staff();
  const counsellor = z.string().regex(/^[a-z0-9-]+$/).parse(str(f, 'counsellor'));
  const rules = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => f.get(`on-${d}`) === 'on')
    .map((weekday) => {
      const start = time.parse(str(f, `start-${weekday}`));
      const end = time.parse(str(f, `end-${weekday}`));
      if (end <= start) throw new Error('End time must be after start time');
      return {
        weekday,
        start,
        end,
        slot_minutes: z.coerce.number().int().min(10).max(240).parse(str(f, 'slot')),
        modes: z.array(z.enum(BOOKING_MODES)).min(1).parse(f.getAll('modes')),
      };
    });
  await saveWeeklyHours(counsellor, rules);
  updateTag(CONTENT_TAGS.counsellor_availability);
  refresh();
}

export async function addClosure(f: FormData) {
  await staff();
  const allDay = f.get('all_day') === 'on';
  const start = allDay ? null : time.parse(str(f, 'start'));
  const end = allDay ? null : time.parse(str(f, 'end'));
  if (start && end && end <= start) throw new Error('End time must be after start time');
  const reason = opt(f, 'reason');
  await addException({
    counsellor: opt(f, 'counsellor'),
    date: z.iso.date().parse(str(f, 'date')),
    start,
    end,
    reason: reason ? { en: reason } : null,
  });
  updateTag(CONTENT_TAGS.availability_exceptions);
  refresh();
}

export async function deleteClosure(f: FormData) {
  await staff();
  await removeException(id.parse(str(f, 'id')));
  updateTag(CONTENT_TAGS.availability_exceptions);
  refresh();
}

// ---- Applications ---------------------------------------------------------------------
export async function newApplication(f: FormData) {
  const v = await staff();
  const input = z
    .object({
      email: z.email(),
      name: z.string().max(120),
      country: z.string().regex(/^[a-z0-9-]+$/),
      university: z.string().max(200).nullable(),
      course: z.string().max(200).nullable(),
      intake: z.string().max(60).nullable(),
      counsellor: z.string().regex(/^[a-z0-9-]+$/).nullable(),
    })
    .parse({ email: str(f, 'email'), name: str(f, 'name'), country: str(f, 'country'), university: opt(f, 'university'), course: opt(f, 'course'), intake: opt(f, 'intake'), counsellor: opt(f, 'counsellor') });
  const { id: appId, invited } = await createApplication(v, input, `${env.siteUrl}/api/auth/callback?next=/en/portal`);
  redirect(`/admin/applications/${appId}${invited ? '?invited=1' : ''}`);
}

export async function editApplication(f: FormData) {
  await staff();
  await updateApplication(id.parse(str(f, 'id')), { university: opt(f, 'university'), course: opt(f, 'course'), intake: opt(f, 'intake'), counsellor: opt(f, 'counsellor') });
  refresh();
}

/** Stage change → history row + a notification in the student's language. */
export async function changeStage(f: FormData) {
  const v = await staff();
  const stage = z.enum(APP_STAGES).parse(str(f, 'stage'));
  const res = await setStage(v, id.parse(str(f, 'id')), stage, opt(f, 'note'));
  if (res) {
    const locale = await studentLocale(res.studentId);
    const t = await getTranslations({ locale, namespace: 'portal' });
    await notify({ user_id: res.studentId, kind: 'stage', title: t('notices.stageTitle', { stage: t(`stages.${stage}`) }), body: opt(f, 'note'), link: '/portal' });
  }
  refresh();
}

export async function reviewDoc(f: FormData) {
  const v = await staff();
  const status = z.enum(DOC_STATUSES).parse(str(f, 'status'));
  const comment = opt(f, 'comment');
  if (status === 'reupload_needed' && !comment) throw new Error('Please tell the student what to fix.');
  const doc = await reviewDocument(v, id.parse(str(f, 'id')), status, comment);
  if (doc && status !== 'pending') {
    const [locale, content] = await Promise.all([studentLocale(doc.student_id), getPageContent('portal')]);
    const t = await getTranslations({ locale, namespace: 'portal' });
    const label = l(content.document_types.find((d) => d.key === doc.doc_type)?.label, locale) ?? doc.doc_type;
    await notify({
      user_id: doc.student_id,
      kind: 'document',
      title: t(status === 'verified' ? 'notices.docVerified' : 'notices.docReupload', { doc: label }),
      body: comment,
      link: status === 'verified' ? '/portal/documents' : `/portal/documents?type=${doc.doc_type}`,
    });
  }
  refresh();
}

export async function sendNotice(f: FormData) {
  await staff();
  const due = opt(f, 'due');
  await notify({
    user_id: id.parse(str(f, 'student')),
    kind: z.enum(['deadline', 'message']).parse(str(f, 'kind')),
    title: z.string().min(2).max(200).parse(str(f, 'title')),
    body: opt(f, 'body'),
    due_at: due ? new Date(`${z.iso.date().parse(due)}T23:59:00+05:45`).toISOString() : null,
    link: '/portal',
  });
  refresh();
}

// ---- Admin only ---------------------------------------------------------------------------
export async function changeRole(f: FormData) {
  const v = await admin();
  const target = id.parse(str(f, 'id'));
  if (target === v.id) throw new Error('You cannot change your own role.');
  await setRole(target, z.enum(['student', 'counsellor', 'admin']).parse(str(f, 'role')));
  refresh();
}

/** Push edits made in Supabase live immediately (otherwise caches refresh on their own schedule). */
export async function refreshContent(f: FormData) {
  await admin();
  const table = str(f, 'table');
  if (table === 'all') Object.values(CONTENT_TAGS).forEach((t) => updateTag(t));
  else if (table in CONTENT_TAGS) updateTag(CONTENT_TAGS[table as ContentTable]);
  else if (['blog', 'google-reviews', 'rates'].includes(table)) updateTag(table);
  refresh();
}
