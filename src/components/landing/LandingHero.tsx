'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  Play, 
  CheckCircle2, 
  Smartphone, 
  Wallet, 
  Users, 
  ArrowUpRight, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { HeroData } from '@/lib/landing-defaults';

interface LandingHeroProps {
  data: HeroData;
}

export default function LandingHero({ data }: LandingHeroProps) {
  return (
    <section id="beranda" className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white font-sans">
      
      {/* Background Soft Blobs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-100/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 text-xs font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{data.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.15]">
              {data.headlineMain}{' '}
              <span className="text-emerald-700 block sm:inline">
                {data.headlineHighlight}
              </span>
            </h1>

            {/* Subheadline Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              {data.subheadline}
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href={data.ctaPrimaryLink || '/daftar'}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                <span>{data.ctaPrimaryText}</span>
              </Link>

              <Link
                href={data.ctaSecondaryLink || '/demo'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs transition-colors hover:border-slate-300"
              >
                <Play className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                <span>{data.ctaSecondaryText}</span>
              </Link>
            </div>

            {/* Social Proof Avatars */}
            <div className="pt-6 border-t border-slate-100/90 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  BS
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  SA
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AF
                </div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  HW
                </div>
              </div>
              <div className="text-xs text-slate-500 font-medium leading-tight">
                Sudah digunakan oleh{' '}
                <strong className="text-slate-900 font-bold block sm:inline">
                  {data.socialProofText.replace('Sudah digunakan oleh ', '')}
                </strong>
              </div>
            </div>

          </div>

          {/* Right Column: Phone Mockup Showcase */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            
            {/* Floating Badge 1: Transparan & Akuntabel (Top Left) */}
            <div className="absolute -top-3 left-2 sm:-left-4 z-20 bg-white/95 backdrop-blur-xs border border-emerald-100 px-3.5 py-2 rounded-2xl shadow-lg shadow-emerald-900/5 flex items-center gap-2 animate-bounce duration-1000">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Transparan</p>
                <p className="text-[9px] text-slate-400 font-medium">dan Akuntabel</p>
              </div>
            </div>

            {/* Floating Badge 2: Akses di mana saja (Right Middle) */}
            <div className="absolute top-28 -right-2 sm:-right-6 z-20 bg-white/95 backdrop-blur-xs border border-purple-100 px-3.5 py-2 rounded-2xl shadow-lg shadow-purple-900/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Akses</p>
                <p className="text-[9px] text-slate-400 font-medium">di mana saja</p>
              </div>
            </div>

            {/* Phone Container (Realistic Smartphone Frame) */}
            <div className="relative w-[285px] sm:w-[310px] bg-slate-900 p-2.5 rounded-[44px] shadow-2xl shadow-emerald-950/20 border-4 border-slate-800 select-none">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ml-auto mr-2" />
              </div>

              {/* Inner Screen */}
              <div className="bg-[#f8fafc] rounded-[36px] overflow-hidden text-slate-800 pt-7 pb-4 px-3.5 space-y-3.5 border border-slate-200/50">
                
                {/* App Topbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800">komuna.id</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                    RT
                  </div>
                </div>

                {/* Greeting */}
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Selamat pagi, Pak RT 👋</p>
                  <p className="text-[9px] text-slate-400">Semangat mengelola lingkungan kita!</p>
                </div>

                {/* Saldo Kas RT Card */}
                <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-sm text-left relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-emerald-100 font-medium">Saldo Kas RT</p>
                      <p className="text-base font-black tracking-tight mt-0.5">Rp 5.420.000</p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Grid 4 Quick Cards */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2 bg-amber-50/70 border border-amber-100 rounded-xl">
                    <p className="text-[8px] font-bold text-amber-900">Iuran Warga</p>
                    <p className="text-[10px] font-black text-amber-900 mt-0.5">Rp 2.250.000</p>
                  </div>
                  <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <p className="text-[8px] font-bold text-blue-900">Kas RT</p>
                    <p className="text-[10px] font-black text-blue-900 mt-0.5">Rp 1.200.000</p>
                  </div>
                  <div className="p-2 bg-rose-50/70 border border-rose-100 rounded-xl">
                    <p className="text-[8px] font-bold text-rose-900">Pengeluaran</p>
                    <p className="text-[10px] font-black text-rose-900 mt-0.5">Rp 850.000</p>
                  </div>
                  <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-xl">
                    <p className="text-[8px] font-bold text-purple-900">Laporan</p>
                    <p className="text-[10px] font-black text-purple-900 mt-0.5">Lihat Detail</p>
                  </div>
                </div>

                {/* Kegiatan Hari Ini */}
                <div className="space-y-1.5 text-left">
                  <p className="text-[10px] font-bold text-slate-800">Kegiatan Hari Ini</p>
                  <div className="p-2 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Users className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-800 leading-tight">Arisan Warga</p>
                        <p className="text-[8px] text-slate-400">09:00 - 10:00</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">RT</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Calendar className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-800 leading-tight">Kerja Bakti</p>
                        <p className="text-[8px] text-slate-400">07:00 - 09:00</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">Lingkungan</span>
                  </div>
                </div>

                {/* Fake Bottom App Bar */}
                <div className="pt-2 border-t border-slate-100 flex justify-around text-slate-400 text-[8px] font-bold">
                  <span className="text-emerald-700">Beranda</span>
                  <span>Warga</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center -translate-y-2 shadow-xs text-xs">
                    +
                  </div>
                  <span>Transaksi</span>
                  <span>Lainnya</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
