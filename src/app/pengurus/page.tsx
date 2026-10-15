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
  ExternalLink, 
  FileText, 
  Calendar,
  Building,
  User,
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-4">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeMenu="Susunan Pengurus" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Susunan Pengurus RT
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                      Legalitas, struktur organisasi, dan pejabat penandatangan resmi laporan kas & surat warga.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/laporan"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Ke Halaman Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Cetak Bagan A4</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengurus</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Cards (Bento Highlights) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ketua RT Aktif</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || 'Belum Ditentukan'}
                  </p>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Penandatangan Dokumen</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bendahara RT Aktif</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
                    {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || 'Belum Ditentukan'}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Penandatangan Kas</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Periode Masa Bakti</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                    {appConfig.periodeAktif || '2024 - 2029'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">{appConfig.kotaWilayah}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Personil</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                    {pengurusList.length} Orang
                  </p>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                        <Award className="w-4 h-4" />
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Pengurus Inti RT (Executive Board)
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
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
                          className="relative group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isKetua 
                                    ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300' 
                                    : isBendahara 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                    : isSekretaris
                                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {item.jabatan}
                                </span>
                                {(isKetua || isBendahara) && (
                                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3" />
                                    Penandatangan
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                {item.nama}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                                title="Edit Pengurus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                title="Hapus Pengurus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
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
                                  className="text-teal-600 dark:text-teal-400 hover:underline"
                                >
                                  {item.noHp}
                                </a>
                              </div>
                            )}
                            {item.keterangan && (
                              <p className="text-[11px] italic text-slate-400 dark:text-slate-500 pt-1">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Koordinator Seksi & Bidang Operasional
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {pengurusSeksi.length} Seksi
                    </span>
                  </div>

                  {pengurusSeksi.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                      Belum ada seksi bidang yang ditambahkan. Klik tombol "+ Tambah Pengurus" di atas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {pengurusSeksi.map((item) => (
                        <div 
                          key={item.id}
                          className="relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                {item.jabatan}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                {item.nama}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                title="Edit Pengurus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                title="Hapus Pengurus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
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
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  {item.noHp}
                                </a>
                              </div>
                            )}
                            {item.keterangan && (
                              <p className="text-[11px] italic text-slate-400 dark:text-slate-500 pt-1">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Bagan Hierarki Organisasi
                    </h3>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                      Preview
                    </span>
                  </div>

                  {/* Flow Tree Representation */}
                  <div className="space-y-3 text-center text-xs">
                    {/* Level 1: Ketua RT */}
                    <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Ketua RT</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '-'}
                      </p>
                    </div>

                    <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 mx-auto"></div>

                    {/* Level 2: Sekretaris & Bendahara */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Sekretaris</p>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                          {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '-'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Bendahara</p>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                          {pengurusList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 mx-auto"></div>

                    {/* Level 3: Seksi-seksi */}
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Koordinator Seksi Bidang
                      </p>
                      <div className="space-y-1 text-left text-[11px]">
                        {pengurusSeksi.slice(0, 4).map((s) => (
                          <div key={s.id} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span className="truncate pr-2">{s.jabatan}:</span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{s.nama}</span>
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Lembar Struktur A4</span>
                    </button>
                  </div>
                </div>

                {/* Legalitas & SK Info Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Status Legalitas Dokumen
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Nama Ketua RT dan Bendahara pada daftar ini otomatis digunakan sebagai pejabat penandatangan resmi di modul 
                    <strong> Laporan Kas Bulanan</strong> dan <strong>Surat Pengantar Warga</strong>.
                  </p>
                  
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kop RT:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{appConfig.namaRt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kota / Wilayah:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{appConfig.kotaWilayah}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Masa Bakti:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{appConfig.periodeAktif}</span>
                    </div>
                  </div>

                  <Link
                    href="/pengaturan"
                    className="flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline pt-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Struktur kepengurusan dan legalitas dokumen RT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Autocomplete from Anggota */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih dari Warga Terdaftar (Opsional)
                </label>
                <select
                  value={formData.anggotaId}
                  onChange={handleSelectAnggota}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ketua RT / Bendahara"
                    value={formData.jabatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Pengurus
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="inti">Pengurus Inti (Ketua / Sekr / Bend)</option>
                    <option value="seksi">Seksi & Koordinator Lapangan</option>
                  </select>
                </div>
              </div>

              {/* Nama & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Bambang Sutrisno"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIK (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="3374..."
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* No HP & Alamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="081234..."
                    value={formData.noHp}
                    onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat / No. Rumah
                  </label>
                  <input
                    type="text"
                    placeholder="Blok A No. 04"
                    value={formData.alamatRumah}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamatRumah: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Urutan & Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutan}
                    onChange={(e) => setFormData(prev => ({ ...prev, urutan: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">1: Ketua, 2: Wakil/Sekr, 3: Bendahara, dst.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Masa Bakti (Periode)
                  </label>
                  <input
                    type="text"
                    placeholder="2024 - 2029"
                    value={formData.periode}
                    onChange={(e) => setFormData(prev => ({ ...prev, periode: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Tugas Pokok
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Penandatangan Dokumen Resmi & Legalitas RT"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={formData.statusAktif}
                  onChange={(e) => setFormData(prev => ({ ...prev, statusAktif: e.target.checked }))}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="statusAktif" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Status Pengurus Aktif
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Pejabat Pengurus?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.nama}</strong> ({deleteTarget.jabatan}) dari susunan pengurus?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
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
