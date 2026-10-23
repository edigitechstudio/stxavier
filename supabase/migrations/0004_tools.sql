-- =============================================================================
-- 0004 · Phase 3: data behind the free tools.
-- Tool page copy lives in page_content (ids "tools" and "tool-<slug>").
-- =============================================================================

alter table public.destinations add column if not exists cost_profile jsonb;
alter table public.destinations add column if not exists requirements jsonb;
alter table public.destinations add column if not exists timeline jsonb;

create table public.scholarships (
  id text primary key,
  name text not null,
  provider text not null,
  countries text[] not null default '{}',
  levels text[] not null default '{}',
  fields text[] not null default '{any}',
  min_percent numeric,
  coverage text not null check (coverage in ('full', 'partial')),
  amount jsonb not null,
  summary jsonb not null,
  deadline jsonb,
  url text not null,
  verified_on date,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.english_requirements (
  id text primary key,
  country text not null references public.destinations (slug) on delete cascade,
  kind text not null check (kind in ('visa', 'university')),
  label jsonb not null,
  ielts_overall numeric(2, 1),
  ielts_min_band numeric(2, 1),
  pte_overall smallint,
  note jsonb,
  source_url text,
  sort int not null default 0,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.grading_scales (
  id text primary key,
  name jsonb not null,
  description jsonb not null,
  max_gpa numeric(3, 2) not null,
  bands jsonb not null,
  source jsonb,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['scholarships','english_requirements','grading_scales']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

create policy "scholarships: public read published" on public.scholarships for select using (published or public.is_staff());
create policy "english_requirements: public read published" on public.english_requirements for select using (published or public.is_staff());
create policy "grading_scales: public read" on public.grading_scales for select using (true);
