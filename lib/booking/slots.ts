import type { AvailabilityException, AvailabilityRule, BookingMode, BusyBlock, DaySlots, Slot } from '@/types/booking';

/** Nepal Time is a fixed UTC+05:45 with no daylight saving, so conversions are exact arithmetic. */
export const NPT_OFFSET_MIN = 5 * 60 + 45;
const MIN = 60_000;
const DAY = 86_400_000;

/** "YYYY-MM-DD" (Nepal date) for a UTC instant. */
export function nptDate(utcMs: number): string {
  return new Date(utcMs + NPT_OFFSET_MIN * MIN).toISOString().slice(0, 10);
}

/** Weekday (0 = Sunday) of a Nepal calendar date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** UTC instant (ms) of a Nepal local date + "HH:MM". */
export function nptToUtc(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return Date.parse(`${date}T00:00:00Z`) + (h * 60 + m - NPT_OFFSET_MIN) * MIN;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

type Input = {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: BusyBlock[];
  /** Counsellor slugs to consider (one for a specific booking, several for "any available"). */
  counsellors: string[];
  mode: BookingMode;
  now: string; // ISO
  minNoticeMinutes: number;
  horizonDays: number;
};

/**
 * Bookable slots per Nepal calendar day. A slot is offered when it is inside a counsellor's weekly
 * hours for the chosen mode, after the minimum notice, not blocked by an exception and not
 * overlapping an existing booking. With several counsellors ("any available"), each start time
 * appears once, assigned to the first free counsellor in the given order.
 */
export function generateSlots(input: Input): DaySlots[] {
  const nowMs = Date.parse(input.now);
  const earliest = nowMs + input.minNoticeMinutes * MIN;
  const today = nptDate(nowMs);
  const days: DaySlots[] = [];

  for (let i = 0; i < input.horizonDays; i++) {
    const date = new Date(Date.parse(`${today}T00:00:00Z`) + i * DAY).toISOString().slice(0, 10);
    const weekday = weekdayOf(date);
    const byStart = new Map<number, Slot>();

    for (const counsellor of input.counsellors) {
      const rules = input.rules.filter((r) => r.counsellor === counsellor && r.weekday === weekday && r.modes.includes(input.mode));
      const blocks = input.exceptions.filter((e) => e.date === date && (e.counsellor === null || e.counsellor === counsellor));
      const busy = input.busy.filter((b) => b.counsellor === counsellor).map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)] as const);

      for (const rule of rules) {
        const dayEnd = nptToUtc(date, rule.end);
        for (let start = nptToUtc(date, rule.start); start + rule.slot_minutes * MIN <= dayEnd; start += rule.slot_minutes * MIN) {
          const end = start + rule.slot_minutes * MIN;
          if (start < earliest || byStart.has(start)) continue;
          const blocked = blocks.some((e) => (e.start === null || e.end === null ? true : overlaps(start, end, nptToUtc(date, e.start), nptToUtc(date, e.end))));
          if (blocked) continue;
          if (busy.some(([bs, be]) => overlaps(start, end, bs, be))) continue;
          byStart.set(start, { start: new Date(start).toISOString(), end: new Date(end).toISOString(), counsellor });
        }
      }
    }
    days.push({ date, slots: [...byStart.values()].sort((a, b) => a.start.localeCompare(b.start)) });
  }
  return days;
}

/** Server-side re-check that a requested slot is still free (the DB constraint is the final guard). */
export function findSlot(input: Input, startIso: string): Slot | undefined {
  const date = nptDate(Date.parse(startIso));
  return generateSlots(input)
    .find((d) => d.date === date)
    ?.slots.find((s) => Date.parse(s.start) === Date.parse(startIso));
}
