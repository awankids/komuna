'use client';

import React from 'react';
import { Users, Shield, Zap, Star, HeartHandshake, FileCheck, Smartphone } from 'lucide-react';
import { StatsTrustData } from '@/lib/landing-defaults';

interface LandingStatsTrustProps {
  data: StatsTrustData;
}

export default function LandingStatsTrust({ data }: LandingStatsTrustProps) {
  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-[var(--brand-primary)]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[var(--brand-primary)]" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'Users':
      default:
        return <Users className="w-5 h-5 text-[var(--brand-primary)]" />;
    }
  };

  return (
    <section id="keunggulan" className="py-16 sm:py-20 bg-white dark:bg-[#0f172a] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>{data.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {data.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {data.description}
          </p>
        </div>

        {/* 3 Main Bento Value Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12">
          
          {/* Bento 1: 100% Keterbukaan */}
          <div className="bg-[#f8fafc] dark:bg-[#111827] p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[var(--brand-primary)] tracking-wider block mb-1">
                Keterbukaan 100%
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Bebas Curiga, Warga Tenang
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Saldo kas, pemasukan iuran, dan jimpitan bisa dipantau langsung oleh semua warga kapan saja. Pengurus bekerja dengan tenang tanpa rasa prasangka.
            </p>
          </div>

          {/* Bento 2: 0 Kertas & Hemat Biaya */}
          <div className="bg-[#f8fafc] dark:bg-[#111827] p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider block mb-1">
                Birokrasi Cepat
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Surat Resmi Ber-QR Valid
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Surat pengantar digital lengkap dengan QR code resmi. Warga tidak perlu antre ke rumah pak RT hanya untuk meminta cap atau tanda tangan manual.
            </p>
          </div>

          {/* Bento 3: Ringan di Semua HP */}
          <div className="bg-[#f8fafc] dark:bg-[#111827] p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-1">
                Akses Ringan PWA
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Lancar di Segala Smartphone
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Didesain khusus agar ringan dan ramah untuk warga sepuh (lansia). Bisa dibuka langsung dari browser tanpa perlu menguras ruang memori internal HP.
            </p>
          </div>

        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.stats.map((stat) => (
            <div
              key={stat.id}
              className="p-5 rounded-2xl bg-[#f8fafc] dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100/80 dark:bg-orange-950/40 flex items-center justify-center mb-1">
                {getStatIcon(stat.icon)}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
