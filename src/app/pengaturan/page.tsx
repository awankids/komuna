'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import {
  Download,
  Upload,
  RefreshCw,
  Database,
  Users,
  FolderHeart,
  CalendarDays,
  Coins,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Palette,
  Type,
  Sliders,
  Terminal,
  Trash2
} from 'lucide-react';

interface DBStats {
  users: number;
  rombongan: number;
  anggota: number;
  jadwal: number;
  jimpitan: number;
  transaksi: number;
}

interface ErrorLogItem {
  timestamp: string;
  type: string;
  message: string;
  source: string;
  url: string;
}

export default function PengaturanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);

  // Theme states
  const [theme, setTheme] = useState('orange');
  const [isDark, setIsDark] = useState(false);
  const [font, setFont] = useState('outfit');
  const [size, setSize] = useState('normal');
  const [style, setStyle] = useState('classic');
  const [timezone, setTimezone] = useState('Asia/Jakarta');

  // Error Log State
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore file content & confirm dialog state
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme settings from localStorage on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('komuna-theme') || 'orange';
        const savedDark = localStorage.getItem('komuna-dark') === 'yes';
        const savedFont = localStorage.getItem('komuna-font') || 'outfit';
        const savedSize = localStorage.getItem('komuna-size') || 'normal';
        const savedStyle = localStorage.getItem('komuna-style') || 'classic';
        const savedTimezone = localStorage.getItem('komuna-timezone') || 'Asia/Jakarta';
        const savedLogs = JSON.parse(localStorage.getItem('komuna-error-logs') || '[]');
        setTheme(savedTheme);
        setIsDark(savedDark);
        setFont(savedFont);
        setSize(savedSize);
        setStyle(savedStyle);
        setTimezone(savedTimezone);
        setErrorLogs(Array.isArray(savedLogs) ? savedLogs : []);
      } catch (err) {
        console.error('Error loading settings from localStorage:', err);
      }
    }
  }, []);

  // Update a setting and apply classes to documentElement
  const updateSetting = (key: 'theme' | 'dark' | 'font' | 'size', value: string | boolean) => {
    let currentTheme = theme;
    let currentDark = isDark;
    let currentFont = font;
    let currentSize = size;

    if (key === 'theme' && typeof value === 'string') {
      localStorage.setItem('komuna-theme', value);
      setTheme(value);
      currentTheme = value;
    } else if (key === 'dark' && typeof value === 'boolean') {
      localStorage.setItem('komuna-dark', value ? 'yes' : 'no');
      setIsDark(value);
      currentDark = value;
    } else if (key === 'font' && typeof value === 'string') {
      localStorage.setItem('komuna-font', value);
      setFont(value);
      currentFont = value;
    } else if (key === 'size' && typeof value === 'string') {
      localStorage.setItem('komuna-size', value);
      setSize(value);
      currentSize = value;
    }

    if (typeof document !== 'undefined') {
      const cl = document.documentElement.classList;
      Array.from(cl).forEach(c => {
        if (c.startsWith('theme-') || c.startsWith('font-') || c.startsWith('size-') || c === 'dark') {
          cl.remove(c);
        }
      });
      cl.add(`theme-${currentTheme}`);
      cl.add(`font-${currentFont}`);
      cl.add(`size-${currentSize}`);
      if (currentDark) {
        cl.add('dark');
      }
    }

    triggerToast('Pengaturan tampilan berhasil diperbarui!', 'success');
  };

  const updateStyleSetting = (value: string) => {
    localStorage.setItem('komuna-style', value);
    setStyle(value);
    if (typeof document !== 'undefined') {
      const cl = document.documentElement.classList;
      cl.remove('style-classic', 'style-glassmorphism');
      cl.add(`style-${value}`);
    }
    triggerToast('Gaya desain tampilan berhasil diperbarui!', 'success');
  };

  const handleTimezoneChange = (val: string) => {
    localStorage.setItem('komuna-timezone', val);
    setTimezone(val);
    triggerToast('Zona waktu sistem berhasil diperbarui!', 'success');
  };

  const handleClearLogs = () => {
    localStorage.removeItem('komuna-error-logs');
    setErrorLogs([]);
    triggerToast('Log error berhasil dibersihkan!', 'success');
  };

  const handleDownloadLogs = () => {
    if (errorLogs.length === 0) {
      triggerToast('Tidak ada log error untuk diunduh.', 'error');
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(errorLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `komuna_error_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Berkas log error berhasil diunduh!', 'success');
  };

  const handleSimulateError = () => {
    try {
      throw new Error('SIMULATION_ERROR: Pengujian logging sistem diagnostik komuna.id');
    } catch (err: any) {
      const newLog = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: err.message,
        source: 'pengaturan/page.tsx:162',
        url: typeof window !== 'undefined' ? window.location.href : '',
      };
      const updatedLogs = [newLog, ...errorLogs];
      setErrorLogs(updatedLogs);
      localStorage.setItem('komuna-error-logs', JSON.stringify(updatedLogs.slice(0, 50)));
      triggerToast('Berhasil mensimulasikan error log baru!', 'success');
    }
  };

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/backup/stats');
      const data = await res.json();
      if (isMountedRef.current && !data.error) {
        setStats(data);
      }
    } catch (e) {
      console.error('Error loading db stats:', e);
    } finally {
      if (isMountedRef.current) setIsLoadingStats(false);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 4000);
  };

  const handleBackup = async () => {
    setIsBackupLoading(true);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `backup_komuna_${formattedDate}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      triggerToast('Backup database berhasil diunduh!', 'success');
    } catch (e: any) {
      console.error('Backup download error:', e);
      triggerToast('Gagal mengunduh backup: ' + e.message, 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.version || !json.data) {
          triggerToast('Format file backup tidak valid atau rusak', 'error');
          return;
        }
        setPendingRestoreData(json);
        setShowConfirmRestore(true);
      } catch (err) {
        triggerToast('Gagal membaca file JSON. Pastikan file tidak rusak', 'error');
      }
    };
    reader.readAsText(file);
    // reset input value so user can upload the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    setShowConfirmRestore(false);
    setIsRestoreLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingRestoreData),
      });

      const result = await response.json();
      if (result.error) {
        triggerToast(result.error, 'error');
      } else {
        triggerToast('Database berhasil dipulihkan (Restore Sukses)!', 'success');
        fetchStats();
      }
    } catch (e: any) {
      console.error('Restore error:', e);
      triggerToast('Gagal memulihkan database: ' + e.message, 'error');
    } finally {
      setIsRestoreLoading(false);
      setPendingRestoreData(null);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Pengaturan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {showToast && (
            <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
              toastType === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
            }`}>
              {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Title and Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Pengaturan</h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium">Backup, restore, dan kelola data aplikasi komuna.id.</p>
            </div>
            <button
              onClick={fetchStats}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              title="Refresh Halaman"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Backup & Restore Panel */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Backup Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Cadangkan Data (Backup)</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Unduh salinan seluruh data warga, rombongan, jadwal, nominal jimpitan, dan laporan kas saat ini ke komputer Anda. File hasil backup berformat JSON dan dapat dipulihkan kapan saja.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs text-slate-450 font-medium">
                    Format file: <span className="font-bold text-slate-600">.json</span>
                  </div>
                  <button
                    onClick={handleBackup}
                    disabled={isBackupLoading}
                    className="px-6 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer text-xs"
                  >
                    {isBackupLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Unduh File Backup</span>
                  </button>
                </div>
              </div>

              {/* Restore Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Pulihkan Data (Restore)</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Unggah file backup komuna.id (.json) yang telah diunduh sebelumnya untuk mengembalikan seluruh keadaan database.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800">Perhatian Penting</span>
                    <p className="text-[11px] text-amber-600 leading-relaxed font-semibold">
                      Proses restore akan menghapus data yang ada saat ini sebelum menimpa dengan data dari file backup. Pastikan Anda mengunggah file backup yang tepat.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="text-xs text-slate-450 font-medium">
                    Pilih file cadangan JSON yang valid.
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRestoreLoading}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer text-xs"
                  >
                    {isRestoreLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-450" />
                    )}
                    <span>Unggah & Pulihkan Data</span>
                  </button>
                </div>
              </div>

              {/* Theme Settings Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Tampilan & Tema Aplikasi</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Kustomisasi warna dasar, jenis huruf, dan ukuran teks untuk antarmuka komuna.id. Perubahan akan disimpan secara lokal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                  
                  {/* Left Column: Accent Colors & Dark Mode */}
                  <div className="space-y-5">
                    {/* Tema Warna (Accent Colors) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Palette className="w-4.5 h-4.5 text-slate-400" />
                        <span>Warna Aksen</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {/* Orange Palette */}
                        <button
                          type="button"
                          onClick={() => updateSetting('theme', 'orange')}
                          aria-label="Pilih Warna Aksen Sunset Orange"
                          className={`flex items-center justify-between p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            theme === 'orange'
                              ? 'border-[#f95713] bg-orange-50/10 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                           <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-800 block">Sunset Orange</span>
                            <span className="text-[8px] text-slate-400 font-bold block">Hangat & Dinamis</span>
                          </div>
                          <div className="flex gap-0.5 shrink-0 ml-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#f95713] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#ea4e0a] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#fff7ed] border border-white shadow-xs" />
                          </div>
                        </button>

                        {/* Emerald Palette */}
                        <button
                          type="button"
                          onClick={() => updateSetting('theme', 'emerald')}
                          aria-label="Pilih Warna Aksen Emerald Garden"
                          className={`flex items-center justify-between p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            theme === 'emerald'
                              ? 'border-[#10b981] bg-emerald-50/10 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-800 block">Emerald Garden</span>
                            <span className="text-[8px] text-slate-400 font-bold block">Segar & Tenang</span>
                          </div>
                          <div className="flex gap-0.5 shrink-0 ml-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#059669] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#ecfdf5] border border-white shadow-xs" />
                          </div>
                        </button>

                        {/* Blue Palette */}
                        <button
                          type="button"
                          onClick={() => updateSetting('theme', 'blue')}
                          aria-label="Pilih Warna Aksen Ocean Blue"
                          className={`flex items-center justify-between p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            theme === 'blue'
                              ? 'border-[#3b82f6] bg-blue-50/10 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-800 block">Ocean Blue</span>
                            <span className="text-[8px] text-slate-400 font-bold block">Bersih & Modern</span>
                          </div>
                          <div className="flex gap-0.5 shrink-0 ml-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#eff6ff] border border-white shadow-xs" />
                          </div>
                        </button>

                        {/* Violet Palette */}
                        <button
                          type="button"
                          onClick={() => updateSetting('theme', 'violet')}
                          aria-label="Pilih Warna Aksen Royal Violet"
                          className={`flex items-center justify-between p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            theme === 'violet'
                              ? 'border-[#8b5cf6] bg-violet-50/10 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-800 block">Royal Violet</span>
                            <span className="text-[8px] text-slate-400 font-bold block">Premium & Anggun</span>
                          </div>
                          <div className="flex gap-0.5 shrink-0 ml-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#8b5cf6] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#7c3aed] border border-white shadow-xs" />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#f5f3ff] border border-white shadow-xs" />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Mode Tampilan (Dark Mode Switcher) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Sliders className="w-4.5 h-4.5 text-slate-400" />
                        <span>Mode Tampilan</span>
                      </div>
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden text-[10px] font-bold w-48">
                        <button
                          onClick={() => updateSetting('dark', false)}
                          aria-label="Aktifkan Mode Terang"
                          className={`flex-1 py-2 cursor-pointer transition-all ${
                            !isDark ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Terang
                        </button>
                        <button
                          onClick={() => updateSetting('dark', true)}
                          aria-label="Aktifkan Mode Gelap"
                          className={`flex-1 py-2 cursor-pointer transition-all ${
                            isDark ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Gelap
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Fonts & Sizes */}
                  <div className="space-y-5">
                    {/* Pilihan Font */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Type className="w-4.5 h-4.5 text-slate-400" />
                        <span>Gaya Font</span>
                      </div>
                      <select
                        value={font}
                        onChange={(e) => updateSetting('font', e.target.value)}
                        aria-label="Pilih Gaya Font Aplikasi"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] cursor-pointer bg-white"
                      >
                        <option value="outfit">Outfit (Rounded Premium)</option>
                        <option value="inter">Inter (Clean Sans)</option>
                        <option value="lora">Lora (Elegant Serif)</option>
                        <option value="jetbrains">JetBrains Mono (Console)</option>
                      </select>
                    </div>

                    {/* Ukuran Teks */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Sliders className="w-4.5 h-4.5 text-slate-400" />
                        <span>Ukuran Teks</span>
                      </div>
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden text-[10px] font-bold w-full">
                        <button
                          onClick={() => updateSetting('size', 'kecil')}
                          aria-label="Ukuran Teks Kecil"
                          className={`flex-1 py-2 cursor-pointer transition-all ${
                            size === 'kecil' ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Kecil
                        </button>
                        <button
                          onClick={() => updateSetting('size', 'normal')}
                          aria-label="Ukuran Teks Normal"
                          className={`flex-1 py-2 cursor-pointer border-x border-slate-200 transition-all ${
                            size === 'normal' ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => updateSetting('size', 'besar')}
                          aria-label="Ukuran Teks Besar"
                          className={`flex-1 py-2 cursor-pointer transition-all ${
                            size === 'besar' ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Besar
                        </button>
                      </div>
                    </div>

                    {/* Gaya Desain (Classic vs Glassmorphism) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Palette className="w-4.5 h-4.5 text-slate-400" />
                        <span>Gaya Desain</span>
                      </div>
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden text-[10px] font-bold w-full">
                        <button
                          onClick={() => updateStyleSetting('classic')}
                          aria-label="Gaya Desain Klasik Premium"
                          className={`flex-1 py-2 cursor-pointer transition-all ${
                            style === 'classic' ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Klasik Premium
                        </button>
                        <button
                          onClick={() => updateStyleSetting('glassmorphism')}
                          className={`flex-1 py-2 cursor-pointer border-l border-slate-200 transition-all ${
                            style === 'glassmorphism' ? 'bg-[#f95713] text-white font-extrabold' : 'bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          Glassmorphism
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Regional & System Settings Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Pengaturan Regional & Waktu</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Pilih zona waktu acuan untuk pencatatan jimpitan harian, ronda, dan transaksi keuangan.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Sliders className="w-4.5 h-4.5 text-slate-400" />
                      <span>Zona Waktu (Timezone)</span>
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => handleTimezoneChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/10 focus:border-[var(--brand-primary)] cursor-pointer bg-white"
                    >
                      <option value="Asia/Jakarta">WIB - Waktu Indonesia Barat (UTC+07:00)</option>
                      <option value="Asia/Makassar">WITA - Waktu Indonesia Tengah (UTC+08:00)</option>
                      <option value="Asia/Jayapura">WIT - Waktu Indonesia Timur (UTC+09:00)</option>
                      <option value="UTC">UTC - Coordinated Universal Time (UTC+00:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Error Log & Diagnostics Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">Log Error & Diagnostik Sistem</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Daftar error dan aktivitas sistem untuk penemuan dan perbaikan bug secara real-time.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleSimulateError}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      Simulasikan Error
                    </button>
                    <button
                      onClick={handleDownloadLogs}
                      disabled={errorLogs.length === 0}
                      className="px-3.5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Log (.json)
                    </button>
                    <button
                      onClick={handleClearLogs}
                      disabled={errorLogs.length === 0}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-red-650 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Bersihkan Log
                    </button>
                  </div>

                  {/* Log Console Viewer */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-200 p-4 font-mono text-[10px] leading-relaxed max-h-60 overflow-y-auto shadow-inner">
                    {errorLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-1 text-center font-sans">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-300 mt-1">Konsol Log Bersih</span>
                        <span className="text-[10px]">Sistem berjalan dengan normal tanpa gangguan.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {errorLogs.map((log, idx) => (
                          <div key={idx} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between text-slate-500 mb-0.5">
                              <span>[{new Date(log.timestamp).toLocaleString('id-ID')}]</span>
                              <span className="text-red-400 uppercase font-bold tracking-wider">{log.type}</span>
                            </div>
                            <div className="text-red-200 font-semibold break-all">{log.message}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 flex flex-col gap-0.5">
                              <span>📍 Sumber: {log.source}</span>
                              <span className="break-all">🔗 URL: {log.url}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Stats Panel */}
            <div className="space-y-8">
              
              {/* Database Status Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Status Database</h3>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">komuna.id SQLite</span>
                  </div>
                </div>

                {isLoadingStats ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
                    <span className="text-[11px] font-bold">Memuat statistik data...</span>
                  </div>
                ) : stats ? (
                  <div className="space-y-3.5">
                    
                    {/* Stat Item: Anggota */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold">Warga / Anggota</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{stats.anggota}</span>
                    </div>

                    {/* Stat Item: Rombongan */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <FolderHeart className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold">Rombongan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{stats.rombongan}</span>
                    </div>

                    {/* Stat Item: Jadwal */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold">Jadwal Piket</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{stats.jadwal}</span>
                    </div>

                    {/* Stat Item: Jimpitan */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <Coins className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold">Input Jimpitan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{stats.jimpitan}</span>
                    </div>

                    {/* Stat Item: Transaksi Keuangan */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold">Transaksi Keuangan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{stats.transaksi}</span>
                    </div>

                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    Gagal mengambil rincian data database.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Confirm Restore Dialog Modal */}
          {showConfirmRestore && pendingRestoreData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => {
                  setShowConfirmRestore(false);
                  setPendingRestoreData(null);
                }}
              />
              {/* Dialog Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mx-auto mb-5 text-amber-500">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Konfirmasi Restore Data</h3>
                {/* Message */}
                <p className="text-sm text-slate-500 text-center leading-relaxed font-medium mb-6">
                  Apakah Anda yakin ingin memulihkan data dari file backup? Tindakan ini akan menghapus dan mengganti seluruh data yang saat ini ada di database secara permanen.
                </p>
                {/* Metadata of Backup File */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2 mb-8 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Tanggal Backup:</span>
                    <span className="text-slate-700 font-extrabold">
                      {new Date(pendingRestoreData.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Total Warga:</span>
                    <span className="text-slate-700 font-extrabold">{pendingRestoreData.data.anggota?.length || 0} orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Total Rombongan:</span>
                    <span className="text-slate-700 font-extrabold">{pendingRestoreData.data.rombongan?.length || 0} kelompok</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-bold">Total Catatan Jimpitan:</span>
                    <span className="text-slate-700 font-extrabold">{pendingRestoreData.data.jimpitan?.length || 0} records</span>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmRestore(false);
                      setPendingRestoreData(null);
                    }}
                    className="flex-1 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeRestore}
                    className="flex-1 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-100 transition-all text-sm cursor-pointer"
                  >
                    Ya, Gantikan Data
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>
    </div>
  );
}
