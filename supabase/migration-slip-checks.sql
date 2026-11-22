-- Faster, safer slip checks. Run once in Supabase → SQL Editor, after migration-exam-sales.sql. Safe to run again.
-- 1) Each buyer gets a unique amount per item: price + 0.01–0.99 baht (stable for that buyer and item),
--    so admins can match the transfer in the bank app at a glance.
-- 2) The reference read from the slip's QR code is stored and may only be used once.

alter table public.orders add column if not exists slip_ref text not null default '';
create unique index if not exists orders_unique_slip_ref
  on public.orders(slip_ref) where slip_ref <> '' and status in ('pending', 'approved');

create or replace function public.order_satang(p_user uuid, p_item uuid)
returns numeric language sql immutable as $$
  select ((('x' || substr(md5(p_user::text || ':' || p_item::text), 1, 8))::bit(32)::int & 2147483647) % 99 + 1)::numeric / 100;
$$;

-- Amount the signed-in member must transfer for a course or an exam (null when not for sale).
create or replace function public.order_quote(p_course uuid default null, p_exam uuid default null)
returns numeric language sql stable security definer set search_path = public as $$
  select case
    when p_course is not null then (select price + public.order_satang(auth.uid(), p_course) from public.courses where id = p_course and is_published and price > 0)
    when p_exam is not null then (select price + public.order_satang(auth.uid(), p_exam) from public.exams where id = p_exam and is_published and price > 0)
  end;
$$;
grant execute on function public.order_quote(uuid, uuid) to authenticated;

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
  new.slip_ref := left(trim(coalesce(new.slip_ref, '')), 200);
  if new.course_id is not null then
    select price + public.order_satang(new.user_id, new.course_id) into new.amount from public.courses where id = new.course_id and is_published and price > 0;
  else
    select price + public.order_satang(new.user_id, new.exam_id) into new.amount from public.exams where id = new.exam_id and is_published and price > 0;
  end if;
  if new.amount is null then raise exception 'Item is not available'; end if;
  return new;
end;
$$;
