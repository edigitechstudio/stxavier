import 'server-only';
import { randomBytes } from 'node:crypto';
import { env, isSupabaseConfigured } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';
import type { BookingMode, BookingStatus, BusyBlock } from '@/types/booking';

export type NewBooking = {
  counsellor: string;
  mode: BookingMode;
  starts_at: string;
  ends_at: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  locale: string;
  page_path: string | null;
  utm: Record<string, string | undefined>;
};

export type StoredBooking = NewBooking & { id: string; reference: string; status: BookingStatus; created_at: string };

const hasDb = () => isSupabaseConfigured && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Bookings are persisted in Supabase; local development without a DB uses an in-memory store. */
export function bookingStoreAvailable() {
  return hasDb() || !env.isProduction;
}

/** Human-friendly reference, e.g. SX-7K2Q9M (no ambiguous characters). */
export function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return 'SX-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// ---- Development memory store (per server process) -------------------------------------
type Memory = { bookings: StoredBooking[] };
const memory = ((globalThis as unknown as { __sxBookings?: Memory }).__sxBookings ??= { bookings: [] });

/** Development-only booking list (admin dashboard demo mode). */
export const devBookings = () => memory.bookings;

const overlaps = (a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }) =>
  Date.parse(a.starts_at) < Date.parse(b.ends_at) && Date.parse(b.starts_at) < Date.parse(a.ends_at);

/** Existing (pending/confirmed) bookings that block slots. */
export async function listBusy(counsellors: string[], fromIso: string, toIso: string): Promise<BusyBlock[]> {
  if (!hasDb()) {
    return memory.bookings
      .filter((b) => counsellors.includes(b.counsellor) && (b.status === 'pending' || b.status === 'confirmed') && b.starts_at < toIso && b.ends_at > fromIso)
      .map(({ counsellor, starts_at, ends_at }) => ({ counsellor, starts_at, ends_at }));
  }
  const { data, error } = await createServiceClient()
    .from('bookings')
    .select('counsellor, starts_at, ends_at')
    .in('counsellor', counsellors)
    .in('status', ['pending', 'confirmed'])
    .lt('starts_at', toIso)
    .gt('ends_at', fromIso);
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return data as BusyBlock[];
}

/**
 * Inserts a booking. In Postgres an exclusion constraint on (counsellor, time range) makes double
 * booking impossible even under concurrent requests; the memory store mirrors that rule.
 */
export async function insertBooking(b: NewBooking): Promise<{ ok: true; booking: StoredBooking } | { ok: false; reason: 'conflict' | 'error' }> {
  const booking: StoredBooking = { ...b, id: crypto.randomUUID(), reference: makeReference(), status: 'pending', created_at: new Date().toISOString() };

  if (!hasDb()) {
    if (memory.bookings.some((x) => x.counsellor === b.counsellor && (x.status === 'pending' || x.status === 'confirmed') && overlaps(x, b))) return { ok: false, reason: 'conflict' };
    memory.bookings.push(booking);
    console.info('[bookings] (dev, in memory)', booking.reference, booking.counsellor, booking.starts_at);
    return { ok: true, booking };
  }

  const { error } = await createServiceClient().from('bookings').insert({
    id: booking.id,
    reference: booking.reference,
    counsellor: b.counsellor,
    mode: b.mode,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    status: 'pending',
    name: b.name,
    phone: b.phone,
    email: b.email,
    notes: b.notes,
    locale: b.locale,
    page_path: b.page_path,
    ...b.utm,
  });
  if (error) {
    // 23P01 = exclusion_violation (overlapping booking for this counsellor)
    if (error.code === '23P01') return { ok: false, reason: 'conflict' };
    console.error('[bookings]', error.message);
    return { ok: false, reason: 'error' };
  }
  return { ok: true, booking };
}
