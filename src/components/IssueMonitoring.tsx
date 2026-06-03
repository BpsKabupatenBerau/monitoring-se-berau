/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Eye, 
  HelpCircle, 
  MessageSquare,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { Issue, User } from '../types';

interface IssueMonitoringProps {
  issues: Issue[];
  currentUser: User;
  onUpdateIssueStatus: (id: string, status: 'OPEN' | 'RESOLVED', notes?: string) => void;
}

export default function IssueMonitoring({
  issues,
  currentUser,
  onUpdateIssueStatus
}: IssueMonitoringProps) {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'ALL' || issue.status === filterStatus;
    const matchesSearch = !searchQuery || 
      issue.pplName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      issue.areaLabel.toLowerCase().includes(searchQuery.toLowerCase()) || 
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleResolve = (id: string) => {
    if (!resolutionText.trim()) {
      setErrorMsg('Harap masukkan tanggapan atau solusi penyelesaian.');
      return;
    }
    const resolverName = currentUser.name;
    const notes = `${resolutionText.trim()} (Ditangani oleh ${resolverName})`;
    onUpdateIssueStatus(id, 'RESOLVED', notes);
    setResolutionText('');
    setSelectedIssueId(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-6" id="issue-monitoring-panel">
      {/* Title */}
      <div className="geo-card p-5 space-y-1 shadow-none">
        <h1 className="text-xl font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
          <AlertTriangle size={20} className="text-rose-500 shrink-0" /> Pusat Pemantauan Kendala Lapangan
        </h1>
        <p className="text-slate-500 text-xs font-medium">
          Halaman monitoring untuk melacak hambatan lapangan (penolakan, cuaca ekstrim, kendala transportasi, dll.) yang dialami oleh petugas sensus di lapangan.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="geo-card bg-slate-100/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-none">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Status buttons */}
          <div className="flex bg-slate-200 border-2 border-slate-900 p-0.5 rounded-none w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-1.5 rounded-none font-bold uppercase cursor-pointer text-[11px] transition-all ${
                filterStatus === 'ALL' ? 'bg-slate-900 text-white font-black' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Semua ({issues.length})
            </button>
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`px-3.5 py-1.5 rounded-none font-bold uppercase cursor-pointer text-[11px] transition-all ${
                filterStatus === 'OPEN' ? 'bg-slate-900 text-rose-500 font-black' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Open ({issues.filter(i => i.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3.5 py-1.5 rounded-none font-bold uppercase cursor-pointer text-[11px] transition-all ${
                filterStatus === 'RESOLVED' ? 'bg-slate-900 text-emerald-400 font-black' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Resolved ({issues.filter(i => i.status === 'RESOLVED').length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Cari petugas, lokasi, kendala..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 p-2 pl-8 h-9 rounded-none outline-none text-xs font-mono"
            />
            <Search size={12} className="absolute left-2.5 top-3 text-slate-400" />
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono font-bold text-slate-550">
          Status Sinkronisasi: Aktif
        </span>
      </div>

      {/* Issues list rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left list of issues */}
        <div className="lg:col-span-2 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="geo-card p-12 text-center text-slate-500 shadow-none">
              <ShieldCheck size={40} className="mx-auto text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm uppercase font-display">Tidak Ada Kendala Lapangan</h4>
              <p className="text-xs text-slate-550 max-w-xs mx-auto mt-1">
                Semua kegiatan sensus berjalan dengan tertib. Tidak ada laporan kendala bermasalah pada status pencarian.
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => {
              const isSelected = selectedIssueId === issue.id;
              return (
                <div 
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssueId(issue.id);
                    setResolutionText('');
                    setErrorMsg('');
                  }}
                  className={`bg-white border-2 p-4 transition-all relative cursor-pointer ${
                    isSelected 
                      ? 'border-slate-950 bg-amber-400/10 shadow-[3px_3px_0px_0px_#0f172a]' 
                      : 'border-slate-900 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`geo-badge text-[10px] uppercase font-black font-mono leading-none ${
                      issue.status === 'RESOLVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400' 
                        : 'bg-rose-50 text-rose-700 border-rose-450'
                    }`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{issue.date}</span>
                  </div>

                  <div className="space-y-1.5 mt-2.5">
                    <h3 className="font-display font-semibold text-slate-800 text-sm">
                      {issue.areaLabel}
                    </h3>
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      "{issue.description}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2.5 border-t border-slate-50 text-slate-400">
                    <span>Oleh: <span className="font-semibold text-slate-700">{issue.pplName}</span> (PPL)</span>
                    <span className="text-indigo-600 flex items-center gap-1">
                      Klik untuk Detail <Eye size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right detail view or response action */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 h-fit">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" /> Detail &amp; Intervensi Supervisor
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Penanganan kendala langsung untuk kesuksesan SE2026.</p>
          </div>

          {!selectedIssueId ? (
            <div className="text-center py-12 text-slate-400">
              <HelpCircle size={32} className="mx-auto text-slate-300 animate-pulse mb-3" />
              <p className="text-xs">
                Pilih salah satu hambatan di sebelah kiri untuk meninjau detail dan memasukkan tanggapan intervensi.
              </p>
            </div>
          ) : (
            (() => {
              const issue = issues.find(i => i.id === selectedIssueId);
              if (!issue) return <p className="text-xs text-rose-500">Masalah telah dihapus.</p>;

              return (
                <div className="space-y-4 text-xs text-slate-705">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-slate-400">DETAIL LOKASI KENDALA:</div>
                    <p className="font-semibold text-slate-800 text-sm">{issue.areaLabel}</p>
                    <p className="font-mono text-[10px] text-slate-400">Pencacah: {issue.pplName} (PPL ID: {issue.pplId})</p>
                  </div>

                  <div className="space-y-1 p-3 bg-rose-50/50 border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_0px_#0f172a]">
                    <div className="font-mono text-[9px] font-black text-rose-700 uppercase">Hambatan Lapangan:</div>
                    <p className="italic text-slate-800 font-mono mt-1 text-xs">"{issue.description}"</p>
                  </div>

                  <hr className="border-t-2 border-slate-900" />

                  {issue.status === 'RESOLVED' ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">TANGGAPAN &amp; SOLUSI LAPANGAN:</div>
                      <div className="bg-emerald-50 border-2 border-emerald-400 p-3.5 rounded-none text-emerald-990 space-y-1 leading-relaxed italic font-mono font-bold">
                        "{issue.resolutionNotes}"
                      </div>
                      {issue.resolvedAt && (
                        <p className="text-[10px] text-slate-500 font-mono text-right">Diselesaikan pada: {new Date(issue.resolvedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[10px] font-mono text-slate-450 uppercase font-black">TINDAKAN / INTERVENSI:</div>
                      
                      {currentUser.role === 'PPL' ? (
                        <p className="text-xs text-slate-650 italic bg-amber-200 p-2.5 border-2 border-slate-900 rounded-none shadow-[2.5px_2.5px_0px_0px_#0f172a]">
                          Laporan masih berstatus OPEN. Supervisor / PML pendamping Anda akan segera menindaklanjuti kendala ini.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {errorMsg && <div className="p-2 border-2 border-rose-450 text-rose-700 bg-rose-50 rounded-none font-bold font-mono">{errorMsg}</div>}
                          
                          <textarea
                            placeholder="Ketik rincian solusi atau tanggapan intervensi pemecahan masalah... (misal: Sensus dilakukan malam hari / didampingi satpam setempat)"
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="w-full bg-white border-2 border-slate-900 focus:bg-slate-50 text-xs p-2.5 h-24 resize-none rounded-none outline-none focus:border-indigo-650 font-mono"
                          />

                          <button
                            onClick={() => handleResolve(issue.id)}
                            className="geo-btn-amber w-full py-2.5 text-xs inline-block text-center tracking-tight"
                          >
                            TANDAI DISELESAIKAN (RESOLVE)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

      </div>

    </div>
  );
}
