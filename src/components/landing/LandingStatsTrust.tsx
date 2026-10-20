'use client';

import React from 'react';
import { Users, Shield, Zap, Star, CheckCircle2, HeartHandshake, FileCheck, Smartphone } from 'lucide-react';
import { StatsTrustData } from '@/lib/landing-defaults';

interface LandingStatsTrustProps {
  data: StatsTrustData;
}

export default function LandingStatsTrust({ data }: LandingStatsTrustProps) {
  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-[#00880F]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#00880F]" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'Users':
      default:
        return <Users className="w-5 h-5 text-[#00880F]" />;
    }
  };

  return (
    <section id="keunggulan" className="py-20 bg-slate-50/70 font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#00880F] text-xs font-black tracking-tight">
            <span>🛡️ {data.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {data.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {data.description}
          </p>
        </div>

        {/* 3 Main Bento Value Highlights (Gojek Vibe) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Bento 1: 100% Anti-Curiga */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#00880F] flex items-center justify-center font-black">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#00880F] tracking-wider block mb-1">
                Keterbukaan 100%
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                Bebas Curiga, Warga Tenang
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Saldo kas, pemasukan iuran, dan jimpitan bisa dicek langsung oleh semua warga kapan saja. Bendahara tidur nyenyak tanpa takut ada salah paham.
            </p>
          </div>

          {/* Bento 2: 0 Kertas & Hemat Biaya */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider block mb-1">
                Birokrasi Cepat
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                Hemat Kertas & Tinta
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Semua surat pengantar berformat digital lengkap dengan QR code resmi. Warga gak perlu lagi bolak-balik antre ke rumah pak RT hanya untuk minta stempel.
            </p>
          </div>

          {/* Bento 3: Ringan di HP Kentang */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block mb-1">
                Akses Ringan PWA
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                Lancar di Semua HP
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Didesain khusus agar sangat ringan dan ramah untuk warga sepuh (lansia). Bisa dibuka langsung dari browser tanpa perlu menghabiskan memori internal HP.
            </p>
          </div>

        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {data.stats.map((stat, i) => (
            <div
              key={stat.id || i}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-2 hover:border-[#00AA13] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 mx-auto flex items-center justify-center shadow-2xs">
                {getStatIcon(stat.icon)}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
