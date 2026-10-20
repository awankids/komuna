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
    <section className="py-14 sm:py-20 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-[#00AA13] via-[#00880F] to-slate-900 text-white rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 shadow-2xl shadow-[#00AA13]/25 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          
          {/* Ambient Glows */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left Text Block */}
          <div className="z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-black tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mulai Gotong Royong Digital</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {data.title}
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 font-normal">
              {data.subtitle}
            </p>

            {/* Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-emerald-100/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>100% Gratis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Siap dlm 1 Menit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Bebas Pasang di HP</span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="z-10 shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={data.buttonLink || '/daftar'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-black text-sm shadow-xl transition-all active:scale-95 group hover:shadow-2xl"
            >
              <span>{data.buttonText}</span>
              <ArrowRight className="w-4 h-4 text-[#00AA13] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
