'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Shield, Key, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfilPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ id: string, nama: string, email: string, role: string, createdAt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [nama, setNama] = useState('');
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setNama(data.nama);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      triggerToast('Nama tidak boleh kosong', 'error');
      return;
    }

    if (passwordBaru && !passwordLama) {
      triggerToast('Masukkan password lama untuk mengganti password', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          passwordLama,
          passwordBaru
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast('Profil berhasil diperbarui!', 'success');
        setPasswordLama('');
        setPasswordBaru('');
        setUser(prev => prev ? { ...prev, nama } : prev);
        
        // Memaksa Header untuk me-reload data dari cookie jika perlu
        window.dispatchEvent(new Event('komuna_profile_updated'));
      } else {
        triggerToast(data.error || 'Gagal memperbarui profil', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 xl:px-10 py-6 md:py-8 pb-24 md:pb-16 font-sans">
        
        {/* Toast Notification */}
        {showToast && (
          <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
            toastType === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
          }`}>
            {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profil Saya</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[var(--brand-primary)] animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data profil...</p>
          </div>
        ) : user ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 md:p-8">
            
            {/* Header Profil */}
            <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 capitalize">{user.nama}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-1 bg-[var(--brand-light)] text-[var(--brand-primary)] text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {user.role}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Bergabung sejak {new Date(user.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-slate-400" />
                  Informasi Dasar
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                      placeholder="Masukkan nama Anda"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Email digunakan untuk login dan tidak dapat diubah.</p>
                </div>
              </div>

              <div className="pt-2">
                <hr className="border-slate-100" />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-slate-400" />
                  Keamanan Akun
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Kosongkan kolom password di bawah ini jika Anda tidak ingin mengubah password saat ini.
                </p>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Password Lama</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={passwordLama}
                      onChange={(e) => setPasswordLama(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                      placeholder="Masukkan password saat ini"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Password Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={passwordBaru}
                      onChange={(e) => setPasswordBaru(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                      placeholder="Masukkan password baru"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-slate-500 font-medium">Gagal memuat profil. Silakan muat ulang halaman.</p>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
