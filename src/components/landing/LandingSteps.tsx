'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Users, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StepsSectionData } from '@/lib/landing-defaults';

interface LandingStepsProps {
  data: StepsSectionData;
}

export default function LandingSteps({ data }: LandingStepsProps) {
  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-6 h-6 text-[#00880F]" />;
      case 'Users':
        return <Users className="w-6 h-6 text-[#00880F]" />;
      case 'Rocket':
      default:
        return <Rocket className="w-6 h-6 text-[#00880F]" />;
    }
  };

  return (
    <section id="cara-kerja" className="py-20 bg-white font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#00880F] text-xs font-black tracking-tight">
            <span>⚡ {data.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {data.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {data.subtitle}
          </p>
        </div>

        {/* 3 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {data.steps.map((step, idx) => (
            <div
              key={step.number || idx}
              className="bg-white hover:bg-slate-50/60 p-7 sm:p-8 rounded-3xl border border-slate-200/80 hover:border-[#00AA13]/50 shadow-xs hover:shadow-lg transition-all duration-200 relative text-left flex flex-col justify-between group"
            >
              <div>
                {/* Step Top: Number Badge & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00880F] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    {getStepIcon(step.icon)}
                  </div>
                  <span className="w-9 h-9 rounded-full bg-[#00AA13] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-[#00AA13]/30">
                    {step.number}
                  </span>
                </div>

                {/* Step Details */}
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00880F] transition-colors leading-snug mb-2.5">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Step Status Pill */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00880F]" />
                <span>Langkah ke-{step.number}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bottom */}
        <div className="mt-12 text-center">
          <Link
            href="/daftar"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00AA13] hover:bg-[#00880F] text-white font-black text-xs shadow-md shadow-[#00AA13]/25 hover:shadow-lg transition-all active:scale-95"
          >
            <span>Daftar Sekarang — Gratis Selamanya</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
