'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Coins, 
  Plus, 
  Wallet, 
  FileText,
  FileCheck,
  Users,
  CalendarDays,
  Package
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface MobileNavBarProps {
  onQuickActionClick?: () => void;
}

export default function MobileNavBar({ onQuickActionClick }: MobileNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useCurrentUser();

  const navItems = React.useMemo(() => {
    const baseFirst = [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { name: 'Jimpitan', icon: Coins, href: '/jimpitan' },
      { name: 'Input', icon: Plus, href: '#', isCenter: true },
    ];

    if (role === 'BENDAHARA') {
      return [
        ...baseFirst,
        { name: 'Kas RT', icon: Wallet, href: '/kas' },
        { name: 'Laporan', icon: FileText, href: '/laporan' },
      ];
    }

    if (role === 'SEKRETARIS') {
      return [
        ...baseFirst,
        { name: 'Surat', icon: FileCheck, href: '/surat' },
        { name: 'Warga', icon: Users, href: '/anggota' },
      ];
    }

    if (role === 'PETUGAS') {
      return [
        ...baseFirst,
        { name: 'Ronda', icon: CalendarDays, href: '/jadwal' },
        { name: 'Inventaris', icon: Package, href: '/inventaris' },
      ];
    }

    if (role === 'WARGA') {
      return [
        ...baseFirst,
        { name: 'Surat', icon: FileCheck, href: '/surat' },
        { name: 'Ronda', icon: CalendarDays, href: '/jadwal' },
      ];
    }

    // Default for ADMIN and SUPER_ADMIN
    return [
      ...baseFirst,
      { name: 'Kas RT', icon: Wallet, href: '/kas' },
      { name: 'Laporan', icon: FileText, href: '/laporan' },
    ];
  }, [role]);

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isCenter) {
      if (onQuickActionClick) {
        onQuickActionClick();
      } else {
        // Fallback: scroll to quick actions or navigate to jimpitan input
        const element = document.getElementById('quick-actions-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          router.push('/jimpitan');
        }
      }
      return;
    }
    
    if (item.href && item.href !== '#') {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 md:hidden flex justify-around items-center h-16 px-2 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        // Active logic
        const isActive = item.isCenter 
          ? false 
          : item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href);

        if (item.isCenter) {
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className="relative -translate-y-4 flex flex-col items-center group cursor-pointer focus:outline-none"
              aria-label="Aksi Cepat"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--brand-primary)] text-white shadow-md border-4 border-white dark:border-[#111827] flex items-center justify-center transition-all duration-200 active:scale-90 group-hover:scale-105">
                <Icon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 transition-colors leading-none">
                {item.name}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.name}
            onClick={() => handleNavClick(item)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-[var(--brand-primary)] scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className={`text-[10px] font-bold mt-1 leading-none transition-colors ${isActive ? 'text-[var(--brand-primary)]' : 'text-slate-400 dark:text-slate-500'}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
