'use client';

import React from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 font-sans sticky top-0 z-10">
      {/* Left side: Hamburger button */}
      <button className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200">
        <Menu className="w-6 h-6" />
      </button>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-6">
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
        <div className="flex items-center gap-3 cursor-pointer group">
          {/* Avatar (simulated with nice graphics) */}
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
            {/* Simple silhouette or initials */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#f95713] transition-colors duration-200">
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
