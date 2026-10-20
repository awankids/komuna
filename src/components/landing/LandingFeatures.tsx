'use client';

import React from 'react';
import { 
  Wallet, 
  Coins, 
  FileText, 
  Users, 
  Bell, 
  Smartphone 
} from 'lucide-react';
import { FeatureItem } from '@/lib/landing-defaults';

interface LandingFeaturesProps {
  features: FeatureItem[];
}

export default function LandingFeatures({ features }: LandingFeaturesProps) {
  const getIcon = (iconName: string, theme: string) => {
    const iconClass = "w-6 h-6 stroke-[2.2]";
    switch (iconName) {
      case 'Wallet':
        return <Wallet className={iconClass} />;
      case 'Coins':
        return <Coins className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Bell':
        return <Bell className={iconClass} />;
      case 'Smartphone':
      default:
        return <Smartphone className={iconClass} />;
    }
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'emerald':
        return {
          bgIcon: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          hoverBorder: 'hover:border-emerald-300',
        };
      case 'purple':
        return {
          bgIcon: 'bg-purple-50 text-purple-700 border-purple-100',
          hoverBorder: 'hover:border-purple-300',
        };
      case 'amber':
        return {
          bgIcon: 'bg-amber-50 text-amber-700 border-amber-100',
          hoverBorder: 'hover:border-amber-300',
        };
      case 'blue':
        return {
          bgIcon: 'bg-blue-50 text-blue-700 border-blue-100',
          hoverBorder: 'hover:border-blue-300',
        };
      case 'rose':
        return {
          bgIcon: 'bg-rose-50 text-rose-700 border-rose-100',
          hoverBorder: 'hover:border-rose-300',
        };
      case 'indigo':
      default:
        return {
          bgIcon: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          hoverBorder: 'hover:border-indigo-300',
        };
    }
  };

  return (
    <section id="fitur" className="py-12 sm:py-16 bg-white font-sans border-t border-slate-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 6 Feature Bento Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 sm:gap-6">
          {features.map((feat) => {
            const styles = getThemeClasses(feat.theme);
            return (
              <div
                key={feat.id}
                className={`p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between group ${styles.hoverBorder}`}
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 mb-5 ${styles.bgIcon}`}
                  >
                    {getIcon(feat.icon, feat.theme)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mt-2.5">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
