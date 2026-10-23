-- Phase 5 — counselling bookings.
-- Weekly availability per counsellor + one-off exceptions (holidays, leave) are public content;
-- bookings are private and inserted only by the server (service role). An exclusion constraint
-- makes double-booking a counsellor impossible, even under concurrent requests.
-- ---------------------------------------------------------------------------

create extension if not exists btree_gist;

create type public.booking_mode as enum ('office', 'zoom', 'whatsapp');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Recurring weekly hours, interpreted in Nepal Time (UTC+05:45). weekday: 0 = Sunday … 6 = Saturday.
create table public.counsellor_availability (
  id text primary key,
  counsellor text not null references public.counsellors (slug) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null default 30 check (slot_minutes between 10 and 240),
  modes public.booking_mode[] not null default '{office,zoom,whatsapp}',
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index counsellor_availability_idx on public.counsellor_availability (counsellor, weekday);

-- Closures. counsellor null = whole office (e.g. Dashain). start/end null = the whole day.
create table public.availability_exceptions (
  id text primary key,
  counsellor text references public.counsellors (slug) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason jsonb,
  updated_at timestamptz not null default now(),
  check ((start_time is null) = (end_time is null)),
  check (end_time is null or end_time > start_time)
);
create index availability_exceptions_date_idx on public.availability_exceptions (date);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  counsellor text not null references public.counsellors (slug),
  mode public.booking_mode not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  name text not null,
  phone text not null,
  email text,
  notes text,
  locale text,
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint bookings_no_overlap exclude using gist (
    counsellor with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_starts_idx on public.bookings (starts_at);

do $$
declare t text;
begin
  foreach t in array array['counsellor_availability', 'availability_exceptions', 'bookings'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "availability: public read" on public.counsellor_availability for select using (true);
create policy "availability: staff write" on public.counsellor_availability for all using (public.is_staff()) with check (public.is_staff());
create policy "exceptions: public read" on public.availability_exceptions for select using (true);
create policy "exceptions: staff write" on public.availability_exceptions for all using (public.is_staff()) with check (public.is_staff());

-- No public policy on bookings: the website inserts with the service role after validating the slot.
create policy "bookings: staff read" on public.bookings for select using (public.is_staff());
create policy "bookings: staff update" on public.bookings for update using (public.is_staff()) with check (public.is_staff());
create policy "bookings: admin delete" on public.bookings for delete using (public.is_admin());

-- Optional downloadable PDF per destination (otherwise the printable /guides/<slug> page is used).
alter table public.destinations add column if not exists guide_pdf text;
