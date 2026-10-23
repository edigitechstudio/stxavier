import 'server-only';
import { getAvailability, getCounsellors, getPageContent } from '@/lib/content';
import type { BookingMode } from '@/types/booking';
import { generateSlots } from './slots';
import { listBusy } from './store';

const DAY = 86_400_000;

/** Counsellors who can take bookings, in assignment order ("any available" uses this order). */
export async function bookableCounsellors() {
  const [team, { rules }] = await Promise.all([getCounsellors(), getAvailability()]);
  return team.filter((c) => rules.some((r) => r.counsellor === c.slug));
}

/** Everything the slot engine needs for a counsellor choice + mode, read fresh (bookings are never cached). */
export async function slotInput(counsellor: string, mode: BookingMode, nowIso = new Date().toISOString()) {
  const [settings, availability, team] = await Promise.all([getPageContent('booking'), getAvailability(), bookableCounsellors()]);
  const counsellors = counsellor === 'any' ? team.map((c) => c.slug) : team.some((c) => c.slug === counsellor) ? [counsellor] : [];
  const busy = counsellors.length
    ? await listBusy(counsellors, nowIso, new Date(Date.parse(nowIso) + (settings.horizon_days + 1) * DAY).toISOString())
    : [];
  return {
    input: {
      rules: availability.rules,
      exceptions: availability.exceptions,
      busy,
      counsellors,
      mode,
      now: nowIso,
      minNoticeMinutes: settings.min_notice_minutes,
      horizonDays: settings.horizon_days,
    },
    settings,
    team,
  };
}

/** Bookable days only — days with no free slot are dropped. */
export async function availableDays(counsellor: string, mode: BookingMode) {
  const { input } = await slotInput(counsellor, mode);
  return generateSlots(input).filter((d) => d.slots.length > 0);
}
