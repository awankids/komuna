'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, Trash2, CalendarDays, Check, RefreshCw, Bell } from 'lucide-react';
import Link from 'next/link';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  komunitasId?: string | null;
}

export default function NotifikasiClient({ initialData }: { initialData: Notification[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHrs < 24) return `${diffHrs} jam yang lalu`;
    if (diffDays === 1) return `Kemarin, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (type: string, isRead: boolean) => {
    switch(type) {
      case 'success':
        return <CheckCircle2 className={`w-5 h-5 ${isRead ? 'text-slate-400' : 'text-emerald-500'}`} />;
      case 'warning':
        return <AlertTriangle className={`w-5 h-5 ${isRead ? 'text-slate-400' : 'text-amber-500'}`} />;
      case 'error':
        return <AlertCircle className={`w-5 h-5 ${isRead ? 'text-slate-400' : 'text-red-500'}`} />;
      case 'info':
      default:
        return <Info className={`w-5 h-5 ${isRead ? 'text-slate-400' : 'text-sky-500'}`} />;
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(deleteConfirmId);
    try {
      const res = await fetch(`/api/notifikasi/${deleteConfirmId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDeleteConfirmId(null);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2000);
        router.refresh();
      } else {
        alert('Gagal menghapus notifikasi');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Notifikasi" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 xl:px-10 py-6 md:py-8 pb-24 md:pb-16 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Semua Notifikasi</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Riwayat lengkap aktivitas dan pembaruan sistem</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>

          {/* Phone Notification Activation Banner */}
          {notificationPermission === 'default' && (
            <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950">Aktifkan Notifikasi HP</h4>
                  <p className="text-[11px] sm:text-xs text-amber-800">
                    Dapatkan pemberitahuan langsung di layar HP jika jimpitan belum tercatat selama 3 hari berturut-turut.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if ('Notification' in window) {
                    const perm = await Notification.requestPermission();
                    setNotificationPermission(perm);
                    if (perm === 'granted') {
                      new Notification('Komuna RT 🔔', {
                        body: 'Notifikasi HP aktif! Anda akan menerima peringatan jimpitan langsung di HP.',
                        icon: '/icon-192.png'
                      });
                    }
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
              >
                Aktifkan Notifikasi
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {initialData.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Notifikasi</h3>
                <p className="text-sm text-slate-500 max-w-sm">Anda belum menerima notifikasi aktivitas atau pembaruan sistem apapun saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {initialData.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-5 transition-colors ${!item.isRead ? 'bg-sky-50/40' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex gap-4">
                      {/* Icon Column */}
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${!item.isRead ? 'bg-white shadow-sm border border-sky-100' : 'bg-slate-50 border border-slate-100'}`}>
                          {getIcon(item.type, item.isRead)}
                          {!item.isRead && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full border-2 border-white" />
                          )}
                        </div>
                      </div>
                      
                      {/* Content Column */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              item.komunitasId 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {item.komunitasId ? 'Aktivitas RT' : 'Pembaruan Sistem'}
                            </span>
                            <h4 className={`text-[15px] tracking-tight ${!item.isRead ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                              {item.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">
                              {formatTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-sm leading-relaxed ${!item.isRead ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                          {item.message}
                        </p>
                        
                        {/* Actions Footer */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100/60">
                          <WhatsAppShareButton 
                            text={`*${item.title}*\n\n${item.message}\n\n_Pesan otomatis dari komuna.id_`} 
                          />
                          <button
                            onClick={() => confirmDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus notifikasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Hapus Notifikasi?</h3>
            <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan. Notifikasi ini akan dihapus permanen dari riwayat Anda.</p>
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting === deleteConfirmId}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting === deleteConfirmId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 bg-slate-800 text-white animate-bounce z-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">Notifikasi berhasil dihapus</span>
        </div>
      )}
    </div>
  );
}
