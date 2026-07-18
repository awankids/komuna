'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DonutChart from '@/components/DonutChart';
import { 
  Wallet, 
  Coins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  Save,
  ArrowRight,
  Plus,
  Minus,
  UserPlus,
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
  // Base states loading dynamically from the API
  const [saldoKas, setSaldoKas] = useState<number>(0);
  const [jimpitanBulanIni, setJimpitanBulanIni] = useState<number>(0);
  const [pemasukanBulanIni, setPemasukanBulanIni] = useState<number>(0);
  const [pengeluaranBulanIni, setPengeluaranBulanIni] = useState<number>(0);
  const [saldoAwal, setSaldoAwal] = useState<number>(0);

  // Jimpitan input state
  const [jimpitanInput, setJimpitanInput] = useState<string>('');
  const [savedNominal, setSavedNominal] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [petugasName, setPetugasName] = useState<string>('Memuat...');
  const [jadwalId, setJadwalId] = useState<string | null>(null);

  // Time based greeting
  const [greeting, setGreeting] = useState('Selamat pagi');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

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

      // Set formatted date
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      setCurrentDateFormatted(today.toLocaleDateString('id-ID', options));

      const res = await fetch(`/api/jimpitan?month=${monthStr}&year=${yearStr}`);
      const data = await res.json();
      if (data.error) return;

      setSaldoKas(data.saldoKas);
      setJimpitanBulanIni(data.totalJimpitan);
      setPemasukanBulanIni(data.totalPemasukan);
      setPengeluaranBulanIni(data.totalPengeluaran);
      setSaldoAwal(data.saldoAwal || 0);
      
      if (data.todayJimpitan !== null && data.todayJimpitan > 0) {
        setJimpitanInput(String(data.todayJimpitan));
        setSavedNominal(data.todayJimpitan);
      } else {
        setJimpitanInput('');
        setSavedNominal(null);
      }

      if (data.todaySchedule) {
        setPetugasName(`${data.todaySchedule.anggota.nama} (${data.todaySchedule.anggota.noRumah})`);
        setJadwalId(data.todaySchedule.id);
      } else {
        setPetugasName('Tidak ada petugas ronda terjadwal hari ini');
        setJadwalId(null);
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

  // Handle saving of today's jimpitan nominal
  const handleSaveNominal = async () => {
    const val = jimpitanInput === '' ? 0 : parseInt(jimpitanInput.replace(/\D/g, ''), 10);
    if (isNaN(val)) return;

    try {
      const today = new Date();
      const localY = today.getFullYear();
      const localM = String(today.getMonth() + 1).padStart(2, '0');
      const localD = String(today.getDate()).padStart(2, '0');
      const dateStr = `${localY}-${localM}-${localD}`;

      const res = await fetch('/api/jimpitan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: `${dateStr}T00:00:00Z`,
          nominal: val,
          jadwalId: jadwalId,
          diisiOleh: 'Admin RT',
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSavedNominal(val > 0 ? val : null);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        // Refresh dashboard data dynamically
        fetchData();
      }
    } catch (e) {
      console.error('Error saving today nominal:', e);
    }
  };

  // Keep input only as numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '');
    setJimpitanInput(cleanValue);
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
      <Sidebar activeMenu="Dashboard" />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto pb-16 font-sans">
          
          {/* Success Toast Notification */}
          {showToast && (
            <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-100 flex items-center gap-3 animate-bounce z-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-emerald-100 leading-none">Berhasil disimpan!</span>
                <span className="text-sm font-bold mt-0.5">Jimpitan hari ini sebesar {formatRp(savedNominal || 0)}</span>
              </div>
            </div>
          )}

          {/* Greeting Area */}
          <div className="space-y-1 text-left">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {greeting}, Admin! <span className="animate-pulse">👋</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Berikut ringkasan keuangan dan aktivitas RT 04
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-6 text-center">
            
            {/* Card 1: Saldo Kas */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-44 text-center">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Saldo Kas</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{formatRp(saldoKas)}</h3>
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner mt-2">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2">Saldo saat ini</span>
            </div>

            {/* Card 2: Jimpitan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-44 text-center">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Jimpitan Bulan Ini</span>
              <h3 className="text-lg font-black text-orange-600 tracking-tight">{formatRp(jimpitanBulanIni)}</h3>
              <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner mt-2">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2">
                Total {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} hari
              </span>
            </div>

            {/* Card 3: Pemasukan Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-44 text-center">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Pemasukan Bulan Ini</span>
              <h3 className="text-lg font-black text-sky-600 tracking-tight">{formatRp(pemasukanBulanIni)}</h3>
              <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shadow-inner mt-2">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2">Total pemasukan</span>
            </div>

            {/* Card 4: Pengeluaran Bulan Ini */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-between h-44 text-center">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Pengeluaran Bulan Ini</span>
              <h3 className="text-lg font-black text-red-500 tracking-tight">{formatRp(pengeluaranBulanIni)}</h3>
              <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner mt-2">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2">Total pengeluaran</span>
            </div>

          </div>

          {/* Today's Schedule and Jimpitan Input panel */}
          <div className="bg-gradient-to-r from-orange-50/50 to-orange-100/20 border border-orange-100 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-8">
            
            {/* Left side: Calendar details */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex flex-col items-center justify-center text-orange-600 shadow-sm shadow-orange-200">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-[#f95713] tracking-widest leading-none">Hari Ini</span>
                </div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">{currentDateFormatted}</h4>
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="text-slate-450 font-medium">Petugas Jimpitan:</span>
                  <span className="text-slate-700 font-bold">{petugasName}</span>
                </div>
              </div>
            </div>

            {/* Right side: Input nominal */}
            <div className="flex items-center gap-4 max-w-md w-full justify-end">
              <div className="flex flex-col w-64">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 self-start">Nominal Jimpitan Hari Ini</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-700">Rp</span>
                  <input
                    type="text"
                    value={jimpitanInput === '' ? '' : parseInt(jimpitanInput, 10).toLocaleString('id-ID')}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-850 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveNominal}
                className="mt-5 px-6 py-3.5 bg-[#f95713] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-orange-600 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>Simpan Nominal</span>
              </button>
            </div>

          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">Aksi Cepat</h3>
            <div className="grid grid-cols-5 gap-4">
              
              {/* Action 1: Input Jimpitan */}
              <Link href="/jimpitan" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Input Jimpitan</span>
              </Link>

              {/* Action 2: Tambah Pemasukan */}
              <Link href="/kas" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Tambah Pemasukan</span>
              </Link>

              {/* Action 3: Tambah Pengeluaran */}
              <Link href="/kas" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                  <Minus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Tambah Pengeluaran</span>
              </Link>

              {/* Action 4: Tambah Anggota */}
              <Link href="/anggota" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Tambah Anggota</span>
              </Link>

              {/* Action 5: Lihat Jadwal */}
              <Link href="/jadwal" className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 shadow-sm hover:shadow group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Lihat Jadwal</span>
              </Link>

            </div>
          </div>

          {/* Bottom Sections: Transactions & Monthly Recap */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Part: Last Transactions list (spans 2 columns) */}
            <div className="col-span-2 bg-white rounded-3xl p-6 border border-slate-100/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-extrabold text-slate-850 tracking-tight">Transaksi Terakhir</h3>
                <Link href="/kas" className="text-xs font-bold text-[#f95713] hover:underline flex items-center gap-1 transition-all">
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
                  transactions.map((tx) => {
                    const isPemasukan = tx.type === 'pemasukan';
                    
                    return (
                      <div key={tx.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between transition-colors hover:bg-slate-50/50 rounded-xl px-2">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                            isPemasukan 
                              ? 'bg-orange-50 text-orange-500' 
                              : 'bg-red-50 text-red-500'
                          }`}>
                            {isPemasukan ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-extrabold text-slate-800 leading-tight">
                              {tx.title}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold mt-0.5">
                              {tx.subtitle}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            isPemasukan 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-red-50 text-red-500'
                          }`}>
                            {isPemasukan ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                          
                          <span className="text-xs text-slate-400 font-semibold">
                            {tx.date}
                          </span>

                          <span className={`text-sm font-extrabold text-right min-w-[80px] ${
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-sm flex flex-col justify-between text-left">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-md font-extrabold text-slate-850 tracking-tight leading-none">Ringkasan Bulan</h3>
                  <span className="text-xs text-[#f95713] font-bold mt-1.5">{getMonthName(String(new Date().getMonth() + 1).padStart(2, '0'))} {new Date().getFullYear()}</span>
                </div>
                <Link href="/kas" className="text-xs font-bold text-[#f95713] hover:underline flex items-center gap-1 transition-all">
                  <span>Lihat Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Side-by-side layout: vertical data, donut, legend */}
              <div className="flex items-center justify-between py-6 gap-3">
                {/* Left Values List */}
                <div className="flex flex-col gap-3 text-[10px] font-semibold text-slate-500 shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase tracking-wide block">Total Pemasukan</span>
                    <span className="text-xs font-extrabold text-slate-800 block">{formatRp(pemasukanBulanIni)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase tracking-wide block">Total Pengeluaran</span>
                    <span className="text-xs font-extrabold text-slate-800 block">{formatRp(pengeluaranBulanIni)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase tracking-wide block">Saldo Akhir</span>
                    <span className="text-xs font-black text-[#f95713] block">{formatRp(saldoKas)}</span>
                  </div>
                </div>

                {/* Donut Chart SVG */}
                <div className="relative w-28 h-28 shrink-0">
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

                    {/* Saldo Awal segment (Grey) */}
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
                <div className="flex flex-col gap-3 text-[10px] font-semibold text-slate-500 shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Pemasukan</span>
                    <span className="font-extrabold text-slate-800">
                      {Math.round(pemasukanBulanIni + pengeluaranBulanIni + saldoAwal > 0 ? (pemasukanBulanIni / (pemasukanBulanIni + pengeluaranBulanIni + saldoAwal)) * 100 : 60)}%
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
      </div>
    </div>
  );
}
