import 'server-only';
import type { Application, Lead, LeadNote, PortalNotification, ProfileRow, StageChange, StudentDocument } from '@/types/portal';

/**
 * In-memory backend for local development WITHOUT Supabase, so the portal and admin can be
 * reviewed on localhost. Never used in production (see `demoAuth`). Data resets on restart.
 */
export type DemoStore = {
  profiles: ProfileRow[];
  applications: Application[];
  history: StageChange[];
  documents: StudentDocument[];
  files: Map<string, Uint8Array>;
  notifications: PortalNotification[];
  leads: Lead[];
  leadNotes: LeadNote[];
};

export const DEMO_USERS = {
  student: 'demo-student',
  counsellor: 'demo-counsellor',
  admin: 'demo-admin',
} as const;

const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** A tiny but valid one-page PDF so seeded documents can be downloaded. */
function samplePdf(title: string) {
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 60>>stream
BT /F1 18 Tf 72 760 Td (Demo document: ${title.replace(/[()\\]/g, '')}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  return new TextEncoder().encode(body);
}

function lead(id: string, days: number, l: Partial<Lead> & Pick<Lead, 'source' | 'name' | 'phone'>): Lead {
  return {
    id,
    status: 'new',
    email: null,
    payload: {},
    page_path: '/en',
    referrer: null,
    locale: 'en',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    assigned_to: null,
    created_at: ago(days, 3),
    ...l,
  };
}

function seed(): DemoStore {
  const studentId = DEMO_USERS.student;
  const appId = 'demo-app-uk';
  const files = new Map<string, Uint8Array>();
  const doc = (id: string, type: string, name: string, status: StudentDocument['status'], comment: string | null, days: number): StudentDocument => {
    const path = `${studentId}/${appId}/${id}.pdf`;
    const bytes = samplePdf(name);
    files.set(path, bytes);
    return {
      id,
      application_id: appId,
      student_id: studentId,
      doc_type: type,
      storage_path: path,
      file_name: name,
      mime: 'application/pdf',
      size_bytes: bytes.byteLength,
      status,
      counsellor_comment: comment,
      reviewed_at: status === 'pending' ? null : ago(days - 1),
      created_at: ago(days),
    };
  };

  return {
    profiles: [
      { id: studentId, email: 'aarav.student@example.com', full_name: 'Aarav Sharma', phone: '9801234567', role: 'student', created_at: ago(40) },
      { id: 'demo-student-2', email: 'sita.student@example.com', full_name: 'Sita Gurung', phone: '9812345678', role: 'student', created_at: ago(90) },
      { id: DEMO_USERS.counsellor, email: 'counsellor@example.com', full_name: 'Demo Counsellor', phone: null, role: 'counsellor', created_at: ago(200) },
      { id: DEMO_USERS.admin, email: 'admin@example.com', full_name: 'Demo Admin', phone: null, role: 'admin', created_at: ago(300) },
    ],
    applications: [
      { id: appId, student_id: studentId, student_name: 'Aarav Sharma', student_email: 'aarav.student@example.com', counsellor: 'sample-counsellor-uk', country: 'uk', university: 'University of Leeds', course: 'MSc Data Science', intake: 'September 2027', stage: 'offer_received', created_at: ago(38), updated_at: ago(3) },
      { id: 'demo-app-au', student_id: 'demo-student-2', student_name: 'Sita Gurung', student_email: 'sita.student@example.com', counsellor: 'sample-counsellor-australia', country: 'australia', university: 'Sample University, Sydney', course: 'Bachelor of Nursing', intake: 'February 2027', stage: 'visa_granted', created_at: ago(85), updated_at: ago(6) },
    ],
    history: [
      { id: 'h1', application_id: appId, from_stage: null, to_stage: 'documents', changed_by_name: 'Demo Counsellor', note: 'File opened after counselling session.', created_at: ago(38) },
      { id: 'h2', application_id: appId, from_stage: 'documents', to_stage: 'applied', changed_by_name: 'Demo Counsellor', note: 'Application submitted to the university.', created_at: ago(21) },
      { id: 'h3', application_id: appId, from_stage: 'applied', to_stage: 'offer_received', changed_by_name: 'Demo Counsellor', note: 'Conditional offer received. English test result pending.', created_at: ago(3) },
      { id: 'h4', application_id: 'demo-app-au', from_stage: 'visa_lodged', to_stage: 'visa_granted', changed_by_name: 'Demo Counsellor', note: null, created_at: ago(6) },
    ],
    documents: [
      doc('d1', 'passport', 'passport-bio-page.pdf', 'verified', null, 30),
      doc('d2', 'academic', 'bachelor-transcript.pdf', 'verified', null, 29),
      doc('d3', 'english', 'ielts-result.pdf', 'reupload_needed', 'The scan is cut off at the bottom. Please upload the full Test Report Form.', 5),
      doc('d4', 'sop', 'statement-of-purpose-draft.pdf', 'pending', null, 1),
    ],
    files,
    notifications: [
      { id: 'n1', user_id: studentId, kind: 'deadline', title: 'Accept your offer by the deadline', body: 'Confirm your University of Leeds offer and pay the deposit.', link: null, due_at: ahead(12), read_at: null, created_at: ago(3) },
      { id: 'n2', user_id: studentId, kind: 'document', title: 'Re-upload needed: English test result', body: 'The scan is cut off at the bottom. Please upload the full Test Report Form.', link: '/portal/documents', due_at: null, read_at: null, created_at: ago(5) },
      { id: 'n3', user_id: studentId, kind: 'stage', title: 'Your application moved to “Offer received”', body: null, link: '/portal', due_at: null, read_at: ago(2), created_at: ago(3) },
    ],
    leads: [
      lead('demo-lead-1', 0, { source: 'enquiry', name: 'Prakash Adhikari', phone: '9841122334', email: 'prakash@example.com', payload: { need: 'counselling', destination: 'Australia', field: "Master's degree", intake: 'February 2027' }, utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'feb-intake' }),
      lead('demo-lead-2', 1, { source: 'eligibility', name: 'Anjali Thapa', phone: '9803344556', email: 'anjali@example.com', status: 'contacted', payload: { destination: 'Canada', answers: { gpa: '3.4', english: 'IELTS 6.5' } }, page_path: '/en/tools/eligibility-checker' }),
      lead('demo-lead-3', 2, { source: 'booking', name: 'Bikash Rai', phone: '9860011223', payload: { reference: 'SX-DEMO42', mode: 'office' }, page_path: '/en/book' }),
      lead('demo-lead-4', 4, { source: 'parent', name: 'Ram Bahadur KC', phone: '9851098765', status: 'qualified', payload: { message: 'Asking about total cost for my daughter in Japan.' }, page_path: '/ne/for-parents', locale: 'ne' }),
      lead('demo-lead-5', 9, { source: 'guide_download', name: 'Nisha Shrestha', phone: '9818877665', email: 'nisha@example.com', status: 'converted', payload: { answers: { guide: 'uk' } }, utm_source: 'google', utm_medium: 'organic' }),
      lead('demo-lead-6', 15, { source: 'contact', name: 'Sujan Basnet', phone: '015333081', status: 'lost', payload: { message: 'Interested in PTE classes only.' }, page_path: '/en/contact' }),
    ],
    leadNotes: [
      { id: 'ln1', lead_id: 'demo-lead-2', author_name: 'Demo Counsellor', body: 'Called: wants a May intake. Sent the Canada guide.', created_at: ago(1) },
    ],
  };
}

const g = globalThis as unknown as { __sxPortal?: DemoStore };
export const demoStore = (): DemoStore => (g.__sxPortal ??= seed());

export const newId = () => crypto.randomUUID();
