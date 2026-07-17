'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@komuna.id');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        // Redirect to dashboard
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan koneksi server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Selamat Datang</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Masuk ke Panel Admin komuna.id</p>
          </div>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-650 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email input */}
          <div className="flex flex-col text-left">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="Contoh: admin@komuna.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col text-left">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</label>
              <a href="#" className="text-xs font-bold text-[#f95713] hover:underline">Lupa Sandi?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="Masukkan kata sandi Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#f95713] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            <span>{isLoading ? 'Memproses...' : 'Masuk Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {/* Demo Hint Footer */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed text-left">
          <span className="font-bold text-slate-700 block mb-1">💡 Kredensial Demo Default:</span>
          <span>Email: <strong className="text-slate-800">admin@komuna.id</strong></span>
          <span className="block">Sandi: <strong className="text-slate-800">admin123</strong></span>
        </div>

      </div>
    </div>
  );
}
