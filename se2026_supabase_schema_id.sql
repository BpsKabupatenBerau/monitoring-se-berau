-- SE2026 / ST2026 Sistem Monitoring Harian
-- Skema Supabase versi Bahasa Indonesia
-- Target: Admin, Korwil, PML, dan PPL (PPL hanya lihat)

create extension if not exists pgcrypto;

-- =========================
-- TIPE ENUM
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'peran_pengguna') then
    create type public.peran_pengguna as enum ('ADMIN', 'KORWIL', 'PML', 'PPL');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_pengguna') then
    create type public.status_pengguna as enum ('AKTIF', 'NONAKTIF');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_laporan_harian') then
    create type public.status_laporan_harian as enum (
      'BELUM_MULAI',
      'PROSES',
      'SELESAI',
      'TERKENDALA'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'status_kendala') then
    create type public.status_kendala as enum ('TERBUKA', 'DIPROSES', 'SELESAI');
  end if;

  if not exists (select 1 from pg_type where typname = 'jenis_aksi_audit') then
    create type public.jenis_aksi_audit as enum ('TAMBAH', 'UBAH', 'HAPUS');
  end if;
end$$;

-- =========================
-- TABEL UTAMA
-- =========================
create table if not exists public.pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nama_lengkap text not null,
  nomor_hp text,
  peran public.peran_pengguna not null default 'PPL',
  status public.status_pengguna not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- FUNGSI BANTUAN
-- =========================
create or replace function public.ubah_tanggal_pembaruan()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.peran_saat_ini()
returns public.peran_pengguna
language sql
stable
security definer
set search_path = public
as $$
  select p.peran
  from public.pengguna p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.peran_saat_ini() = 'ADMIN'::public.peran_pengguna
$$;

create or replace function public.is_korwil()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.peran_saat_ini() = 'KORWIL'::public.peran_pengguna
$$;

create or replace function public.is_pml()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.peran_saat_ini() = 'PML'::public.peran_pengguna
$$;

create or replace function public.is_ppl()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.peran_saat_ini() = 'PPL'::public.peran_pengguna
$$;


drop trigger if exists trg_pengguna_updated_at on public.pengguna;
create trigger trg_pengguna_updated_at
before update on public.pengguna
for each row execute function public.ubah_tanggal_pembaruan();

create table if not exists public.penugasan_korwil_pml (
  id uuid primary key default gen_random_uuid(),
  korwil_id uuid not null references public.pengguna(id) on delete restrict,
  pml_id uuid not null references public.pengguna(id) on delete restrict,
  catatan text,
  created_at timestamptz not null default now(),
  unique (korwil_id, pml_id)
);

create index if not exists idx_penugasan_korwil_pml_korwil_id on public.penugasan_korwil_pml(korwil_id);
create index if not exists idx_penugasan_korwil_pml_pml_id on public.penugasan_korwil_pml(pml_id);

create table if not exists public.penugasan_pml_ppl (
  id uuid primary key default gen_random_uuid(),
  pml_id uuid not null references public.pengguna(id) on delete restrict,
  ppl_id uuid not null references public.pengguna(id) on delete restrict,
  catatan text,
  created_at timestamptz not null default now(),
  unique (pml_id, ppl_id)
);

create index if not exists idx_penugasan_pml_ppl_pml_id on public.penugasan_pml_ppl(pml_id);
create index if not exists idx_penugasan_pml_ppl_ppl_id on public.penugasan_pml_ppl(ppl_id);

create table if not exists public.plot_wilayah (
  id uuid primary key default gen_random_uuid(),
  idsubsls text not null unique,
  kecamatan text not null,
  desa text not null,
  sls text,
  sub_sls text,
  nama_sls text,
  target_prelist integer not null default 0 check (target_prelist >= 0),
  pml_id uuid references public.pengguna(id) on delete restrict,
  ppl_id uuid references public.pengguna(id) on delete restrict,
  korwil_id uuid references public.pengguna(id) on delete restrict,
  aktif boolean not null default true,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_plot_wilayah_updated_at on public.plot_wilayah;
create trigger trg_plot_wilayah_updated_at
before update on public.plot_wilayah
for each row execute function public.ubah_tanggal_pembaruan();

create index if not exists idx_plot_wilayah_pml_id on public.plot_wilayah(pml_id);
create index if not exists idx_plot_wilayah_ppl_id on public.plot_wilayah(ppl_id);
create index if not exists idx_plot_wilayah_korwil_id on public.plot_wilayah(korwil_id);
create index if not exists idx_plot_wilayah_kecamatan on public.plot_wilayah(kecamatan);
create index if not exists idx_plot_wilayah_desa on public.plot_wilayah(desa);

create table if not exists public.laporan_harian (
  id uuid primary key default gen_random_uuid(),
  tanggal_laporan date not null,
  pml_id uuid not null references public.pengguna(id) on delete restrict,
  ppl_id uuid not null references public.pengguna(id) on delete restrict,
  korwil_id uuid not null references public.pengguna(id) on delete restrict,
  status_laporan public.status_laporan_harian not null default 'BELUM_MULAI',
  capaian_harian integer not null default 0 check (capaian_harian >= 0),
  ada_kendala boolean not null default false,
  deskripsi_kendala text,
  dibuat_oleh uuid not null references public.pengguna(id) on delete restrict,
  dibuat_pada timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  catatan text,
  unique (tanggal_laporan, pml_id, ppl_id)
);

drop trigger if exists trg_laporan_harian_updated_at on public.laporan_harian;
create trigger trg_laporan_harian_updated_at
before update on public.laporan_harian
for each row execute function public.ubah_tanggal_pembaruan();

create index if not exists idx_laporan_harian_tanggal on public.laporan_harian(tanggal_laporan);
create index if not exists idx_laporan_harian_pml_id on public.laporan_harian(pml_id);
create index if not exists idx_laporan_harian_ppl_id on public.laporan_harian(ppl_id);
create index if not exists idx_laporan_harian_korwil_id on public.laporan_harian(korwil_id);
create index if not exists idx_laporan_harian_status on public.laporan_harian(status_laporan);

create table if not exists public.detail_laporan_harian (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid not null references public.laporan_harian(id) on delete cascade,
  plot_id uuid not null references public.plot_wilayah(id) on delete restrict,
  status_laporan public.status_laporan_harian not null default 'BELUM_MULAI',
  capaian_harian integer not null default 0 check (capaian_harian >= 0),
  ada_kendala boolean not null default false,
  deskripsi_kendala text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (laporan_id, plot_id)
);

drop trigger if exists trg_detail_laporan_harian_updated_at on public.detail_laporan_harian;
create trigger trg_detail_laporan_harian_updated_at
before update on public.detail_laporan_harian
for each row execute function public.ubah_tanggal_pembaruan();

create index if not exists idx_detail_laporan_harian_laporan_id on public.detail_laporan_harian(laporan_id);
create index if not exists idx_detail_laporan_harian_plot_id on public.detail_laporan_harian(plot_id);
create index if not exists idx_detail_laporan_harian_status on public.detail_laporan_harian(status_laporan);

create table if not exists public.kendala_lapangan (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references public.laporan_harian(id) on delete cascade,
  detail_laporan_id uuid references public.detail_laporan_harian(id) on delete cascade,
  jenis_kendala text,
  deskripsi text not null,
  status_kendala public.status_kendala not null default 'TERBUKA',
  tindak_lanjut text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_kendala_lapangan_updated_at on public.kendala_lapangan;
create trigger trg_kendala_lapangan_updated_at
before update on public.kendala_lapangan
for each row execute function public.ubah_tanggal_pembaruan();

create index if not exists idx_kendala_lapangan_laporan_id on public.kendala_lapangan(laporan_id);
create index if not exists idx_kendala_lapangan_detail_laporan_id on public.kendala_lapangan(detail_laporan_id);
create index if not exists idx_kendala_lapangan_status on public.kendala_lapangan(status_kendala);

create table if not exists public.log_audit (
  id uuid primary key default gen_random_uuid(),
  nama_tabel text not null,
  record_id uuid not null,
  aksi public.jenis_aksi_audit not null,
  data_lama jsonb,
  data_baru jsonb,
  diubah_oleh uuid references public.pengguna(id) on delete set null,
  diubah_pada timestamptz not null default now()
);

create index if not exists idx_log_audit_tabel_record on public.log_audit(nama_tabel, record_id);
create index if not exists idx_log_audit_diubah_pada on public.log_audit(diubah_pada);

-- =========================
-- TRIGGER AUDIT
-- =========================
create or replace function public.catat_perubahan_baris()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.log_audit(nama_tabel, record_id, aksi, data_lama, data_baru, diubah_oleh)
    values (tg_table_name, new.id, 'TAMBAH', null, to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.log_audit(nama_tabel, record_id, aksi, data_lama, data_baru, diubah_oleh)
    values (tg_table_name, new.id, 'UBAH', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.log_audit(nama_tabel, record_id, aksi, data_lama, data_baru, diubah_oleh)
    values (tg_table_name, old.id, 'HAPUS', to_jsonb(old), null, auth.uid());
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_audit_pengguna on public.pengguna;
create trigger trg_audit_pengguna
after insert or update or delete on public.pengguna
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_penugasan_korwil_pml on public.penugasan_korwil_pml;
create trigger trg_audit_penugasan_korwil_pml
after insert or update or delete on public.penugasan_korwil_pml
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_penugasan_pml_ppl on public.penugasan_pml_ppl;
create trigger trg_audit_penugasan_pml_ppl
after insert or update or delete on public.penugasan_pml_ppl
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_plot_wilayah on public.plot_wilayah;
create trigger trg_audit_plot_wilayah
after insert or update or delete on public.plot_wilayah
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_laporan_harian on public.laporan_harian;
create trigger trg_audit_laporan_harian
after insert or update or delete on public.laporan_harian
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_detail_laporan_harian on public.detail_laporan_harian;
create trigger trg_audit_detail_laporan_harian
after insert or update or delete on public.detail_laporan_harian
for each row execute function public.catat_perubahan_baris();

drop trigger if exists trg_audit_kendala_lapangan on public.kendala_lapangan;
create trigger trg_audit_kendala_lapangan
after insert or update or delete on public.kendala_lapangan
for each row execute function public.catat_perubahan_baris();

-- =========================
-- VIEW BANTUAN
-- =========================
drop view if exists public.v_ppl_saya;
create view public.v_ppl_saya with (security_invoker = true) as
select
  p.id,
  p.nama_lengkap,
  p.email,
  p.nomor_hp,
  p.peran,
  p.status,
  pp.pml_id,
  pp.created_at
from public.pengguna p
left join public.penugasan_pml_ppl pp on pp.ppl_id = p.id
where p.peran = 'PPL'::public.peran_pengguna;

drop view if exists public.v_plot_saya;
create view public.v_plot_saya with (security_invoker = true) as
select
  pw.*,
  ppl.nama_lengkap as nama_ppl,
  pml.nama_lengkap as nama_pml,
  kor.nama_lengkap as nama_korwil
from public.plot_wilayah pw
left join public.pengguna ppl on ppl.id = pw.ppl_id
left join public.pengguna pml on pml.id = pw.pml_id
left join public.pengguna kor on kor.id = pw.korwil_id;

drop view if exists public.v_ringkasan_laporan_harian;
create view public.v_ringkasan_laporan_harian with (security_invoker = true) as
select
  lh.id,
  lh.tanggal_laporan,
  lh.pml_id,
  pml.nama_lengkap as nama_pml,
  lh.ppl_id,
  ppl.nama_lengkap as nama_ppl,
  lh.korwil_id,
  kor.nama_lengkap as nama_korwil,
  lh.status_laporan,
  lh.capaian_harian,
  lh.ada_kendala,
  lh.deskripsi_kendala,
  lh.dibuat_oleh,
  lh.dibuat_pada,
  count(dlh.id) as jumlah_detail,
  sum(case when dlh.status_laporan = 'SELESAI' then 1 else 0 end) as detail_selesai,
  sum(case when dlh.status_laporan = 'TERKENDALA' then 1 else 0 end) as detail_terkendala
from public.laporan_harian lh
left join public.pengguna pml on pml.id = lh.pml_id
left join public.pengguna ppl on ppl.id = lh.ppl_id
left join public.pengguna kor on kor.id = lh.korwil_id
left join public.detail_laporan_harian dlh on dlh.laporan_id = lh.id
group by
  lh.id, lh.tanggal_laporan, lh.pml_id, pml.nama_lengkap, lh.ppl_id, ppl.nama_lengkap,
  lh.korwil_id, kor.nama_lengkap, lh.status_laporan, lh.capaian_harian, lh.ada_kendala,
  lh.deskripsi_kendala, lh.dibuat_oleh, lh.dibuat_pada;

-- =========================
-- ROW LEVEL SECURITY
-- =========================
alter table public.pengguna enable row level security;
alter table public.penugasan_korwil_pml enable row level security;
alter table public.penugasan_pml_ppl enable row level security;
alter table public.plot_wilayah enable row level security;
alter table public.laporan_harian enable row level security;
alter table public.detail_laporan_harian enable row level security;
alter table public.kendala_lapangan enable row level security;
alter table public.log_audit enable row level security;

-- PENGGUNA
 drop policy if exists "pengguna_select_diri_atau_admin" on public.pengguna;
create policy "pengguna_select_diri_atau_admin"
on public.pengguna
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "pengguna_update_diri_atau_admin" on public.pengguna;
create policy "pengguna_update_diri_atau_admin"
on public.pengguna
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "pengguna_insert_admin_saja" on public.pengguna;
create policy "pengguna_insert_admin_saja"
on public.pengguna
for insert
with check (public.is_admin());

drop policy if exists "pengguna_delete_admin_saja" on public.pengguna;
create policy "pengguna_delete_admin_saja"
on public.pengguna
for delete
using (public.is_admin());

-- PENUGASAN KORWIL - PML
 drop policy if exists "penugasan_korwil_pml_select_sesuai_ruang" on public.penugasan_korwil_pml;
create policy "penugasan_korwil_pml_select_sesuai_ruang"
on public.penugasan_korwil_pml
for select
using (
  public.is_admin()
  or korwil_id = auth.uid()
  or pml_id = auth.uid()
);

drop policy if exists "penugasan_korwil_pml_tulis_admin_saja" on public.penugasan_korwil_pml;
create policy "penugasan_korwil_pml_tulis_admin_saja"
on public.penugasan_korwil_pml
for insert
with check (public.is_admin());

drop policy if exists "penugasan_korwil_pml_ubah_admin_saja" on public.penugasan_korwil_pml;
create policy "penugasan_korwil_pml_ubah_admin_saja"
on public.penugasan_korwil_pml
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "penugasan_korwil_pml_hapus_admin_saja" on public.penugasan_korwil_pml;
create policy "penugasan_korwil_pml_hapus_admin_saja"
on public.penugasan_korwil_pml
for delete
using (public.is_admin());

-- PENUGASAN PML - PPL
 drop policy if exists "penugasan_pml_ppl_select_sesuai_ruang" on public.penugasan_pml_ppl;
create policy "penugasan_pml_ppl_select_sesuai_ruang"
on public.penugasan_pml_ppl
for select
using (
  public.is_admin()
  or pml_id = auth.uid()
  or ppl_id = auth.uid()
  or exists (
    select 1
    from public.penugasan_korwil_pml kp
    where kp.korwil_id = auth.uid()
      and kp.pml_id = penugasan_pml_ppl.pml_id
  )
);

drop policy if exists "penugasan_pml_ppl_tulis_admin_atau_pml" on public.penugasan_pml_ppl;
create policy "penugasan_pml_ppl_tulis_admin_atau_pml"
on public.penugasan_pml_ppl
for insert
with check (
  public.is_admin()
  or pml_id = auth.uid()
);

drop policy if exists "penugasan_pml_ppl_ubah_admin_atau_pml" on public.penugasan_pml_ppl;
create policy "penugasan_pml_ppl_ubah_admin_atau_pml"
on public.penugasan_pml_ppl
for update
using (
  public.is_admin()
  or pml_id = auth.uid()
)
with check (
  public.is_admin()
  or pml_id = auth.uid()
);

drop policy if exists "penugasan_pml_ppl_hapus_admin_saja" on public.penugasan_pml_ppl;
create policy "penugasan_pml_ppl_hapus_admin_saja"
on public.penugasan_pml_ppl
for delete
using (public.is_admin());

-- PLOT WILAYAH
 drop policy if exists "plot_wilayah_select_sesuai_ruang" on public.plot_wilayah;
create policy "plot_wilayah_select_sesuai_ruang"
on public.plot_wilayah
for select
using (
  public.is_admin()
  or pml_id = auth.uid()
  or ppl_id = auth.uid()
  or korwil_id = auth.uid()
  or exists (
    select 1
    from public.penugasan_pml_ppl pp
    where pp.pml_id = plot_wilayah.pml_id
      and pp.ppl_id = auth.uid()
  )
);

drop policy if exists "plot_wilayah_tulis_admin_saja" on public.plot_wilayah;
create policy "plot_wilayah_tulis_admin_saja"
on public.plot_wilayah
for insert
with check (public.is_admin());

drop policy if exists "plot_wilayah_ubah_admin_saja" on public.plot_wilayah;
create policy "plot_wilayah_ubah_admin_saja"
on public.plot_wilayah
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "plot_wilayah_hapus_admin_saja" on public.plot_wilayah;
create policy "plot_wilayah_hapus_admin_saja"
on public.plot_wilayah
for delete
using (public.is_admin());

-- LAPORAN HARIAN
 drop policy if exists "laporan_harian_select_sesuai_ruang" on public.laporan_harian;
create policy "laporan_harian_select_sesuai_ruang"
on public.laporan_harian
for select
using (
  public.is_admin()
  or pml_id = auth.uid()
  or ppl_id = auth.uid()
  or korwil_id = auth.uid()
);

drop policy if exists "laporan_harian_tulis_admin_atau_pml" on public.laporan_harian;
create policy "laporan_harian_tulis_admin_atau_pml"
on public.laporan_harian
for insert
with check (
  public.is_admin()
  or pml_id = auth.uid()
);

drop policy if exists "laporan_harian_ubah_admin_atau_pml" on public.laporan_harian;
create policy "laporan_harian_ubah_admin_atau_pml"
on public.laporan_harian
for update
using (
  public.is_admin()
  or pml_id = auth.uid()
)
with check (
  public.is_admin()
  or pml_id = auth.uid()
);

drop policy if exists "laporan_harian_hapus_admin_saja" on public.laporan_harian;
create policy "laporan_harian_hapus_admin_saja"
on public.laporan_harian
for delete
using (public.is_admin());

-- DETAIL LAPORAN HARIAN
 drop policy if exists "detail_laporan_harian_select_sesuai_ruang" on public.detail_laporan_harian;
create policy "detail_laporan_harian_select_sesuai_ruang"
on public.detail_laporan_harian
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = detail_laporan_harian.laporan_id
      and (
        lh.pml_id = auth.uid()
        or lh.ppl_id = auth.uid()
        or lh.korwil_id = auth.uid()
      )
  )
  or exists (
    select 1
    from public.plot_wilayah pw
    where pw.id = detail_laporan_harian.plot_id
      and pw.ppl_id = auth.uid()
  )
);

drop policy if exists "detail_laporan_harian_tulis_admin_atau_pml" on public.detail_laporan_harian;
create policy "detail_laporan_harian_tulis_admin_atau_pml"
on public.detail_laporan_harian
for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = detail_laporan_harian.laporan_id
      and lh.pml_id = auth.uid()
  )
);

drop policy if exists "detail_laporan_harian_ubah_admin_atau_pml" on public.detail_laporan_harian;
create policy "detail_laporan_harian_ubah_admin_atau_pml"
on public.detail_laporan_harian
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = detail_laporan_harian.laporan_id
      and lh.pml_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = detail_laporan_harian.laporan_id
      and lh.pml_id = auth.uid()
  )
);

drop policy if exists "detail_laporan_harian_hapus_admin_saja" on public.detail_laporan_harian;
create policy "detail_laporan_harian_hapus_admin_saja"
on public.detail_laporan_harian
for delete
using (public.is_admin());

-- KENDALA LAPANGAN
 drop policy if exists "kendala_lapangan_select_sesuai_ruang" on public.kendala_lapangan;
create policy "kendala_lapangan_select_sesuai_ruang"
on public.kendala_lapangan
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = kendala_lapangan.laporan_id
      and (
        lh.pml_id = auth.uid()
        or lh.ppl_id = auth.uid()
        or lh.korwil_id = auth.uid()
      )
  )
);

drop policy if exists "kendala_lapangan_tulis_admin_atau_pml" on public.kendala_lapangan;
create policy "kendala_lapangan_tulis_admin_atau_pml"
on public.kendala_lapangan
for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = kendala_lapangan.laporan_id
      and lh.pml_id = auth.uid()
  )
);

drop policy if exists "kendala_lapangan_ubah_admin_atau_pml" on public.kendala_lapangan;
create policy "kendala_lapangan_ubah_admin_atau_pml"
on public.kendala_lapangan
for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = kendala_lapangan.laporan_id
      and lh.pml_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.laporan_harian lh
    where lh.id = kendala_lapangan.laporan_id
      and lh.pml_id = auth.uid()
  )
);

drop policy if exists "kendala_lapangan_hapus_admin_saja" on public.kendala_lapangan;
create policy "kendala_lapangan_hapus_admin_saja"
on public.kendala_lapangan
for delete
using (public.is_admin());

-- LOG AUDIT
 drop policy if exists "log_audit_admin_saja" on public.log_audit;
create policy "log_audit_admin_saja"
on public.log_audit
for select
using (public.is_admin());

-- =========================
-- TRIGGER OPSIONAL: BUAT PROFIL OTOMATIS SAAT SIGN UP
-- =========================
create or replace function public.buat_profil_pengguna_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pengguna (id, email, nama_lengkap, nomor_hp, peran, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nama_lengkap', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'nomor_hp',
    coalesce((new.raw_user_meta_data ->> 'peran')::public.peran_pengguna, 'PPL'::public.peran_pengguna),
    'AKTIF'::public.status_pengguna
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_baru on auth.users;
create trigger trg_auth_user_baru
after insert on auth.users
for each row execute function public.buat_profil_pengguna_baru();
