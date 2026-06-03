-- =====================================================================
-- SE2026 Admin/User + Master Sub-SLS Fix
-- Run this in Supabase SQL Editor after se2026_supabase_schema_id.sql
-- =====================================================================

alter table public.pengguna
  add column if not exists legacy_id text unique,
  add column if not exists username text unique,
  add column if not exists kecamatan text,
  add column if not exists pml_legacy_id text,
  add column if not exists korwil_legacy_id text;

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

alter table public.laporan_harian
  add column if not exists legacy_id text unique,
  add column if not exists plot_legacy_id text,
  add column if not exists ppl_legacy_id text,
  add column if not exists pml_legacy_id text,
  add column if not exists korwil_legacy_id text,
  add column if not exists dibuat_oleh_legacy_id text;

alter table public.kendala_lapangan
  add column if not exists legacy_id text unique,
  add column if not exists laporan_legacy_id text,
  add column if not exists ppl_legacy_id text,
  add column if not exists ppl_nama text,
  add column if not exists plot_legacy_id text,
  add column if not exists area_label text,
  add column if not exists tanggal date,
  add column if not exists resolved_at timestamptz;

-- Keep RLS enabled for production-like testing. Admin policies in the base schema still apply.
-- If you want permissive prototype mode, run supabase_migration_legacy_cols.sql instead.
