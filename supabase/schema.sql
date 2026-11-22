-- Inter Plus Consulting — database schema for Supabase
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query → Run.
-- Then run supabase/seed-announcements.sql to copy the current announcements.

-- ───────────────────────── Profiles & roles ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data->>'phone', ''), 30)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name/phone, but only admins may change role, status or email.
-- auth.uid() is null only for trusted server-side sessions (e.g. the Supabase SQL Editor), which are allowed.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and (new.role <> old.role or new.is_active <> old.is_active or new.email <> old.email) then
    raise exception 'Only admins can change role, status or email';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ───────────────────────── Courses & lessons ─────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '',
  description text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  cover_url text not null default '',
  is_published boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A lesson can mix several content types: video, PDF, text/images, quiz, external quiz link.
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  position int not null default 0,
  video_url text not null default '',
  pdf_path text not null default '',
  body text not null default '',
  image_urls text[] not null default '{}',
  quiz jsonb not null default '[]'::jsonb,       -- [{ "question": "...", "choices": ["a","b"] }] (no answers)
  quiz_url text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id, position);

-- Correct answers are kept apart so students can never read them.
create table if not exists public.quiz_keys (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  answers int[] not null default '{}'
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create or replace function public.has_course_access(p_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.enrollments e join public.profiles p on p.id = e.user_id
    where e.user_id = auth.uid() and e.course_id = p_course and p.is_active
  );
$$;

-- Lesson titles shown on the course page before purchase.
create or replace function public.course_outline(p_course uuid)
returns table (id uuid, title text, lesson_position int)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.position from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.course_id = p_course and (c.is_published or public.is_admin())
  order by l.position, l.created_at;
$$;

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  answers int[] not null,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);

create or replace function public.submit_quiz(p_lesson uuid, p_answers int[])
returns table (score int, total int, correct int[])
language plpgsql security definer set search_path = public as $$
declare
  v_course uuid;
  v_key int[];
  v_score int := 0;
  i int;
begin
  select course_id into v_course from public.lessons where id = p_lesson;
  if v_course is null or not public.has_course_access(v_course) then
    raise exception 'No access to this lesson';
  end if;
  select answers into v_key from public.quiz_keys where lesson_id = p_lesson;
  v_key := coalesce(v_key, '{}');
  for i in 1 .. coalesce(array_length(v_key, 1), 0) loop
    if p_answers[i] is not distinct from v_key[i] then v_score := v_score + 1; end if;
  end loop;
  insert into public.quiz_attempts (user_id, lesson_id, answers, score, total)
  values (auth.uid(), p_lesson, p_answers, v_score, coalesce(array_length(v_key, 1), 0));
  return query select v_score, coalesce(array_length(v_key, 1), 0), v_key;
end;
$$;

-- ───────────────────────── Orders (bank transfer + slip) ─────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  slip_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);
create unique index if not exists orders_one_open_per_course
  on public.orders(user_id, course_id) where status in ('pending', 'approved');

-- Students cannot choose the price or status of their own order.
create or replace function public.prepare_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.note := '';
    new.reviewed_at := null;
    new.reviewed_by := null;
  end if;
  new.user_id := coalesce(new.user_id, auth.uid()); -- admins buying for themselves
  select price into new.amount from public.courses where id = new.course_id and is_published;
  if new.amount is null then raise exception 'Course is not available'; end if;
  return new;
end;
$$;

drop trigger if exists prepare_order on public.orders;
create trigger prepare_order before insert on public.orders
  for each row execute function public.prepare_order();

create or replace function public.review_order(p_order uuid, p_approve boolean, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.orders
    set status = case when p_approve then 'approved' else 'rejected' end,
        note = left(coalesce(p_note, ''), 500), reviewed_at = now(), reviewed_by = auth.uid()
    where id = p_order returning * into v_order;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if p_approve then
    insert into public.enrollments (user_id, course_id) values (v_order.user_id, v_order.course_id)
    on conflict do nothing;
  end if;
end;
$$;

-- ───────────────────────── Posts & announcements ─────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  excerpt text not null default '',
  body text not null default '',
  cover_url text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  details text[] not null default '{}',
  image_url text not null,
  gallery text[] not null default '{}',
  is_published boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quiz_keys enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.orders enable row level security;
alter table public.posts enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "profiles: own or admin read" on public.profiles;
create policy "profiles: own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: own or admin update" on public.profiles;
create policy "profiles: own or admin update" on public.profiles for update using (id = auth.uid() or public.is_admin());

drop policy if exists "courses: published or admin read" on public.courses;
create policy "courses: published or admin read" on public.courses for select using (is_published or public.is_admin());
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons: enrolled or admin read" on public.lessons;
create policy "lessons: enrolled or admin read" on public.lessons for select using (public.has_course_access(course_id));
drop policy if exists "lessons: admin write" on public.lessons;
create policy "lessons: admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quiz_keys: admin only" on public.quiz_keys;
create policy "quiz_keys: admin only" on public.quiz_keys for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enrollments: own or admin read" on public.enrollments;
create policy "enrollments: own or admin read" on public.enrollments for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "enrollments: admin write" on public.enrollments;
create policy "enrollments: admin write" on public.enrollments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "progress: own" on public.lesson_progress;
create policy "progress: own" on public.lesson_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_course_access((select course_id from public.lessons where id = lesson_id)));

drop policy if exists "quiz_attempts: own or admin read" on public.quiz_attempts;
create policy "quiz_attempts: own or admin read" on public.quiz_attempts for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders: own or admin read" on public.orders;
create policy "orders: own or admin read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders: student create" on public.orders;
create policy "orders: student create" on public.orders for insert with check (auth.uid() is not null);
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders for update using (public.is_admin());
drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete" on public.orders for delete using (public.is_admin());

drop policy if exists "posts: published or admin read" on public.posts;
create policy "posts: published or admin read" on public.posts for select using (is_published or public.is_admin());
drop policy if exists "posts: admin write" on public.posts;
create policy "posts: admin write" on public.posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "announcements: published or admin read" on public.announcements;
create policy "announcements: published or admin read" on public.announcements for select using (is_published or public.is_admin());
drop policy if exists "announcements: admin write" on public.announcements;
create policy "announcements: admin write" on public.announcements for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Contact requests (website form) ─────────────────────────
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '' check (char_length(phone) <= 30),
  email text not null default '' check (char_length(email) <= 254),
  service text not null default '' check (char_length(service) <= 120),
  message text not null default '' check (char_length(message) <= 2000),
  source text not null default '' check (char_length(source) <= 200),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
drop policy if exists "contact: anyone can send" on public.contact_requests;
create policy "contact: anyone can send" on public.contact_requests for insert with check (status = 'new' and note = '');
drop policy if exists "contact: admin read" on public.contact_requests;
create policy "contact: admin read" on public.contact_requests for select using (public.is_admin());
drop policy if exists "contact: admin update" on public.contact_requests;
create policy "contact: admin update" on public.contact_requests for update using (public.is_admin());
drop policy if exists "contact: admin delete" on public.contact_requests;
create policy "contact: admin delete" on public.contact_requests for delete using (public.is_admin());
grant insert on public.contact_requests to anon;

-- ───────────────────────── Customer reviews (copied by admins from Google Maps) ─────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 120),
  rating int not null default 5 check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 3000),
  review_url text not null default '' check (char_length(review_url) <= 1000),
  review_date text not null default '' check (char_length(review_date) <= 60),
  source text not null default 'Google' check (char_length(source) <= 40),
  is_published boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "reviews: published or admin read" on public.reviews;
create policy "reviews: published or admin read" on public.reviews for select using (is_published or public.is_admin());
drop policy if exists "reviews: admin write" on public.reviews;
create policy "reviews: admin write" on public.reviews for all using (public.is_admin()) with check (public.is_admin());
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- ───────────────────────── Exam library (links to external mock exams, e.g. Gemini Canvas) ─────────────────────────
-- Members see an exam when it is published and either open to all members (course_id is null)
-- or they have access to the linked course. The link itself is hidden from everyone else.
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 1000),
  level text not null default '' check (char_length(level) <= 60),
  question_count int not null default 0 check (question_count >= 0),
  duration_min int not null default 0 check (duration_min >= 0),
  url text not null check (url ~ '^https://'),
  cover_url text not null default '',
  course_id uuid references public.courses(id) on delete set null,
  is_published boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.exams enable row level security;
drop policy if exists "exams: members read" on public.exams;
create policy "exams: members read" on public.exams for select using (
  public.is_admin() or (
    is_published and auth.uid() is not null
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
    and (course_id is null or public.has_course_access(course_id))
  )
);
drop policy if exists "exams: admin write" on public.exams;
create policy "exams: admin write" on public.exams for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.exams to authenticated;

-- ───────────────────────── Data API privileges ─────────────────────────
-- Newer Supabase projects do not grant table access to the API roles automatically.
-- These grants only open the door; Row Level Security above still decides which rows each user sees.
grant usage on schema public to anon, authenticated;
grant select on public.courses, public.posts, public.announcements to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin(), public.has_course_access(uuid), public.course_outline(uuid) to anon, authenticated;
grant execute on function public.submit_quiz(uuid, int[]), public.review_order(uuid, boolean, text) to authenticated;

-- ───────────────────────── Storage buckets ─────────────────────────
-- media: public images (course covers, post covers, announcement images, lesson images)
-- lesson-files: private PDFs, path = <course_id>/<file>
-- slips: private transfer slips, path = <user_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('lesson-files', 'lesson-files', false, 52428800, array['application/pdf']),
  ('slips', 'slips', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media: admin write" on storage.objects;
create policy "media: admin write" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admin update" on storage.objects;
create policy "media: admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admin delete" on storage.objects;
create policy "media: admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

drop policy if exists "lesson-files: enrolled read" on storage.objects;
create policy "lesson-files: enrolled read" on storage.objects for select using (
  bucket_id = 'lesson-files' and (
    public.is_admin()
    or ((storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and public.has_course_access(((storage.foldername(name))[1])::uuid))
  )
);
drop policy if exists "lesson-files: admin write" on storage.objects;
create policy "lesson-files: admin write" on storage.objects for insert with check (bucket_id = 'lesson-files' and public.is_admin());
drop policy if exists "lesson-files: admin delete" on storage.objects;
create policy "lesson-files: admin delete" on storage.objects for delete using (bucket_id = 'lesson-files' and public.is_admin());

drop policy if exists "slips: owner upload" on storage.objects;
create policy "slips: owner upload" on storage.objects for insert with check (
  bucket_id = 'slips' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "slips: owner or admin read" on storage.objects;
create policy "slips: owner or admin read" on storage.objects for select using (
  bucket_id = 'slips' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
