import type { Localized } from './content';

export type University = {
  slug: string;
  name: string;
  /** Destination slug. */
  country: string;
  city: string;
  logo: string | null;
  image: string | null;
  /** World ranking position and its source (e.g. "QS 2026"). Null = not ranked / not verified. */
  ranking: number | null;
  ranking_source: string | null;
  /** Typical annual international tuition range, in `currency`. */
  fee_min: number | null;
  fee_max: number | null;
  currency: string;
  /** Intake months, 1–12. */
  intakes: number[];
  /** Field keys (see tools config `fields`). */
  fields: string[];
  popular_courses: Localized[];
  description: Localized;
  website: string | null;
  is_partner: boolean;
  is_placeholder: boolean;
  sort: number;
  published: boolean;
  updated_at: string;
};

export type EventKind = 'event' | 'webinar' | 'university_visit';

export type SiteEvent = {
  slug: string;
  kind: EventKind;
  title: Localized;
  summary: Localized;
  description: Localized[];
  /** ISO datetimes with offset, e.g. 2026-11-20T15:00:00+05:45 */
  starts_at: string;
  ends_at: string | null;
  venue: Localized | null;
  online_url: string | null;
  recording_url: string | null;
  image: string | null;
  capacity: number | null;
  /** Destination slugs this event is about (for filtering). */
  countries: string[];
  is_placeholder: boolean;
  published: boolean;
};

export type BlogTopic = 'visa' | 'scholarships' | 'test-prep' | 'student-life' | 'costs' | 'guides';
export const BLOG_TOPICS: BlogTopic[] = ['visa', 'scholarships', 'test-prep', 'student-life', 'costs', 'guides'];

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string; // counsellor slug or "editorial"
  topic: BlogTopic;
  countries?: string[];
  levels?: string[];
  cover?: string;
  /** Hide from listings and sitemap. */
  draft?: boolean;
  /** True until the content has been fact-checked by the team. */
  needs_review?: boolean;
};

export type BlogPostMeta = BlogFrontmatter & {
  slug: string;
  locale: string;
  readingMinutes: number;
  headings: { id: string; text: string; depth: 2 | 3 }[];
  /** 'db' = written in the dashboard (rendered as plain Markdown); 'file' = MDX in content/blog. */
  source: 'db' | 'file';
};

export type GoogleReview = {
  author: string;
  authorUrl: string | null;
  photo: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
};

export type GoogleReviews = {
  rating: number;
  count: number;
  url: string | null;
  reviews: GoogleReview[];
};
