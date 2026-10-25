# Make the website live (free, without a domain)

This takes about an hour. At the end the site is live at `https://<project>.vercel.app` with a working database, admin dashboard, content editor, student portal, enquiry forms and bookings.

You need:
- the GitHub account that can see `edigitechstudio/stxavier`;
- this project on your computer, with `npm install` already run.

| Step | What | Cost |
|---|---|---|
| 1 | Supabase: database, sign-in and file storage | Free |
| 2 | Load the starter content | — |
| 3 | Vercel: hosting | Free |
| 4 | Connect sign-in to the Vercel address | — |
| 5 | Make yourself admin | — |
| 6 | Spam protection and rate limits (recommended) | Free |
| 7 | Check that everything works | — |
| 8 | Optional: AI chat, analytics, Google reviews | Some paid |
| Later | Your own domain and emails | Domain free (.com.np) |

---

## Step 1 — Supabase (database)

1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**
   - Name: `stxavier`.
   - Database password: click **Generate**, and save it somewhere safe.
   - Region: **Southeast Asia (Singapore)**, the closest to Nepal.
   - Click **Create new project** and wait about 2 minutes.
3. Create the tables. In the left menu open **SQL Editor** → **New query**. Then for each file in `supabase/migrations/`, **in this order**:

   `0001_content.sql` → `0002_home_and_leads.sql` → `0003_pages_and_team.sql` → `0004_tools.sql` → `0005_trust_content.sql` → `0006_booking.sql` → `0007_portal.sql` → `0008_cms.sql`

   1. Open the file in VS Code, select all and copy it.
   2. Paste it into the SQL Editor and click **Run**. You should see "Success. No rows returned".
   3. Click **New query** before pasting the next file.

   If one shows an error, stop and send me the message.
4. Copy the keys. Open **Project Settings** (the gear icon) → **API**, and keep this tab open:
   - **Project URL**, which looks like `https://abcd1234.supabase.co`;
   - **anon public** key;
   - **service_role** key. Click **Reveal**. This key is secret: never put it in code or share it.

## Step 2 — Load the starter content

1. In the project folder, open `.env.local` (create it if it doesn't exist) and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```
2. In the VS Code terminal run:
   ```bash
   npm run seed
   ```
   It prints each table it fills. The destinations, pages, FAQs, blog posts and so on are now in Supabase.

> From now on, `npm run dev` on your computer uses this real database instead of demo mode. Changes you make locally appear on the live site too.

## Step 3 — Vercel (hosting)

1. Go to **vercel.com** → **Sign Up** → **Continue with GitHub**. Choose the **Hobby** (free) plan.
2. **Add New… → Project**.
   - Find `edigitechstudio/stxavier` and click **Import**.
   - If it isn't listed, click **Adjust GitHub App Permissions** and allow the `edigitechstudio` repositories.
3. Leave these settings as they are: Framework **Next.js**, Root directory `./`, build command default.
4. Open **Environment Variables** and add these one by one (Name = Value):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL from step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `REVALIDATE_SECRET` | a random string (see below) |
   | `CHAT_SESSION_SECRET` | another random string |
   | `LEADS_NOTIFY_EMAIL` | the email that should receive new enquiries |

   To make a random string, run this in the VS Code terminal and copy the output. Run it twice, once for each secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Do **not** add `NEXT_PUBLIC_SITE_URL` yet. Without it, the site uses its `vercel.app` address automatically.
5. Click **Deploy** and wait 2–4 minutes.
6. When it says **Congratulations**, click **Continue to Dashboard**. Your address is under **Domains**, e.g. `stxavier.vercel.app`. Write it down; it's called `<your-address>` below.

> The free Hobby plan is meant for non-commercial use. It's fine to launch and test on it. For the business site long-term, Vercel's terms expect the Pro plan (about $20/month).

## Step 4 — Connect sign-in to the Vercel address

In Supabase:
1. **Authentication → URL Configuration**
   - **Site URL:** `https://<your-address>`.
   - **Redirect URLs** → **Add URL**, then add both:
     - `https://<your-address>/api/auth/callback`
     - `http://localhost:3000/api/auth/callback` (for working on your computer)
   - Click **Save**.
2. **Authentication → Emails → Templates**: paste the branded templates so emails show the 6-digit code the sign-in page asks for.
   For each row below: open the template, set the **Subject**, open the HTML file in VS Code, select all, copy, replace the **Body** (Source) with it, then click **Save**.

   | Template | Subject | Body file |
   |---|---|---|
   | **Magic link** | `Your St. Xavier sign-in code` | `supabase/templates/magic-link.html` |
   | **Confirm signup** | `Your St. Xavier sign-in code` | `supabase/templates/confirm-signup.html` |
   | **Invite user** | `Your St. Xavier student portal is ready` | `supabase/templates/invite.html` |

3. Optional: **Authentication → Sign In / Providers → Google**, to let students sign in with Google.
   - You need a Client ID and secret from Google Cloud Console → APIs & Services → Credentials → OAuth client (Web).
   - The authorised redirect URI is the one Supabase shows on that page.

> Supabase's built-in email sender only sends a few emails per hour. That's enough for staff, but before inviting many students set up your own email (see **Later**) or enable Google sign-in.

## Step 5 — Make yourself admin

Staff sign in at `/admin/login` with an **email and password**. No sign-in emails are involved.

1. The first admin account (`ceo.edigitechstudio@gmail.com`) already exists with a temporary password.
   - Sign in at `https://<your-address>/admin/login`.
   - Then open **My account** (bottom left) and change the password.
2. To add other staff, open **Admin → Users & roles → Add staff member**:
   - enter their name and email;
   - choose **Counsellor** (leads, bookings and applications) or **Admin** (everything, including staff and website content);
   - click **Generate** for a password, then **Add staff member**.

   Give them the email and password in person or by phone. They can change the password under **My account**.
3. **Forgotten password:** in **Users & roles**, open **Set new password** under their name.

> To make a brand-new admin without the dashboard: create the user in Supabase → **Authentication → Users → Add user** (tick **Auto confirm**). Then run this in the SQL Editor:
> ```sql
> update public.profiles set role = 'admin' where email = 'their@email.com';
> ```

## Step 6 — Spam protection and rate limits (recommended, free)

**Cloudflare Turnstile** (stops bots on forms and the chat)
1. Go to **dash.cloudflare.com**, sign up, and open **Turnstile** → **Add widget**.
2. Name it `St. Xavier`, add the hostname `<your-address>` (without `https://`), and choose mode **Managed**.
3. Copy the **Site Key** and **Secret Key**.

**Upstash Redis** (keeps form and chat limits working on every server)
1. Go to **upstash.com**, sign up, and create a **Redis** database.
   - Name: `stxavier`.
   - Region: closest to Singapore.
   - Plan: Free.
2. On the database page, under **REST API**, copy the **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.

**Add the keys to Vercel**
1. Open **Vercel → your project → Settings → Environment Variables** and add:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Then **Deployments** → the latest one → **⋯** → **Redeploy**. Every time you add or change a variable, redeploy so the site picks it up.

## Step 7 — Check that everything works

Open `https://<your-address>` and go through this list:

- [ ] The home page loads in English, and **नेपाली** switches to Nepali.
- [ ] A destination page (e.g. Study in Australia) and a tool (e.g. the cost calculator) work.
- [ ] The **Free Counselling** pop-up sends. The enquiry appears in **Admin → Leads**.
- [ ] `/en/book` shows "call or WhatsApp us" until counsellors have working hours. Add hours in **Admin → Availability**, and then a test booking appears in **Admin → Bookings**.
- [ ] **Admin → Website content**: change a sentence on the home page and save. It shows on the site within seconds.
- [ ] The AI chat (bottom right) answers a question such as "IELTS score for UK?". Without an AI key it answers in basic mode, quoting the best-matching passage from the website.
- [ ] `https://<your-address>/sitemap.xml` lists pages starting with your `vercel.app` address.

Then work through the **Pre-launch checklist** in the README. Above all, replace the placeholder team, stats, testimonials and accreditations (marked TODO) with real ones in Website content, and untick **Is placeholder**. Placeholders never appear on the live site.

## Step 8 — Optional extras

| Feature | Variables to add in Vercel | Where to get them |
|---|---|---|
| Full AI chat answers | `ANTHROPIC_API_KEY` (optional `AI_MODEL`, `AI_EFFORT`) | console.anthropic.com → API keys. Paid, per use |
| Google Analytics | `NEXT_PUBLIC_GA4_ID` | analytics.google.com → Admin → Data streams |
| Meta Pixel / Microsoft Clarity | `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID` | Meta Events Manager / clarity.microsoft.com |
| Live Google rating and reviews | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Google Cloud Console (Places API) |

Analytics only load after a visitor accepts cookies. Redeploy after adding any of these.

---

## Later — your own domain and emails

When you're ready to use `stxavier.com.np`:

1. **Register the domain.** `.com.np` is free for businesses registered in Nepal. Apply at **register.com.np** with your company registration documents.
2. **Vercel → Settings → Domains**
   - Add `stxavier.com.np` and `www.stxavier.com.np`, then follow the DNS records Vercel shows.
   - In **Environment Variables**, add `NEXT_PUBLIC_SITE_URL` = `https://stxavier.com.np`, then redeploy.
3. **Supabase → Authentication → URL Configuration:** change the Site URL and redirect URL to `https://stxavier.com.np`.
4. **Turnstile:** add `stxavier.com.np` to the widget's hostnames.
5. **Emails (Resend, free for 3,000 emails/month)**
   - Go to **resend.com** → **Domains** → add `stxavier.com.np`, and add the DNS records it shows.
   - Create an API key, and add `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `St. Xavier Educational Network <noreply@stxavier.com.np>`) in Vercel. Redeploy.
   - In **Supabase → Authentication → Emails → SMTP settings**, enter Resend's SMTP details so sign-in emails come from your domain and aren't rate-limited.

   Until then, booking confirmation emails to students are not sent. Every enquiry and booking is still saved in the admin.
6. **Google Search Console:** add the domain and submit `https://stxavier.com.np/sitemap.xml`.

## Updating the site after launch

- **Content** (text, images, pages, blog, FAQs): edit it in **Admin → Website content**. It goes live on save, with no redeploy.
- **Code changes:** push to the `main` branch on GitHub, and Vercel redeploys automatically in a few minutes.
