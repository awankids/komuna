'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  ShieldCheck,
  Heart
} from 'lucide-react';
import { FooterData } from '@/lib/landing-defaults';

interface LandingFooterProps {
  data: FooterData;
}

export default function LandingFooter({ data }: LandingFooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200/80 font-sans pt-12 pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00AA13] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#00AA13]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-lg font-black text-slate-900 tracking-tight leading-none block">
                {data.appName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {data.tagline}
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-bold text-slate-600">
            <a href="#beranda" className="hover:text-[#00AA13] transition-colors">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-[#00AA13] transition-colors">
              Layanan RT
            </a>
            <a href="#keunggulan" className="hover:text-[#00AA13] transition-colors">
              Keunggulan
            </a>
            <a href="#cara-kerja" className="hover:text-[#00AA13] transition-colors">
              Cara Kerja
            </a>
            <a href="#testimoni" className="hover:text-[#00AA13] transition-colors">
              Testimoni
            </a>
            <a href="#faq" className="hover:text-[#00AA13] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Direct WhatsApp Contact */}
          <div className="flex items-center gap-3">
            {data.waNumber && (
              <a
                href={`https://wa.me/${data.waNumber.replace(/\D/g, '')}?text=Halo%20Komuna,%20saya%20ingin%20tanya%20seputar%20aplikasi%20RT`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-[#00880F] hover:bg-emerald-100 font-black text-xs transition-colors"
                title="Hubungi Dukungan WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600/20 text-[#00880F]" />
                <span>Chat Tim Komuna</span>
              </a>
            )}
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>untuk kemajuan rukun tetangga di seluruh Indonesia.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>{data.copyright}</span>
            <span className="text-slate-300">•</span>
            <Link href="/admin/login" className="hover:text-slate-600 transition-colors">
              Portal CMS
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
