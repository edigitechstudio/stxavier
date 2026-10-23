-- =============================================================================
-- 0002 · Homepage content (page copy, feature blocks, testimonials, partners)
--        + leads captured by the counselling pop-up / forms.
-- =============================================================================

alter table public.destinations add column if not exists badge jsonb;

-- One row per page; `data` holds that page's editable copy and images (see types/content.ts).
create table public.page_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.features (
  id text primary key,
  "group" text not null check ("group" in ('edge', 'why', 'process', 'essentials')),
  icon text not null,
  title jsonb not null,
  text jsonb not null,
  label jsonb,
  href text,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create index features_group_idx on public.features ("group") where published;

create table public.testimonials (
  id text primary key,
  kind text not null check (kind in ('story', 'review')),
  name text not null,
  meta jsonb not null,
  country text,
  image text,
  quote jsonb not null,
  rating smallint check (rating between 1 and 5),
  video_url text,
  is_placeholder boolean not null default true,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.partners (
  id text primary key,
  name text not null,
  logo text,
  url text,
  country text,
  is_placeholder boolean not null default true,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['page_content','features','testimonials','partners']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

create policy "page_content: public read" on public.page_content for select using (true);
create policy "features: public read published" on public.features for select using (published or public.is_staff());
create policy "testimonials: public read published" on public.testimonials for select using (published or public.is_staff());
create policy "partners: public read published" on public.partners for select using (published or public.is_staff());

-- ---------------------------------------------------------------------------
-- Leads. Inserted only by server routes (service role) after validation,
-- rate limiting and bot checks. Staff read/update; admins delete.
-- ---------------------------------------------------------------------------

create type public.lead_source as enum
  ('enquiry', 'counselling', 'eligibility', 'guide_download', 'parent', 'booking', 'event_rsvp', 'newsletter', 'chat', 'contact');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'lost');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source public.lead_source not null,
  status public.lead_status not null default 'new',
  name text not null,
  phone text not null,
  email text,
  payload jsonb not null default '{}',
  page_path text,
  referrer text,
  locale text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  assigned_to uuid references public.profiles,
  created_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status, source);

alter table public.leads enable row level security;
create policy "leads: staff read" on public.leads for select using (public.is_staff());
create policy "leads: staff update" on public.leads for update using (public.is_staff()) with check (public.is_staff());
create policy "leads: admin delete" on public.leads for delete using (public.is_admin());
