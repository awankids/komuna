import React from 'react';
import Header from '@/components/Header';
import { db } from '@/lib/db';
import { Check, CheckCircle2, Info, AlertTriangle, AlertCircle, Trash2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import DeleteNotificationButton from '@/components/DeleteNotificationButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotifikasiPage() {
  const notifikasi = await db.notifikasi.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHrs < 24) return `${diffHrs} jam yang lalu`;
    if (diffDays === 1) return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    
    return date.toLocaleDateString('id-ID', {
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-8 text-slate-800">
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Semua Notifikasi</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Riwayat lengkap aktivitas dan pembaruan sistem</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {notifikasi.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Notifikasi</h3>
              <p className="text-sm text-slate-500 max-w-sm">Anda belum menerima notifikasi aktivitas atau pembaruan sistem apapun saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifikasi.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 md:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 transition-colors ${!item.isRead ? 'bg-sky-50/30' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-0.5 shrink-0 ${!item.isRead ? 'relative' : ''}`}>
                      {getIcon(item.type, item.isRead)}
                      {!item.isRead && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--brand-primary)] rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className={`text-base ${!item.isRead ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-full">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!item.isRead ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                        {item.message}
                      </p>
                      
                      <div className="flex justify-end items-center gap-2 pt-1">
                        <WhatsAppShareButton 
                          text={`*${item.title}*\n\n${item.message}\n\n_Pesan otomatis dari komuna.id_`} 
                        />
                        <DeleteNotificationButton id={item.id} />
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
  );
}
