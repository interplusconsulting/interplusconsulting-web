-- Public list of published exams for the homepage.
-- Returns display fields only — never the exam URL — so anyone (including signed-out visitors) can call it.
create or replace function public.exam_showcase()
returns table (
  id uuid, title text, description text, level text, question_count int, duration_min int,
  cover_url text, price numeric, course_title text
)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.description, e.level, e.question_count, e.duration_min,
         e.cover_url, e.price, c.title
  from public.exams e
  left join public.courses c on c.id = e.course_id and c.is_published
  where e.is_published
  order by e.position, e.created_at desc
  limit 6;
$$;

revoke all on function public.exam_showcase() from public;
grant execute on function public.exam_showcase() to anon, authenticated;
