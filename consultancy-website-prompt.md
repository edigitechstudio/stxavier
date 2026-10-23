# PROJECT BRIEF: Premium Study-Abroad Consultancy Website & Student Platform

You are a senior full-stack engineer and technical SEO specialist. Build a complete, production-ready website and student platform for a study-abroad education consultancy based in Kathmandu, Nepal. The site must look premium, load fast on Nepali mobile networks, convert visitors into counselling bookings, and be fully optimized for **SEO** (Google), **AEO** (Answer Engine Optimization: featured snippets, People Also Ask, voice search), and **GEO** (Generative Engine Optimization: being cited by ChatGPT, Gemini, Perplexity, Claude, and Google AI Overviews).

Work in phases (see "Build Order" at the end). After each phase, stop, summarise what you built, list anything I need to provide, and wait for my go-ahead.

---

## 0. Client details (fill these in before starting)

```
CONSULTANCY_NAME: [St.Xavier Educational Network]
TAGLINE: [ठाउँ एक, गन्तव्य अनेक]
DOMAIN: [https://stxavier.com.np/]
ADDRESS: [full address, Kathmandu]
PHONE: [01-5333081]
WHATSAPP: [9845762340]
EMAIL: [info@stxavier.com.np]
GOOGLE_MAPS_LINK: [https://maps.app.goo.gl/nVHG7DMWoHEQ5cw29]
SOCIAL_LINKS: [Facebook, Instagram, TikTok, YouTube, LinkedIn]
ESTABLISHED_YEAR: [2012]
REGISTRATION: [MoEST registration no., ICEF / British Council / other accreditations]
DESTINATIONS: [UK, Australia, Canada, USA, New Zealand, Cyprus, Japan, ...]
TEST_PREP_CLASSES: [IELTS, PTE, TOEFL, Japanese language, ...]
BRAND_COLOR_PRIMARY: [#0061a5]
BRAND_COLOR_ACCENT: [#d41922]
LOGO: ["C:\Users\acer\Downloads\272901986_3040183696268987_2408507914796402673_n.jpg"]
```

Until real content is provided, use realistic placeholder content clearly marked with `TODO:` so I can find and replace it. Never invent fake accreditation numbers, fake reviews, or fake visa statistics in a way that could ship unnoticed. Keep them in clearly marked placeholder data files.

---

## 1. Tech stack

- **Framework:** Next.js (latest stable, App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animation:** Framer Motion (UI) + GSAP ScrollTrigger only where needed; respect `prefers-reduced-motion`
- **Backend / DB / Auth / Storage:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **CMS for content:** MDX files for blogs/guides initially, structured so a headless CMS (Sanity or Payload) can be swapped in later
- **Forms & validation:** React Hook Form + Zod
- **Email:** Resend (booking confirmations, lead notifications)
- **i18n:** next-intl with English (`/en`) and Nepali (`/ne`) routes
- **Analytics:** Google Analytics 4 + Meta Pixel + Microsoft Clarity, loaded with `next/script` after consent and without blocking render
- **Images:** `next/image`, AVIF/WebP, proper `sizes`, blur placeholders
- **Deployment target:** Vercel

Keep the folder structure clean: `app/`, `components/`, `lib/`, `data/`, `content/`, `types/`. All placeholder/business data lives in `data/` as typed TS/JSON files so non-developers can edit it.

---

## 2. Design system (premium look)

- Restrained palette: 1 primary brand colour + 1 accent + neutrals. No rainbow gradients.
- Typography: a premium display font for headings (e.g. "Plus Jakarta Sans" or "Sora") + a highly readable body font (e.g. "Inter"), loaded via `next/font`. Also support a Nepali-friendly font (e.g. "Mukta") for the `/ne` locale.
- Generous whitespace, 8px spacing scale, large rounded corners, soft layered shadows, subtle glassmorphism on cards over imagery.
- Micro-interactions: button hover lift, animated checkmarks on success, skeleton loaders, smooth accordion transitions.
- Scroll-reveal animations: subtle fade/slide, never blocking content or hurting LCP.
- Dark/light mode toggle (next-themes), with both modes fully designed.
- Custom illustration / 3D-style icon slots instead of generic icon packs (use Lucide as a fallback).
- Fully responsive, mobile-first. Most traffic will be mobile.
- Accessibility: WCAG 2.2 AA, semantic HTML, keyboard navigable, visible focus states, alt text, proper contrast, aria labels.

---

## 3. Site pages & features

### 3.1 Global layout
- Sticky header with mega-menu: Destinations, Services, Test Prep, Tools, Resources, About, Contact.
- Language switcher (EN / नेपाली) and theme toggle.
- **Floating WhatsApp button** with a pre-filled message that changes per page (e.g. "Hi, I'm interested in studying in the UK").
- **Sticky mobile CTA bar** at the bottom: Call · WhatsApp · Book Counselling.
- Rich footer: NAP (name, address, phone), map embed, office hours, quick links, social links, accreditation badges, newsletter signup.
- Cookie consent banner.

### 3.2 Homepage
1. **Hero:** muted autoplay looping video background (with poster image fallback and a lightweight mobile version), rotating destination headline ("Study in **UK / Australia / Canada / ...**"), two CTAs: "Check My Eligibility" and "Book Free Counselling".
2. **Animated stats strip:** visas approved, partner universities, success rate, years of experience. Counts up when scrolled into view.
3. **Partner university logo marquee:** infinite slow scroll, pauses on hover.
4. **Destination cards** linking to country pages.
5. **Interactive tools teaser:** cards for the eligibility checker, cost calculator, scholarship finder, etc.
6. **Visa success wall preview** + video testimonial reels.
7. **Why choose us:** process timeline (Counselling → Test Prep → Application → Offer → Visa → Pre-departure).
8. **Counsellor highlights.**
9. **Intake countdown timer** (e.g. "September 2027 intake closes in X days"), driven by a date in `data/`.
10. **Upcoming events / webinars.**
11. **FAQ section** (answer-first format, with FAQ schema).
12. **Final CTA band** + Google reviews widget.

### 3.3 Interactive tools (each on its own indexable page with explanatory content + FAQ below the tool)
1. **Eligibility Checker / Course Finder:** multi-step quiz (academic level, GPA/percentage, English test & score, budget in NPR, preferred countries, intake, field of study). Outputs recommended countries, course types, and sample universities with a match score. Ends with a lead-capture step (name, phone, email) before showing full results, and saves the lead to Supabase.
2. **Cost of Study Calculator:** select country, level, and city tier. Shows tuition + living costs per year and total, with a years slider. Live conversion to NPR (exchange rates from an API with a cached fallback). Shareable result URL and downloadable PDF summary.
3. **Scholarship Finder:** filter by country, level, GPA, and field. Data from `data/scholarships`.
4. **IELTS / PTE Band Calculator:** enter section scores, get the overall band per official rounding rules, and see which listed universities or visa categories accept it.
5. **GPA ↔ Percentage Converter:** supports NEB (+2) and TU / Nepali university grading.
6. **Visa Timeline Planner:** pick a target intake and get a reverse-calculated timeline (test date, application, offer, deposit, visa filing, flight), downloadable as PDF / addable to Google Calendar (.ics).
7. **Document Checklist Generator:** choose country + level and get an interactive checklist with checkboxes (state saved in localStorage), downloadable as PDF.
8. **Country Comparison Tool:** compare 2–3 countries side by side (tuition, living cost, part-time work hours, post-study work visa, PR pathway, intakes, visa processing time).
9. **Education Loan EMI Calculator:** principal, rate, and tenure, plus a breakdown chart.

### 3.4 Destination pages (`/study-in/[country]`)
- Hero with country imagery and key facts card (average fees, work rights, post-study visa, intakes, processing time).
- Sections: Why study here, top courses, top universities, cost breakdown, scholarships, visa process step-by-step, required documents, part-time work rules, "Life in [City]" (with Nepali community info), FAQs.
- **Interactive world map** on the `/destinations` index page: hover/tap a country to see a quick info card. Use SVG, not a heavy map library.
- Clear "Last updated: [date]" stamp on every page (important for AEO/GEO freshness).

### 3.5 University directory
- University cards with logo, ranking, location, fee range, intakes, and popular courses.
- Filters: country, ranking range, fee range, intake, course field. Search with debounce. Filter state in URL query params.
- Individual university pages (`/universities/[slug]`) with full details and an enquiry CTA.

### 3.6 Trust & social proof
- **Visa Success Wall** (`/success-stories`): masonry grid of student photos with name, university, country, and intake. Click opens a modal with the full story. Filter by country.
- **Video testimonials** in 9:16 reel format; autoplay muted on hover (desktop) / in view (mobile); lazy loaded.
- **Google Reviews widget** (Places API or an embed) with aggregate rating.
- **Counsellor profiles** (`/team`): photo, specialization, languages, years of experience, "Book with [Name]" button.
- **Accreditation badges** section with links to verification where possible.

### 3.7 Booking & lead capture
- **Appointment booking system:** choose counsellor → mode (office visit / Zoom / WhatsApp call) → date → available time slot → details. Slots managed in Supabase; prevent double booking. Send confirmation email to the student and notification to the consultancy.
- **Multi-step enquiry form:** one question per screen, progress bar, Zod validation, Nepali phone number validation.
- **Exit-intent popup** (desktop) / scroll-depth popup (mobile) offering a free downloadable country guide PDF in exchange for name + email + phone. Shown max once per session, easy to close.
- All leads stored in Supabase with source page, UTM parameters, and timestamp.

### 3.8 Student portal (`/portal`, authenticated)
- Supabase Auth: email OTP / magic link + Google sign-in.
- **Application tracker** as a visual stepper: Documents → Applied → Offer Received → CAS/COE → Visa Lodged → Visa Granted → Pre-departure.
- **Document upload** to Supabase Storage with status tags (Pending / Verified / Re-upload needed) and counsellor comments.
- **Notifications** panel for deadlines and missing documents.
- **Pre-departure resources** unlocked after visa approval (packing list, airport pickup info, accommodation tips, Nepali community contacts).
- Row Level Security so students only see their own data.

### 3.9 Admin dashboard (`/admin`, role-protected)
- Manage leads (list, filter, status, notes, CSV export).
- Manage bookings and counsellor availability.
- Update student application stages and verify documents.
- Manage success stories, events, and scholarships (or document how this is done via the CMS / data files).

### 3.10 Content & engagement
- **Blog / news** (`/blog`) with filters by country, topic (visa updates, scholarships, test prep, student life), and level. Author boxes, reading time, table of contents, related posts.
- **Events & university visits calendar** with RSVP form.
- **Webinars** section with registration and past recordings.
- **FAQ hub** (`/faq`) with instant client-side search, grouped by topic.
- **AI chat assistant** widget: answers from the consultancy's own FAQ and destination content (retrieval over local content via an API route), always offers handoff to WhatsApp or booking, and clearly states it is an AI assistant. Build the UI and API route with the model provider configurable via env vars.
- **"For Parents" page** in both English and Nepali: safety, total cost breakdown, loan options, how the consultancy supports students abroad, and a parent enquiry form.
- **Test prep pages** for IELTS/PTE classes: schedule, batch timings, fees, free mock test signup.

---

## 4. SEO requirements (Google)

- Server-rendered / statically generated pages for all public content (SSG + ISR where data changes).
- Next.js Metadata API on every route: unique title (≤60 chars), meta description (≤155 chars), canonical URL, Open Graph + Twitter cards. Generate dynamic OG images with `next/og`.
- `hreflang` tags for `en` and `ne` + `x-default`.
- Auto-generated `sitemap.xml` (split by type if large) and `robots.txt`.
- Clean, keyword-rich URLs: `/study-in/uk`, `/study-in/australia/scholarships`, `/tools/ielts-band-calculator`.
- One H1 per page, logical H2/H3 hierarchy, descriptive internal anchor text.
- Breadcrumbs on all inner pages (visible + schema).
- Internal linking: each country page links to related tools, scholarships, universities, and blog posts; build a related-content component.
- Local SEO: consistent NAP everywhere, embedded Google Map, location-specific landing pages (e.g. "Study abroad consultancy in Kathmandu", "IELTS classes in [area]").
- Core Web Vitals targets on mobile: **LCP < 2.0s, INP < 200ms, CLS < 0.05**. Lighthouse 95+ on Performance, Accessibility, Best Practices, SEO.
- Lazy load below-the-fold media, preload the hero poster image, avoid layout shift from fonts/embeds.
- Custom 404 page with search and helpful links.
- 301 redirect map file ready for migrating old URLs.

## 5. AEO requirements (Answer Engine Optimization)

- Write content in **answer-first format**: each section starts with a direct 40–60 word answer to the question in its heading, then expands.
- Use question-based H2/H3 headings that match how students actually search and speak (e.g. "How much does it cost to study in the UK from Nepal?", "Can I work part-time while studying in Australia?").
- Include comparison tables, numbered steps, and bullet lists where they suit snippet formats.
- JSON-LD schema (validated) on relevant pages:
  - `Organization` / `EducationalOrganization` + `LocalBusiness` (with geo, opening hours, sameAs social links, aggregateRating if real reviews exist)
  - `WebSite` with `SearchAction`
  - `FAQPage` on FAQ sections
  - `HowTo` on visa process / application step pages
  - `BreadcrumbList` on all inner pages
  - `Article` / `BlogPosting` with author `Person` and dates
  - `Course` for test prep classes
  - `Event` for events and webinars
  - `Review` / `AggregateRating` only with real review data
  - `Person` for counsellors
  - `Speakable` on key answer sections
- Create a reusable `<JsonLd />` component and typed schema builders in `lib/schema/`.

## 6. GEO requirements (Generative Engine Optimization)

- Add an `/llms.txt` (and `/llms-full.txt`) file summarising the consultancy, its services, destinations, and links to key pages in clean Markdown.
- `robots.txt` explicitly allows reputable AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Bingbot). Keep `/portal` and `/admin` disallowed for all bots.
- Make the brand a clear **entity**: consistent name, description, founding year, location, and `sameAs` links across schema, About page, and footer.
- Content must be **citation-worthy**: include specific facts, figures, dates, and official source links (e.g. UKVI, Australian Department of Home Affairs, IRCC) with "Source:" citations and "Last updated" dates.
- Strong **E-E-A-T** signals: author bios with credentials, counsellor experience, real case studies, accreditation proof, editorial/review policy page.
- Self-contained, quotable sections: each H2 section should make sense if extracted alone by an AI.
- Provide key facts in structured, machine-readable form (tables, definition lists, consistent key-fact cards per country).
- Ensure all important content is in the server-rendered HTML, not hidden behind client-only JS, tabs that don't render, or images of text.

---

## 7. Security, privacy & quality

- Environment variables in `.env.example` with documentation; never hardcode keys.
- Rate limiting + honeypot / Cloudflare Turnstile on all public forms and the AI chat endpoint.
- Supabase Row Level Security on every table; role-based access for admin.
- File upload limits, type validation, and virus-safe handling for documents.
- Privacy policy, terms, and cookie policy pages (placeholder text marked `TODO:` for legal review).
- ESLint + Prettier, typed throughout, no `any` without a reason.
- Basic tests for calculators (unit tests for band calculation, GPA conversion, EMI, cost calculation logic).
- Error boundaries and loading states on every route.

---

## 8. Build order (stop for my review after each phase)

1. **Phase 1 – Foundation:** project setup, design system, fonts, theme, i18n, layout (header, footer, floating buttons, mobile CTA bar), data file structure, SEO/schema utilities, sitemap, robots, llms.txt.
2. **Phase 2 – Core marketing pages:** homepage (all sections), destinations index with interactive map, country page template, about, team, contact, For Parents, test prep pages.
3. **Phase 3 – Interactive tools:** all 9 tools with their content pages and FAQ schema.
4. **Phase 4 – Trust & content:** success stories wall, testimonials, reviews widget, university directory, blog (MDX), events, webinars, FAQ hub.
5. **Phase 5 – Lead capture & booking:** Supabase setup, multi-step enquiry, booking system, exit-intent popup, emails, lead storage with UTM tracking.
6. **Phase 6 – Student portal & admin dashboard.**
7. **Phase 7 – AI chat assistant.**
8. **Phase 8 – Final optimization:** Lighthouse/Core Web Vitals pass, accessibility audit, schema validation, broken link check, cross-browser and mobile testing, README with setup + deployment + content-editing guide.

At the start, before writing code, give me:
- the full folder structure,
- the Supabase database schema (tables, relations, RLS policies),
- the list of pages/routes,
- and any questions about missing client details.
