import 'server-only';
import { demoAuth } from '@/lib/auth/mode';
import { devAvailability } from '@/lib/booking/dev-availability';
import { devBookings } from '@/lib/booking/store';
import { createSessionClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { AvailabilityException, AvailabilityRule, BookingStatus } from '@/types/booking';
import {
  APP_STAGES,
  type AppStage,
  type Application,
  type BookingRow,
  type DocStatus,
  type Lead,
  type LeadFilter,
  type LeadNote,
  type LeadStatus,
  type NotificationKind,
  type PortalNotification,
  type ProfileRow,
  type StageChange,
  type StudentDocument,
  type UserRole,
  type Viewer,
} from '@/types/portal';
import { demoStore, newId } from './demo-store';

/**
 * Staff-side data access. Callers must have checked `requireStaff()` / `requireAdmin()` first;
 * in Supabase the session client additionally enforces RLS (is_staff / is_admin).
 */

const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);
const now = () => new Date().toISOString();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

// ---------------------------------------------------------------------------- Leads

export const LEAD_LIMIT = 500;

function matchesLead(l: Lead, f: LeadFilter) {
  if (f.status && l.status !== f.status) return false;
  if (f.source && l.source !== f.source) return false;
  if (f.from && l.created_at < f.from) return false;
  if (f.to && l.created_at > f.to) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (![l.name, l.phone, l.email ?? ''].some((v) => v.toLowerCase().includes(q))) return false;
  }
  return true;
}

export async function listLeads(f: LeadFilter, limit = LEAD_LIMIT): Promise<Lead[]> {
  if (demoAuth) return demoStore().leads.filter((l) => matchesLead(l, f)).sort(byNewest).slice(0, limit);
  const db = await createSessionClient();
  let q = db.from('leads').select('*').order('created_at', { ascending: false }).limit(limit);
  if (f.status) q = q.eq('status', f.status);
  if (f.source) q = q.eq('source', f.source);
  if (f.from) q = q.gte('created_at', f.from);
  if (f.to) q = q.lte('created_at', f.to);
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, ' ').trim();
    if (term) q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await q;
  fail(error);
  return data as Lead[];
}

export async function getLead(id: string): Promise<{ lead: Lead; notes: LeadNote[] } | null> {
  if (demoAuth) {
    const lead = demoStore().leads.find((l) => l.id === id);
    return lead ? { lead, notes: demoStore().leadNotes.filter((n) => n.lead_id === id).sort(byNewest) } : null;
  }
  const db = await createSessionClient();
  const [{ data: lead }, { data: notes }] = await Promise.all([
    db.from('leads').select('*').eq('id', id).maybeSingle(),
    db.from('lead_notes').select('id, lead_id, author_name, body, created_at').eq('lead_id', id).order('created_at', { ascending: false }),
  ]);
  return lead ? { lead: lead as Lead, notes: (notes ?? []) as LeadNote[] } : null;
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  if (demoAuth) {
    const l = demoStore().leads.find((x) => x.id === id);
    if (l) l.status = status;
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('leads').update({ status }).eq('id', id)).error);
}

export async function addLeadNote(v: Viewer, leadId: string, body: string) {
  if (demoAuth) {
    demoStore().leadNotes.push({ id: newId(), lead_id: leadId, author_name: v.name, body, created_at: now() });
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('lead_notes').insert({ lead_id: leadId, author_id: v.id, author_name: v.name, body })).error);
}

/** Dev only: leads posted to /api/leads without a database land here so the admin shows them. */
export function recordDevLead(l: Pick<Lead, 'source' | 'name' | 'phone' | 'email' | 'payload' | 'page_path' | 'referrer' | 'locale'> & { utm?: Record<string, string | undefined> }) {
  const { utm = {}, ...rest } = l;
  demoStore().leads.push({
    ...rest,
    id: newId(),
    status: 'new',
    assigned_to: null,
    created_at: now(),
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_term: utm.utm_term ?? null,
    utm_content: utm.utm_content ?? null,
  });
}

// ---------------------------------------------------------------------------- Bookings

export async function listBookings(range: 'upcoming' | 'past' | 'all', status?: BookingStatus): Promise<BookingRow[]> {
  const t = now();
  const inRange = (b: { starts_at: string }) => range === 'all' || (range === 'upcoming' ? b.starts_at >= t : b.starts_at < t);
  const order = (a: BookingRow, b: BookingRow) => (range === 'past' ? b.starts_at.localeCompare(a.starts_at) : a.starts_at.localeCompare(b.starts_at));
  if (demoAuth) {
    return devBookings()
      .filter((b) => inRange(b) && (!status || b.status === status))
      .map((b) => ({ id: b.id, reference: b.reference, counsellor: b.counsellor, mode: b.mode, starts_at: b.starts_at, ends_at: b.ends_at, status: b.status, name: b.name, phone: b.phone, email: b.email, notes: b.notes, created_at: b.created_at }))
      .sort(order);
  }
  const db = await createSessionClient();
  let q = db.from('bookings').select('id, reference, counsellor, mode, starts_at, ends_at, status, name, phone, email, notes, created_at').limit(500);
  if (range === 'upcoming') q = q.gte('starts_at', t).order('starts_at', { ascending: true });
  else if (range === 'past') q = q.lt('starts_at', t).order('starts_at', { ascending: false });
  else q = q.order('starts_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  fail(error);
  return data as BookingRow[];
}

export async function setBookingStatus(id: string, status: BookingStatus) {
  if (demoAuth) {
    const b = devBookings().find((x) => x.id === id);
    if (b) b.status = status;
    return;
  }
  const db = await createSessionClient();
  // Re-confirming a cancelled booking can collide with a newer one (exclusion constraint) — surface it.
  const { error } = await db.from('bookings').update({ status }).eq('id', id);
  if (error?.code === '23P01') throw new Error('That time has since been booked by someone else.');
  fail(error);
}

// ---------------------------------------------------------------------------- Availability

export async function readAvailability(): Promise<{ rules: AvailabilityRule[]; exceptions: AvailabilityException[] }> {
  if (demoAuth) {
    const d = devAvailability();
    return { rules: [...d.rules], exceptions: [...d.exceptions] };
  }
  const db = await createSessionClient();
  const [r, e] = await Promise.all([db.from('counsellor_availability').select('*'), db.from('availability_exceptions').select('*').order('date')]);
  fail(r.error);
  fail(e.error);
  const hm = (t: string | null) => (t ? t.slice(0, 5) : null);
  type Row = Record<string, unknown> & { start_time: string | null; end_time: string | null };
  return {
    rules: (r.data as Row[]).map(({ start_time, end_time, ...x }) => ({ ...x, start: hm(start_time)!, end: hm(end_time)! }) as AvailabilityRule),
    exceptions: (e.data as Row[]).map(({ start_time, end_time, ...x }) => ({ ...x, start: hm(start_time), end: hm(end_time) }) as AvailabilityException),
  };
}

/** Replaces one counsellor's weekly hours (one row per working weekday). */
export async function saveWeeklyHours(counsellor: string, rules: Omit<AvailabilityRule, 'id' | 'counsellor'>[]) {
  const rows = rules.map((r) => ({ ...r, id: `${counsellor}-${r.weekday}`, counsellor }));
  if (demoAuth) {
    const d = devAvailability();
    d.rules = [...d.rules.filter((r) => r.counsellor !== counsellor), ...rows];
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('counsellor_availability').delete().eq('counsellor', counsellor)).error);
  if (rows.length) {
    fail((await db.from('counsellor_availability').insert(rows.map(({ start, end, ...r }) => ({ ...r, start_time: start, end_time: end })))).error);
  }
}

export async function addException(x: Omit<AvailabilityException, 'id'>) {
  const row = { ...x, id: newId() };
  if (demoAuth) {
    devAvailability().exceptions.push(row);
    return;
  }
  const db = await createSessionClient();
  const { start, end, ...r } = row;
  fail((await db.from('availability_exceptions').insert({ ...r, start_time: start, end_time: end })).error);
}

export async function removeException(id: string) {
  if (demoAuth) {
    const d = devAvailability();
    d.exceptions = d.exceptions.filter((e) => e.id !== id);
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('availability_exceptions').delete().eq('id', id)).error);
}

// ---------------------------------------------------------------------------- Applications

export async function listApplications(f: { stage?: AppStage; q?: string } = {}): Promise<Application[]> {
  const match = (a: Application) =>
    (!f.stage || a.stage === f.stage) &&
    (!f.q || [a.student_name, a.student_email, a.university, a.course].some((v) => v?.toLowerCase().includes(f.q!.toLowerCase())));
  if (demoAuth) return demoStore().applications.filter(match).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const db = await createSessionClient();
  let q = db.from('applications').select('*, student:profiles!applications_student_id_fkey(full_name, email)').order('updated_at', { ascending: false }).limit(500);
  if (f.stage) q = q.eq('stage', f.stage);
  const { data, error } = await q;
  fail(error);
  type Row = Application & { student: { full_name: string | null; email: string | null } | null };
  return (data as Row[]).map(({ student, ...a }) => ({ ...a, student_name: student?.full_name ?? null, student_email: student?.email ?? null })).filter(match);
}

export async function getApplication(id: string): Promise<{ app: Application; history: StageChange[]; documents: StudentDocument[]; notifications: PortalNotification[] } | null> {
  if (demoAuth) {
    const s = demoStore();
    const app = s.applications.find((a) => a.id === id);
    if (!app) return null;
    return {
      app,
      history: s.history.filter((h) => h.application_id === id).sort(byNewest),
      documents: s.documents.filter((d) => d.application_id === id).sort(byNewest),
      notifications: s.notifications.filter((n) => n.user_id === app.student_id).sort(byNewest),
    };
  }
  const apps = await listApplicationsById(id);
  const app = apps[0];
  if (!app) return null;
  const db = await createSessionClient();
  const [h, d, n] = await Promise.all([
    db.from('application_stage_history').select('id, application_id, from_stage, to_stage, changed_by_name, note, created_at').eq('application_id', id).order('created_at', { ascending: false }),
    db.from('documents').select('*').eq('application_id', id).order('created_at', { ascending: false }),
    db.from('notifications').select('*').eq('user_id', app.student_id).order('created_at', { ascending: false }).limit(50),
  ]);
  return { app, history: (h.data ?? []) as StageChange[], documents: (d.data ?? []) as StudentDocument[], notifications: (n.data ?? []) as PortalNotification[] };
}

async function listApplicationsById(id: string): Promise<Application[]> {
  const db = await createSessionClient();
  const { data } = await db.from('applications').select('*, student:profiles!applications_student_id_fkey(full_name, email)').eq('id', id);
  type Row = Application & { student: { full_name: string | null; email: string | null } | null };
  return ((data ?? []) as Row[]).map(({ student, ...a }) => ({ ...a, student_name: student?.full_name ?? null, student_email: student?.email ?? null }));
}

export type NewApplication = { email: string; name: string; country: string; university: string | null; course: string | null; intake: string | null; counsellor: string | null };

/**
 * Opens an application for a student. Unknown emails get a Supabase invite (magic link), which
 * creates their profile; in demo mode a profile is created directly.
 */
export async function createApplication(v: Viewer, input: NewApplication, redirectTo: string): Promise<{ id: string; invited: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (demoAuth) {
    const s = demoStore();
    let p = s.profiles.find((x) => x.email?.toLowerCase() === email);
    const invited = !p;
    if (!p) {
      p = { id: newId(), email, full_name: input.name || null, phone: null, role: 'student', created_at: now() };
      s.profiles.push(p);
    }
    const id = newId();
    s.applications.push({ id, student_id: p.id, student_name: p.full_name, student_email: p.email, counsellor: input.counsellor, country: input.country, university: input.university, course: input.course, intake: input.intake, stage: 'documents', created_at: now(), updated_at: now() });
    s.history.push({ id: newId(), application_id: id, from_stage: null, to_stage: 'documents', changed_by_name: v.name, note: null, created_at: now() });
    return { id, invited };
  }

  const db = await createSessionClient();
  let { data: profile } = await db.from('profiles').select('id').ilike('email', email).maybeSingle();
  let invited = false;
  if (!profile) {
    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: input.name }, redirectTo });
    fail(error);
    profile = data.user ? { id: data.user.id } : null;
    invited = true;
    if (!profile) throw new Error('Could not create the student account');
  }
  const { data: app, error } = await db
    .from('applications')
    .insert({ student_id: profile.id, counsellor: input.counsellor, country: input.country, university: input.university, course: input.course, intake: input.intake })
    .select('id')
    .single();
  fail(error);
  await db.from('application_stage_history').insert({ application_id: app!.id, to_stage: 'documents', changed_by: v.id, changed_by_name: v.name });
  return { id: app!.id, invited };
}

export async function updateApplication(id: string, patch: Partial<Pick<Application, 'university' | 'course' | 'intake' | 'counsellor'>>) {
  if (demoAuth) {
    const a = demoStore().applications.find((x) => x.id === id);
    if (a) Object.assign(a, patch, { updated_at: now() });
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('applications').update(patch).eq('id', id)).error);
}

/** Moves an application to a stage, records history and returns the student's id for notifying. */
export async function setStage(v: Viewer, id: string, stage: AppStage, note: string | null): Promise<{ studentId: string; from: AppStage } | null> {
  if (!APP_STAGES.includes(stage)) return null;
  if (demoAuth) {
    const s = demoStore();
    const a = s.applications.find((x) => x.id === id);
    if (!a || a.stage === stage) return null;
    const from = a.stage;
    a.stage = stage;
    a.updated_at = now();
    s.history.push({ id: newId(), application_id: id, from_stage: from, to_stage: stage, changed_by_name: v.name, note, created_at: now() });
    return { studentId: a.student_id, from };
  }
  const db = await createSessionClient();
  const { data: a } = await db.from('applications').select('stage, student_id').eq('id', id).maybeSingle();
  if (!a || a.stage === stage) return null;
  fail((await db.from('applications').update({ stage }).eq('id', id)).error);
  fail((await db.from('application_stage_history').insert({ application_id: id, from_stage: a.stage, to_stage: stage, changed_by: v.id, changed_by_name: v.name, note })).error);
  return { studentId: a.student_id, from: a.stage as AppStage };
}

export async function reviewDocument(v: Viewer, id: string, status: DocStatus, comment: string | null): Promise<StudentDocument | null> {
  const patch = { status, counsellor_comment: comment, reviewed_at: now() };
  if (demoAuth) {
    const d = demoStore().documents.find((x) => x.id === id);
    if (!d) return null;
    Object.assign(d, patch);
    return d;
  }
  const db = await createSessionClient();
  const { data, error } = await db.from('documents').update({ ...patch, reviewed_by: v.id }).eq('id', id).select('*').maybeSingle();
  fail(error);
  return data as StudentDocument | null;
}

export async function notify(n: { user_id: string; kind: NotificationKind; title: string; body?: string | null; link?: string | null; due_at?: string | null }) {
  const row: PortalNotification = { id: newId(), body: null, link: null, due_at: null, read_at: null, created_at: now(), ...n } as PortalNotification;
  if (demoAuth) {
    demoStore().notifications.push(row);
    return;
  }
  const db = await createSessionClient();
  fail((await db.from('notifications').insert({ user_id: n.user_id, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null, due_at: n.due_at ?? null })).error);
}

export async function studentLocale(studentId: string): Promise<'en' | 'ne'> {
  if (demoAuth) return 'en';
  const db = await createSessionClient();
  const { data } = await db.from('profiles').select('locale').eq('id', studentId).maybeSingle();
  return data?.locale === 'ne' ? 'ne' : 'en';
}

// ---------------------------------------------------------------------------- Users

export async function listProfiles(role?: UserRole): Promise<ProfileRow[]> {
  if (demoAuth) return demoStore().profiles.filter((p) => !role || p.role === role).sort(byNewest);
  const db = await createSessionClient();
  let q = db.from('profiles').select('id, email, full_name, phone, role, created_at').order('created_at', { ascending: false }).limit(1000);
  if (role) q = q.eq('role', role);
  const { data, error } = await q;
  fail(error);
  return data as ProfileRow[];
}

export async function setRole(id: string, role: UserRole) {
  if (demoAuth) {
    const p = demoStore().profiles.find((x) => x.id === id);
    if (p) p.role = role;
    return;
  }
  const db = await createSessionClient(); // trigger: only admins may change roles
  fail((await db.from('profiles').update({ role }).eq('id', id)).error);
}

// ---------------------------------------------------------------------------- Overview

export async function overview() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [leads, upcoming, apps] = await Promise.all([listLeads({}, LEAD_LIMIT), listBookings('upcoming'), listApplications()]);
  let pendingDocs: number;
  if (demoAuth) pendingDocs = demoStore().documents.filter((d) => d.status === 'pending').length;
  else {
    const db = await createSessionClient();
    pendingDocs = (await db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending')).count ?? 0;
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
  const nptDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date(iso));
  const active = upcoming.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  return {
    newLeads: leads.filter((l) => l.status === 'new').length,
    leadsThisWeek: leads.filter((l) => l.created_at >= weekAgo).length,
    leadsByStatus: Object.fromEntries(['new', 'contacted', 'qualified', 'converted', 'lost'].map((s) => [s, leads.filter((l) => l.status === s).length])) as Record<LeadStatus, number>,
    bookingsToday: active.filter((b) => nptDay(b.starts_at) === today),
    bookingsUpcoming: active.length,
    pendingBookings: active.filter((b) => b.status === 'pending').length,
    pendingDocs,
    appsByStage: Object.fromEntries(APP_STAGES.map((s) => [s, apps.filter((a) => a.stage === s).length])) as Record<AppStage, number>,
    recentLeads: leads.slice(0, 6),
  };
}
