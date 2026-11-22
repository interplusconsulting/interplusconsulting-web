-- Email the admin when a new order arrives (via the Google Apps Script in integrations/order-email.gs).
-- Run once in Supabase → SQL Editor. Then store the Apps Script URL and secret with:
--   update private.integrations set value = '<web app url>' where key = 'order_email_url';
--   update private.integrations set value = '<secret>'      where key = 'order_email_secret';

create extension if not exists pg_net;

-- Not exposed through the API (only the database itself can read it).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.integrations (key text primary key, value text not null default '');
alter table private.integrations enable row level security; -- no policies: only the database (trigger) can read it
insert into private.integrations (key) values ('order_email_url'), ('order_email_secret') on conflict (key) do nothing;

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare
  v_url text;
  v_secret text;
  v_payload jsonb;
begin
  select value into v_url from private.integrations where key = 'order_email_url';
  select value into v_secret from private.integrations where key = 'order_email_secret';
  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then return new; end if;

  select jsonb_build_object(
    'secret', v_secret,
    'type', 'new_order',
    'order', jsonb_build_object(
      'id', new.id,
      'item_type', case when new.exam_id is not null then 'exam' else 'course' end,
      'item_title', coalesce((select title from public.courses where id = new.course_id), (select title from public.exams where id = new.exam_id), '-'),
      'amount', new.amount,
      'slip_ref', new.slip_ref,
      'created_at', new.created_at,
      'buyer_name', p.full_name,
      'buyer_email', p.email,
      'buyer_phone', p.phone
    )
  ) into v_payload
  from public.profiles p where p.id = new.user_id;

  -- Fire-and-forget: a failed email never blocks the order.
  begin
    perform net.http_post(url := v_url, body := v_payload, headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 5000);
  exception when others then
    raise warning 'order email failed: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists notify_new_order on public.orders;
create trigger notify_new_order after insert on public.orders
  for each row execute function public.notify_new_order();

-- Send a test email (run after storing the URL and secret):
--   select net.http_post(url := (select value from private.integrations where key = 'order_email_url'),
--     body := jsonb_build_object('secret', (select value from private.integrations where key = 'order_email_secret'), 'type', 'test'),
--     headers := '{"Content-Type": "application/json"}'::jsonb);
