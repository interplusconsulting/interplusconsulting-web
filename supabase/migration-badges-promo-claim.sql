-- Badges, promotion prices, and "claim first" for free items.
-- Run once in Supabase → SQL Editor, after migration-exam-sales.sql and migration-exam-showcase.sql. Safe to run again.

-- 1) Badge (ขายดีที่สุด / แนะนำ / มาใหม่ / โปรโมชั่น) and the original price shown struck through during a promotion.
--    `price` stays the amount actually charged, so orders and slip checks are unchanged.
alter table public.courses add column if not exists badge text not null default '';
alter table public.courses add column if not exists compare_at_price numeric(10,2) not null default 0;
alter table public.courses drop constraint if exists courses_badge_check;
alter table public.courses add constraint courses_badge_check check (badge in ('', 'bestseller', 'recommended', 'new', 'promotion'));
alter table public.courses drop constraint if exists courses_compare_at_check;
alter table public.courses add constraint courses_compare_at_check check (compare_at_price >= 0);

alter table public.exams add column if not exists badge text not null default '';
alter table public.exams add column if not exists compare_at_price numeric(10,2) not null default 0;
alter table public.exams drop constraint if exists exams_badge_check;
alter table public.exams add constraint exams_badge_check check (badge in ('', 'bestseller', 'recommended', 'new', 'promotion'));
alter table public.exams drop constraint if exists exams_compare_at_check;
alter table public.exams add constraint exams_compare_at_check check (compare_at_price >= 0);

-- 2) Free exams are no longer open to everyone automatically: members claim them first (exam_access row).
create or replace function public.has_exam_access(p_exam uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.exams e join public.profiles p on p.id = auth.uid()
    where e.id = p_exam and e.is_published and p.is_active and (
      exists (select 1 from public.exam_access a where a.exam_id = e.id and a.user_id = auth.uid())
      or (e.course_id is not null and public.has_course_access(e.course_id))
    )
  );
$$;

create or replace function public.claim_free_course(p_course uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_active) then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.courses where id = p_course and is_published and price = 0) then
    raise exception 'Item is not available';
  end if;
  insert into public.enrollments (user_id, course_id) values (auth.uid(), p_course) on conflict do nothing;
end;
$$;

create or replace function public.claim_free_exam(p_exam uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_active) then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.exams where id = p_exam and is_published and price = 0 and course_id is null) then
    raise exception 'Item is not available';
  end if;
  insert into public.exam_access (user_id, exam_id) values (auth.uid(), p_exam) on conflict do nothing;
end;
$$;

revoke all on function public.claim_free_course(uuid), public.claim_free_exam(uuid) from public;
grant execute on function public.claim_free_course(uuid), public.claim_free_exam(uuid) to authenticated;

-- 3) Catalog functions return the new fields (return type changes, so drop first).
drop function if exists public.exam_catalog();
create function public.exam_catalog()
returns table (
  id uuid, title text, description text, level text, question_count int, duration_min int,
  cover_url text, price numeric, course_id uuid, course_title text, course_price numeric,
  has_access boolean, pending_order boolean, url text, exam_position int,
  badge text, compare_at_price numeric
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.description, e.level, e.question_count, e.duration_min, e.cover_url, e.price,
         e.course_id, c.title, c.price,
         public.has_exam_access(e.id) as has_access,
         exists (select 1 from public.orders o where o.exam_id = e.id and o.user_id = auth.uid() and o.status = 'pending') as pending_order,
         case when public.has_exam_access(e.id) then e.url else '' end as url,
         e.position, e.badge, e.compare_at_price
  from public.exams e
  left join public.courses c on c.id = e.course_id
  where e.is_published and auth.uid() is not null
  order by e.position, e.created_at desc;
$$;
grant execute on function public.exam_catalog() to authenticated;

drop function if exists public.exam_showcase();
create function public.exam_showcase()
returns table (
  id uuid, title text, description text, level text, question_count int, duration_min int,
  cover_url text, price numeric, course_title text, badge text, compare_at_price numeric
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.description, e.level, e.question_count, e.duration_min,
         e.cover_url, e.price, c.title, e.badge, e.compare_at_price
  from public.exams e
  left join public.courses c on c.id = e.course_id and c.is_published
  where e.is_published
  order by e.position, e.created_at desc
  limit 6;
$$;
revoke all on function public.exam_showcase() from public;
grant execute on function public.exam_showcase() to anon, authenticated;
