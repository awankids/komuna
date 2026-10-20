'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  ShieldCheck 
} from 'lucide-react';
import { FooterData } from '@/lib/landing-defaults';

interface LandingFooterProps {
  data: FooterData;
}

export default function LandingFooter({ data }: LandingFooterProps) {
  return (
    <footer className="bg-white border-t border-slate-100 font-sans pt-12 pb-14 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-base font-black text-slate-800 tracking-tight leading-none block">
                {data.appName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {data.tagline}
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="flex items-center gap-6 sm:gap-8 text-xs font-semibold text-slate-500">
            <a href="#beranda" className="hover:text-emerald-700 transition-colors">
              Beranda
            </a>
            <a href="#fitur" className="hover:text-emerald-700 transition-colors">
              Fitur
            </a>
            <a href="#tentang" className="hover:text-emerald-700 transition-colors">
              Tentang
            </a>
            <a href="#faq" className="hover:text-emerald-700 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Social Media Links */}
          <div className="flex items-center gap-3">
            {data.waNumber && (
              <a
                href={`https://wa.me/${data.waNumber.replace(/\D/g, '')}?text=Halo%20Komuna,%20saya%20ingin%20tanya%20seputar%20aplikasi`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                aria-label="WhatsApp Bantuan"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {data.igUrl && (
              <a
                href={data.igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center transition-colors"
                aria-label="Instagram Komuna"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            )}
            {data.ytUrl && (
              <a
                href={data.ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors"
                aria-label="YouTube Komuna"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
                </svg>
              </a>
            )}
          </div>

        </div>

        {/* Bottom Copyright & Security Notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-400 font-medium">
          <p>{data.copyright}</p>
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Platform Komunitas Gotong-Royong Indonesia</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
