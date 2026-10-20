'use client';

import React from 'react';
import { Users, Shield, Zap, Star } from 'lucide-react';
import { StatsTrustData } from '@/lib/landing-defaults';

interface LandingStatsTrustProps {
  data: StatsTrustData;
}

export default function LandingStatsTrust({ data }: LandingStatsTrustProps) {
  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-emerald-600 stroke-[2.2]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-emerald-600 stroke-[2.2]" />;
      case 'Star':
        return <Star className="w-5 h-5 text-emerald-600 fill-emerald-600 stroke-[2.2]" />;
      case 'Users':
      default:
        return <Users className="w-5 h-5 text-emerald-600 stroke-[2.2]" />;
    }
  };

  return (
    <section id="tentang" className="py-16 sm:py-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Friendly RT Officer Illustration Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 sm:p-8 rounded-[36px] border border-emerald-100/80 shadow-md text-center overflow-hidden">
              
              {/* Background Landscape Silhouette */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-emerald-600/10 rounded-t-[50%] blur-xl -z-10" />

              {/* Officer Visual Graphic */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4 flex items-center justify-center">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emerald-700/10 border-4 border-white shadow-inner flex items-center justify-center relative overflow-hidden">
                  {/* Stylized Avatar Illustration */}
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-700 text-white mx-auto flex items-center justify-center shadow-md">
                      <span className="text-2xl font-black">RT</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-extrabold shadow-2xs">
                      <span>🇮🇩 Indonesia</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag below illustration */}
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-800">Gotong Royong Modern</p>
                <p className="text-xs text-slate-500 font-normal">Dari warga, oleh warga, untuk kemakmuran RT</p>
              </div>

            </div>
          </div>

          {/* Right Column: Title & 4 Bento Metrics */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-tight">
                {data.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {data.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl font-normal leading-relaxed">
                {data.description}
              </p>
            </div>

            {/* 4 Bento Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 pt-3">
              {data.stats.map((stat) => (
                <div
                  key={stat.id}
                  className="p-5 sm:p-6 bg-slate-50/70 hover:bg-emerald-50/40 rounded-3xl border border-slate-200/80 hover:border-emerald-200/80 transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 text-emerald-700 flex items-center justify-center shadow-2xs mb-3 group-hover:scale-110 transition-transform">
                    {getStatIcon(stat.icon)}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
