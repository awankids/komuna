'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FooterData } from '@/lib/landing-defaults';

interface LandingFooterProps {
  data: FooterData;
}

export default function LandingFooter({ data }: LandingFooterProps) {
  return (
    <footer className="bg-white dark:bg-[#0b0f19] border-t border-slate-200/80 dark:border-slate-800/80 font-sans pt-12 pb-12 text-slate-600 dark:text-slate-400 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100 dark:border-slate-800/80">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center shrink-0 shadow-md shadow-[var(--brand-ring-strong)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none block">
                {data.appName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {data.tagline}
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#beranda" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              Layanan RT
            </a>
            <a href="#keunggulan" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              Keunggulan
            </a>
            <a href="#cara-kerja" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              Cara Kerja
            </a>
            <a href="#testimoni" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              Testimoni
            </a>
            <a href="#faq" className="hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Direct WhatsApp Contact Button (Matching /login) */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/628978506111?text=Halo%20Tim%20Komuna,%20saya%20ingin%20tanya%20seputar%20aplikasi%20RT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-semibold text-xs transition-colors shadow-2xs"
              title="Hubungi Dukungan WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-400 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Konsultasi WhatsApp</span>
            </a>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>untuk kebersamaan dan transparansi warga RT di seluruh Indonesia.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span>{data.copyright}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link href="/admin/login" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Portal CMS
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
