'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Coins, 
  Wallet, 
  ReceiptText,
  Users, 
  CalendarDays,
  Calendar,
  FileText, 
  Settings, 
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeMenu?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeMenu, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const [appConfig, setAppConfig] = React.useState({
    namaApp: 'komuna.id',
    namaRt: 'RT 04',
    tagline: 'Kebersamaan, Terpadu, Transparan'
  });

  React.useEffect(() => {
    const fetchConfig = async () => {
      // Coba ambil dari cache dulu agar cepat
      const cached = localStorage.getItem('komuna_app_config');
      if (cached) {
        try { setAppConfig(JSON.parse(cached)); } catch(e) {}
      }
      
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setAppConfig(data);
          localStorage.setItem('komuna_app_config', JSON.stringify(data));
        }
      } catch (e) {
        console.error('Failed to fetch app config', e);
      }
    };

    fetchConfig();
    window.addEventListener('komuna_config_updated', fetchConfig);
    return () => window.removeEventListener('komuna_config_updated', fetchConfig);
  }, []);

  const menuSections = [
    {
      title: 'Ringkasan',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      ],
    },
    {
      title: 'Operasional RT',
      items: [
        { name: 'Jimpitan', icon: Coins, href: '/jimpitan' },
        { name: 'Kas RT', icon: Wallet, href: '/kas' },
        { name: 'Hutang & Piutang', icon: ReceiptText, href: '/hutang-piutang' },
        { name: 'Laporan', icon: FileText, href: '/laporan' },
      ],
    },
    {
      title: 'Kegiatan & Jadwal',
      items: [
        { name: 'Jadwal Ronda', icon: CalendarDays, href: '/jadwal' },
        { name: 'Agenda RT', icon: Calendar, href: '/agenda' },
      ],
    },
    {
      title: 'Manajemen',
      items: [
        { name: 'Data Warga', icon: Users, href: '/anggota' },
        { name: 'Susunan Pengurus', icon: ShieldCheck, href: '/pengurus' },
        { name: 'Pengaturan', icon: Settings, href: '/pengaturan' },
      ],
    },
  ];

  // Check if link is currently active
  const isItemActive = (href: string, name: string) => {
    if (activeMenu) {
      if (activeMenu.toLowerCase() === name.toLowerCase()) return true;
      if (activeMenu === 'Jadwal' && name === 'Jadwal Ronda') return true;
      if (activeMenu === 'Agenda' && name === 'Agenda RT') return true;
      if (activeMenu === 'Anggota' && name === 'Data Warga') return true;
      if (activeMenu === 'HutangPiutang' && name === 'Hutang & Piutang') return true;
      if (activeMenu === 'Laporan' && name === 'Laporan') return true;
      if ((activeMenu === 'Pengurus' || activeMenu === 'Susunan Pengurus') && name === 'Susunan Pengurus') return true;
    }
    if (href === '/') return pathname === '/';
    if (href === '#') return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 font-sans z-50 transition-all duration-300 select-none
        ${isOpen ? 'fixed left-0 top-0 shadow-2xl h-full' : 'hidden md:flex'}
      `}>
        {/* Top Section: Logo & Sectioned Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          
          {/* Logo Header */}
          <div className="p-5 flex items-center justify-between gap-2 border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--brand-primary)] text-white shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <div className="text-left space-y-0.5 max-w-[140px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none truncate">{appConfig.namaApp}</h1>
                  <span className="text-[9px] font-bold bg-[var(--brand-light)] text-[var(--brand-primary)] px-1.5 py-0.5 rounded-md border border-[var(--brand-primary)]/20 whitespace-nowrap">
                    {appConfig.namaRt}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
                  {appConfig.tagline}
                </p>
              </div>
            </div>

            {/* Close Button on Mobile Drawer */}
            {isOpen && (
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 md:hidden rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Tutup Menu Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sectioned Menu List */}
          <nav className="p-3.5 space-y-5 text-left flex-1">
            {menuSections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {section.title}
                </h3>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isItemActive(item.href, item.name);
                    const Icon = item.icon;

                    const handleItemClick = (e: React.MouseEvent) => {
                      if (item.href === '#') {
                        e.preventDefault();
                      }
                      if (onClose) {
                        onClose();
                      }
                    };

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleItemClick}
                        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                          active 
                            ? 'bg-[var(--brand-light)]/80 text-[var(--brand-primary)] font-bold shadow-2xs' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {/* Active Left Pill Indicator */}
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--brand-primary)] rounded-r-full" />
                        )}

                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          active ? 'text-[var(--brand-primary)]' : 'text-slate-400 group-hover:text-slate-600'
                        }`} />
                        
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

        </div>

        {/* Bottom Section: Logout & Sync Indicator */}
        <div className="p-3.5 border-t border-slate-100 space-y-3 bg-white">
          
          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              document.cookie = 'komuna_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50/70 transition-all duration-150 cursor-pointer group text-left"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 shrink-0" />
            <span>Keluar Aplikasi</span>
          </button>

          {/* Streamlined Live Sync Status Pill */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10.5px] font-bold text-slate-700 leading-none">
                Tersinkronisasi
              </span>
            </div>
            <span className="text-[9.5px] font-medium text-slate-400">
              v1.0.0
            </span>
          </div>

        </div>
      </aside>
    </>
  );
}
