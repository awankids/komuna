'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  Star, 
  Calendar, 
  TrendingUp, 
  Heart, 
  ShieldCheck, 
  FileText,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { HeroData } from '@/lib/landing-defaults';

interface LandingHeroProps {
  data: HeroData;
}

export default function LandingHero({ data }: LandingHeroProps) {
  // Format current date in Indonesian
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <section id="beranda" className="relative pt-20 pb-10 md:pt-24 md:pb-12 overflow-hidden bg-[#f8fafc] dark:bg-[#0b0f19] font-sans transition-colors duration-200 border-b border-slate-200/80 dark:border-slate-800/80">
      
      {/* Subtle Warm Ambient Glow */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 dark:bg-orange-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 text-left space-y-4.5">
            
            {/* Top Operational Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{formattedToday}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>{data.badge}</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.16]">
              {data.headlineMain}{' '}
              <span className="text-[var(--brand-primary)]">
                {data.headlineHighlight}
              </span>
            </h1>

            {/* Subheadline Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              {data.subheadline}
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <Link
                href={data.ctaPrimaryLink || '/daftar'}
                className="inline-flex items-center gap-2 px-5.5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm shadow-md shadow-[var(--brand-ring)] hover:shadow-lg transition-all active:scale-95 group cursor-pointer"
              >
                <span>{data.ctaPrimaryText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={data.ctaSecondaryLink || '/demo'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-50/80 hover:bg-orange-100 text-[var(--brand-primary)] dark:bg-orange-950/30 dark:hover:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-bold text-sm transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[var(--brand-primary)] dark:text-orange-400" />
                <span>{data.ctaSecondaryText}</span>
              </Link>
            </div>

            {/* Social Proof Bar */}
            <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-2 shrink-0">
                <div className="w-7.5 h-7.5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-[10px] border-2 border-white dark:border-[#0b0f19] shadow-2xs">
                  RT
                </div>
                <div className="w-7.5 h-7.5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] border-2 border-white dark:border-[#0b0f19] shadow-2xs">
                  RW
                </div>
                <div className="w-7.5 h-7.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] border-2 border-white dark:border-[#0b0f19] shadow-2xs">
                  BD
                </div>
                <div className="w-7.5 h-7.5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] border-2 border-white dark:border-[#0b0f19] shadow-2xs">
                  SK
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="font-extrabold text-slate-900 dark:text-white ml-1">4.9/5</span>
                </div>
                <span className="font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                  {data.socialProofText}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Operational Showcase Preview */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            
            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-4 sm:p-5 space-y-3 text-left transition-all">
              
              {/* Header Showcase: RT Identity & Status */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        RT 04 Sukamaju
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                        Demo
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      Portal Operasional Terpadu
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Aktif</span>
                </div>
              </div>

              {/* Kas Balance Card - Terracotta Primary Card */}
              <div className="bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white rounded-xl p-3.5 shadow-md shadow-[var(--brand-ring-strong)] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-semibold text-orange-100/90 mb-0.5">
                  <span>Kas Terbuka Warga RT</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-md text-[9px]">Real-time</span>
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Rp 18.450.000
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-[10px] sm:text-[11px] text-orange-50 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-200 font-bold">↑</span>
                    <span>Jimpitan Hari Ini: <strong>+Rp 320.000</strong></span>
                  </div>
                  <span className="opacity-80">30 KK Terdaftar</span>
                </div>
              </div>

              {/* 2x2 Bento Mini Grid */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                
                {/* 1. Jimpitan */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-2xs">
                  <div className="w-6.5 h-6.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Jimpitan & Kas</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Rekap otomatis & siap cetak LPJ.
                  </p>
                </div>

                {/* 2. Ronda */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-2xs">
                  <div className="w-6.5 h-6.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-1">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Gotong Royong</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Piket siskamling transparan.
                  </p>
                </div>

                {/* 3. Keamanan */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-2xs">
                  <div className="w-6.5 h-6.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Aman & Terkontrol</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Salted scrypt & hak akses bertingkat.
                  </p>
                </div>

                {/* 4. Inventaris & Surat */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-2xs">
                  <div className="w-6.5 h-6.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-1">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Inventaris & Surat</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Format QR resmi terverifikasi.
                  </p>
                </div>

              </div>

              {/* Bottom Quick Action Link */}
              <div className="pt-1">
                <Link
                  href="/demo"
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 font-semibold rounded-xl text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Jelajahi Demo Interaktif Tanpa Login</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
