import type { BookingSettings } from './booking';
import type { CostProfile, Requirements, TimelineStep, ToolsConfig } from './tools';

/**
 * Content model shared by the seed files (`data/seed`) and the Supabase content tables
 * (`supabase/migrations/0001_content.sql`). Field names are snake_case so a DB row maps 1:1
 * onto these types with no transformation layer.
 */

export type Locale = 'en' | 'ne';

/** A translatable value. English is required; Nepali falls back to English when missing. */
export type Localized<T = string> = { en: T; ne?: T | null };

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin';

export type OpeningHours = {
  /** schema.org day names, e.g. ["Sunday","Monday"] */
  days: string[];
  opens: string; // "09:30"
  closes: string; // "18:00"
};

export type SiteSettings = {
  name: string;
  legal_name: string;
  tagline: Localized;
  description: Localized;
  founded_year: number;
  url: string;
  phone: string;
  whatsapp: string; // digits only incl. country code, e.g. 9779845762340
  email: string;
  maps_url: string;
  social: { platform: SocialPlatform; url: string }[];
  /** Next intake used by the homepage countdown. ISO date. */
  next_intake: { label: Localized; deadline: string } | null;
  announcement: Localized | null;
  updated_at: string;
};

export type Office = {
  id: string;
  name: Localized;
  is_head_office: boolean;
  street: Localized;
  locality: string; // e.g. "Kathmandu"
  region: string; // e.g. "Bagmati"
  postal_code: string | null;
  country_code: string; // "NP"
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string | null;
  hours: OpeningHours[];
  maps_embed_url: string | null;
  sort: number;
};

export type NavSource = 'destinations' | 'services' | 'test_prep';

export type NavItem = {
  id: string;
  menu: 'header' | 'footer_quick' | 'footer_resources';
  parent_id: string | null;
  label: Localized;
  description: Localized | null;
  href: string | null;
  icon: string | null;
  /** When set, children are generated from that collection (e.g. every published destination). */
  source: NavSource | null;
  sort: number;
  /** Resolved at read time, not stored. */
  children?: NavItem[];
  /** ISO 3166-1 alpha-2 code — renders a flag instead of an icon. */
  flag?: string;
};

export type KeyFacts = {
  avg_tuition: Localized | null;
  living_cost: Localized | null;
  work_rights: Localized | null;
  post_study_visa: Localized | null;
  intakes: Localized | null;
  visa_processing: Localized | null;
  pr_pathway?: Localized | null;
};

export type Destination = {
  slug: string;
  iso3: string; // matches the world-map SVG class names
  iso2: string; // flag file: public/flags/{iso2}.svg
  name: Localized;
  summary: Localized;
  hero_image: string | null;
  lat: number;
  lng: number;
  key_facts: KeyFacts;
  /** Small badge on the destination card, e.g. "160+ universities". */
  badge: Localized | null;
  /** Full country-page content. Null → the page shows only the summary + key facts. */
  details: DestinationDetails | null;
  /** Tool inputs. Null hides the destination from that tool. */
  cost_profile: CostProfile | null;
  requirements: Requirements | null;
  timeline: TimelineStep[] | null;
  /** Optional PDF guide URL offered in the exit-intent popup; falls back to the printable guide page. */
  guide_pdf?: string | null;
  sort: number;
  published: boolean;
  updated_at: string;
};

export type Service = {
  slug: string;
  icon: string;
  title: Localized;
  summary: Localized;
  details: { intro: Localized; points: TextBlock[] } | null;
  sort: number;
  published: boolean;
};

export type TestPrepCourse = {
  slug: string;
  name: Localized;
  summary: Localized;
  icon: string;
  details: TestPrepDetails | null;
  sort: number;
  published: boolean;
};

export type Stat = {
  key: string;
  value: number;
  suffix: string;
  label: Localized;
  /** True until the client confirms the real figure; shown with a warning badge outside production. */
  is_placeholder: boolean;
  sort: number;
};

export type Faq = {
  id: string;
  /** Where it appears: "home", "destination:uk", "tool:emi", "general"… */
  scope: string;
  question: Localized;
  answer: Localized;
  sort: number;
  published: boolean;
};

export type Accreditation = {
  id: string;
  name: string;
  logo: string | null;
  verify_url: string | null;
  is_placeholder: boolean;
  sort: number;
};

/** Reusable icon + title + text blocks, grouped by where they appear. */
export type FeatureGroup = 'edge' | 'why' | 'process' | 'essentials';

export type Feature = {
  id: string;
  group: FeatureGroup;
  icon: string;
  title: Localized;
  text: Localized;
  /** Optional short label, e.g. "Step 1". */
  label: Localized | null;
  href: string | null;
  sort: number;
  published: boolean;
};

export type Testimonial = {
  id: string;
  /** "story" = photo/video success story card, "review" = written review card. */
  kind: 'story' | 'review';
  name: string;
  /** e.g. "MBA · University of Sydney" */
  meta: Localized;
  country: string | null;
  image: string | null;
  quote: Localized;
  rating: number | null;
  video_url: string | null;
  /** Success-wall fields (stories). */
  destination?: string | null;
  university?: string | null;
  intake?: string | null;
  /** Full story shown in the modal. */
  story?: Localized | null;
  /** True for sample content. Shown with a TODO badge in development, never rendered in production. */
  is_placeholder: boolean;
  sort: number;
  published: boolean;
};

export type Partner = {
  id: string;
  name: string;
  logo: string | null;
  url: string | null;
  country: string | null;
  is_placeholder: boolean;
  sort: number;
  published: boolean;
};

type Heading = { eyebrow: Localized | null; title: Localized; subtitle: Localized | null };

/** One milestone of the hero journey. `icon` is a key from components/home/hero-journey.tsx (unknown keys show a star). */
export type JourneyStep = { icon: string; title: Localized; note: Localized | null };

/** Editable copy and imagery for the homepage (one row in `page_content`, id = "home"). */
export type HomeContent = {
  hero: {
    tag: Localized;
    title: Localized;
    /** Part of `title` rendered in the gold italic accent. Must appear verbatim in the title. */
    highlight: Localized;
    subtitle: Localized;
    image: string;
    primary_cta: Localized;
    secondary_cta: Localized;
    /** Animated route across the hero: first visit → departure → success. Hidden when empty. */
    journey?: JourneyStep[];
  };
  search: { fields: Localized[]; intakes: Localized[] };
  intro: { title: Localized; highlight: Localized; body: Localized };
  services: Heading;
  comprehensive: { title: Localized; body: Localized; chips: Localized[]; cta: Localized };
  destinations: Heading;
  edge: Heading;
  why: Heading;
  stories: Heading;
  process: Heading & { cta: Localized };
  testimonials: Heading;
  cta_banner: { title: Localized; highlight: Localized; body: Localized; cta: Localized; image: string };
  essentials: Heading;
  partners: Heading & { cta: Localized };
  faq: Heading & { image: string; aside_title: Localized; aside_body: Localized };
  tools: Heading;
  team: Heading & { cta: Localized };
  /** Uses site_settings.next_intake for the date; this is just the copy. */
  countdown: { title: Localized; body: Localized; cta: Localized };
  events: Heading & { cta: Localized };
};

/** An official reference shown as a "Source:" citation (answer engines weigh these heavily). */
export type Source = { label: string; url: string; accessed: string };

export type TextBlock = { title: Localized; text: Localized };

export type DestinationDetails = {
  /** Answer-first summary (40–60 words) shown under the page H1. */
  intro: Localized;
  why: TextBlock[];
  costs: {
    answer: Localized;
    tuition: { level: Localized; range: Localized }[];
    living: { item: Localized; amount: Localized }[];
    note: Localized | null;
  };
  courses: Localized[];
  universities: { name: string; city: string; url: string | null }[];
  scholarships: { name: string; detail: Localized; url: string | null }[];
  visa: { answer: Localized; steps: TextBlock[]; total_time: string | null };
  documents: Localized[];
  /** Answer-first paragraph on part-time work rules. */
  work: Localized;
  life: { city: string; text: Localized; nepali_community: Localized | null };
  sources: Source[];
};

export type TestPrepDetails = {
  overview: Localized;
  format: { section: string; duration: string; detail: Localized }[];
  batches: { name: Localized; time: string; days: Localized }[];
  duration: Localized;
  /** Null hides the fee row (e.g. "contact us"). */
  fee: Localized | null;
  mode: 'onsite' | 'online' | 'blended';
  features: Localized[];
  sources: Source[];
};

export type Counsellor = {
  slug: string;
  name: string;
  role: Localized;
  photo: string | null;
  specializations: Localized[];
  languages: string[];
  years_experience: number | null;
  /** Destination slugs this counsellor handles. */
  destinations: string[];
  bio: Localized;
  featured: boolean;
  is_placeholder: boolean;
  sort: number;
  published: boolean;
};

/** Heading block reused by listing pages (destinations, team, test prep, services). */
export type PageHeading = { eyebrow: Localized | null; title: Localized; highlight: Localized | null; subtitle: Localized | null; image: string | null };

export type AboutContent = {
  hero: PageHeading;
  story: { title: Localized; body: Localized[] };
  mission: Localized;
  vision: Localized;
  values: TextBlock[];
  milestones: { year: string; text: Localized }[];
};

export type ParentsContent = {
  hero: PageHeading;
  intro: Localized;
  sections: (TextBlock & { icon: string })[];
  cost_example: { title: Localized; note: Localized; rows: { item: Localized; amount: Localized }[] };
  form_title: Localized;
};

export type ContactContent = {
  hero: PageHeading;
  form_title: Localized;
  form_intro: Localized;
};

export type DocContent = {
  title: Localized;
  intro: Localized | null;
  sections: { heading: Localized; body: Localized[] }[];
  updated: string;
  /** True until a lawyer has reviewed the text. */
  needs_review: boolean;
};

/** Every row of `page_content` and its shape. */
export type PageContentMap = {
  home: HomeContent;
  about: AboutContent;
  'for-parents': ParentsContent;
  contact: ContactContent;
  destinations: PageHeading;
  team: PageHeading;
  'test-prep': PageHeading;
  services: PageHeading;
  'privacy-policy': DocContent;
  terms: DocContent;
  'cookie-policy': DocContent;
  'editorial-policy': DocContent;
  tools: ToolsConfig;
  booking: BookingSettings;
  enquiry: EnquiryContent;
  portal: import('./portal').PortalContent;
  chat: import('./chat').ChatContent;
};

/** Multi-step enquiry form: hero + the answer options for each question. */
export type EnquiryContent = {
  hero: PageHeading;
  needs: { value: string; label: Localized }[];
  levels: { value: string; label: Localized }[];
};
export type PageId = keyof PageContentMap;
