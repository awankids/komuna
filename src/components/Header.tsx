'use client';

import React from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 font-sans sticky top-0 z-10">
      {/* Left side: Hamburger button */}
      <button 
        onClick={onMenuClick}
        className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 focus:outline-none"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Middle: Logo (Mobile only) */}
      <div className="flex md:hidden items-center gap-2 flex-1 justify-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4.5 h-4.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </div>
        <div className="text-left">
          <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">komuna.id</h1>
          <span className="text-[8px] text-slate-400 font-semibold tracking-wide uppercase leading-none mt-0.5 block">Kebersamaan, Terpadu</span>
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Notifications Icon with Badge */}
        <button className="relative text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
            3
          </span>
        </button>

        {/* Vertical Divider */}
        <span className="w-px h-6 bg-slate-200" />

        {/* Profile Card */}
        <div className="flex items-center gap-1.5 md:gap-3 cursor-pointer group">
          {/* Avatar (simulated with nice graphics) */}
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
            {/* Simple silhouette or initials */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5 md:w-5 md:h-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[var(--brand-primary)] transition-colors duration-200">
              Admin RT 04
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Ketua RT
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
        </div>
      </div>
    </header>
  );
}
