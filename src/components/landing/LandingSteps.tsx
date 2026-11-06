'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Users, Rocket, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { StepsSectionData } from '@/lib/landing-defaults';

interface LandingStepsProps {
  data: StepsSectionData;
}

export default function LandingSteps({ data }: LandingStepsProps) {
  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-[var(--brand-primary)]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[var(--brand-primary)]" />;
      case 'Rocket':
      default:
        return <Rocket className="w-5 h-5 text-[var(--brand-primary)]" />;
    }
  };

  return (
    <section id="cara-kerja" className="py-10 sm:py-14 bg-[#f8fafc] dark:bg-[#0b0f19] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-9">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>{data.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {data.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {data.subtitle}
          </p>
        </div>

        {/* 3 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative">
          {data.steps.map((step, idx) => (
            <div
              key={step.number || idx}
              className="bg-white dark:bg-[#111827] hover:bg-slate-50/60 dark:hover:bg-[#1e293b] p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 relative text-left flex flex-col justify-between group"
            >
              <div>
                {/* Step Top: Number Badge & Icon */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9.5 h-9.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[var(--brand-primary)] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    {getStepIcon(step.icon)}
                  </div>
                  <span className="w-6.5 h-6.5 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                    {step.number}
                  </span>
                </div>

                {/* Step Details */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[var(--brand-primary)] transition-colors leading-snug mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Step Status Pill */}
              <div className="pt-3 mt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tahap ke-{step.number}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bottom */}
        <div className="mt-7 sm:mt-8 text-center">
          <Link
            href="/daftar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-md shadow-[var(--brand-ring)] hover:shadow-lg transition-all active:scale-95"
          >
            <span>Daftar Sekarang — Gratis Selamanya</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
