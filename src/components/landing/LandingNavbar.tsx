'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, Play } from 'lucide-react';

interface LandingNavbarProps {
  appName?: string;
  tagline?: string;
}

export default function LandingNavbar({
  appName = 'komuna.id',
  tagline = 'Super-App Gotong Royong Warga RT/RW',
}: LandingNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const hasSession = document.cookie.includes('komuna_user=') || document.cookie.includes('komuna_session=');
      setIsLoggedIn(hasSession);
    }
  }, []);

  const navLinks = [
    { name: 'Layanan RT', href: '#layanan' },
    { name: 'Keunggulan', href: '#keunggulan' },
    { name: 'Cara Kerja', href: '#cara-kerja' },
    { name: 'Testimoni', href: '#testimoni' },
    { name: 'Tanya Jawab', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 font-sans ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 py-2.5'
          : 'bg-white/90 backdrop-blur-xs py-3.5 sm:py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo - Gojek Style Squircle */}
        <Link href="#beranda" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#00AA13] group-hover:bg-[#00880F] text-white flex items-center justify-center shadow-sm shadow-[#00AA13]/30 transition-transform group-hover:scale-105 shrink-0">
            {/* Super-app dynamic community icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-[#00AA13] transition-colors">
                {appName}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-[#00880F] uppercase tracking-wide">
                RT/RW
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:inline">
              {tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-bold text-slate-600 hover:text-[#00AA13] transition-colors relative py-1 hover:scale-105"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00AA13] hover:bg-[#00880F] text-white font-black text-xs shadow-sm shadow-[#00AA13]/25 hover:shadow-md transition-all active:scale-95"
            >
              <span>Buka Dashboard RT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Masuk Warga
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-[#00880F] hover:bg-emerald-100/80 font-bold text-xs transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Coba Demo</span>
              </Link>
              <Link
                href="/daftar"
                className="px-5 py-2 rounded-full bg-[#00AA13] hover:bg-[#00880F] text-white font-black text-xs shadow-sm shadow-[#00AA13]/25 hover:shadow-md transition-all active:scale-95"
              >
                Daftar RT Baru
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-1 text-slate-700 hover:text-slate-900 lg:hidden rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu - Gojek Style */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2.5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-700 hover:text-[#00AA13] py-1.5 transition-colors flex items-center justify-between"
              >
                <span>{link.name}</span>
                <span className="text-slate-300">&rsaquo;</span>
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#00AA13] text-white font-black text-sm shadow-sm"
              >
                <span>Buka Dashboard RT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Masuk Warga
                  </Link>
                  <Link
                    href="/demo"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-emerald-50 text-[#00880F] font-bold text-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Coba Demo</span>
                  </Link>
                </div>
                <Link
                  href="/daftar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full bg-[#00AA13] text-white font-black text-sm shadow-sm"
                >
                  Daftar RT Baru (Gratis)
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
