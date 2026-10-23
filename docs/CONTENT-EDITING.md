# Editing content, the portal and the admin

How the St. Xavier team keeps the site and the student portal up to date, with no code changes.

## 1. One-time Supabase setup

1. Create a Supabase project. Put the URL, anon key and service-role key in the hosting environment variables (see `.env.example`).
2. Open **SQL Editor** and run every file in `supabase/migrations/` in order (`0001` … `0008`).
3. Load the starter content: `npm run seed` (reads `.env.local`). It only adds what is missing, so it is safe to re-run; `npm run seed -- --force` resets everything to the starter content and **destroys dashboard edits**.
4. **Authentication → URL configuration**
   - Site URL: `https://stxavier.com.np`
   - Redirect URLs: `https://stxavier.com.np/api/auth/callback` (and `http://localhost:3000/api/auth/callback` for local testing)
5. **Authentication → Providers**
   - Email: enabled. Under **Email templates → Magic link**, include `{{ .Token }}` so the email shows the 6-digit code as well as the link.
   - Google: create OAuth credentials in Google Cloud. The authorised redirect URI is the one Supabase shows on the Google provider page.
   - Optional: **Attack protection → CAPTCHA** with Cloudflare Turnstile. Use the same keys as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
6. **Create the first admin.** Sign in once at `/en/portal/login`, then run this in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@stxavier.com.np';
   ```
   After that, give other staff their roles under **Admin → Users & roles**. Each person must sign in once through the portal first.

## 2. Day-to-day work in the admin (`/admin`)

| Task | Where |
|---|---|
| Call back new enquiries, add notes, set status, export CSV | **Leads** |
| Confirm / cancel / complete counselling sessions | **Bookings** |
| Weekly working hours, holidays, leave | **Availability** (applies to `/book` immediately) |
| Open a student file, move stages, verify documents, send deadlines | **Applications** |
| Grant counsellor / admin access | **Users & roles** (admins only) |
| Edit any text, image, page, list or blog post | **Website content** (admins only) — see §3 |

- **Students.** Creating an application for a new email sends that student an invitation. Each stage change and each document review notifies the student in their portal, in their language.
- **Pre-departure.** The checklist unlocks automatically once an application reaches **Visa granted**.

## 3. Editing the website (Admin → Website content)

Everything visitors see can be changed here without a developer. Saving publishes the change immediately.

| What | Where in Website content |
|---|---|
| Phone, WhatsApp, email, social links, tagline, announcement bar, intake countdown, site name (also the logo text) | **Site settings** |
| Headings, intros, hero images and sections of every page (home, about, parents, contact, booking, enquiry, portal, legal pages, each tool…) | **Page text & images** |
| Header and footer menus | **Menus** |
| Country pages: costs, visa steps, documents, work rights, scholarships, guide PDF | **Destinations** |
| Universities, scholarships, English requirements, grading scales | **Study abroad** group |
| Services and IELTS/PTE/TOEFL/Japanese courses (batches, fees) | **Services & classes** group |
| Team, success stories, stats, accreditations, partners | **People & proof** group |
| Events & webinars, FAQs, feature lists, blog posts | **Engagement** group |
| Any fixed wording: buttons, labels, form messages, emails, SEO titles and descriptions | **Interface text** (search box finds any sentence) |
| Photos, logos, banners | **Media library**, or the **Upload / Library** buttons on any image field |

How the editor works:
- **English and Nepali** sit side by side. Leave Nepali empty and the English text is shown on the Nepali site.
- **Lists** (visa steps, fees, batches, FAQs…) have **Add**, **↑ ↓** to reorder and the bin to remove.
- **Published** decides whether an entry appears. New entries start hidden; tick Published when ready. **Is placeholder** marks sample content that never appears on the live site.
- **Duplicate** (copy icon in a list) is the quickest way to add a similar entry, for example a new destination.
- **Delete** asks first. To hide something temporarily, untick Published instead.
- The editor protects the site:
  - it refuses changes that would break a page, such as a wrong field type or a duplicate address (slug);
  - in Interface text it requires the `{variables}` (like `{name}` or `{country}`) to stay.
- **Interface text:** clear a field, or press ↺, to return to the original wording.
- **Blog posts** are written in Markdown (`## Heading`, `**bold**`, `- list`, `[link](/en/contact)`). The starter posts from `content/blog` appear in the list too; editing one saves it to the database.
- **Home hero journey** (Page text & images → Home → Hero → Journey): the animated route from first visit to success abroad. Add, remove or reorder steps; each has a title, a short note and an icon. Icon names: `counselling`, `test-prep`, `application`, `visa`, `departure`, `success`, `trophy`, `career`, `school`, `home`. Remove every step to hide the route.

Editing directly in Supabase's Table Editor still works. Press **Refresh live site** on the Website content page afterwards, or add a **Database Webhook** per content table so it happens on every save:
- Event: insert, update, delete.
- POST to `https://stxavier.com.np/api/revalidate`.
- Header: `Authorization: Bearer <REVALIDATE_SECRET>`.

## 4. Local development without Supabase

When no Supabase keys are set, `npm run dev` runs in **demo mode**:
- The portal and admin login pages offer one-click demo accounts (student, counsellor, admin).
- Data lives in memory and resets when the server restarts. `POST /api/dev/reset-demo` resets it on demand.
- Leads and bookings submitted on the site appear in the admin.
- Website content edits apply to the running site; uploaded images are saved in `public/uploads/`.

Demo mode is impossible in production. A production build without Supabase keys shows "sign-in not available" instead.

## 5. AI chat assistant

The assistant answers only from the website's own content. Better content means better answers: when visitors ask something it can't answer, add a FAQ in **Website content → FAQs**; the assistant uses it as soon as you save.

- **Settings:** Website content → Page text & images → **AI assistant**:
  - `enabled` turns the widget on or off.
  - `assistant_name`, `greeting`, `disclaimer` and `suggestions` are in English and Nepali.
  - `extra_instructions` holds short guidance, e.g. "We are closed for Dashain from 10–15 October."
- **Model:** set in environment variables (see `.env.example`):
  - `ANTHROPIC_API_KEY` turns on AI answers. The default model is `claude-opus-5-5`; set `AI_MODEL=claude-haiku-5-5` for a much cheaper widget.
  - Without a key, the widget runs in basic mode: it quotes the best-matching passage from the website and links to it.
- **Leads:** "Request a call back" in the chat creates a lead with source **AI chat**, including the visitor's questions.
- **Privacy:** conversations are not stored on the server. They stay in the visitor's browser tab only.
