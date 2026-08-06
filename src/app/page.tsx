'use client';

import React, { useState, useEffect } from 'react';
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
      setTodayDateFormatted(today.toLocaleDateString('id-ID', options));
      setYesterdayDateFormatted(yesterday.toLocaleDateString('id-ID', options));

      const res = await fetch(`/api/jimpitan?month=${monthStr}&year=${yearStr}`);
      const data = await res.json();
      if (data.error) return;

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

      const mapped = data.recentTx.map((tx: any) => ({
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
    fetchData();
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
        setTimeout(() => setShowToast(false), 3000);

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
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar md:grid md:grid-cols-4 md:gap-6 md:pb-0 md:mx-0 md:px-0">
            
            {/* Card 1: Saldo Kas */}
            <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-40 md:h-44 text-center snap-start shrink-0 w-[160px] sm:w-[190px] md:w-auto md:shrink select-none">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Saldo Kas</span>
              <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">{formatRp(saldoKas)}</h3>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner mt-1">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-1">Saldo saat ini</span>
            </div>

            {/* Card 2: Jimpitan Bulan Ini */}
            <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-40 md:h-44 text-center snap-start shrink-0 w-[160px] sm:w-[190px] md:w-auto md:shrink select-none">
              <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-wider">Jimpitan Bulan Ini</span>
              <h3 className="text-sm md:text-base font-bold text-[var(--brand-primary)] tracking-tight">{formatRp(jimpitanBulanIni)}</h3>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shadow-inner mt-1">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-1">
                Total {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} hari
              </span>
            </div>

            {/* Card 3: Pemasukan Bulan Ini */}
            <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-40 md:h-44 text-center snap-start shrink-0 w-[160px] sm:w-[190px] md:w-auto md:shrink select-none">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Pemasukan Bulan Ini</span>
              <h3 className="text-sm md:text-base font-bold text-sky-600 tracking-tight">{formatRp(pemasukanBulanIni)}</h3>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shadow-inner mt-1">
                <ArrowDown className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-1">Total pemasukan</span>
            </div>

            {/* Card 4: Pengeluaran Bulan Ini */}
            <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-40 md:h-44 text-center snap-start shrink-0 w-[160px] sm:w-[190px] md:w-auto md:shrink select-none">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Pengeluaran Bulan Ini</span>
              <h3 className="text-sm md:text-base font-bold text-red-500 tracking-tight">{formatRp(pengeluaranBulanIni)}</h3>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner mt-1">
                <ArrowUp className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-1">Total pengeluaran</span>
            </div>

          </div>

          {/* Schedule & Jimpitan Input Panel (Hari Ini & Kemarin) */}
          <div className="space-y-3">
            {/* Tab Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setJimpitanTab('today')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  jimpitanTab === 'today'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80'
                }`}
              >
                <span>📅 HARI INI</span>
                {todaySavedNominal !== null && todaySavedNominal > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setJimpitanTab('yesterday')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  jimpitanTab === 'yesterday'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80'
                }`}
              >
                <span>⏪ KEMARIN</span>
                {yesterdaySavedNominal === null || yesterdaySavedNominal === 0 ? (
                  <span className="px-1.5 py-0.5 text-[8px] bg-amber-100 text-amber-800 rounded font-extrabold uppercase">Belum Diisi</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </div>

            {/* Input Card Container */}
            <div className="bg-[var(--brand-light)] border border-[var(--brand-primary)]/20 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
              
              {/* Left side: Calendar details */}
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex flex-col items-center justify-center text-[var(--brand-primary)] shrink-0">
                  <Calendar className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] md:text-xs font-bold uppercase text-[var(--brand-primary)] tracking-widest leading-none">
                      {jimpitanTab === 'today' ? 'Hari Ini' : 'Kemarin'}
                    </span>
                    {jimpitanTab === 'yesterday' && (yesterdaySavedNominal === null || yesterdaySavedNominal === 0) && (
                      <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Perlu Diisi
                      </span>
                    )}
                  </div>
                  <h4 className="text-md md:text-lg font-bold text-slate-800 tracking-tight">
                    {jimpitanTab === 'today' ? todayDateFormatted : yesterdayDateFormatted}
                  </h4>
                  <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-1 mt-0.5">
                    <span className="text-slate-400 font-medium">Petugas Jimpitan:</span>
                    <span className="text-slate-700 font-bold">
                      {jimpitanTab === 'today' ? todayPetugasName : yesterdayPetugasName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Input nominal */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md w-full lg:justify-end">
                <div className="flex flex-col w-full sm:w-60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 self-start">
                    Nominal Jimpitan {jimpitanTab === 'today' ? 'Hari Ini' : 'Kemarin'}
                  </span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">Rp</span>
                    <input
                      type="text"
                      value={
                        (jimpitanTab === 'today' ? todayInput : yesterdayInput) === '' 
                          ? '' 
                          : parseInt(jimpitanTab === 'today' ? todayInput : yesterdayInput, 10).toLocaleString('id-ID')
                      }
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-lg font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25 focus:border-[var(--brand-primary)] transition-all"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveNominal}
                  className="sm:mt-5 px-6 py-3.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/25"
                >
                  <Save className="w-5 h-5" />
                  <span>Simpan Nominal</span>
                </button>
              </div>

            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-4" id="quick-actions-section">
            <h3 className="text-xs font-bold text-slate-450 tracking-wider uppercase text-left">Aksi Cepat</h3>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x no-scrollbar md:grid md:grid-cols-5 md:gap-4 md:pb-0 md:mx-0 md:px-0">
              
              {/* Action 1: Input Jimpitan */}
              <Link href="/jimpitan" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer select-none snap-start shrink-0 w-[100px] sm:w-[130px] md:w-auto md:shrink">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md shadow-emerald-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-750 leading-tight">Input Jimpitan</span>
              </Link>

              {/* Action 2: Tambah Pemasukan */}
              <Link href="/kas" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer select-none snap-start shrink-0 w-[100px] sm:w-[130px] md:w-auto md:shrink">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-755 leading-tight">Tambah Pemasukan</span>
              </Link>

              {/* Action 3: Tambah Pengeluaran */}
              <Link href="/kas" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer select-none snap-start shrink-0 w-[100px] sm:w-[130px] md:w-auto md:shrink">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md shadow-red-500/20">
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-700 leading-tight">Tambah Pengeluaran</span>
              </Link>

              {/* Action 4: Tambah Anggota */}
              <Link href="/anggota" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer select-none snap-start shrink-0 w-[100px] sm:w-[130px] md:w-auto md:shrink">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md shadow-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-700 leading-tight">Tambah Anggota</span>
              </Link>

              {/* Action 5: Lihat Jadwal */}
              <Link href="/jadwal" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer select-none snap-start shrink-0 w-[100px] sm:w-[130px] md:w-auto md:shrink">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md shadow-purple-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-slate-700 leading-tight">Lihat Jadwal</span>
              </Link>

            </div>
          </div>

          {/* Bottom Sections: Transactions & Monthly Recap */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            
            {/* Left Part: Last Transactions list (spans 2 columns on desktop) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 border border-slate-100/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Transaksi Terakhir</h3>
                <Link href="/kas" className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1 transition-all">
                  <span>Lihat semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400 font-medium">
                    Tidak ada transaksi saat ini.
                  </div>
                ) : (
                  transactions.slice(0, 4).map((tx) => {
                    const isPemasukan = tx.type === 'pemasukan';
                    
                    return (
                      <div key={tx.id} className="py-3 md:py-4 first:pt-0 last:pb-0 flex items-center justify-between transition-colors hover:bg-slate-50/50 rounded-xl px-2">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            isPemasukan 
                              ? 'bg-[var(--brand-light)] text-[var(--brand-primary)]' 
                              : 'bg-red-50 text-red-500'
                          }`}>
                            {isPemasukan ? <ArrowDown className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowUp className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-xs md:text-sm font-semibold text-slate-800 leading-tight">
                              {tx.title}
                            </span>
                            <span className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">
                              {tx.subtitle}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 md:gap-6">
                          <span className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg ${
                            isPemasukan 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-red-50 text-red-500'
                          }`}>
                            {isPemasukan ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                          
                          <span className="hidden sm:inline text-xs text-slate-400 font-semibold">
                            {tx.date}
                          </span>

                          <span className={`text-xs md:text-sm font-extrabold text-right min-w-[70px] md:min-w-[80px] ${
                            isPemasukan ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {isPemasukan ? `+${tx.formattedAmount}` : tx.formattedAmount}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right Part: Monthly Recap (Donut chart & side-by-side legends) */}
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100/80 shadow-sm flex flex-col justify-between text-left gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-md font-extrabold text-slate-850 tracking-tight leading-none">Ringkasan Bulan</h3>
                  <span className="text-xs text-[var(--brand-primary)] font-bold mt-1.5">{getMonthName(String(new Date().getMonth() + 1).padStart(2, '0'))} {new Date().getFullYear()}</span>
                </div>
                <Link href="/kas" className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 transition-all">
                  <span>Lihat laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Side-by-side layout: vertical data, donut, legend */}
              <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-6 gap-6 sm:gap-2">
                {/* Left Values List */}
                <div className="flex flex-row sm:flex-col justify-between w-full sm:w-auto gap-3 text-[10px] font-semibold text-slate-500 shrink-0">
                  <div className="space-y-0.5 text-left">
                    <span className="text-slate-400 uppercase tracking-wide block">Total Pemasukan</span>
                    <span className="text-xs font-extrabold text-slate-800 block">{formatRp(pemasukanBulanIni)}</span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-slate-400 uppercase tracking-wide block">Total Pengeluaran</span>
                    <span className="text-xs font-extrabold text-slate-800 block">{formatRp(pengeluaranBulanIni)}</span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-slate-400 uppercase tracking-wide block">Saldo Akhir</span>
                    <span className="text-xs font-black text-[var(--brand-primary)] block">{formatRp(saldoKas)}</span>
                  </div>
                </div>

                {/* Donut Chart SVG */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    
                    {/* Pemasukan segment (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${pLength} 314.16`}
                      strokeDashoffset={pOffset}
                      className="transition-all duration-500"
                    />

                    {/* Pengeluaran segment (Red) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray={`${eLength} 314.16`}
                      strokeDashoffset={eOffset}
                      className="transition-all duration-500"
                    />

                    {/* Next segment (Grey) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#cbd5e1"
                      strokeWidth="12"
                      strokeDasharray={`${sLength} 314.16`}
                      strokeDashoffset={sOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Inside Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wide">Saldo Akhir</span>
                    <span className="text-[9px] font-black text-slate-800 mt-0.5">{formatRp(saldoKas)}</span>
                  </div>
                </div>

                {/* Right Legend Percentages */}
                <div className="flex flex-row sm:flex-col justify-between w-full sm:w-auto gap-3 text-[10px] font-semibold text-slate-500 shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Pemasukan</span>
                    <span className="font-extrabold text-slate-800">
                      {Math.round(pemasukanBulanIni + pengeluaranBulanIni + saldoAwal > 0 ? (pemasukanBulanIni / (pemasukanBulanIni + pengeluaranBulanIni + saldoAwal)) * 105 : 60)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Pengeluaran</span>
                    <span className="font-extrabold text-slate-800">
                      {Math.round(pemasukanBulanIni + pengeluaranBulanIni + saldoAwal > 0 ? (pengeluaranBulanIni / (pemasukanBulanIni + pengeluaranBulanIni + saldoAwal)) * 100 : 30)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>Saldo Awal</span>
                    <span className="font-extrabold text-slate-800">
                      {Math.round(pemasukanBulanIni + pengeluaranBulanIni + saldoAwal > 0 ? (saldoAwal / (pemasukanBulanIni + pengeluaranBulanIni + saldoAwal)) * 100 : 10)}%
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
