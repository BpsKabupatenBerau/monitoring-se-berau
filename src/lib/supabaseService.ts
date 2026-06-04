/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * supabaseService.ts
 * ------------------
 * All Supabase data-access functions for the SE2026 Daily Monitoring System.
 *
 * Schema Mapping (Firebase → Supabase):
 *   users        → pengguna
 *   plots        → plot_wilayah
 *   submissions  → laporan_harian  (header) + detail_laporan_harian (per-plot)
 *   issues       → kendala_lapangan
 *
 * NOTE: The Supabase schema uses UUID primary keys. However, this app uses
 * string IDs (e.g. 'admin', 'sukarsono', 'plot_001') inherited from the
 * Firebase era. We store those as a `legacy_id` text column and map them
 * back to the TypeScript interfaces so NO component code needs to change.
 *
 * Real-time is provided via Supabase postgres_changes channels.
 */

import { supabase } from './supabase';
import { User, Plot, DailySubmission, Issue, UserRole, MonitoringStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map Supabase `peran_pengguna` enum values → app UserRole.
 * The DB uses 'KORWIL', the app uses 'REGIONAL_COORDINATOR'.
 */
function mapPeran(peran: string): UserRole {
  return peran as UserRole;
}

function mapPeranToDb(role: UserRole): string {
  return role;
}

/**
 * Map Supabase `status_laporan_harian` → app MonitoringStatus
 */
function mapStatusLaporan(status: string): MonitoringStatus {
  switch (status) {
    case 'SELESAI':      return 'COMPLETED';
    case 'PROSES':       return 'IN_PROGRESS';
    case 'TERKENDALA':   return 'BLOCKED';
    default:             return 'NOT_STARTED';
  }
}

function mapStatusLaporanToDb(status: MonitoringStatus): string {
  switch (status) {
    case 'COMPLETED':    return 'SELESAI';
    case 'IN_PROGRESS':  return 'PROSES';
    case 'BLOCKED':      return 'TERKENDALA';
    default:             return 'BELUM_MULAI';
  }
}

/**
 * Map Supabase `status_kendala` → app Issue status
 */
function mapStatusKendala(status: string): 'OPEN' | 'RESOLVED' {
  return status === 'SELESAI' ? 'RESOLVED' : 'OPEN';
}

function mapStatusKendalaToDb(status: 'OPEN' | 'RESOLVED'): string {
  return status === 'RESOLVED' ? 'SELESAI' : 'TERBUKA';
}

function getOperationalToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isMutableReportDate(date: string): boolean {
  return date === getOperationalToday();
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS (pengguna)
// ─────────────────────────────────────────────────────────────────────────────

/** Row shape returned by Supabase for `pengguna` */
interface PenggunaRow {
  id: string;              // UUID
  legacy_id: string | null;
  email: string | null;
  nama_lengkap: string;
  nomor_hp: string | null;
  peran: string;           // peran_pengguna enum
  status: string;
  kecamatan: string | null;
  pml_legacy_id: string | null;
  korwil_legacy_id: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: PenggunaRow): User {
  return {
    id:       row.legacy_id ?? row.id,
    username: row.username ?? row.email?.split('@')[0] ?? row.legacy_id ?? row.id,
    name:     row.nama_lengkap,
    role:     mapPeran(row.peran),
    email:    row.email ?? undefined,
    district: row.kecamatan ?? undefined,
    pmlId:    row.pml_legacy_id ?? undefined,
    regCoId:  row.korwil_legacy_id ?? undefined,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('pengguna')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[fetchUsers]', error.message);
    return [];
  }
  return (data as PenggunaRow[]).map(rowToUser);
}

export async function createUser(user: Omit<User, 'id'>): Promise<void> {
  if (!user.password || user.password.length < 6) {
    throw new Error('Password pengguna minimal 6 karakter.');
  }

  // Use the user-provided email, or fall back to a @bps.id domain.
  // Note: @se2026.bps.go.id is rejected by Supabase Auth (go.id TLD not recognised).
  const email = (user.email || (user.username + '@bps.id')).trim().toLowerCase();
  const previousSession = await supabase.auth.getSession();

  let authUserId: string | null = null;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: user.password,
    options: {
      data: {
        username: user.username,
        nama_lengkap: user.name,
        peran: mapPeranToDb(user.role),
      },
    },
  });

  if (!authError && authData?.user) {
    // Auth signup succeeded — use the returned UUID
    authUserId = authData.user.id;
  } else if (
    authError &&
    (
      authError.code === 'email_address_invalid' ||
      authError.code === 'email_address_not_authorized' ||
      authError.code === 'over_email_send_rate_limit' ||
      (authError.status !== undefined && authError.status >= 422)
    )
  ) {
    // Supabase Auth rejected the email domain (e.g. go.id TLD) or hit a rate
    // limit.  Generate a UUID and proceed with a direct pengguna insert so the
    // user still appears in the app (they can log in via username lookup).
    console.warn('[createUser] Auth signUp failed:', authError.code, '— falling back to direct pengguna insert.');
    authUserId = crypto.randomUUID();
  } else if (authError) {
    throw authError;
  }

  if (!authUserId) throw new Error('Supabase Auth tidak mengembalikan user baru.');

  // IMPORTANT: restore the admin session BEFORE upserting into pengguna so that
  // RLS sees the admin role (not the new user's just-created session).
  if (previousSession.data.session) {
    await supabase.auth.setSession({
      access_token:  previousSession.data.session.access_token,
      refresh_token: previousSession.data.session.refresh_token,
    });
  }
  const { error: profileError } = await supabase.from('pengguna').upsert({
    id:               authUserId,
    legacy_id:        authUserId,
    username:         user.username,
    nama_lengkap:     user.name,
    email,
    peran:            mapPeranToDb(user.role),
    kecamatan:        user.district ?? null,
    pml_legacy_id:    user.pmlId ?? null,
    korwil_legacy_id: user.regCoId ?? null,
    status:           'AKTIF',
  }, { onConflict: 'id' });

  if (profileError) throw profileError;
  console.log(`[createUser] Created user: ${user.username}, role: ${user.role}, district: ${user.district}`);


  if (user.role === 'PPL' && user.pmlId) {
    await supabase.from('penugasan_pml_ppl').upsert({
      pml_id: user.pmlId,
      ppl_id: authUserId,
    }, { onConflict: 'pml_id,ppl_id' });
  }

  if (user.role === 'PML' && user.regCoId) {
    await supabase.from('penugasan_korwil_pml').upsert({
      korwil_id: user.regCoId,
      pml_id:    authUserId,
    }, { onConflict: 'korwil_id,pml_id' });
  }
}

export async function deleteUser(legacyId: string): Promise<void> {
  const { error } = await supabase
    .from('pengguna')
    .delete()
    .eq('legacy_id', legacyId);
  if (error) console.error('[deleteUser]', error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// PLOTS (plot_wilayah)
// ─────────────────────────────────────────────────────────────────────────────

interface PlotWilayahRow {
  id: string;
  legacy_id: string | null;
  idsubsls: string;
  kecamatan: string;
  desa: string;
  sls: string | null;
  sub_sls: string | null;
  nama_sls?: string | null;
  target_prelist?: number | null;
  korwil_id: string | null;
  pml_id: string | null;
  ppl_id: string | null;
  aktif: boolean;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPlot(row: PlotWilayahRow): Plot {
  return {
    id: row.legacy_id ?? row.idsubsls ?? row.id,
    idSubsls: row.idsubsls,
    district: row.kecamatan,
    village: row.desa,
    sls: row.sls ?? '',
    subSls: row.sub_sls ?? '',
    namaSls: row.nama_sls ?? undefined,
    targetPrelist: row.target_prelist ?? undefined,
    assignedKorwilId: row.korwil_id ?? '',
    assignedPplId: row.ppl_id ?? '',
    assignedPmlId: row.pml_id ?? '',
  };
}

export async function fetchPlots(): Promise<Plot[]> {
  const pageSize = 1000;
  let allData: PlotWilayahRow[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error, count } = await supabase
      .from('plot_wilayah')
      .select('*', { count: 'exact' })
      .order('idsubsls')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('[fetchPlots]', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data as PlotWilayahRow[]);
      hasMore = data.length === pageSize;
      page++;
    }

    if (page === 1) {
      console.log(`[fetchPlots] Loaded ${allData.length} plots (total in DB: ${count})`);
    }
  }

  console.log(`[fetchPlots] Completed: fetched all ${allData.length} plots`);
  return allData.map(rowToPlot);
}

export async function createPlot(plot: Omit<Plot, 'id'>): Promise<void> {
  const idSubsls = plot.idSubsls.trim();
  const { error } = await supabase.from('plot_wilayah').insert({
    legacy_id:        idSubsls,
    idsubsls:         idSubsls,
    kecamatan:        plot.district,
    desa:             plot.village,
    sls:              plot.sls,
    sub_sls:          plot.subSls,
    nama_sls:         plot.namaSls ?? null,
    target_prelist:   plot.targetPrelist ?? 0,
    pml_legacy_id:    plot.assignedPmlId || null,
    ppl_legacy_id:    plot.assignedPplId || null,
    korwil_legacy_id: null,
  });
  if (error) throw error;
}

export async function updatePlot(legacyId: string, partial: Partial<Plot>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (partial.idSubsls)      updates.idsubsls = partial.idSubsls;
  if (partial.idSubsls)      updates.legacy_id = partial.idSubsls;
  if (partial.district)      updates.kecamatan = partial.district;
  if (partial.village)       updates.desa = partial.village;
  if (partial.sls)           updates.sls = partial.sls;
  if (partial.subSls)        updates.sub_sls = partial.subSls;
  if (partial.namaSls !== undefined) updates.nama_sls = partial.namaSls || null;
  if (partial.targetPrelist !== undefined) updates.target_prelist = partial.targetPrelist ?? 0;
  if (partial.assignedPmlId !== undefined) updates.pml_legacy_id = partial.assignedPmlId || null;
  if (partial.assignedPplId !== undefined) updates.ppl_legacy_id = partial.assignedPplId || null;

  const { error } = await supabase
    .from('plot_wilayah')
    .update(updates)
    .eq('legacy_id', legacyId);
  if (error) console.error('[updatePlot]', error.message);
}

export async function deletePlot(legacyId: string): Promise<void> {
  const { error } = await supabase
    .from('plot_wilayah')
    .delete()
    .eq('legacy_id', legacyId);
  if (error) console.error('[deletePlot]', error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS (laporan_harian)
// ─────────────────────────────────────────────────────────────────────────────

interface LaporanHarianRow {
  id: string;             // UUID
  legacy_id: string | null;
  tanggal_laporan: string;
  pml_legacy_id: string | null;
  ppl_legacy_id: string | null;
  plot_legacy_id: string | null;
  status_laporan: string;
  capaian_harian: number;
  ada_kendala: boolean;
  deskripsi_kendala: string | null;
  dibuat_oleh_legacy_id: string | null;
  dibuat_pada: string;
  updated_at: string;
  catatan: string | null;
}

function rowToSubmission(row: LaporanHarianRow): DailySubmission {
  return {
    id:                    row.legacy_id ?? row.id,
    date:                  row.tanggal_laporan,
    plotId:                row.plot_legacy_id ?? '',
    pplId:                 row.ppl_legacy_id ?? '',
    submittedByPmlId:      row.pml_legacy_id ?? undefined,
    completedUnits:        row.capaian_harian,
    status:                mapStatusLaporan(row.status_laporan),
    issueIndicator:        row.ada_kendala,
    issueDescription:      row.deskripsi_kendala ?? '',
    timestamp:             row.dibuat_pada,
    lastModifiedTimestamp: row.updated_at !== row.dibuat_pada ? row.updated_at : undefined,
  };
}

export async function fetchSubmissions(): Promise<DailySubmission[]> {
  const { data, error } = await supabase
    .from('laporan_harian')
    .select('*')
    .order('dibuat_pada', { ascending: false });

  if (error) {
    console.error('[fetchSubmissions]', error.message);
    return [];
  }
  return (data as LaporanHarianRow[]).map(rowToSubmission);
}

export async function createSubmission(sub: Omit<DailySubmission, 'id' | 'timestamp'>): Promise<DailySubmission | null> {
  const legacyId = `sub_${Date.now()}`;
  const timestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from('laporan_harian')
    .insert({
      legacy_id:              legacyId,
      tanggal_laporan:        sub.date,
      ppl_legacy_id:          sub.pplId,
      pml_legacy_id:          sub.submittedByPmlId ?? null,
      plot_legacy_id:         sub.plotId,
      status_laporan:         mapStatusLaporanToDb(sub.status),
      capaian_harian:         sub.completedUnits,
      ada_kendala:            sub.issueIndicator,
      deskripsi_kendala:      sub.issueDescription || null,
      dibuat_oleh_legacy_id:  sub.submittedByPmlId ?? null,
      dibuat_pada:            timestamp,
    })
    .select()
    .single();

  if (error) {
    console.error('[createSubmission]', error.message);
    return null;
  }

  return rowToSubmission(data as LaporanHarianRow);
}

export async function updateSubmission(sub: DailySubmission): Promise<void> {
  if (!isMutableReportDate(sub.date)) {
    console.warn('[updateSubmission] skipped: report is locked as audit history', sub.id);
    return;
  }

  const { error } = await supabase
    .from('laporan_harian')
    .update({
      status_laporan:    mapStatusLaporanToDb(sub.status),
      capaian_harian:    sub.completedUnits,
      ada_kendala:       sub.issueIndicator,
      deskripsi_kendala: sub.issueDescription || null,
      pml_legacy_id:     sub.submittedByPmlId ?? null,
    })
    .eq('legacy_id', sub.id);

  if (error) console.error('[updateSubmission]', error.message);
}

export async function deleteSubmission(legacyId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('laporan_harian')
    .select('tanggal_laporan')
    .eq('legacy_id', legacyId)
    .maybeSingle();

  if (fetchError) {
    console.error('[deleteSubmission] fetch failed:', fetchError.message);
    return;
  }

  if (!existing || !isMutableReportDate((existing as Pick<LaporanHarianRow, 'tanggal_laporan'>).tanggal_laporan)) {
    console.warn('[deleteSubmission] skipped: report is locked as audit history', legacyId);
    return;
  }

  const { error } = await supabase
    .from('laporan_harian')
    .delete()
    .eq('legacy_id', legacyId);
  if (error) console.error('[deleteSubmission]', error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// ISSUES (kendala_lapangan)
// ─────────────────────────────────────────────────────────────────────────────

interface KendalaLapanganRow {
  id: string;
  legacy_id: string | null;
  laporan_legacy_id: string | null;
  ppl_legacy_id: string | null;
  ppl_nama: string | null;
  plot_legacy_id: string | null;
  area_label: string | null;
  tanggal: string | null;
  jenis_kendala: string | null;
  deskripsi: string;
  status_kendala: string;
  tindak_lanjut: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIssue(row: KendalaLapanganRow): Issue {
  return {
    id:              row.legacy_id ?? row.id,
    submissionId:    row.laporan_legacy_id ?? '',
    pplId:           row.ppl_legacy_id ?? '',
    pplName:         row.ppl_nama ?? '',
    plotId:          row.plot_legacy_id ?? '',
    areaLabel:       row.area_label ?? '',
    date:            row.tanggal ?? '',
    description:     row.deskripsi,
    status:          mapStatusKendala(row.status_kendala),
    resolutionNotes: row.tindak_lanjut ?? undefined,
    resolvedAt:      row.resolved_at ?? undefined,
  };
}

export async function fetchIssues(): Promise<Issue[]> {
  const { data, error } = await supabase
    .from('kendala_lapangan')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchIssues]', error.message);
    return [];
  }
  return (data as KendalaLapanganRow[]).map(rowToIssue);
}

export async function createIssue(issue: Omit<Issue, 'id'>): Promise<void> {
  const legacyId = `issue_${Date.now()}`;
  const { error } = await supabase.from('kendala_lapangan').insert({
    legacy_id:         legacyId,
    laporan_legacy_id: issue.submissionId,
    ppl_legacy_id:     issue.pplId,
    ppl_nama:          issue.pplName,
    plot_legacy_id:    issue.plotId,
    area_label:        issue.areaLabel,
    tanggal:           issue.date,
    deskripsi:         issue.description,
    status_kendala:    mapStatusKendalaToDb(issue.status),
  });
  if (error) console.error('[createIssue]', error.message);
}

export async function updateIssueStatus(
  legacyId: string,
  status: 'OPEN' | 'RESOLVED',
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('kendala_lapangan')
    .update({
      status_kendala: mapStatusKendalaToDb(status),
      tindak_lanjut:  notes ?? null,
      resolved_at:    status === 'RESOLVED' ? new Date().toISOString() : null,
    })
    .eq('legacy_id', legacyId);
  if (error) console.error('[updateIssueStatus]', error.message);
}

export async function deleteIssueBySubmission(submissionLegacyId: string): Promise<void> {
  const { error } = await supabase
    .from('kendala_lapangan')
    .delete()
    .eq('laporan_legacy_id', submissionLegacyId);
  if (error) console.error('[deleteIssueBySubmission]', error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP (seed initial data if tables are empty)
// ─────────────────────────────────────────────────────────────────────────────

export async function bootstrapIfEmpty(
  users: import('../types').User[],
  plots: import('../types').Plot[],
  submissions: DailySubmission[],
  issues: Issue[]
): Promise<void> {
  // Check if pengguna table is empty
  const { count, error: countErr } = await supabase
    .from('pengguna')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('[bootstrapIfEmpty] count check failed:', countErr.message);
    return;
  }

  if ((count ?? 0) > 0) {
    console.log('[bootstrap] Supabase already has data, skipping seed.');
    return;
  }

  console.log('[bootstrap] Seeding initial data into Supabase...');

  // Insert users
  const penggunaRows = users.map(u => ({
    id:               u.id,   // use legacy string id as PK for demo (no real UUID auth)
    legacy_id:        u.id,
    username:         u.username,
    nama_lengkap:     u.name,
    email:            `${u.username}@se2026.bps.go.id`,
    peran:            mapPeranToDb(u.role),
    kecamatan:        u.district ?? null,
    pml_legacy_id:    u.pmlId ?? null,
    korwil_legacy_id: u.regCoId ?? null,
    status:           'AKTIF',
  }));

  const { error: userErr } = await supabase.from('pengguna').insert(penggunaRows);
  if (userErr) {
    console.error('[bootstrap] pengguna insert failed:', userErr.message);
    return;
  }

  // Insert plots
  const plotRows = plots.map(p => ({
    id:              p.id,
    legacy_id:       p.id,
    idsubsls:        p.id,
    kecamatan:       p.district,
    desa:            p.village,
    sls:             p.sls,
    sub_sls:         p.subSls,
    pml_legacy_id:   p.assignedPmlId,
    ppl_legacy_id:   p.assignedPplId,
    korwil_legacy_id: null,
  }));

  const { error: plotErr } = await supabase.from('plot_wilayah').insert(plotRows);
  if (plotErr) {
    console.error('[bootstrap] plot_wilayah insert failed:', plotErr.message);
    return;
  }

  // Insert submissions
  const laporanRows = submissions.map(s => ({
    id:                    s.id,
    legacy_id:             s.id,
    tanggal_laporan:       s.date,
    ppl_legacy_id:         s.pplId,
    pml_legacy_id:         s.submittedByPmlId ?? null,
    plot_legacy_id:        s.plotId,
    status_laporan:        mapStatusLaporanToDb(s.status),
    capaian_harian:        s.completedUnits,
    ada_kendala:           s.issueIndicator,
    deskripsi_kendala:     s.issueDescription || null,
    dibuat_oleh_legacy_id: s.submittedByPmlId ?? null,
    dibuat_pada:           s.timestamp,
    korwil_legacy_id:      null,
  }));

  const { error: subErr } = await supabase.from('laporan_harian').insert(laporanRows);
  if (subErr) {
    console.error('[bootstrap] laporan_harian insert failed:', subErr.message);
    return;
  }

  // Insert issues
  const kendalaRows = issues.map(i => ({
    id:                i.id,
    legacy_id:         i.id,
    laporan_legacy_id: i.submissionId,
    ppl_legacy_id:     i.pplId,
    ppl_nama:          i.pplName,
    plot_legacy_id:    i.plotId,
    area_label:        i.areaLabel,
    tanggal:           i.date,
    deskripsi:         i.description,
    status_kendala:    mapStatusKendalaToDb(i.status),
    tindak_lanjut:     i.resolutionNotes ?? null,
    resolved_at:       i.resolvedAt ?? null,
  }));

  const { error: issueErr } = await supabase.from('kendala_lapangan').insert(kendalaRows);
  if (issueErr) {
    console.error('[bootstrap] kendala_lapangan insert failed:', issueErr.message);
    return;
  }

  console.log('[bootstrap] Supabase seeded successfully!');
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET (delete all + re-seed from initial mock data)
// ─────────────────────────────────────────────────────────────────────────────

export async function resetToBaseline(
  users: import('../types').User[],
  plots: import('../types').Plot[],
  submissions: DailySubmission[],
  issues: Issue[]
): Promise<void> {
  // Delete in dependency order
  await supabase.from('kendala_lapangan').delete().neq('id', 'impossible');
  await supabase.from('laporan_harian').delete().neq('id', 'impossible');
  await supabase.from('plot_wilayah').delete().neq('id', 'impossible');
  await supabase.from('pengguna').delete().neq('id', 'impossible');

  await bootstrapIfEmpty(users, plots, submissions, issues);
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function subscribeToChanges(callbacks: {
  onUsersChange: (users: User[]) => void;
  onPlotsChange: (plots: Plot[]) => void;
  onSubmissionsChange: (submissions: DailySubmission[]) => void;
  onIssuesChange: (issues: Issue[]) => void;
}) {
  const channel = supabase
    .channel('se2026_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pengguna' }, async () => {
      const users = await fetchUsers();
      callbacks.onUsersChange(users);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'plot_wilayah' }, async () => {
      const plots = await fetchPlots();
      callbacks.onPlotsChange(plots);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laporan_harian' }, async () => {
      const submissions = await fetchSubmissions();
      callbacks.onSubmissionsChange(submissions);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kendala_lapangan' }, async () => {
      const issues = await fetchIssues();
      callbacks.onIssuesChange(issues);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH (Supabase email/password)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in through Supabase Auth when a password is provided.
 * Without a password, this only resolves a public demo profile by username/email.
 */
export async function signInUser(usernameOrEmail: string, password?: string): Promise<User | null> {
  const normalized = usernameOrEmail.trim().toLowerCase();
  // Try the exact string as email first; fall back to @bps.id suffix.
  // Legacy accounts may have been created with @se2026.bps.go.id — we try
  // that as a second fallback inside the signInWithPassword block below.
  const email = normalized.includes('@') ? normalized : normalized + '@bps.id';
  const emailLegacy = normalized.includes('@') ? normalized : normalized + '@se2026.bps.go.id';

  if (password) {
    // Try primary email first, then legacy @se2026.bps.go.id domain.
    let authData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | null = null;
    for (const tryEmail of [email, emailLegacy]) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: tryEmail, password });
      if (!error && data.user) {
        authData = data;
        break;
      }
    }

    if (!authData?.user) return null;

    const { data: byId } = await supabase
      .from('pengguna')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (byId) return rowToUser(byId as PenggunaRow);

    const { data: byEmail } = await supabase
      .from('pengguna')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    return byEmail ? rowToUser(byEmail as PenggunaRow) : null;
  }

  const query = normalized.includes('@')
    ? supabase.from('pengguna').select('*').eq('email', normalized).maybeSingle()
    : supabase.from('pengguna').select('*').ilike('username', normalized).maybeSingle();

  const { data, error } = await query;
  if (error || !data) return null;
  return rowToUser(data as PenggunaRow);
}


export async function getAssignments() {
  const { data, error } = await supabase
    .from('plot_wilayah')
    .select(`
      id,
      idsubsls,
      kecamatan,
      desa,
      nama_sls,
      target_prelist,

      korwil_id,
      pml_id,
      ppl_id,

      korwil:korwil_id (
        id,
        nama_lengkap
      ),

      pml:pml_id (
        id,
        nama_lengkap
      ),

      ppl:ppl_id (
        id,
        nama_lengkap
      )
    `)
    .order('kecamatan')
    .order('desa');

  if (error) throw error;

  return data;
}

export async function getKorwilList() {
  const { data, error } = await supabase
    .from('pengguna')
    .select('id,nama_lengkap')
    .eq('peran', 'KORWIL')
    .eq('status', 'AKTIF')
    .order('nama_lengkap');

  if (error) throw error;

  return data;
}

export async function getPmlList() {
  const { data, error } = await supabase
    .from('pengguna')
    .select('id,nama_lengkap')
    .eq('peran', 'PML')
    .eq('status', 'AKTIF')
    .order('nama_lengkap');

  if (error) throw error;

  return data;
}

export async function getPplList() {
  const { data, error } = await supabase
    .from('pengguna')
    .select('id,nama_lengkap')
    .eq('peran', 'PPL')
    .eq('status', 'AKTIF')
    .order('nama_lengkap');

  if (error) throw error;

  return data;
}

export async function bulkAssignPlots(
  plotIds: string[],
  korwilId: string,
  pmlId: string,
  pplId: string
) {
  const { error } = await supabase
    .from('plot_wilayah')
    .update({
      korwil_id: korwilId,
      pml_id: pmlId,
      ppl_id: pplId,

      korwil_legacy_id: korwilId,
      pml_legacy_id: pmlId,
      ppl_legacy_id: pplId,

      updated_at: new Date().toISOString(),
    })
    .in('id', plotIds);

  if (error) throw error;

  return true;
}