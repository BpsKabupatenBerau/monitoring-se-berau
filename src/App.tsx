/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Plot, DailySubmission, Issue } from './types';
import * as db from './lib/supabaseService';

// ─── Derive Issues from Submissions ──────────────────────────────────────────
/**
 * Issues are no longer stored in a separate kendala_lapangan table.
 * They are derived on-the-fly from laporan_harian rows where ada_kendala = true.
 */
function deriveIssues(
  submissions: DailySubmission[],
  users: User[],
  plots: Plot[]
): Issue[] {
  const userMap  = new Map(users.map(u => [u.id, u]));
  const plotMap  = new Map(plots.map(p => [p.id, p]));

  return submissions
    .filter(s => s.issueIndicator && s.issueDescription?.trim())
    .map((s): Issue => {
      const ppl  = userMap.get(s.pplId);
      const plot = plotMap.get(s.plotId);
      const areaLabel = plot
        ? `${plot.district} - ${plot.village} - ${plot.subSls}`
        : s.plotId;

      // Resolution is tracked via resolutionNotes (mapped from laporan_harian.catatan).
      // Format: 'RESOLVED: <supervisor notes>' written by updateIssueStatus().
      const isResolved = s.resolutionNotes?.startsWith('RESOLVED:') ?? false;
      const resolvedNote = isResolved
        ? s.resolutionNotes!.slice('RESOLVED:'.length).trim()
        : undefined;

      return {
        id:              s.id,
        submissionId:    s.id,
        pplId:           s.pplId,
        pplName:         ppl?.name ?? 'Unknown',
        plotId:          s.plotId,
        areaLabel,
        date:            s.date,
        description:     s.issueDescription,
        status:          isResolved ? 'RESOLVED' : 'OPEN',
        resolutionNotes: resolvedNote,
        resolvedAt:      isResolved ? s.lastModifiedTimestamp : undefined,
      };
    });
}

import PplDashboard from './components/PplDashboard';
import PmlDashboard from './components/PmlDashboard';
import RegCoDashboard from './components/RegCoDashboard';
import AdminDashboard from './components/AdminDashboard';
import PlotManagement from './components/PlotManagement';
import ReportExport from './components/ReportExport';
import IssueMonitoring from './components/IssueMonitoring';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AssignmentManagement from './components/AssignmentManagement';

import {
  LayoutDashboard,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  LogOut,
  Loader2,
  Menu, X,
} from 'lucide-react';

export function getOperationalToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ─── Date Range Helper ────────────────────────────────────────────────────────
/** Generate all dates between start and end (YYYY-MM-DD format) */
function generateDateRange(startDate: string, endDate: string): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = getOperationalToday();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const value = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    dates.push({ value, label: label + (value === today ? ' (Hari Ini)' : '') });
  }
  return dates;
}

// Census operation period: June 1 – September 30, 2026
const CENSUS_DATES = generateDateRange('2026-06-15', '2026-09-30');

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('se2026_current_user');
    if (saved) try { return JSON.parse(saved); } catch {}
    return null;
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const saved = localStorage.getItem('se2026_selected_date');
    
    if (saved) return saved;

    const today = getOperationalToday();

    if (today < '2026-06-15')
      return '2026-06-15';

    if (today > '2026-09-30')
      return '2026-09-30';

    return today;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [screen, setScreen] = useState<'landing' | 'login' | 'app'>(() => {
    const savedScreen = localStorage.getItem('se2026_screen');
    return (savedScreen as 'landing' | 'login' | 'app') || 'landing';
  });

  // ─── Persist session ───────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) localStorage.setItem('se2026_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('se2026_current_user');
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('se2026_selected_date', selectedDate); }, [selectedDate]);
  useEffect(() => { localStorage.setItem('se2026_screen', screen); }, [screen]);

  // ─── Supabase Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (!currentUser) {
      setDbLoading(false);
      setDbError(null);
      setUsers([]);
      setPlots([]);
      setSubmissions([]);
      return () => {};
    }

    async function initSupabase() {
      setDbLoading(true);
      setDbError(null);

      try {
        const [fetchedUsers, fetchedPlots, fetchedSubs] = await Promise.all([
          db.fetchUsers(),
          db.fetchPlots(),
          db.fetchSubmissions(),
        ]);

        setUsers(fetchedUsers);
        setPlots(fetchedPlots);
        setSubmissions(fetchedSubs);

        // Subscribe to realtime changes
        unsubscribe = db.subscribeToChanges({
          onUsersChange:       setUsers,
          onPlotsChange:       setPlots,
          onSubmissionsChange: setSubmissions,
        });

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Supabase Init Error]', msg);
        setDbError('Koneksi ke database gagal. Periksa konfigurasi Supabase, RLS, dan koneksi internet.');
        setUsers([]);
        setPlots([]);
        setSubmissions([]);
      } finally {
        setDbLoading(false);
      }
    }

    initSupabase();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentUser?.id]);

  // ─── Computed Issues (derived from submissions) ────────────────────────────
  // Issues are now derived from laporan_harian rows with ada_kendala = true.
  // No separate state needed — this recalculates whenever submissions change.
  const issues = deriveIssues(submissions, users, plots);

  // Submission Handlers ───────────────────────────────────────────────────
  const handleAddSubmission = useCallback(async (newSub: Omit<DailySubmission, 'id' | 'timestamp'>) => {
    await db.createSubmission(newSub);
  }, [plots, users]);

  const handleUpdateSubmission = useCallback(async (updatedSub: DailySubmission) => {
    await db.updateSubmission(updatedSub);
  }, [plots, users]);

  const handleDeleteSubmission = useCallback(async (id: string) => {
    await db.deleteSubmission(id);
  }, []);

  // ─── Issue Handler ─────────────────────────────────────────────────────────
  const handleUpdateIssueStatus = useCallback(async (id: string, status: 'OPEN' | 'RESOLVED', notes?: string) => {
    await db.updateIssueStatus(id, status, notes);
    // Refresh submissions so the updated catatan propagates to derived issues
    const refreshed = await db.fetchSubmissions();
    setSubmissions(refreshed);
  }, []);

  // ─── User Management ───────────────────────────────────────────────────────
  const handleAddUser = useCallback(async (newUser: Omit<User, 'id'>) => {
    await db.createUser(newUser);
    const refreshedUsers = await db.fetchUsers();
    setUsers(refreshedUsers);
  }, []);

  const handleDeleteUser = useCallback(async (id: string) => {
    await db.deleteUser(id);
  }, []);

  // ─── Plot Management ───────────────────────────────────────────────────────
  const handleAddPlot = useCallback(async (newPlot: Omit<Plot, 'id'>) => {
    await db.createPlot(newPlot);
    const refreshedPlots = await db.fetchPlots();
    setPlots(refreshedPlots);
  }, []);

  const handleUpdatePlot = useCallback(async (id: string, updated: Partial<Plot>) => {
    await db.updatePlot(id, updated);
    const refreshedPlots = await db.fetchPlots();
    setPlots(refreshedPlots);
  }, []);

  const handleDeletePlot = useCallback(async (id: string) => {
    await db.deletePlot(id);
  }, []);

  // ─── Role helpers ──────────────────────────────────────────────────────────
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':                return 'ADMIN';
      case 'SUPERVISOR':           return 'SUPERVISOR';
      case 'KORWIL':               return 'KORWIL';
      case 'PML':                  return 'PML (PENGAWAS)';
      case 'PPL':                  return 'PPL (PENCACAH)';
      default:                     return role;
    }
  };

  const getTabsByRole = () => {
  switch (currentUser.role) {

    case 'ADMIN':
      return [
        {
          id: 'dashboard', name: 'Dashboard Monitoring', icon: LayoutDashboard,
        },
        {
          id: 'assignment', name: 'Penugasan Wilayah', icon: Database,
        },
        {
          id: 'plots', name: 'Master Plot SLS', icon: Database,
        },
        {
          id: 'export', name: 'Laporan & Ekspor', icon: FileSpreadsheet,
        },
        {
          id: 'issues', name: 'Daftar Kendala', icon: AlertTriangle,
        },
      ];

    case 'SUPERVISOR':
      return [
        {
          id: 'dashboard', name: 'Dashboard Monitoring', icon: LayoutDashboard,
        },
        {
          id: 'assignment', name: 'Penugasan Wilayah', icon: Database,
        },
        {
          id: 'export', name: 'Laporan & Ekspor', icon: FileSpreadsheet,
        },
        {
          id: 'issues', name: 'Daftar Kendala', icon: AlertTriangle,
        },
      ];

    case 'KORWIL':
      return [
        {
          id: 'dashboard', name: 'Dashboard Korwil', icon: LayoutDashboard,
        },
        {
          id: 'export', name: 'Laporan & Ekspor', icon: FileSpreadsheet,
        },
        {
          id: 'issues', name: 'Pantau Kendala', icon: AlertTriangle,
        },
      ];

    case 'PML':
      return [
        {
          id: 'dashboard', name: 'Dashboard PML', icon: LayoutDashboard,
        },
        {
          id: 'export', name: 'Laporan & Ekspor', icon: FileSpreadsheet,
        },
      ];

    case 'PPL':
    default:
      return [
        {
          id: 'dashboard', name: 'Beban Tugas & Riwayat', icon: LayoutDashboard,
        },
      ];
  }
};

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'landing') {
    return (
      <LandingPage
        onEnterPortal={() => setScreen('login')}
        onEnterQuickDemo={() => setScreen('login')}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setScreen('app');
        }}
        onBackToLanding={() => setScreen('landing')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setScreen('app');
        }}
        onBackToLanding={() => setScreen('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased border-[4px] md:border-[10px] border-slate-900">

      {/* LOADING OVERLAY */}
      {dbLoading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0px_0px_#0f172a] text-center space-y-4 max-w-xs">
            <Loader2 size={36} className="mx-auto text-amber-400 animate-spin" />
            <h3 className="font-display font-black text-slate-900 uppercase tracking-tight">Menghubungi Supabase</h3>
            <p className="text-xs text-slate-500 font-mono">Memuat data database cloud SE2026...</p>
          </div>
        </div>
      )}

      {/* DB ERROR BANNER */}
      {dbError && !dbLoading && (
        <div className="bg-amber-400 border-b-4 border-slate-900 px-6 py-2 text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle size={13} />
          <span>{dbError}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-slate-900 border-b-4 border-slate-950 sticky top-0 z-40 px-6 py-4 flex items-center justify-between text-white shadow-none">
        <div className="flex items-center gap-4">
          <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 border border-slate-700">
                {showMobileMenu ? (
                  <X size={18}/>
                ) : (
                  <Menu size={18}/>
                )}
          </button>
          <div className="w-8 h-8 bg-amber-400 rounded-none flex items-center justify-center text-slate-900 font-black text-xl shrink-0 border-2 border-slate-900">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-sm tracking-tighter uppercase leading-none text-amber-400">MONITORING SE2026</h1>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.2">BPS BERAU</span>
            </div>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dbLoading ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-tight">
                {dbLoading ? 'Sync...' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Date + Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentUser(null);
              setScreen('landing');
            }}
            className="p-2 py-1.5 bg-rose-600 hover:bg-rose-700 border-2 border-slate-950 text-white transition-all flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5"
            title="Keluar dari Portal"
          >
            <LogOut size={13} className="text-white" />
            <span className="hidden md:inline font-bold">Log Out</span>
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="md:hidden px-4 pt-4">
          <nav className="geo-card p-2 flex flex-col gap-1.5">
            {getTabsByRole().map(tab => {
              const TabIcon = tab.icon;


              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-3 text-xs font-black uppercase ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-amber-400'
                      : 'text-slate-700'
                  }`}
                >
                  <TabIcon size={14} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* DASHBOARD CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="geo-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-slate-100 border-2 border-slate-900 flex items-center justify-center shrink-0">
                <span className="font-bold text-slate-800 uppercase text-xs">{currentUser.name.slice(0, 2)}</span>
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-display font-black text-slate-900 text-xs truncate leading-snug">{currentUser.name}</h3>
                <span className="geo-badge text-[9px] bg-amber-300 text-slate-950 font-black uppercase tracking-tight py-0.5">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>
            <div className="border-t-2 border-slate-900 pt-2" />
            <div className="text-[11px] text-slate-850 font-mono space-y-1">
              {currentUser.assignedDistricts && currentUser.assignedDistricts.length > 0 && (
                <div>Kecamatan: <span className="font-bold text-slate-900">{currentUser.assignedDistricts.join(', ')}</span></div>
              )}
            </div>
            <div className="border-t border-slate-300 pt-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={13} className="text-amber-400" />
                <span className="font-mono text-xs text-slate-850 font-bold uppercase">Tanggal</span>
              </div>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-slate-300 px-2 py-1 text-xs"
              >
                {CENSUS_DATES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setSelectedDate(getOperationalToday())}>
              <span className='geo-badge'>Hari Ini</span>
            </button>
          </div>

          <nav className="hidden md:flex geo-card p-2 shadow-none flex flex-col gap-1.5">
            {getTabsByRole().map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-none font-black text-xs transition-all tracking-tight uppercase whitespace-nowrap text-left shrink-0 w-full cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-amber-400 border-2 border-slate-900 font-black shadow-none'
                      : 'hover:bg-slate-50 border-2 border-transparent text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <TabIcon size={14} className={activeTab === tab.id ? 'text-amber-400' : 'text-slate-600'} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          {(() => {
            switch (currentUser.role) {

              case 'ADMIN':
                if (activeTab === 'assignment')
                  return (
                  <AssignmentManagement
                  readOnly={false}
                  />
                );
                if (activeTab === 'plots') return (
                  <PlotManagement
                    plots={plots}
                    users={users}
                    onAddPlot={handleAddPlot}
                    onUpdatePlot={handleUpdatePlot}
                    onDeletePlot={handleDeletePlot}
                  />
                );
                if (activeTab === 'export') return <ReportExport plots={plots} submissions={submissions} users={users} />;
                if (activeTab === 'issues') return (
                  <IssueMonitoring
                    issues={issues}
                    currentUser={currentUser}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                  />
                );
                return (
                  <AdminDashboard
                    users={users}
                    plots={plots}
                    submissions={submissions}
                    issues={issues}
                    selectedDate={selectedDate}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                  />
                );

              case 'SUPERVISOR':
                
              if (activeTab === 'assignment')
                return (
                <AssignmentManagement
                readOnly={true}
                />
              );
              
              if (activeTab === 'export')
                return (
                <ReportExport
                plots={plots}
                submissions={submissions}
                users={users}
                />
              );
              
              if (activeTab === 'issues')
                return (
                <IssueMonitoring
                issues={issues}
                currentUser={currentUser}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                />
              );
              return (
                <AdminDashboard
                users={users}
                plots={plots}
                submissions={submissions}
                issues={issues}
                selectedDate={selectedDate}
                onAddUser={() => {}}
                onDeleteUser={() => {}}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                readOnly={true}
                />
              );

              case 'KORWIL':
                if (activeTab === 'export') return <ReportExport plots={plots} submissions={submissions} users={users} />;
                if (activeTab === 'issues') return (
                  <IssueMonitoring
                    issues={issues}
                    currentUser={currentUser}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                  />
                );
                return (
                  <RegCoDashboard
                    currentUser={currentUser}
                    users={users}
                    plots={plots}
                    submissions={submissions}
                    issues={issues}
                    selectedDate={selectedDate}
                  />
                );

              case 'PML':
                if (activeTab === 'export') return <ReportExport plots={plots} submissions={submissions} users={users} />;
                return (
                  <PmlDashboard
                    currentUser={currentUser}
                    users={users}
                    plots={plots}
                    submissions={submissions}
                    issues={issues}
                    selectedDate={selectedDate}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                    onAddSubmission={handleAddSubmission}
                    onUpdateSubmission={handleUpdateSubmission}
                    onDeleteSubmission={handleDeleteSubmission}
                  />
                );

              case 'PPL':
              default:
                return (
                  <PplDashboard
                    currentUser={currentUser}
                    plots={plots}
                    submissions={submissions}
                    issues={issues}
                    selectedDate={selectedDate}
                    users={users}
                  />
                );
            }
          })()}
        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-450 text-[10px] py-4 text-center border-t border-slate-800 space-y-1 font-mono">
        <p>© 2026 Badan Pusat Statistik (BPS) Kabupaten Berau.</p>
        <p className="text-slate-550">Sistem Monitoring Harian SE2026 v1.0.0</p>
      </footer>

    </div>
  );
}
