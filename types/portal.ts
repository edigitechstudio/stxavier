import type { BookingMode, BookingStatus } from './booking';
import type { Localized } from './content';

export type UserRole = 'student' | 'counsellor' | 'admin';

/** The signed-in person, as the app needs to know them. Never contains tokens. */
export type Viewer = { id: string; email: string; name: string; role: UserRole };

export const APP_STAGES = ['documents', 'applied', 'offer_received', 'cas_coe', 'visa_lodged', 'visa_granted', 'pre_departure'] as const;
export type AppStage = (typeof APP_STAGES)[number];
export const stageIndex = (s: AppStage) => APP_STAGES.indexOf(s);

export type Application = {
  id: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  counsellor: string | null; // counsellor slug
  country: string; // destination slug
  university: string | null;
  course: string | null;
  intake: string | null;
  stage: AppStage;
  created_at: string;
  updated_at: string;
};

export type StageChange = {
  id: string;
  application_id: string;
  from_stage: AppStage | null;
  to_stage: AppStage;
  changed_by_name: string | null;
  note: string | null;
  created_at: string;
};

export const DOC_STATUSES = ['pending', 'verified', 'reupload_needed'] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export type StudentDocument = {
  id: string;
  application_id: string;
  student_id: string;
  doc_type: string; // key from PortalContent.document_types
  storage_path: string;
  file_name: string;
  mime: string;
  size_bytes: number;
  status: DocStatus;
  counsellor_comment: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type NotificationKind = 'deadline' | 'document' | 'stage' | 'message';
export type PortalNotification = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  due_at: string | null;
  read_at: string | null;
  created_at: string;
};

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_SOURCES = ['enquiry', 'counselling', 'eligibility', 'guide_download', 'parent', 'booking', 'event_rsvp', 'newsletter', 'chat', 'contact'] as const;
export type LeadSourceKey = (typeof LEAD_SOURCES)[number];

export type Lead = {
  id: string;
  source: LeadSourceKey;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string | null;
  payload: Record<string, unknown>;
  page_path: string | null;
  referrer: string | null;
  locale: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  assigned_to: string | null;
  created_at: string;
};

export type LeadNote = { id: string; lead_id: string; author_name: string | null; body: string; created_at: string };

export type LeadFilter = { status?: LeadStatus; source?: LeadSourceKey; q?: string; from?: string; to?: string };

export type BookingRow = {
  id: string;
  reference: string;
  counsellor: string;
  mode: BookingMode;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type ProfileRow = { id: string; email: string | null; full_name: string | null; phone: string | null; role: UserRole; created_at: string };

/** Portal copy that the consultancy edits (page_content row "portal"). */
export type PortalContent = {
  /** Documents students are asked to upload; `key` is stored on each document row. */
  document_types: { key: string; label: Localized; hint: Localized | null; required: boolean }[];
  /** Unlocked once an application reaches visa_granted. `countries` empty = applies to all. */
  pre_departure: { id: string; icon: string; title: Localized; items: Localized[]; countries: string[] }[];
  /** Upload limits shown to students and enforced by the server. */
  max_upload_mb: number;
};
