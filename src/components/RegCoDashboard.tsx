/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert, 
  FileText,
  Search,
  Check,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { User, Plot, DailySubmission, Issue } from '../types';

interface RegCoDashboardProps {
  currentUser: User;
  users: User[];
  plots: Plot[];
  submissions: DailySubmission[];
  issues: Issue[];
  selectedDate: string;
}

export default function RegCoDashboard({
  currentUser,
  users,
  plots,
  submissions,
  issues,
  selectedDate
}: RegCoDashboardProps) {
  const myPlots = plots.filter(p => p.assignedKorwilId === currentUser.id);
  const myDistricts = [...new Set(myPlots.map(p => p.district))];
  const plotMap = new Map(plots.map(p => [p.id, p]));

  // Find PMLs assigned to this district
  const myPmlIds = [...new Set(myPlots.map(p => p.assignedPmlId).filter(Boolean))];
  const myPmls = users.filter(u =>u.role === 'PML' && myPmlIds.includes(u.id));

  // Find PPLs assigned to this district
  const myPplIds = [...new Set(myPlots.map(p => p.assignedPplId).filter(Boolean))];
  const myPpls = users.filter(u => u.role === 'PPL' && myPplIds.includes(u.id));

  // Filter plots within this district
  const myRegionPlots = myPlots;
  const totalRegionPlots = myRegionPlots.length;

  // Filter submissions in this district
  const regionSubmissions = submissions.filter(s => myPplIds.includes(s.pplId));
  const submissionsToday = regionSubmissions.filter(s => s.date === selectedDate);

  // Filter issues in this district
  const regionIssues = regionSubmissions.filter(s => s.issueIndicator && s.issueDescription?.trim()).map(s => {
    const ppl = users.find( u => u.id === s.pplId);
    return {
      id: s.id,
      pplName: ppl?.name ?? 'Unknown',
      date: s.date,
      areaLabel: plotMap.get(s.plotId)?.namaSls ?? plotMap.get(s.plotId)?.idSubsls?? s.plotId,
      description: s.issueDescription,
      status: 'OPEN'
    };
  });
  const activeIssuesToday = regionSubmissions.filter(s => s.issueIndicator && s.issueDescription?.trim()).length;

  // Calculate compliance statistics for PPLs in this region today
  const ppmReportingCompliance = myPpls.map(ppl => {
    const subsToday = submissionsToday.filter(s => s.pplId === ppl.id);
    return {
      ppl,
      hasSubmitted: subsToday.length > 0,
      submissions: subsToday
    };
  });

  const reportedTodayCount = ppmReportingCompliance.filter(c => c.hasSubmitted).length;
  const notReportedTodayCount = myPpls.length - reportedTodayCount;

  // Completion progress overall
  const completedPlots = myRegionPlots.filter(plot => 
    submissions.some(s => s.plotId === plot.id && s.status === 'COMPLETED')
  ).length;

  const progressPct = totalRegionPlots > 0 
    ? Math.round((completedPlots / totalRegionPlots) * 100) 
    : 0;

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPmlId, setSelectedPmlId] = useState<string | null>(null);
  const [selectedPplId, setSelectedPplId] = useState<string | null>(null);

  // Find PPLs assigned to specific PML (for filter/drill-down)
  const filteredPplsByPml =
  selectedPmlId
    ? myPpls.filter(ppl =>
        myPlots.some(
          plot =>
            plot.assignedPmlId === selectedPmlId &&
            plot.assignedPplId === ppl.id
        )
      )
    : myPpls;

  return (
    <div className="space-y-6" id="regco-dashboard">
      {/* Overview Welcomer */}
      <div className="geo-card bg-slate-900 border-4 border-slate-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
        <div>
          <span className="geo-badge text-[10px] bg-slate-900 text-amber-400 border-amber-450 uppercase tracking-wider font-mono">
            PJ Wilayah
          </span>
          <h1 className="text-2xl font-display font-black mt-2 text-white uppercase leading-tight">
            Wilayah Pengawasan: Kecamatan {myDistricts.length > 0 ? myDistricts.join(', ') : 'Belum Ada Penugasan'}
          </h1>
          <p className="text-slate-300 text-xs mt-1">
            Koordinator: <span className="font-semibold text-white">{currentUser.name}</span>. Meninjau secara real-time kesiapan data dan laporan harian semua pengawas (PML) dan pencacah (PPL).
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1.5 font-mono text-xs">
          <span className="text-slate-400">Pemberitahuan Sistem</span>
          <span className="bg-indigo-600/50 text-indigo-150 border-2 border-indigo-500 px-3 py-1 font-bold">
            Tanggal Pantau: {selectedDate}
          </span>
        </div>
      </div>

      {/* KPI Stats Panel - matching PRD format! */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="regco-kpis">
        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">PML Aktif</p>
          <p className="text-3xl font-display font-black text-slate-900">{myPmls.length}</p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono uppercase font-bold">PML</span>
        </div>

        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">PPL Aktif</p>
          <p className="text-3xl font-display font-black text-slate-900">{myPpls.length}</p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono uppercase font-bold">Pencacah di Lapangan</span>
        </div>

        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Kepatuhan Lapor</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-black text-emerald-600">{reportedTodayCount}</span>
            <span className="text-slate-400 font-bold">/</span>
            <span className="text-slate-600 font-mono font-bold text-lg">{myPpls.length}</span>
          </div>
          <span className="text-[10px] text-amber-600 font-mono block mt-1 font-bold">
            {notReportedTodayCount} Petugas Belum Lapor
          </span>
        </div>

        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Kendala Baru</p>
          <p className="text-3xl font-display font-black text-rose-600">{activeIssuesToday}</p>
          <span className="text-[10px] text-rose-500 font-mono block mt-1 font-bold uppercase">
            Memerlukan Intervensi
          </span>
        </div>
      </div>

      {/* Progress Metric Box */}
      <div className="geo-card p-6 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6" id="region-progress-status-box">
        <div className="space-y-1 md:max-w-md w-full">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Pencapaian Kecamatan {myDistricts.join(', ')}</p>
          <h3 className="text-xl font-display font-black text-slate-900 uppercase">Progress Selesai: {progressPct}%</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Dari total <span className="font-bold text-slate-900">{totalRegionPlots} SLS</span> lokasi yang ditetapkan, pendatanaan di <span className="font-bold text-slate-900">{completedPlots} SLS</span> telah selesai dilaporkan (COMPLETED) oleh PPL.
          </p>
        </div>
        <div className="flex-1 w-full bg-slate-50 border-2 border-slate-900 p-4 rounded-none space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">0%</span>
            <span className="text-indigo-600 font-black">{progressPct}%</span>
            <span className="text-slate-400">100%</span>
          </div>
          <div className="bg-slate-200 border border-slate-900 h-3 rounded-none overflow-hidden">
            <div className="bg-indigo-650 h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Team Hierarchy Overview & Compliance Checkers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PML Supervisors monitoring card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Daftar Pengawas (PML)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Memonitor beban pengawasan supervisor harian Anda.</p>
            </div>
            <span className="text-[10px] bg-slate-50 font-mono px-2 py-0.5 rounded text-amber-600 font-bold">
              {myPmls.length} PML
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedPmlId(null)}
              className={`w-full text-left p-3 rounded-lg border text-xs font-mono font-bold transition-all ${
                selectedPmlId === null 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
              }`}
            >
              TAMPILKAN SEMUA PPL ({myPpls.length})
            </button>

            {myPmls.map(pml => {
              const pmlPpls = myPpls.filter(ppl => myPlots.some(plot => plot.assignedPmlId === pml.id && plot.assignedPplId === ppl.id));
              const pmlPplIds = pmlPpls.map(ppl => ppl.id);
              
              // Count reported today
              const pmlReportedCount = ppmReportingCompliance.filter(c => pmlPplIds.includes(c.ppl.id) && c.hasSubmitted).length;

              return (
                <button
                  key={pml.id}
                  onClick={() => setSelectedPmlId(pml.id === selectedPmlId ? null : pml.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-slate-700 flex flex-col gap-2 ${
                    selectedPmlId === pml.id 
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' 
                      : 'bg-white hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800">{pml.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Supervisor PML</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono mt-1 pt-1.5 border-t border-slate-100 w-full text-slate-500">
                    <div>
                      Jumlah PPL: <span className="font-bold text-slate-700">{pmlPpls.length} orang</span>
                    </div>
                    <div>
                      Hari Ini: <span className="font-bold text-indigo-600">{pmlReportedCount} Lapor</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PPL compliance cards matching PRD "Sukosarono Assigned PPL Check-off list" but region wide */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-slate-805 flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" /> Kepatuhan & Progress Harian PPL
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedPmlId ? `Menampilkan PPL di bawah PML: ${users.find(u => u.id === selectedPmlId)?.name}` : 'Menampilkan seluruh PPL di Kecamatan tugas Anda.'}
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari PPL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 text-xs px-3 py-1.5 pl-8 rounded-lg w-full sm:w-44 font-mono"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
            {filteredPplsByPml
              .filter(ppl => ppl.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(ppl => {
                const isCompliant = ppmReportingCompliance.find(c => c.ppl.id === ppl.id)?.hasSubmitted;
                const pplPlots = myRegionPlots.filter(p => p.assignedPplId === ppl.id);
                const pplSubmissions = regionSubmissions.filter(s => s.pplId === ppl.id);
                
                // Count units completed total
                const totalRuta = pplSubmissions.reduce((acc, curr) => acc + (curr.rutaDidata ?? 0), 0);
                const totalUsaha = pplSubmissions.reduce((acc, curr) => acc + (curr.usahaDidata ?? 0), 0);
                const totalStiker = pplSubmissions.reduce((acc, curr) => acc + (curr.stikerDigunakan ?? 0), 0);

                // Supervisor name
                const assignedPlot = myPlots.find( p => p.assignedPplId === ppl.id);
                const supervisor = assignedPlot ? myPmls.find(p => p.id === assignedPlot.assignedPmlId): undefined;

                return (
                  <button key={ppl.id} onClick={() => setSelectedPplId(selectedPplId === ppl.id ? null : ppl.id)} 
                  className={`w-full text-left p-3 border rounded-xl transition-all ${selectedPplId === ppl.id ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isCompliant ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <h4 className="font-semibold text-slate-800 text-sm">{ppl.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400">PML: {supervisor ? supervisor.name : 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Total {pplPlots.length} SLS/Sub-SLS Ditugaskan</div> 
                        <div className="flex gap-3 flex-wrap">
                          <span>
                            Ruta:
                            <strong className="text-slate-800 ml-1">
                              {totalRuta}
                            </strong>
                          </span>
                          <span>
                            Usaha:
                            <strong className="text-slate-800 ml-1">
                              {totalUsaha}
                            </strong>
                          </span>
                          <span>
                            Stiker:
                            <strong className="text-slate-800 ml-1">
                              {totalStiker}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isCompliant 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {isCompliant ? '✓ SUDAH MELAPORKAN' : '✗ BELUM LAPOR HARI INI'}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Detail PPL */}
      {selectedPplId && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          {(() => {const selectedPpl = myPpls.find(p => p.id === selectedPplId);
          
          const pplSubmissions = regionSubmissions.filter(
            s => s.pplId === selectedPplId)
            .sort((a, b) => b.date.localeCompare(a.date)
          );
          
          const totalRuta = pplSubmissions.reduce(
            (a, b) => a + (b.rutaDidata ?? 0), 0
          );
          
          const totalUsaha = pplSubmissions.reduce(
            (a, b) => a + (b.usahaDidata ?? 0), 0
          );
          
          const totalStiker = pplSubmissions.reduce(
            (a, b) => a + (b.stikerDigunakan ?? 0), 0
          );

          return (
            <>
              <div className="border-b pb-3 mb-4">
                <h2 className="font-bold text-lg">  Riwayat Laporan PPL </h2>
                <p className="text-sm text-slate-500"> {selectedPpl?.name} </p>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-5">
                <div className="geo-card p-3">
                  <p className="text-xs"> Total Laporan </p>
                  <p className="text-2xl font-bold"> {pplSubmissions.length} </p>
                </div>
                <div className="geo-card p-3">
                  <p className="text-xs"> Ruta </p>
                  <p className="text-2xl font-bold"> {totalRuta} </p>
                </div>
                <div className="geo-card p-3">
                  <p className="text-xs"> Usaha </p>
                  <p className="text-2xl font-bold"> {totalUsaha} </p>
                </div>
                <div className="geo-card p-3">
                  <p className="text-xs"> Stiker </p>
                  <p className="text-2xl font-bold"> {totalStiker} </p>
                </div>
              </div>

            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2"> Tanggal </th>
                    <th className="text-left py-2"> Wilayah</th>
                    <th className="text-left py-2"> Status </th>
                    <th className="text-right py-2"> Ruta </th>
                    <th className="text-right py-2"> Usaha </th>
                    <th className="text-right py-2"> Stiker </th>
                  </tr>
                </thead>
                <tbody>
                  {pplSubmissions.map(sub => (
                    <tr key={sub.id} className="border-b">
                      <td className="py-2"> {sub.date} </td>
                      <td className="py-2">{plotMap.get(sub.plotId)?.namaSls ?? plotMap.get(sub.plotId)?.idSubsls ?? sub.plotId} </td>
                      <td className="py-2"> {sub.status} </td>
                      <td className="text-right py-2"> {sub.rutaDidata ?? 0} </td>
                      <td className="text-right py-2"> {sub.usahaDidata ?? 0} </td>
                      <td className="text-right py-2"> {sub.stikerDigunakan ?? 0} </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
    </div>
  )}


      {/* Region issues log */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-500 hover:rotate-12 transition-transform" /> Kendala Aktif di Kecamatan {myDistricts.join(', ')}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Daftar kendala lapangan yang dilaporkan oleh petugas agar diketahu oleh Korwil.</p>
        </div>

        {regionIssues.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-450 text-xs">Aman. Tidak ada kendala lapangan dilaporkan di daerah Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regionIssues.map(issue => (
              <div key={issue.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    issue.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {issue.status}
                  </span>
                  <span className="font-semibold text-slate-700">{issue.pplName}</span>
                </div>
                <p className="text-xs font-medium text-slate-800">
                  Area: {issue.areaLabel}
                </p>
                <p className="text-xs font-mono text-slate-400 italic">
                  "{issue.description}"
                </p>
                {issue.status === 'RESOLVED' && (
                  <div className="bg-emerald-50/50 p-2 rounded text-[11px] border border-emerald-100/50 text-emerald-800 italic mt-2">
                    <span className="font-semibold not-italic block text-[9px] uppercase font-mono tracking-wider">Solusi/Tanggapan PMS:</span>
                    "{issue.resolutionNotes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
