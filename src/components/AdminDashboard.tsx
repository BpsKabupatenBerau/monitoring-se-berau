/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  ShieldAlert, 
  TrendingUp, 
  Activity,
  UserPlus
} from 'lucide-react';
import { User, Plot, DailySubmission, Issue, UserRole } from '../types';
import { berauDistricts } from '../data/berauDistricts';

interface AdminDashboardProps {
  users: User[];
  plots: Plot[];
  submissions: DailySubmission[];
  issues: Issue[];
  selectedDate: string;
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onDeleteUser: (id: string) => void;
  onUpdateIssueStatus: (id: string, status: 'OPEN' | 'RESOLVED', notes?: string) => void;
}

export default function AdminDashboard({
  users,
  plots,
  submissions,
  issues,
  selectedDate,
  onAddUser,
  onDeleteUser,
  onUpdateIssueStatus
}: AdminDashboardProps) {
  // Stats
  const totalPlotsCount = plots.length;
  
  // Reported plots on the selected date or historically
  const reportedPlotsCount = plots.filter(plot => 
    submissions.some(s => s.plotId === plot.id && s.date === selectedDate)
  ).length;

  const unreportedPlotsCount = totalPlotsCount - reportedPlotsCount;
  
  // Total completed plots historically
  const completedPlotsCount = plots.filter(plot => 
    submissions.some(s => s.plotId === plot.id && s.status === 'COMPLETED')
  ).length;

  const totalProgressPercentage = totalPlotsCount > 0 
    ? Math.round((completedPlotsCount / totalPlotsCount) * 1000) / 10 
    : 0;

  // District wise summarizes
  const districtSummaries = berauDistricts.map(dist => {
    const distPlots = plots.filter(p => p.district === dist);
    const distPpls = users.filter(u => u.role === 'PPL' && u.district === dist);
    const distPmls = users.filter(u => u.role === 'PML' && u.district === dist);
    
    const reportedDistToday = distPlots.filter(plot => 
      submissions.some(s => s.plotId === plot.id && s.date === selectedDate)
    ).length;

    const completedDist = distPlots.filter(plot => 
      submissions.some(s => s.plotId === plot.id && s.status === 'COMPLETED')
    ).length;

    const progressDistPct = distPlots.length > 0 
      ? Math.round((completedDist / distPlots.length) * 100) 
      : 0;

    const openIssuesDist = issues.filter(i => 
      i.status === 'OPEN' && distPpls.map(p => p.id).includes(i.pplId)
    ).length;

    return {
      district: dist,
      totalPlots: distPlots.length,
      reportedToday: reportedDistToday,
      progressPct: progressDistPct,
      openIssues: openIssuesDist,
      pplCount: distPpls.length,
      pmlCount: distPmls.length
    };
  }).filter(sum => sum.totalPlots > 0); // show only configured

  // User management form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('PPL');
  const [district, setDistrict] = useState('Kelay');
  const [selectedPmlId, setSelectedPmlId] = useState('');
  const [selectedRegCoId, setSelectedRegCoId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Handle add user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !email.trim() || !password.trim() || !name.trim()) {
      setErrorMsg('Harap lengkapi username, email, password, dan nama petugas.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password Supabase Auth minimal 6 karakter.');
      return;
    }

    if (role === 'PPL' && !selectedPmlId) {
      setErrorMsg('PPL wajib dihubungkan ke supervisor PML.');
      return;
    }

    if (role === 'PML' && !selectedRegCoId) {
      setErrorMsg('PML wajib dihubungkan ke Korwil.');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setErrorMsg('Username sudah terdaftar dalam sistem.');
      return;
    }

    setIsSavingUser(true);
    try {
      await onAddUser({
        username: username.trim(),
        email: email.trim(),
        password,
        name: name.trim(),
        role,
        district: role !== 'ADMIN' ? district : undefined,
        pmlId: role === 'PPL' ? selectedPmlId : undefined,
        regCoId: role === 'PML' ? selectedRegCoId : undefined
      });

      setUsername('');
      setEmail('');
      setPassword('');
      setName('');
      setSelectedPmlId('');
      setSelectedRegCoId('');
      setSuccessMsg('Pengguna berhasil dibuat di Supabase Auth dan tabel pengguna.');
      setTimeout(() => setShowUserModal(false), 900);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat pengguna Supabase.';
      setErrorMsg(message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const [usersSearch, setUsersSearch] = useState('');

  return (
    <div className="space-y-6" id="admin-dashboard">
      
      {/* Top Banner with Stats BPS Berau Header */}
      <div className="geo-card p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-none">
        <div className="space-y-1">
          <span className="geo-badge text-[10px] bg-slate-900 text-amber-400">
            KANTOR BPS KABUPATEN BERAU
          </span>
          <h1 className="text-2xl font-display font-black text-slate-900 mt-2 uppercase tracking-tight">
            Administrator: SE2026 Daily Monitoring System
          </h1>
          <p className="text-slate-650 text-xs">
            Panel kendali nasional pangkalan data Sensus Ekonomi 2026 Kabupaten Berau, Provinsi Kalimantan Timur.
          </p>
        </div>
        <div className="bg-amber-400 border-[3.5px] border-slate-900 px-4 py-3 rounded-none flex items-center gap-3 self-start xl:self-auto font-mono text-xs shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-none animate-ping" />
          <span className="text-slate-900 font-bold">Live Census Server ID: </span>
          <span className="font-extrabold text-slate-900">SE26-BERAU-MAIN</span>
        </div>
      </div>

      {/* Main KPI Stats Rows - exact PRD requested values! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="admin-primary-stats">
        <div className="geo-card p-5 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total SLS Ditargetkan</p>
          <p className="text-4xl font-display font-black text-slate-900" id="adm-total-plots-count">
            {totalPlotsCount}
          </p>
          <div className="text-[10px] text-slate-450 font-mono font-bold">Blok SLS terdaftar dari pusat.</div>
        </div>

        <div className="geo-card p-5 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Telah Dilaporkan Hari Ini</p>
          <p className="text-4xl font-display font-black text-emerald-600" id="adm-reported-today-count">
            {reportedPlotsCount}
          </p>
          <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 inline-block font-bold">
            {totalPlotsCount > 0 ? Math.round((reportedPlotsCount / totalPlotsCount) * 100) : 0}% Kepatuhan Hari Ini
          </div>
        </div>

        <div className="geo-card-amber p-5 space-y-2">
          <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-1">Belum Melaporkan Hari Ini</p>
          <p className="text-4xl font-display font-black text-red-600 font-mono" id="adm-unreported-today-count">
            {unreportedPlotsCount}
          </p>
          <div className="text-[10px] text-slate-950 font-bold uppercase font-mono">Blok SLS menanti pelaporan.</div>
        </div>

        <div className="geo-card p-5 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Progres Penyelesaian Selesai</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-display font-black text-indigo-600" id="adm-overall-progress">
              {totalProgressPercentage}%
            </p>
            <span className="text-[11px] font-mono font-bold text-slate-500">({completedPlotsCount} SLS)</span>
          </div>
          <div className="w-full h-4 bg-white border-2 border-slate-900 p-[1px] mt-1 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${totalProgressPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Districts summary bento box / PRD District Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District tables */}
        <div className="lg:col-span-2 geo-card p-5 space-y-4 shadow-none">
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Building2 size={18} className="text-indigo-600 shrink-0" /> Ringkasan Kecamatan
              </h2>
              <p className="text-[11px] text-slate-550 mt-0.5">Metrik performa dan progress census terdaftar per kecamatan.</p>
            </div>
            <span className="geo-badge text-[10px] bg-slate-100 text-slate-900 border-slate-400 px-2.5 py-0.5 font-mono">
              {districtSummaries.length} Di-assign
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5">Kecamatan</th>
                  <th className="py-2.5 text-center">Petugas (PML/PPL)</th>
                  <th className="py-2.5 text-center">Total SLS</th>
                  <th className="py-2.5 text-center">Lapor Hari Ini</th>
                  <th className="py-2.5 text-center">Progress Selesai</th>
                  <th className="py-2.5 text-center">Kendala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {districtSummaries.map(sum => (
                  <tr key={sum.district} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{sum.district}</td>
                    <td className="py-3 text-center text-slate-500 font-mono">
                      {sum.pmlCount} PML / {sum.pplCount} PPL
                    </td>
                    <td className="py-3 text-center text-slate-700 font-mono font-semibold">{sum.totalPlots}</td>
                    <td className="py-3 text-center">
                      <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black">
                        {sum.reportedToday} SLS
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-black text-slate-800">{sum.progressPct}%</span>
                        <div className="w-12 bg-white border border-slate-900 h-3.5 p-[1px] overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${sum.progressPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {sum.openIssues > 0 ? (
                        <span className="geo-badge text-[9px] text-rose-700 bg-rose-50 border-rose-350">
                          {sum.openIssues} OPEN
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-600 font-extrabold bg-emerald-50/50 border border-emerald-400 px-1 inline-block">AMAN</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Management and role config */}
        <div className="geo-card p-5 space-y-4 shadow-none">
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
                <Users size={18} className="text-indigo-600 shrink-0" /> Pengguna Sensus
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Aktivasi akun tim sensus Berau.</p>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="geo-btn-amber py-1 px-2.5 text-[10px] cursor-pointer"
            >
              TAMBAH
            </button>
          </div>

          {/* User management inline list */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Pengguna..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full bg-white border-2 border-slate-900 focus:border-indigo-500 outline-none p-2 pl-8 h-8 rounded-none text-xs font-mono"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {users
                .filter(u => u.name.toLowerCase().includes(usersSearch.toLowerCase()) || u.role.toLowerCase().includes(usersSearch.toLowerCase()))
                .map(u => (
                  <div key={u.id} className="p-2.5 bg-white border-2 border-slate-900 rounded-none flex items-center justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <span className="geo-badge text-[8px] bg-slate-100 text-slate-900 border-slate-400 px-1 py-0.2 uppercase leading-none font-black font-mono">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Username: {u.username} | {u.district ? `Kec: ${u.district}` : 'GLOBAL MASTER'}
                      </p>
                    </div>

                    {u.id !== 'admin' && (
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="text-slate-350 hover:text-rose-500 p-1 bg-white rounded border border-slate-100 hover:border-slate-200 transition-colors"
                        title="Hapus User"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

      </div>

      {/* Issues center for Admin */}
      <div className="geo-card p-5 space-y-4 shadow-none" id="admin-issues-board">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <ShieldAlert size={18} className="text-rose-500 shrink-0" /> Kendala &amp; Solusi Lapangan Nasional
            </h2>
            <p className="text-[11px] text-slate-550 mt-0.5">Berikut daftar semua kendala operasional yang dilaporkan oleh petugas pencacah.</p>
          </div>
          <span className="geo-badge text-[10px] bg-rose-50 text-rose-700 border-rose-300 font-mono">
            {issues.filter(i => i.status === 'OPEN').length} OPEN
          </span>
        </div>

        {issues.length === 0 ? (
          <p className="text-slate-500 text-xs italic text-center py-6">Alhamdulillah, tidak ada kendala lapangan dilaporkan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {issues.map(issue => (
              <div key={issue.id} className="p-4 bg-white border-2 border-slate-900 rounded-none space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center justify-between text-xs">
                  <span className={`geo-badge text-[10px] uppercase font-black font-mono leading-none ${
                    issue.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-400'
                  }`}>
                    {issue.status}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700 block">{issue.pplName}</span>
                    <span className="text-[9px] text-slate-400 font-mono block">Tanggal: {issue.date}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Lokasi: {issue.areaLabel}
                  </p>
                  <p className="text-xs italic bg-slate-50 p-2.5 border-2 border-slate-900 font-mono text-slate-750">
                    "{issue.description}"
                  </p>
                </div>

                {issue.status === 'RESOLVED' ? (
                  <div className="bg-emerald-50 p-2.5 border-2 border-emerald-400 text-emerald-800 text-[11px]">
                    <span className="font-bold block uppercase font-mono tracking-wider text-[9px] text-emerald-700">Tanggapan/Solusi:</span>
                    <p className="italic">"{issue.resolutionNotes}"</p>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onUpdateIssueStatus(issue.id, 'RESOLVED', 'Diselesaikan oleh Administrator utama. Telah dikoordinasikan dengan aparat desa setempat.')}
                      className="geo-btn-amber text-[10px] px-3 py-1.5"
                    >
                      BANTU SELESAIKAN KENDALA
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-105 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="font-display font-semibold text-sm">Tambah Pengguna Baru (Tim Sensus SE2026)</h3>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg font-medium">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">{successMsg}</div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Username Login <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ppl_faisal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Email Supabase Auth <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: faisal@gmail.com atau faisal@bps.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Password Awal <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Nama Lengkap Petugas <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Faisal Ahmad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Role / Jabatan Sistem <span className="text-rose-500">*</span></label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                >
                  <option value="KORWIL">KORWIL</option>
                  <option value="PML">PML (Supervisor Lapangan)</option>
                  <option value="PPL">PPL (Pencacah Lapangan)</option>
                  <option value="ADMIN">ADMINISTRATOR (BPS Berau)</option>
                </select>
              </div>

              {role !== 'ADMIN' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Daerah / Kecamatan Tugas <span className="text-rose-500">*</span></label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  >
                    {berauDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'PPL' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">Supervisor PML Pendamping</label>
                  <select
                    value={selectedPmlId}
                    onChange={(e) => setSelectedPmlId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  >
                    <option value="">-- Pilih Supervisor Sensus --</option>
                    {users.filter(u => u.role === 'PML').map(u => (
                      <option key={u.id} value={u.id}>{u.name} (Kec. {u.district})</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'PML' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-450 block">PJ Wilayah Korwil Pendamping</label>
                  <select
                    value={selectedRegCoId}
                    onChange={(e) => setSelectedRegCoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none p-2.5 rounded-lg focus:bg-white text-xs"
                  >
                    <option value="">-- Pilih Regional Coordinator --</option>
                    {users.filter(u => u.role === 'KORWIL').map(u => (
                      <option key={u.id} value={u.id}>{u.name} (Kec. {u.district})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-2.5 rounded-lg font-bold"
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
