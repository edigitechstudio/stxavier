# St. Xavier Educational Network — website & student platform

The bilingual (English / नेपाली) website, student portal and staff dashboard for St. Xavier Educational Network, a study-abroad consultancy in Kathmandu.

**Stack:** Next.js 16 (App Router, Cache Components, `proxy.ts`) · React 19 · TypeScript · Tailwind CSS 4 · next-intl · Supabase (Postgres, Auth, Storage) · Resend · Cloudflare Turnstile · Anthropic SDK.

- Build plan and phase history: [docs/PLAN.md](docs/PLAN.md). The original brief is [consultancy-website-prompt.md](consultancy-website-prompt.md).
- For the team that edits content and runs the admin: [docs/CONTENT-EDITING.md](docs/CONTENT-EDITING.md).
- To put the site live step by step (free, no domain needed): [docs/DEPLOY.md](docs/DEPLOY.md).

---

## What's in it

| Area | Highlights |
|---|---|
| **Marketing site** (`/en`, `/ne`) | Home, 7 destination pages, test prep, services, about, team, parents, contact. Every text and number comes from the database, with seed fallbacks. |
| **Tools** | Cost calculator, eligibility checker, scholarship finder, GPA converter, IELTS band calculator, education-loan EMI calculator, visa timeline planner, document checklist and country comparison. All have shareable URLs and print/PDF. |
| **Trust & content** | Success stories, Google reviews, university directory, MDX blog, events and webinars with RSVP, FAQ hub, site search |
| **Leads & booking** | Counselling pop-up, multi-step enquiry, exit-intent guide offer, `/book` with counsellor slots (double-booking impossible), email confirmations, UTM tracking |
| **Student portal** (`/portal`) | Email-link / code / Google sign-in, application tracker, document uploads with review status, notifications, pre-departure guide |
| **Staff dashboard** (`/admin`) | Leads (notes, status, CSV), bookings, availability, applications and document review, users and roles |
| **Content editor** (`/admin/cms`) | Every page, collection, menu, image, blog post and piece of interface text is editable in English and Nepali. Saves publish immediately. |
| **AI assistant** | Floating chat that answers only from the site's own content, and hands off to WhatsApp, a booking or a call-back |
| **SEO / GEO** | Per-page metadata, hreflang, JSON-LD (Organization, LocalBusiness, FAQ, HowTo, Course, Article, Breadcrumb…), sitemap, robots, `llms.txt` |

---

## Run locally

Requirements: Node.js 20.9+ (tested on 25), npm.

```bash
npm install
cp .env.example .env.local     # everything may stay blank for local work
npm run dev                    # http://localhost:3000 → /en
```

With blank keys the app runs on the seed content in `data/seed`:
- Forms are logged rather than stored.
- `/portal` and `/admin` run in **demo mode**: one-click sample accounts, data kept in memory (see [docs/CONTENT-EDITING.md §4](docs/CONTENT-EDITING.md)).
- The AI chat answers in **basic mode**, quoting the best-matching passage from the website.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` · `build` · `start` | Develop · production build · serve the build |
| `npm run lint` · `typecheck` · `test` | ESLint · TypeScript (`next typegen` first) · Vitest unit tests |
| `npm run seed` | Upsert `data/seed` into Supabase (needs the service-role key in `.env.local`) |
| `npm run test:e2e` / `:content` / `:booking` / `:portal` / `:chat` / `:cms` | Browser journeys against `npm run dev` (Playwright driving the installed Edge/Chrome) |
| `npm run test:e2e:browsers` | Chromium + Firefox + WebKit, desktop and phone, against a production build |
| `npm run audit:lighthouse [-- --desktop]` | Lighthouse performance / accessibility / best practices / SEO on key pages |
| `npm run audit:a11y [-- --auth-only]` | axe-core WCAG 2.1 AA on every page template, dark mode, mobile and open dialogs. `--auth-only` covers portal and admin; run it against dev |
| `npm run audit:links [-- --external]` | Crawls the sitemap; reports broken internal links, assets and `#anchors` (and outbound links with `--external`) |
| `npm run audit:schema` | Validates every page's JSON-LD against Google's rich-result requirements |
| `npm run audit:content` | Pre-launch checklist: remaining `TODO:` notes, placeholder rows, missing env vars |

The browser tests and audits use `BASE_URL` (default `http://localhost:3000` for e2e, `:3001` for audits). Run the audits against a production build: `npm run build && npx next start -p 3001`. First time only, for cross-browser tests: `npx playwright-core install firefox webkit`.

---

## Environment variables

All of them are documented in [`.env.example`](.env.example). The ones that matter for production:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, emails: `https://stxavier.com.np`. Leave blank on Vercel until the domain is added; the `*.vercel.app` address is used |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Editable content, leads, bookings, portal, uploads |
| `REVALIDATE_SECRET` | Instant publishing of content edits (`/api/revalidate`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Bot protection on every form and the chat |
| `RESEND_API_KEY`, `EMAIL_FROM`, `LEADS_NOTIFY_EMAIL` | Booking confirmations, staff alerts, guide emails |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limits shared across serverless instances (recommended) |
| `ANTHROPIC_API_KEY`, `AI_MODEL`, `AI_EFFORT` | AI chat answers (optional; basic mode without them) |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Live Google rating and reviews (optional) |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID` | Analytics, loaded only after cookie consent (optional) |

Without the production keys, demo mode is impossible in a production build. Sign-in shows "not available" and forms return a clear error.

---

## Deploy

The app is a standard Next.js 16 project. **Vercel** is the simplest host (zero config, image optimisation, edge caching), and any Node host that runs `next start` works too.

1. **Supabase**
   - Create a project.
   - Run `supabase/migrations/0001…0008` in order in the SQL editor.
   - Run `npm run seed` locally with the production keys in `.env.local`.
   - Configure Auth: Site URL, the redirect URL `https://stxavier.com.np/api/auth/callback`, the Google provider, and `{{ .Token }}` in the magic-link email.
   - Make the first admin. All steps are in [docs/CONTENT-EDITING.md §1](docs/CONTENT-EDITING.md).
2. **Resend:** verify `stxavier.com.np` (DNS records), then set `EMAIL_FROM` to an address on it.
3. **Cloudflare Turnstile:** create a widget for `stxavier.com.np`. Optionally add the same keys to Supabase Auth → CAPTCHA.
4. **Upstash Redis** (free tier) for shared rate limiting.
5. **Vercel**
   - Import the repository, add the environment variables, and deploy.
   - Add the domain `stxavier.com.np` (and `www` → redirect).
6. **Publishing on save:** add a Supabase Database Webhook per content table → `POST https://stxavier.com.np/api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>`.
7. **After the first deploy**
   - Submit `https://stxavier.com.np/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
   - Test a few pages in Google's [Rich Results Test](https://search.google.com/test/rich-results).
   - Link the Google Business Profile to the site.

### Pre-launch checklist

- [ ] `npm run audit:content` shows **0 TODO notes** in visible content.
  - Replace the placeholder team, stats, testimonials, events and accreditations, then set `is_placeholder = false`. Placeholders never render in production.
  - Fact-check the blog posts marked `needs_review`.
- [ ] Real office address, coordinates, hours and social links in `site_settings` / `offices`. These must match the Google Business Profile exactly.
- [ ] Counsellor working hours in `counsellor_availability`. `/book` shows "call or WhatsApp us" until at least one verified counsellor has hours.
- [ ] Legal pages (privacy, terms, cookies) reviewed by a lawyer.
- [ ] Hero and content images hosted in Supabase Storage rather than hot-linked from Unsplash.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` pass.
- [ ] Against the production build, these all pass: `audit:a11y`, `audit:links`, `audit:schema`, `test:e2e:browsers`.

---

## Project structure

```
app/
  [locale]/              Public site + /portal (localized: /en, /ne)
  admin/                 Staff dashboard (English, own root layout)
  api/                   leads · bookings · chat · portal documents · auth callback · revalidate · admin export
  sitemap.ts robots.ts manifest.ts llms.txt/ llms-full.txt/
  theme*.css             Design system (legacy navy/gold look), imported by globals.css
components/              UI by area: layout, home, sx (shared), tools, trust, booking, portal, admin, chat, auth
lib/
  content/               The only place pages read business data (Supabase or seed fallback, cached + tagged)
  auth/ portal/ booking/ chat/ email/ seo/ schema/ validation/ …
data/seed/               Fallback + seed content (search "TODO:" for placeholders)
messages/                UI strings: en.json, ne.json
supabase/migrations/     Database schema, RLS policies, storage bucket
scripts/                 seed-content.ts, audit/ (lighthouse, a11y, links, schema, content)
tests/                   Vitest unit tests; tests/e2e/ browser journeys
docs/                    PLAN.md (architecture & phases), CONTENT-EDITING.md (operations)
legacy/                  Original static prototype (design reference only)
```

### Conventions

- **No hard-coded content.** Pages read data through `lib/content` (or `lib/portal` for per-user data). Interface text defaults live in `messages/*.json`; staff can override any entry from the dashboard (`ui_text` table, merged in `lib/i18n/messages.ts`). New content types: add a table, a reader in `lib/content`, and one line in `lib/cms/collections.ts` to make it editable.
- **Caching:** content readers use `'use cache'` with `cacheTag(CONTENT_TAGS.<table>)`. Anything that reads the session goes through `getViewer()` (which calls `connection()`) and sits inside `<Suspense>`.
- **Security:** RLS on every table. Server actions and route handlers re-check the user's role. Uploads are verified by their file contents. Public forms use zod, a honeypot, Turnstile and rate limits.

### Troubleshooting

- **Styles or routes look stale in dev:** stop the server, delete `.next`, then run `npm run typecheck` (which regenerates route types) and `npm run dev`.
- **`PageProps` / `LayoutProps` type errors:** run `npm run typecheck` (it runs `next typegen`).
- **Port 3000 busy after stopping dev:** a previous `next dev` can linger. Find it with `netstat -ano | findstr :3000` and end it with `taskkill /PID <pid> /F /T`.
