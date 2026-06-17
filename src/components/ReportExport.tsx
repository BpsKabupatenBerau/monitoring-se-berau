/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle, 
  HelpCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Layers,
  Clock,
  Activity,
  ChevronRight,
  Database,
  Building,
  Briefcase,
  Layers3
} from 'lucide-react';
import { Plot, DailySubmission, User as UserType, MonitoringStatus } from '../types';
import { berauDistricts } from '../data/berauDistricts';

interface ReportExportProps {
  plots: Plot[];
  submissions: DailySubmission[];
  users: UserType[];
}

export default function ReportExport({
  plots,
  submissions,
  users
}: ReportExportProps) {
  // Navigation tabs state inside Reporting Center
  const [subTab, setSubTab] = useState<'analytics' | 'export_tool'>('analytics');
  
  // Database SLS Listing state
  const [plotsSearch, setPlotsSearch] = useState('');

  // Bulk Export Filters state
  const [filterDate, setFilterDate] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterPplId, setFilterPplId] = useState('');
  const [filterPmlId, setFilterPmlId] = useState('');
  const [filterRegCoId, setFilterRegCoId] = useState('');
  const [filterStatus, setFilterStatus] = useState<MonitoringStatus | ''>('');

  // Chart Date Range state
  const [chartStartDate, setChartStartDate] = useState('2026-06-15');
  const [chartEndDate, setChartEndDate] = useState('2026-09-30');

  // 1. Calculate REAL-TIME status for each plot in DB
  const plotsWithDbStatus = plots.map(plot => {
    const plotSubs = submissions.filter(s => s.plotId === plot.id);
    if (plotSubs.length === 0) {
      return { 
        ...plot, 
        dbStatus: 'NOT_STARTED' as MonitoringStatus, 
        subCount: 0, 
        latestSubDate: '-', 
        totalUnits: 0 
      };
    }
    
    // Sort submissions to find latest status
    const sortedSubs = [...plotSubs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestSub = sortedSubs[0];
    
    // Check if any is completed
    const isCompleted = plotSubs.some(s => s.status === 'COMPLETED');
    
    let resolvedStatus: MonitoringStatus = 'IN_PROGRESS';
    if (isCompleted) {
      resolvedStatus = 'COMPLETED';
    } else {
      resolvedStatus = latestSub.status;
    }

    return {
      ...plot,
      dbStatus: resolvedStatus,
      subCount: plotSubs.length,
      latestSubDate: latestSub.date,
      totalUnits: plotSubs.reduce((acc, s) => acc + s.completedUnits, 0)
    };
  });

  // 2. Count states in active database
  const totalPlots = plots.length;
  const notStartedCount = plotsWithDbStatus.filter(p => p.dbStatus === 'NOT_STARTED').length;
  const inProgressCount = plotsWithDbStatus.filter(p => p.dbStatus === 'IN_PROGRESS').length;
  const completedCount = plotsWithDbStatus.filter(p => p.dbStatus === 'COMPLETED').length;
  const blockedCount = plotsWithDbStatus.filter(p => p.dbStatus === 'BLOCKED').length;

  const progressPercentage = totalPlots > 0 
    ? Math.round((completedCount / totalPlots) * 100) 
    : 0;

  // Filter lists for export tool dropdowns
  const pplList = users.filter(u => u.role === 'PPL');
  const pmlList = users.filter(u => u.role === 'PML');
  const regCoList = users.filter(u => u.role === 'KORWIL');

  // Search filter for SLS Registry grid
  const filteredPlots = plotsWithDbStatus.filter(p => {
    if (!plotsSearch) return true;
    const query = plotsSearch.toLowerCase();
    return (
      p.id.toLowerCase().includes(query) ||
      p.district.toLowerCase().includes(query) ||
      p.village.toLowerCase().includes(query) ||
      p.sls.toLowerCase().includes(query) ||
      p.subSls.toLowerCase().includes(query)
    );
  });

  // Chronological Daily progress ledger grouped by date
  const submissionDates = Array.from(new Set(submissions.map(s => s.date))).sort();
  const dailyProgressStats = submissionDates.map(dateStr => {
    const subsOnDate = submissions.filter(s => s.date === dateStr);
    const unitsOnDate = subsOnDate.reduce((sum, s) => sum + s.completedUnits, 0);
    const issuesOnDate = subsOnDate.filter(s => s.issueIndicator).length;
    
    return {
      date: dateStr,
      subCount: subsOnDate.length,
      unitsCompleted: unitsOnDate,
      issuesCount: issuesOnDate
    };
  });

  // Dynamic daily completed units and reports generator for selected date range
  const getDatesInRange = (start: string, end: string) => {
    const dates: string[] = [];
    const current = new Date(start);
    const last = new Date(end);
    
    // Safety guard to avoid infinite loop or performance issues
    let count = 0;
    while (current <= last && count < 60) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  const chartDates = getDatesInRange(chartStartDate, chartEndDate);
  const chartData = chartDates.map(dateStr => {
    const daySubs = submissions.filter(s => s.date === dateStr);
    const completedUnitsSum = daySubs.reduce((sum, s) => sum + s.completedUnits, 0);
    const reportsCount = daySubs.length;
    
    return {
      date: dateStr,
      formattedDate: new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      'Unit Terdata (KK)': completedUnitsSum,
      'Sesi Laporan': reportsCount
    };
  });

  // Filter the submission list (Export view)
  const filteredSubmissions = submissions.filter(sub => {
    const plot = plots.find(p => p.id === sub.plotId);
    if (!plot) return false;

    const ppl = users.find(u => u.id === sub.pplId);
    const pml = users.find(u => u.id === plot.assignedPmlId);
    const regCo = users.find(u => u.role === 'KORWIL' && u.district === plot.district);

    // Date
    if (filterDate && sub.date !== filterDate) return false;

    // District
    if (filterDistrict && plot.district !== filterDistrict) return false;

    // Village
    if (filterVillage && !plot.village.toLowerCase().includes(filterVillage.toLowerCase())) return false;

    // PPL
    if (filterPplId && sub.pplId !== filterPplId) return false;

    // PML
    if (filterPmlId && plot.assignedPmlId !== filterPmlId) return false;

    // RegCo
    if (filterRegCoId && (!regCo || regCo.id !== filterRegCoId)) return false;

    // Status
    if (filterStatus && sub.status !== filterStatus) return false;

    return true;
  });

  const totalCompletedUnits = filteredSubmissions.reduce((acc, curr) => acc + curr.completedUnits, 0);

  // Helper to generate CSV download
  const handleExportCSV = () => {
    const headers = [
      'ID Laporan',
      'Tanggal',
      'Kecamatan',
      'Desa/Kelurahan',
      'SLS',
      'Sub-SLS',
      'Nama PPL',
      'Nama PML (Supervisor)',
      'Unit Selesai hari ini',
      'Status Monitoring',
      'Indikator Kendala',
      'Deskripsi Kendala'
    ];

    const rows = filteredSubmissions.map(sub => {
      const plot = plots.find(p => p.id === sub.plotId);
      const ppl = users.find(u => u.id === sub.pplId);
      const pml = plot ? users.find(u => u.id === plot.assignedPmlId) : null;
      
      return [
        sub.id,
        sub.date,
        plot ? plot.district : '',
        plot ? plot.village : '',
        plot ? plot.sls : '',
        plot ? plot.subSls : '',
        ppl ? ppl.name : '',
        pml ? pml.name : '',
        sub.completedUnits,
        sub.status,
        sub.issueIndicator ? 'YA' : 'TIDAK',
        sub.issueIndicator ? `"${sub.issueDescription.replace(/"/g, '""')}"` : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SE2026_Monitoring_Berau_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate Excel (XLS) download
  const handleExportExcel = () => {
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; }
          th { background-color: #0F172A; color: white; font-weight: bold; padding: 6px; border: 1px solid #D1D5DB; }
          td { padding: 6px; border: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <h3>BPS KABUPATEN BERAU - LAPORAN SENSUS EKONOMI SE2026</h3>
        <p>Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
        <table>
          <thead>
            <tr>
              <th>ID Laporan</th>
              <th>Tanggal</th>
              <th>Kecamatan</th>
              <th>Desa/Kelurahan</th>
              <th>SLS</th>
              <th>Sub-SLS (RT)</th>
              <th>PPL Pencacah</th>
              <th>PML Pengawas</th>
              <th>Unit Terdata</th>
              <th>Status</th>
              <th>Kendala</th>
              <th>Keterangan Kendala</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredSubmissions.forEach(sub => {
      const plot = plots.find(p => p.id === sub.plotId);
      const ppl = users.find(u => u.id === sub.pplId);
      const pml = plot ? users.find(u => u.id === plot.assignedPmlId) : null;

      tableHtml += `
        <tr>
          <td>${sub.id}</td>
          <td>${sub.date}</td>
          <td>${plot ? plot.district : ''}</td>
          <td>${plot ? plot.village : ''}</td>
          <td>${plot ? plot.sls : ''}</td>
          <td>${plot ? plot.subSls : ''}</td>
          <td>${ppl ? ppl.name : ''}</td>
          <td>${pml ? pml.name : ''}</td>
          <td>${sub.completedUnits}</td>
          <td>${sub.status}</td>
          <td>${sub.issueIndicator ? 'YA' : 'TIDAK'}</td>
          <td>${sub.issueDescription || ''}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SE2026_Monitoring_Berau_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="report-export-panel">
      
      {/* Title Header Card */}
      <div className="geo-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-amber-400 font-mono text-[9px] font-black border border-slate-900">
            BPS DATABASE REPORTING CENTER
          </div>
          <h1 className="text-xl font-display font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <FileSpreadsheet size={20} className="text-slate-900" /> Ekspor &amp; Rekapitulasi Laporan SE2026
          </h1>
          <p className="text-slate-500 text-xs font-sans">
            Evaluasi berkas pelaporan sensus harian, rekapitulasi SLS di pangkalan data secara real-time.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Navigations */}
      <div className="grid grid-cols-2 border-4 border-slate-900 bg-slate-100 p-1.5 gap-1.5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <button
          onClick={() => setSubTab('analytics')}
          className={`py-3.5 text-center text-xs font-mono font-black uppercase transition-all tracking-wider relative cursor-pointer border-2 ${
            subTab === 'analytics'
              ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-none'
              : 'bg-white text-slate-700 hover:text-slate-950 border-transparent hover:bg-slate-50'
          }`}
        >
          📈 1. Analisis Progress SLS ({progressPercentage}%)
        </button>
        <button
          onClick={() => setSubTab('export_tool')}
          className={`py-3.5 text-center text-xs font-mono font-black uppercase transition-all tracking-wider relative cursor-pointer border-2 ${
            subTab === 'export_tool'
              ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-none'
              : 'bg-white text-slate-700 hover:text-slate-950 border-transparent hover:bg-slate-50'
          }`}
        >
          📥 2. Filter &amp; Ekspor Spreadsheet
        </button>
      </div>

      {/* VIEWPORT CONTROLLER */}
      {subTab === 'analytics' ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* DATABASE KEY METRICS PANEL */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total SLS (ID SLS) */}
            <div className="geo-card bg-slate-900 p-4 text-white flex flex-col justify-between border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total SLS Terdaftar</span>
                <Layers3 size={15} className="text-amber-400" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-display font-black text-white">{totalPlots}</p>
                <p className="text-[10px] font-sans text-slate-400 mt-1 uppercase">ID SLS Terpetakan di Berau</p>
              </div>
            </div>

            {/* Belum Dimulai (Not Started) */}
            <div className="geo-card bg-white p-4 flex flex-col justify-between border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Belum Dimulai</span>
                <div className="w-2.5 h-2.5 bg-slate-300 rounded-none" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-display font-black text-slate-900">{notStartedCount}</p>
                <p className="text-[10px] font-sans text-slate-550 mt-1 uppercase">Menunggu Entry Lapangan</p>
              </div>
            </div>

            {/* Sedang Berjalan (In Progress + Blocked) */}
            <div className="geo-card bg-sky-50 p-4 flex flex-col justify-between border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-sky-800">Sedang Berjalan</span>
                <Clock size={14} className="text-sky-600 font-bold" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-display font-black text-sky-955">{inProgressCount + blockedCount}</p>
                <p className="text-[10px] font-sans text-sky-650 mt-1 uppercase">
                  {inProgressCount} Berjalan • {blockedCount} Terkendala
                </p>
              </div>
            </div>

            {/* Selesai (Completed / Checked) */}
            <div className="geo-card bg-emerald-50 p-4 flex flex-col justify-between border-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">Selesai (Completed)</span>
                <CheckCircle size={14} className="text-emerald-600" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-display font-black text-emerald-955">{completedCount}</p>
                <p className="text-[10px] font-sans text-emerald-650 mt-1 uppercase">Lengkap &amp; Divalidasi PML</p>
              </div>
            </div>

          </div>

          {/* DYNAMIC PROGRESS BAR ACCENT */}
          <div className="geo-card p-5 bg-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-bold text-slate-600 uppercase">AKUMULASI PENYELESAIAN BLOK SENSUS (VALIDATED)</span>
              <span className="font-mono font-black text-slate-900 text-sm bg-amber-300 px-2 py-0.5 border border-slate-900">
                {progressPercentage}% SELESAI
              </span>
            </div>
            <div className="w-full bg-slate-100 h-6 border-2 border-slate-900 overflow-hidden relative">
              <div 
                className="bg-emerald-400 h-full transition-all duration-500 border-r-2 border-slate-900"
                style={{ width: `${progressPercentage}%` }}
              />
              <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-805">
                {completedCount} dari {totalPlots} Satuan SLS Selesai Terverifikasi BPS
              </span>
            </div>
          </div>

          {/* VISUAL CHART OF PROGRESS */}
          <div className="geo-card p-5 bg-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-300 text-slate-950 font-mono text-[9px] font-black border border-slate-900">
                  RECHARTS INTERACTIVE PROGRESSION CHART
                </div>
                <h3 className="font-display font-black text-sm text-slate-900 uppercase">
                  GRAFIK VOLUMETRIK PROGRES SELESAI HARIAN
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Jumlah Satuan Unit Terdata (KK) dan total unggahan sesi laporan harian di rentang aktif.
                </p>
              </div>

              {/* Date Filters inside Analytics */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] text-slate-500 uppercase font-bold">Mulai Tanggal</span>
                    <input
                      type="date"
                      value={chartStartDate}
                      onChange={(e) => setChartStartDate(e.target.value)}
                      className="bg-slate-50 border-2 border-slate-950 px-2 py-1 text-[11px] font-mono font-bold"
                    />
                  </div>
                  <span className="text-slate-400 font-mono mt-3">-</span>
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] text-slate-500 uppercase font-bold">Sampai Tanggal</span>
                    <input
                      type="date"
                      value={chartEndDate}
                      onChange={(e) => setChartEndDate(e.target.value)}
                      className="bg-slate-50 border-2 border-slate-950 px-2 py-1 text-[11px] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Render Container */}
            <div className="w-full bg-slate-50 p-4 border-2 border-dashed border-slate-305 h-[340px] flex items-center justify-center relative">
              {chartData.length === 0 || chartData.every(d => d['Unit Terdata (KK)'] === 0 && d['Sesi Laporan'] === 0) ? (
                <div className="text-center space-y-2 p-6">
                  <p className="text-2xl">📊</p>
                  <p className="font-mono text-slate-500 text-xs uppercase font-bold">Tidak Ada Data Di Rentang Ini</p>
                  <p className="font-sans text-[11px] text-slate-400 max-w-sm">
                    Silakan tentukan atau geser rentang tanggal (misalnya mulai tanggal 2026-06-15) untuk mengamati diagram.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 15, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D97706" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#D97706" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#CBD5E1" />
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fill: '#0F172A', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        stroke="#0F172A"
                        strokeWidth={2}
                      />
                      <YAxis 
                        tick={{ fill: '#0F172A', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        stroke="#0F172A"
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F172A', 
                          border: '3px solid #0F172A', 
                          borderRadius: '0px', 
                          color: 'white',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.15)'
                        }} 
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="square"
                        wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0F172A' }}
                      />
                      <Area 
                        type="monotone" 
                        name="Volume KK Terdata (KK)"
                        dataKey="Unit Terdata (KK)" 
                        stroke="#4F46E5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorUnits)" 
                      />
                      <Area 
                        type="monotone" 
                        name="Jumlah Sesi Laporan"
                        dataKey="Sesi Laporan" 
                        stroke="#D97706" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSubs)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-slate-550 font-mono flex items-center justify-between gap-2.5">
              <span>💡 Klik pemicu tanggal di kanan atas untuk memfokuskan visualisasi audit.</span>
              <span className="hidden sm:inline text-amber-600 font-extrabold uppercase">AUTO-SCALE DATABASE</span>
            </div>
          </div>

          {/* MAIN DOCK: SLS REGISTRY & DAILY TIMELINE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT BOARD: DYNAMIC SEARCHABLE SLS DIRECTORY (8 Cols) */}
            <div className="lg:col-span-8 geo-card bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase">REGISTRI PROGRESS SLS FIRESTORE</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Status terperinci per blok sensus / ID SLS yang terpartisi di basis data.</p>
                </div>
                
                {/* Search box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari ID, Desa, Kec..."
                    value={plotsSearch}
                    onChange={(e) => setPlotsSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border-2 border-slate-900 text-[11px] font-mono outline-none focus:bg-white w-48 transition-colors"
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-605" />
                </div>
              </div>

              {/* Registry Table */}
              <div className="overflow-x-auto border-2 border-slate-900 max-h-[480px]">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono uppercase text-[9px] border-b border-slate-900 sticky top-0 z-10">
                      <th className="py-2.5 px-3">ID SLS</th>
                      <th className="py-2.5 px-3">Administrasi</th>
                      <th className="py-2.5 px-3">RT (Sub-SLS)</th>
                      <th className="py-2.5 px-3 text-center">Unit Terdata</th>
                      <th className="py-2.5 px-3 text-center">Sesi Lap</th>
                      <th className="py-2.5 px-3 text-center">Status AKTUAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPlots.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 font-mono text-slate-400 text-xs">
                          Tidak ditemukan data ID SLS yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredPlots.map(plot => {
                        const getStatusBadge = (status: MonitoringStatus) => {
                          switch (status) {
                            case 'COMPLETED':
                              return 'bg-emerald-400 text-slate-950 font-black';
                            case 'IN_PROGRESS':
                              return 'bg-blue-400 text-white font-black';
                            case 'BLOCKED':
                              return 'bg-rose-450 text-white font-black animate-pulse';
                            case 'NOT_STARTED':
                            default:
                              return 'bg-slate-100 text-slate-500 font-bold border border-slate-300';
                          }
                        };

                        const getStatusLabel = (status: MonitoringStatus) => {
                          switch (status) {
                            case 'COMPLETED': return 'COMPLETED';
                            case 'IN_PROGRESS': return 'IN PROGRESS';
                            case 'BLOCKED': return '⚠️ BLOCKED';
                            case 'NOT_STARTED': default: return 'NOT STARTED';
                          }
                        };

                        return (
                          <tr key={plot.id} className="hover:bg-slate-50 text-[11px]">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {plot.id}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 uppercase">Kec. {plot.district}</div>
                              <div className="text-[10px] text-slate-500 font-sans">{plot.village} (SLS: {plot.sls})</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 font-bold">
                              {plot.subSls}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700 whitespace-nowrap">
                              {plot.totalUnits > 0 ? `+${plot.totalUnits} KK` : '0 KK'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded-none text-slate-700">
                                {plot.subCount}x Entry
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className={`text-[8px] font-mono uppercase tracking-tight px-2 py-0.5 border border-slate-950 ${getStatusBadge(plot.dbStatus)}`}>
                                {getStatusLabel(plot.dbStatus)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Help Notes */}
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-3 text-[10px] text-slate-500 font-mono">
                <HelpCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <p>
                  Sesi Laporan (Sesi Lap) dan Unit Terdata di atas terakumulasi secara kumulatif berdasarkan database masukan (submission) harian yang diunggah oleh PML di lapangan.
                </p>
              </div>
            </div>

            {/* RIGHT BOARD: PROGRESS TIMEOUT CHRONO DAILY ACCUMULATION (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* LEDGER CARD */}
              <div className="geo-card bg-white p-5 space-y-4">
                <div className="border-b-2 border-slate-900 pb-3">
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase">LOG HARIAN PROGRESS DB</h3>
                  <p className="text-[10px] text-slate-500 font-sans">Pertambahan volume cacahan hari demi hari.</p>
                </div>

                <div className="overflow-x-auto border-2 border-slate-900">
                  <table className="w-full text-left border-collapse text-[10px] font-mono">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase text-[8px] border-b border-slate-900">
                        <th className="py-2 px-2">Hari / Tanggal</th>
                        <th className="py-2 px-1 text-center">Lap</th>
                        <th className="py-2 px-1 text-right">Unit Terdata</th>
                        <th className="py-2 px-1 text-center">Isi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dailyProgressStats.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-slate-400">
                            Database belum mencatat transaksi harian.
                          </td>
                        </tr>
                      ) : (
                        dailyProgressStats.map(day => (
                          <tr key={day.date} className="hover:bg-slate-50">
                            <td className="py-2 px-2 font-bold text-slate-850 whitespace-nowrap">
                              📅 {day.date}
                            </td>
                            <td className="py-2 px-1 text-center text-slate-700">
                              {day.subCount} Laporan
                            </td>
                            <td className="py-2 px-1 text-right font-bold text-indigo-700">
                              +{day.unitsCompleted} KK
                            </td>
                            <td className="py-2 px-1 text-center whitespace-nowrap">
                              {day.issuesCount > 0 ? (
                                <span className="bg-rose-100 text-rose-800 text-[8px] px-1 font-bold">
                                  {day.issuesCount} ⚠
                                </span>
                              ) : (
                                <span className="text-slate-400 font-light">Lancar</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-100 p-3 border border-amber-300 text-[10px] text-slate-800 space-y-1">
                  <p className="font-bold uppercase tracking-tight text-[9px] font-mono">INFORMASI PENTING:</p>
                  <p className="font-sans leading-relaxed">
                    Setiap transaksi penambahan laporan kemajuan di BPS Berau diproses server-side, didukung sinkronisasi state instan untuk menjamin keandalan data audit.
                  </p>
                </div>
              </div>

              {/* DATA INTEGRITY GUARANTEE */}
              <div className="geo-card bg-slate-900 text-white p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Database size={16} />
                  <h4 className="font-display font-black text-xs uppercase tracking-wider">Garansi Integritas Data</h4>
                </div>
                <p className="text-[10px] text-slate-350 leading-relaxed font-sans">
                  Seluruh ID SLS yang tersimpan di basis data Cloud Firestore divalidasi silang menggunakan aturan keamanan (Security Rules) ketat untuk mencegah manipulasi anomali unit cacahan.
                </p>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* EXP0RT CONTROL SHEET */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Advanced Multi-Filters Panel */}
          <div className="geo-card p-5 bg-white space-y-4">
            <h2 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-slate-900" /> Filter Laporan Sensus Utama
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-755">
              
              {/* Date Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">1. Tanggal Laporan</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2 pl-8 outline-none focus:bg-white text-xs font-mono"
                  />
                  <Calendar size={12} className="absolute left-2.5 top-3.5 text-slate-800" />
                </div>
              </div>

              {/* District Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">2. Kelompok Kecamatan</label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white text-xs font-sans font-medium"
                >
                  <option value="">-- Semua Kecamatan --</option>
                  {berauDistricts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Village Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">3. Kelurahan / Kampung</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama kampung..."
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2 pl-8 outline-none focus:bg-white text-xs font-sans"
                  />
                  <Search size={12} className="absolute left-2.5 top-3.5 text-slate-800" />
                </div>
              </div>

              {/* PPL Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">4. Petugas (PPL)</label>
                <select
                  value={filterPplId}
                  onChange={(e) => setFilterPplId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white text-xs font-sans font-medium"
                >
                  <option value="">-- Semua Pencacah (PPL) --</option>
                  {pplList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* PML Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">5. Supervisor (PML)</label>
                <select
                  value={filterPmlId}
                  onChange={(e) => setFilterPmlId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white text-xs font-sans font-medium"
                >
                  <option value="">-- Semua Pengawas (PML) --</option>
                  {pmlList.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Regional Coordinator Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">6. PJ Wilayah (Korwil)</label>
                <select
                  value={filterRegCoId}
                  onChange={(e) => setFilterRegCoId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white text-xs font-sans font-medium"
                >
                  <option value="">-- Semua PJ Wilayah --</option>
                  {regCoList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (Kec. {u.district})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block font-mono text-[10px] uppercase">7. Status Cetak</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as MonitoringStatus | '')}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2 outline-none focus:bg-white text-xs font-mono font-bold"
                >
                  <option value="">-- Semua Status --</option>
                  <option value="NOT_STARTED">NOT STARTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>

              {/* Actions & Resets */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterDate('');
                    setFilterDistrict('');
                    setFilterVillage('');
                    setFilterPplId('');
                    setFilterPmlId('');
                    setFilterRegCoId('');
                    setFilterStatus('');
                  }}
                  className="w-full bg-slate-900 border-2 border-slate-900 hover:bg-slate-950 text-white font-mono text-center font-black py-2 cursor-pointer transition-colors"
                >
                  RESET FILTER
                </button>
              </div>

            </div>

            {/* Aggregated totals */}
            <div className="bg-slate-100 p-4 border-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Laporan Terfilter:</span>
                  <span className="font-black text-slate-900 text-xs">{filteredSubmissions.length} Data Transaksi</span>
                </div>
                <div className="border-l-2 border-slate-900 h-6" />
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Satuan Unit Terakumulasi:</span>
                  <span className="font-black text-indigo-700 text-xs">+{totalCompletedUnits} Rumah Tangga / Usaha</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 p-1 px-3 text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> Ekspor .CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 border-2 border-slate-900 p-1 px-3 text-[11px] font-mono font-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> Ekspor Excel (.XLS)
                </button>
              </div>
            </div>

          </div>

          {/* Grid Visual Sheet Table Preview */}
          <div className="geo-card p-5 bg-white space-y-4">
            <h3 className="font-display font-black text-xs text-slate-900 uppercase">
              Lembar Cetak Transaksi (Preview)
            </h3>

            <div className="overflow-x-auto border-2 border-slate-900 max-h-[380px]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono uppercase text-[9px] border-b border-slate-900 sticky top-0 z-10">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kecamatan</th>
                    <th className="py-2.5 px-3">Desa / SLS</th>
                    <th className="py-2.5 px-3">Petugas (PPL / PML)</th>
                    <th className="py-2.5 px-3 text-right">Unit Terdata</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Kendala Lapangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 font-mono text-slate-400">
                        Tidak ada laporan transaksi yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(sub => {
                      const plot = plots.find(p => p.id === sub.plotId);
                      const ppl = users.find(u => u.id === sub.pplId);
                      const pml = plot ? users.find(u => u.id === plot.assignedPmlId) : null;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-550 whitespace-nowrap">{sub.date}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap uppercase">{plot ? plot.district : ''}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 uppercase text-[10px]">{plot ? plot.village : ''}</div>
                            <div className="text-[9px] text-slate-450 font-mono">
                              SLS: {plot ? plot.sls : ''} ({plot ? plot.subSls : ''})
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800 text-[10px]">{ppl ? ppl.name : ''}</div>
                            <div className="text-[9px] text-slate-450 font-sans">Supervisor: {pml ? pml.name : ''}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                            +{sub.completedUnits} KK
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className={`text-[8px] font-mono font-black border px-1.5 py-0.2 rounded-full ${
                              sub.status === 'COMPLETED' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : sub.status === 'BLOCKED' 
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse' 
                                  : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 italic max-w-xs truncate" title={sub.issueDescription}>
                            {sub.issueIndicator ? (
                              <span className="text-rose-600 font-bold font-sans">⚠ {sub.issueDescription}</span>
                            ) : (
                              <span className="text-slate-400 font-light font-sans">- Tidak ada -</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
