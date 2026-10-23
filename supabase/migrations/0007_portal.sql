-- Phase 6 — student portal & admin dashboard.
-- Students see only their own applications, documents and notifications (RLS).
-- Staff (counsellor/admin) manage leads, applications and document reviews.
-- Document files live in the private "documents" Storage bucket and are only ever reached
-- through short-lived signed URLs created by the server after an authorization check.
-- ---------------------------------------------------------------------------

-- Staff need to find students by email, so keep a copy on the profile.
alter table public.profiles add column if not exists email text;
create unique index if not exists profiles_email_idx on public.profiles (lower(email));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- ---------- Lead notes ---------------------------------------------------------
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads on delete cascade,
  author_id uuid references public.profiles on delete set null,
  author_name text,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at);

-- ---------- Applications --------------------------------------------------------
create type public.app_stage as enum ('documents', 'applied', 'offer_received', 'cas_coe', 'visa_lodged', 'visa_granted', 'pre_departure');
create type public.doc_status as enum ('pending', 'verified', 'reupload_needed');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  counsellor text references public.counsellors (slug) on delete set null,
  country text not null,
  university text,
  course text,
  intake text,
  stage public.app_stage not null default 'documents',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_student_idx on public.applications (student_id);
create index applications_stage_idx on public.applications (stage, updated_at desc);

create table public.application_stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  from_stage public.app_stage,
  to_stage public.app_stage not null,
  changed_by uuid references public.profiles on delete set null,
  changed_by_name text,
  note text,
  created_at timestamptz not null default now()
);
create index stage_history_app_idx on public.application_stage_history (application_id, created_at);

-- ---------- Documents -----------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  doc_type text not null,
  storage_path text not null unique,
  file_name text not null,
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  status public.doc_status not null default 'pending',
  counsellor_comment text,
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index documents_app_idx on public.documents (application_id, created_at desc);
create index documents_status_idx on public.documents (status);

-- Students can never set review fields themselves.
create or replace function public.lock_document_review() returns trigger
language plpgsql as $$
begin
  if not public.is_staff() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.counsellor_comment := null; new.reviewed_by := null; new.reviewed_at := null;
    elsif new.status is distinct from old.status or new.counsellor_comment is distinct from old.counsellor_comment
       or new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Only staff can review documents';
    end if;
  end if;
  return new;
end $$;
create trigger documents_lock_review before insert or update on public.documents
  for each row execute function public.lock_document_review();

-- ---------- Notifications -------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('deadline', 'document', 'stage', 'message')),
  title text not null,
  body text,
  link text,
  due_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- Row Level Security -------------------------------------------------
alter table public.lead_notes enable row level security;
alter table public.applications enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

create policy "lead_notes: staff read" on public.lead_notes for select using (public.is_staff());
create policy "lead_notes: staff insert" on public.lead_notes for insert with check (public.is_staff() and author_id = auth.uid());
create policy "lead_notes: admin delete" on public.lead_notes for delete using (public.is_admin());

create policy "applications: own or staff read" on public.applications for select using (student_id = auth.uid() or public.is_staff());
create policy "applications: staff write" on public.applications for all using (public.is_staff()) with check (public.is_staff());

create policy "stage_history: own or staff read" on public.application_stage_history for select
  using (public.is_staff() or exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid()));
create policy "stage_history: staff insert" on public.application_stage_history for insert with check (public.is_staff());

create policy "documents: own or staff read" on public.documents for select using (student_id = auth.uid() or public.is_staff());
create policy "documents: student insert own" on public.documents for insert
  with check (student_id = auth.uid() and exists (select 1 from public.applications a where a.id = application_id and a.student_id = auth.uid()));
create policy "documents: staff update" on public.documents for update using (public.is_staff()) with check (public.is_staff());
create policy "documents: own pending delete" on public.documents for delete using ((student_id = auth.uid() and status <> 'verified') or public.is_admin());

create policy "notifications: own read" on public.notifications for select using (user_id = auth.uid() or public.is_staff());
create policy "notifications: own mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: staff insert" on public.notifications for insert with check (public.is_staff());

-- Students may only flip read_at on their own notifications.
create or replace function public.lock_notification() returns trigger
language plpgsql as $$
begin
  if not public.is_staff() and (new.title, new.body, new.link, new.kind, new.due_at, new.user_id)
     is distinct from (old.title, old.body, old.link, old.kind, old.due_at, old.user_id) then
    raise exception 'Only read_at can be changed';
  end if;
  return new;
end $$;
create trigger notifications_lock before update on public.notifications
  for each row execute function public.lock_notification();

do $$
declare t text;
begin
  foreach t in array array['applications'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- ---------- Storage: private bucket, server-mediated access only -----------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No storage.objects policies for anon/authenticated: uploads and signed downloads go through
-- the website's API with the service role after checking the user owns (or reviews) the file.

-- Role changes: admins in the app, or the SQL editor / service role (no auth.uid()).
create or replace function public.lock_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;

-- First admin: after signing in once, run
--   update public.profiles set role = 'admin' where email = 'you@stxavier.com.np';
