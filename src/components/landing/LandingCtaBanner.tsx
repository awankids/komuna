'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { BottomCtaData } from '@/lib/landing-defaults';

interface LandingCtaBannerProps {
  data: BottomCtaData;
}

export default function LandingCtaBanner({ data }: LandingCtaBannerProps) {
  return (
    <section className="py-10 sm:py-16 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-emerald-800 text-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 shadow-xl shadow-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          {/* Subtle Decorative House Graphic */}
          <div className="flex items-center gap-5 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Home className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
                {data.title}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-normal">
                {data.subtitle}
              </p>
            </div>
          </div>

          {/* CTA Action Button */}
          <div className="z-10 shrink-0">
            <Link
              href={data.buttonLink || '/daftar'}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 hover:shadow-lg"
            >
              <span>{data.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-700 rounded-full blur-3xl pointer-events-none opacity-50" />
        </div>

      </div>
    </section>
  );
}
