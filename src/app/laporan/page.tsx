'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  UserCheck,
  Building2,
  X,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface Transaction {
  id: string;
  tanggal: string;
  jenis: 'pemasukan' | 'pengeluaran';
  sumber: string;
  kategori: string | null;
  keterangan: string;
  keteranganText?: string;
  detailKeterangan?: string;
  nominal: number;
  saldo: number;
  isVirtual?: boolean;
}

interface SummaryData {
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
}

export default function LaporanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Month & Year state
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => String(today.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(today.getFullYear()));

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    saldoAwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // App Identity State
  const [appConfig, setAppConfig] = useState({
    namaApp: 'komuna.id',
    namaRt: 'RT 04',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    kotaWilayah: 'Semarang',
  });

  // Pengurus List
  const [pengurusList, setPengurusList] = useState<{ id: string; jabatan: string; nama: string; statusAktif: boolean }[]>([]);

  // Custom Signatures & Document Metadata
  const [docConfig, setDocConfig] = useState({
    kota: 'Semarang',
    tanggalDokumen: new Date().toISOString().split('T')[0],
    namaKetuaRt: 'Bpk. Bambang Sutrisno',
    namaBendahara: 'Ibu Siti Rahmawati',
    catatanTambahan: 'Laporan ini disusun dengan sebenar-benarnya berdasarkan mutasi kas dan jimpitan warga.',
  });

  // WhatsApp Share Modal State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waText, setWaText] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper: Month names
  const getMonthName = (monthStr: string) => {
    const names: { [key: string]: string } = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember',
    };
    return names[monthStr] || 'Januari';
  };

  // Helper: Currency Formatter
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace('IDR', 'Rp')
      .trim();
  };

  // Helper: Date Formatter
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatDateLong = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Fetch App Configuration & Pengurus
  useEffect(() => {
    const fetchConfigAndPengurus = async () => {
      try {
        const cached = localStorage.getItem('komuna_app_config');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setAppConfig(parsed);
            if (parsed.kotaWilayah) {
              setDocConfig(prev => ({ ...prev, kota: parsed.kotaWilayah }));
            }
          } catch (e) {}
        }

        const [configRes, pengurusRes] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/pengurus')
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          setAppConfig(data);
          localStorage.setItem('komuna_app_config', JSON.stringify(data));
          if (data.kotaWilayah) {
            setDocConfig(prev => ({ ...prev, kota: data.kotaWilayah }));
          }
        }

        if (pengurusRes.ok) {
          const pData = await pengurusRes.json();
          const list = pData.data || [];
          setPengurusList(list);

          const ketua = pData.signatures?.ketuaRt || list.find((p: any) => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama;
          const bendahara = pData.signatures?.bendahara || list.find((p: any) => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama;

          setDocConfig(prev => ({
            ...prev,
            namaKetuaRt: ketua || prev.namaKetuaRt,
            namaBendahara: bendahara || prev.namaBendahara,
          }));
        }
      } catch (e) {
        console.error('Failed to fetch config or pengurus:', e);
      }
    };
    fetchConfigAndPengurus();
  }, []);

  // Fetch Report Data
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transaksi?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        // Transactions from API are sorted desc; sort asc for official chronological ledger
        const rawTx: Transaction[] = data.transactions || [];
        const chronologicalTx = [...rawTx].sort(
          (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        );

        setTransactions(chronologicalTx);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        showToast('Gagal memuat rincian kas periode ini', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan jaringan saat memuat data laporan', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Shortcut Periods
  const setThisMonth = () => {
    const d = new Date();
    setSelectedMonth(String(d.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(d.getFullYear()));
  };

  const setLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(String(d.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(d.getFullYear()));
  };

  // Trigger Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Open WhatsApp Share Modal
  const handleOpenWhatsAppModal = () => {
    const monthName = getMonthName(selectedMonth).toUpperCase();
    const draft = `*📢 LAPORAN KAS ${appConfig.namaRt.toUpperCase()}*\n*Periode: ${monthName} ${selectedYear}*\n\n` +
      `📌 *Ringkasan Posisi Keuangan:*\n` +
      `• Saldo Awal: *${formatRp(summary.saldoAwal)}*\n` +
      `• Total Pemasukan: *${formatRp(summary.totalPemasukan)}*\n` +
      `• Total Pengeluaran: *${formatRp(summary.totalPengeluaran)}*\n` +
      `========================\n` +
      `💰 *SALDO AKHIR: ${formatRp(summary.saldoAkhir)}*\n\n` +
      `_Catatan: ${docConfig.catatanTambahan}_\n\n` +
      `Transparan & Akuntabel bersama *${appConfig.namaApp}*.`;

    setWaText(draft);
    setIsWaModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'sep=;\r\n';
    csvContent += `LAPORAN PERTANGGUNGJAWABAN KAS ${appConfig.namaRt.toUpperCase()}\r\n`;
    csvContent += `Periode;${getMonthName(selectedMonth)} ${selectedYear}\r\n`;
    csvContent += `Tanggal Cetak;${formatDateLong(docConfig.tanggalDokumen)}\r\n\r\n`;

    csvContent += `Saldo Awal;${summary.saldoAwal}\r\n`;
    csvContent += `Total Pemasukan;${summary.totalPemasukan}\r\n`;
    csvContent += `Total Pengeluaran;${summary.totalPengeluaran}\r\n`;
    csvContent += `Saldo Akhir;${summary.saldoAkhir}\r\n\r\n`;

    csvContent += 'No;Tanggal;Kategori;Keterangan / Uraian;Pemasukan (Rp);Pengeluaran (Rp);Saldo (Rp)\r\n';

    transactions.forEach((tx, idx) => {
      const pemasukan = tx.jenis === 'pemasukan' ? tx.nominal : 0;
      const pengeluaran = tx.jenis === 'pengeluaran' ? tx.nominal : 0;
      csvContent += `${idx + 1};"${formatDate(tx.tanggal)}";"${tx.kategori || '-'}";"${tx.keterangan}";${pemasukan};${pengeluaran};${tx.saldo}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Kas_${appConfig.namaRt.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV laporan berhasil diunduh', 'success');
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      {/* Print Specific CSS Rules */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all UI elements except the document paper */
          .no-print,
          aside,
          header,
          nav,
          .mobile-nav-bar {
            display: none !important;
          }
          #print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className="no-print">
        <Sidebar activeMenu="Laporan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <div className="no-print">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white no-print ${
                toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-600 shadow-red-200'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          )}

          {/* Title Bar & Quick Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  Laporan Kas Bulanan
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Generate laporan pertanggungjawaban kas RT resmi dengan pratinjau lembar A4 dan siap cetak/PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={fetchReportData}
                disabled={isLoading}
                title="Muat Ulang Data"
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenWhatsAppModal}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Share WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-[var(--brand-ring)] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* Main Workspace Bento Grid: 5 Cols Control : 7 Cols Document Paper Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-start">
            
            {/* LEFT COLUMN: 5 COLS (~41.7%) - Filters, KPI Recaps & Signatures (no-print) */}
            <div className="lg:col-span-5 space-y-5 no-print">
              
              {/* Filter Periode Card */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h3 className="text-sm font-bold text-slate-800">Periode Laporan</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={setThisMonth}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-all cursor-pointer"
                    >
                      Bulan Ini
                    </button>
                    <button
                      onClick={setLastMonth}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-all cursor-pointer"
                    >
                      Bulan Lalu
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Pilih Bulan</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs md:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                    >
                      {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                        <option key={m} value={m}>
                          {getMonthName(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Pilih Tahun</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs md:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4 Mini KPI Cards */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Saldo Awal */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Awal
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-700 block">
                    {formatRp(summary.saldoAwal)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Posisi awal bulan</span>
                </div>

                {/* Saldo Akhir */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-white p-4 rounded-2xl border border-indigo-100 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Saldo Akhir
                  </span>
                  <span className="text-base sm:text-lg font-black text-indigo-700 block">
                    {formatRp(summary.saldoAkhir)}
                  </span>
                  <span className="text-[10px] text-indigo-400 block">Sisa kas berjalan</span>
                </div>

                {/* Total Pemasukan */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3" /> Pemasukan
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 block">
                    +{formatRp(summary.totalPemasukan)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Jimpitan & donasi</span>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Pengeluaran
                  </span>
                  <span className="text-base sm:text-lg font-black text-red-700 block">
                    -{formatRp(summary.totalPengeluaran)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Belanja & kegiatan</span>
                </div>
              </div>

              {/* Kustomisasi Tanda Tangan & Keterangan Card */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800">Legalitas & Tanda Tangan</h3>
                  </div>
                  <Link
                    href="/pengurus"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                    title="Buka Halaman Susunan Pengurus RT"
                  >
                    <span>Atur Pengurus RT</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-600 block">Nama Ketua RT</label>
                        {pengurusList.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) setDocConfig(prev => ({ ...prev, namaKetuaRt: e.target.value }));
                            }}
                            className="text-[10px] text-teal-600 font-semibold bg-teal-50 border-none rounded px-1.5 py-0.5 cursor-pointer outline-none"
                            value=""
                          >
                            <option value="">Pilih...</option>
                            {pengurusList.map(p => (
                              <option key={p.id} value={p.nama}>{p.jabatan}: {p.nama}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <input
                        type="text"
                        value={docConfig.namaKetuaRt}
                        onChange={(e) => setDocConfig({ ...docConfig, namaKetuaRt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        placeholder="Nama Ketua RT"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-600 block">Nama Bendahara RT</label>
                        {pengurusList.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) setDocConfig(prev => ({ ...prev, namaBendahara: e.target.value }));
                            }}
                            className="text-[10px] text-teal-600 font-semibold bg-teal-50 border-none rounded px-1.5 py-0.5 cursor-pointer outline-none"
                            value=""
                          >
                            <option value="">Pilih...</option>
                            {pengurusList.map(p => (
                              <option key={p.id} value={p.nama}>{p.jabatan}: {p.nama}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <input
                        type="text"
                        value={docConfig.namaBendahara}
                        onChange={(e) => setDocConfig({ ...docConfig, namaBendahara: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        placeholder="Nama Bendahara RT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Kota / Wilayah</label>
                      <input
                        type="text"
                        value={docConfig.kota}
                        onChange={(e) => setDocConfig({ ...docConfig, kota: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        placeholder="Semarang"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Tanggal Dokumen</label>
                      <input
                        type="date"
                        value={docConfig.tanggalDokumen}
                        onChange={(e) => setDocConfig({ ...docConfig, tanggalDokumen: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Catatan Tambahan Pengurus</label>
                    <textarea
                      rows={2}
                      value={docConfig.catatanTambahan}
                      onChange={(e) => setDocConfig({ ...docConfig, catatanTambahan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                      placeholder="Tuliskan catatan pertanggungjawaban singkat..."
                    />
                  </div>
                </div>
              </div>

              {/* Petunjuk Cetak Rapih Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Petunjuk Cetak / Simpan PDF:</span>
                </div>
                <p>
                  Klik tombol <strong>Cetak / Unduh PDF</strong> di atas. Pada kotak dialog printer browser Anda, pilih opsi Destination: <strong>Save as PDF</strong> (atau pilih nama printer fisik). Layout secara otomatis disesuaikan dengan format kertas <strong>A4 Portrait</strong> tanpa terpotong.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: 7 COLS (~58.3%) - Live A4 Document Simulator */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between pb-3 px-2 no-print text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                  <Eye className="w-4 h-4 text-slate-400" />
                  Pratinjau Kertas A4 (Live Preview)
                </span>
                <span>Standar Cetak Portrait • Otomatis Presisi</span>
              </div>

              {/* The Actual A4 Sheet Document Paper */}
              <div
                id="print-document"
                className="w-full max-w-[850px] bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 md:p-12 text-slate-900 transition-all font-sans text-xs sm:text-sm"
              >
                
                {/* 1. KOP SURAT RT RESMI */}
                <div className="text-center pb-4 border-b-2 border-slate-900 relative">
                  <div className="space-y-0.5">
                    <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-900">
                      RUKUN TETANGGA {appConfig.namaRt.toUpperCase()}
                    </h2>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700">
                      SISTEM KAS & JIMPITAN WARGA ({appConfig.namaApp.toUpperCase()})
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium italic">
                      &quot;{appConfig.tagline}&quot;
                    </p>
                  </div>
                </div>
                {/* Double Border Bottom (Garis Kop Formal) */}
                <div className="w-full border-b border-slate-900 mt-1 mb-6" />

                {/* 2. JUDUL DOKUMEN & PERIODE */}
                <div className="text-center my-6 space-y-1">
                  <h1 className="text-sm sm:text-lg font-black uppercase underline tracking-tight text-slate-900">
                    LAPORAN PERTANGGUNGJAWABAN KAS RT
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    Periode: {getMonthName(selectedMonth).toUpperCase()} {selectedYear}
                  </p>
                </div>

                {/* 3. KOTAK REKAPITULASI POSISI KAS */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5 my-6 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                    I. Ringkasan Posisi Kas Bulanan
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Saldo Awal Bulan:</span>
                      <strong className="text-slate-800 text-xs sm:text-sm block mt-0.5">
                        {formatRp(summary.saldoAwal)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Pemasukan:</span>
                      <strong className="text-emerald-700 text-xs sm:text-sm block mt-0.5">
                        +{formatRp(summary.totalPemasukan)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Pengeluaran:</span>
                      <strong className="text-red-700 text-xs sm:text-sm block mt-0.5">
                        -{formatRp(summary.totalPengeluaran)}
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-600 block text-[11px] font-bold">Saldo Akhir Kas:</span>
                      <strong className="text-indigo-900 text-xs sm:text-sm font-black block mt-0.5">
                        {formatRp(summary.saldoAkhir)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. TABEL MUTASI BUKU KAS RINCI */}
                <div className="my-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    II. Rincian Buku Kas Transaksi ({transactions.length} Catatan)
                  </h4>

                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3 w-24">Tanggal</th>
                          <th className="py-2.5 px-3">Kategori & Uraian Transaksi</th>
                          <th className="py-2.5 px-3 text-right w-28">Pemasukan</th>
                          <th className="py-2.5 px-3 text-right w-28">Pengeluaran</th>
                          <th className="py-2.5 px-3 text-right w-32">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* Row Saldo Awal */}
                        <tr className="bg-slate-50/70 font-semibold italic">
                          <td className="py-2 px-3 text-center text-slate-400">-</td>
                          <td className="py-2 px-3 text-slate-500">01/{selectedMonth}/{selectedYear}</td>
                          <td className="py-2 px-3 text-slate-700">Saldo Awal Bulan {getMonthName(selectedMonth)}</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">{formatRp(summary.saldoAwal)}</td>
                        </tr>

                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                              Tidak ada riwayat transaksi kas pada periode bulan ini.
                            </td>
                          </tr>
                        ) : (
                          transactions.map((tx, idx) => (
                            <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                {formatDate(tx.tanggal)}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-medium text-slate-800">{tx.keterangan}</div>
                                {tx.kategori && (
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {tx.kategori}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                {tx.jenis === 'pemasukan' ? formatRp(tx.nominal) : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-red-600">
                                {tx.jenis === 'pengeluaran' ? formatRp(tx.nominal) : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-800">
                                {formatRp(tx.saldo)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                          <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider">
                            Total Periode Ini:
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-800 font-black">
                            {formatRp(summary.totalPemasukan)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-800 font-black">
                            {formatRp(summary.totalPengeluaran)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-indigo-900 font-black">
                            {formatRp(summary.saldoAkhir)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 5. CATATAN PENGURUS */}
                {docConfig.catatanTambahan && (
                  <div className="my-4 text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200 page-break-inside-avoid">
                    <strong>Catatan Pengurus:</strong> &quot;{docConfig.catatanTambahan}&quot;
                  </div>
                )}

                {/* 6. KOLOM TANDA TANGAN LEGALITAS */}
                <div className="pt-8 pb-4 grid grid-cols-2 gap-8 text-center text-xs text-slate-800 page-break-inside-avoid">
                  {/* Ketua RT */}
                  <div className="space-y-16">
                    <div>
                      <span className="block text-slate-500">Mengetahui,</span>
                      <strong className="block text-slate-900 font-bold uppercase mt-0.5">
                        Ketua {appConfig.namaRt}
                      </strong>
                    </div>

                    <div>
                      <strong className="block font-black underline uppercase text-slate-900">
                        {docConfig.namaKetuaRt}
                      </strong>
                      <span className="text-[11px] text-slate-400 block">Pengurus {appConfig.namaRt}</span>
                    </div>
                  </div>

                  {/* Bendahara RT */}
                  <div className="space-y-16">
                    <div>
                      <span className="block text-slate-500">
                        {docConfig.kota}, {formatDateLong(docConfig.tanggalDokumen)}
                      </span>
                      <strong className="block text-slate-900 font-bold uppercase mt-0.5">
                        Bendahara {appConfig.namaRt}
                      </strong>
                    </div>

                    <div>
                      <strong className="block font-black underline uppercase text-slate-900">
                        {docConfig.namaBendahara}
                      </strong>
                      <span className="text-[11px] text-slate-400 block">Pengurus {appConfig.namaRt}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Watermark kecil */}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                  <span>Dokumen sah dicetak otomatis melalui sistem {appConfig.namaApp}</span>
                  <span>Halaman 1 dari 1</span>
                </div>

              </div>

            </div>

          </div>

        </main>

        <div className="no-print">
          <MobileNavBar />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BAGIKAN KE WHATSAPP GRUP WARGA */}
      {/* ========================================================================= */}
      {isWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Bagikan ke WhatsApp</h3>
                  <p className="text-xs text-slate-400">Ringkasan kas bulanan untuk grup warga RT</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Ringkasan (Dapat diedit sebelum dikirim):
                </label>
                <textarea
                  rows={9}
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka WhatsApp Sekarang</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
