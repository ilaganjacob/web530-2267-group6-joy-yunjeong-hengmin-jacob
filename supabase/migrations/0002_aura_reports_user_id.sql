-- Migration: 0002_aura_reports_user_id
-- Ties aura_reports to individual users and replaces the "anyone" RLS
-- policies from 0001_aura_reports.sql with per-user policies.

-- Add user_id, defaulting to the inserting user's id. Nullable so the
-- existing test rows aren't destroyed -- they simply become invisible
-- under the new policies below.
alter table public.aura_reports
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- Index to support per-user queries.
create index if not exists aura_reports_user_id_idx
  on public.aura_reports (user_id);

-- Drop the old "anyone" policies.
drop policy if exists "anon can insert aura reports" on public.aura_reports;
drop policy if exists "anon can read aura reports" on public.aura_reports;
drop policy if exists "anon can update aura reports" on public.aura_reports;

-- Authenticated users can only insert/read/update their own rows.
create policy "users can insert their own aura reports"
  on public.aura_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can read their own aura reports"
  on public.aura_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can update their own aura reports"
  on public.aura_reports
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tighten table-level grants: remove anon access, keep authenticated.
revoke select, insert, update on public.aura_reports from anon;
grant select, insert, update on public.aura_reports to authenticated;

-- Force PostgREST to pick up the new column/policies immediately.
notify pgrst, 'reload schema';
