/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  History, 
  ClipboardList,
  Clock,
  ShieldAlert,
  UserCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { User, Plot, DailySubmission, MonitoringStatus, Issue } from '../types';

interface PplDashboardProps {
  currentUser: User;
  plots: Plot[];
  submissions: DailySubmission[];
  issues: Issue[];
  selectedDate: string;
  users: User[];
}

export default function PplDashboard({
  currentUser,
  plots,
  submissions,
  issues,
  selectedDate,
  users
}: PplDashboardProps) {
  // Filter plots assigned to this PPL
  const myPlots = plots.filter(v => v.assignedPplId === currentUser.id);

  // Filter submissions made for this PPL
  const mySubmissions = submissions.filter(s => s.pplId === currentUser.id);

  // Submissions for the today date
  const mySubmissionsToday = mySubmissions.filter(s => s.date === selectedDate);

  // Find their PML supervisor
  const myPml = users.find(u => u.id === currentUser.pmlId);
  const myPmlName = myPml ? myPml.name : currentUser.pmlId || 'Belum Ditentukan';

  // Helper to get submission status for a plot as of selectedDate
  const getPlotStatusToday = (plotId: string): { status: MonitoringStatus | 'NOT_REPORTED'; units: number; hasIssue: boolean } => {
    const sub = mySubmissionsToday.find(s => s.plotId === plotId);
    if (sub) {
      return { status: sub.status, units: sub.completedUnits, hasIssue: sub.issueIndicator };
    }
    // Check previous submissions to see if it was completed
    const pastSubs = mySubmissions.filter(s => s.plotId === plotId && s.date < selectedDate);
    const wasCompleted = pastSubs.some(s => s.status === 'COMPLETED');
    if (wasCompleted) {
      return { status: 'COMPLETED', units: 0, hasIssue: false };
    }
    return { status: 'NOT_REPORTED', units: 0, hasIssue: false };
  };

  const getStatusBadge = (status: MonitoringStatus | 'NOT_REPORTED') => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="geo-badge text-[10px] bg-emerald-50 text-emerald-800 border-emerald-400 font-mono font-black uppercase shadow-none">
            SELESAI
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="geo-badge text-[10px] bg-sky-50 text-sky-855 border-sky-450 font-mono font-black uppercase shadow-none">
            PROSES
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="geo-badge text-[10px] bg-rose-50 text-rose-800 border-rose-450 font-mono font-black uppercase shadow-none">
            TERHAMBAT
          </span>
        );
      case 'NOT_STARTED':
        return (
          <span className="geo-badge text-[10px] bg-slate-100 text-slate-800 border-slate-400 font-mono font-black uppercase shadow-none">
            BELUM MULAI
          </span>
        );
      default:
        return (
          <span className="geo-badge text-[10px] bg-amber-50 text-amber-800 border-amber-450 font-mono font-black uppercase shadow-none">
            BLM LAPOR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="ppl-dashboard">
      {/* Top Banner / Welcome card - Read-Only Alert */}
      <div className="geo-card p-6 border-4 border-slate-900 bg-white shadow-none">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="geo-badge text-[10px] bg-slate-905 text-amber-400 border-slate-900 font-black uppercase tracking-wider font-mono">
              Petugas Pencacah Lapangan (PPL) - HANYA LIHAT (READ-ONLY VIEW)
            </span>
          </div>
          <h1 className="text-2xl font-display font-black text-slate-900 uppercase leading-none">
            Hallo, {currentUser.name}
          </h1>
          <p className="text-slate-700 text-xs mt-2 font-semibold">
            Wilayah Tugas: Kecamatan <span className="font-extrabold text-slate-900">{currentUser.district}</span>.
          </p>

          <div className="mt-4 p-4.5 bg-amber-50 border-2 border-slate-900 rounded-none text-slate-900 space-y-1.5 shadow-[2px_2px_0px_0px_#0f172a]">
            <p className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-600" /> Aturan Bisnis Pelaporan:
            </p>
            <p className="text-xs leading-relaxed text-slate-800 font-medium font-sans">
              Sesuai prosedur baru SE2026, PPL tidak melakukan input data monitoring harian secara langsung ke aplikasi. 
              Harap laporkan progress harian serta kendala Anda kepada PML Supervisor Anda:{" "}
              <strong className="text-slate-950 font-black underline">{myPmlName} (PML ID: {currentUser.pmlId || 'N/A'})</strong>.
              Supervisor PML Anda yang bertanggung jawab menginput dan memverifikasi data monitoring Anda di sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Progress counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geo-card p-4 shadow-none shadow-none" id="stat-total-plots">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ALOKASI SLS</p>
          <p className="text-3xl font-display font-black text-slate-900">{myPlots.length}</p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono uppercase font-bold">Beban Tugas</span>
        </div>
        <div className="geo-card p-4 shadow-none shadow-none" id="stat-reported-today">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">SUDAH DIINPUT HARI INI</p>
          <p className="text-3xl font-display font-black text-emerald-600">{mySubmissionsToday.length}</p>
          <span className="text-[10px] text-emerald-600 block mt-1 font-mono uppercase font-bold">Oleh PML</span>
        </div>
        <div className="geo-card-amber p-4 shadow-none shadow-none" id="stat-pending-today">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">BELUM DIINPUT</p>
          <p className="text-3xl font-display font-black text-slate-950">
            {myPlots.length - mySubmissionsToday.length}
          </p>
          <span className="text-[10px] text-slate-900 block mt-1 font-mono uppercase font-bold">Sisa SLS</span>
        </div>
        <div className="geo-card p-4 shadow-none shadow-none" id="stat-completed-plots">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">CAH SELESAI</p>
          <p className="text-3xl font-display font-black text-indigo-600">
            {myPlots.filter(p => mySubmissions.some(s => s.plotId === p.id && s.status === 'COMPLETED')).length}
          </p>
          <span className="text-[10px] text-indigo-600 block mt-1 font-mono uppercase font-bold">Selesai Total</span>
        </div>
      </div>

      {/* Plots lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 geo-card p-5 space-y-4 shadow-none shadow-none">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <ClipboardList size={18} className="text-indigo-600 shrink-0" /> Alokasi Plot Sensus / SLS Saya
            </h2>
            <span className="geo-badge text-[10px] bg-slate-100 text-slate-900 border-slate-400 font-mono font-bold">
              Laporan: {selectedDate}
            </span>
          </div>

          <div className="space-y-3">
            {myPlots.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border-2 border-slate-900 rounded-none">
                <p className="text-slate-500 font-mono text-xs">Tidak ada plot SLS yang ditugaskan ke Anda.</p>
              </div>
            ) : (
              myPlots.map(plot => {
                const stateToday = getPlotStatusToday(plot.id);
                return (
                  <div 
                    key={plot.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border-2 border-slate-900 rounded-none gap-3 shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="geo-badge text-[9px] bg-slate-100 text-slate-900 border-slate-450 font-mono font-black">{plot.subSls}</span>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase font-display tracking-tight">{plot.village}</h4>
                      </div>
                      <p className="text-[11.5px] text-slate-500 font-mono">
                        SLS: {plot.sls} | ID: {plot.id}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      {stateToday.status !== 'NOT_REPORTED' && (
                        <div className="text-right sm:mr-3">
                          <p className="text-[9px] uppercase font-mono text-slate-500 font-bold">Pencacahan Hari Ini</p>
                          <p className="text-xs font-black text-slate-905 font-mono">+{stateToday.units} Unit</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(stateToday.status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* History of submissions / Recent Activity with audit trails */}
        <div className="geo-card p-5 space-y-4 shadow-none shadow-none">
          <div className="border-b-2 border-slate-900 pb-3">
            <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <History size={18} className="text-slate-600 shrink-0" /> Riwayat Laporan Harian
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Semua laporan harian yang telah diinput PML Anda.</p>
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
            {mySubmissions.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-none">
                <p className="text-slate-550 font-mono text-xs">Belum ada laporan yang diinputkan supervisor.</p>
              </div>
            ) : (
              mySubmissions.map(sub => {
                const plot = plots.find(p => p.id === sub.plotId);
                const recordedByPmlUser = users.find(u => u.id === sub.submittedByPmlId);
                const pmlNameLabel = recordedByPmlUser ? recordedByPmlUser.name : sub.submittedByPmlId || 'PML Supervisor';

                return (
                  <div key={sub.id} className="p-3 bg-white border-2 border-slate-900 rounded-none space-y-2.5 shadow-[1.5px_1.5px_0px_0px_#0f172a]">
                    <div className="flex items-center justify-between">
                      <span className="geo-badge text-[9px] bg-slate-105 text-slate-900 border-slate-350 px-1.5 py-0.5 font-mono font-bold">
                        {sub.date}
                      </span>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900 uppercase font-display leading-tight">
                        {plot ? `${plot.village} (${plot.subSls})` : 'Plot Tidak Ditemukan'}
                      </p>
                      <p className="text-[11.5px] text-slate-700 font-mono">
                        Hasil Hari Ini: <span className="font-bold text-indigo-650">+{sub.completedUnits} R.T. / Usaha</span>
                      </p>
                    </div>

                    {/* Supervisor input audits */}
                    <div className="bg-slate-50 p-2.5 border-2 border-slate-900 rounded-none text-[9.5px] text-slate-750 space-y-1 font-mono">
                      <div className="flex items-start gap-1">
                        <UserCheck size={12} className="text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-black text-slate-900 uppercase">Input Oleh:</span> {pmlNameLabel}
                        </div>
                      </div>
                      <div className="text-slate-500">
                        Status Posting: {sub.timestamp ? new Date(sub.timestamp).toLocaleString('id-ID') : '-'}
                      </div>
                      {sub.lastModifiedTimestamp && (
                        <div className="text-[9.5px]/snug text-amber-900 font-black bg-amber-50 px-1 py-1 border border-amber-300 mt-1 uppercase">
                          Last Modified: {new Date(sub.lastModifiedTimestamp).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    {sub.issueIndicator && (
                      <div className="bg-rose-50/50 rounded-none p-2 text-[10.5px] border-2 border-rose-300 text-rose-800 flex gap-1.5 font-mono">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-500" />
                        <div>
                          <span className="font-black block text-[9px] uppercase font-mono tracking-wide text-rose-700">Kendala Dilaporkan:</span>
                          <span className="italic">"{sub.issueDescription}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
