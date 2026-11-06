'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';

interface LandingNavbarProps {
  appName?: string;
  tagline?: string;
}

export default function LandingNavbar({
  appName = 'komuna.id',
  tagline = 'Kebersamaan, Terpadu, Transparan',
}: LandingNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(false);

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

  // Sync dark mode state with localStorage and documentElement
  useEffect(() => {
    try {
      const isExplicitDark =
        localStorage.getItem('komuna_login_dark_explicit') === 'yes' ||
        localStorage.getItem('komuna-dark') === 'yes' ||
        document.documentElement.classList.contains('dark');
      setIsDark(isExplicitDark);
      if (isExplicitDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem('komuna-dark', nextDark ? 'yes' : 'no');
      localStorage.setItem('komuna_login_dark_explicit', nextDark ? 'yes' : 'no');
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

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
          ? 'bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800/80 py-2'
          : 'bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-xs py-2.5 sm:py-3 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo - Aligned with /login squircle */}
        <Link href="#beranda" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-md shadow-[var(--brand-ring-strong)] transition-transform group-hover:scale-105 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                {appName}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 rounded-full border border-orange-200/60 dark:border-orange-800/40">
                Portal RT
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:inline">
              {tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary)] transition-colors relative py-1"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons + Theme Toggle */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Integrated Theme Switcher (Same as Login Page) */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDark ? "Klik untuk beralih ke Mode Terang" : "Klik untuk beralih ke Mode Gelap"}
            title={isDark ? "Klik untuk beralih ke Mode Terang" : "Klik untuk beralih ke Mode Gelap"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-all cursor-pointer select-none shrink-0 mr-1"
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xl:inline">Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xl:inline">Terang</span>
              </>
            )}
          </button>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-md shadow-[var(--brand-ring)] transition-all active:scale-95"
            >
              <span>Buka Dashboard RT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                Masuk Warga
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50/80 hover:bg-orange-100 text-[var(--brand-primary)] dark:bg-orange-950/30 dark:hover:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-bold text-xs transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] dark:text-orange-400" />
                <span>Coba Demo</span>
              </Link>
              <Link
                href="/daftar"
                className="px-4.5 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-md shadow-[var(--brand-ring)] transition-all active:scale-95"
              >
                Daftar RT Baru
              </Link>
            </>
          )}
        </div>

        {/* Mobile Right Bar: Theme Toggle & Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle Mode Gelap/Terang"
            className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-[var(--brand-primary)] py-2 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60"
              >
                <span>{link.name}</span>
                <span className="text-slate-300 dark:text-slate-600">&rsaquo;</span>
              </a>
            ))}
          </nav>
          <div className="pt-2 flex flex-col gap-2.5">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-bold text-sm shadow-md"
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
                    className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Masuk Warga
                  </Link>
                  <Link
                    href="/demo"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-50 text-[var(--brand-primary)] dark:bg-orange-950/30 dark:text-orange-300 font-bold text-xs border border-orange-200 dark:border-orange-800/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] dark:text-orange-400" />
                    <span>Coba Demo</span>
                  </Link>
                </div>
                <Link
                  href="/daftar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm shadow-md shadow-[var(--brand-ring)]"
                >
                  Daftar RT Baru
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
