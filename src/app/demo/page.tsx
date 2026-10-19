'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  TrendingUp, 
  FileText, 
  Users, 
  HelpCircle, 
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Gift
} from 'lucide-react';

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/?demo=1');
      } else {
        // Fallback direct navigate to GET route
        window.location.href = '/api/auth/demo';
      }
    } catch {
      window.location.href = '/api/auth/demo';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans">
      
      {/* Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all">
        
        {/* Top Header Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali ke halaman login"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Mode Sandbox Interaktif
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanpa Perlu Kata Sandi</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                Jelajahi Portal Demo Komuna
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/daftar"
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span>Daftarkan RT Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Calm Intro Banner */}
          <div className="p-5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 space-y-2">
            <h2 className="text-sm font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
              Lingkungan Simulasi: RT 04 Dayu (Data Lengkap Siap Coba)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Anda akan masuk sebagai <strong>Admin RT (Demo)</strong> dengan hak akses penuh. Seluruh data operasional seperti setoran jimpitan koin, mutasi kas, warga, jadwal ronda, pengocokan arisan, dan pembuatan surat pengantar sudah diisi dengan data percontohan agar Anda dapat langsung mencoba seluruh fiturnya tanpa repot mengetik data awal.
            </p>
          </div>

          {/* Bento Grid: 4 Fitur Utama yang Dapat Dicoba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pencatatan Jimpitan & Kas RT</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Coba input nominal jimpitan harian per tanggal, pantau persentase ketercapaian target bulanan, dan periksa ringkasan kas masuk/keluar secara *real-time*.
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Laporan LPJ & Surat Ber-QR</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Lihat format laporan pertanggungjawaban kas siap cetak A4 dan coba generate surat pengantar resmi warga dengan kode verifikasi keaslian digital.
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Roda Putar Arisan Warga</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Buka menu arisan warga dan klik tombol kocok untuk melihat roda putar undian interaktif penentu pemenang giliran putaran arisan bulan ini.
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Warga & Jadwal Ronda</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Struktur data keluarga terpadu (Kepala Keluarga, Istri, Anak), status kewajiban jimpitan, dan rotasi jadwal rombongan ronda otomatis.
              </p>
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Tidak ada data Anda yang tersimpan di sesi demo ini. Sesi bersifat privat dan aman.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStartDemo}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold rounded-xl shadow-md shadow-[var(--brand-ring)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Sesi Demo...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Eksplorasi Demo Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* External Contact Help Note */}
      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Butuh bantuan presentasi untuk pengurus RT/RW atau Kepala Desa?{' '}
        <a 
          href="https://wa.me/628978506111?text=Halo%20Admin%20Komuna%2C%20kami%20dari%20pengurus%20RT%20ingin%20konsultasi%20jadwal%20demo%20aplikasi" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[var(--brand-primary)] font-semibold hover:underline inline-flex items-center gap-1"
        >
          Hubungi Tim Komuna via WhatsApp
        </a>
      </div>

    </main>
  );
}
