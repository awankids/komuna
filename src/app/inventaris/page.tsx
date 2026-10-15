'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  Building2, 
  Edit3, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  Layers, 
  Share2, 
  HelpCircle,
  X,
  RotateCcw,
  Check
} from 'lucide-react';

interface PeminjamanItem {
  id: string;
  inventarisId: string;
  namaPeminjam: string;
  noRumah: string | null;
  kontakPeminjam: string | null;
  jumlahPinjam: number;
  keperluan: string;
  tanggalPinjam: string;
  tanggalKembali: string | null;
  status: 'dipinjam' | 'dikembalikan';
  catatanKondisi: string | null;
}

interface InventarisItem {
  id: string;
  kodeBarang: string | null;
  namaBarang: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  kondisiBaik: number;
  kondisiRusak: number;
  lokasiSimpan: string | null;
  tahunPengadaan: number;
  sumberPerolehan: string;
  statusTahunIni: 'tetap' | 'bertambah_baru' | 'perbaikan' | 'afkir';
  keterangan: string | null;
  peminjaman?: PeminjamanItem[];
}

interface SummaryData {
  totalJenis: number;
  totalUnit: number;
  totalBaik: number;
  totalRusak: number;
  bertambahTahunIni: number;
}

const KATEGORI_OPTIONS = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'tenda_kursi', label: 'Tenda & Kursi' },
  { id: 'elektronik_sound', label: 'Sound & Elektronik' },
  { id: 'kebersihan', label: 'Alat Kebersihan' },
  { id: 'peralatan', label: 'Peralatan & Pertukangan' },
  { id: 'keamanan', label: 'Keamanan Lingkungan' },
];

export default function InventarisPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalJenis: 0,
    totalUnit: 0,
    totalBaik: 0,
    totalRusak: 0,
    bertambahTahunIni: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedKategori, setSelectedKategori] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'barang' | 'pinjam'>('barang');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPinjamModalOpen, setIsPinjamModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarisItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    kodeBarang: '',
    namaBarang: '',
    kategori: 'tenda_kursi',
    jumlah: 1,
    satuan: 'unit',
    kondisiBaik: 1,
    kondisiRusak: 0,
    lokasiSimpan: 'Gudang Balai RT',
    tahunPengadaan: new Date().getFullYear(),
    sumberPerolehan: 'Kas RT',
    statusTahunIni: 'tetap' as 'tetap' | 'bertambah_baru' | 'perbaikan' | 'afkir',
    keterangan: ''
  });

  // Pinjam Form State
  const [pinjamData, setPinjamData] = useState({
    inventarisId: '',
    namaPeminjam: '',
    noRumah: '',
    kontakPeminjam: '',
    jumlahPinjam: 1,
    keperluan: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    catatanKondisi: ''
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/inventaris?kategori=${selectedKategori}&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Gagal memuat inventaris');
      const json = await res.json();
      setItems(json.data || []);
      if (json.summary) {
        setSummary(json.summary);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memuat data inventaris', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKategori, searchQuery]);

  // Handle Add Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) {
      showToast('Nama barang wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/inventaris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan barang');

      showToast('Barang inventaris berhasil ditambahkan', 'success');
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Edit Item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await fetch('/api/inventaris', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          ...formData
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui');

      showToast('Data barang berhasil diperbarui', 'success');
      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini dari buku inventaris?')) return;
    try {
      const res = await fetch(`/api/inventaris?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Barang berhasil dihapus');
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus barang', 'error');
    }
  };

  // Handle Pinjam Submit
  const handleSavePinjam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinjamData.inventarisId || !pinjamData.namaPeminjam.trim() || !pinjamData.keperluan.trim()) {
      showToast('Barang, nama warga, dan keperluan wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/inventaris/pinjam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinjamData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mencatat peminjaman');

      showToast('Peminjaman barang berhasil dicatat', 'success');
      setIsPinjamModalOpen(false);
      setPinjamData({
        inventarisId: '',
        namaPeminjam: '',
        noRumah: '',
        kontakPeminjam: '',
        jumlahPinjam: 1,
        keperluan: '',
        tanggalPinjam: new Date().toISOString().split('T')[0],
        catatanKondisi: ''
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Kembalikan Barang
  const handleKembalikanBarang = async (peminjamanId: string) => {
    if (!confirm('Konfirmasi bahwa barang ini telah dikembalikan oleh peminjam?')) return;
    try {
      const res = await fetch('/api/inventaris/pinjam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kembalikan',
          peminjamanId
        })
      });
      if (!res.ok) throw new Error('Gagal mencatat pengembalian');
      showToast('Barang berhasil dikembalikan ke status tersedia', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      kodeBarang: '',
      namaBarang: '',
      kategori: 'tenda_kursi',
      jumlah: 1,
      satuan: 'unit',
      kondisiBaik: 1,
      kondisiRusak: 0,
      lokasiSimpan: 'Gudang Balai RT',
      tahunPengadaan: new Date().getFullYear(),
      sumberPerolehan: 'Kas RT',
      statusTahunIni: 'tetap',
      keterangan: ''
    });
  };

  const openEditModal = (item: InventarisItem) => {
    setSelectedItem(item);
    setFormData({
      kodeBarang: item.kodeBarang || '',
      namaBarang: item.namaBarang,
      kategori: item.kategori,
      jumlah: item.jumlah,
      satuan: item.satuan,
      kondisiBaik: item.kondisiBaik,
      kondisiRusak: item.kondisiRusak,
      lokasiSimpan: item.lokasiSimpan || 'Gudang Balai RT',
      tahunPengadaan: item.tahunPengadaan,
      sumberPerolehan: item.sumberPerolehan,
      statusTahunIni: item.statusTahunIni,
      keterangan: item.keterangan || ''
    });
    setIsEditModalOpen(true);
  };

  // Collect all peminjaman records for Tab 2
  const allPeminjaman = items.flatMap(i => 
    (i.peminjaman || []).map(p => ({ ...p, barangNama: i.namaBarang, barangSatuan: i.satuan }))
  ).sort((a, b) => new Date(b.tanggalPinjam).getTime() - new Date(a.tanggalPinjam).getTime());

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      <Sidebar activeMenu="Inventaris RT" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1">
          {/* Desktop 24-inch fluid container */}
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                    <Package className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                      Buku Inventaris & Aset Lingkungan RT
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">
                      Pencatatan barang milik warga, pengawasan kondisi fisik, aset bertambah tahunan, dan buku peminjaman.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('barang')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'barang'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Katalog Aset ({items.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pinjam')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pinjam'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Peminjaman Warga ({allPeminjaman.filter(p => p.status === 'dipinjam').length} Aktif)</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsPinjamModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-orange-200 bg-orange-50 text-[var(--brand-primary)] hover:bg-orange-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pinjamkan Barang</span>
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Aset Baru</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Aset RT</span>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xl font-bold text-slate-800">{summary.totalUnit}</h3>
                    <span className="text-xs text-slate-500">Unit ({summary.totalJenis} Jenis)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kondisi Baik</span>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xl font-bold text-emerald-600">{summary.totalBaik}</h3>
                    <span className="text-xs text-slate-500">Unit Siap Pakai</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Perlu Servis / Rusak</span>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xl font-bold text-amber-600">{summary.totalRusak}</h3>
                    <span className="text-xs text-slate-500">Unit Diperbaiki</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bertambah Tahun Ini</span>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xl font-bold text-blue-600">{summary.bertambahTahunIni}</h3>
                    <span className="text-xs text-slate-500">Unit Pengadaan Baru</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: DAFTAR BARANG INVENTARIS */}
            {activeTab === 'barang' && (
              <div className="space-y-4">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama barang, kode aset, lokasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {KATEGORI_OPTIONS.map((kat) => (
                      <button
                        key={kat.id}
                        onClick={() => setSelectedKategori(kat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          selectedKategori === kat.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {kat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                {isLoading ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
                    Memuat data aset inventaris...
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 space-y-2">
                    <p className="text-sm font-bold text-slate-600">Tidak ada barang inventaris yang sesuai</p>
                    <p className="text-xs text-slate-400">Silakan ubah filter kategori atau tambahkan barang baru.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((item) => {
                      const persenBaik = item.jumlah > 0 ? Math.round((item.kondisiBaik / item.jumlah) * 100) : 100;
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                {item.kodeBarang && (
                                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {item.kodeBarang}
                                  </span>
                                )}
                                <h3 className="text-sm font-bold text-slate-800 mt-1 leading-snug">
                                  {item.namaBarang}
                                </h3>
                              </div>

                              {item.statusTahunIni === 'bertambah_baru' && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  + Baru 2026
                                </span>
                              )}
                              {item.statusTahunIni === 'perbaikan' && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Perbaikan
                                </span>
                              )}
                            </div>

                            {/* Kondisi Bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-500">
                                  Total: <strong>{item.jumlah} {item.satuan}</strong>
                                </span>
                                <span className="text-slate-400">
                                  {item.kondisiBaik} Baik · {item.kondisiRusak} Rusak
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{ width: `${persenBaik}%` }}
                                  title={`${persenBaik}% Kondisi Baik`}
                                ></div>
                                <div
                                  className="bg-amber-400 h-full"
                                  style={{ width: `${100 - persenBaik}%` }}
                                  title={`${100 - persenBaik}% Perlu Perbaikan`}
                                ></div>
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Lokasi Simpan:</span>
                                <span className="font-medium text-slate-700">{item.lokasiSimpan || 'Balai RT'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Sumber & Tahun:</span>
                                <span className="font-medium text-slate-700">{item.sumberPerolehan} ({item.tahunPengadaan})</span>
                              </div>
                            </div>

                            {item.keterangan && (
                              <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl">
                                "{item.keterangan}"
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setPinjamData(prev => ({
                                  ...prev,
                                  inventarisId: item.id,
                                  jumlahPinjam: 1
                                }));
                                setIsPinjamModalOpen(true);
                              }}
                              className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pinjamkan</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                title="Edit data aset"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus dari inventaris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BUKU PEMINJAMAN WARGA */}
            {activeTab === 'pinjam' && (
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Riwayat Peminjaman Aset Warga</h3>
                    <p className="text-xs text-slate-400">Daftar peminjaman tenda, kursi, dan sound system untuk hajatan warga.</p>
                  </div>

                  <button
                    onClick={() => setIsPinjamModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Pinjam Baru</span>
                  </button>
                </div>

                {allPeminjaman.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Belum ada riwayat peminjaman aset yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-3">Tanggal Pinjam</th>
                          <th className="py-3 px-3">Nama Peminjam</th>
                          <th className="py-3 px-3">Barang & Jumlah</th>
                          <th className="py-3 px-3">Keperluan Acara</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {allPeminjaman.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-500">
                              {new Date(p.tanggalPinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800">
                              {p.namaPeminjam}
                              {p.noRumah && <span className="block text-[10px] font-normal text-slate-400">Rumah: {p.noRumah}</span>}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {p.jumlahPinjam} {p.barangSatuan} {p.barangNama}
                            </td>
                            <td className="py-3 px-3 text-slate-600 italic">
                              "{p.keperluan}"
                            </td>
                            <td className="py-3 px-3">
                              {p.status === 'dipinjam' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" />
                                  <span>Sedang Dipinjam</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 flex items-center gap-1 w-fit">
                                  <Check className="w-3 h-3" />
                                  <span>Telah Kembali</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {p.status === 'dipinjam' && (
                                <button
                                  onClick={() => handleKembalikanBarang(p.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                                >
                                  Tandai Kembali
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL 1: TAMBAH BARANG INVENTARIS BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--brand-primary)]" />
                Tambah Barang Inventaris Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Barang Aset</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tenda Terop Besi 4 x 6 Meter"
                  value={formData.namaBarang}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaBarang: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="tenda_kursi">Tenda & Kursi</option>
                    <option value="elektronik_sound">Sound & Elektronik</option>
                    <option value="kebersihan">Alat Kebersihan</option>
                    <option value="peralatan">Peralatan Pertukangan</option>
                    <option value="keamanan">Keamanan / Ronda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kode Barang (Opsional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AST-008"
                    value={formData.kodeBarang}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodeBarang: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jumlah Total</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.jumlah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFormData(prev => ({ ...prev, jumlah: val, kondisiBaik: val, kondisiRusak: 0 }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="unit / buah / set"
                    value={formData.satuan}
                    onChange={(e) => setFormData(prev => ({ ...prev, satuan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tahun Pengadaan</label>
                  <input
                    type="number"
                    value={formData.tahunPengadaan}
                    onChange={(e) => setFormData(prev => ({ ...prev, tahunPengadaan: parseInt(e.target.value) || 2026 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kondisi Baik</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kondisiBaik}
                    onChange={(e) => setFormData(prev => ({ ...prev, kondisiBaik: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-emerald-600 font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kondisi Rusak</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kondisiRusak}
                    onChange={(e) => setFormData(prev => ({ ...prev, kondisiRusak: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-amber-600 font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lokasi Penyimpanan</label>
                  <input
                    type="text"
                    placeholder="Gudang Balai RT"
                    value={formData.lokasiSimpan}
                    onChange={(e) => setFormData(prev => ({ ...prev, lokasiSimpan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status Perolehan Tahun Ini</label>
                  <select
                    value={formData.statusTahunIni}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, statusTahunIni: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="tetap">Tetap (Aset Lama)</option>
                    <option value="bertambah_baru">Bertambah Baru (Tahun Ini)</option>
                    <option value="perbaikan">Sedang Dalam Perbaikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Catatan Fisik</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kelengkapan perlengkapan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BARANG INVENTARIS */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-600" />
                Edit Data Aset Inventaris
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Barang Aset</label>
                <input
                  type="text"
                  required
                  value={formData.namaBarang}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaBarang: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="tenda_kursi">Tenda & Kursi</option>
                    <option value="elektronik_sound">Sound & Elektronik</option>
                    <option value="kebersihan">Alat Kebersihan</option>
                    <option value="peralatan">Peralatan Pertukangan</option>
                    <option value="keamanan">Keamanan / Ronda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    value={formData.kodeBarang}
                    onChange={(e) => setFormData(prev => ({ ...prev, kodeBarang: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jumlah Total</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.jumlah}
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kondisi Baik</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kondisiBaik}
                    onChange={(e) => setFormData(prev => ({ ...prev, kondisiBaik: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-emerald-600 font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kondisi Rusak</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kondisiRusak}
                    onChange={(e) => setFormData(prev => ({ ...prev, kondisiRusak: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-amber-600 font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lokasi Simpan</label>
                  <input
                    type="text"
                    value={formData.lokasiSimpan}
                    onChange={(e) => setFormData(prev => ({ ...prev, lokasiSimpan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status Perolehan Tahun Ini</label>
                  <select
                    value={formData.statusTahunIni}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, statusTahunIni: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="tetap">Tetap (Aset Lama)</option>
                    <option value="bertambah_baru">Bertambah Baru (Tahun Ini)</option>
                    <option value="perbaikan">Sedang Dalam Perbaikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold cursor-pointer"
                >
                  Perbarui Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PINJAMKAN BARANG KE WARGA */}
      {isPinjamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                Catat Peminjaman Barang Warga
              </h3>
              <button onClick={() => setIsPinjamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePinjam} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Pilih Barang yang Dipinjam</label>
                <select
                  required
                  value={pinjamData.inventarisId}
                  onChange={(e) => setPinjamData(prev => ({ ...prev, inventarisId: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                >
                  <option value="">-- Pilih Barang Inventaris --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.namaBarang} (Tersedia: {item.kondisiBaik} {item.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nama Peminjam (Warga)</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Joko Susanto"
                    value={pinjamData.namaPeminjam}
                    onChange={(e) => setPinjamData(prev => ({ ...prev, namaPeminjam: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">No. Rumah / Blok</label>
                  <input
                    type="text"
                    placeholder="Blok A-04"
                    value={pinjamData.noRumah}
                    onChange={(e) => setPinjamData(prev => ({ ...prev, noRumah: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jumlah yang Dipinjam</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pinjamData.jumlahPinjam}
                    onChange={(e) => setPinjamData(prev => ({ ...prev, jumlahPinjam: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Mulai Pinjam</label>
                  <input
                    type="date"
                    required
                    value={pinjamData.tanggalPinjam}
                    onChange={(e) => setPinjamData(prev => ({ ...prev, tanggalPinjam: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keperluan Acara / Hajatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tasyakuran khitanan keluarga di rumah"
                  value={pinjamData.keperluan}
                  onChange={(e) => setPinjamData(prev => ({ ...prev, keperluan: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPinjamModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold cursor-pointer"
                >
                  Catat Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
