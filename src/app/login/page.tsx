'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Heart,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  FileText,
  Calendar,
  ShieldAlert,
  ChevronRight,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

interface AppConfig {
  namaApp: string;
  namaRt: string;
  tagline: string;
  kotaWilayah?: string;
  periodeAktif?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const router = useRouter();

  const [appConfig, setAppConfig] = useState<AppConfig>({
    namaApp: 'komuna.id',
    namaRt: '',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    kotaWilayah: 'Semarang',
    periodeAktif: '2024 - 2029'
  });

  // 1. Initial Load: LocalStorage email, App Config & Strict Light/Dark Mode Check
  useEffect(() => {
    let isMounted = true;

    // Check remembered email
    try {
      const savedEmail = localStorage.getItem('komuna_saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}

    // Check cached app config
    try {
      const cachedConfig = localStorage.getItem('komuna_app_config');
      if (cachedConfig) {
        setAppConfig(JSON.parse(cachedConfig));
      }
    } catch {}

    // Fetch fresh app config
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok && isMounted) {
          const data = await res.json();
          setAppConfig(data);
          localStorage.setItem('komuna_app_config', JSON.stringify(data));
        }
      } catch (e) {
        console.error('Failed to fetch app config', e);
      }
    };
    fetchConfig();

    // Check Dark Mode state strictly from komuna_login_dark_explicit
    try {
      const isExplicitDark = localStorage.getItem('komuna_login_dark_explicit') === 'yes';
      setIsDark(isExplicitDark);
      if (isExplicitDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('komuna-dark', 'yes');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('komuna-dark', 'no');
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dark / Light Mode Toggle
  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem('komuna-dark', nextDark ? 'yes' : 'no');
      localStorage.setItem('komuna_login_dark_explicit', nextDark ? 'yes' : 'no');
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

  // 3. CapsLock Detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // 4. Handle Login Submission with Race Condition Guard
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Guard against rapid duplicate submission

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email / nomor HP dan kata sandi');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Email/nomor HP atau kata sandi tidak sesuai');
        setIsLoading(false);
      } else {
        // Handle persistent "Ingat Saya"
        try {
          if (rememberMe) {
            localStorage.setItem('komuna_saved_email', email.trim());
          } else {
            localStorage.removeItem('komuna_saved_email');
          }
        } catch {}

        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectTo = searchParams?.get('redirect');
        router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/');
      }
    } catch (err) {
      console.error('Login connection error:', err);
      setErrorMessage('Gagal menghubungi server. Periksa koneksi internet Anda.');
      setIsLoading(false);
    }
  };

  // Formatted date in Indonesian
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <main className="flex-1 min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-[#0b0f19] dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans transition-colors duration-200">
      
      {/* Centered Dual-Zone Layout Container */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* ========================================================
            LEFT COLUMN: Operational RT Showcase & Trust Signals 
            (Light mode: Clean pure white background with light borders)
            (Dark mode: Cohesive dark-900 background)
           ======================================================== */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0f172a] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          
          {/* Header Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-ring-strong)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5.5 h-5.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {appConfig.namaApp || 'Komuna'}
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 rounded-full border border-orange-200/60 dark:border-orange-800/40">
                    {appConfig.namaRt || 'Dayu 02'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {appConfig.tagline || 'Kebersamaan, Terpadu, Transparan'}
                </p>
              </div>
            </div>

            {/* Headline Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{formattedToday}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                Portal Operasional & <br className="hidden sm:inline" />
                <span className="text-[var(--brand-primary)]">Transparansi Warga RT</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Kelola pencatatan jimpitan harian, keuangan kas RT, anggota warga, dan surat pengantar secara terpadu dan akuntabel.
              </p>
            </div>

            {/* Operational Bento Cards (Light Mode: Clean Pure White with Light Borders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Jimpitan & Kas Digital</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Catat setoran harian cepat, rekap otomatis, dan cetak LPJ siap saji.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Gotong Royong & Ronda</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Jadwal rombongan piket transparan dan notifikasi warga terpusat.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Aman & Terkontrol</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Proteksi password salted scrypt dengan hak akses bertingkat.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Inventaris & Surat</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Kelola peminjaman barang RT dan penerbitan surat pengantar resmi.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Sistem Aktif & Terlindungi</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Periode {appConfig.periodeAktif || '2025 - 2030'}</span>
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN: Interactive Authentication Form
            (Light mode: Clean white with crisp light borders)
            (Dark mode: Cohesive dark-900 with slate-800 borders)
           ======================================================== */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111827] p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header: Title & Integrated Theme Toggle (Clean, not floating) */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Masuk ke Aplikasi
                </h2>
                
                {/* Integrated Seamless Theme Switcher */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  aria-label={isDark ? "Klik untuk beralih ke Mode Terang" : "Klik untuk beralih ke Mode Gelap"}
                  title={isDark ? "Klik untuk beralih ke Mode Terang" : "Klik untuk beralih ke Mode Gelap"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-all cursor-pointer select-none shrink-0"
                >
                  {isDark ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Mode Gelap</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mode Terang</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Silakan masukkan email atau nomor HP pengurus untuk melanjutkan.
              </p>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <div 
                role="alert" 
                aria-live="assertive"
                className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/60 text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
                <button 
                  type="button" 
                  onClick={() => setErrorMessage('')} 
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-200 cursor-pointer"
                  aria-label="Tutup pesan error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* CapsLock Warning Alert */}
            {isCapsLockOn && (
              <div className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-medium px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Perhatian: Tombol <strong>Caps Lock</strong> pada keyboard sedang aktif.</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4.5 text-left">
              
              {/* Field 1: Email / Nomor HP */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-email" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide"
                >
                  Email atau Nomor HP / WA
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="nama@komuna.id atau 0812xxxx"
                    autoComplete="username"
                    disabled={isLoading}
                    required
                    aria-invalid={!!errorMessage}
                    className="w-full pl-10.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)] disabled:opacity-60 transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password with Eye Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="login-password" 
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide"
                  >
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                    aria-invalid={!!errorMessage}
                    className="w-full pl-10.5 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)] disabled:opacity-60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Ingat akun saya
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Bantuan</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl shadow-md shadow-[var(--brand-ring)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Instant Sandbox Demo Button */}
                <Link
                  href="/demo"
                  className="w-full py-2.5 px-4 bg-orange-50/80 hover:bg-orange-100 text-[var(--brand-primary)] dark:bg-orange-950/30 dark:hover:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[var(--brand-primary)] dark:text-orange-400" />
                  <span>Coba Demo Interaktif (Tanpa Login)</span>
                </Link>

                {/* New RT Registration Prompt */}
                <div className="pt-2 pb-1 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ingin menggunakan Komuna untuk RT Anda?{' '}
                    <Link 
                      href="/daftar" 
                      className="font-bold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Daftarkan RT Baru</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </p>
                </div>

                {/* WhatsApp Request Access Button */}
                <a
                  href="https://wa.me/628978506111?text=Halo%20Admin%2C%20saya%20pengurus%20RT%20ingin%20meminta%20akses%20login%20ke%20aplikasi%20komuna.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {/* WhatsApp SVG Icon */}
                  <svg className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Konsultasi / Hubungi via WhatsApp</span>
                </a>

              </div>

            </form>

            {/* Footer Trust Signal */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Dilindungi otentikasi aman berlapis • Hak Cipta &copy; {new Date().getFullYear()} Komuna
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================
          MODAL: Bantuan Akses & Lupa Kata Sandi
         ======================================================== */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Bantuan Masuk & Akses Akun
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Panduan pemulihan kata sandi & permohonan akun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                aria-label="Tutup modal bantuan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-[#334155]">
              <p>
                Demi menjaga kerahasiaan dan keamanan data kas warga RT, pengaturan ulang kata sandi atau permohonan akses baru dilakukan langsung melalui verifikasi Pengurus RT setempat.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Silakan hubungi Pengurus RT / Admin Sistem melalui tombol WhatsApp di bawah untuk mendapatkan bantuan akses.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/628978506111?text=Halo%20Admin%2C%20saya%20butuh%20bantuan%20reset%20kata%20sandi%20akun%20komuna.id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Hubungi Admin RT via WhatsApp</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
