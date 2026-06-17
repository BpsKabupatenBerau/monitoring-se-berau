/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Check, 
  HelpCircle,
  TrendingUp,
  MessageSquare,
  AlertOctagon,
  Plus,
  Edit2,
  Trash2,
  X,
  UserCheck
} from 'lucide-react';
import { User, Plot, DailySubmission, MonitoringStatus, Issue } from '../types';

function getOperationalToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

interface PmlDashboardProps {
  currentUser: User;
  users: User[];
  plots: Plot[];
  submissions: DailySubmission[];
  issues: Issue[];
  selectedDate: string;
  onUpdateIssueStatus: (id: string, status: 'OPEN' | 'RESOLVED', notes?: string) => void;
  onAddSubmission: (submission: Omit<DailySubmission, 'id' | 'timestamp'>) => void;
  onUpdateSubmission: (submission: DailySubmission) => void;
  onDeleteSubmission: (id: string) => void;
}

export default function PmlDashboard({
  currentUser,
  users,
  plots,
  submissions,
  issues,
  selectedDate,
  onUpdateIssueStatus,
  onAddSubmission,
  onUpdateSubmission,
  onDeleteSubmission
}: PmlDashboardProps) {
  // Find plots supervised by this PML
  const mySupervisedPlots = plots.filter(p => p.assignedPmlId === currentUser.id);
  const myDistricts = [...new Set(mySupervisedPlots.map(p => p.district))];

  // Submissions under this supervisor
  const myPplIds = [...new Set(mySupervisedPlots.map(p => p.assignedPplId).filter(Boolean))];
  const supervisedSubmissions = submissions.filter(s => myPplIds.includes(s.pplId));
  const submissionsToday = supervisedSubmissions.filter(s => s.date === selectedDate);
  const operationalToday = getOperationalToday();
  const canMutateSubmission = (submission: DailySubmission) => submission.date === operationalToday;

  // Find PPLs supervised by this PML
  const myPpls = users.filter(u => u.role === 'PPL' && myPplIds.includes(u.id));

  // Issues reported by supervised PPLs
  const supervisedIssues = issues.filter(i => myPplIds.includes(i.pplId));

  // PML resolving issues state
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [selectedPplId, setSelectedPplId] = useState<string | null>(null);

  // Add Monitor states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPplId, setAddPplId] = useState('');
  const [addPlotId, setAddPlotId] = useState('');
  const [addRutaDidata, setAddRutaDidata] = useState<number | ''>(0);
  const [addUsahaDidata, setAddUsahaDidata] = useState<number | ''>(0);
  const [addStikerDigunakan, setAddStikerDigunakan] = useState<number | ''>(0);
  const [addStatus, setAddStatus] = useState<MonitoringStatus>('IN_PROGRESS');
  const [addHasIssue, setAddHasIssue] = useState(false);
  const [addIssueDesc, setAddIssueDesc] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Same-day corrections are operational; previous dates are locked as audit history.
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<DailySubmission | null>(null);
  const [editRutaDidata, setEditRutaDidata] = useState<number | ''>(0);
  const [editUsahaDidata, setEditUsahaDidata] = useState<number | ''>(0);
  const [editStikerDigunakan, setEditStikerDigunakan] = useState<number | ''>(0);
  const [editStatus, setEditStatus] = useState<MonitoringStatus>('IN_PROGRESS');
  const [editHasIssue, setEditHasIssue] = useState(false);
  const [editIssueDesc, setEditIssueDesc] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Determine compliance for each PPL today
  const pplComplianceToday = myPpls.map(ppl => {
    const subsToday = submissionsToday.filter(s => s.pplId === ppl.id);
    const totalAssignedPlots = mySupervisedPlots.filter(p => p.assignedPplId === ppl.id).length;
    return {
      ppl,
      hasSubmitted: subsToday.length > 0,
      submissions: subsToday,
      totalAssignedPlots
    };
  });

  const reportedCount = pplComplianceToday.filter(c => c.hasSubmitted).length;
  const pendingCount = pplComplianceToday.length - reportedCount;

  // Percentage progress calculation
  const totalSubSlsSupervised = mySupervisedPlots.length;
  // Count how many plots have a completed status (historically or today)
  const completedPlotsCount = mySupervisedPlots.filter(plot => 
    submissions.some(s => s.plotId === plot.id && s.status === 'COMPLETED')
  ).length;

  const totalRuta = submissionsToday.reduce((acc, curr) => acc + (curr.rutaDidata ?? 0),0);
  const totalUsaha = submissionsToday.reduce((acc, curr) => acc + (curr.usahaDidata ?? 0),0);
  const totalStiker = submissionsToday.reduce((acc, curr) => acc + (curr.stikerDigunakan ?? 0),0);

  const progressPct = totalSubSlsSupervised > 0 
    ? Math.round((completedPlotsCount / totalSubSlsSupervised) * 100) 
    : 0;

  const handleResolveIssue = (issueId: string) => {
    if (!resolutionText.trim()) return;
    onUpdateIssueStatus(issueId, 'RESOLVED', resolutionText);
    setResolvingIssueId(null);
    setResolutionText('');
  };

  // Handle Add Submission submitted by PML on behalf of PPL
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!addPplId) {
      setAddError('Harap pilih petugas PPL terlebih dahulu.');
      return;
    }

    if (!addPlotId) {
      setAddError('Harap pilih unit SLS lokasi kerja.');
      return;
    }

    if (addRutaDidata < 0 || addUsahaDidata < 0 || addStikerDigunakan < 0) {
      setAddError('Jumlah tidak boleh bernilai negatif.');
      return;
    }

    const duplicate = submissions.find(
      s => s.plotId === addPlotId && s.date === selectedDate
    );
    if (duplicate) {
      const lockMessage = selectedDate === operationalToday
        ? 'Silakan koreksi laporan hari ini dari daftar riwayat di bawah.'
        : 'Laporan tanggal tersebut sudah menjadi audit history dan tidak dapat diubah.';
      setAddError(`Sudah ada laporan untuk lokasi SLS ini pada tanggal ${selectedDate}. ${lockMessage}`);
      return;
    }

    if (addHasIssue && !addIssueDesc.trim()) {
      setAddError('Harap lengkapi deskripsi kendala lapang yang dijumpai.');
      return;
    }

    // Send payload
    onAddSubmission({
      date: selectedDate,
      plotId: addPlotId,
      pplId: addPplId,
      completedUnits: addRutaDidata + addUsahaDidata,
      rutaDidata: addRutaDidata,
      usahaDidata: addUsahaDidata,
      stikerDigunakan: addStikerDigunakan,
      status: addStatus,
      issueIndicator: addHasIssue,
      issueDescription: addHasIssue ? addIssueDesc : '',
      submittedByPmlId: currentUser.id
    });

    setAddSuccess('Laporan progress harian PPL berhasil disimpan!');
    setTimeout(() => {
      setShowAddModal(false);
      setAddPplId('');
      setAddPlotId('');
      setAddRutaDidata(0);
      setAddUsahaDidata(0);
      setAddStikerDigunakan(0);
      setAddStatus('IN_PROGRESS');
      setAddHasIssue(false);
      setAddIssueDesc('');
      setAddSuccess('');
    }, 1200);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editingSubmission) return;

    if (!canMutateSubmission(editingSubmission)) {
      setEditError('Riwayat laporan dari tanggal sebelumnya sudah terkunci sebagai audit history.');
      return;
    }

    if (editRutaDidata < 0 || editUsahaDidata < 0 || editStikerDigunakan < 0) {
      setEditError('Jumlah tidak boleh bernilai negatif.');
      return;
    }

    if (editHasIssue && !editIssueDesc.trim()) {
      setEditError('Harap lengkapi deskripsi kendala yang terjadi.');
      return;
    }

    onUpdateSubmission({
      ...editingSubmission,
      completedUnits: editRutaDidata + editUsahaDidata,
      rutaDidata: editRutaDidata,
      usahaDidata: editUsahaDidata,
      stikerDigunakan: editStikerDigunakan,
      status: editStatus,
      issueIndicator: editHasIssue,
      issueDescription: editHasIssue ? editIssueDesc : '',
      submittedByPmlId: currentUser.id
    });

    setEditSuccess('Laporan harian berhasil dikoreksi.');
    setTimeout(() => {
      setShowEditModal(false);
      setEditingSubmission(null);
      setEditSuccess('');
    }, 1200);
  };

  const handleOpenEdit = (sub: DailySubmission) => {
    if (!canMutateSubmission(sub)) return;
    setEditingSubmission(sub);
    setEditRutaDidata(sub.rutaDidata ?? 0);
    setEditUsahaDidata(sub.usahaDidata ?? 0);
    setEditStikerDigunakan(sub.stikerDigunakan ?? 0);
    setEditStatus(sub.status);
    setEditHasIssue(sub.issueIndicator);
    setEditIssueDesc(sub.issueDescription);
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleConfirmDelete = (sub: DailySubmission) => {
    if (!canMutateSubmission(sub)) {
      window.alert('Riwayat laporan dari tanggal sebelumnya tidak dapat dihapus.');
      return;
    }

    if (window.confirm('Hapus laporan hari ini? Tindakan ini hanya tersedia pada tanggal laporan yang sedang berjalan.')) {
      onDeleteSubmission(sub.id);
    }
  };

  const getStatusBadge = (status: MonitoringStatus | 'NOT_REPORTED') => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="geo-badge text-[10px] bg-emerald-50 text-emerald-800 border-emerald-450 font-mono font-black uppercase">
            SELESAI
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="geo-badge text-[10px] bg-sky-50 text-sky-855 border-sky-450 font-mono font-black uppercase">
            PROSES
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="geo-badge text-[10px] bg-rose-50 text-rose-800 border-rose-450 font-mono font-black uppercase">
            TERHAMBAT
          </span>
        );
      default:
        return (
          <span className="geo-badge text-[10px] bg-slate-100 text-slate-800 border-slate-400 font-mono font-black uppercase">
            BELUM MULAI
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="pml-dashboard">
      {/* Welcome header */}
      <div className="geo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
        <div>
          <span className="geo-badge text-[10px] bg-slate-900 text-amber-400 border-amber-450 uppercase tracking-wider font-mono">
            Pengawas Lapangan (PML / Supervisor)
          </span>
          <h1 className="text-2xl font-display font-black mt-2 text-slate-900 uppercase leading-none">
            Supervisor: {currentUser.name}
          </h1>
          <p className="text-slate-605 text-xs mt-1.5 font-medium leading-normal">
            Memonitor kinerja <span className="font-extrabold text-slate-900">{myPpls.length} PPL</span> di Kecamatan <span className="font-extrabold text-slate-900">{myDistricts.join(', ')}</span>.
            Anda bertanggung jawab mencatatkan laporan kemajuan harian tim Anda.
          </p>
        </div>

        <button
          onClick={() => {
            setAddPplId('');
            setAddPlotId('');
            setAddRutaDidata(0);
            setAddUsahaDidata(0);
            setAddStikerDigunakan(0);
            setAddStatus('IN_PROGRESS');
            setAddHasIssue(false);
            setAddIssueDesc('');
            setAddError('');
            setShowAddModal(true);
          }}
          className="geo-btn-amber py-3 px-5 flex items-center justify-center gap-2 font-black text-xs leading-none uppercase shrink-0"
        >
          <Plus size={15} className="stroke-[3px]" /> INPUT PROGRESS HARIAN
        </button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">PPL DISUPERVISI</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-display font-black text-slate-900">{myPpls.length}</span>
            <span className="text-xs text-slate-505 uppercase font-mono font-bold">Orang</span>
          </div>
        </div>

        <div className="geo-card p-4 shadow-none" id="pml-compliance-card">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Kepatuhan Lapor</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-display font-black text-emerald-600">
              {reportedCount} <span className="text-slate-400 font-light text-xl">/</span> {myPpls.length}
            </span>
            <span className="geo-badge text-[10px] bg-emerald-50 text-emerald-800 border-emerald-450 font-mono font-black">
              {myPpls.length > 0 ? Math.round((reportedCount / myPpls.length) * 100) : 0}% lapor
            </span>
          </div>
        </div>

        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Jumlah SLS/Sub-SLS</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-display font-black text-teal-650" id="estimated-units">
              {supervisedSubmissions.reduce((acc, curr) => acc + (curr.completedUnits ?? 0),0)}
            </span>
            <span className="text-xs text-slate-500 uppercase font-mono font-bold">SLS/Sub-SLS</span>
          </div>
        </div>

        <div className="geo-card p-4 shadow-none">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Progress SLS Selesai</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-display font-black text-indigo-650">
              {progressPct}%
            </span>
            <div className="flex-1 bg-slate-100 border border-slate-900 h-2.5 rounded-none overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-501" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Checked/Unchecked Checklist Section from PRD */}
        <div className="geo-card p-5 space-y-4 shadow-none">
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <Users size={18} className="text-amber-500" /> Kepatuhan PPL
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Pantauan kepatuhan harian petugas yang disupervisi.</p>
            </div>
            <span className="geo-badge text-[10px] uppercase font-mono bg-slate-900 text-amber-400 border-slate-900">
              Tim
            </span>
          </div>

          <div className="space-y-2.5" id="pml-ppl-compliance-list">
            {pplComplianceToday.map(({ ppl, hasSubmitted, submissions: subs, totalAssignedPlots }) => (
              <button
                key={ppl.id}
                onClick={() => setSelectedPplId(selectedPplId === ppl.id ? null : ppl.id)}
                className={`w-full text-left p-3.5 border-2 rounded-none transition-all flex items-center justify-between cursor-pointer ${
                  selectedPplId === ppl.id 
                    ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-none font-black' 
                    : hasSubmitted 
                      ? 'bg-emerald-50/40 hover:bg-emerald-50 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_#0f172a]' 
                      : 'bg-rose-50 hover:bg-rose-100/70 border-slate-900 text-rose-950 shadow-[2px_2px_0px_0px_#0f172a]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-none shrink-0 border ${
                    hasSubmitted 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-450' 
                      : 'bg-rose-100 text-rose-800 border-rose-400'
                  }`}>
                    {hasSubmitted ? (
                      <Check size={12} strokeWidth={4} />
                    ) : (
                      <span className="text-[9px] font-sans font-black block px-1">✗</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm uppercase font-display tracking-tight leading-none mb-1">{ppl.name}</h4>
                    <p className={`text-[9.5px] font-mono leading-none ${selectedPplId === ppl.id ? 'text-amber-200' : 'text-slate-600 font-semibold'}`}>
                      {totalAssignedPlots} SLS | {subs.length} Diinput Hari Ini
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {hasSubmitted ? (
                    <span className={`text-[9px] font-mono font-black border uppercase px-1.5 py-0.5 rounded-none ${
                      selectedPplId === ppl.id 
                        ? 'bg-white/15 text-emerald-300 border-emerald-450' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-450'
                    }`}>
                      MASUK
                    </span>
                  ) : (
                    <span className={`text-[9px] font-mono font-black border uppercase px-1.5 py-0.5 rounded-none ${
                      selectedPplId === ppl.id 
                        ? 'bg-white/15 text-rose-300 border-rose-450' 
                        : 'bg-rose-100 text-rose-800 border-rose-400'
                    }`}>
                      REKAM
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Supervision / Detailed PPL Monitor Cards */}
        <div className="lg:col-span-2 bg-white border-4 border-slate-900 p-5 shadow-none space-y-4">
          <div className="border-b-2 border-slate-900 pb-3">
            <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp size={18} className="text-indigo-650" /> Kelola Progress SLS & Audit Laporan harian
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedPplId ? 'Detail lokasi SLS dan laporan progress yang bisa Anda kelola untuk tanggal berjalan.' : 'Pilih salah satu nama PPL di kiri untuk input, koreksi laporan hari ini, atau meninjau audit history.'}
            </p>
          </div>

          <div>
            {!selectedPplId ? (
              <div className="text-center py-16 bg-slate-50/50 border-2 border-slate-900">
                <HelpCircle size={32} className="mx-auto text-slate-600 animate-pulse" />
                <h4 className="font-black text-slate-900 mt-3 text-xs uppercase tracking-wider font-display">PILIH PETUGAS PPL</h4>
                <p className="text-slate-505 text-xs mt-1 max-w-sm mx-auto font-medium font-sans">
                  Ketuk salah satu petugas PPL di panel kiri. Anda dapat memantau status penyelesaian masing-masing SLS yang ditugaskan, 
                  melihat histori inputan, mengoreksi laporan hari ini, atau merekam laporan harian baru.
                </p>
              </div>
            ) : (
              (() => {
                const selectedPpl = myPpls.find(p => p.id === selectedPplId);
                if (!selectedPpl) return null;

                const plotsAllocated = mySupervisedPlots.filter(p => p.assignedPplId === selectedPplId);
                const ppliSubmissions = supervisedSubmissions.filter(s => s.pplId === selectedPplId);
                const subToday = submissionsToday.filter(s => s.pplId === selectedPplId);

                return (
                  <div className="space-y-4">
                    {/* Selected Banner */}
                    <div className="p-4 bg-slate-100 border-2 border-slate-900 rounded-none flex items-center justify-between">
                      <div>
                        <h4 className="font-display font-black text-slate-900 text-sm uppercase leading-tight">{selectedPpl.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-900 bg-white border-2 border-slate-900 px-2 py-1 font-mono uppercase font-black shadow-[1.5px_1.5px_0px_0px_#0f172a]">
                        {plotsAllocated.length} SLS TUGAS
                      </span>
                    </div>

                    {/* Plots list for the selected PPL */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-mono font-black text-slate-900 uppercase tracking-wider block">1. DAFTAR SLS YANG DITUGASKAN & STATUS:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plotsAllocated.map(plot => {
                          const findSubToday = subToday.find(s => s.plotId === plot.id);
                          const isCompleted = ppliSubmissions.some(s => s.plotId === plot.id && s.status === 'COMPLETED');
                          
                          let statusLabel = 'NOT_STARTED';
                          let statColor = 'bg-slate-100 border-slate-400 text-slate-800';
                          if (isCompleted) {
                            statusLabel = 'COMPLETED';
                            statColor = 'bg-emerald-100 border-emerald-450 text-emerald-900';
                          } else if (findSubToday) {
                            statusLabel = findSubToday.status;
                            statColor = findSubToday.status === 'BLOCKED' 
                              ? 'bg-rose-100 border-rose-450 text-rose-900' 
                              : 'bg-sky-100 border-sky-450 text-sky-900';
                          } else if (ppliSubmissions.some(s => s.plotId === plot.id)) {
                            statusLabel = 'IN_PROGRESS';
                            statColor = 'bg-slate-50 border-slate-350 text-slate-600';
                          }

                          return (
                            <div key={plot.id} className="p-3 bg-white border-2 border-slate-900 rounded-none shadow-[2px_2px_0px_0px_#0f172a] flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] font-black text-slate-900 bg-slate-100 border border-slate-950 px-1.5 py-0.5">
                                    {`${plot.sls}-${plot.subSls}`}
                                  </span>
                                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-none border ${statColor} uppercase`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="text-xs font-black text-slate-805 mt-2 uppercase font-display leading-tight">{plot.village}</p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-200">
                                {findSubToday ? (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 font-mono">Input Hari Ini:</span>
                                    <div className="text-xs font-black text-indigo-700 font-mono">
                                      <div className="text-right text-[10px] font-mono">
                                        <div>Ruta: {findSubToday.rutaDidata ?? 0}</div>
                                        <div>Usaha: {findSubToday.usahaDidata ?? 0}</div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-rose-600 font-bold uppercase font-mono">HARI INI BLM DIINPUT</span>
                                    {statusLabel !== 'COMPLETED' && (
                                      <button
                                        onClick={() => {
                                          setAddPplId(selectedPplId);
                                          setAddPlotId(plot.id);
                                          setAddRutaDidata(0);
                                          setAddUsahaDidata(0);
                                          setAddStikerDigunakan(0);
                                          setAddStatus('IN_PROGRESS');
                                          setAddHasIssue(false);
                                          setAddIssueDesc('');
                                          setAddError('');
                                          setShowAddModal(true);
                                        }}
                                        className="text-[9px] bg-amber-400 hover:bg-amber-500 border border-slate-900 text-slate-900 font-bold px-1.5 py-0.5 rounded-none cursor-pointer"
                                      >
                                        + INPUT
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submissions of selected PPL */}
                    <div className="space-y-2 mt-4">
                      <h5 className="text-[10px] font-mono font-black text-slate-900 uppercase tracking-wider block">2. RIWAYAT MONITORING PETUGAS :</h5>
                      {ppliSubmissions.length === 0 ? (
                        <div className="p-4 border-2 border-dashed border-slate-300 text-center">
                          <p className="text-xs text-slate-500 font-mono">Belum ada laporan yang terekam untuk PPL ini.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {ppliSubmissions.map(sub => {
                            const pl = plots.find(p => p.id === sub.plotId);
                            const modifierUser = users.find(u => u.id === sub.submittedByPmlId);
                            const reporterName = modifierUser ? modifierUser.name : sub.submittedByPmlId || 'Supervisor PML';

                            return (
                              <div key={sub.id} className="p-3 bg-slate-50 border-2 border-slate-900 rounded-none text-xs space-y-2 shadow-[2.5px_2.5px_0px_0px_#0f172a]">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="font-mono text-[9px] bg-slate-900 text-amber-400 font-bold px-1.5 py-0.5 block w-max uppercase leading-none mb-1">
                                      TANGGAL LAPOR: {sub.date}
                                    </span>
                                    <span className="font-black text-slate-900 font-display uppercase text-xs">
                                      {pl ? `${pl.village} (${pl.sls}-${pl.subSls})` : 'SLS Tidak Ditemukan'}
                                    </span>
                                  </div>

                                  {canMutateSubmission(sub) ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => handleOpenEdit(sub)}
                                        className="p-1.5 bg-sky-100 hover:bg-sky-200 border border-slate-900 text-sky-900 cursor-pointer"
                                        title="Koreksi Laporan Hari Ini"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleConfirmDelete(sub)}
                                        className="p-1.5 bg-rose-100 hover:bg-rose-200 border border-slate-900 text-rose-900 cursor-pointer"
                                        title="Hapus Laporan Hari Ini"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] bg-white border border-slate-900 text-slate-700 font-mono font-black px-1.5 py-0.5 uppercase shrink-0">
                                      Audit History
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between py-1 border-y border-slate-200 font-mono text-[11px]">
                                  <div className="text-slate-700"> 
                                    Hasil Terdata: 
                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                      <div>
                                        Keluarga: <span className="font-black"> {sub.rutaDidata ?? 0} </span>
                                      </div>
                                      <div>
                                        Usaha: <span className="font-black"> {sub.usahaDidata ?? 0} </span>
                                      </div>
                                      <div>
                                        Stiker: <span className="font-black"> {sub.stikerDigunakan ?? 0} </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>Status: {getStatusBadge(sub.status)}</div>
                                </div>

                                {/* Auditing Logs */}
                                <div className="text-[9.5px]/none font-mono text-slate-500 space-y-1.5 pt-1">
                                  <div className="flex items-center gap-1">
                                    <UserCheck size={11} className="text-slate-650" />
                                    <span>PML: <strong className="text-slate-900">{reporterName}</strong></span>
                                  </div>
                                  <div>
                                    Input Pertama: {sub.timestamp ? new Date(sub.timestamp).toLocaleString('id-ID') : '-'}
                                  </div>
                                  {sub.lastModifiedTimestamp && (
                                    <div className="text-[9.5px] uppercase text-amber-900 font-black bg-amber-50 px-1 py-0.5 border border-amber-300">
                                      Revisi Terakhir: {new Date(sub.lastModifiedTimestamp).toLocaleString('id-ID')}
                                    </div>
                                  )}
                                </div>

                                {sub.issueIndicator && (
                                  <div className="bg-rose-50 border border-rose-300 p-2 text-[10px] font-mono text-rose-800">
                                    <strong>Kendala Lapangan:</strong> "{sub.issueDescription}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

      </div>

      {/* Issues Review for PML */}
      <div className="bg-white border-4 border-slate-900 p-5 shadow-none space-y-4" id="pml-issue-supervision">
        <div className="border-b-2 border-slate-900 pb-3">
          <h2 className="font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <AlertOctagon size={18} className="text-rose-500 animate-bounce" /> Kendala / Hambatan Tim PPL Anda
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Daftar kendala lapangan yang dilaporkan oleh petugas PPL bimbingan Anda.</p>
        </div>

        {supervisedIssues.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 border-2 border-slate-900">
            <p className="text-slate-505 font-mono text-xs font-semibold">Bersih. Tidak ada laporan kendala (issues) aktif dari tim Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisedIssues.map(issue => (
              <div 
                key={issue.id} 
                className={`p-4 border-2 border-slate-900 rounded-none space-y-3 relative transition-all shadow-[2.5px_2.5px_0px_0px_#0f172a] ${
                  issue.status === 'RESOLVED' 
                    ? 'bg-slate-50 text-slate-600' 
                    : 'bg-rose-50 text-rose-900 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black border uppercase px-2 py-0.5 rounded-none font-mono">
                      {issue.status}
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">{issue.date} | {issue.areaLabel}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase font-display">{issue.pplName}</span>
                </div>

                <p className="text-xs italic bg-white p-3 border-2 border-slate-900 rounded-none font-mono">
                  "{issue.description}"
                </p>

                {issue.status === 'RESOLVED' ? (
                  <div className="bg-emerald-50 p-3 border-2 border-emerald-400 text-emerald-905 text-xs space-y-1">
                    <span className="font-mono font-bold uppercase tracking-wider block text-[10px] text-emerald-800">Tanggapan/Solusi:</span>
                    <p className="italic">"{issue.resolutionNotes}"</p>
                    {issue.resolvedAt && (
                      <span className="text-[9px] text-slate-500 font-mono block text-right mt-1">Ditangani: {new Date(issue.resolvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                ) : (
                  <div>
                    {resolvingIssueId === issue.id ? (
                      <div className="space-y-2 pt-2 border-t border-rose-150/30">
                        <textarea
                          placeholder="Tuliskan tanggapan / solusi penyelesaian kendala di lapangan agar tim PPL terbantu..."
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 outline-none text-xs px-3 py-2 rounded-none h-16 resize-none font-mono"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setResolvingIssueId(null)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-900 text-slate-800 font-bold text-[10px] px-3 py-1.5 uppercase cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleResolveIssue(issue.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-2 border-slate-900 font-black text-[10px] px-3 py-1.5 uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={12} strokeWidth={3} /> Tandai Selesai
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingIssueId(issue.id);
                          setResolutionText('');
                        }}
                        className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold border-2 border-slate-900 uppercase text-xs py-2 text-center cursor-pointer transition-colors"
                      >
                        Berikan Tanggapan / Solusi Masalah
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== ADD MONITOR MODAL ==================== */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-none border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b-4 border-slate-900">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-display font-black uppercase tracking-tight">INPUT LAPORAN HARIAN</h3>
                  <p className="text-amber-400 text-xs font-mono font-bold">
                    Tanggal: {selectedDate}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {addError && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-450 text-rose-700 rounded-none text-xs flex items-center gap-2 font-mono font-bold">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}
                {addSuccess && (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-450 text-emerald-800 rounded-none text-xs flex items-center gap-2 font-mono font-bold">
                    <CheckCircle size={14} className="shrink-0 animate-bounce" />
                    <span>{addSuccess}</span>
                  </div>
                )}

                {/* 1. FIRST CHOOSE THE RESPONSIBLE PPL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    1. PILIH PPL <span className="text-rose-505">*</span>
                  </label>
                  <select
                    value={addPplId}
                    onChange={(e) => {
                      setAddPplId(e.target.value);
                      setAddPlotId(''); // reset plot select
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none outline-none font-mono"
                    required
                  >
                    <option value="">-- Pilih Anggota PPL --</option>
                    {myPpls.map(ppl => (
                      <option key={ppl.id} value={ppl.id}>
                        {ppl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. CHOOSE PLOT ASSIGNED TO THAT PPL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    2. PILIH SLS <span className="text-rose-505">*</span>
                  </label>
                  <select
                    value={addPlotId}
                    onChange={(e) => setAddPlotId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none outline-none font-mono"
                    required
                    disabled={!addPplId}
                  >
                    {!addPplId ? (
                      <option value="">-- Silakan pilih PPL Terlebih dahulu --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Satuan SLS / RT Tugas --</option>
                        {mySupervisedPlots
                          .filter(p => p.assignedPplId === addPplId)
                          .map(plot => (
                            <option key={plot.id} value={plot.id}>
                              {plot.village} - (SLS: {plot.sls} - {plot.subSls})
                            </option>
                          ))
                        }
                      </>
                    )}
                  </select>
                </div>

                {/* 3. Hasil Pendataan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    3. JUMLAH KELUARGA SELESAI DICACAH HARI INI (KELUARGA DAN BANGUNAN LAINNYA) <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15 Keluarga"
                    value={addRutaDidata}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddRutaDidata(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    4. JUMLAH USAHA SELESAI DICACAH HARI INI <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 10 Usaha"
                    value={addUsahaDidata}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddUsahaDidata(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    5. JUMLAH STIKER DIGUNAKAN HARI INI <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 10 Stiker"
                    value={addStikerDigunakan || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddStikerDigunakan(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>

                {/* 6. Status selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    6. STATUS SLS <span className="text-rose-505">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStatus('IN_PROGRESS')}
                      className={`p-3 rounded-none border-2 text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        addStatus === 'IN_PROGRESS'
                          ? 'border-slate-900 bg-sky-100 text-sky-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Clock size={16} />
                      <span>Masih Proses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStatus('COMPLETED')}
                      className={`p-3 rounded-none border-2 text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        addStatus === 'COMPLETED'
                          ? 'border-slate-900 bg-emerald-100 text-emerald-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Check size={16} />
                      <span>Selesai (Completed)</span>
                    </button>
                  </div>
                </div>

                {/* 7. Issue Toggle */}
                <div className="p-3 bg-slate-100 border-2 border-slate-900 rounded-none space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase block leading-none">Apakah ada kendala lapangan?</span>
                      <span className="text-[9px] text-slate-500 mt-1 block">Laporkan jika ada kendala penolakan, sengketa, atau force majeure.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addHasIssue}
                        onChange={(e) => setAddHasIssue(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {addHasIssue && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-1"
                      >
                        <textarea
                          placeholder="Sebutkan kendala secara spesifik agar BPS dapat segera menindaklanjuti..."
                          value={addIssueDesc}
                          onChange={(e) => setAddIssueDesc(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 outline-none text-xs px-3 py-2 rounded-none h-20 resize-none font-mono"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase text-[10px] py-3 border-2 border-slate-900 rounded-none transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 geo-btn-amber py-3 text-[10px] uppercase font-black"
                  >
                    KIRIM DATA LAPORAN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== EDIT MONITOR MODAL ==================== */}
      <AnimatePresence>
        {showEditModal && editingSubmission && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-none border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b-4 border-slate-900">
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-display font-black uppercase tracking-tight">KOREKSI / EDIT LAPORAN MONITORING</h3>
                  <p className="text-amber-400 text-xs font-mono font-bold">
                    Audit trail akan mencatat waktu modifikasi ini | Tanggal: {editingSubmission.date}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {editError && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-450 text-rose-700 rounded-none text-xs flex items-center gap-2 font-mono font-bold">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}
                {editSuccess && (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-450 text-emerald-800 rounded-none text-xs flex items-center gap-2 font-mono font-bold">
                    <CheckCircle size={14} className="shrink-0 animate-bounce" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                {/* 1. READ-ONLY PPL CHOSEN */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Petugas PPL Reported:</span>
                  <div className="p-2 bg-slate-100 border border-slate-400 font-mono text-xs font-black text-slate-800">
                    {(() => {
                      const pplObj = users.find(u => u.id === editingSubmission.pplId);
                      return pplObj ? `${pplObj.name}` : editingSubmission.pplId;
                    })()}
                  </div>
                </div>

                {/* 2. READ-ONLY PLOT CHOSEN */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Lokasi SLS Sensus:</span>
                  <div className="p-2 bg-slate-100 border border-slate-400 font-mono text-xs font-black text-slate-800">
                    {(() => {
                      const plotObj = plots.find(p => p.id === editingSubmission.plotId);
                      return plotObj ? `Desa: ${plotObj.village} - ${plotObj.subSls} (SLS ID: ${editingSubmission.plotId})` : editingSubmission.plotId;
                    })()}
                  </div>
                </div>

                {/* 3. Completed units */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    JUMLAH Keluarga SELESAI DICACAH HARI INI <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editRutaDidata}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>{
                      const value = e.target.value;
                      setEditRutaDidata(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    JUMLAH USAHA SELESAI DICACAH HARI INI <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editUsahaDidata}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditUsahaDidata(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    JUMLAH STIKER DIGUNAKAN HARI INI <span className="text-rose-505">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStikerDigunakan || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditStikerDigunakan(value === '' ? '' : Number(value));
                    }}
                    className="w-full bg-white border-2 border-slate-900 text-xs px-3 py-2 h-10 rounded-none font-mono outline-none"
                    required
                  />
                </div>

                {/* 4. Status selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                    STATUS AKHIR SLS LAPORAN <span className="text-rose-505">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatus('IN_PROGRESS')}
                      className={`p-3 rounded-none border-2 text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        editStatus === 'IN_PROGRESS'
                          ? 'border-slate-900 bg-sky-100 text-sky-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Clock size={16} />
                      <span>Masih Proses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('COMPLETED')}
                      className={`p-3 rounded-none border-2 text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        editStatus === 'COMPLETED'
                          ? 'border-slate-900 bg-emerald-100 text-emerald-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Check size={16} />
                      <span>Selesai (Completed)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Issue toggle */}
                <div className="p-3 bg-slate-100 border-2 border-slate-900 rounded-none space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase block leading-none">Apakah ada kendala lapangan?</span>
                      <span className="text-[9px] text-slate-500 mt-1 block">Laporkan jika ada sengketa, penolakan, atau musibah alam.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHasIssue}
                        onChange={(e) => setEditHasIssue(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {editHasIssue && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-1"
                      >
                        <textarea
                          placeholder="Laporkan rincian masalah secara detail..."
                          value={editIssueDesc}
                          onChange={(e) => setEditIssueDesc(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 outline-none text-xs px-3 py-2 rounded-none h-20 resize-none font-mono"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase text-[10px] py-3 border-2 border-slate-900 rounded-none transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 geo-btn-amber py-3 text-[10px] uppercase font-black"
                  >
                    SIMPAN PERUBAHAN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
