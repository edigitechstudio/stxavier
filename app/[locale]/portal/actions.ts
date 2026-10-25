'use server';
import { refresh } from 'next/cache';
import { getViewer } from '@/lib/auth/viewer';
import { deleteMyDocument, markNotificationsRead } from '@/lib/portal/student';

/** Every action re-checks the session itself. Never trust that the page was protected. */
async function viewerOrThrow() {
  const v = await getViewer();
  if (!v) throw new Error('Not signed in');
  return v;
}

export async function removeDocument(formData: FormData) {
  const v = await viewerOrThrow();
  await deleteMyDocument(v, String(formData.get('id') ?? ''));
  refresh();
}

export async function markAllRead() {
  const v = await viewerOrThrow();
  await markNotificationsRead(v, 'all');
  refresh();
}
