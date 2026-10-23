import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, icsFile, type CalendarEvent } from '@/lib/booking/calendar';

const event: CalendarEvent = {
  uid: 'SX-ABC123@stxavier.com.np',
  title: 'Counselling, St. Xavier; free',
  description: 'Office visit\nReference: SX-ABC123',
  location: 'Kathmandu',
  start: '2026-10-18T04:15:00.000Z', // 10:00 NPT
  end: '2026-10-18T04:45:00.000Z',
};

describe('calendar hand-off', () => {
  it('builds a Google Calendar template link in UTC', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261018T041500Z/20261018T044500Z');
    expect(url.searchParams.get('text')).toBe(event.title);
  });

  it('writes a valid, escaped iCalendar file', () => {
    const ics = icsFile(event, '2026-10-17T00:00:00.000Z');
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines.at(-1)).toBe('END:VCALENDAR');
    expect(ics).toContain('DTSTART:20261018T041500Z');
    expect(ics).toContain('DTSTAMP:20261017T000000Z');
    expect(ics).toContain('SUMMARY:Counselling\\, St. Xavier\\; free');
    expect(ics).toContain('DESCRIPTION:Office visit\\nReference: SX-ABC123');
  });

  it('folds long lines to 75 octets', () => {
    const ics = icsFile({ ...event, description: 'x'.repeat(200) });
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
    expect(ics).toMatch(/\r\n x/);
  });
});
