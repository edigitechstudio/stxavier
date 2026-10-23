import type { TimelineStep } from '@/types/tools';

export type PlannedStep = TimelineStep & { date: string; isPast: boolean };

const DAY = 86_400_000;
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Reverse-plan milestones from the intake start date (YYYY-MM-DD). Dates are calculated in UTC
 * so the result never shifts with the visitor's time zone.
 */
export function planTimeline(intakeDate: string, steps: TimelineStep[], today: string): PlannedStep[] {
  const start = Date.parse(`${intakeDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(now)) throw new RangeError('Dates must be YYYY-MM-DD');
  return [...steps]
    .sort((a, b) => b.weeks_before - a.weeks_before)
    .map((s) => {
      const date = new Date(start - s.weeks_before * 7 * DAY);
      return { ...s, date: toIsoDate(date), isPast: date.getTime() < now };
    });
}

/** First day of the given intake month, e.g. ("2027-09") → "2027-09-01". */
export function intakeStart(yearMonth: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) throw new RangeError('Expected YYYY-MM');
  return `${yearMonth}-01`;
}

// ---------------------------------------------------------------------------
// Calendar export
// ---------------------------------------------------------------------------

export type CalendarEvent = { uid: string; date: string; title: string; description: string };

const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets per RFC 5545 (continuation lines start with a space). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (size + len > (out.length ? 74 : 75)) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += len;
  }
  out.push(current);
  return out.join('\r\n ');
}

const compact = (date: string) => date.replace(/-/g, '');
const nextDay = (date: string) => toIsoDate(new Date(Date.parse(`${date}T00:00:00Z`) + DAY));

/** All-day events as an .ics calendar file. `stamp` is a UTC timestamp like 20261016T000000Z. */
export function buildIcs(events: CalendarEvent[], stamp: string, calendarName: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//St. Xavier Educational Network//Visa Timeline//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${escapeIcs(e.title)}`,
      `DESCRIPTION:${escapeIcs(e.description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Google Calendar "add event" link for an all-day event. */
export function googleCalendarUrl(e: Omit<CalendarEvent, 'uid'>): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    details: e.description,
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Google Calendar link for a timed event (ISO datetimes with offset are converted to UTC). */
export function googleCalendarTimedUrl(e: { title: string; description: string; start: string; end?: string | null; location?: string | null }): string {
  const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = utc(e.start);
  const end = utc(e.end ?? new Date(Date.parse(e.start) + 3_600_000).toISOString());
  const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, details: e.description, dates: `${start}/${end}` });
  if (e.location) params.set('location', e.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
