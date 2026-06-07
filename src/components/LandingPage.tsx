/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  Database, 
  CheckCircle,
  FileSpreadsheet,
  Globe,
  Zap,
  BarChart3,
} from 'lucide-react';

interface LandingPageProps {
  onEnterPortal: () => void;
  onEnterQuickDemo: (role: 'ADMIN' | 'KORWIL' | 'PML' | 'PPL') => void;
}

export default function LandingPage({ onEnterPortal, onEnterQuickDemo }: LandingPageProps) {

  const SHOW_FEATURES_SECTION = false; // Set to true to show the features section
  const SHOW_STATS = false; // Set to true to show the stats strip
  const SHOW_HERO_RIGHT_CARD = false; // Set to true to show the hero right card
  const SHOW_ACTION = false; // Set to true to show the quick demo action buttons

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased border-[4px] md:border-[10px] border-slate-900">
      
      {/* HEADER */}
      <header className="bg-slate-900 border-b-4 border-slate-950 px-6 py-4 flex items-center justify-between text-white shadow-none sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-amber-400 rounded-none flex items-center justify-center text-slate-900 font-black text-xl shrink-0 border-2 border-slate-900">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-sm tracking-tighter uppercase leading-none text-amber-400">MONITORING SE 2026</h1>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.2">BPS BERAU</span>
            </div>
            {/* <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">REGENCY STATISTICS FIELD ASSISTANT ENGINE</p> */}
          </div>
        </div>

        <button
          onClick={onEnterPortal}
          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 text-slate-950 font-bold font-mono text-xs shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer"
        >
          <span>MASUK PORTAL</span>
          <ArrowRight size={13} className="text-slate-950" />
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 md:py-24 border-b-4 border-slate-900 px-6">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-6">            
            <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-none uppercase">
              Sensus Ekonomi <br/>
              <span className="text-amber-400">SE2026</span> Berau <br/>
              Monitoring
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed font-sans">
              Sistem Pemantauan Operasional Lapangan Real-Time Terintegrasi Badan Pusat Statistik (BPS) Kabupaten Berau. Memfasilitasi koordinasi berjenjang dari PJ  Wilayah, Pengawas Lapangan (PML), hingga Petugas Sensus (PPL).
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onEnterPortal}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black font-display text-sm tracking-tight rounded-none uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[5px_5px_0px_0px_#ffffff] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-2 border-slate-955"
              >
                Akses Portal Monitoring
              </button>
              {/* <a
                href="#features"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs border-2 border-slate-700 hover:text-white transition-colors uppercase"
              >
                Lihat Konsol Fitur
              </a> */}
            </div>
          </div>

          {/* Hero Right Card */}
          {SHOW_HERO_RIGHT_CARD && (
          <div className="lg:col-span-5">
            <div className="bg-slate-800 border-4 border-amber-400 p-6 shadow-[8px_8px_0px_0px_rgba(251,191,36,1)] rounded-none space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3">
                <div className="flex items-center gap-1.5">
                  <Database size={15} className="text-amber-400" />
                  <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">Live Cloud Sync Active</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Database Server:</span>
                  <span className="text-white font-mono bg-slate-900 px-2 py-0.5 border border-slate-700 text-[10px]">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Beban Sensus Nasional:</span>
                  <span className="text-white font-bold font-mono text-amber-400">SE2026 Phase II</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Target Operasi:</span>
                  <span className="text-white font-mono text-[11px] font-bold">13 Kecamatan Berau</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">Kepatuhan Harian PML:</span>
                  <span className="text-emerald-400 font-bold text-[11px] font-mono">Online Daily Entry</span>
                </div>
              </div>
              <div className="border-t-2 border-slate-700 pt-3 space-y-2">
                <p className="text-[10px] text-amber-300 font-mono uppercase tracking-wider font-bold">Akses Sistem:</p>
                <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                  Masuk menggunakan akun Supabase Auth yang telah dibuat oleh Admin. Tidak ada mode simulasi peran pada portal operasional.
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>
      

      {/* FEATURES SECTION */}
      {SHOW_FEATURES_SECTION && (
      <section id="features" className="py-16 md:py-20 bg-white border-b-4 border-slate-900 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border-2 border-slate-900 text-slate-700 text-xs font-mono font-bold uppercase">
              <Zap size={12} className="text-amber-500" />
              KONSOL FITUR SISTEM
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-slate-950 uppercase tracking-tight">
              Semua Yang Anda Butuhkan
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Platform monitoring terpadu untuk seluruh rantai komando lapangan SE2026 Kabupaten Berau.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                title: 'Dashboard Real-Time',
                desc: 'Pantau progress pencacahan harian secara langsung. Data tersinkron otomatis dari seluruh petugas lapangan ke cloud.',
              },
              {
                icon: Users,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                title: 'Manajemen Tim Berjenjang',
                desc: 'Struktur hirarki Admin → Korwil → PML → PPL dengan tampilan dashboard yang disesuaikan per peran.',
              },
              {
                icon: MapPin,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                title: 'Master SLS & Plot Wilayah',
                desc: 'Kelola seluruh blok sensus (SLS) per kecamatan dan desa. Penugasan PPL dan PML terintegrasi.',
              },
              {
                icon: AlertCircle,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                title: 'Monitoring Kendala',
                desc: 'Catat dan lacak hambatan lapangan secara real-time. PML dan Korwil dapat memberikan tanggapan langsung.',
              },
              {
                icon: FileSpreadsheet,
                color: 'text-sky-600',
                bg: 'bg-sky-50',
                title: 'Ekspor Laporan',
                desc: 'Generate laporan kemajuan harian dalam format XML/CSV yang siap dilaporkan ke BPS Provinsi.',
              },
              {
                icon: ShieldCheck,
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                title: 'Audit Trail',
                desc: 'Setiap perubahan data dicatat beserta identitas petugas dan timestamp. Keamanan data terjamin.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="geo-card p-5 space-y-3 hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all">
                <div className={`w-10 h-10 ${bg} border-2 border-slate-900 flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-display font-black text-slate-900 uppercase tracking-tight text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Role Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { role: 'Admin BPS',   badge: 'ADMIN',  color: 'bg-amber-400 text-slate-950', desc: 'Kelola seluruh data, pengguna, dan laporan.' },
              { role: 'Korwil',      badge: 'KORWIL', color: 'bg-indigo-400 text-white',    desc: 'Pantau seluruh PML di satu kecamatan.' },
              { role: 'PML',         badge: 'PML',    color: 'bg-sky-400 text-slate-950',   desc: 'Input laporan harian PPL yang disupervisi.' },
              { role: 'PPL',         badge: 'PPL',    color: 'bg-emerald-400 text-slate-950', desc: 'Lihat beban SLS dan status harian.' },
            ].map(({ role, badge, color, desc }) => (
              <div key={role} className="p-4 bg-slate-50 border-2 border-slate-900 space-y-2">
                <span className={`inline-block text-[9px] font-mono font-black px-2 py-0.5 border border-slate-900 ${color}`}>{badge}</span>
                <h4 className="font-display font-black text-slate-900 text-sm">{role}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* STATS STRIP */}
      {SHOW_STATS && (
      <section className="bg-slate-900 border-b-4 border-amber-400 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: '13',   label: 'Kecamatan Target', icon: Globe },
            { value: '18+',  label: 'Plot SLS Terdaftar', icon: MapPin },
            { value: '100%', label: 'Berbasis Cloud',    icon: Database },
            { value: 'Live', label: 'Real-Time Sync',   icon: BarChart3 },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="space-y-2">
              <Icon size={20} className="mx-auto text-amber-400" />
              <div className="font-display font-black text-3xl text-amber-400">{value}</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* CALL TO ACTION */}
      {SHOW_ACTION && (
      <section className="py-20 bg-slate-50 border-b-4 border-slate-900 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex justify-center w-12 h-12 bg-amber-400 border-2 border-slate-900 items-center text-slate-950 text-xl font-bold">
            💡
          </div>
          <h2 className="font-display font-black text-3xl md:text-4xl text-slate-950 uppercase tracking-tight">
            MASUK KE PORTAL MONITORING UTAMA Kab. Berau
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Gunakan portal untuk mencatatkan laporan kemajuan harian, melacak kinerja SLS, menanggapi hambatan operasional, dan mengunduh laporan berformat spreadsheet XML/CSV.
          </p>

          <div className="pt-4 flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={onEnterPortal}
              className="geo-btn-amber px-8 py-3.5 text-sm font-black"
            >
              Mulai Sesi Portal
            </button>
          </div>
        </div>
      </section>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-[10px] py-6 text-center border-t border-slate-800 space-y-1 font-mono">
        <p>© 2026 Badan Pusat Statistik (BPS) Kabupaten Berau</p>
      </footer>

    </div>
  );
}
