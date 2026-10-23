# St. Xavier Educational Network — Build Plan (Phase 0)

Source brief: `consultancy-website-prompt.md`. This document covers what the brief asks for before code:
folder structure, Supabase schema, routes, and open questions.

## Decisions taken

| Topic | Decision |
|---|---|
| Existing Vite prototype | Replaced by Next.js. Its section designs (hero, map, carousels, FAQ, footer) are ported into the new component system. The Vite files move to `legacy/` until Phase 2 is approved, then get deleted. |
| Brand | Primary `#0061a5` (globe ring blue), accent `#d41922` (logo red), neutrals only. Logo from the supplied JPG → cleaned SVG/PNG in `public/brand/`. |
| Fonts | Headings: Plus Jakarta Sans · Body: Inter · Nepali (`/ne`): Mukta — all via `next/font`. |
| Locales | `/en` (default, `x-default`) and `/ne`. `/admin` is English-only. |
| Destination slugs | `uk`, `australia`, `canada`, `usa`, `new-zealand`, `cyprus`, `japan` (more can be added in `data/destinations`). |
| Rate limiting | Upstash Redis (free tier) via `@upstash/ratelimit`; falls back to an in-memory limiter locally. |
| Bot protection | Cloudflare Turnstile + honeypot on every public form and `/api/chat`. |
| Writes from public forms | Always go through Next.js route handlers using the Supabase service role, after Zod + Turnstile + rate-limit checks. Anonymous users get **no** direct insert rights in Postgres. |
| Content that changes rarely | Universities, scholarships, success stories, FAQs, destinations, counsellor bios, stats → typed files in `data/`. Blog/guides → MDX in `content/`. Dynamic, user-generated or admin-edited records → Supabase. |
| Placeholders | Every invented value is tagged `// TODO:` and lives only in `data/`. Stats, reviews and accreditation numbers render with a visible "placeholder" badge in dev builds so they can't ship unnoticed. |

## Dynamic content (client requirement: "everything dynamic, scalable")

All business content lives in Supabase tables, not in code. Pages read it only through
`lib/content` (cached with `'use cache'` + tags). Editing a row fires a Supabase DB webhook →
`/api/revalidate` → `revalidateTag`, so changes go live in seconds with no redeploy.

- When Supabase is not configured, the same readers fall back to the typed seed files in
  `data/seed` (used for local dev and as the source for `npm run seed`).
- Translatable fields are `{ en, ne }` JSON; Nepali falls back to English when blank.
- Menus are data too: a nav item with `source: 'destinations'` lists every published
  destination automatically, so adding a country/service/course updates the menu, footer,
  sitemap and `llms.txt` with no code change.
- Placeholder figures (`is_placeholder`) show a TODO badge in development and are never
  rendered in production.
- Phase 6's admin dashboard edits these tables; until then they can be edited in the Supabase
  table editor.

## Folder structure

```
stxavier/
├─ app/
│  ├─ [locale]/
│  │  ├─ layout.tsx                 # html lang, fonts, theme, header/footer, floating CTAs, consent
│  │  ├─ page.tsx                   # homepage
│  │  ├─ loading.tsx · error.tsx · not-found.tsx
│  │  ├─ about/ · contact/ · team/[slug]/ · for-parents/ · services/[slug]/
│  │  ├─ destinations/              # interactive SVG map index
│  │  ├─ study-in/[country]/        # country template
│  │  │  ├─ scholarships/ · universities/ · cost/
│  │  ├─ locations/[place]/         # local SEO landings ("study abroad consultancy in kathmandu")
│  │  ├─ test-prep/ · test-prep/[exam]/
│  │  ├─ tools/ · tools/[tool]/     # 9 calculators, each a static page + client island
│  │  ├─ universities/ · universities/[slug]/
│  │  ├─ success-stories/
│  │  ├─ blog/ · blog/[slug]/ · blog/topic/[topic]/
│  │  ├─ events/ · events/[slug]/ · webinars/
│  │  ├─ faq/
│  │  ├─ book/ · enquiry/
│  │  ├─ portal/                    # auth-protected student area
│  │  │  ├─ login/ · documents/ · notifications/ · pre-departure/
│  │  └─ (legal)/privacy-policy/ · terms/ · cookie-policy/ · editorial-policy/
│  ├─ admin/                        # role-protected, not localized
│  │  ├─ leads/ · bookings/ · availability/ · applications/ · documents/
│  ├─ api/
│  │  ├─ leads/ · bookings/ · bookings/slots/ · rsvp/ · newsletter/
│  │  ├─ chat/ · exchange-rates/ · og/
│  ├─ auth/callback/route.ts
│  ├─ sitemap.ts · robots.ts
│  ├─ llms.txt/route.ts · llms-full.txt/route.ts
│  └─ global-error.tsx
├─ components/
│  ├─ ui/                 # shadcn primitives
│  ├─ layout/             # Header, MegaMenu, Footer, MobileCtaBar, WhatsAppFab, LocaleSwitch, ThemeToggle, CookieBanner
│  ├─ sections/           # homepage + reusable marketing sections
│  ├─ tools/              # one folder per calculator (UI only)
│  ├─ forms/              # MultiStepEnquiry, BookingWizard, LeadCapture, ExitIntent
│  ├─ seo/                # JsonLd, Breadcrumbs, LastUpdated, SourceCitation, RelatedContent
│  ├─ portal/ · admin/ · chat/
│  └─ motion/             # Reveal, CountUp, Marquee (all reduced-motion aware)
├─ lib/
│  ├─ schema/             # typed JSON-LD builders (organization, faq, howTo, course, event, person, breadcrumb…)
│  ├─ seo/                # metadata helpers, hreflang, canonical
│  ├─ calc/               # pure functions: band, gpa, emi, cost, timeline (+ unit tests)
│  ├─ supabase/           # server / browser / service clients, typed DB types
│  ├─ validation/         # Zod schemas (incl. Nepali phone)
│  ├─ email/              # Resend templates
│  ├─ ratelimit.ts · turnstile.ts · utm.ts · ics.ts · pdf.ts
├─ data/                  # editable business data (typed TS)
│  ├─ site.ts · stats.ts · destinations/ · universities/ · scholarships/
│  ├─ counsellors.ts · success-stories.ts · faqs/ · events.ts · intakes.ts · test-prep.ts · redirects.ts
├─ content/
│  ├─ blog/*.mdx · guides/*.mdx
├─ messages/en.json · messages/ne.json   # UI strings (next-intl)
├─ supabase/migrations/*.sql · supabase/seed.sql
├─ types/
├─ public/brand/ · public/images/ · public/video/
├─ tests/                 # Vitest
├─ middleware.ts          # next-intl + auth gate for /portal and /admin
└─ .env.example
```

## Supabase schema

Relations: `profiles 1–1 auth.users` · `counsellors 0..1–1 profiles` · `bookings N–1 counsellors` ·
`leads 1–N lead_notes / bookings / event_rsvps` · `applications N–1 profiles (student)` ·
`applications 1–N documents / application_stage_history` · `notifications N–1 profiles`.

```sql
create extension if not exists btree_gist;

create type user_role       as enum ('student','counsellor','admin');
create type lead_source     as enum ('enquiry','eligibility','guide_download','parent','booking','event_rsvp','newsletter','chat','contact');
create type lead_status     as enum ('new','contacted','qualified','converted','lost');
create type booking_mode    as enum ('office','zoom','whatsapp');
create type booking_status  as enum ('pending','confirmed','cancelled','completed','no_show');
create type app_stage       as enum ('documents','applied','offer_received','cas_coe','visa_lodged','visa_granted','pre_departure');
create type doc_status      as enum ('pending','verified','reupload_needed');
create type event_kind      as enum ('event','webinar','university_visit');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'student',
  full_name text, phone text, locale text default 'en',
  created_at timestamptz default now()
);

create table counsellors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles on delete set null,
  slug text unique not null, name text not null, email text,
  is_active boolean default true
);  -- bio, photo, languages, specialization stay in data/counsellors.ts (keyed by slug)

create table counsellor_availability (
  id uuid primary key default gen_random_uuid(),
  counsellor_id uuid not null references counsellors on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null, end_time time not null,
  slot_minutes smallint not null default 30,
  modes booking_mode[] not null default '{office,zoom,whatsapp}'
);

create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  counsellor_id uuid not null references counsellors on delete cascade,
  on_date date not null, blocked boolean default true,
  start_time time, end_time time, reason text
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  source lead_source not null, status lead_status not null default 'new',
  name text not null, phone text not null, email text,
  payload jsonb default '{}',            -- quiz answers, country of interest, etc.
  page_path text, referrer text, locale text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  assigned_to uuid references profiles,
  created_at timestamptz default now()
);
create index on leads (created_at desc);
create index on leads (status, source);

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads on delete cascade,
  author_id uuid not null references profiles, body text not null,
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  counsellor_id uuid not null references counsellors,
  lead_id uuid references leads, student_id uuid references profiles,
  mode booking_mode not null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  status booking_status not null default 'pending',
  notes text, created_at timestamptz default now(),
  -- hard guarantee against double booking
  exclude using gist (counsellor_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status in ('pending','confirmed'))
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  counsellor_id uuid references counsellors,
  country text not null, university text, course text, intake text,
  stage app_stage not null default 'documents',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table application_stage_history (
  id bigserial primary key,
  application_id uuid not null references applications on delete cascade,
  from_stage app_stage, to_stage app_stage not null,
  changed_by uuid references profiles, note text,
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications on delete cascade,
  student_id uuid not null references profiles on delete cascade,
  doc_type text not null, storage_path text not null unique,
  file_name text not null, mime text not null, size_bytes int not null check (size_bytes <= 10485760),
  status doc_status not null default 'pending', counsellor_comment text,
  reviewed_by uuid references profiles, reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind text not null, title text not null, body text, link text,
  due_at timestamptz, read_at timestamptz, created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, kind event_kind not null,
  title text not null, description text,
  starts_at timestamptz not null, ends_at timestamptz,
  venue text, online_url text, recording_url text, capacity int,
  published boolean default false
);

create table event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  lead_id uuid references leads, name text not null, phone text not null, email text not null,
  created_at timestamptz default now(), unique (event_id, email)
);

create table newsletter_subscribers (
  email text primary key, locale text default 'en',
  created_at timestamptz default now(), unsubscribed_at timestamptz
);
```

### Row Level Security

RLS is enabled on **every** table. Helpers (security definer, stable):
`is_staff()` = role in (counsellor, admin) · `is_admin()` = role = admin.

| Table | Anonymous | Student (own rows) | Counsellor | Admin |
|---|---|---|---|---|
| profiles | — | select / update own (role column locked by trigger) | select | all |
| counsellors, counsellor_availability, availability_exceptions | select active | select | select; update own availability | all |
| leads, lead_notes | — (insert only via API + service role) | — | select / update / insert notes | all + delete |
| bookings | — (insert via API) | select own; cancel own via RPC | select / update | all |
| applications, application_stage_history | — | select own | select / insert / update | all |
| documents | — | select own; insert own (status forced `pending`); replace only when `reupload_needed` (RPC) | select; update status/comment | all |
| notifications | — | select own; update `read_at` own | insert | all |
| events | select where `published` | same | all | all |
| event_rsvps, newsletter_subscribers | — (insert via API) | — | select | all |

**Storage:** private bucket `student-documents`, path `{student_id}/{application_id}/{uuid}.{ext}`.
Policies: insert/select where `(storage.foldername(name))[1] = auth.uid()::text`; staff select all.
Limits: 10 MB, MIME `application/pdf`, `image/jpeg`, `image/png`. Server re-checks magic bytes; files are served only through short-lived signed URLs.
Public bucket `site-media` for event/success-story images (staff write).

## Routes

All public routes exist under both `/en/…` and `/ne/…`.

| Route | Rendering | Notes / schema |
|---|---|---|
| `/` | SSG | Organization, EducationalOrganization + LocalBusiness, WebSite+SearchAction, FAQPage |
| `/about`, `/contact`, `/for-parents` | SSG | Contact has map embed + NAP; parents form |
| `/team`, `/team/[slug]` | SSG | Person |
| `/services`, `/services/[slug]` | SSG | |
| `/destinations` | SSG | Interactive SVG map |
| `/study-in/[country]` | SSG + ISR | HowTo (visa steps), FAQPage, Breadcrumb, Speakable, "Last updated" |
| `/study-in/[country]/scholarships` · `/universities` · `/cost` | SSG | |
| `/locations/[place]` | SSG | Local SEO landings (Kathmandu + areas) |
| `/test-prep`, `/test-prep/[exam]` (ielts, pte, toefl, japanese) | SSG | Course |
| `/tools` | SSG | |
| `/tools/eligibility-checker` | SSG + client | lead capture → Supabase |
| `/tools/cost-calculator` | SSG + client | shareable URL, PDF |
| `/tools/scholarship-finder` | SSG + client | |
| `/tools/ielts-band-calculator`, `/tools/pte-score-calculator` | SSG + client | |
| `/tools/gpa-percentage-converter` | SSG + client | NEB + TU scales |
| `/tools/visa-timeline-planner` | SSG + client | PDF + .ics |
| `/tools/document-checklist` | SSG + client | localStorage, PDF |
| `/tools/country-comparison` | SSG + client | |
| `/tools/education-loan-emi-calculator` | SSG + client | chart |
| `/universities`, `/universities/[slug]` | SSG + ISR | filters in URL params |
| `/success-stories` | SSG + ISR | masonry, modal, country filter |
| `/blog`, `/blog/[slug]`, `/blog/topic/[topic]` | SSG | BlogPosting + Person author |
| `/events`, `/events/[slug]`, `/webinars` | ISR | Event |
| `/faq` | SSG | FAQPage, client-side search |
| `/book`, `/enquiry` | SSR shell + client | booking wizard / multi-step form |
| `/privacy-policy`, `/terms`, `/cookie-policy`, `/editorial-policy` | SSG | TODO legal review |
| `/portal/login`, `/portal`, `/portal/documents`, `/portal/notifications`, `/portal/pre-departure` | dynamic, auth | noindex |
| `/admin`, `/admin/leads`, `/admin/bookings`, `/admin/availability`, `/admin/applications`, `/admin/documents` | dynamic, admin role | noindex |
| `/api/leads`, `/api/bookings`, `/api/bookings/slots`, `/api/rsvp`, `/api/newsletter`, `/api/chat`, `/api/exchange-rates`, `/api/og` | route handlers | rate-limited, Turnstile |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt` | generated | AI crawlers allowed; `/portal`, `/admin`, `/api` disallowed |
| 404 | static | search + helpful links |

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 1 — Foundation | ✅ Done (2026-10-16) | Next 16, i18n, data layer, SEO/GEO utilities, legacy theme port |
| 2 — Core marketing pages | ✅ Done (2026-10-16) | Home (all sections), /destinations, /study-in/[country], /about, /team(+[slug]), /contact, /for-parents, /test-prep(+[course]), /services(+[slug]), legal pages |
| 3 — Interactive tools | ✅ Done (2026-10-16) | 9 tools + /tools index; NRB live rates; unit tests (`npm test`) + browser e2e (`npm run test:e2e`) |
| 4 — Trust & content | ✅ Done (2026-10-17) | Success wall + reels, Google reviews (Places API), university directory, MDX blog, events/webinars + RSVP, FAQ hub, site search; `npm run test:e2e:content` |
| 5 — Lead capture & booking | ✅ Done (2026-10-17) | /book wizard (counsellor/any → mode → slot → details, Google Calendar + .ics), slot engine in NPT with DB exclusion constraint against double booking, /enquiry one-question-per-screen form, exit-intent guide offer, printable /guides/[country], Resend emails (student + staff), Turnstile on every form; `npm run test:e2e:booking` |
| 6 — Student portal & admin | ✅ Done (2026-10-17) | Magic-link / OTP / Google sign-in, portal (tracker, document upload with magic-byte + active-PDF checks, notifications, pre-departure), /admin (overview, leads + notes + CSV, bookings, availability, applications + document review, users & roles, content publishing), RLS on all tables, private Storage bucket, local demo mode; `npm run test:e2e:portal`. Setup: docs/CONTENT-EDITING.md |
| 7 — AI chat assistant | ✅ Done (2026-10-17) | Floating AI widget (lazy-loaded, EN/NE): BM25 retrieval over the site's own content (destinations, FAQs, services, test prep, contact, booking, blog), streamed answers via the Anthropic SDK (default claude-opus-5-5, low effort, refusal fallbacks) or any OpenAI-compatible API, retrieval-only "basic" mode without a key, sources + WhatsApp/booking/call-back handoff, Turnstile once per chat + signed session, rate limits, safe Markdown rendering; `npm run test:e2e:chat` |
| 8 — Final optimization | ✅ Done (2026-10-18) | Lighthouse: desktop perf 98–100 / mobile 80–97, a11y 100, best practices 100, CLS 0 (removed public `loading.tsx` streaming flash, lazy world map, Devanagari font not preloaded and 2 weights, 1.6 KB favicon, hero images q60, dropped unused toast/tooltip/menu libs). axe WCAG 2.1 AA: 0 violations on all templates, dark, mobile, dialogs, portal, admin. JSON-LD valid on all 166 pages; 0 broken links/anchors; Chromium/Firefox/WebKit × desktop/phone suite; small-phone header, overflow and modal-focus fixes. Audit scripts in `scripts/audit`, README rewritten with deploy + launch checklist |
| + Content editor | ✅ Done (2026-10-18) | /admin/cms: every page (page_content), collection, menu, site setting, blog post (DB + MDX fallback), image (media library) and every interface text (ui_text overrides) editable in EN/NE; shape-validated saves publish instantly; works in local demo mode. Migration 0008; seed no longer overwrites edits; `npm run test:e2e:cms` |


Migrations so far: `0001_content.sql`, `0002_home_and_leads.sql`, `0003_pages_and_team.sql`, `0004_tools.sql`, `0005_trust_content.sql`, `0006_booking.sql`, `0007_portal.sql` — run in order, then `npm run seed`.
