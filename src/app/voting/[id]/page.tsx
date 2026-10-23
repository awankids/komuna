'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Vote,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  Unlock,
  Share2,
  Printer,
  MessageSquare,
  Send,
  Check,
  UserCheck,
  Trophy,
  X,
  PhoneCall,
  BarChart3,
} from 'lucide-react';

interface OpsiDetail {
  id: string;
  urutan: number;
  judulOpsi: string;
  deskripsiOpsi?: string | null;
  gambarUrl?: string | null;
  perkiraanBiaya?: number;
  totalSuara: number;
  persentase: number;
  pemilih?: Array<{
    id: string;
    namaPemilih: string;
    noRumah?: string | null;
    alasanMemilih?: string | null;
    waktuVote: string;
  }>;
}

interface KomentarItem {
  id: string;
  namaPengirim: string;
  rolePengirim?: string | null;
  pesan: string;
  createdAt: string;
}

interface VotingDetail {
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
  leadingOpsiId?: string | null;
  saldoKasSaatIni: number;
  persentaseBebanKas: number;
  opsi: OpsiDetail[];
  komentar: KomentarItem[];
  currentUserVote: {
    hasVoted: boolean;
    vote?: {
      id: string;
      opsiId: string;
      waktuVote: string;
      alasanMemilih?: string | null;
    } | null;
    anggotaTerdaftar?: {
      id: string;
      nama: string;
      noRumah: string;
    } | null;
  };
}

interface PartisipasiItem {
  id: string;
  nama: string;
  noRumah: string;
  noHp?: string | null;
  statusKeluarga?: string;
  rombongan?: string;
  hasVoted: boolean;
  waktuVote?: string | null;
  dicatatOleh?: string | null;
  alasanMemilih?: string | null;
  pilihanOpsi?: string | null;
}

interface PartisipasiData {
  tipeHakSuara: string;
  tipeKerahasiaan: string;
  totalTarget: number;
  totalSudah: number;
  totalBelum: number;
  persentase: number;
  daftar: PartisipasiItem[];
}

interface BeritaAcaraPayload {
  komunitas: {
    nama: string;
    noRt: string;
    noRw: string;
    desaKelurahan: string;
    kecamatan: string;
    kotaKabupaten: string;
    ketuaRT: string;
  };
  voting: {
    id: string;
    judul: string;
    deskripsi: string;
    kategori: string;
    tipeHakSuara: string;
    tipeKerahasiaan: string;
    status: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    kuorumPersen: number;
    totalTarget: number;
    totalSuaraMasuk: number;
    persentasePartisipasi: number;
    isSah: boolean;
    statusKuorumTeks: string;
    pemenang?: {
      id: string;
      judulOpsi: string;
      totalSuara: number;
      persentase: number;
    } | null;
    rincianOpsi: Array<{
      id: string;
      urutan: number;
      judulOpsi: string;
      totalSuara: number;
      persentase: number;
      perkiraanBiaya?: number;
    }>;
  };
  tanggalCetak: string;
}

const normalizeIndonesianPhone = (raw?: string | null): string => {
  if (!raw) return '';
  const clean = raw.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) return clean;
  if (clean.startsWith('0')) return '62' + clean.slice(1);
  if (clean.startsWith('8')) return '62' + clean;
  return clean;
};

export default function VotingDetailPage() {
  const params = useParams();
  const votingId = params?.id as string;
  const router = useRouter();

  const { user, role, hasRole } = useCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<VotingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Tab active: 'bilik' | 'partisipasi' | 'aspirasi'
  const [activeTab, setActiveTab] = useState<'bilik' | 'partisipasi' | 'aspirasi'>('bilik');

  // Voting action states
  const [selectedOpsiId, setSelectedOpsiId] = useState<string>('');
  const [alasanMemilih, setAlasanMemilih] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [votingSubmitting, setVotingSubmitting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');
  const isSubmittingVoteRef = useRef(false);

  // Mode Bantuan Pengurus
  const [isBantuWargaMode, setIsBantuWargaMode] = useState(false);
  const [selectedBantuAnggotaId, setSelectedBantuAnggotaId] = useState('');

  // Partisipasi data states
  const [partisipasi, setPartisipasi] = useState<PartisipasiData | null>(null);
  const [loadingPartisipasi, setLoadingPartisipasi] = useState(false);
  const [filterPartisipasiStatus, setFilterPartisipasiStatus] = useState<'all' | 'sudah' | 'belum'>('all');
  const [searchPartisipasi, setSearchPartisipasi] = useState('');

  // Aspirasi state
  const [komentarText, setKentarText] = useState('');
  const [submittingKomentar, setSubmittingKomentar] = useState(false);

  // Berita Acara Modal State
  const [isBeritaAcaraModalOpen, setIsBeritaAcaraModalOpen] = useState(false);
  const [beritaAcaraData, setBeritaAcaraData] = useState<BeritaAcaraPayload | null>(null);
  const [loadingBeritaAcara, setLoadingBeritaAcara] = useState(false);

  const isPengurus = hasRole('SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Fetch Voting Detail
  const fetchDetail = async () => {
    if (!votingId) return;
    try {
      const res = await fetch(`/api/voting/${votingId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memuat musyawarah');
      }
      const data = await res.json();
      if (!isMountedRef.current) return;
      setVoting(data);

      if (data.currentUserVote?.hasVoted && data.currentUserVote.vote?.opsiId) {
        setSelectedOpsiId(data.currentUserVote.vote.opsiId);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setErrorMessage(msg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 2. Fetch Partisipasi Warga
  const fetchPartisipasi = async () => {
    if (!votingId) return;
    setLoadingPartisipasi(true);
    try {
      const res = await fetch(`/api/voting/${votingId}/partisipasi`);
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setPartisipasi(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch partisipasi', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingPartisipasi(false);
      }
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [votingId]);

  useEffect(() => {
    if (activeTab === 'partisipasi' || isBantuWargaMode) {
      fetchPartisipasi();
    }
  }, [activeTab, isBantuWargaMode]);

  // Submit Vote Handler with Atomic Double-Click Protection
  const handleConfirmVote = async () => {
    if (!selectedOpsiId || isSubmittingVoteRef.current) return;

    isSubmittingVoteRef.current = true;
    setVoteError('');
    setVoteSuccess('');
    setVotingSubmitting(true);

    try {
      const payload: {
        opsiId: string;
        alasanMemilih?: string;
        isBantuWarga: boolean;
        anggotaId?: string;
      } = {
        opsiId: selectedOpsiId,
        alasanMemilih: alasanMemilih.trim() ? alasanMemilih.trim().slice(0, 500) : undefined,
        isBantuWarga: isBantuWargaMode,
      };

      if (isBantuWargaMode) {
        if (!selectedBantuAnggotaId) {
          throw new Error('Silakan pilih warga yang dibantu dari daftar');
        }
        payload.anggotaId = selectedBantuAnggotaId;
      }

      const res = await fetch(`/api/voting/${votingId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Gagal mengirimkan suara');
      }

      setVoteSuccess(resJson.message || 'Suara berhasil dicatat!');
      setIsConfirmModalOpen(false);
      setAlasanMemilih('');
      if (isBantuWargaMode) {
        setSelectedBantuAnggotaId('');
      }

      await fetchDetail();
      if (activeTab === 'partisipasi' || isBantuWargaMode) {
        await fetchPartisipasi();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memberikan suara';
      setVoteError(msg);
    } finally {
      isSubmittingVoteRef.current = false;
      setVotingSubmitting(false);
    }
  };

  // Submit Comment Handler
  const handleSendKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!komentarText.trim()) return;

    setSubmittingKomentar(true);
    try {
      const res = await fetch(`/api/voting/${votingId}/komentar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: komentarText.trim() }),
      });

      if (res.ok) {
        setKentarText('');
        fetchDetail();
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingKomentar(false);
    }
  };

  // Close Voting Early Handler (Pengurus only)
  const handleCloseVoting = async () => {
    if (!confirm('Apakah Anda yakin ingin menutup musyawarah voting ini sekarang? Setelah ditutup, warga tidak dapat lagi mengubah suaranya.')) {
      return;
    }

    try {
      const res = await fetch(`/api/voting/${votingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'selesai' }),
      });

      if (res.ok) {
        fetchDetail();
      }
    } catch (err) {
      console.error('Failed to close voting', err);
    }
  };

  // Fetch Berita Acara for Print / Modal
  const handleOpenBeritaAcara = async () => {
    setLoadingBeritaAcara(true);
    setIsBeritaAcaraModalOpen(true);
    try {
      const res = await fetch(`/api/voting/${votingId}/berita-acara`);
      if (res.ok) {
        const data = await res.json();
        setBeritaAcaraData(data);
      }
    } catch (err) {
      console.error('Failed to fetch berita acara', err);
    } finally {
      setLoadingBeritaAcara(false);
    }
  };

  // WhatsApp Share blast generator
  const handleShareWhatsApp = () => {
    if (!voting) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const text = `*🗳️ Undangan Musyawarah Warga RT*\n\n` +
      `Bapak/Ibu Warga yang terhormat,\n` +
      `Telah dibuka pemungutan suara/musyawarah digital untuk:\n` +
      `*${voting.judul}*\n\n` +
      `📋 *Aturan Suara*: ${voting.tipeHakSuara === 'per_kk' ? '1 Rumah / KK 1 Suara' : '1 Warga 1 Suara'}\n` +
      `⏰ *Batas Waktu*: ${new Date(voting.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pk. ${new Date(voting.tanggalSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n` +
      `📊 *Partisipasi Saat Ini*: ${voting.totalSuaraMasuk} dari ${voting.totalTargetPemilih} ${voting.tipeHakSuara === 'per_kk' ? 'KK' : 'Warga'} (${voting.persentasePartisipasi}%)\n\n` +
      `Mari sampaikan hak suara Anda untuk kemajuan lingkungan bersama:\n` +
      `👉 ${currentUrl}\n\n` +
      `_Salam rukun & guyub gotong royong Pengurus RT_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // WhatsApp Reminder per Citizen
  const handleRemindCitizen = (item: PartisipasiItem) => {
    const phone = normalizeIndonesianPhone(item.noHp);
    if (!phone) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const msg = `Halo Bapak/Ibu ${item.nama} (Rumah No. ${item.noRumah}),\n\n` +
      `Mengingatkan mengenai musyawarah RT untuk agenda:\n` +
      `*${voting?.judul}*\n\n` +
      `Berdasarkan data saat ini, hak suara Rumah No. ${item.noRumah} belum tercatat.\n` +
      `Mohon kesediaannya berpartisipasi menyampaikan suara melalui tautan berikut:\n` +
      `👉 ${currentUrl}\n\n` +
      `Terima kasih atas partisipasi dan kebersamaannya. 🙏`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatRupiah = (val?: number) => {
    if (!val || val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filtered Partisipasi List
  const filteredPartisipasi = useMemo(() => {
    if (!partisipasi) return [];
    return partisipasi.daftar.filter((item) => {
      if (filterPartisipasiStatus === 'sudah' && !item.hasVoted) return false;
      if (filterPartisipasiStatus === 'belum' && item.hasVoted) return false;
      if (searchPartisipasi.trim()) {
        const q = searchPartisipasi.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.noRumah.toLowerCase().includes(q) ||
          (item.rombongan && item.rombongan.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [partisipasi, filterPartisipasiStatus, searchPartisipasi]);

  // Loading or Error states
  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
        <Sidebar activeMenu="Musyawarah & Voting" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="p-8 max-w-5xl mx-auto w-full text-center">
            <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Memuat musyawarah voting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !voting) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
        <Sidebar activeMenu="Musyawarah & Voting" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="p-8 max-w-lg mx-auto w-full text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Musyawarah Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500 mt-1">{errorMessage || 'Agenda voting tidak ditemukan.'}</p>
            <Link
              href="/voting"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAktif = voting.status === 'aktif';
  const hasUserVoted = voting.currentUserVote?.hasVoted;
  const selectedOpsiObj = voting.opsi.find((o) => o.id === selectedOpsiId);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased overflow-hidden font-sans">
      <Sidebar activeMenu="Musyawarah & Voting" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link
              href="/voting"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Musyawarah</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan ke WhatsApp RT</span>
              </button>

              <button
                onClick={handleOpenBeritaAcara}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Berita Acara</span>
              </button>

              {isPengurus && isAktif && (
                <button
                  onClick={handleCloseVoting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <span>Tutup Voting</span>
                </button>
              )}
            </div>
          </div>

          {/* Context Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs mb-6">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                {voting.kategori.toUpperCase()}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                {voting.tipeKerahasiaan === 'anonim' ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Suara Rahasia (Anonim)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Suara Terbuka</span>
                  </>
                )}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {voting.tipeHakSuara === 'per_kk' ? '1 Rumah / KK 1 Suara' : '1 Warga 1 Suara'}
              </span>

              {isAktif ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1 ml-auto">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Aktif s/d {new Date(voting.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} pk {new Date(voting.tanggalSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ml-auto">
                  Musyawarah Telah Selesai
                </span>
              )}
            </div>

            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {voting.judul}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
              {voting.deskripsi}
            </p>

            {/* Estimasi Biaya Kas RT Context */}
            {voting.estimasiBiaya && voting.estimasiBiaya > 0 ? (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 block font-medium">Estimasi Biaya Program:</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{formatRupiah(voting.estimasiBiaya)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 block font-medium">Posisi Kas RT Saat Ini:</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{formatRupiah(voting.saldoKasSaatIni)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 block font-medium">Beban Terhadap Kas RT:</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{voting.persentaseBebanKas}% dari Total Kas</span>
                </div>
              </div>
            ) : null}

            {/* Quorum Meter & Progress Header */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    Partisipasi Suara Masuk: {voting.totalSuaraMasuk} dari {voting.totalTargetPemilih} {voting.tipeHakSuara === 'per_kk' ? 'KK' : 'Warga'} ({voting.persentasePartisipasi}%)
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    voting.isKuorumTerpenuhi
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}
                >
                  {voting.isKuorumTerpenuhi
                    ? '✓ Kuorum Terpenuhi (Keputusan Sah)'
                    : `Belum Kuorum (Target Min. ${voting.kuorumPersen}%)`}
                </span>
              </div>

              {/* Progress Bar with Quorum Threshold Tick */}
              <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    voting.isKuorumTerpenuhi ? 'bg-emerald-500' : 'bg-[var(--brand-primary)]'
                  }`}
                  style={{ width: `${Math.min(100, voting.persentasePartisipasi)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>0%</span>
                <span className="font-semibold text-slate-500">Batas Sah: {voting.kuorumPersen}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Bilik Suara vs Partisipasi vs Aspirasi */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('bilik')}
              className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'bilik'
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Bilik Suara & Hasil Musyawarah
            </button>

            <button
              onClick={() => setActiveTab('partisipasi')}
              className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'partisipasi'
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pantau Partisipasi Warga ({voting.totalSuaraMasuk}/{voting.totalTargetPemilih})
            </button>

            <button
              onClick={() => setActiveTab('aspirasi')}
              className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'aspirasi'
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Aspirasi & Diskusi ({voting.komentar.length})
            </button>
          </div>

          {/* TAB 1: BILIK SUARA & HASIL REAL-TIME */}
          {activeTab === 'bilik' && (
            <div className="space-y-6">
              {/* Alert Feedback Suara */}
              {voteSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{voteSuccess}</span>
                </div>
              )}

              {voteError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-medium">{voteError}</span>
                </div>
              )}

              {/* Status Hak Suara Pengguna Saat Ini */}
              {hasUserVoted && !isBantuWargaMode && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                        Hak Suara Anda / Rumah Anda Telah Tercatat
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {voting.currentUserVote.anggotaTerdaftar
                          ? `Atas nama ${voting.currentUserVote.anggotaTerdaftar.nama} (Rumah No. ${voting.currentUserVote.anggotaTerdaftar.noRumah})`
                          : 'Suara Anda telah masuk ke dalam rekapitulasi sah.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(voting.currentUserVote.vote?.waktuVote || '').toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}

              {/* Mode Khusus Pengurus: Bantu Catat Suara Warga Offline */}
              {isPengurus && isAktif && (
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        Asisten Pengurus: Bantu Catat Suara Warga Sepuh / Offline
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBantuWargaMode(!isBantuWargaMode)}
                      className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                    >
                      {isBantuWargaMode ? 'Batalkan Mode Bantu' : 'Aktifkan Mode Bantu'}
                    </button>
                  </div>

                  {isBantuWargaMode && (
                    <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-800/40 space-y-2">
                      <label className="block text-xs font-semibold text-purple-950 dark:text-purple-200">
                        Pilih Warga / Rumah yang Dititipkan Suaranya:
                      </label>
                      <select
                        value={selectedBantuAnggotaId}
                        onChange={(e) => setSelectedBantuAnggotaId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-xs outline-none"
                      >
                        <option value="">-- Pilih Nama Warga / Rumah --</option>
                        {partisipasi?.daftar
                          .filter((p) => !p.hasVoted)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              Rumah No. {p.noRumah} - {p.nama} ({p.rombongan || 'Warga'})
                            </option>
                          ))}
                      </select>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300">
                        * Suara akan dicatat sah atas nama warga tersebut dengan keterangan dicatat oleh pengurus.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bilik Suara: Form Kartu Pilihan */}
              {isAktif && (!hasUserVoted || isBantuWargaMode) && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Vote className="w-5 h-5 text-[var(--brand-primary)]" />
                        <span>Bilik Pemilihan Suara</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isBantuWargaMode
                          ? 'Pilih opsi yang diamanahkan warga yang bersangkutan.'
                          : 'Tentukan pilihan Anda dengan cermat. Suara yang telah dikirim bersifat final.'}
                      </p>
                    </div>
                  </div>

                  {/* Option Cards Radio Selection */}
                  <div className="grid grid-cols-1 gap-3">
                    {voting.opsi.map((op) => {
                      const isSelected = selectedOpsiId === op.id;

                      return (
                        <div
                          key={op.id}
                          onClick={() => setSelectedOpsiId(op.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-primary)]/10 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isSelected
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                                {op.judulOpsi}
                              </h3>
                              {op.perkiraanBiaya && op.perkiraanBiaya > 0 ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                  {formatRupiah(op.perkiraanBiaya)}
                                </span>
                              ) : null}
                            </div>

                            {op.deskripsiOpsi && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                {op.deskripsiOpsi}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aspirasi / Catatan Form */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Aspirasi / Alasan Anda Terkait Pilihan Ini (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Tuliskan catatan singkat jika ada pertimbangan khusus untuk pengurus..."
                      value={alasanMemilih}
                      onChange={(e) => setAlasanMemilih(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                    />
                    <div className="text-[10px] text-slate-400 text-right mt-0.5">{alasanMemilih.length}/500 karakter</div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      disabled={!selectedOpsiId || (isBantuWargaMode && !selectedBantuAnggotaId) || votingSubmitting}
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-xs md:text-sm font-semibold shadow-sm hover:opacity-95 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isBantuWargaMode ? 'Simpan Suara Warga' : 'Kirim Suara Sekarang'}
                    </button>
                  </div>
                </div>
              )}

              {/* Rekapitulasi Hasil Real-Time */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Rekapitulasi Perolehan Suara</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Total suara masuk: {voting.totalSuaraMasuk} suara ({voting.persentasePartisipasi}% dari total hak suara)
                    </p>
                  </div>

                  {!isAktif && (
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Hasil Sah Terpilih</span>
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {voting.opsi.map((op) => {
                    const isLeading = op.id === voting.leadingOpsiId && op.totalSuara > 0;

                    return (
                      <div
                        key={op.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isLeading
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {op.judulOpsi}
                            </span>
                            {isLeading && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                {isAktif ? 'Memimpin' : 'Keputusan Terpilih'}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {op.totalSuara} suara
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                              ({op.persentase}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Result */}
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 rounded-full ${
                              isLeading ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                            style={{ width: `${Math.min(100, op.persentase)}%` }}
                          />
                        </div>

                        {/* Pemilih Transparan (Jika mode terbuka) */}
                        {voting.tipeKerahasiaan === 'terbuka' && op.pemilih && op.pemilih.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">Dukungan: </span>
                            {op.pemilih.map((p, pIdx) => (
                              <span key={p.id}>
                                {p.namaPemilih} (No. {p.noRumah})
                                {pIdx < (op.pemilih?.length || 0) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PANTAU PARTISIPASI WARGA */}
          {activeTab === 'partisipasi' && (
            <div className="space-y-4">
              {/* Summary Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs text-slate-500">Total Wajib Suara</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {partisipasi?.totalTarget || 0} {voting.tipeHakSuara === 'per_kk' ? 'KK' : 'Warga'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs text-emerald-600 font-medium">Sudah Memberikan Suara</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {partisipasi?.totalSudah || 0} ({partisipasi?.persentase || 0}%)
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs text-amber-600 font-medium">Belum Memberikan Suara</span>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {partisipasi?.totalBelum || 0}
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setFilterPartisipasiStatus('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      filterPartisipasiStatus === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Semua ({partisipasi?.totalTarget || 0})
                  </button>
                  <button
                    onClick={() => setFilterPartisipasiStatus('sudah')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      filterPartisipasiStatus === 'sudah'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Sudah Vote ({partisipasi?.totalSudah || 0})
                  </button>
                  <button
                    onClick={() => setFilterPartisipasiStatus('belum')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      filterPartisipasiStatus === 'belum'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Belum Vote ({partisipasi?.totalBelum || 0})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari warga / no rumah..."
                    value={searchPartisipasi}
                    onChange={(e) => setSearchPartisipasi(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Table List Partisipasi */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs">
                {loadingPartisipasi ? (
                  <div className="p-8 text-center text-xs text-slate-400">Memuat data partisipasi warga...</div>
                ) : filteredPartisipasi.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Tidak ada data warga yang cocok.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-3 px-4">No. Rumah</th>
                          <th className="py-3 px-4">Nama Warga / KK</th>
                          <th className="py-3 px-4">Rombongan</th>
                          <th className="py-3 px-4 text-center">Status Suara</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredPartisipasi.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              Rumah No. {item.noRumah}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 dark:text-white block">{item.nama}</span>
                              {item.dicatatOleh && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400">
                                  Bantuan: {item.dicatatOleh}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{item.rombongan || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              {item.hasVoted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Sudah Masuk</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  <span>Belum Memberikan Suara</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!item.hasVoted && isAktif ? (
                                item.noHp ? (
                                  <button
                                    onClick={() => handleRemindCitizen(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                    <span>Ingatkan WA</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Tidak ada no HP</span>
                                )
                              ) : (
                                <span className="text-[11px] text-slate-400">Tercatat</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASPIRASI & DISKUSI WARGA */}
          {activeTab === 'aspirasi' && (
            <div className="space-y-4">
              {/* Form Input Aspirasi */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Sampaikan Masukan / Pertimbangan Musyawarah</span>
                </h3>
                <form onSubmit={handleSendKomentar} className="space-y-2.5">
                  <textarea
                    required
                    rows={2}
                    maxLength={1000}
                    placeholder="Tuliskan aspirasi, pertanyaan, atau saran Anda terkait musyawarah ini..."
                    value={komentarText}
                    onChange={(e) => setKentarText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{komentarText.length}/1000 karakter</span>
                    <button
                      type="submit"
                      disabled={submittingKomentar || !komentarText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-medium shadow-xs hover:opacity-95 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingKomentar ? 'Mengirim...' : 'Kirim Aspirasi'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Komentar List */}
              <div className="space-y-3">
                {voting.komentar.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-400">
                    Belum ada diskusi atau aspirasi yang disampaikan. Jadilah yang pertama memberikan masukan!
                  </div>
                ) : (
                  voting.komentar.map((kom) => (
                    <div
                      key={kom.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {kom.namaPengirim}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {kom.rolePengirim || 'Warga'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(kom.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {kom.pesan}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        <MobileNavBar />
      </div>

      {/* Confirmation Modal Before Submitting Vote */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <Vote className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Suara Musyawarah</h3>
                <p className="text-xs text-slate-500">Pilihan ini akan tersimpan dan diperhitungkan secara sah.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Pilihan yang Anda tentukan:</span>
              <p className="text-sm font-bold text-[var(--brand-primary)]">{selectedOpsiObj?.judulOpsi}</p>
              {alasanMemilih && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Catatan Anda: </span>"{alasanMemilih}"
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengirimkan suara ini? Setelah dikonfirmasi, suara tidak dapat diubah kembali demi menjaga ketertiban musyawarah.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                disabled={votingSubmitting}
                onClick={handleConfirmVote}
                className="px-5 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-semibold shadow-xs hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {votingSubmitting ? 'Mengirim Suara...' : 'Ya, Kirim Suara Sah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Berita Acara Musyawarah Resmi (Printable) */}
      {isBeritaAcaraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full print:p-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Berita Acara Musyawarah & Voting
                </h3>
              </div>
              <button
                onClick={() => setIsBeritaAcaraModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingBeritaAcara || !beritaAcaraData ? (
              <div className="p-12 text-center text-xs text-slate-400">Menyusun naskah berita acara...</div>
            ) : (
              <div className="mt-4 space-y-4 text-xs text-slate-800 dark:text-slate-200 print:text-black" id="print-area">
                {/* Kop Berita Acara */}
                <div className="text-center pb-3 border-b-2 border-slate-900 dark:border-slate-400 print:border-black">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    BERITA ACARA PENGAMBILAN KEPUTUSAN MUSYAWARAH WARGA
                  </h2>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 print:text-black">
                    RUKUN TETANGGA {beritaAcaraData.komunitas.noRt} / RUKUN WARGA {beritaAcaraData.komunitas.noRw}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-black">
                    {beritaAcaraData.komunitas.desaKelurahan}, {beritaAcaraData.komunitas.kecamatan}, {beritaAcaraData.komunitas.kotaKabupaten}
                  </p>
                </div>

                <div className="space-y-2">
                  <p>
                    Pada hari ini telah diselenggarakan rekapitulasi pemungutan suara musyawarah warga digital untuk agenda:
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-transparent print:border-black">
                    <span className="font-bold block text-sm text-slate-900 dark:text-white print:text-black">{beritaAcaraData.voting.judul}</span>
                    <span className="text-slate-500 print:text-black">{beritaAcaraData.voting.deskripsi}</span>
                  </div>
                </div>

                {/* Hasil Rekapitulasi */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white print:text-black">I. Data Partisipasi & Kuorum</h4>
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 print:bg-transparent print:border-black">
                    <div>Total Hak Suara Terdaftar: <b>{beritaAcaraData.voting.totalTarget}</b></div>
                    <div>Total Suara Masuk: <b>{beritaAcaraData.voting.totalSuaraMasuk}</b></div>
                    <div>Persentase Partisipasi: <b>{beritaAcaraData.voting.persentasePartisipasi}%</b></div>
                    <div>Ambang Kuorum Minimal: <b>{beritaAcaraData.voting.kuorumPersen}%</b></div>
                  </div>
                  <div className="mt-1 font-bold">
                    Status Hukum Keputusan: <span className={beritaAcaraData.voting.isSah ? 'text-emerald-600' : 'text-amber-600'}>{beritaAcaraData.voting.statusKuorumTeks}</span>
                  </div>
                </div>

                {/* Rincian Pilihan */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white print:text-black">II. Perolehan Suara Pilihan</h4>
                  <table className="w-full border border-slate-200 dark:border-slate-700 print:border-black text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 print:bg-transparent text-slate-700 dark:text-slate-300 print:text-black">
                      <tr>
                        <th className="p-2 border print:border-black">No</th>
                        <th className="p-2 border print:border-black">Opsi / Alternatif</th>
                        <th className="p-2 border print:border-black text-center">Jumlah Suara</th>
                        <th className="p-2 border print:border-black text-center">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beritaAcaraData.voting.rincianOpsi.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="p-2 border print:border-black text-center">{idx + 1}</td>
                          <td className="p-2 border print:border-black font-medium">{r.judulOpsi}</td>
                          <td className="p-2 border print:border-black text-center font-bold">{r.totalSuara}</td>
                          <td className="p-2 border print:border-black text-center">{r.persentase}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kesimpulan */}
                {beritaAcaraData.voting.pemenang && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 print:border-black text-emerald-900 dark:text-emerald-200 print:text-black print:bg-transparent">
                    <span className="font-bold block">Kesimpulan Keputusan Musyawarah:</span>
                    Berdasarkan perolehan suara terbanyak dan terpenuhinya kuorum, musyawarah warga menetapkan opsi:{' '}
                    <b>"{beritaAcaraData.voting.pemenang.judulOpsi}"</b> dengan perolehan {beritaAcaraData.voting.pemenang.totalSuara} suara ({beritaAcaraData.voting.pemenang.persentase}%) sebagai keputusan bersama yang mengikat.
                  </div>
                )}

                {/* Tanda Tangan */}
                <div className="pt-6 flex justify-between text-center">
                  <div>
                    <p className="text-[11px] text-slate-400 print:text-black">Mengetahui,</p>
                    <p className="font-semibold text-xs mt-1">Sekretaris RT</p>
                    <div className="h-16" />
                    <p className="font-medium underline">( .................................... )</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 print:text-black">
                      {beritaAcaraData.komunitas.kotaKabupaten}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="font-semibold text-xs mt-1">Ketua RT {beritaAcaraData.komunitas.noRt}</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{beritaAcaraData.komunitas.ketuaRT}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Dokumen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
