'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Users, Rocket, ArrowRight } from 'lucide-react';
import { StepsSectionData } from '@/lib/landing-defaults';

interface LandingStepsProps {
  data: StepsSectionData;
}

export default function LandingSteps({ data }: LandingStepsProps) {
  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-6 h-6 text-emerald-700 stroke-[2.2]" />;
      case 'Users':
        return <Users className="w-6 h-6 text-emerald-700 stroke-[2.2]" />;
      case 'Rocket':
      default:
        return <Rocket className="w-6 h-6 text-purple-700 stroke-[2.2]" />;
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-emerald-50/25 border-y border-emerald-100/50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="text-left space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-tight">
              {data.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {data.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-lg font-normal">
              {data.subtitle}
            </p>
          </div>

          <a
            href={data.ctaLink || '#fitur'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs self-start md:self-auto transition-colors"
          >
            <span>{data.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3 Steps Bento Row with Connector Arrows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {data.steps.map((step, idx) => (
            <div
              key={step.number}
              className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-100 shadow-sm relative text-left flex flex-col justify-between group hover:border-emerald-200 hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* Step Top: Number & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm flex items-center justify-center">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getStepIcon(step.icon)}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mt-2.5">
                  {step.description}
                </p>
              </div>

              {/* Arrow Indicator on Desktop for step 1 & 2 */}
              {idx < 2 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
