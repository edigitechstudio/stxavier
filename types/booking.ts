import type { Localized, PageHeading } from './content';

export type BookingMode = 'office' | 'zoom' | 'whatsapp';
export const BOOKING_MODES: BookingMode[] = ['office', 'zoom', 'whatsapp'];

/** Weekly working hours for one counsellor (local Nepal time). weekday: 0 = Sunday … 6 = Saturday. */
export type AvailabilityRule = {
  id: string;
  counsellor: string; // counsellor slug
  weekday: number;
  start: string; // "10:00"
  end: string; // "17:00"
  slot_minutes: number;
  modes: BookingMode[];
};

/** A day (or part of a day) when a counsellor is unavailable — holidays, leave, fairs. */
export type AvailabilityException = {
  id: string;
  counsellor: string | null; // null = whole office closed
  date: string; // YYYY-MM-DD (Nepal time)
  start: string | null; // null = all day
  end: string | null;
  reason: Localized | null;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/** The minimum a slot calculation needs to know about existing bookings. */
export type BusyBlock = { counsellor: string; starts_at: string; ends_at: string };

export type BookingSettings = {
  hero: PageHeading;
  /** Earliest bookable time, in minutes from now. */
  min_notice_minutes: number;
  /** How many days ahead students can book. */
  horizon_days: number;
  /** Shown on the booking page and in emails. */
  office_address: Localized;
  zoom_note: Localized;
  whatsapp_note: Localized;
};

export type Slot = { start: string; end: string; counsellor: string };
export type DaySlots = { date: string; slots: Slot[] };
