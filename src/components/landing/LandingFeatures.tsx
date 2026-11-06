'use client';

import React from 'react';
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
  ShieldCheck,
  TrendingUp,
  Heart
} from 'lucide-react';
import { FeatureItem } from '@/lib/landing-defaults';

interface LandingFeaturesProps {
  features: FeatureItem[];
}

export default function LandingFeatures({ features }: LandingFeaturesProps) {
  // Icon Resolver
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-5 h-5" />;
      case 'Wallet':
        return <Wallet className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Bell':
        return <Bell className="w-5 h-5" />;
      default:
        return <Smartphone className="w-5 h-5" />;
    }
  };

  // Harmonized Category Badges & Icon Box Styling (Aligned with /login design system)
  const getThemeClasses = (theme: string, idx: number) => {
    // Normalizing index fallback to match 6 themes
    const t = theme || ['orange', 'blue', 'emerald', 'purple', 'amber', 'indigo'][idx % 6];
    
    switch (t) {
      case 'orange':
        return {
          icon: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
          badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40',
          badgeText: 'Harian & Bulanan',
        };
      case 'blue':
        return {
          icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
          badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
          badgeText: 'Piket Ronda',
        };
      case 'emerald':
        return {
          icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
          badgeText: 'Aman & Terkontrol',
        };
      case 'purple':
        return {
          icon: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
          badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
          badgeText: 'Format Resmi QR',
        };
      case 'amber':
        return {
          icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
          badgeText: 'Kocokan Digital',
        };
      case 'indigo':
      default:
        return {
          icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
          badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40',
          badgeText: 'Buku Kas Terbuka',
        };
    }
  };

  return (
    <section id="layanan" className="py-16 sm:py-20 bg-white dark:bg-[#0f172a] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Ekosistem Layanan RT Lengkap</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Semua Urusan Warga,{' '}
            <span className="text-[var(--brand-primary)]">Terkelola Terpadu</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Tinggalkan buku tulis lusuh dan pencatatan manual yang rentan hilang. Komuna menghadirkan modul operasional siap pakai yang transparan dan akuntabel.
          </p>
        </div>

        {/* 6 Services Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, idx) => {
            const styling = getThemeClasses(feature.theme, idx);

            return (
              <div
                key={feature.id || idx}
                className="group relative bg-[#f8fafc] dark:bg-[#111827] hover:bg-white dark:hover:bg-[#1e293b] p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div>
                  {/* Top Bar with Icon & Feature Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 shadow-2xs group-hover:scale-105 ${styling.icon}`}
                    >
                      {getIcon(feature.icon)}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${styling.badge}`}
                    >
                      {styling.badgeText}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[var(--brand-primary)] transition-colors leading-snug mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Action Hint */}
                <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform">
                  <span>Lihat kemudahan modul</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
