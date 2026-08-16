'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
  RefreshCw,
  Compass,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRef.current?.value ?? '', password: passwordRef.current?.value ?? '' }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
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
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Main Landing + Login Split Section */}
      <div className="max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* Left Side: Marketing Info */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">komuna.id</h1>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Kebersamaan, Terpadu, Transparan</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4.5xl font-black text-slate-855 tracking-tight leading-tight">
              Kelola RT Lebih Mudah,<br />
              <span className="text-[#f95713]">Transparan & Terpercaya</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">
              komuna.id membantu pengurus RT mengelola jimpitan, kas, anggota, jadwal, dan laporan keuangan secara digital. Semua data aman dan mudah diakses kapan saja.
            </p>
          </div>

          {/* Features Bullets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 uppercase">Aman & Terpercaya</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Data tersimpan aman di cloud dan hanya dapat diakses oleh pengurus.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-inner">
                <HeartHandshake className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 uppercase">Mudah Digunakan</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Antarmuka sederhana yang dibuat khusus untuk pengurus RT.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 shadow-inner">
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 uppercase">Transparan</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Semua pemasukan dan pengeluaran tercatat jelas dan rapi.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 shadow-inner">
                <RefreshCw className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 uppercase">Selalu Terupdate</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Laporan otomatis dan data selalu tersinkronisasi.</p>
              </div>
            </div>

          </div>

          {/* Premium Illustration (Mockup Image) */}
          <div className="relative pt-6 max-w-xl">
            <img 
              src="/landing_illustration.jpg" 
              alt="Ilustrasi Warga komuna.id" 
              className="w-full h-auto object-cover rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300"
            />
          </div>

        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 space-y-7 text-left">
            
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Masuk ke Komuna.id</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Silakan masuk untuk melanjutkan ke akun Anda.</p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-100 text-red-650 text-xs font-bold px-4 py-3.5 rounded-2xl flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Email / Username Input */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email atau No. HP</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="Masukkan email Anda"
                    defaultValue=""
                    className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</label>
                  <a href="#" className="text-xs font-bold text-[#f95713] hover:underline">Lupa kata sandi?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={passwordRef}
                    type="password"
                    placeholder="Masukkan kata sandi Anda"
                    defaultValue=""
                    className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Remember me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#f95713] border-slate-300 rounded-lg focus:ring-[#f95713] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-500 font-bold select-none cursor-pointer">
                  Ingat saya
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#f95713] text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* WhatsApp Request Access Button */}
                <a
                  href="https://wa.me/628978506111?text=Halo%20Admin%2C%20saya%20ingin%20meminta%20akses%20login%20ke%20aplikasi%20komuna.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25d366]/10 text-[#128c7e] hover:bg-[#25d366]/20 border border-[#25d366]/30 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {/* WhatsApp SVG Icon */}
                  <svg className="w-4.5 h-4.5 fill-[#128c7e]" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Minta Akses Login (Hubungi Admin)</span>
                </a>

              </div>

            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Keamanan & Privasi Terjamin
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* 2. Middle Section: "Apa itu Komuna.id?" */}
      <div className="bg-white border-y border-slate-100 py-16 text-center">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Apa itu Komuna.id?</h3>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              Komuna.id adalah aplikasi khusus untuk pengurus RT di Indonesia. Dirancang untuk memudahkan pencatatan dan pengelolaan administrasi RT secara digital, transparan, dan efisien.
            </p>
          </div>

          {/* 5 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Card 1 */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/60 flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                  <circle cx="8" cy="8" r="6" />
                  <circle cx="18" cy="18" r="4" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Jimpitan Digital</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Catat jimpitan harian warga dengan cepat dan mudah.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/60 flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#f95713] flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M12 4v16" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Kas RT</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Kelola pemasukan dan pengeluaran kas RT secara rapi.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/60 flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Anggota</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Kelola data warga RT beserta informasi kontaknya.</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/60 flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Jadwal</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Atur jadwal jimpitan, ronda, dan kegiatan lainnya.</p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/60 flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Laporan</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Laporan keuangan lengkap, siap cetak atau dibagikan.</p>
              </div>
            </div>

          </div>

          {/* Banner bottom: Komuna untuk semua RT */}
          <div className="bg-[#fff7ed] border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Komuna.id untuk semua RT di Indonesia</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Bergabung bersama ribuan pengurus RT yang sudah merasakan kemudahan</p>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer">
              <span>Pelajari Lebih Lanjut</span>
              <ChevronRight className="w-4 h-4 text-slate-450" />
            </button>
          </div>

        </div>
      </div>

      {/* 3. Footer */}
      <footer className="bg-white py-12 border-t border-slate-100 text-left">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f95713] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-800">komuna.id</span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Membangun kebersamaan, keterpaduan, dan transparansi di lingkungan RT.
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              &copy; 2026 Komuna.id. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tautan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Beranda</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Fitur</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Bantuan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Pusat Bantuan</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Panduan Pengguna</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-[#f95713] transition-colors">Syarat & Ketentuan</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Unduh Aplikasi</h4>
            <div className="space-y-2">
              <a href="#" className="block max-w-[130px] border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow transition-shadow">
                {/* Simulated Google Play Store Badge using SVG */}
                <div className="bg-black text-white px-3 py-1.5 flex items-center gap-2">
                  <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M3 20.285V3.716c0-.528.423-.956.945-.956.177 0 .346.05.495.144L19.24 11.23c.42.268.552.812.296 1.242-.07.118-.172.215-.296.282L4.44 20.972a.936.936 0 0 1-.955-.008.924.924 0 0 1-.485-.68z" />
                  </svg>
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] text-slate-400 font-bold uppercase leading-none">Get it on</span>
                    <span className="text-xs font-bold leading-none mt-0.5">Google Play</span>
                  </div>
                </div>
              </a>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                <span>atau akses melalui web</span>
              </div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
