-- Content management from the admin dashboard (/admin/cms).
--  · ui_text      — per-language overrides for any interface text (headings, labels, SEO titles…).
--                   Empty table = the defaults from messages/*.json are used.
--  · blog_posts   — blog articles edited in the dashboard (MDX files in content/blog remain as
--                   defaults; a database post with the same slug replaces the file).
--  · media bucket — public images uploaded from the dashboard (heroes, photos, logos, covers).
-- ---------------------------------------------------------------------------

create table public.ui_text (
  locale text not null check (locale in ('en', 'ne')),
  key text not null check (key ~ '^[A-Za-z0-9_.-]+$'),
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (locale, key)
);

create table public.blog_posts (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title jsonb not null,
  description jsonb not null,
  body jsonb not null,
  topic text not null,
  countries text[] not null default '{}',
  levels text[] not null default '{}',
  cover text,
  author text not null default 'editorial',
  date date not null default current_date,
  updated date,
  draft boolean not null default false,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['ui_text', 'blog_posts'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;
create policy "ui_text: public read" on public.ui_text for select using (true);
create policy "blog_posts: public read published" on public.blog_posts for select using (not draft or public.is_staff());

-- Public media library (raster images only — SVG can carry scripts). Uploads go through the website's API (admin check + type/size checks).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Add a Database Webhook for ui_text and blog_posts too (→ /api/revalidate) so edits made
-- directly in Supabase also go live instantly. Edits made in /admin/cms publish immediately.
