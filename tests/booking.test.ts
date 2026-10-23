import { describe, expect, it } from 'vitest';
import { findSlot, generateSlots, nptDate, nptToUtc, weekdayOf } from '@/lib/booking/slots';
import type { AvailabilityRule } from '@/types/booking';

const rule = (counsellor: string, weekday: number, start = '10:00', end = '12:00'): AvailabilityRule => ({
  id: `${counsellor}-${weekday}`,
  counsellor,
  weekday,
  start,
  end,
  slot_minutes: 30,
  modes: ['office', 'zoom'],
});

// 2026-10-18 is a Sunday. "Now" = Sunday 08:00 NPT (02:15 UTC).
const NOW = '2026-10-18T02:15:00.000Z';
const base = {
  rules: [rule('a', 0), rule('b', 0, '11:00', '13:00')],
  exceptions: [],
  busy: [],
  counsellors: ['a'],
  mode: 'office' as const,
  now: NOW,
  minNoticeMinutes: 60,
  horizonDays: 7,
};

describe('Nepal time helpers', () => {
  it('converts NPT ↔ UTC with the +05:45 offset', () => {
    expect(new Date(nptToUtc('2026-10-18', '10:00')).toISOString()).toBe('2026-10-18T04:15:00.000Z');
    expect(nptDate(Date.parse('2026-10-18T18:30:00Z'))).toBe('2026-10-19'); // 00:15 next day in Nepal
    expect(weekdayOf('2026-10-18')).toBe(0);
  });
});

describe('generateSlots', () => {
  it('builds 30-minute slots inside working hours', () => {
    const today = generateSlots(base)[0];
    expect(today.date).toBe('2026-10-18');
    expect(today.slots.map((s) => s.start)).toEqual([
      '2026-10-18T04:15:00.000Z',
      '2026-10-18T04:45:00.000Z',
      '2026-10-18T05:15:00.000Z',
      '2026-10-18T05:45:00.000Z',
    ]);
  });

  it('respects minimum notice', () => {
    const slots = generateSlots({ ...base, now: '2026-10-18T04:30:00.000Z' })[0].slots; // 10:15 NPT, 60 min notice
    expect(slots[0].start).toBe('2026-10-18T05:45:00.000Z'); // 11:30 NPT
  });

  it('only offers days the counsellor works, within the horizon', () => {
    const days = generateSlots(base);
    expect(days).toHaveLength(7);
    expect(days.filter((d) => d.slots.length).map((d) => d.date)).toEqual(['2026-10-18']);
  });

  it('filters by mode', () => {
    expect(generateSlots({ ...base, mode: 'whatsapp' })[0].slots).toHaveLength(0);
  });

  it('excludes booked and overlapping slots', () => {
    const busy = [{ counsellor: 'a', starts_at: '2026-10-18T04:45:00.000Z', ends_at: '2026-10-18T05:15:00.000Z' }];
    const starts = generateSlots({ ...base, busy })[0].slots.map((s) => s.start);
    expect(starts).not.toContain('2026-10-18T04:45:00.000Z');
    expect(starts).toHaveLength(3);
  });

  it('applies whole-day and partial exceptions', () => {
    const allDay = [{ id: 'x', counsellor: null, date: '2026-10-18', start: null, end: null, reason: null }];
    expect(generateSlots({ ...base, exceptions: allDay })[0].slots).toHaveLength(0);
    const partial = [{ id: 'y', counsellor: 'a', date: '2026-10-18', start: '10:00', end: '11:00', reason: null }];
    expect(generateSlots({ ...base, exceptions: partial })[0].slots).toHaveLength(2);
  });

  it('merges counsellors for "any available" without duplicate times', () => {
    const slots = generateSlots({ ...base, counsellors: ['a', 'b'] })[0].slots;
    // a: 10:00–12:00, b: 11:00–13:00 → 10:00…12:30, each start once
    expect(slots).toHaveLength(6);
    expect(new Set(slots.map((s) => s.start)).size).toBe(6);
    expect(slots.find((s) => s.start === '2026-10-18T05:15:00.000Z')?.counsellor).toBe('a'); // 11:00 → first counsellor
    expect(slots.at(-1)?.counsellor).toBe('b'); // 12:30 only b works
  });

  it('falls back to the next counsellor when the first is booked', () => {
    const busy = [{ counsellor: 'a', starts_at: '2026-10-18T05:15:00.000Z', ends_at: '2026-10-18T05:45:00.000Z' }];
    const slot = generateSlots({ ...base, counsellors: ['a', 'b'], busy })[0].slots.find((s) => s.start === '2026-10-18T05:15:00.000Z');
    expect(slot?.counsellor).toBe('b');
  });

  it('findSlot re-validates a requested start time', () => {
    expect(findSlot(base, '2026-10-18T04:15:00.000Z')?.counsellor).toBe('a');
    expect(findSlot(base, '2026-10-18T04:20:00.000Z')).toBeUndefined();
    expect(findSlot({ ...base, busy: [{ counsellor: 'a', starts_at: '2026-10-18T04:15:00.000Z', ends_at: '2026-10-18T04:45:00.000Z' }] }, '2026-10-18T04:15:00.000Z')).toBeUndefined();
  });
});
