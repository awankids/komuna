'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Home, 
  ArrowRight, 
  FileText, 
  Calendar,
  Building,
  Shield,
  Briefcase,
  Award,
  ChevronRight
} from 'lucide-react';

interface AnggotaOption {
  id: string;
  nama: string;
  noRumah: string;
  noHp: string | null;
}

interface PengurusItem {
  id: string;
  jabatan: string;
  kategori: string; // 'inti' | 'seksi'
  nama: string;
  nik: string | null;
  noHp: string | null;
  alamatRumah: string | null;
  anggotaId: string | null;
  urutan: number;
  periode: string | null;
  statusAktif: boolean;
  keterangan: string | null;
  anggota?: AnggotaOption | null;
}

export default function PengurusPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pengurusList, setPengurusList] = useState<PengurusItem[]>([]);
  const [anggotaOptions, setAnggotaOptions] = useState<AnggotaOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // App & Org Config
  const [appConfig, setAppConfig] = useState({
    namaApp: 'komuna.id',
    namaRt: 'RT 04',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    kotaWilayah: 'Semarang',
    nomorSk: '',
    periodeAktif: '2024 - 2029',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PengurusItem | null>(null);
  const [formData, setFormData] = useState({
    jabatan: '',
    kategori: 'inti',
    nama: '',
    nik: '',
    noHp: '',
    alamatRumah: '',
    anggotaId: '',
    urutan: 1,
    periode: '2024 - 2029',
    statusAktif: true,
    keterangan: '',
  });

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<PengurusItem | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Pengurus & Config
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pengurusRes, configRes, anggotaRes] = await Promise.all([
        fetch('/api/pengurus'),
        fetch('/api/config'),
        fetch('/api/anggota')
      ]);

      if (pengurusRes.ok) {
        const json = await pengurusRes.json();
        setPengurusList(json.data || []);
      }

      if (configRes.ok) {
        const json = await configRes.json();
        setAppConfig(prev => ({
          ...prev,
          ...json,
          kotaWilayah: json.kotaWilayah || 'Semarang',
          periodeAktif: json.periodeAktif || '2024 - 2029',
          nomorSk: json.nomorSk || ''
        }));
      }

      if (anggotaRes.ok) {
        const json = await anggotaRes.json();
        setAnggotaOptions(json.data || json || []);
      }
    } catch (err) {
      console.error('Error fetching pengurus data:', err);
      showToast('Gagal memuat data pengurus', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    const nextUrutan = pengurusList.length > 0 ? Math.max(...pengurusList.map(p => p.urutan)) + 1 : 1;
    setFormData({
      jabatan: '',
      kategori: 'seksi',
      nama: '',
      nik: '',
      noHp: '',
      alamatRumah: '',
      anggotaId: '',
      urutan: nextUrutan,
      periode: appConfig.periodeAktif || '2024 - 2029',
      statusAktif: true,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: PengurusItem) => {
    setEditingItem(item);
    setFormData({
      jabatan: item.jabatan,
      kategori: item.kategori,
      nama: item.nama,
      nik: item.nik || '',
      noHp: item.noHp || '',
      alamatRumah: item.alamatRumah || '',
      anggotaId: item.anggotaId || '',
      urutan: item.urutan,
      periode: item.periode || appConfig.periodeAktif || '2024 - 2029',
      statusAktif: item.statusAktif,
      keterangan: item.keterangan || '',
    });
    setIsModalOpen(true);
  };

  // Select from Anggota dropdown to auto-fill
  const handleSelectAnggota = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({ ...prev, anggotaId: '' }));
      return;
    }

    const found = anggotaOptions.find(a => a.id === selectedId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        anggotaId: found.id,
        nama: found.nama,
        alamatRumah: found.noRumah ? `No. ${found.noRumah}` : prev.alamatRumah,
        noHp: found.noHp || prev.noHp
      }));
    }
  };

  // Submit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jabatan.trim() || !formData.nama.trim()) {
      showToast('Jabatan dan Nama pengurus wajib diisi', 'error');
      return;
    }

    try {
      const isEdit = !!editingItem;
      const url = '/api/pengurus';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { ...formData, id: editingItem.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Gagal menyimpan');

      showToast(isEdit ? 'Data pengurus berhasil diperbarui' : 'Pengurus baru berhasil ditambahkan');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menyimpan data', 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/pengurus?id=${deleteTarget.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus');

      showToast('Pengurus berhasil dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus data pengurus', 'error');
    }
  };

  // Grouping
  const pengurusInti = pengurusList.filter(p => p.kategori === 'inti');
  const pengurusSeksi = pengurusList.filter(p => p.kategori === 'seksi');

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border border-slate-200 bg-white text-slate-800 animate-in fade-in slide-in-from-top-4">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeMenu="Susunan Pengurus" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {/* Print Stylesheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
                font-family: 'Times New Roman', Times, serif !important;
              }
              .no-print, header, aside, nav, .sidebar-container, .mobile-navbar, button {
                display: none !important;
              }
              #print-bagan {
                display: block !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .page-break {
                page-break-after: always;
              }
            }
            @media screen {
              #print-bagan {
                display: none;
              }
            }
          `}} />

          {/* Desktop 24-inch fluid container */}
          <div className="no-print max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                      Susunan Pengurus RT
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">
                      Legalitas, struktur organisasi, dan pejabat penandatangan resmi laporan kas & surat warga.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/laporan"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition shadow-xs"
                >
                  <FileText className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Ke Halaman Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Cetak Bagan A4</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengurus</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Cards (Bento Highlights) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400">Ketua RT Aktif</p>
                  <p className="text-sm md:text-base font-bold text-slate-800 truncate">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || 'Belum Ditentukan'}
                  </p>
                  <span className="text-[10px] text-[var(--brand-primary)] font-semibold">Penandatangan Dokumen</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400">Bendahara RT Aktif</p>
                  <p className="text-sm md:text-base font-bold text-slate-800 truncate">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || 'Belum Ditentukan'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Penandatangan Kas</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400">Periode Masa Bakti</p>
                  <p className="text-sm md:text-base font-bold text-slate-800">
                    {appConfig.periodeAktif || '2024 - 2029'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">{appConfig.kotaWilayah}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400">Total Personil</p>
                  <p className="text-sm md:text-base font-bold text-slate-800">
                    {pengurusList.length} Orang
                  </p>
                  <span className="text-[10px] text-purple-600 font-semibold">
                    {pengurusInti.length} Inti • {pengurusSeksi.length} Seksi
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Grid: Pengurus Inti & Koordinator Seksi */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column (8 cols): Pengurus Inti & Seksi Lists */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Section: Pengurus Inti */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-50 text-[var(--brand-primary)]">
                        <Award className="w-4 h-4" />
                      </span>
                      <h2 className="text-sm md:text-base font-bold text-slate-800">
                        Pengurus Inti RT (Executive Board)
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      {pengurusInti.length} Pejabat
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {pengurusInti.map((item) => {
                      const isKetua = item.jabatan.toLowerCase().includes('ketua');
                      const isBendahara = item.jabatan.toLowerCase().includes('bendahara');
                      const isSekretaris = item.jabatan.toLowerCase().includes('sekretaris');

                      return (
                        <div 
                          key={item.id}
                          className="relative group p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition shadow-xs text-left"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isKetua 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : isBendahara 
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isSekretaris
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {item.jabatan}
                                </span>
                                {(isKetua || isBendahara) && (
                                  <span className="text-[10px] font-semibold text-[var(--brand-primary)] flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3" />
                                    Penandatangan
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 mt-1">
                                {item.nama}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand-primary)] hover:bg-orange-50 transition cursor-pointer"
                                title="Edit Pengurus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Pengurus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-xs text-slate-500">
                            {item.alamatRumah && (
                              <div className="flex items-center gap-1.5">
                                <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{item.alamatRumah}</span>
                              </div>
                            )}
                            {item.noHp && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <a 
                                  href={`https://wa.me/${item.noHp.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[var(--brand-primary)] hover:underline font-medium"
                                >
                                  {item.noHp}
                                </a>
                              </div>
                            )}
                            {item.keterangan && (
                              <p className="text-[11px] italic text-slate-400 pt-1">
                                "{item.keterangan}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Seksi & Koordinator Bidang */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Users className="w-4 h-4" />
                      </span>
                      <h2 className="text-sm md:text-base font-bold text-slate-800">
                        Koordinator Seksi & Bidang Operasional
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      {pengurusSeksi.length} Seksi
                    </span>
                  </div>

                  {pengurusSeksi.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Belum ada seksi bidang yang ditambahkan. Klik tombol "+ Tambah Pengurus" di atas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {pengurusSeksi.map((item) => (
                        <div 
                          key={item.id}
                          className="relative p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition shadow-xs text-left"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                {item.jabatan}
                              </span>
                              <h3 className="text-sm font-bold text-slate-800 mt-1">
                                {item.nama}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                title="Edit Pengurus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Pengurus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-xs text-slate-500">
                            {item.alamatRumah && (
                              <div className="flex items-center gap-1.5">
                                <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{item.alamatRumah}</span>
                              </div>
                            )}
                            {item.noHp && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <a 
                                  href={`https://wa.me/${item.noHp.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline font-medium"
                                >
                                  {item.noHp}
                                </a>
                              </div>
                            )}
                            {item.keterangan && (
                              <p className="text-[11px] italic text-slate-400 pt-1">
                                "{item.keterangan}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (4 cols): Bagan Organisasi Simulator & Info Legalitas */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Bagan Struktur Visual Mini */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[var(--brand-primary)]" />
                      Bagan Hierarki Organisasi
                    </h3>
                    <span className="text-[11px] text-[var(--brand-primary)] font-semibold">
                      Preview
                    </span>
                  </div>

                  {/* Flow Tree Representation */}
                  <div className="space-y-3 text-center text-xs">
                    {/* Level 1: Ketua RT */}
                    <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Ketua RT</p>
                      <p className="text-xs font-bold text-slate-800">
                        {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '-'}
                      </p>
                    </div>

                    <div className="w-0.5 h-3 bg-slate-300 mx-auto"></div>

                    {/* Level 2: Sekretaris & Bendahara */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Sekretaris</p>
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '-'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Bendahara</p>
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="w-0.5 h-3 bg-slate-300 mx-auto"></div>

                    {/* Level 3: Seksi-seksi */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Koordinator Seksi Bidang
                      </p>
                      <div className="space-y-1 text-left text-[11px]">
                        {pengurusSeksi.slice(0, 4).map((s) => (
                          <div key={s.id} className="flex justify-between items-center text-slate-600">
                            <span className="truncate pr-2">{s.jabatan}:</span>
                            <span className="font-semibold text-slate-800 truncate">{s.nama}</span>
                          </div>
                        ))}
                        {pengurusSeksi.length > 4 && (
                          <p className="text-[10px] text-center text-slate-400 pt-1">
                            +{pengurusSeksi.length - 4} Seksi lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-[var(--brand-primary)] bg-orange-50 border border-orange-200 hover:bg-orange-100 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Lembar Struktur A4</span>
                    </button>
                  </div>
                </div>

                {/* Legalitas & SK Info Box */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-3 text-left">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Status Legalitas Dokumen
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Nama Ketua RT dan Bendahara pada daftar ini otomatis digunakan sebagai pejabat penandatangan resmi di modul 
                    <strong> Laporan Kas Bulanan</strong> dan <strong>Surat Pengantar Warga</strong>.
                  </p>
                  
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Kop RT:</span>
                      <span className="font-bold text-slate-800">{appConfig.namaRt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Kota / Wilayah:</span>
                      <span className="font-bold text-slate-800">{appConfig.kotaWilayah}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Masa Bakti:</span>
                      <span className="font-bold text-slate-800">{appConfig.periodeAktif}</span>
                    </div>
                  </div>

                  <Link
                    href="/pengaturan"
                    className="flex items-center justify-between text-xs font-bold text-[var(--brand-primary)] hover:underline pt-1"
                  >
                    <span>Ubah Info Wilayah & SK di Pengaturan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>

            </div>

          </div>

          {/* ================================================================ */}
          {/* PRINTABLE A4 BAGAN ORGANISASI PENGURUS RT                        */}
          {/* ================================================================ */}
          <div id="print-bagan" className="p-8 max-w-[800px] mx-auto text-black bg-white">
            {/* Kop Surat Resmi */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h2 className="text-xl font-bold tracking-wider uppercase">PAGUYUBAN WARGA {appConfig.namaRt.toUpperCase()}</h2>
              <p className="text-sm font-medium">WILAYAH KELURAHAN KOTA {appConfig.kotaWilayah.toUpperCase()}</p>
              <p className="text-xs italic text-gray-700">Masa Bakti Kepengurusan Periode: {appConfig.periodeAktif || '2024 - 2029'}</p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-lg font-bold uppercase underline tracking-wide">STRUKTUR SUSUNAN PENGURUS RT</h1>
              <p className="text-xs text-gray-700 mt-1">Ditetapkan berdasarkan musyawarah warga dan legalitas kepengurusan RT setempat</p>
            </div>

            {/* Hierarchical Structure Chart */}
            <div className="space-y-6">
              {/* Ketua RT Box */}
              <div className="max-w-[280px] mx-auto p-4 border-2 border-black text-center rounded-lg bg-gray-50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">KETUA RT</p>
                <p className="text-base font-bold text-black mt-1">
                  {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '-'}
                </p>
                <p className="text-[11px] text-gray-600">
                  {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.alamatRumah || ''}
                </p>
              </div>

              {/* Line connector */}
              <div className="w-0.5 h-6 bg-black mx-auto"></div>

              {/* Sekretaris & Bendahara */}
              <div className="grid grid-cols-2 gap-8 max-w-[560px] mx-auto">
                <div className="p-3 border-2 border-black text-center rounded-lg bg-gray-50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">SEKRETARIS</p>
                  <p className="text-sm font-bold text-black mt-1">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '-'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.alamatRumah || ''}
                  </p>
                </div>

                <div className="p-3 border-2 border-black text-center rounded-lg bg-gray-50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">BENDAHARA</p>
                  <p className="text-sm font-bold text-black mt-1">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || '-'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.alamatRumah || ''}
                  </p>
                </div>
              </div>

              {/* Line connector */}
              <div className="w-0.5 h-6 bg-black mx-auto"></div>

              {/* Koordinator Seksi */}
              <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                <p className="text-xs font-bold uppercase tracking-wider text-center text-gray-800 mb-3">
                  KOORDINATOR SEKSI & BIDANG KERJA
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {pengurusSeksi.map((s) => (
                    <div key={s.id} className="p-2 border border-gray-400 rounded bg-white">
                      <p className="font-bold text-gray-800 uppercase text-[10px]">{s.jabatan}</p>
                      <p className="font-semibold text-black">{s.nama}</p>
                      {s.noHp && <p className="text-[10px] text-gray-600">WA: {s.noHp}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-12 flex justify-between items-end text-xs">
              <div className="text-center w-52">
                <p>Mengetahui,</p>
                <p className="font-bold">Sekretaris RT</p>
                <div className="h-16"></div>
                <p className="font-bold underline">
                  {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '(....................................)'}
                </p>
              </div>

              <div className="text-center w-52">
                <p>{appConfig.kotaWilayah}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Ketua {appConfig.namaRt}</p>
                <div className="h-16"></div>
                <p className="font-bold underline">
                  {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '(....................................)'}
                </p>
              </div>
            </div>
          </div>

        </main>

        <MobileNavBar />
      </div>

      {/* ================================================================ */}
      {/* MODAL TAMBAH / EDIT PENGURUS                                     */}
      {/* ================================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 text-left">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-orange-50 text-[var(--brand-primary)]">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingItem ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Struktur kepengurusan dan legalitas dokumen RT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-left">
              
              {/* Autocomplete from Anggota */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Pilih dari Warga Terdaftar (Opsional)
                </label>
                <select
                  value={formData.anggotaId}
                  onChange={handleSelectAnggota}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                >
                  <option value="">-- Ketik Manual / Pilih Warga --</option>
                  {anggotaOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama} (No. {w.noRumah})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Memilih warga akan otomatis mengisi Nama, No Rumah, dan Kontak.
                </p>
              </div>

              {/* Jabatan & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ketua RT / Bendahara"
                    value={formData.jabatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Kategori Pengurus
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  >
                    <option value="inti">Pengurus Inti (Ketua / Sekr / Bend)</option>
                    <option value="seksi">Seksi & Koordinator Lapangan</option>
                  </select>
                </div>
              </div>

              {/* Nama & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Bambang Sutrisno"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    NIK (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="3374..."
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* No HP & Alamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="081234..."
                    value={formData.noHp}
                    onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Alamat / No. Rumah
                  </label>
                  <input
                    type="text"
                    placeholder="Blok A No. 04"
                    value={formData.alamatRumah}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamatRumah: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Urutan & Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutan}
                    onChange={(e) => setFormData(prev => ({ ...prev, urutan: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">1: Ketua, 2: Wakil/Sekr, 3: Bendahara, dst.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Masa Bakti (Periode)
                  </label>
                  <input
                    type="text"
                    placeholder="2024 - 2029"
                    value={formData.periode}
                    onChange={(e) => setFormData(prev => ({ ...prev, periode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Keterangan / Tugas Pokok
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Penandatangan Dokumen Resmi & Legalitas RT"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formData.statusAktif}
                  onChange={(e) => setFormData(prev => ({ ...prev, statusAktif: e.target.checked }))}
                  className="rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="statusAktif" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Status Pengurus Aktif
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] rounded-xl shadow-sm transition cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Pengurus'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL KONFIRMASI HAPUS                                           */}
      {/* ================================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Hapus Pejabat Pengurus?
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.nama}</strong> ({deleteTarget.jabatan}) dari susunan pengurus?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
