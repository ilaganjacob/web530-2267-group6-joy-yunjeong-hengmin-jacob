-- Migration: 0001_aura_reports
-- Creates the aura_reports table for persisting scan results.
-- No auth required for now (anon insert/select enabled via RLS policies).

create table if not exists public.aura_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Core report fields (mirrors AuraReport type in src/types.ts)
  subject text not null,
  aura_color text not null,
  -- hex string, e.g. "#7B6CF6"
  vibe_score smallint not null check (vibe_score between 0 and 100),
  threat_level text not null check (
    threat_level in ('low', 'moderate', 'elevated', 'cosmic')
  ),
  traits jsonb not null default jsonb_build_array(),
  verdict text not null,
  recommendation text not null
);

-- Index to support "recent scans" queries
create index if not exists aura_reports_created_at_idx
  on public.aura_reports (created_at desc);

-- Enable Row Level Security
alter table public.aura_reports enable row level security;

-- Allow anyone (anon) to insert — no user accounts yet
create policy "anon can insert aura reports"
  on public.aura_reports
  for insert
  to anon
  with check (true);

-- Allow anyone to read all rows (no auth yet)
create policy "anon can read aura reports"
  on public.aura_reports
  for select
  to anon
  using (true);