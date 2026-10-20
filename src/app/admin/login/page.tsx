'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const username = usernameRef.current?.value?.trim() || '';
    const password = passwordRef.current?.value || '';

    if (!username || !password) {
      setErrorMessage('Username dan password CMS wajib diisi');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/cms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Login gagal. Periksa username dan password Anda.');
        setIsLoading(false);
        return;
      }

      // Berhasil login CMS, redirect langsung ke panel /admin
      router.replace('/admin');
    } catch (err: any) {
      setErrorMessage('Terjadi gangguan jaringan. Silakan coba kembali.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700 text-white shadow-sm mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Komuna CMS Console
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          Panel Khusus Super Admin Pengelola Landing Page
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          
          {/* Info Banner Terisolasi */}
          <div className="mb-6 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-left">
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              Sesi login ini khusus untuk Super Admin pengelola konten landing page dan terpisah 100% dari akun operasional warga RT.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / Email CMS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  ref={usernameRef}
                  type="text"
                  required
                  defaultValue="superadmin"
                  placeholder="superadmin"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password CMS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordRef}
                  type="password"
                  required
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Panel CMS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="text-slate-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              &larr; Kembali ke Beranda
            </Link>
            <Link
              href="/login"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Login Warga RT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
