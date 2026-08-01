'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Coins, 
  Wallet, 
  Users, 
  CalendarDays,
  Calendar,
  FileText, 
  Settings, 
  CloudLightning,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeMenu?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeMenu = 'Dashboard', isOpen = false, onClose }: SidebarProps) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Jimpitan', icon: Coins, href: '/jimpitan' },
    { name: 'Kas RT', icon: Wallet, href: '/kas' },
    { name: 'Anggota', icon: Users, href: '/anggota' },
    { name: 'Jadwal', icon: CalendarDays, href: '/jadwal' },
    { name: 'Agenda', icon: Calendar, href: '/agenda' },
    { name: 'Laporan', icon: FileText, href: '#' },
    { name: 'Pengaturan', icon: Settings, href: '/pengaturan' },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 font-sans z-50 transition-all duration-300
        ${isOpen ? 'fixed left-0 top-0 shadow-2xl h-full' : 'hidden md:flex'}
      `}>
        {/* Top Section: Logo */}
        <div>
          <div className="p-6 flex items-center justify-between gap-2 border-b border-slate-50 md:border-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white shadow-sm">
                {/* Simple House + Community shape in custom SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">komuna.id</h1>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Kebersamaan, Terpadu, Transparan</span>
              </div>
            </div>
            {/* Close Button on Mobile Drawer */}
            {isOpen && (
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 md:hidden rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Menu Navigation */}
          <nav className="px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.name === activeMenu;
              const Icon = item.icon;
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </a>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={() => {
                document.cookie = 'komuna_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-all duration-200 cursor-pointer mt-4"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span>Keluar</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Offline Status & Branding */}
        <div className="p-4 space-y-4">
          {/* Offline Sync Box */}
          <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100/50 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="p-1.5 bg-slate-200/50 rounded-lg text-slate-500">
                <CloudLightning className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-medium">Sinkronisasi</span>
                <span className="text-[11px] font-semibold text-slate-700">Terakhir: 10:30</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Semua data tersinkronisasi
            </div>
          </div>

          {/* Footer Brand Info */}
          <div className="px-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>komuna.id</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
