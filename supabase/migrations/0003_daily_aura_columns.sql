alter table public.aura_reports
  add column if not exists is_daily boolean not null default false,
  add column if not exists scan_date text;

create index if not exists aura_reports_daily_idx
  on public.aura_reports (scan_date)
  where is_daily = true;

notify pgrst, 'reload schema';
