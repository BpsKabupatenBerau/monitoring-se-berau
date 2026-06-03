/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types';
import { signInUser } from '../lib/supabaseService';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export default function LoginPage({ onLoginSuccess, onBackToLanding }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Username atau email tidak boleh kosong.');
      return;
    }

    if (!password) {
      setError('Sandi akses tidak boleh kosong.');
      return;
    }

    const supabaseUser = await signInUser(username.trim(), password);
    if (supabaseUser) {
      setError(null);
      onLoginSuccess(supabaseUser);
      return;
    }

    setError('Email/username atau sandi tidak sesuai dengan Supabase Auth, atau profil pengguna belum ada di tabel pengguna.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 md:p-6 antialiased border-[4px] md:border-[10px] border-slate-900">
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 hover:text-slate-950 bg-white p-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
      >
        <ArrowLeft size={13} />
        <span>KEMBALI KE BERANDA</span>
      </button>

      <div className="w-full max-w-xl geo-card overflow-hidden bg-white">
        <div className="p-6 md:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-300 text-slate-950 font-mono text-[9px] font-black border border-slate-900">
              SECURE LOGIN SERVICE
            </div>
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-slate-950">
              MASUK PORTAL SE2026
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Masuk menggunakan akun Supabase Auth yang sudah terhubung dengan profil pada tabel pengguna.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-900 text-rose-900 p-3.5 text-xs font-medium space-y-1 rounded-none flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 text-rose-900 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-tight text-[10px]">Peringatan Otorisasi</p>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-slate-700">Username / Email Petugas</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={14} className="text-slate-700 font-bold" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin atau admin@se2026.bps.go.id"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 focus:bg-white text-xs outline-none font-sans font-medium text-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-slate-700">Sandi Akses Portal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} className="text-slate-700 font-bold" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Supabase Auth"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border-2 border-slate-900 focus:bg-white text-xs outline-none font-sans text-slate-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-slate-900 cursor-pointer" />
                <span>Ingat Sesi Saya</span>
              </label>
              <span className="text-slate-400">Lupa Sandi? Hubungi Admin IPDS</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-black font-display text-xs tracking-wider uppercase rounded-none transition-all cursor-pointer border-2 border-slate-950"
            >
              AUTENTIKASI & MASUK SISTEM
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Supabase PostgreSQL - TLS 1.3 - Email/password Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
