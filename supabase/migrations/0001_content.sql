-- =============================================================================
-- 0001 · Content tables (everything editable without a code change)
-- Lead, booking, portal and admin tables follow in 0002+ (Phases 5–6).
-- =============================================================================

create type public.user_role as enum ('student', 'counsellor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  phone text,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

-- Role helpers. SECURITY DEFINER so policies can read profiles without recursive RLS.
create or replace function public.auth_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('counsellor', 'admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Create a profile for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students may edit their own profile but never their role.
create or replace function public.lock_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;

create trigger profiles_lock_role before update on public.profiles
  for each row execute function public.lock_profile_role();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Content tables. Translatable fields are jsonb: {"en": "...", "ne": "..."}.
-- ---------------------------------------------------------------------------

create table public.site_settings (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.offices (
  id text primary key,
  name jsonb not null,
  is_head_office boolean not null default false,
  street jsonb not null,
  locality text not null,
  region text not null,
  postal_code text,
  country_code text not null default 'NP',
  lat double precision,
  lng double precision,
  phone text not null,
  email text,
  hours jsonb not null default '[]',
  maps_embed_url text,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.nav_items (
  id text primary key,
  menu text not null check (menu in ('header', 'footer_quick', 'footer_resources')),
  parent_id text references public.nav_items on delete cascade,
  label jsonb not null,
  description jsonb,
  href text,
  icon text,
  source text check (source in ('destinations', 'services', 'test_prep')),
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.destinations (
  slug text primary key,
  iso3 char(3) not null,
  iso2 char(2) not null,
  name jsonb not null,
  summary jsonb not null,
  hero_image text,
  lat double precision not null,
  lng double precision not null,
  key_facts jsonb not null default '{}',
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.services (
  slug text primary key,
  icon text not null,
  title jsonb not null,
  summary jsonb not null,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.test_prep_courses (
  slug text primary key,
  icon text not null,
  name jsonb not null,
  summary jsonb not null,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.stats (
  key text primary key,
  value numeric not null,
  suffix text not null default '',
  label jsonb not null,
  is_placeholder boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id text primary key,
  scope text not null default 'general',
  question jsonb not null,
  answer jsonb not null,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create index faqs_scope_idx on public.faqs (scope) where published;

create table public.accreditations (
  id text primary key,
  name text not null,
  logo text,
  verify_url text,
  is_placeholder boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  email text primary key check (email = lower(email)),
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['site_settings','offices','nav_items','destinations','services','test_prep_courses','stats','faqs','accreditations']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
create policy "profiles: read own or staff" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Public content: anyone can read (published rows only where applicable); only admins write.
do $$
declare t text;
begin
  foreach t in array array['site_settings','offices','nav_items','stats','accreditations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: public read" on public.%I for select using (true)', t, t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
  foreach t in array array['destinations','services','test_prep_courses','faqs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: public read published" on public.%I for select using (published or public.is_staff())', t, t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Newsletter: inserts only via the server (service role). Staff can read; admins manage.
alter table public.newsletter_subscribers enable row level security;
create policy "newsletter: staff read" on public.newsletter_subscribers for select using (public.is_staff());
create policy "newsletter: admin write" on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Live updates: in the Supabase dashboard → Database → Webhooks, add one webhook per content
-- table (INSERT/UPDATE/DELETE) that POSTs to  https://<site>/api/revalidate
-- with header  Authorization: Bearer <REVALIDATE_SECRET>.  The default payload includes
-- "table", which the route maps to the matching cache tag.
-- ---------------------------------------------------------------------------
