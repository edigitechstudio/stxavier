import 'server-only';
import { demoAuth } from '@/lib/auth/mode';
import { createSessionClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Application, PortalNotification, StageChange, StudentDocument, Viewer } from '@/types/portal';
import { demoStore, newId } from './demo-store';

/**
 * Student-side data access. Every function takes the already-verified Viewer and only ever
 * returns that viewer's rows. In Supabase this is also enforced by RLS (session client).
 */

const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);

export async function getMyApplications(v: Viewer): Promise<Application[]> {
  if (demoAuth) return demoStore().applications.filter((a) => a.student_id === v.id).sort(byNewest);
  const db = await createSessionClient();
  const { data, error } = await db.from('applications').select('*').eq('student_id', v.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({ ...a, student_name: v.name, student_email: v.email })) as Application[];
}

export async function getMyStageHistory(v: Viewer, applicationIds: string[]): Promise<StageChange[]> {
  if (!applicationIds.length) return [];
  if (demoAuth) {
    const mine = new Set(demoStore().applications.filter((a) => a.student_id === v.id).map((a) => a.id));
    return demoStore().history.filter((h) => mine.has(h.application_id) && applicationIds.includes(h.application_id)).sort(byNewest);
  }
  const db = await createSessionClient();
  const { data, error } = await db
    .from('application_stage_history')
    .select('id, application_id, from_stage, to_stage, changed_by_name, note, created_at')
    .in('application_id', applicationIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as StageChange[];
}

export async function getMyDocuments(v: Viewer): Promise<StudentDocument[]> {
  if (demoAuth) return demoStore().documents.filter((d) => d.student_id === v.id).sort(byNewest);
  const db = await createSessionClient();
  const { data, error } = await db.from('documents').select('*').eq('student_id', v.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as StudentDocument[];
}

export async function getMyNotifications(v: Viewer): Promise<PortalNotification[]> {
  if (demoAuth) return demoStore().notifications.filter((n) => n.user_id === v.id).sort(byNewest);
  const db = await createSessionClient();
  const { data, error } = await db.from('notifications').select('*').eq('user_id', v.id).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data as PortalNotification[];
}

export async function markNotificationsRead(v: Viewer, ids: string[] | 'all') {
  const now = new Date().toISOString();
  if (demoAuth) {
    for (const n of demoStore().notifications) if (n.user_id === v.id && !n.read_at && (ids === 'all' || ids.includes(n.id))) n.read_at = now;
    return;
  }
  const db = await createSessionClient();
  let q = db.from('notifications').update({ read_at: now }).eq('user_id', v.id).is('read_at', null);
  if (ids !== 'all') q = q.in('id', ids);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ---- Documents: storage ------------------------------------------------------------------

const BUCKET = 'documents';

/** Stores a validated upload and records it. Returns null if the application isn't the student's. */
export async function addMyDocument(
  v: Viewer,
  input: { applicationId: string; docType: string; fileName: string; mime: string; ext: string; bytes: Uint8Array },
): Promise<StudentDocument | null> {
  const apps = await getMyApplications(v);
  if (!apps.some((a) => a.id === input.applicationId)) return null;

  const id = newId();
  const storage_path = `${v.id}/${input.applicationId}/${id}.${input.ext}`;
  const row: StudentDocument = {
    id,
    application_id: input.applicationId,
    student_id: v.id,
    doc_type: input.docType,
    storage_path,
    file_name: input.fileName,
    mime: input.mime,
    size_bytes: input.bytes.byteLength,
    status: 'pending',
    counsellor_comment: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
  };

  if (demoAuth) {
    demoStore().files.set(storage_path, input.bytes);
    demoStore().documents.push(row);
    return row;
  }

  const storage = createServiceClient().storage.from(BUCKET);
  const up = await storage.upload(storage_path, input.bytes, { contentType: input.mime, upsert: false });
  if (up.error) throw new Error(up.error.message);
  const db = await createSessionClient(); // RLS: student may insert only into their own application
  const { error } = await db.from('documents').insert({
    id,
    application_id: row.application_id,
    student_id: v.id,
    doc_type: row.doc_type,
    storage_path,
    file_name: row.file_name,
    mime: row.mime,
    size_bytes: row.size_bytes,
  });
  if (error) {
    await storage.remove([storage_path]);
    throw new Error(error.message);
  }
  return row;
}

/** Students may withdraw a document until it has been verified. */
export async function deleteMyDocument(v: Viewer, id: string): Promise<boolean> {
  if (demoAuth) {
    const s = demoStore();
    const d = s.documents.find((x) => x.id === id && x.student_id === v.id && x.status !== 'verified');
    if (!d) return false;
    s.documents.splice(s.documents.indexOf(d), 1);
    s.files.delete(d.storage_path);
    return true;
  }
  const db = await createSessionClient();
  const { data, error } = await db.from('documents').delete().eq('id', id).eq('student_id', v.id).neq('status', 'verified').select('storage_path');
  if (error || !data?.length) return false;
  await createServiceClient().storage.from(BUCKET).remove(data.map((d) => d.storage_path));
  return true;
}

/**
 * A document the viewer may download: their own, or any document for staff.
 * Supabase returns a 60-second signed URL; demo mode returns the bytes.
 */
export async function documentDownload(v: Viewer, id: string): Promise<{ name: string; mime: string; url?: string; bytes?: Uint8Array } | null> {
  const staff = v.role === 'admin' || v.role === 'counsellor';
  if (demoAuth) {
    const d = demoStore().documents.find((x) => x.id === id && (staff || x.student_id === v.id));
    const bytes = d && demoStore().files.get(d.storage_path);
    return d && bytes ? { name: d.file_name, mime: d.mime, bytes } : null;
  }
  const db = await createSessionClient(); // RLS decides visibility
  const { data: d } = await db.from('documents').select('storage_path, file_name, mime').eq('id', id).maybeSingle();
  if (!d) return null;
  const { data, error } = await createServiceClient().storage.from(BUCKET).createSignedUrl(d.storage_path, 60, { download: d.file_name });
  if (error || !data) return null;
  return { name: d.file_name, mime: d.mime, url: data.signedUrl };
}
