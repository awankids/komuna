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
  Sparkles,
  Shield,
  FileText,
  Coins,
  Send,
  Plus,
  ArrowDownRight,
  Star,
  ChevronRight,
  Bell,
  Zap
} from 'lucide-react';
import { HeroData } from '@/lib/landing-defaults';

interface LandingHeroProps {
  data: HeroData;
}

export default function LandingHero({ data }: LandingHeroProps) {
  return (
    <section id="beranda" className="relative pt-24 pb-14 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-slate-50/30 font-sans">
      
      {/* Dynamic Gojek Ambient Blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#00AA13]/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-emerald-200/20 blur-2xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 text-left space-y-5">
            
            {/* Pill Badge - Gojek Signature Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-200 text-[#00880F] text-xs font-black tracking-tight shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-[#00AA13] text-[#00AA13]" />
              <span>{data.badge}</span>
            </div>

            {/* Main Headline - Chunky & Confident */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.12]">
              {data.headlineMain}{' '}
              <span className="text-[#00AA13] inline-block">
                {data.headlineHighlight}
              </span>
            </h1>

            {/* Subheadline Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              {data.subheadline}
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={data.ctaPrimaryLink || '/daftar'}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#00AA13] hover:bg-[#00880F] text-white font-black text-sm shadow-md shadow-[#00AA13]/30 hover:shadow-lg transition-all active:scale-95 group"
              >
                <span>{data.ctaPrimaryText}</span>
                <Rocket className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={data.ctaSecondaryLink || '/demo'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-sm shadow-2xs transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current text-slate-600" />
                <span>{data.ctaSecondaryText}</span>
              </Link>
            </div>

            {/* Social Proof Bar - Local Avatar Stack */}
            <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-3.5 text-xs text-slate-500">
              <div className="flex -space-x-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-2xs">
                  RT
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-2xs">
                  RW
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-2xs">
                  BD
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-2xs">
                  SK
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="font-black text-slate-800 ml-1">4.9/5</span>
                </div>
                <span className="font-semibold text-slate-600">
                  {data.socialProofText}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Smartphone Mockup (Gojek App Style) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            
            {/* Floating Live Badge Top Right */}
            <div className="absolute -top-3 sm:-top-5 right-2 sm:-right-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2.5 animate-bounce [animation-duration:3s]">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00880F] flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">
                  Kas Masuk
                </span>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {data.floatingBadge1}
                </span>
              </div>
            </div>

            {/* Floating Live Badge Bottom Left */}
            <div className="absolute -bottom-3 sm:-bottom-5 -left-2 sm:-left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">
                  Verifikasi Surat
                </span>
                <span className="text-xs font-black text-slate-900 leading-tight">
                  {data.floatingBadge2}
                </span>
              </div>
            </div>

            {/* Smartphone Frame - Modern Squircle Chassis */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] bg-slate-900 p-3 sm:p-3.5 rounded-[42px] shadow-2xl shadow-slate-900/20 border-4 border-slate-800 relative">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30" />

              {/* Phone Screen Canvas */}
              <div className="bg-slate-50 rounded-[32px] overflow-hidden pt-7 pb-4 px-3.5 space-y-3.5 text-left border border-slate-200/50">
                
                {/* App Topbar */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">
                      Selamat datang,
                    </span>
                    <h3 className="text-xs font-black text-slate-800 leading-none">
                      Pak Bambang (Ketua RT 04)
                    </h3>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* GoPay Style Kas Wallet Card */}
                <div className="bg-gradient-to-br from-[#00AA13] to-[#00880F] rounded-2xl p-3.5 text-white shadow-md shadow-[#00AA13]/25 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-100 mb-1">
                    <span>Kas RT 04 Sukamaju</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Okt 2026</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                    Rp 18.450.000
                  </div>
                  <p className="text-[10px] text-emerald-100/90 mt-1">
                    + Rp 1.450.000 jimpitan bulan ini
                  </p>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-white/20">
                    <div className="bg-white/15 hover:bg-white/25 rounded-xl py-1 px-1 text-center cursor-pointer transition-colors">
                      <span className="block text-[10px] font-black">+ Kas</span>
                    </div>
                    <div className="bg-white/15 hover:bg-white/25 rounded-xl py-1 px-1 text-center cursor-pointer transition-colors">
                      <span className="block text-[10px] font-black">- Keluar</span>
                    </div>
                    <div className="bg-white/15 hover:bg-white/25 rounded-xl py-1 px-1 text-center cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <Send className="w-2.5 h-2.5 text-white" />
                      <span className="block text-[10px] font-black">Share WA</span>
                    </div>
                  </div>
                </div>

                {/* Gojek Style 3x2 Service Grid */}
                <div>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[11px] font-black text-slate-800">
                      Layanan Warga
                    </span>
                    <span className="text-[9px] font-bold text-[#00880F]">
                      Semua Modul
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Item 1 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Jimpitan
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Surat RT
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Ronda
                      </span>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Arisan
                      </span>
                    </div>

                    {/* Item 5 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Buku Kas
                      </span>
                    </div>

                    {/* Item 6 */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                        Aset RT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity Card */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00880F] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-800 block leading-tight">
                        Ronda Malam Ini Siap
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Regu 2: Mas Joko & 4 Warga
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#00880F] bg-emerald-50 px-2 py-0.5 rounded-md">
                    21.00 WIB
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
