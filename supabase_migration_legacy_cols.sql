-- =====================================================================
-- SE2026 Migration: Add Legacy Compatibility Columns
-- Run this in the Supabase SQL Editor AFTER the main schema
-- These extra columns allow the React app to keep its string-based IDs
-- =====================================================================

-- pengguna: add username and legacy fields for demo login
alter table public.pengguna
  add column if not exists legacy_id text unique,
  add column if not exists username text unique,
  add column if not exists kecamatan text,
  add column if not exists pml_legacy_id text,
  add column if not exists korwil_legacy_id text;

-- plot_wilayah: add legacy_id + simplified FK columns (non-UUID)
alter table public.plot_wilayah
  add column if not exists legacy_id text unique,
  add column if not exists pml_legacy_id text,
  add column if not exists ppl_legacy_id text,
  add column if not exists korwil_legacy_id text,
  add column if not exists nama_sls text,
  add column if not exists target_prelist integer not null default 0 check (target_prelist >= 0);

alter table public.plot_wilayah
  alter column pml_id drop not null,
  alter column ppl_id drop not null,
  alter column korwil_id drop not null;

-- laporan_harian: add legacy columns for plot/user references
alter table public.laporan_harian
  add column if not exists legacy_id text unique,
  add column if not exists plot_legacy_id text,
  add column if not exists ppl_legacy_id text,
  add column if not exists pml_legacy_id text,
  add column if not exists korwil_legacy_id text,
  add column if not exists dibuat_oleh_legacy_id text;

-- kendala_lapangan: add all legacy reference columns
alter table public.kendala_lapangan
  add column if not exists legacy_id text unique,
  add column if not exists laporan_legacy_id text,
  add column if not exists ppl_legacy_id text,
  add column if not exists ppl_nama text,
  add column if not exists plot_legacy_id text,
  add column if not exists area_label text,
  add column if not exists tanggal date,
  add column if not exists resolved_at timestamptz;

-- =====================================================================
-- RLS POLICIES: Allow anon key full access (DEMO MODE)
-- In production, remove these and use auth.uid() based policies
-- =====================================================================

-- Allow anon to read/write all tables (demo prototype)
alter table public.pengguna disable row level security;
alter table public.plot_wilayah disable row level security;
alter table public.laporan_harian disable row level security;
alter table public.detail_laporan_harian disable row level security;
alter table public.kendala_lapangan disable row level security;
alter table public.penugasan_korwil_pml disable row level security;
alter table public.penugasan_pml_ppl disable row level security;
alter table public.log_audit disable row level security;
