-- Payment settings managed from the admin area (Payment → ตั้งค่าการชำระเงิน).
-- Run once in Supabase → SQL Editor. Safe to run again.
create table if not exists public.payment_settings (
  id int primary key default 1 check (id = 1),
  promptpay_id text not null default '' check (promptpay_id ~ '^(|0\d{9}|\d{13}|\d{15})$'),
  account_name text not null default '' check (char_length(account_name) <= 120),
  bank_name text not null default '' check (char_length(bank_name) <= 120),
  account_number text not null default '' check (char_length(account_number) <= 40),
  updated_at timestamptz not null default now()
);
insert into public.payment_settings (id) values (1) on conflict (id) do nothing;

alter table public.payment_settings enable row level security;
drop policy if exists "payment_settings: members read" on public.payment_settings;
create policy "payment_settings: members read" on public.payment_settings for select using (auth.uid() is not null);
drop policy if exists "payment_settings: admin update" on public.payment_settings;
create policy "payment_settings: admin update" on public.payment_settings for update using (public.is_admin()) with check (public.is_admin());
grant select, update on public.payment_settings to authenticated;
