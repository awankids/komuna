'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  FileText, 
  Printer, 
  Copy, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Users, 
  Wallet, 
  Package, 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Edit3, 
  TrendingUp, 
  Check, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface LpjData {
  tahun: number;
  config: {
    namaApp: string;
    namaRt: string;
    tagline: string;
    targetJimpitan: number;
    kotaWilayah: string;
    nomorSk?: string | null;
    periodeAktif?: string;
  };
  signatories: {
    ketuaRt: string;
    sekretaris: string;
    bendahara: string;
  };
  mutasi: {
    list: any[];
    summary: {
      totalLahir: number;
      totalMeninggal: number;
      totalMasuk: number;
      totalKeluar: number;
      deltaNetto: number;
      totalWargaAktif: number;
      totalKkAktif?: number;
      totalLaki?: number;
      totalPerempuan?: number;
    };
  };
  keuangan: {
    saldoAwalTahun: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    saldoAkhirTahun: number;
    kategoriSummary: Record<string, { pemasukan: number; pengeluaran: number }>;
    transaksiCount: number;
  };
  programKerja: {
    list: any[];
    summary: {
      totalProker: number;
      prokerTerlaksana: number;
      persentaseCapaianProker: number;
      totalAnggaranRencana: number;
      totalAnggaranRealisasi: number;
    };
  };
  inventaris: {
    list: any[];
    summary: {
      totalJenis: number;
      totalUnitAset: number;
      totalAsetBaik: number;
      totalAsetRusak: number;
      asetBertambahTahunIni: number;
    };
  };
  evaluasi: {
    kataPengantar?: string;
    kendalaTantangan: string;
    solusiTindakan: string;
    usulanRencana: string;
    estimasiAnggaran: number;
  };
}

export default function LpjTahunanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [lpjData, setLpjData] = useState<LpjData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editable Evaluasi Form
  const [evaluasiForm, setEvaluasiForm] = useState({
    kataPengantar: '',
    kendalaTantangan: '',
    solusiTindakan: '',
    usulanRencana: '',
    estimasiAnggaran: 0
  });

  // Custom Signatures
  const [signatures, setSignatures] = useState({
    ketuaRt: '',
    sekretaris: '',
    bendahara: ''
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch LPJ Data
  const fetchLpjData = async (year: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lpj?tahun=${year}`);
      if (!res.ok) throw new Error('Gagal memuat data LPJ');
      const json: LpjData = await res.json();
      setLpjData(json);

      if (json.evaluasi) {
        setEvaluasiForm({
          kataPengantar: json.evaluasi.kataPengantar || '',
          kendalaTantangan: json.evaluasi.kendalaTantangan || '',
          solusiTindakan: json.evaluasi.solusiTindakan || '',
          usulanRencana: json.evaluasi.usulanRencana || '',
          estimasiAnggaran: json.evaluasi.estimasiAnggaran || 0
        });
      }

      if (json.signatories) {
        setSignatures({
          ketuaRt: json.signatories.ketuaRt,
          sekretaris: json.signatories.sekretaris,
          bendahara: json.signatories.bendahara
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memuat data LPJ tahunan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLpjData(selectedYear);
  }, [selectedYear]);

  // Save Evaluasi
  const handleSaveEvaluasi = async () => {
    try {
      const res = await fetch('/api/lpj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahun: selectedYear,
          ...evaluasiForm
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');
      showToast('Catatan evaluasi & rencana berhasil disimpan', 'success');
      fetchLpjData(selectedYear);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Format Currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy WhatsApp Broadcast
  const handleCopyWa = () => {
    if (!lpjData) return;
    const text = `*LAPORAN PERTANGGUNGJAWABAN (LPJ) TAHUNAN ${lpjData.config.namaRt.toUpperCase()}*
Tahun Buku: ${selectedYear}

Yth. Seluruh Warga ${lpjData.config.namaRt},
Berikut adalah ringkasan capaian kegiatan & pertanggungjawaban operasional RT:

📊 *1. Kependudukan:*
• Total Warga Terdaftar: ${lpjData.mutasi.summary.totalWargaAktif} Jiwa
• Kelahiran: ${lpjData.mutasi.summary.totalLahir} Bayi
• Warga Masuk: ${lpjData.mutasi.summary.totalMasuk} Jiwa
• Warga Pindah: ${lpjData.mutasi.summary.totalKeluar} Jiwa
• Warga Meninggal: ${lpjData.mutasi.summary.totalMeninggal} Jiwa
• Pertumbuhan Bersih: ${lpjData.mutasi.summary.deltaNetto > 0 ? '+' : ''}${lpjData.mutasi.summary.deltaNetto} Jiwa

💰 *2. Realisasi Kas RT:*
• Saldo Awal: ${formatRupiah(lpjData.keuangan.saldoAwalTahun)}
• Total Pemasukan: ${formatRupiah(lpjData.keuangan.totalPemasukan)}
• Total Pengeluaran: ${formatRupiah(lpjData.keuangan.totalPengeluaran)}
• Saldo Akhir Kas: ${formatRupiah(lpjData.keuangan.saldoAkhirTahun)}

🏆 *3. Program Kerja:*
• Ketercapaian: ${lpjData.programKerja.summary.prokerTerlaksana} dari ${lpjData.programKerja.summary.totalProker} Program (${lpjData.programKerja.summary.persentaseCapaianProker}% Terlaksana)

📦 *4. Inventaris Lingkungan:*
• Total Aset: ${lpjData.inventaris.summary.totalUnitAset} Unit (${lpjData.inventaris.summary.totalAsetBaik} Baik / ${lpjData.inventaris.summary.totalAsetRusak} Rusak)
• Pengadaan Baru Tahun Ini: ${lpjData.inventaris.summary.asetBertambahTahunIni} Unit

Ketua RT: ${signatures.ketuaRt}
Sekretaris: ${signatures.sekretaris}
Bendahara: ${signatures.bendahara}

_Laporan lengkap dapat dibaca pada lembar pertanggungjawaban resmi RT. Terima kasih atas dukungan dan kebersamaan seluruh warga._`;

    navigator.clipboard.writeText(text);
    showToast('Ringkasan LPJ disalin untuk WhatsApp warga', 'success');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      <Sidebar activeMenu="Laporan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1">
          {/* Print CSS */}
          <style jsx global>{`
            @media print {
              body, html {
                background: white !important;
                color: black !important;
                font-size: 11pt !important;
              }
              .no-print, header, aside, nav, .sidebar-container, .mobile-navbar, button {
                display: none !important;
              }
              #print-lpj {
                display: block !important;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
            }
          `}</style>

          {/* Desktop 24-inch fluid container */}
          <div className="no-print max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <Link
                    href="/laporan"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="Kembali ke Laporan Kas"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                      Buku Laporan Pertanggungjawaban (LPJ) Tahunan RT
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">
                      Kompilasi resmi 4 pilar administrasi: Kependudukan, Program Kerja, Inventaris Aset, dan Evaluasi Keuangan Tahunan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Year Selector & Print Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-600">Tahun Buku:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWa}
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Ringkasan WA</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Buku LPJ (A4 PDF)</span>
                </button>
              </div>
            </div>

            {/* Grid Layout: Left Control Panel (5 Cols) vs Right Live A4 Simulator (7 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-start">
              
              {/* LEFT COLUMN: 5 COLS - Control & Evaluasi Input */}
              <div className="lg:col-span-5 space-y-5 text-left">
                
                {/* 4 Pilar Status Cards */}
                {lpjData && (
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                      Status Integrasi 4 Pilar Administrasi ({selectedYear})
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">1. Kependudukan</span>
                        <p className="font-bold text-slate-700">{lpjData.mutasi.list.length} Peristiwa Mutasi</p>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Netto: {lpjData.mutasi.summary.deltaNetto > 0 ? '+' : ''}{lpjData.mutasi.summary.deltaNetto} Jiwa
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">2. Realisasi Kas RT</span>
                        <p className="font-bold text-slate-700">{formatRupiah(lpjData.keuangan.saldoAkhirTahun)}</p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {lpjData.keuangan.transaksiCount} Mutasi Kas
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">3. Program Kerja</span>
                        <p className="font-bold text-slate-700">{lpjData.programKerja.summary.persentaseCapaianProker}% Terlaksana</p>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {lpjData.programKerja.summary.prokerTerlaksana} / {lpjData.programKerja.summary.totalProker} Program
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">4. Inventaris Aset</span>
                        <p className="font-bold text-slate-700">{lpjData.inventaris.summary.totalUnitAset} Unit Barang</p>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          +{lpjData.inventaris.summary.asetBertambahTahunIni} Baru Tahun Ini
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Input Evaluasi & Rencana Masa Depan */}
                <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-slate-600" />
                      Refleksi & Rencana Kerja Tahun Depan
                    </h3>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Bab V LPJ
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Kata Sambutan / Pengantar Ketua RT
                      </label>
                      <textarea
                        rows={2}
                        value={evaluasiForm.kataPengantar}
                        onChange={(e) => setEvaluasiForm(prev => ({ ...prev, kataPengantar: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                        placeholder="Puji syukur atas selesainya periode kepengurusan..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Kendala & Hambatan Operasional (1 Tahun)
                      </label>
                      <textarea
                        rows={3}
                        value={evaluasiForm.kendalaTantangan}
                        onChange={(e) => setEvaluasiForm(prev => ({ ...prev, kendalaTantangan: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                        placeholder="1. Partisipasi kerja bakti...&#10;2. Pompa drainase..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Solusi / Langkah Perbaikan yang Dilakukan
                      </label>
                      <textarea
                        rows={3}
                        value={evaluasiForm.solusiTindakan}
                        onChange={(e) => setEvaluasiForm(prev => ({ ...prev, solusiTindakan: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                        placeholder="1. Reminder WhatsApp personal...&#10;2. Pengajuan bantuan kelurahan..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Usulan Program Kerja Prioritas Tahun Depan
                      </label>
                      <textarea
                        rows={3}
                        value={evaluasiForm.usulanRencana}
                        onChange={(e) => setEvaluasiForm(prev => ({ ...prev, usulanRencana: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                        placeholder="1. Pembuatan biopori...&#10;2. Lampu solar cell jalan..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Estimasi Kebutuhan Anggaran Tahun Depan (Rp)
                      </label>
                      <input
                        type="number"
                        value={evaluasiForm.estimasiAnggaran}
                        onChange={(e) => setEvaluasiForm(prev => ({ ...prev, estimasiAnggaran: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>

                    {/* Pejabat Penandatangan Form */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block">Legalitas Penandatanganan LPJ:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Ketua RT</label>
                          <input
                            type="text"
                            value={signatures.ketuaRt}
                            onChange={(e) => setSignatures(prev => ({ ...prev, ketuaRt: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Sekretaris</label>
                          <input
                            type="text"
                            value={signatures.sekretaris}
                            onChange={(e) => setSignatures(prev => ({ ...prev, sekretaris: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Bendahara</label>
                          <input
                            type="text"
                            value={signatures.bendahara}
                            onChange={(e) => setSignatures(prev => ({ ...prev, bendahara: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveEvaluasi}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Catatan Evaluasi</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: 7 COLS - Official Document A4 Simulator */}
              <div className="lg:col-span-7 flex flex-col items-center">
                
                <div className="w-full flex items-center justify-between pb-3 px-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-600">
                    <Printer className="w-4 h-4 text-[var(--brand-primary)]" />
                    Pratinjau Kertas Cetak A4 (Buku LPJ Resmi)
                  </span>
                  <span>Standar Kedinasan RT / RW</span>
                </div>

                {isLoading || !lpjData ? (
                  <div className="w-full max-w-[760px] bg-white rounded-2xl p-16 text-center text-slate-400 text-xs shadow-md border border-slate-200">
                    Menyusun dokumen LPJ tahunan...
                  </div>
                ) : (
                  <div
                    id="print-lpj"
                    className="w-full max-w-[760px] bg-white rounded-2xl shadow-md border border-slate-200/80 p-8 sm:p-12 text-black leading-normal text-[12px] font-serif space-y-8"
                  >
                    {/* HALAMAN SAMPUL / KOP RESMI */}
                    <div className="border-b-[3px] border-double border-black pb-4 text-center space-y-0.5">
                      <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-sans">
                        PAGUYUBAN RUKUN TETANGGA {lpjData.config.namaRt.toUpperCase()}
                      </h2>
                      <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase font-sans">
                        KELURAHAN WILAYAH KOTA {lpjData.config.kotaWilayah.toUpperCase()}
                      </h3>
                      <p className="text-[11px] font-sans text-gray-700 italic">
                        Sekretariat: {lpjData.config.namaRt}, Kota {lpjData.config.kotaWilayah}. Nomor SK: {lpjData.config.nomorSk || 'SK.04/RW.02/2024'}
                      </p>
                    </div>

                    {/* JUDUL DOKUMEN LPJ */}
                    <div className="text-center my-6 space-y-1 font-sans">
                      <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider underline">
                        LAPORAN PERTANGGUNGJAWABAN (LPJ) TAHUNAN
                      </h1>
                      <p className="text-xs font-semibold text-gray-800">
                        KEGIATAN DAN ADMINISTRASI KEPENGURUSAN TAHUN BUKU {selectedYear}
                      </p>
                      <p className="text-[11px] text-gray-500 italic">
                        Disusun oleh: Pengurus {lpjData.config.namaRt} Masa Bakti {lpjData.config.periodeAktif || '2024 - 2029'}
                      </p>
                    </div>

                    {/* KATA SAMBUTAN */}
                    <div className="space-y-2 text-justify">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1">
                        KATA PENGANTAR KETUA RT
                      </h4>
                      <p className="text-gray-800 leading-relaxed italic">
                        "{evaluasiForm.kataPengantar || 'Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas terselenggaranya seluruh program kerja dan pelayanan warga di lingkungan RT kita sepanjang tahun ini.'}"
                      </p>
                    </div>

                    {/* BAB I: REKAPITULASI KEPENDUDUKAN */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1 flex items-center justify-between">
                        <span>BAB I. REKAPITULASI KEPENDUDUKAN & DINAMIKA WARGA</span>
                        <span className="text-[10px] text-gray-500 font-normal">Tahun {selectedYear}</span>
                      </h4>

                      <div className="grid grid-cols-4 gap-2 font-sans text-[11px] text-center my-2">
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Kelahiran</span>
                          <strong className="text-sm">{lpjData.mutasi.summary.totalLahir}</strong> Jiwa
                        </div>
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Kematian</span>
                          <strong className="text-sm">{lpjData.mutasi.summary.totalMeninggal}</strong> Jiwa
                        </div>
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Pindah Masuk</span>
                          <strong className="text-sm">{lpjData.mutasi.summary.totalMasuk}</strong> Jiwa
                        </div>
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Pindah Keluar</span>
                          <strong className="text-sm">{lpjData.mutasi.summary.totalKeluar}</strong> Jiwa
                        </div>
                      </div>

                      <p className="text-justify leading-relaxed">
                        Berdasarkan data register kependudukan, total penduduk terdaftar aktif tercatat sebanyak <strong>{lpjData.mutasi.summary.totalWargaAktif} jiwa</strong> yang terhimpun dalam <strong>{lpjData.mutasi.summary.totalKkAktif || '-'} Kepala Keluarga (Rumah Tangga)</strong>{lpjData.mutasi.summary.totalLaki ? ` dengan komposisi ${lpjData.mutasi.summary.totalLaki} warga laki-laki dan ${lpjData.mutasi.summary.totalPerempuan} warga perempuan` : ''}. Dinamika kependudukan selama tahun {selectedYear} mencatat pertumbuhan bersih penduduk sebesar <strong>{lpjData.mutasi.summary.deltaNetto > 0 ? `+${lpjData.mutasi.summary.deltaNetto}` : lpjData.mutasi.summary.deltaNetto} jiwa</strong>.
                      </p>

                      {lpjData.mutasi.list.length > 0 && (
                        <table className="w-full text-left font-sans text-[10px] border border-gray-300">
                          <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                              <th className="p-1.5">Tgl</th>
                              <th className="p-1.5">Peristiwa</th>
                              <th className="p-1.5">Nama Warga</th>
                              <th className="p-1.5">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {lpjData.mutasi.list.slice(0, 5).map((m: any) => (
                              <tr key={m.id}>
                                <td className="p-1.5 whitespace-nowrap">{new Date(m.tanggalPeristiwa).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' })}</td>
                                <td className="p-1.5 uppercase font-bold">{m.jenisMutasi}</td>
                                <td className="p-1.5">{m.namaWarga}</td>
                                <td className="p-1.5 text-gray-600">{m.keterangan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* BAB II: REALISASI KEUANGAN KAS */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1">
                        BAB II. LAPORAN PERTANGGUNGJAWABAN REALISASI KAS RT
                      </h4>

                      <div className="grid grid-cols-3 gap-2 font-sans text-[11px] text-center my-2">
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Total Pemasukan Kas</span>
                          <strong className="text-xs text-emerald-700">{formatRupiah(lpjData.keuangan.totalPemasukan)}</strong>
                        </div>
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Total Pengeluaran Kas</span>
                          <strong className="text-xs text-red-700">{formatRupiah(lpjData.keuangan.totalPengeluaran)}</strong>
                        </div>
                        <div className="p-2 border border-gray-200 rounded bg-gray-50">
                          <span className="text-[10px] text-gray-500 block">Saldo Akhir Kas</span>
                          <strong className="text-xs text-blue-700">{formatRupiah(lpjData.keuangan.saldoAkhirTahun)}</strong>
                        </div>
                      </div>

                      <p className="text-justify leading-relaxed">
                        Saldo awal per 1 Januari {selectedYear} tercatat sebesar <strong>{formatRupiah(lpjData.keuangan.saldoAwalTahun)}</strong>. Seluruh mutasi kas dicatat transparan berdasarkan iuran warga, jimpitan ronda, dan belanja operasional lingkungan.
                      </p>
                    </div>

                    {/* BAB III: REALISASI PROGRAM KERJA */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1 flex items-center justify-between">
                        <span>BAB III. REALISASI & CAPAIAN PROGRAM KERJA</span>
                        <span className="text-[10px] font-normal text-emerald-700 font-bold">
                          Ketercapaian: {lpjData.programKerja.summary.persentaseCapaianProker}%
                        </span>
                      </h4>

                      <table className="w-full text-left font-sans text-[10px] border border-gray-300">
                        <thead className="bg-gray-100 border-b border-gray-300 font-bold">
                          <tr>
                            <th className="p-1.5">No</th>
                            <th className="p-1.5">Program Kerja</th>
                            <th className="p-1.5">Target Waktu</th>
                            <th className="p-1.5">Realisasi Biaya</th>
                            <th className="p-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lpjData.programKerja.list.map((p: any, idx: number) => (
                            <tr key={p.id}>
                              <td className="p-1.5 text-center font-bold">{idx + 1}</td>
                              <td className="p-1.5 font-semibold">{p.namaProgram}</td>
                              <td className="p-1.5 text-gray-600">{p.targetBulan || '-'}</td>
                              <td className="p-1.5 font-mono">{formatRupiah(p.anggaranRealisasi)}</td>
                              <td className="p-1.5 uppercase font-bold text-[9px]">
                                {p.status === 'terlaksana' ? '100% Selesai' : `${p.persentase}% Berjalan`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* BAB IV: BUKU INVENTARIS & ASET LINGKUNGAN */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1 flex items-center justify-between">
                        <span>BAB IV. DAFTAR INVENTARIS & KONDISI FISIK ASET RT</span>
                        <span className="text-[10px] font-normal text-gray-500">
                          Total: {lpjData.inventaris.summary.totalUnitAset} Unit
                        </span>
                      </h4>

                      <table className="w-full text-left font-sans text-[10px] border border-gray-300">
                        <thead className="bg-gray-100 border-b border-gray-300 font-bold">
                          <tr>
                            <th className="p-1.5">Nama Barang Aset</th>
                            <th className="p-1.5 text-center">Jumlah</th>
                            <th className="p-1.5 text-center">Baik</th>
                            <th className="p-1.5 text-center">Rusak</th>
                            <th className="p-1.5">Lokasi Simpan</th>
                            <th className="p-1.5">Status Tahun Ini</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {lpjData.inventaris.list.map((i: any) => (
                            <tr key={i.id}>
                              <td className="p-1.5 font-medium">{i.namaBarang}</td>
                              <td className="p-1.5 text-center font-bold">{i.jumlah} {i.satuan}</td>
                              <td className="p-1.5 text-center text-emerald-700 font-bold">{i.kondisiBaik}</td>
                              <td className="p-1.5 text-center text-red-600 font-bold">{i.kondisiRusak}</td>
                              <td className="p-1.5 text-gray-600">{i.lokasiSimpan || 'Balai RT'}</td>
                              <td className="p-1.5 text-[9px] uppercase font-semibold">
                                {i.statusTahunIni === 'bertambah_baru' ? '+ Baru Tahun Ini' : i.statusTahunIni}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* BAB V: EVALUASI KENDALA & RENCANA KERJA TAHUN DEPAN */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs font-sans uppercase border-b border-gray-300 pb-1">
                        BAB V. EVALUASI KENDALA & USULAN RENCANA TAHUN DEPAN
                      </h4>

                      <div className="space-y-2 text-justify">
                        <p className="font-bold text-[11px] font-sans">A. Kendala & Hambatan Lapangan:</p>
                        <p className="whitespace-pre-line text-gray-800 leading-relaxed pl-2">
                          {evaluasiForm.kendalaTantangan}
                        </p>

                        <p className="font-bold text-[11px] font-sans pt-1">B. Solusi & Tindakan Perbaikan:</p>
                        <p className="whitespace-pre-line text-gray-800 leading-relaxed pl-2">
                          {evaluasiForm.solusiTindakan}
                        </p>

                        <p className="font-bold text-[11px] font-sans pt-1">C. Usulan Program Prioritas Tahun Depan:</p>
                        <p className="whitespace-pre-line text-gray-800 leading-relaxed pl-2">
                          {evaluasiForm.usulanRencana}
                        </p>
                        {evaluasiForm.estimasiAnggaran > 0 && (
                          <p className="pl-2 text-[11px] italic font-medium">
                            Estimasi Anggaran yang Dibutuhkan: <strong>{formatRupiah(evaluasiForm.estimasiAnggaran)}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* LEMBAR PENGESAHAN DOKUMEN LPJ */}
                    <div className="pt-8 space-y-4">
                      <p className="text-right text-[11px]">
                        {lpjData.config.kotaWilayah}, 31 Desember {selectedYear}
                      </p>

                      <p className="text-center font-bold text-xs font-sans uppercase">
                        PENGURUS RUKUN TETANGGA {lpjData.config.namaRt.toUpperCase()}
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs pt-2">
                        <div>
                          <p className="text-[11px] text-gray-600">Sekretaris RT,</p>
                          <div className="h-16"></div>
                          <p className="font-bold underline uppercase">{signatures.sekretaris || 'Bpk. Joko Susanto'}</p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-600">Bendahara RT,</p>
                          <div className="h-16"></div>
                          <p className="font-bold underline uppercase">{signatures.bendahara || 'Ibu Siti Rahmawati'}</p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-600">Ketua RT,</p>
                          <div className="h-16"></div>
                          <p className="font-bold underline uppercase">{signatures.ketuaRt || 'Bpk. Bambang Sutrisno'}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 bg-white border-slate-200 text-slate-800">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <MobileNavBar />
    </div>
  );
}
