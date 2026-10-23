'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Vote,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Building2,
  Lock,
  Unlock,
  Wallet,
  X,
  Search,
} from 'lucide-react';

interface VotingOpsiItem {
  id: string;
  urutan: number;
  judulOpsi: string;
  deskripsiOpsi?: string | null;
  perkiraanBiaya?: number;
  totalSuara: number;
  persentase: number;
}

interface VotingItem {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  tipeHakSuara: string;
  tipeKerahasiaan: string;
  status: string;
  kuorumPersen: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  estimasiBiaya?: number;
  lampiranUrl?: string | null;
  dibuatOleh: string;
  createdAt: string;
  totalTargetPemilih: number;
  totalSuaraMasuk: number;
  persentasePartisipasi: number;
  isKuorumTerpenuhi: boolean;
  isExpired: boolean;
  komentarCount: number;
  leadingOpsiId?: string | null;
  opsi: VotingOpsiItem[];
}

const KATEGORI_LABELS: Record<string, { label: string; color: string }> = {
  pembangunan: { label: 'Pembangunan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  keuangan: { label: 'Keuangan & Iuran', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  kegiatan: { label: 'Kegiatan & Acara', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  pemilihan_ketua: { label: 'Pemilihan Pengurus', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  kebijakan: { label: 'Tata Tertib', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  umum: { label: 'Umum', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function VotingPage() {
  const router = useRouter();
  const { user, role, hasRole } = useCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [votingList, setVotingList] = useState<VotingItem[]>([]);
  const [metaData, setMetaData] = useState({
    totalKK: 0,
    totalAnggota: 0,
    totalVotingAktif: 0,
    totalVotingSelesai: 0,
  });

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'selesai'>('all');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'pembangunan',
    tipeHakSuara: 'per_kk',
    tipeKerahasiaan: 'anonim',
    kuorumPersen: 50,
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: '',
    waktuSelesai: '23:59',
    estimasiBiaya: 0,
    opsi: [
      { judulOpsi: '', deskripsiOpsi: '', perkiraanBiaya: 0 },
      { judulOpsi: '', deskripsiOpsi: '', perkiraanBiaya: 0 },
    ],
  });

  const isPengurus = hasRole('SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS');
  const isMountedRef = useRef(true);

  // Fetch voting list
  const fetchVoting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/voting');
      if (res.ok) {
        const json = await res.json();
        if (!isMountedRef.current) return;
        setVotingList(json.data || []);
        if (json.meta) {
          setMetaData(json.meta);
        }
      }
    } catch (err) {
      console.error('Failed to fetch voting list', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchVoting();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filtered list
  const filteredVoting = useMemo(() => {
    return votingList.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (kategoriFilter !== 'all' && item.kategori !== kategoriFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.judul.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [votingList, statusFilter, kategoriFilter, searchQuery]);

  // Form option helpers
  const handleAddOpsi = () => {
    setFormData((prev) => ({
      ...prev,
      opsi: [...prev.opsi, { judulOpsi: '', deskripsiOpsi: '', perkiraanBiaya: 0 }],
    }));
  };

  const handleRemoveOpsi = (index: number) => {
    if (formData.opsi.length <= 2) return;
    setFormData((prev) => ({
      ...prev,
      opsi: prev.opsi.filter((_, i) => i !== index),
    }));
  };

  const handleOpsiChange = (index: number, field: string, val: string | number) => {
    setFormData((prev) => {
      const newOpsi = [...prev.opsi];
      newOpsi[index] = { ...newOpsi[index], [field]: val };
      return { ...prev, opsi: newOpsi };
    });
  };

  const handleSubmitVoting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.judul.trim()) {
      setFormError('Judul musyawarah wajib diisi');
      return;
    }

    if (!formData.deskripsi.trim()) {
      setFormError('Deskripsi / latar belakang wajib diisi');
      return;
    }

    if (!formData.tanggalSelesai) {
      setFormError('Batas akhir pemungutan suara wajib ditentukan');
      return;
    }

    const validOpsi = formData.opsi.filter((o) => o.judulOpsi.trim() !== '');
    if (validOpsi.length < 2) {
      setFormError('Harap isi minimal 2 pilihan opsi yang valid');
      return;
    }

    // Gabungkan tanggal dan jam selesai
    const fullEndDateTime = `${formData.tanggalSelesai}T${formData.waktuSelesai || '23:59'}:00`;

    setSubmitting(true);
    try {
      const res = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tanggalSelesai: new Date(fullEndDateTime).toISOString(),
          opsi: validOpsi,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan voting');
      }

      setIsModalOpen(false);
      // Reset form
      setFormData({
        judul: '',
        deskripsi: '',
        kategori: 'pembangunan',
        tipeHakSuara: 'per_kk',
        tipeKerahasiaan: 'anonim',
        kuorumPersen: 50,
        tanggalMulai: new Date().toISOString().split('T')[0],
        tanggalSelesai: '',
        waktuSelesai: '23:59',
        estimasiBiaya: 0,
        opsi: [
          { judulOpsi: '', deskripsiOpsi: '', perkiraanBiaya: 0 },
          { judulOpsi: '', deskripsiOpsi: '', perkiraanBiaya: 0 },
        ],
      });

      fetchVoting();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val?: number) => {
    if (!val || val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatSisaWaktu = (dateStr: string) => {
    const end = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Telah Selesai';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} hari ${hours} jam lagi`;
    }
    return `${hours} jam lagi`;
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased overflow-hidden font-sans">
      <Sidebar activeMenu="Musyawarah & Voting" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {/* Top Title & Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Vote className="w-5 h-5" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Musyawarah & Voting Warga
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pengambilan keputusan bersama yang transparan, terukur, dan menghormati kuorum musyawarah mufakat.
              </p>
            </div>

            {isPengurus && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-medium text-sm shadow-sm hover:opacity-95 active:scale-98 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Musyawarah Baru</span>
              </button>
            )}
          </div>

          {/* Bento Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Musyawarah Aktif</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{metaData.totalVotingAktif}</span>
                <span className="text-xs text-slate-400">agenda</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hak Suara (KK)</span>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{metaData.totalKK}</span>
                <span className="text-xs text-slate-400">Rumah / KK</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Warga Terdaftar</span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{metaData.totalAnggota}</span>
                <span className="text-xs text-slate-400">jiwa</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Arsip Keputusan</span>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{metaData.totalVotingSelesai}</span>
                <span className="text-xs text-slate-400">selesai</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Semua ({votingList.length})
              </button>
              <button
                onClick={() => setStatusFilter('aktif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'aktif'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sedang Berjalan ({votingList.filter((v) => v.status === 'aktif').length})
              </button>
              <button
                onClick={() => setStatusFilter('selesai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'selesai'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Selesai / Diarsipkan ({votingList.filter((v) => v.status === 'selesai').length})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category Select */}
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="pembangunan">Pembangunan</option>
                <option value="keuangan">Keuangan & Iuran</option>
                <option value="kegiatan">Kegiatan & Acara</option>
                <option value="pemilihan_ketua">Pemilihan Pengurus</option>
                <option value="kebijakan">Tata Tertib</option>
                <option value="umum">Umum</option>
              </select>

              {/* Search input */}
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari musyawarah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[var(--brand-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Voting Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 animate-pulse h-64" />
              ))}
            </div>
          ) : filteredVoting.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
              <Vote className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Belum Ada Musyawarah</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || kategoriFilter !== 'all'
                  ? 'Tidak ada voting yang cocok dengan filter yang dipilih.'
                  : 'Belum ada agenda musyawarah voting yang dibuka oleh pengurus.'}
              </p>
              {isPengurus && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Musyawarah Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {filteredVoting.map((item) => {
                const kategoriMeta = KATEGORI_LABELS[item.kategori] || KATEGORI_LABELS.umum;
                const isAktif = item.status === 'aktif';

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-[var(--brand-primary)]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${kategoriMeta.color}`}>
                            {kategoriMeta.label}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            {item.tipeKerahasiaan === 'anonim' ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Suara Rahasia</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Terbuka</span>
                              </>
                            )}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {item.tipeHakSuara === 'per_kk' ? '1 KK 1 Suara' : '1 Warga 1 Suara'}
                          </span>
                        </div>

                        {isAktif ? (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 animate-pulse" />
                            {formatSisaWaktu(item.tanggalSelesai)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full shrink-0">
                            Selesai
                          </span>
                        )}
                      </div>

                      {/* Judul & Deskripsi */}
                      <Link href={`/voting/${item.id}`} className="group block">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">
                          {item.judul}
                        </h2>
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.deskripsi}
                      </p>

                      {/* Estimasi Biaya Kas (Jika ada) */}
                      {item.estimasiBiaya && item.estimasiBiaya > 0 ? (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                          <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                            <Wallet className="w-3.5 h-3.5" />
                            Estimasi Beban Kas RT:
                          </span>
                          <span className="font-bold text-amber-900 dark:text-amber-200">
                            {formatRupiah(item.estimasiBiaya)}
                          </span>
                        </div>
                      ) : null}

                      {/* Quorum Progress Meter */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Partisipasi: {item.totalSuaraMasuk} dari {item.totalTargetPemilih} {item.tipeHakSuara === 'per_kk' ? 'KK' : 'Warga'} ({item.persentasePartisipasi}%)
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              item.isKuorumTerpenuhi
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.isKuorumTerpenuhi ? 'Kuorum Terpenuhi' : `Target Min ${item.kuorumPersen}%`}
                          </span>
                        </div>

                        {/* Progress Bar with Quorum Threshold Marker */}
                        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              item.isKuorumTerpenuhi ? 'bg-emerald-500' : 'bg-[var(--brand-primary)]'
                            }`}
                            style={{ width: `${Math.min(100, item.persentasePartisipasi)}%` }}
                          />
                        </div>
                      </div>

                      {/* Top Options Preview */}
                      <div className="mt-3 space-y-1.5">
                        {item.opsi.slice(0, 2).map((op) => (
                          <div
                            key={op.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                          >
                            <span className="truncate pr-2 text-slate-700 dark:text-slate-300 font-medium">
                              {op.judulOpsi}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                              {op.totalSuara} suara ({op.persentase}%)
                            </span>
                          </div>
                        ))}
                        {item.opsi.length > 2 && (
                          <p className="text-[11px] text-slate-400 text-right">+{item.opsi.length - 2} pilihan opsi lainnya</p>
                        )}
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {item.komentarCount > 0 ? `${item.komentarCount} aspirasi warga` : 'Belum ada aspirasi'}
                      </span>

                      <Link
                        href={`/voting/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 active:scale-98 transition-all"
                      >
                        <span>{isAktif ? 'Masuk Bilik Suara' : 'Lihat Rekapitulasi'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <MobileNavBar />
      </div>

      {/* Modal Buka Musyawarah Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Vote className="w-5 h-5" />
                </span>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  Buka Musyawarah / Voting Baru
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitVoting} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Musyawarah / Agenda Voting *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Palang Pintu Otomatis & CCTV Lingkungan"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm focus:border-[var(--brand-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Latar Belakang & Penjelasan Masalah *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan secara ringkas mengapa keputusan ini diperlukan dan dasar pertimbangannya..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm focus:border-[var(--brand-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Agenda
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  >
                    <option value="pembangunan">Pembangunan Sarana RT</option>
                    <option value="keuangan">Keuangan & Iuran</option>
                    <option value="kegiatan">Kegiatan & Acara Warga</option>
                    <option value="pemilihan_ketua">Pemilihan Pengurus / Ketua</option>
                    <option value="kebijakan">Tata Tertib & Kebijakan</option>
                    <option value="umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Beban Kas RT (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    placeholder="Rp 0"
                    value={formData.estimasiBiaya || ''}
                    onChange={(e) => setFormData({ ...formData, estimasiBiaya: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Basis Hak Suara
                  </label>
                  <select
                    value={formData.tipeHakSuara}
                    onChange={(e) => setFormData({ ...formData, tipeHakSuara: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  >
                    <option value="per_kk">1 Suara per KK / Rumah</option>
                    <option value="per_warga">1 Suara per Warga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kerahasiaan Suara
                  </label>
                  <select
                    value={formData.tipeKerahasiaan}
                    onChange={(e) => setFormData({ ...formData, tipeKerahasiaan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  >
                    <option value="anonim">Anonim / Rahasia (Pilihan Privat)</option>
                    <option value="terbuka">Terbuka (Musyawarah Mufakat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Kuorum Sah (%)
                  </label>
                  <select
                    value={formData.kuorumPersen}
                    onChange={(e) => setFormData({ ...formData, kuorumPersen: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  >
                    <option value={30}>Min. 30% Partisipasi</option>
                    <option value={50}>Min. 50% Partisipasi (Standar)</option>
                    <option value={66}>Min. 66% (Dua Pertiga)</option>
                    <option value={75}>Min. 75% (Tiga Perempat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Akhir Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.tanggalSelesai}
                    onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.waktuSelesai}
                    onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Opsi Pilihan Musyawarah */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pilihan Opsi Suara (Min. 2 Pilihan) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOpsi}
                    className="text-xs font-medium text-[var(--brand-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Opsi</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.opsi.map((op, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">Pilihan #{idx + 1}</span>
                        {formData.opsi.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOpsi(idx)}
                            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={`Judul Opsi (misal: "Opsi ${String.fromCharCode(65 + idx)}: Pasang Portal Otomatis RFID")`}
                        value={op.judulOpsi}
                        onChange={(e) => handleOpsiChange(idx, 'judulOpsi', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:border-[var(--brand-primary)] outline-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Keterangan singkat / rincian kelebihan..."
                          value={op.deskripsiOpsi}
                          onChange={(e) => handleOpsiChange(idx, 'deskripsiOpsi', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                        />
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          placeholder="Estimasi Biaya Opsi (Rp)"
                          value={op.perkiraanBiaya || ''}
                          onChange={(e) => handleOpsiChange(idx, 'perkiraanBiaya', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-medium shadow-xs hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Musyawarah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
