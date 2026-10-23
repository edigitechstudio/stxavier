-- =============================================================================
-- 0005 · Phase 4: success wall fields, university directory, events & webinars.
-- Blog posts live as MDX in content/blog (swap for a headless CMS later).
-- RSVPs and university enquiries are stored in public.leads (source event_rsvp / enquiry).
-- =============================================================================

alter table public.testimonials add column if not exists destination text references public.destinations (slug) on delete set null;
alter table public.testimonials add column if not exists university text;
alter table public.testimonials add column if not exists intake text;
alter table public.testimonials add column if not exists story jsonb;

create table public.universities (
  slug text primary key,
  name text not null,
  country text not null references public.destinations (slug) on delete cascade,
  city text not null,
  logo text,
  image text,
  ranking int,
  ranking_source text,
  fee_min numeric,
  fee_max numeric,
  currency char(3) not null,
  intakes smallint[] not null default '{}',
  fields text[] not null default '{}',
  popular_courses jsonb not null default '[]',
  description jsonb not null,
  website text,
  is_partner boolean not null default false,
  is_placeholder boolean not null default false,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create index universities_country_idx on public.universities (country) where published;

create table public.events (
  slug text primary key,
  kind text not null check (kind in ('event', 'webinar', 'university_visit')),
  title jsonb not null,
  summary jsonb not null,
  description jsonb not null default '[]',
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue jsonb,
  online_url text,
  recording_url text,
  image text,
  capacity int,
  countries text[] not null default '{}',
  is_placeholder boolean not null default true,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at) where published;

do $$
declare t text;
begin
  foreach t in array array['universities','events']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: public read published" on public.%I for select using (published or public.is_staff())', t, t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Counsellors manage the events calendar too.
create policy "events: staff write" on public.events for all using (public.is_staff()) with check (public.is_staff());
