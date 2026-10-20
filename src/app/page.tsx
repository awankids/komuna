'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Wallet, 
  Coins, 
  ArrowDown, 
  ArrowUp, 
  Calendar,
  Save,
  ArrowRight,
  Plus,
  Minus,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  type: 'pemasukan' | 'pengeluaran';
  date: string;
  amount: number;
  formattedAmount: string;
  rawDate: string;
  category: string;
}

const DASHBOARD_CACHE_KEY = 'komuna_dashboard_summary_cache';

interface DashboardCacheSnapshot {
  monthYearKey: string;
  saldoKas: number;
  jimpitanBulanIni: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
  saldoAwal: number;
  todayInput: string;
  todaySavedNominal: number | null;
  todayPetugasName: string;
  todayJadwalId: string | null;
  yesterdayInput: string;
  yesterdaySavedNominal: number | null;
  yesterdayPetugasName: string;
  yesterdayJadwalId: string | null;
  transactions: Transaction[];
  cachedAt: number;
}

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Base states loading dynamically from the API
  const [saldoKas, setSaldoKas] = useState<number>(0);
  const [jimpitanBulanIni, setJimpitanBulanIni] = useState<number>(0);
  const [pemasukanBulanIni, setPemasukanBulanIni] = useState<number>(0);
  const [pengeluaranBulanIni, setPengeluaranBulanIni] = useState<number>(0);
  const [saldoAwal, setSaldoAwal] = useState<number>(0);

  // Jimpitan input & schedule state (Today & Yesterday)
  const [jimpitanTab, setJimpitanTab] = useState<'today' | 'yesterday'>('today');

  const [todayInput, setTodayInput] = useState<string>('');
  const [todaySavedNominal, setTodaySavedNominal] = useState<number | null>(null);
  const [todayPetugasName, setTodayPetugasName] = useState<string>('Memuat...');
  const [todayJadwalId, setTodayJadwalId] = useState<string | null>(null);
  const [todayDateFormatted, setTodayDateFormatted] = useState<string>('');

  const [yesterdayInput, setYesterdayInput] = useState<string>('');
  const [yesterdaySavedNominal, setYesterdaySavedNominal] = useState<number | null>(null);
  const [yesterdayPetugasName, setYesterdayPetugasName] = useState<string>('Memuat...');
  const [yesterdayJadwalId, setYesterdayJadwalId] = useState<string | null>(null);
  const [yesterdayDateFormatted, setYesterdayDateFormatted] = useState<string>('');

  // Form submission and toast states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Time based greeting - computed immediately to avoid flash
  const [greeting, setGreeting] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  });

  // App Configuration
  const [appConfig, setAppConfig] = useState<{ namaApp?: string; namaRt?: string }>({
    namaApp: 'komuna.id',
    namaRt: '',
  });

  const fetchAppConfig = async () => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('komuna_app_config');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.namaRt) setAppConfig(parsed);
      } catch (e) {}
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

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Format currency helper
  const formatRp = (num: number) => {
    const absVal = Math.abs(num);
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absVal).replace('IDR', 'Rp').trim();
    
    return num < 0 ? `-${formatted}` : formatted;
  };

  const isMountedRef = useRef(true);

  // Trigger toast helper
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch all dashboard stats and transactions from the DB
  const fetchData = async () => {
    try {
      const today = new Date();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const yearStr = String(today.getFullYear());

      // Update greeting accurately
      const hour = today.getHours();
      if (hour < 11) setGreeting('Selamat pagi');
      else if (hour < 15) setGreeting('Selamat siang');
      else if (hour < 19) setGreeting('Selamat sore');
      else setGreeting('Selamat malam');

      // Set formatted date for today and yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      if (isMountedRef.current) {
        setTodayDateFormatted(today.toLocaleDateString('id-ID', options));
        setYesterdayDateFormatted(yesterday.toLocaleDateString('id-ID', options));
      }

      const res = await fetch(`/api/jimpitan?month=${monthStr}&year=${yearStr}`);
      if (!res.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const data = await res.json();
      if (data.error || !isMountedRef.current) return;

      setSaldoKas(data.saldoKas || 0);
      setJimpitanBulanIni(data.totalJimpitan || 0);
      setPemasukanBulanIni(data.totalPemasukan || 0);
      setPengeluaranBulanIni(data.totalPengeluaran || 0);
      setSaldoAwal(data.saldoAwal || 0);
      
      // Today's Jimpitan & Schedule
      if (data.todayJimpitan !== null && data.todayJimpitan > 0) {
        setTodayInput(String(data.todayJimpitan));
        setTodaySavedNominal(data.todayJimpitan);
      } else {
        setTodayInput('');
        setTodaySavedNominal(null);
      }

      if (data.todaySchedule?.anggota) {
        setTodayPetugasName(`${data.todaySchedule.anggota.nama} (${data.todaySchedule.anggota.noRumah || '-'})`);
        setTodayJadwalId(data.todaySchedule.id);
      } else {
        setTodayPetugasName('Tidak ada petugas ronda terjadwal hari ini');
        setTodayJadwalId(null);
      }

      // Yesterday's Jimpitan & Schedule
      if (data.yesterdayJimpitan !== null && data.yesterdayJimpitan > 0) {
        setYesterdayInput(String(data.yesterdayJimpitan));
        setYesterdaySavedNominal(data.yesterdayJimpitan);
      } else {
        setYesterdayInput('');
        setYesterdaySavedNominal(null);
      }

      if (data.yesterdaySchedule?.anggota) {
        setYesterdayPetugasName(`${data.yesterdaySchedule.anggota.nama} (${data.yesterdaySchedule.anggota.noRumah || '-'})`);
        setYesterdayJadwalId(data.yesterdaySchedule.id);
      } else {
        setYesterdayPetugasName('Tidak ada petugas ronda terjadwal kemarin');
        setYesterdayJadwalId(null);
      }

      interface RawTx {
        id: string;
        sumber: string;
        keterangan?: string | null;
        kategori?: string | null;
        jenis: 'pemasukan' | 'pengeluaran';
        tanggal: string;
        nominal: number;
      }

      const mapped: Transaction[] = (data.recentTx || []).map((tx: RawTx) => {
        const rawKet = tx.keterangan || '';
        const title = tx.sumber === 'jimpitan' ? rawKet.split(' (')[0] || 'Jimpitan Ronda' : (rawKet || 'Transaksi');
        const subtitle = tx.sumber === 'jimpitan' 
          ? (rawKet.match(/\(Oleh: (.*?)\)/)?.[1] || 'Jimpitan Warga') 
          : (tx.kategori || 'Kas RT');
        const category = tx.sumber === 'jimpitan' ? 'Jimpitan' : (tx.kategori || 'Umum');

        return {
          id: tx.id,
          title,
          subtitle,
          category,
          type: tx.jenis,
          date: new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          amount: tx.nominal,
          formattedAmount: formatRp(tx.nominal),
          rawDate: tx.tanggal,
        };
      });

      setTransactions(mapped);

      // Save fresh snapshot to cache for instant loading on subsequent PWA launches
      try {
        const snapshot: DashboardCacheSnapshot = {
          monthYearKey: `${yearStr}-${monthStr}`,
          saldoKas: data.saldoKas || 0,
          jimpitanBulanIni: data.totalJimpitan || 0,
          pemasukanBulanIni: data.totalPemasukan || 0,
          pengeluaranBulanIni: data.totalPengeluaran || 0,
          saldoAwal: data.saldoAwal || 0,
          todayInput: data.todayJimpitan !== null && data.todayJimpitan > 0 ? String(data.todayJimpitan) : '',
          todaySavedNominal: data.todayJimpitan,
          todayPetugasName: data.todaySchedule?.anggota
            ? `${data.todaySchedule.anggota.nama} (${data.todaySchedule.anggota.noRumah || '-'})`
            : 'Tidak ada petugas ronda terjadwal hari ini',
          todayJadwalId: data.todaySchedule?.id || null,
          yesterdayInput: data.yesterdayJimpitan !== null && data.yesterdayJimpitan > 0 ? String(data.yesterdayJimpitan) : '',
          yesterdaySavedNominal: data.yesterdayJimpitan,
          yesterdayPetugasName: data.yesterdaySchedule?.anggota
            ? `${data.yesterdaySchedule.anggota.nama} (${data.yesterdaySchedule.anggota.noRumah || '-'})`
            : 'Tidak ada petugas ronda terjadwal kemarin',
          yesterdayJadwalId: data.yesterdaySchedule?.id || null,
          transactions: mapped,
          cachedAt: Date.now(),
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(snapshot));
      } catch (err) {
        // Silent catch for quota limits
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Instant Cache Hydration: Render local dashboard snapshot immediately (0ms first paint)
    try {
      const cachedStr = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (cachedStr) {
        const cached: DashboardCacheSnapshot = JSON.parse(cachedStr);
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // Only hydrate if cached snapshot matches current month/year
        if (cached && cached.monthYearKey === currentKey) {
          setSaldoKas(cached.saldoKas || 0);
          setJimpitanBulanIni(cached.jimpitanBulanIni || 0);
          setPemasukanBulanIni(cached.pemasukanBulanIni || 0);
          setPengeluaranBulanIni(cached.pengeluaranBulanIni || 0);
          setSaldoAwal(cached.saldoAwal || 0);
          if (cached.todayPetugasName) setTodayPetugasName(cached.todayPetugasName);
          if (cached.todayJadwalId !== undefined) setTodayJadwalId(cached.todayJadwalId);
          if (cached.todayInput !== undefined) setTodayInput(cached.todayInput);
          if (cached.todaySavedNominal !== undefined) setTodaySavedNominal(cached.todaySavedNominal);
          if (cached.yesterdayPetugasName) setYesterdayPetugasName(cached.yesterdayPetugasName);
          if (cached.yesterdayJadwalId !== undefined) setYesterdayJadwalId(cached.yesterdayJadwalId);
          if (cached.yesterdayInput !== undefined) setYesterdayInput(cached.yesterdayInput);
          if (cached.yesterdaySavedNominal !== undefined) setYesterdaySavedNominal(cached.yesterdaySavedNominal);
          if (Array.isArray(cached.transactions) && cached.transactions.length > 0) {
            setTransactions(cached.transactions);
          }
        }
      }
    } catch (e) {
      // Graceful fallback
    }

    // 2. Background Revalidation: Fetch fresh data and sync in background
    fetchData();
    fetchAppConfig();

    // Check for unauthorized redirect flag from RBAC guard
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('unauthorized') === '1') {
        triggerToast('Akses dibatasi: Anda tidak memiliki izin peran untuk halaman tersebut.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    window.addEventListener('komuna_config_updated', fetchAppConfig);
    return () => { 
      isMountedRef.current = false; 
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      window.removeEventListener('komuna_config_updated', fetchAppConfig);
    };
  }, []);

  // Handle saving of today's or yesterday's jimpitan nominal with debounce & lock
  const handleSaveNominal = async () => {
    if (isSaving) return;

    const isTodayTab = jimpitanTab === 'today';
    const inputVal = isTodayTab ? todayInput : yesterdayInput;
    const val = inputVal === '' ? 0 : parseInt(inputVal.replace(/\D/g, ''), 10);
    if (isNaN(val)) return;

    setIsSaving(true);
    try {
      const targetDate = new Date();
      if (!isTodayTab) {
        targetDate.setDate(targetDate.getDate() - 1);
      }

      const localY = targetDate.getFullYear();
      const localM = String(targetDate.getMonth() + 1).padStart(2, '0');
      const localD = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${localY}-${localM}-${localD}`;

      const targetJadwalId = isTodayTab ? todayJadwalId : yesterdayJadwalId;

      const res = await fetch('/api/jimpitan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: `${dateStr}T00:00:00Z`,
          nominal: val,
          jadwalId: targetJadwalId,
          diisiOleh: 'Admin RT',
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        if (isTodayTab) setTodaySavedNominal(val > 0 ? val : null);
        else setYesterdaySavedNominal(val > 0 ? val : null);

        triggerToast(`Nominal jimpitan (${isTodayTab ? 'Hari Ini' : 'Kemarin'}) berhasil disimpan!`, 'success');

        // Refresh dashboard data dynamically
        fetchData();
      } else {
        triggerToast(resData.error || 'Gagal menyimpan nominal jimpitan', 'error');
      }
    } catch (e) {
      console.error('Error saving nominal:', e);
      triggerToast('Terjadi kesalahan jaringan saat menyimpan data', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keep input only as clean numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '');
    if (jimpitanTab === 'today') {
      setTodayInput(cleanValue);
    } else {
      setYesterdayInput(cleanValue);
    }
  };

  const getMonthName = (monthStr: string) => {
    const names: { [key: string]: string } = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return names[monthStr] || 'Oktober';
  };

  // Memoized Donut Chart Metrics
  const donutStats = useMemo(() => {
    const totalRecap = pemasukanBulanIni + pengeluaranBulanIni + saldoAwal;
    const pPct = totalRecap > 0 ? (pemasukanBulanIni / totalRecap) * 100 : 0;
    const ePct = totalRecap > 0 ? (pengeluaranBulanIni / totalRecap) * 100 : 0;
    const sPct = totalRecap > 0 ? (saldoAwal / totalRecap) * 100 : 0;

    const circumference = 314.16; // 2 * PI * 50
    const pLength = (pPct / 100) * circumference;
    const eLength = (ePct / 100) * circumference;
    const sLength = (sPct / 100) * circumference;

    const pOffset = 0;
    const eOffset = -pLength;
    const sOffset = -(pLength + eLength);

    const netCashFlow = pemasukanBulanIni - pengeluaranBulanIni;

    return { 
      totalRecap, 
      pPct: Math.round(pPct), 
      ePct: Math.round(ePct), 
      sPct: Math.round(sPct), 
      pLength, 
      eLength, 
      sLength, 
      pOffset, 
      eOffset, 
      sOffset,
      netCashFlow
    };
  }, [pemasukanBulanIni, pengeluaranBulanIni, saldoAwal]);

  const { pLength, eLength, sLength, pOffset, eOffset, sOffset, pPct, ePct, sPct, netCashFlow } = donutStats;

  const currentTabSavedNominal = jimpitanTab === 'today' ? todaySavedNominal : yesterdaySavedNominal;
  const currentTabInputValue = jimpitanTab === 'today' ? todayInput : yesterdayInput;

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar activeMenu="Dashboard" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden min-w-0">
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dashboard Work Area: Fluid, responsive up to 1920px desktop */}
        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {showToast && (
            <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 text-white ${
              toastType === 'success' ? 'bg-slate-900 border border-slate-800' : 'bg-red-600'
            }`}>
              {toastType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white shrink-0" />
              )}
              <span className="text-xs font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* Top Greeting & Operational Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                {greeting}, Admin! <Sparkles className="w-5 h-5 text-amber-500 shrink-0 inline" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Berikut ringkasan keuangan dan aktivitas operasional {appConfig.namaRt || 'RT'}
              </p>
            </div>
            
            {/* Live Date Badge on Desktop */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-2xs text-xs font-semibold text-slate-600 self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>{todayDateFormatted || 'Memuat tanggal...'}</span>
            </div>
          </div>

          {/* 4-Column Statistics Grid: Balanced and Proportional on 24" Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 xl:gap-6">
            
            {/* Card 1: Saldo Kas */}
            <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-auto min-h-[140px] xl:min-h-[148px] relative overflow-hidden group transition-all hover:shadow-md hover:border-slate-300">
              <div className="flex justify-between items-start">
                <span className="text-xs xl:text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Kas</span>
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl xl:text-[26px] font-extrabold text-slate-800 tracking-tight leading-tight">
                  {formatRp(saldoKas)}
                </h3>
                <span className="text-[11px] xl:text-xs font-medium text-slate-400 mt-1 block">Saldo kas berjalan</span>
              </div>
            </div>

            {/* Card 2: Jimpitan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-auto min-h-[140px] xl:min-h-[148px] relative overflow-hidden group transition-all hover:shadow-md hover:border-slate-300">
              <div className="flex justify-between items-start">
                <span className="text-xs xl:text-sm font-bold text-slate-500 uppercase tracking-wider">Jimpitan</span>
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl xl:text-[26px] font-extrabold text-slate-800 tracking-tight leading-tight">
                  {formatRp(jimpitanBulanIni)}
                </h3>
                <span className="text-[11px] xl:text-xs font-medium text-slate-400 mt-1 block">
                  Bulan ini ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} hari)
                </span>
              </div>
            </div>

            {/* Card 3: Pemasukan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-auto min-h-[140px] xl:min-h-[148px] relative overflow-hidden group transition-all hover:shadow-md hover:border-slate-300">
              <div className="flex justify-between items-start">
                <span className="text-xs xl:text-sm font-bold text-slate-500 uppercase tracking-wider">Pemasukan</span>
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                  <ArrowDown className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl xl:text-[26px] font-extrabold text-slate-800 tracking-tight leading-tight">
                  {formatRp(pemasukanBulanIni)}
                </h3>
                <span className="text-[11px] xl:text-xs font-medium text-slate-400 mt-1 block">Total masuk bulan ini</span>
              </div>
            </div>

            {/* Card 4: Pengeluaran Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between h-auto min-h-[140px] xl:min-h-[148px] relative overflow-hidden group transition-all hover:shadow-md hover:border-slate-300">
              <div className="flex justify-between items-start">
                <span className="text-xs xl:text-sm font-bold text-slate-500 uppercase tracking-wider">Pengeluaran</span>
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <ArrowUp className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl xl:text-[26px] font-extrabold text-slate-800 tracking-tight leading-tight">
                  {formatRp(pengeluaranBulanIni)}
                </h3>
                <span className="text-[11px] xl:text-xs font-medium text-slate-400 mt-1 block">Total keluar bulan ini</span>
              </div>
            </div>

          </div>

          {/* Adaptive Bento Grid: 8 Columns Main Workspace + 4 Columns Supporting Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-7 items-start">

            {/* LEFT COLUMN: Main Work Area (lg:col-span-8, 66.7% width) */}
            <div className="lg:col-span-8 space-y-6 flex flex-col min-w-0">
              
              {/* Schedule & Jimpitan Quick Input Panel */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col transition-all hover:shadow-md">
                
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 xl:p-6 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                      <Calendar className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-sm xl:text-base font-bold text-slate-800">Input Jimpitan Cepat</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Catat setoran jimpitan ronda warga harian</p>
                    </div>
                  </div>

                  {/* Day Tab Selector with Status Dot */}
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setJimpitanTab('today')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        jimpitanTab === 'today'
                          ? 'bg-white text-slate-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Hari Ini</span>
                      {todaySavedNominal !== null && todaySavedNominal > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sudah dicatat" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Belum dicatat" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJimpitanTab('yesterday')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        jimpitanTab === 'yesterday'
                          ? 'bg-white text-slate-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Kemarin</span>
                      {yesterdaySavedNominal !== null && yesterdaySavedNominal > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sudah dicatat" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Belum dicatat" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Form & Info Section */}
                <div className="p-5 xl:p-6 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Schedule Details & Status */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-[var(--brand-primary)] tracking-widest">
                        {jimpitanTab === 'today' ? 'Jadwal Hari Ini' : 'Jadwal Kemarin'}
                      </span>
                      {currentTabSavedNominal !== null && currentTabSavedNominal > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100/80 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sudah Disimpan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/80 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Belum Disimpan
                        </span>
                      )}
                    </div>
                    <h4 className="text-base xl:text-lg font-bold text-slate-800 truncate">
                      {jimpitanTab === 'today' ? todayDateFormatted : yesterdayDateFormatted}
                    </h4>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>Petugas Ronda:</span>
                      <span className="font-bold text-slate-700 truncate">
                        {jimpitanTab === 'today' ? todayPetugasName : yesterdayPetugasName}
                      </span>
                    </div>
                  </div>

                  {/* Input and Action */}
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <div className="relative w-full sm:w-48 xl:w-56">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input
                        id="nominal-jimpitan-dashboard"
                        type="text"
                        value={
                          currentTabInputValue === '' 
                            ? '' 
                            : parseInt(currentTabInputValue, 10).toLocaleString('id-ID')
                        }
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveNominal}
                      className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaksi Terakhir (Structured Operational Ledger) */}
              <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col flex-1 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm xl:text-base font-bold text-slate-800 tracking-tight">Transaksi Terakhir</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      5 Terkini
                    </span>
                  </div>
                  <Link 
                    href="/kas" 
                    className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 transition-all py-1 px-2 rounded-lg hover:bg-[var(--brand-light)]"
                  >
                    <span>Buka Semua Kas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Desktop Ledger Table Header */}
                <div className="hidden md:grid grid-cols-12 px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/60 rounded-xl mb-1">
                  <div className="col-span-6">Transaksi & Keterangan</div>
                  <div className="col-span-2 text-center">Kategori</div>
                  <div className="col-span-2 text-center">Tanggal</div>
                  <div className="col-span-2 text-right">Nominal</div>
                </div>

                {/* Ledger Rows */}
                <div className="space-y-1">
                  {transactions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400 font-medium">
                      Belum ada catatan transaksi pada kas RT.
                    </div>
                  ) : (
                    transactions.slice(0, 5).map((tx, idx, arr) => {
                      const isPemasukan = tx.type === 'pemasukan';
                      return (
                        <div key={tx.id} className="group">
                          {/* Desktop Grid Layout (md and up) */}
                          <div className="hidden md:grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50/80 rounded-2xl transition-colors">
                            {/* Col 1-6: Icon & Title/Subtitle */}
                            <div className="col-span-6 flex items-center gap-3.5 min-w-0 pr-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isPemasukan 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : 'bg-red-50 text-red-500'
                              }`}>
                                {isPemasukan ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="text-sm font-bold text-slate-800 truncate">
                                  {tx.title}
                                </span>
                                <span className="text-xs text-slate-400 font-medium truncate mt-0.5">
                                  {tx.subtitle}
                                </span>
                              </div>
                            </div>

                            {/* Col 7-8: Kategori Badge */}
                            <div className="col-span-2 flex justify-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 truncate max-w-[120px]">
                                {tx.category}
                              </span>
                            </div>

                            {/* Col 9-10: Tanggal */}
                            <div className="col-span-2 text-center text-xs font-medium text-slate-500">
                              {tx.date}
                            </div>

                            {/* Col 11-12: Nominal */}
                            <div className="col-span-2 text-right">
                              <span className={`text-sm font-extrabold tracking-tight ${
                                isPemasukan ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {isPemasukan ? `+${formatRp(tx.amount)}` : formatRp(tx.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Mobile Layout (< md) */}
                          <div className="md:hidden py-2.5 px-3 flex items-center justify-between transition-colors hover:bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPemasukan 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : 'bg-red-50 text-red-500'
                              }`}>
                                {isPemasukan ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                              </div>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {tx.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  {tx.subtitle}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className={`text-xs font-bold ${
                                isPemasukan ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {isPemasukan ? `+${formatRp(tx.amount)}` : formatRp(tx.amount)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {tx.date}
                              </span>
                            </div>
                          </div>

                          {idx < arr.length - 1 && (
                            <div className="h-px bg-slate-100 my-0.5 mx-2" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Supporting Panels (lg:col-span-4, 33.3% width) */}
            <div className="lg:col-span-4 space-y-6 flex flex-col min-w-0">
              
              {/* Quick Actions Panel */}
              <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs transition-all hover:shadow-md" id="quick-actions-section">
                <h3 className="text-sm xl:text-base font-bold text-slate-800 tracking-tight mb-4">Aksi Cepat</h3>
                
                <div className="grid grid-cols-2 gap-3 xl:gap-4">
                  <Link 
                    href="/jimpitan" 
                    className="bg-slate-50/80 hover:bg-[var(--brand-primary)]/5 border border-slate-100 hover:border-[var(--brand-primary)]/20 rounded-2xl p-4 xl:p-5 flex flex-col items-center justify-center gap-2.5 text-center transition-all group"
                  >
                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-white text-slate-600 group-hover:text-[var(--brand-primary)] shadow-2xs flex items-center justify-center transition-all group-hover:scale-105">
                      <Coins className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[var(--brand-primary)]">Input Jimpitan</span>
                  </Link>

                  <Link 
                    href="/kas" 
                    className="bg-slate-50/80 hover:bg-[var(--brand-primary)]/5 border border-slate-100 hover:border-[var(--brand-primary)]/20 rounded-2xl p-4 xl:p-5 flex flex-col items-center justify-center gap-2.5 text-center transition-all group"
                  >
                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-white text-slate-600 group-hover:text-[var(--brand-primary)] shadow-2xs flex items-center justify-center transition-all group-hover:scale-105">
                      <Plus className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[var(--brand-primary)]">Kas Masuk</span>
                  </Link>

                  <Link 
                    href="/kas" 
                    className="bg-slate-50/80 hover:bg-red-50/50 border border-slate-100 hover:border-red-200 rounded-2xl p-4 xl:p-5 flex flex-col items-center justify-center gap-2.5 text-center transition-all group"
                  >
                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-white text-slate-600 group-hover:text-red-500 shadow-2xs flex items-center justify-center transition-all group-hover:scale-105">
                      <Minus className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-red-600">Kas Keluar</span>
                  </Link>

                  <Link 
                    href="/anggota" 
                    className="bg-slate-50/80 hover:bg-sky-50/50 border border-slate-100 hover:border-sky-200 rounded-2xl p-4 xl:p-5 flex flex-col items-center justify-center gap-2.5 text-center transition-all group"
                  >
                    <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-white text-slate-600 group-hover:text-sky-500 shadow-2xs flex items-center justify-center transition-all group-hover:scale-105">
                      <Users className="w-5 h-5 xl:w-5.5 xl:h-5.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-sky-600">Data Warga</span>
                  </Link>
                </div>
              </div>

              {/* Monthly Financial Recap & Donut Visualization */}
              <div className="bg-white rounded-3xl p-5 xl:p-6 border border-slate-200/90 shadow-2xs flex flex-col flex-1 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm xl:text-base font-bold text-slate-800 tracking-tight">Ringkasan Bulan</h3>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      {getMonthName(String(new Date().getMonth() + 1).padStart(2, '0'))} {new Date().getFullYear()}
                    </p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Data Kas Aktif" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-5 py-2">
                  {/* Scaled & Legible Donut Chart */}
                  <div className="relative w-40 h-40 xl:w-44 xl:h-44">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="13" />
                      
                      {/* Pemasukan segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10b981" strokeWidth="13"
                        strokeDasharray={`${pLength} 314.16`} strokeDashoffset={pOffset} className="transition-all duration-500" />

                      {/* Pengeluaran segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#ef4444" strokeWidth="13"
                        strokeDasharray={`${eLength} 314.16`} strokeDashoffset={eOffset} className="transition-all duration-500" />

                      {/* Saldo Awal segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#cbd5e1" strokeWidth="13"
                        strokeDasharray={`${sLength} 314.16`} strokeDashoffset={sOffset} className="transition-all duration-500" />
                    </svg>
                    
                    {/* Centered Total Saldo Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                      <span className="text-[10px] xl:text-[11px] text-slate-400 font-bold uppercase tracking-wider">Saldo Kas</span>
                      <span className="text-base xl:text-lg font-black text-slate-800 mt-0.5 tracking-tight">
                        {formatRp(saldoKas)}
                      </span>
                    </div>
                  </div>

                  {/* Clear Legend with Exact Percentages */}
                  <div className="w-full space-y-2.5 mt-1">
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shrink-0" />
                        <span className="text-slate-600 font-semibold">Pemasukan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {pPct}%
                        </span>
                        <span className="font-bold text-slate-800">{formatRp(pemasukanBulanIni)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-md bg-red-500 shrink-0" />
                        <span className="text-slate-600 font-semibold">Pengeluaran</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {ePct}%
                        </span>
                        <span className="font-bold text-slate-800">{formatRp(pengeluaranBulanIni)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-md bg-slate-300 shrink-0" />
                        <span className="text-slate-600 font-semibold">Saldo Awal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {sPct}%
                        </span>
                        <span className="font-bold text-slate-800">{formatRp(saldoAwal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Cash Flow Summary Box */}
                  <div className={`w-full mt-2 p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                    netCashFlow >= 0 
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800' 
                      : 'bg-red-50/70 border-red-200/80 text-red-800'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {netCashFlow >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span>Arus Kas Bulan Ini</span>
                    </div>
                    <span className="font-extrabold">
                      {netCashFlow >= 0 ? `+${formatRp(netCashFlow)}` : formatRp(netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>

        {/* Mobile Navigation Bar */}
        <MobileNavBar onQuickActionClick={() => {
          const section = document.getElementById('quick-actions-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }} />
      </div>
    </div>
  );
}
