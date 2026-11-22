-- Show/hide parts of the public website (Admin → ตั้งค่าการแสดงหน้าเว็บ).
-- One row (id = 1). hidden_sections holds keys such as 'gallery' or 'faq'; anything not listed is shown.
-- Run once in Supabase → SQL Editor. Safe to run again.

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  hidden_sections text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings for select using (true);
drop policy if exists "site_settings: admin write" on public.site_settings;
create policy "site_settings: admin write" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
