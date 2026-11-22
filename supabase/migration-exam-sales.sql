-- Sell exams on their own (not only through courses).
-- Run once in Supabase → SQL Editor, after schema.sql. Safe to run again.

-- 1) Exams get a price; who bought which exam is stored in exam_access.
alter table public.exams add column if not exists price numeric(10,2) not null default 0;
alter table public.exams drop constraint if exists exams_price_check;
alter table public.exams add constraint exams_price_check check (price >= 0);

create table if not exists public.exam_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exam_id)
);
alter table public.exam_access enable row level security;
drop policy if exists "exam_access: own or admin read" on public.exam_access;
create policy "exam_access: own or admin read" on public.exam_access for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "exam_access: admin write" on public.exam_access;
create policy "exam_access: admin write" on public.exam_access for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.exam_access to authenticated;

-- Access rule: admin, or an active member who bought the exam, or who has the linked course,
-- or the exam is free and not tied to a course.
create or replace function public.has_exam_access(p_exam uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.exams e join public.profiles p on p.id = auth.uid()
    where e.id = p_exam and e.is_published and p.is_active and (
      exists (select 1 from public.exam_access a where a.exam_id = e.id and a.user_id = auth.uid())
      or (e.course_id is not null and public.has_course_access(e.course_id))
      or (e.price = 0 and e.course_id is null)
    )
  );
$$;

-- 2) The exam table itself is admin-only; members read the catalog through this function,
--    which shows every published exam but returns the link only when they have access.
drop policy if exists "exams: members read" on public.exams;
drop policy if exists "exams: admin read" on public.exams;
create policy "exams: admin read" on public.exams for select using (public.is_admin());

create or replace function public.exam_catalog()
returns table (
  id uuid, title text, description text, level text, question_count int, duration_min int,
  cover_url text, price numeric, course_id uuid, course_title text, course_price numeric,
  has_access boolean, pending_order boolean, url text, exam_position int
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.description, e.level, e.question_count, e.duration_min, e.cover_url, e.price,
         e.course_id, c.title, c.price,
         public.has_exam_access(e.id) as has_access,
         exists (select 1 from public.orders o where o.exam_id = e.id and o.user_id = auth.uid() and o.status = 'pending') as pending_order,
         case when public.has_exam_access(e.id) then e.url else '' end as url,
         e.position
  from public.exams e
  left join public.courses c on c.id = e.course_id
  where e.is_published and auth.uid() is not null
  order by e.position, e.created_at desc;
$$;
grant execute on function public.has_exam_access(uuid), public.exam_catalog() to authenticated;

-- 3) Orders can be for a course or for an exam (exactly one).
alter table public.orders add column if not exists exam_id uuid references public.exams(id) on delete cascade;
alter table public.orders alter column course_id drop not null;
alter table public.orders drop constraint if exists orders_one_item;
alter table public.orders add constraint orders_one_item check ((course_id is null) <> (exam_id is null));
create unique index if not exists orders_one_open_per_exam
  on public.orders(user_id, exam_id) where status in ('pending', 'approved') and exam_id is not null;

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
  if new.course_id is not null then
    select price into new.amount from public.courses where id = new.course_id and is_published;
  else
    select price into new.amount from public.exams where id = new.exam_id and is_published and price > 0;
  end if;
  if new.amount is null then raise exception 'Item is not available'; end if;
  return new;
end;
$$;

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
    if v_order.course_id is not null then
      insert into public.enrollments (user_id, course_id) values (v_order.user_id, v_order.course_id) on conflict do nothing;
    else
      insert into public.exam_access (user_id, exam_id) values (v_order.user_id, v_order.exam_id) on conflict do nothing;
    end if;
  end if;
end;
$$;
