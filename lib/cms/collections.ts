import type { ContentTable } from '@/lib/content';

/**
 * Everything editable in /admin/cms. Each collection maps to a content table (or the page copy,
 * site settings or blog). Adding a new content table = add one entry here.
 */
export type CollectionKind = 'table' | 'pages' | 'site' | 'blog';
export type Collection = {
  key: string;
  label: string;
  group: string;
  description: string;
  kind: CollectionKind;
  table?: ContentTable;
  /** Primary key field. */
  pk: string;
  /** Public page for an entry (locale is added by the link). */
  path?: (id: string) => string | null;
  /** New entries allowed (page copy and site settings are fixed sets). */
  creatable: boolean;
};

const t = (key: string, label: string, group: string, description: string, pk: string, path?: (id: string) => string | null): Collection => ({
  key,
  label,
  group,
  description,
  kind: 'table',
  table: key as ContentTable,
  pk,
  path,
  creatable: true,
});

export const COLLECTIONS: Collection[] = [
  { key: 'site', label: 'Site settings', group: 'Site', description: 'Name, tagline, phone, WhatsApp, email, social links, announcement bar, intake countdown.', kind: 'site', pk: 'id', creatable: false, path: () => '/' },
  { key: 'pages', label: 'Page text & images', group: 'Site', description: 'Headings, intros, hero images and sections of every page: home, about, parents, contact, legal pages, tools, booking, portal, chat.', kind: 'pages', pk: 'id', creatable: false },
  t('nav_items', 'Menus', 'Site', 'Header and footer menu items.', 'id'),
  t('offices', 'Offices', 'Site', 'Address, phone, opening hours, map (must match Google Business Profile).', 'id', () => '/contact'),
  t('destinations', 'Destinations', 'Study abroad', 'Country pages: summary, key facts, costs, visa steps, documents, work rights, scholarships, guide PDF.', 'slug', (id) => `/study-in/${id}`),
  t('universities', 'Universities', 'Study abroad', 'University directory: rankings, fees, courses, intakes.', 'slug', (id) => `/universities/${id}`),
  t('scholarships', 'Scholarships', 'Study abroad', 'Scholarship finder entries.', 'id', () => '/tools/scholarship-finder'),
  t('english_requirements', 'English requirements', 'Study abroad', 'IELTS/PTE/TOEFL thresholds used by the eligibility checker.', 'id', () => '/tools/eligibility-checker'),
  t('grading_scales', 'Grading scales', 'Study abroad', 'GPA ↔ percentage conversion scales.', 'id', () => '/tools/gpa-percentage-converter'),
  t('services', 'Services', 'Services & classes', 'Service pages and the services list.', 'slug', (id) => `/services/${id}`),
  t('test_prep_courses', 'Test prep courses', 'Services & classes', 'IELTS, PTE, TOEFL, Japanese: format, batches, fees, features.', 'slug', (id) => `/test-prep/${id}`),
  t('counsellors', 'Team', 'People & proof', 'Counsellor profiles and photos (shown on /team and the booking page).', 'slug', (id) => `/team/${id}`),
  t('testimonials', 'Success stories', 'People & proof', 'Student stories, quotes and video reels. Set "is placeholder" off once verified.', 'id', () => '/success-stories'),
  t('stats', 'Stats', 'People & proof', 'Headline numbers (students placed, visa success…). Keep "is placeholder" on until verified.', 'key', () => '/'),
  t('accreditations', 'Accreditations', 'People & proof', 'Registrations and memberships with verification links.', 'id', () => '/about'),
  t('partners', 'Partner institutions', 'People & proof', 'University partners and logos.', 'id', () => '/'),
  t('events', 'Events & webinars', 'Engagement', 'Fairs, university visits and webinars (with recordings).', 'slug', (id) => `/events/${id}`),
  t('faqs', 'FAQs', 'Engagement', 'Questions and answers. "Scope" decides where each appears (general, destination:uk, tool:emi…).', 'id', () => '/faq'),
  t('features', 'Feature lists', 'Engagement', 'Bullet/feature blocks used on the home page (why us, process steps…).', 'id', () => '/'),
  { key: 'blog', label: 'Blog posts', group: 'Engagement', description: 'Guides and news. Write in Markdown; posts in content/blog appear here too and can be edited.', kind: 'blog', pk: 'slug', creatable: true, path: (id) => `/blog/${id}` },
];

export const collection = (key: string) => COLLECTIONS.find((c) => c.key === key);

/** Friendly names and public paths for page_content rows. */
export const PAGE_INFO: Record<string, { label: string; path: string }> = {
  home: { label: 'Home page', path: '/' },
  about: { label: 'About', path: '/about' },
  'for-parents': { label: 'For parents', path: '/for-parents' },
  contact: { label: 'Contact', path: '/contact' },
  destinations: { label: 'Destinations (heading)', path: '/destinations' },
  team: { label: 'Team (heading)', path: '/team' },
  'test-prep': { label: 'Test prep (heading)', path: '/test-prep' },
  services: { label: 'Services (heading)', path: '/services' },
  'privacy-policy': { label: 'Privacy policy', path: '/privacy-policy' },
  terms: { label: 'Terms', path: '/terms' },
  'cookie-policy': { label: 'Cookie policy', path: '/cookie-policy' },
  'editorial-policy': { label: 'Editorial policy', path: '/editorial-policy' },
  tools: { label: 'Tools (shared settings & rates)', path: '/tools' },
  booking: { label: 'Booking page & rules', path: '/book' },
  enquiry: { label: 'Enquiry form', path: '/enquiry' },
  portal: { label: 'Student portal (documents, pre-departure)', path: '/portal' },
  chat: { label: 'AI assistant', path: '/' },
};
export const pageInfo = (id: string) => PAGE_INFO[id] ?? (id.startsWith('tool-') ? { label: `Tool: ${id.slice(5).replace(/-/g, ' ')}`, path: `/tools/${id.slice(5)}` } : { label: id, path: '/' });
