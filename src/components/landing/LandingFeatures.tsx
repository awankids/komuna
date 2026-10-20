'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Coins, 
  FileText, 
  Users, 
  Bell, 
  Smartphone,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { FeatureItem } from '@/lib/landing-defaults';

interface LandingFeaturesProps {
  features: FeatureItem[];
}

export default function LandingFeatures({ features }: LandingFeaturesProps) {
  // Icon Resolver
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet':
        return <Wallet className="w-6 h-6" />;
      case 'Coins':
        return <Coins className="w-6 h-6" />;
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      case 'Shield':
        return <Shield className="w-6 h-6" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6" />;
      case 'Users':
        return <Users className="w-6 h-6" />;
      case 'Bell':
        return <Bell className="w-6 h-6" />;
      default:
        return <Smartphone className="w-6 h-6" />;
    }
  };

  // Color Palette Themes - Gojek Service App Styles
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 text-[#00880F] group-hover:bg-[#00AA13] group-hover:text-white',
          badge: 'bg-emerald-100 text-[#00880F]',
          badgeText: 'Paling Populer',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
          badge: 'bg-purple-100 text-purple-700',
          badgeText: 'Harian & Bulanan',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
          badge: 'bg-blue-100 text-blue-700',
          badgeText: 'Format Resmi QR',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
          badge: 'bg-amber-100 text-amber-700',
          badgeText: 'Siskamling Warga',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
          badge: 'bg-rose-100 text-rose-700',
          badgeText: 'Kocok Digital',
        };
      default:
        return {
          bg: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
          badge: 'bg-indigo-100 text-indigo-700',
          badgeText: 'Inventaris Lengkap',
        };
    }
  };

  return (
    <section id="layanan" className="py-20 bg-white font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#00880F] text-xs font-black tracking-tight">
            <span>✨ Ekosistem Layanan Lengkap</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Semua Kebutuhan Warga,{' '}
            <span className="text-[#00AA13]">Cukup Satu Aplikasi</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Tinggalkan buku tulis lusuh yang mudah hilang. Komuna hadir dengan modul terpadu yang ramah dan siap pakai.
          </p>
        </div>

        {/* 6 Services Grid - Gojek Style Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const styling = getThemeClasses(feature.theme);

            return (
              <div
                key={feature.id || idx}
                className="group relative bg-white hover:bg-slate-50/70 p-6 sm:p-7 rounded-3xl border border-slate-200/80 hover:border-[#00AA13]/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left"
              >
                <div>
                  {/* Top Bar with Icon & Feature Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs group-hover:scale-105 ${styling.bg}`}
                    >
                      {getIcon(feature.icon)}
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide uppercase ${styling.badge}`}
                    >
                      {styling.badgeText}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00880F] transition-colors leading-snug mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Action Hint */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#00880F] group-hover:translate-x-1 transition-transform">
                  <span>Lihat kemudahan modul</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Fast CTA Strip */}
        <div className="mt-12 bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-900/10">
          <div className="text-left space-y-1">
            <h4 className="text-lg sm:text-xl font-black tracking-tight">
              Ingin coba langsung tanpa perlu mendaftar?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Buka mode demo interaktif dengan data simulasi warga Sukamaju.
            </p>
          </div>
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00AA13] hover:bg-[#00880F] text-white font-black text-xs shadow-md transition-all shrink-0 active:scale-95"
          >
            <span>Buka Simulasi Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
