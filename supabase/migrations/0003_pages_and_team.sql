-- =============================================================================
-- 0003 · Phase 2: country/course/service detail content + counsellor profiles.
-- Page copy for about / contact / for-parents / listings / legal lives in page_content (0002).
-- =============================================================================

alter table public.destinations add column if not exists details jsonb;
alter table public.services add column if not exists details jsonb;
alter table public.test_prep_courses add column if not exists details jsonb;

-- Counsellor profiles (public). `profile_id` links a login account for the booking system (Phase 5).
create table public.counsellors (
  slug text primary key,
  profile_id uuid unique references public.profiles on delete set null,
  name text not null,
  role jsonb not null,
  photo text,
  specializations jsonb not null default '[]',
  languages text[] not null default '{}',
  years_experience smallint,
  destinations text[] not null default '{}',
  bio jsonb not null,
  featured boolean not null default false,
  is_placeholder boolean not null default true,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger counsellors_touch before update on public.counsellors
  for each row execute function public.touch_updated_at();

alter table public.counsellors enable row level security;
create policy "counsellors: public read published" on public.counsellors for select using (published or public.is_staff());
create policy "counsellors: admin write" on public.counsellors for all using (public.is_admin()) with check (public.is_admin());
-- Counsellors may edit their own profile text (not publish state or ordering — enforced in the admin UI).
create policy "counsellors: self update" on public.counsellors for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
