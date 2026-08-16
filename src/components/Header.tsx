'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User, Settings, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [userData, setUserData] = useState<{nama: string, role: string} | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch session from cookie
  useEffect(() => {
    const getSession = () => {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('komuna_session='));
      if (sessionCookie) {
        try {
          const sessionValue = decodeURIComponent(sessionCookie.split('=')[1]);
          setUserData(JSON.parse(sessionValue));
        } catch (e) {
          console.error('Failed to parse session cookie', e);
        }
      }
    };
    getSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifikasi');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifikasi || []);
        setUnreadCount(data.notifikasi?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifikasi/mark-all-read', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifikasi/${id}`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setIsNotifOpen(false);
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHrs < 24) return `${diffHrs} jam yang lalu`;
    if (diffDays === 1) return `Kemarin`;
    return `${diffDays} hari yang lalu`;
  };

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 font-sans sticky top-0 z-40">
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
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative text-slate-500 p-2 rounded-xl transition-all duration-200 focus:outline-none ${isNotifOpen ? 'bg-slate-100 text-slate-800' : 'hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-[var(--brand-primary)] font-semibold hover:underline">Tandai dibaca</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs font-medium italic">
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link href="/notifikasi" onClick={() => handleMarkRead(notif.id)} key={notif.id} className={`block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-slate-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-[var(--brand-primary)]' : 'bg-transparent'}`} />
                        <div>
                          <p className={`text-xs ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.title}</p>
                          {notif.message && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">{notif.message}</p>}
                          <p className="text-[9px] text-slate-400 mt-1">{formatTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-3 text-center border-t border-slate-50">
                <Link href="/notifikasi" onClick={() => { handleMarkAllRead(); setIsNotifOpen(false); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-block w-full py-1">Lihat semua notifikasi</Link>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <span className="w-px h-6 bg-slate-200 hidden md:block" />

        {/* Profile Card */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 md:gap-3 cursor-pointer group p-1 pr-2 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            {/* Avatar (simulated with nice graphics) */}
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold shrink-0">
              {/* Simple silhouette or initials */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5 md:w-5 md:h-5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[var(--brand-primary)] transition-colors duration-200 capitalize">
                {userData?.nama || 'Memuat...'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium capitalize">
                {userData?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-slate-50 block sm:hidden">
                <span className="text-sm font-bold text-slate-800 block capitalize">{userData?.nama || 'Memuat...'}</span>
                <span className="text-[10px] text-slate-400 font-medium block capitalize">{userData?.role || 'Admin'}</span>
              </div>
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                  <User className="w-4 h-4" />
                  Profil Saya
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </button>
              </div>
              <div className="p-2 border-t border-slate-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
