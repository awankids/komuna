'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DonutChart from '@/components/DonutChart';
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
  CheckCircle2
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

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Nominal jimpitan berhasil disimpan!');
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Time based greeting
  const [greeting, setGreeting] = useState('Selamat pagi');

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

  // Fetch all dashboard stats and transactions from the DB
  const fetchData = async () => {
    try {
      const today = new Date();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const yearStr = String(today.getFullYear());

      // Set greeting
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
      const data = await res.json();
      if (data.error || !isMountedRef.current) return;

      setSaldoKas(data.saldoKas);
      setJimpitanBulanIni(data.totalJimpitan);
      setPemasukanBulanIni(data.totalPemasukan);
      setPengeluaranBulanIni(data.totalPengeluaran);
      setSaldoAwal(data.saldoAwal || 0);
      
      // Today's Jimpitan & Schedule
      if (data.todayJimpitan !== null && data.todayJimpitan > 0) {
        setTodayInput(String(data.todayJimpitan));
        setTodaySavedNominal(data.todayJimpitan);
      } else {
        setTodayInput('');
        setTodaySavedNominal(null);
      }

      if (data.todaySchedule) {
        setTodayPetugasName(`${data.todaySchedule.anggota.nama} (${data.todaySchedule.anggota.noRumah})`);
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

      if (data.yesterdaySchedule) {
        setYesterdayPetugasName(`${data.yesterdaySchedule.anggota.nama} (${data.yesterdaySchedule.anggota.noRumah})`);
        setYesterdayJadwalId(data.yesterdaySchedule.id);
      } else {
        setYesterdayPetugasName('Tidak ada petugas ronda terjadwal kemarin');
        setYesterdayJadwalId(null);
      }

      interface RawTx {
        id: string;
        sumber: string;
        keterangan: string;
        kategori?: string;
        jenis: 'pemasukan' | 'pengeluaran';
        tanggal: string;
        nominal: number;
      }

      const mapped = (data.recentTx || []).map((tx: RawTx) => ({
        id: tx.id,
        title: tx.sumber === 'jimpitan' ? tx.keterangan.split(' (')[0] : tx.keterangan,
        subtitle: tx.sumber === 'jimpitan' ? tx.keterangan.match(/\(Oleh: (.*?)\)/)?.[1] || 'Jimpitan' : tx.kategori || 'Lain-lain',
        type: tx.jenis,
        date: new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }),
        amount: tx.nominal,
        formattedAmount: formatRp(tx.nominal),
        rawDate: tx.tanggal,
      }));
      setTransactions(mapped);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, []);

  // Handle saving of today's or yesterday's jimpitan nominal
  const handleSaveNominal = async () => {
    const isTodayTab = jimpitanTab === 'today';
    const inputVal = isTodayTab ? todayInput : yesterdayInput;
    const val = inputVal === '' ? 0 : parseInt(inputVal.replace(/\D/g, ''), 10);
    if (isNaN(val)) return;

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
      if (resData.success) {
        if (isTodayTab) setTodaySavedNominal(val > 0 ? val : null);
        else setYesterdaySavedNominal(val > 0 ? val : null);

        setToastMessage(`Nominal jimpitan (${isTodayTab ? 'Hari Ini' : 'Kemarin'}) berhasil disimpan!`);
        setShowToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);

        // Refresh dashboard data dynamically
        fetchData();
      }
    } catch (e) {
      console.error('Error saving nominal:', e);
    }
  };

  // Keep input only as numbers
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
    return names[monthStr] || 'Juli';
  };

  const donutStats = useMemo(() => {
    const totalRecap = pemasukanBulanIni + pengeluaranBulanIni + saldoAwal;
    const pPct = totalRecap > 0 ? (pemasukanBulanIni / totalRecap) * 100 : 60;
    const ePct = totalRecap > 0 ? (pengeluaranBulanIni / totalRecap) * 100 : 30;
    const sPct = totalRecap > 0 ? (saldoAwal / totalRecap) * 100 : 10;

    const pLength = (pPct / 100) * 314.16;
    const eLength = (ePct / 100) * 314.16;
    const sLength = (sPct / 100) * 314.16;

    const pOffset = 0;
    const eOffset = -pLength;
    const sOffset = -(pLength + eLength);

    return { totalRecap, pPct, ePct, sPct, pLength, eLength, sLength, pOffset, eOffset, sOffset };
  }, [pemasukanBulanIni, pengeluaranBulanIni, saldoAwal]);

  const { pLength, eLength, sLength, pOffset, eOffset, sOffset } = donutStats;

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar activeMenu="Dashboard" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {showToast && (
            <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* Greeting Area */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {greeting}, Admin! <span className="animate-pulse">👋</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Berikut ringkasan keuangan dan aktivitas RT 04
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Card 1: Saldo Kas */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">Saldo Kas</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{formatRp(saldoKas)}</h3>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Saldo saat ini</span>
              </div>
            </div>

            {/* Card 2: Jimpitan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">Jimpitan</span>
                <div className="w-8 h-8 rounded-full bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{formatRp(jimpitanBulanIni)}</h3>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
                  Bulan ini ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} hari)
                </span>
              </div>
            </div>

            {/* Card 3: Pemasukan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">Pemasukan</span>
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{formatRp(pemasukanBulanIni)}</h3>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Bulan ini</span>
              </div>
            </div>

            {/* Card 4: Pengeluaran Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">Pengeluaran</span>
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{formatRp(pengeluaranBulanIni)}</h3>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Bulan ini</span>
              </div>
            </div>

          </div>

          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN: Jimpitan Input & Transactions (8 cols) */}
            <div className="lg:col-span-8 space-y-6 flex flex-col">
              
              {/* Schedule & Jimpitan Input Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                
                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Input Jimpitan</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Catat jimpitan warga dengan cepat</p>
                    </div>
                  </div>

                  {/* Tab Selector integrated */}
                  <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setJimpitanTab('today')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        jimpitanTab === 'today'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span>Hari Ini</span>
                      {todaySavedNominal !== null && todaySavedNominal > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJimpitanTab('yesterday')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        jimpitanTab === 'yesterday'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span>Kemarin</span>
                      {yesterdaySavedNominal === null || yesterdaySavedNominal === 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Area */}
                <div className="p-5 md:p-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--brand-primary)] tracking-widest">
                      {jimpitanTab === 'today' ? 'Jadwal Hari Ini' : 'Jadwal Kemarin'}
                    </span>
                    <h4 className="text-base font-bold text-slate-800">
                      {jimpitanTab === 'today' ? todayDateFormatted : yesterdayDateFormatted}
                    </h4>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <span>Petugas:</span>
                      <span className="font-semibold text-slate-700">
                        {jimpitanTab === 'today' ? todayPetugasName : yesterdayPetugasName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                      <input
                        id="nominal-jimpitan-dashboard"
                        type="text"
                        value={
                          (jimpitanTab === 'today' ? todayInput : yesterdayInput) === '' 
                            ? '' 
                            : parseInt(jimpitanTab === 'today' ? todayInput : yesterdayInput, 10).toLocaleString('id-ID')
                        }
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNominal}
                      className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">Simpan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaksi Terakhir */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col flex-1 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Transaksi Terakhir</h3>
                  <Link href="/kas" className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1 transition-all">
                    <span>Lihat semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {transactions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400 font-medium">
                      Tidak ada transaksi saat ini.
                    </div>
                  ) : (
                    transactions.slice(0, 5).map((tx, idx, arr) => {
                      const isPemasukan = tx.type === 'pemasukan';
                      return (
                        <div key={tx.id} className="group">
                          <div className="py-2.5 px-3 flex items-center justify-between transition-colors hover:bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                isPemasukan 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : 'bg-red-50 text-red-500'
                              }`}>
                                {isPemasukan ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                                  {tx.title}
                                </span>
                                <span className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">
                                  {tx.subtitle}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs md:text-sm font-bold ${
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

            {/* RIGHT COLUMN: Quick Actions & Chart (4 cols) */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              
              {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm transition-shadow hover:shadow-md" id="quick-actions-section">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Aksi Cepat</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/jimpitan" className="bg-slate-50 hover:bg-[var(--brand-primary)]/5 border border-slate-100 hover:border-[var(--brand-primary)]/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-600 group-hover:text-[var(--brand-primary)] shadow-sm flex items-center justify-center transition-colors">
                      <Coins className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-[var(--brand-primary)]">Input Jimpitan</span>
                  </Link>

                  <Link href="/kas" className="bg-slate-50 hover:bg-[var(--brand-primary)]/5 border border-slate-100 hover:border-[var(--brand-primary)]/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-600 group-hover:text-[var(--brand-primary)] shadow-sm flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-[var(--brand-primary)]">Kas Masuk</span>
                  </Link>

                  <Link href="/kas" className="bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-600 group-hover:text-red-500 shadow-sm flex items-center justify-center transition-colors">
                      <Minus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-red-600">Kas Keluar</span>
                  </Link>

                  <Link href="/anggota" className="bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-600 group-hover:text-sky-500 shadow-sm flex items-center justify-center transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-sky-600">Tambah Warga</span>
                  </Link>
                </div>
              </div>

              {/* Monthly Recap (Chart) */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col flex-1 transition-shadow hover:shadow-md">
                <div className="flex flex-col mb-6">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Ringkasan Bulan</h3>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">{getMonthName(String(new Date().getMonth() + 1).padStart(2, '0'))} {new Date().getFullYear()}</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  {/* Donut Chart SVG */}
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                      
                      {/* Pemasukan segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10b981" strokeWidth="12"
                        strokeDasharray={`${pLength} 314.16`} strokeDashoffset={pOffset} className="transition-all duration-500" />

                      {/* Pengeluaran segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#ef4444" strokeWidth="12"
                        strokeDasharray={`${eLength} 314.16`} strokeDashoffset={eOffset} className="transition-all duration-500" />

                      {/* Saldo Awal segment */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12"
                        strokeDasharray={`${sLength} 314.16`} strokeDashoffset={sOffset} className="transition-all duration-500" />
                    </svg>
                    
                    {/* Inside Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Saldo</span>
                      <span className="text-[10px] font-black text-slate-800 mt-0.5">{formatRp(saldoKas)}</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-3 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span className="text-slate-500 font-medium">Pemasukan</span>
                      </div>
                      <span className="font-bold text-slate-700">{formatRp(pemasukanBulanIni)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                        <span className="text-slate-500 font-medium">Pengeluaran</span>
                      </div>
                      <span className="font-bold text-slate-700">{formatRp(pengeluaranBulanIni)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                        <span className="text-slate-500 font-medium">Saldo Awal</span>
                      </div>
                      <span className="font-bold text-slate-700">{formatRp(saldoAwal)}</span>
                    </div>
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
