import type { BookingMode, BookingStatus } from '@/types/booking';
import type { AppStage, DocStatus, LeadSourceKey, LeadStatus } from '@/types/portal';

/** English UI labels for the staff dashboard. */
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', converted: 'Converted', lost: 'Lost' };
export const LEAD_SOURCE_LABEL: Record<LeadSourceKey, string> = {
  enquiry: 'Enquiry form',
  counselling: 'Counselling pop-up',
  eligibility: 'Eligibility checker',
  guide_download: 'Guide download',
  parent: 'Parents page',
  booking: 'Booking',
  event_rsvp: 'Event RSVP',
  newsletter: 'Newsletter',
  chat: 'AI chat',
  contact: 'Contact page',
};
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed', no_show: 'No-show' };
export const MODE_LABEL: Record<BookingMode, string> = { office: 'Office visit', zoom: 'Zoom', whatsapp: 'WhatsApp call' };
export const STAGE_LABEL: Record<AppStage, string> = {
  documents: 'Documents',
  applied: 'Applied',
  offer_received: 'Offer received',
  cas_coe: 'CAS / CoE',
  visa_lodged: 'Visa lodged',
  visa_granted: 'Visa granted',
  pre_departure: 'Pre-departure',
};
export const DOC_STATUS_LABEL: Record<DocStatus, string> = { pending: 'Pending review', verified: 'Verified', reupload_needed: 'Re-upload needed' };
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TZ = 'Asia/Kathmandu';
export const fmtDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: TZ }).format(new Date(iso));
export const fmtDateTime = (iso: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(iso));
export const fmtTime = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: TZ }).format(new Date(iso));
export const fmtDay = (iso: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ }).format(new Date(iso));
