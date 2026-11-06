'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { BottomCtaData } from '@/lib/landing-defaults';

interface LandingCtaBannerProps {
  data: BottomCtaData;
}

export default function LandingCtaBanner({ data }: LandingCtaBannerProps) {
  return (
    <section className="py-10 sm:py-14 bg-[#f8fafc] dark:bg-[#0b0f19] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-slate-900 dark:bg-[#111827] text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
          
          {/* Subtle Warm Ambient Glow */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Left Text Block */}
          <div className="z-10 space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-md text-orange-300 text-xs font-semibold tracking-tight border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Mulai Gotong Royong Digital</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {data.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-normal">
              {data.subtitle}
            </p>

            {/* Badges */}
            <div className="pt-1.5 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Bebas Biaya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Aktif dlm 1 Menit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ringan di Semua Smartphone</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="z-10 shrink-0 flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Link
              href={data.buttonLink || '/daftar'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm shadow-md shadow-[var(--brand-ring-strong)] hover:shadow-lg transition-all active:scale-95 group"
            >
              <span>{data.buttonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="https://wa.me/628978506111?text=Halo%20Tim%20Komuna%2C%20saya%20pengurus%20RT%20ingin%20konsultasi%20aplikasi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4 fill-emerald-400 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
