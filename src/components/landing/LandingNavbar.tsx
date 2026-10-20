'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if user has active session cookie
    if (typeof document !== 'undefined') {
      const hasSession = document.cookie.includes('komuna_user=') || document.cookie.includes('komuna_session=');
      setIsLoggedIn(hasSession);
    }
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '#beranda' },
    { name: 'Fitur', href: '#fitur' },
    { name: 'Tentang', href: '#tentang' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 py-3'
          : 'bg-white/80 backdrop-blur-xs py-4 sm:py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="#beranda" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-emerald-800 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
              {appName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
              {tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors relative py-1"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-1 text-slate-600 hover:text-slate-900 md:hidden rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200/80 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-bold text-slate-700 hover:text-emerald-700 py-1 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-700 text-white font-bold text-sm shadow-xs"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-full bg-emerald-700 text-white font-bold text-sm shadow-xs"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
