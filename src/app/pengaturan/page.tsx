'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Trash2,
  LayoutDashboard,
  Save,
  Sparkles,
  HardDrive,
  Zap,
  Info,
  MapPin,
  ExternalLink,
  UserPlus,
  ShieldCheck,
  Key,
  Lock,
  Phone,
  Mail,
  Edit2,
  Search,
  X
} from 'lucide-react';

export interface UserItem {
  id: string;
  nama: string;
  email: string;
  noHp: string | null;
  role: string;
  statusAktif: boolean;
  createdAt: string;
}

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
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'identitas' | 'users' | 'database' | 'tampilan'>('identitas');

  // User Management States
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    password: '',
    role: 'PETUGAS',
  });

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    role: 'PETUGAS',
    statusAktif: true,
    passwordBaru: '',
  });

  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // App Identity State
  const [appConfig, setAppConfig] = useState({
    namaApp: 'komuna.id',
    namaRt: '',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    kotaWilayah: 'Semarang',
    nomorSk: '',
    periodeAktif: '2024 - 2029',
  });

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

  // Cache & System Update States
  const [cacheSize, setCacheSize] = useState<string>('Memeriksa...');
  const [swStatus, setSwStatus] = useState<string>('Memeriksa...');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showConfirmClearCache, setShowConfirmClearCache] = useState(false);

  // Load theme settings from localStorage on client-side and fetch fresh config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedConfig = localStorage.getItem('komuna_app_config');
        if (savedConfig) setAppConfig(JSON.parse(savedConfig));

        // Always fetch fresh configuration from server
        fetch('/api/config')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setAppConfig(prev => ({ ...prev, ...data }));
              localStorage.setItem('komuna_app_config', JSON.stringify(data));
            }
          })
          .catch(err => console.error('Error fetching fresh config:', err));
        
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

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setUserList(Array.isArray(data) ? data : []);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      if (isMountedRef.current) setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'users' || tabParam === 'database' || tabParam === 'tampilan' || tabParam === 'identitas') {
        setActiveTab(tabParam as any);
        if (tabParam === 'users') {
          fetchUsers();
        }
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchUsers]);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(data.error || 'Gagal menambahkan akun pengguna', 'error');
      } else {
        triggerToast('Akun pengguna baru berhasil ditambahkan!', 'success');
        setIsAddUserModalOpen(false);
        setNewUserForm({ nama: '', email: '', noHp: '', password: '', role: 'PETUGAS' });
        fetchUsers();
      }
    } catch (err: any) {
      triggerToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(data.error || 'Gagal memperbarui pengguna', 'error');
      } else {
        triggerToast('Data pengguna berhasil diperbarui!', 'success');
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      triggerToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSavingUser(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(data.error || 'Gagal menghapus pengguna', 'error');
      } else {
        triggerToast('Akun pengguna berhasil dihapus', 'success');
        setIsDeleteUserModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err: any) {
      triggerToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BENDAHARA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SEKRETARIS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PETUGAS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WARGA':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin (Ketua RT)';
      case 'ADMIN':
        return 'Administrator';
      case 'BENDAHARA':
        return 'Bendahara RT';
      case 'SEKRETARIS':
        return 'Sekretaris RT';
      case 'PETUGAS':
        return 'Petugas Ronda & Jimpitan';
      case 'WARGA':
        return 'Warga RT';
      default:
        return role;
    }
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

  // Measure cache storage and check SW status
  const checkCacheAndSW = useCallback(async () => {
    if (typeof window !== 'undefined') {
      // 1. Check ServiceWorker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        setSwStatus('Aktif & Mengontrol');
      } else if ('serviceWorker' in navigator) {
        setSwStatus('Terdaftar (Siap)');
      } else {
        setSwStatus('Tidak Didukung');
      }

      // 2. Measure CacheStorage size
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const usageBytes = estimate.usage || 0;
          if (usageBytes > 1024 * 1024) {
            setCacheSize(`~${(usageBytes / (1024 * 1024)).toFixed(1)} MB`);
          } else if (usageBytes > 1024) {
            setCacheSize(`~${Math.round(usageBytes / 1024)} KB`);
          } else {
            setCacheSize(`${usageBytes} Bytes`);
          }
        } else if ('caches' in window) {
          const keys = await caches.keys();
          setCacheSize(`${keys.length} Kontainer Cache`);
        } else {
          setCacheSize('Tersedia');
        }
      } catch (e) {
        setCacheSize('Tersedia');
      }
    }
  }, []);

  useEffect(() => {
    checkCacheAndSW();
  }, [checkCacheAndSW]);

  const handleSoftCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            triggerToast('Versi baru ditemukan! Memuat ulang dalam 1 detik...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return;
          }
        }
      }

      // Also refresh app config
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setAppConfig(data);
        localStorage.setItem('komuna_app_config', JSON.stringify(data));
      }

      await checkCacheAndSW();
      triggerToast('Aplikasi sudah menggunakan versi terbaru dari server!', 'success');
    } catch (e) {
      triggerToast('Gagal memeriksa pembaruan server', 'error');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleExecuteClearCache = async () => {
    setShowConfirmClearCache(false);
    setIsClearingCache(true);
    try {
      // 1. Delete all CacheStorage keys
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 2. Unregister all service workers so fresh one installs on reload
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 3. Clear transient localStorage caches (keep session cookie and user theme preferences)
      try {
        localStorage.removeItem('komuna_app_config');
        localStorage.removeItem('komuna-error-logs');
      } catch (e) {}

      triggerToast('Cache berhasil dibersihkan! Memuat ulang aplikasi...', 'success');

      // 4. Force reload cleanly with cache busting query param
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
      }, 900);
    } catch (e: any) {
      console.error('Clear cache error:', e);
      triggerToast('Gagal membersihkan cache: ' + e.message, 'error');
      setIsClearingCache(false);
    }
  };

  const filteredUsers = userList.filter((u) => {
    if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) {
      return false;
    }
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchName = (u.nama || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = u.noHp ? u.noHp.toLowerCase().includes(q) : false;
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Pengaturan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
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
              <RefreshCw className={`w-4.5 h-4.5 ${isLoadingStats || isLoadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('identitas')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'identitas'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Identitas & Sistem</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('users'); fetchUsers(); }}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span>Pengguna & Hak Akses</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 font-bold">{userList.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Database className="w-4 h-4 text-blue-500" />
              <span>Backup & Database</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tampilan')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'tampilan'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Tema & Tampilan</span>
            </button>
          </div>

          {/* TAB 2: KELOLA PENGGUNA & HAK AKSES */}
          {activeTab === 'users' && (
            <div className="space-y-6 text-left">
              {/* Top Action Bar */}
              <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 w-full md:w-auto">
                  <h3 className="text-base font-bold text-slate-800">Manajemen Pengguna & Hak Akses RT</h3>
                  <p className="text-xs text-slate-400 font-medium">Kelola akun pengurus, bendahara, sekretaris, petugas ronda malam, dan warga mandiri.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNewUserForm({ nama: '', email: '', noHp: '', password: '', role: 'PETUGAS' });
                      setIsAddUserModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Tambah Akun Pengguna</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau no. HP..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['all', 'SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS', 'WARGA'].map((r) => {
                    const isSelected = selectedRoleFilter === r;
                    const count = r === 'all' 
                      ? userList.length 
                      : userList.filter(u => u.role === r).length;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-slate-800 text-white shadow-xs' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{r === 'all' ? 'Semua' : r}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Users Table / Bento List */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6">
                {isLoadingUsers ? (
                  <div className="py-20 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
                    <span>Memuat data pengguna...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-medium">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full text-left border-collapse min-w-[750px] text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-12">No</th>
                          <th className="py-3 px-4">Nama Pengguna</th>
                          <th className="py-3 px-4">Kontak (Email / No. HP)</th>
                          <th className="py-3 px-4">Hak Akses / Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredUsers.map((u, idx) => (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-semibold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[var(--brand-primary)] font-bold flex items-center justify-center shrink-0 text-xs">
                                  {u.nama ? u.nama.slice(0, 2).toUpperCase() : 'US'}
                                </div>
                                <div>
                                  <span className="block font-bold text-slate-800">{u.nama}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    Terdaftar {new Date(u.createdAt).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{u.email}</span>
                                </span>
                                {u.noHp && (
                                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{u.noHp}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] inline-flex items-center gap-1 ${getRoleBadge(u.role)}`}>
                                <ShieldCheck className="w-3 h-3" />
                                <span>{getRoleLabel(u.role)}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {u.statusAktif ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-red-500 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                  <span>Nonaktif</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditUserForm({
                                      nama: u.nama,
                                      email: u.email,
                                      noHp: u.noHp || '',
                                      role: u.role,
                                      statusAktif: u.statusAktif ?? true,
                                      passwordBaru: '',
                                    });
                                    setIsEditUserModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Ubah Data & Role"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setIsDeleteUserModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Backup & Restore Panel */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Identitas Aplikasi Card */}
              {activeTab === 'identitas' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Identitas Aplikasi (Global)</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Ubah nama aplikasi, nama RT/Desa, dan semboyan. Perubahan ini akan langsung berlaku untuk semua pengguna (warga dan pengurus).
                    </p>
                  </div>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingConfig(true);
                    try {
                      const res = await fetch('/api/config', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(appConfig)
                      });
                      if (res.ok) {
                        triggerToast('Identitas aplikasi berhasil diperbarui secara global!', 'success');
                        localStorage.setItem('komuna_app_config', JSON.stringify(appConfig));
                        window.dispatchEvent(new Event('komuna_config_updated'));
                      } else {
                        triggerToast('Gagal memperbarui identitas aplikasi.', 'error');
                      }
                    } catch (err) {
                      triggerToast('Terjadi kesalahan jaringan.', 'error');
                    } finally {
                      setIsSavingConfig(false);
                    }
                  }}
                  className="space-y-4 pt-4 border-t border-slate-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Nama Aplikasi</label>
                      <input
                        type="text"
                        value={appConfig.namaApp}
                        onChange={(e) => setAppConfig({ ...appConfig, namaApp: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                        placeholder="Contoh: komuna.id"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Nama RT / Desa</label>
                      <input
                        type="text"
                        value={appConfig.namaRt}
                        onChange={(e) => setAppConfig({ ...appConfig, namaRt: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                        placeholder="Contoh: RT 01 / Sukamaju"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Semboyan (Tagline)</label>
                    <input
                      type="text"
                      value={appConfig.tagline}
                      onChange={(e) => setAppConfig({ ...appConfig, tagline: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                      placeholder="Contoh: Kebersamaan, Terpadu, Transparan"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Kota / Wilayah Legalitas</label>
                      <input
                        type="text"
                        value={appConfig.kotaWilayah}
                        onChange={(e) => setAppConfig({ ...appConfig, kotaWilayah: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                        placeholder="Contoh: Semarang"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Periode Masa Bakti</label>
                      <input
                        type="text"
                        value={appConfig.periodeAktif}
                        onChange={(e) => setAppConfig({ ...appConfig, periodeAktif: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                        placeholder="Contoh: 2024 - 2029"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Nomor SK Pengurus (Opsional)</label>
                      <input
                        type="text"
                        value={appConfig.nomorSk || ''}
                        onChange={(e) => setAppConfig({ ...appConfig, nomorSk: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all bg-white"
                        placeholder="SK.04/RW.02/2024"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-6 py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs"
                    >
                      {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Simpan Identitas Global</span>
                    </button>
                  </div>
                </form>
              </div>
              )}
              
              {/* TAB 3: CADANGKAN & PULIHKAN DATABASE */}
              {activeTab === 'database' && (
                <>
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
              </>
              )}

              {/* TAB 4: TAMPILAN & TEMA */}
              {activeTab === 'tampilan' && (
                <>
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
              </>
              )}

              {/* TAB 1 (Continued): CACHE & DIAGNOSTICS */}
              {activeTab === 'identitas' && (
                <>
                  {/* Penyimpanan Cache & Pembaruan Sistem Card */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Penyimpanan Cache & Pembaruan Sistem</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                      Bersihkan file statis usang dan paksa aplikasi memuat fitur atau tampilan terbaru dari server Vercel. Sangat berguna jika Anda baru saja memperbarui aplikasi atau tampilan belum ter-update di smartphone/PWA.
                    </p>
                  </div>
                </div>

                {/* Live Diagnostics Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      Kapasitas Cache
                    </span>
                    <span className="text-sm font-bold text-slate-800 block">{cacheSize}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Service Worker
                    </span>
                    <span className="text-sm font-bold text-slate-800 block flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${swStatus.includes('Aktif') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {swStatus}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      Versi PWA
                    </span>
                    <span className="text-sm font-bold text-slate-800 block">v1.2.0 (Live Ready)</span>
                  </div>
                </div>

                {/* Safe Note */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Pembersihan Aman (Anti-Logout):</strong> Tindakan ini hanya menghapus cache file tampilan (HTML, CSS, JS) dan menyinkronkan worker terbaru. <u>Sesi login Anda dan data penting warga tidak akan terhapus</u>.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-medium">
                    Pilih metode pembaruan:
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSoftCheckUpdate}
                      disabled={isCheckingUpdate || isClearingCache}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                      <span>{isCheckingUpdate ? 'Memeriksa...' : 'Cek Pembaruan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowConfirmClearCache(true)}
                      disabled={isClearingCache || isCheckingUpdate}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      {isClearingCache ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>Bersihkan Seluruh Cache & Reload</span>
                    </button>
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
                            <div className="text-[9px] text-slate-400 mt-1 flex flex-col gap-1">
                              <span className="flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" /> Sumber: {log.source}</span>
                              <span className="break-all flex items-center gap-1.5"><ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" /> URL: {log.url}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
              )}

            </div>

            {/* Sidebar Stats Panel */}
            {activeTab === 'database' && (
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
            )}

          </div>
          )}

          {/* MODAL 1: TAMBAH PENGGUNA BARU */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={() => setIsAddUserModalOpen(false)} 
              />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full text-left space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Tambah Akun Pengguna</h3>
                      <p className="text-[11px] text-slate-400">Buat akun akses untuk pengurus RT, petugas ronda, atau warga</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAddUserModalOpen(false)} 
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bpk. Supardi"
                      value={newUserForm.nama}
                      onChange={(e) => setNewUserForm({ ...newUserForm, nama: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Alamat Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="nama@komuna.id"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        placeholder="0812xxxx"
                        value={newUserForm.noHp}
                        onChange={(e) => setNewUserForm({ ...newUserForm, noHp: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Kata Sandi Awal *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Min. 6 karakter"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Role & Hak Akses *</label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="PETUGAS">PETUGAS (Ronda Malam & Jimpitan)</option>
                        <option value="BENDAHARA">BENDAHARA (Kas, Jimpitan & Laporan)</option>
                        <option value="SEKRETARIS">SEKRETARIS (Warga, Surat & Aset)</option>
                        <option value="ADMIN">ADMIN (Administrator RT)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Ketua RT / Full Access)</option>
                        <option value="WARGA">WARGA (Portal Warga Mandiri)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-700 font-medium">
                    Kata sandi ini dapat diubah secara mandiri oleh pengguna melalui menu profil mereka setelah login.
                  </div>

                  <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingUser}
                      className="flex-1 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {isSavingUser ? 'Menyimpan...' : 'Simpan Akun Pengguna'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: UBAH DATA & ROLE PENGGUNA */}
          {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }} 
              />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full text-left space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Ubah Data & Hak Akses</h3>
                      <p className="text-[11px] text-slate-400">Ubah profil, peran hak akses, atau reset kata sandi</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }} 
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={editUserForm.nama}
                      onChange={(e) => setEditUserForm({ ...editUserForm, nama: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Alamat Email *</label>
                      <input
                        type="email"
                        required
                        value={editUserForm.email}
                        onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        placeholder="0812xxxx"
                        value={editUserForm.noHp}
                        onChange={(e) => setEditUserForm({ ...editUserForm, noHp: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Role & Hak Akses</label>
                      <select
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="PETUGAS">PETUGAS (Ronda Malam & Jimpitan)</option>
                        <option value="BENDAHARA">BENDAHARA (Kas, Jimpitan & Laporan)</option>
                        <option value="SEKRETARIS">SEKRETARIS (Warga, Surat & Aset)</option>
                        <option value="ADMIN">ADMIN (Administrator RT)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Ketua RT / Full Access)</option>
                        <option value="WARGA">WARGA (Portal Warga Mandiri)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Status Akun</label>
                      <select
                        value={editUserForm.statusAktif ? 'aktif' : 'nonaktif'}
                        onChange={(e) => setEditUserForm({ ...editUserForm, statusAktif: e.target.value === 'aktif' })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="aktif">Aktif (Dapat Masuk)</option>
                        <option value="nonaktif">Nonaktif (Akses Dikunci)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reset Password Optional */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reset Kata Sandi Baru (Opsional)</span>
                    </label>
                    <input
                      type="password"
                      minLength={6}
                      placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                      value={editUserForm.passwordBaru}
                      onChange={(e) => setEditUserForm({ ...editUserForm, passwordBaru: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                    <span className="text-[10px] text-slate-400">Hanya diisi jika pengguna lupa kata sandi dan meminta bantuan reset.</span>
                  </div>

                  <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingUser}
                      className="flex-1 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {isSavingUser ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: KONFIRMASI HAPUS PENGGUNA */}
          {isDeleteUserModalOpen && userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
                onClick={() => { setIsDeleteUserModalOpen(false); setUserToDelete(null); }} 
              />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Hapus Akun Pengguna?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Apakah Anda yakin ingin menghapus akun <strong>{userToDelete.nama}</strong> ({userToDelete.email})? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsDeleteUserModalOpen(false); setUserToDelete(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingUser}
                    onClick={handleDeleteUser}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    {isSavingUser ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Clear Cache Dialog Modal */}
          {showConfirmClearCache && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">Bersihkan Seluruh Cache Aplikasi?</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Seluruh file statis dan memori lokal lama akan dibersihkan, lalu aplikasi akan otomatis dimuat ulang untuk mengambil pembaruan paling mutakhir dari server. Sesi login Anda tetap aman.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmClearCache(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    disabled={isClearingCache}
                    onClick={handleExecuteClearCache}
                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isClearingCache ? 'Membersihkan...' : 'Ya, Bersihkan & Reload'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 ">
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
