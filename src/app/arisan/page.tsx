'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import SpinWheel, { SpinCandidate } from '@/components/SpinWheel';
import {
  Sparkles,
  Plus,
  Users,
  Trophy,
  Wallet,
  Calendar,
  CheckCircle2,
  Circle,
  RotateCcw,
  Share2,
  Trash2,
  Edit,
  X,
  Search,
  Check,
  ChevronRight,
  AlertCircle,
  Phone,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AnggotaOption {
  id: string;
  nama: string;
  noRumah: string;
  noHp?: string | null;
}

interface PesertaArisanItem {
  id: string;
  kelompokId: string;
  anggotaId?: string | null;
  namaPeserta: string;
  nomorSlot: number;
  noHp?: string | null;
  sudahMenang: boolean;
  tanggalMenang?: string | null;
  anggota?: {
    id: string;
    nama: string;
    noRumah: string;
    noHp?: string | null;
  } | null;
}

interface PembayaranItem {
  id: string;
  putaranId: string;
  pesertaId: string;
  statusBayar: boolean;
  tanggalBayar?: string | null;
  nominal: number;
  metode: string;
  peserta: PesertaArisanItem;
}

interface PutaranItem {
  id: string;
  putaranKe: number;
  tanggalKocok: string;
  totalTerkumpul: number;
  pemenangId?: string | null;
  namaPemenang?: string | null;
  nominalDiterima: number;
  status: string;
  catatan?: string | null;
  dicatatOleh: string;
  pembayaran: PembayaranItem[];
}

interface KelompokDetail {
  id: string;
  nama: string;
  nominalIuran: number;
  periodeTipe: string;
  tanggalMulai: string;
  status: string;
  keterangan?: string | null;
  peserta: PesertaArisanItem[];
  putaran: PutaranItem[];
  stats: {
    totalPeserta: number;
    totalSudahMenang: number;
    totalBelumMenang: number;
    totalPutaranSelesai: number;
    estimasiHadiah: number;
    siklusSelesai: boolean;
  };
  pesertaBelumMenang: PesertaArisanItem[];
  pesertaSudahMenang: PesertaArisanItem[];
}

interface KelompokSummary {
  id: string;
  nama: string;
  nominalIuran: number;
  periodeTipe: string;
  status: string;
  totalPeserta: number;
  sudahMenangCount: number;
  belumMenangCount: number;
  totalPutaran: number;
  estimasiHadiah: number;
}

export default function ArisanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kelompokList, setKelompokList] = useState<KelompokSummary[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);
  const [kelompokDetail, setKelompokDetail] = useState<KelompokDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Warga reference for creating group / adding member
  const [allAnggota, setAllAnggota] = useState<AnggotaOption[]>([]);

  // Sub-tab: "iuran" vs "peserta"
  const [activeSideTab, setActiveSideTab] = useState<'iuran' | 'peserta'>('iuran');

  // Search filter for participant list
  const [searchPesertaQuery, setSearchPesertaQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPesertaModalOpen, setIsAddPesertaModalOpen] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<SpinCandidate | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form: Buat Kelompok Baru
  const [newKelompokForm, setNewKelompokForm] = useState({
    nama: '',
    nominalIuran: '50000',
    periodeTipe: 'bulanan',
    keterangan: '',
    selectedAnggotaIds: [] as string[],
  });

  // Form: Tambah Peserta Manual / dari Warga
  const [newPesertaForm, setNewPesertaForm] = useState({
    namaPeserta: '',
    anggotaId: '',
    nomorSlot: '1',
    noHp: '',
  });

  // Local state for Iuran Checklist changes in active putaran
  const [localIuranState, setLocalIuranState] = useState<Record<string, boolean>>({});

  // Show Toast Notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch list of kelompok arisan
  const fetchKelompokList = async (preferredId?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/arisan');
      const json = await res.json();
      if (json.success) {
        setKelompokList(json.data);
        if (json.data.length > 0) {
          const targetId = preferredId || (selectedKelompokId && json.data.some((k: any) => k.id === selectedKelompokId) ? selectedKelompokId : json.data[0].id);
          setSelectedKelompokId(targetId);
        } else {
          setSelectedKelompokId(null);
          setKelompokDetail(null);
        }
      }
    } catch (err) {
      console.error('Error fetching arisan list:', err);
      showToast('Gagal memuat data arisan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single kelompok details
  const fetchKelompokDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/arisan/${id}`);
      const json = await res.json();
      if (json.success) {
        setKelompokDetail(json.data);

        // Pre-fill local iuran checklist state from latest putaran
        const latestPutaran = json.data.putaran[0];
        if (latestPutaran && latestPutaran.pembayaran) {
          const map: Record<string, boolean> = {};
          latestPutaran.pembayaran.forEach((p: PembayaranItem) => {
            map[p.id] = p.statusBayar;
          });
          setLocalIuranState(map);
        } else {
          setLocalIuranState({});
        }
      }
    } catch (err) {
      console.error('Error fetching kelompok detail:', err);
    }
  };

  // Fetch all warga for dropdown
  const fetchAllAnggota = async () => {
    try {
      const res = await fetch('/api/anggota');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllAnggota(
          data.map((a: any) => ({
            id: a.id,
            nama: a.nama,
            noRumah: a.noRumah,
            noHp: a.noHp,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching anggota:', err);
    }
  };

  useEffect(() => {
    fetchKelompokList();
    fetchAllAnggota();
  }, []);

  useEffect(() => {
    if (selectedKelompokId) {
      fetchKelompokDetail(selectedKelompokId);
    }
  }, [selectedKelompokId]);

  // Candidates for the wheel: only those who haven't won
  const wheelCandidates: SpinCandidate[] = useMemo(() => {
    if (!kelompokDetail) return [];
    return kelompokDetail.pesertaBelumMenang.map((p) => ({
      id: p.id,
      namaPeserta: p.namaPeserta,
      nomorSlot: p.nomorSlot,
      sudahMenang: p.sudahMenang,
      noHp: p.noHp,
    }));
  }, [kelompokDetail]);

  // Filtered participants list for the right panel
  const filteredPeserta = useMemo(() => {
    if (!kelompokDetail) return [];
    if (!searchPesertaQuery.trim()) return kelompokDetail.peserta;
    const q = searchPesertaQuery.toLowerCase();
    return kelompokDetail.peserta.filter(
      (p) =>
        p.namaPeserta.toLowerCase().includes(q) ||
        (p.anggota?.noRumah && p.anggota.noRumah.toLowerCase().includes(q))
    );
  }, [kelompokDetail, searchPesertaQuery]);

  // When spin finishes, open the confirmation dialog
  const handleSpinEnd = (winner: SpinCandidate) => {
    setPendingWinner(winner);
    setIsWinnerModalOpen(true);
  };

  // Confirm winner and commit to database
  const handleConfirmWinner = async () => {
    if (!selectedKelompokId || !pendingWinner) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${selectedKelompokId}/kocok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pemenangId: pendingWinner.id,
          nominalDiterima: kelompokDetail?.stats.estimasiHadiah,
          catatan: `Pemenang undian putaran ke-${(kelompokDetail?.putaran.length || 0) + 1}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        setIsWinnerModalOpen(false);
        setPendingWinner(null);
        await fetchKelompokDetail(selectedKelompokId);
        await fetchKelompokList(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal menyimpan hasil undian', 'error');
      }
    } catch (err: any) {
      console.error('Error confirming winner:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle local iuran status
  const handleToggleIuran = (pembayaranId: string) => {
    setLocalIuranState((prev) => ({
      ...prev,
      [pembayaranId]: !prev[pembayaranId],
    }));
  };

  // Save Iuran changes to DB
  const handleSaveIuranChanges = async () => {
    if (!selectedKelompokId || !kelompokDetail?.putaran[0]) return;
    const latestPutaran = kelompokDetail.putaran[0];

    try {
      setIsSaving(true);
      const payload = latestPutaran.pembayaran.map((p) => ({
        id: p.id,
        statusBayar: localIuranState[p.id] ?? p.statusBayar,
      }));

      const res = await fetch(`/api/arisan/${selectedKelompokId}/iuran`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          putaranId: latestPutaran.id,
          pembayaranList: payload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Status iuran putaran berhasil disimpan', 'success');
        await fetchKelompokDetail(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal menyimpan iuran', 'error');
      }
    } catch (err) {
      console.error('Error saving iuran:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset cycle (restart everyone as belum menang)
  const handleResetSiklus = async () => {
    if (!selectedKelompokId) return;
    if (!confirm('Apakah Anda yakin ingin me-reset siklus arisan ini? Semua peserta akan dapat diundi kembali untuk siklus babak baru.')) {
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${selectedKelompokId}/peserta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_siklus' }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        await fetchKelompokDetail(selectedKelompokId);
        await fetchKelompokList(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal me-reset siklus', 'error');
      }
    } catch (err) {
      console.error('Error resetting cycle:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new group
  const handleCreateKelompok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelompokForm.nama.trim()) {
      showToast('Nama kelompok arisan wajib diisi', 'error');
      return;
    }

    try {
      setIsSaving(true);
      // Map selected warga to initial participants
      const pesertaList = newKelompokForm.selectedAnggotaIds.map((id) => {
        const found = allAnggota.find((a) => a.id === id);
        return {
          anggotaId: id,
          namaPeserta: found ? found.nama : 'Warga RT',
          noHp: found?.noHp || null,
          nomorSlot: 1,
        };
      });

      const res = await fetch('/api/arisan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: newKelompokForm.nama,
          nominalIuran: Number(newKelompokForm.nominalIuran),
          periodeTipe: newKelompokForm.periodeTipe,
          keterangan: newKelompokForm.keterangan,
          pesertaList,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Kelompok arisan berhasil dibuat!', 'success');
        setIsCreateModalOpen(false);
        setNewKelompokForm({
          nama: '',
          nominalIuran: '50000',
          periodeTipe: 'bulanan',
          keterangan: '',
          selectedAnggotaIds: [],
        });
        await fetchKelompokList(json.data.id);
      } else {
        showToast(json.error || 'Gagal membuat kelompok arisan', 'error');
      }
    } catch (err) {
      console.error('Error creating kelompok:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add individual participant
  const handleAddPeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelompokId) return;

    let finalNama = newPesertaForm.namaPeserta.trim();
    let finalHp = newPesertaForm.noHp.trim();

    if (newPesertaForm.anggotaId) {
      const selectedWarga = allAnggota.find((a) => a.id === newPesertaForm.anggotaId);
      if (selectedWarga) {
        finalNama = selectedWarga.nama;
        finalHp = selectedWarga.noHp || '';
      }
    }

    if (!finalNama) {
      showToast('Nama peserta wajib diisi atau pilih dari data warga', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${selectedKelompokId}/peserta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPeserta: finalNama,
          anggotaId: newPesertaForm.anggotaId || null,
          nomorSlot: Number(newPesertaForm.nomorSlot) || 1,
          noHp: finalHp || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Peserta berhasil ditambahkan!', 'success');
        setIsAddPesertaModalOpen(false);
        setNewPesertaForm({
          namaPeserta: '',
          anggotaId: '',
          nomorSlot: '1',
          noHp: '',
        });
        await fetchKelompokDetail(selectedKelompokId);
        await fetchKelompokList(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal menambahkan peserta', 'error');
      }
    } catch (err) {
      console.error('Error adding peserta:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp share message generator
  const getWhatsAppShareUrl = (putaran: PutaranItem) => {
    const groupName = kelompokDetail?.nama || 'Arisan RT';
    const dateFormatted = new Date(putaran.tanggalKocok).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const prizeFormatted = `Rp ${putaran.nominalDiterima.toLocaleString('id-ID')}`;

    const message = `🎉 *PENGUMUMAN HASIL UNDIAN ARISAN* 🎉\n\n` +
      `*Kelompok:* ${groupName}\n` +
      `*Putaran Ke:* #${putaran.putaranKe}\n` +
      `*Tanggal:* ${dateFormatted}\n\n` +
      `Alhamdulillah, selamat kepada:\n` +
      `🏆 *${putaran.namaPemenang}*\n` +
      `Mendapatkan dana arisan sebesar: *${prizeFormatted}*\n\n` +
      `Terima kasih kepada seluruh peserta yang telah tertib berpartisipasi dan menyetor iuran tepat waktu.\n\n` +
      `_Salam Hangat, Pengurus Paguyuban RT / Komuna_`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      {/* Sidebar */}
      <Sidebar activeMenu="Arisan Warga" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-24 md:pb-12">
          {/* Notification Toast */}
          {notification && (
            <div
              className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-in fade-in slide-in-from-top-3 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}

          {/* Top Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Arisan Komunitas
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Kelola kelompok arisan, pengundian roda putar digital, dan pencatatan iuran transparan antar warga.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors shadow-teal-700/10"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kelompok Baru</span>
              </button>
            </div>
          </div>

          {/* Group Selector Pills / Tabs */}
          {kelompokList.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {kelompokList.map((k) => {
                const isSelected = k.id === selectedKelompokId;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setSelectedKelompokId(k.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-teal-600 border-transparent shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{k.nama}</span>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {k.totalPeserta} Warga
                    </span>
                  </button>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Belum Ada Kelompok Arisan
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Mulai buat kelompok arisan pertama untuk warga RT, bapak-bapak, atau ibu-ibu PKK dengan klik tombol di bawah.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kelompok Arisan</span>
              </button>
            </div>
          ) : null}

          {/* Active Group Details */}
          {kelompokDetail && (
            <>
              {/* Bento Grid Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Metric 1: Putaran Berjalan */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-medium">Putaran Arisan</span>
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {kelompokDetail.stats.totalPutaranSelesai}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {kelompokDetail.stats.totalPeserta} Putaran
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {kelompokDetail.periodeTipe === 'bulanan' ? 'Setiap Bulan' : 'Setiap Minggu'}
                    </div>
                  </div>
                </div>

                {/* Metric 2: Hadiah / Kas per Putaran */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-medium">Hadiah per Putaran</span>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Rp {kelompokDetail.stats.estimasiHadiah.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Iuran: Rp {kelompokDetail.nominalIuran.toLocaleString('id-ID')} / warga
                    </div>
                  </div>
                </div>

                {/* Metric 3: Sisa Belum Menang */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-medium">Sisa di Undian</span>
                    <Users className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {kelompokDetail.stats.totalBelumMenang}{' '}
                      <span className="text-xs font-normal text-slate-400">Peserta</span>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      {kelompokDetail.stats.totalSudahMenang} orang sudah dapat
                    </div>
                  </div>
                </div>

                {/* Metric 4: Status Siklus & Reset */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-medium">Status Siklus</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        kelompokDetail.stats.siklusSelesai
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {kelompokDetail.stats.siklusSelesai ? 'Selesai' : 'Sedang Berjalan'}
                    </span>
                  </div>
                  <div>
                    {kelompokDetail.stats.siklusSelesai ? (
                      <button
                        type="button"
                        onClick={handleResetSiklus}
                        className="w-full mt-1 py-1.5 px-3 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mulai Siklus Baru</span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Undian putaran berikutnya siap diputar
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content: Left Column (Spin Wheel) & Right Column (Management/Iuran) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Area: The Lucky Spin Wheel (7 cols on lg) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Roda Pengocokan Arisan
                      </h2>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      Putaran ke-{(kelompokDetail.putaran.length || 0) + 1}
                    </span>
                  </div>

                  {/* Interactive Wheel */}
                  <SpinWheel
                    candidates={wheelCandidates}
                    onSpinEnd={handleSpinEnd}
                    disabled={isSaving}
                  />

                  {/* Active Candidates Preview Tags */}
                  <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                      <span>Peserta di Roda ({wheelCandidates.length} warga)</span>
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                        Siap Diundi
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {wheelCandidates.map((c) => (
                        <span
                          key={c.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                        >
                          {c.namaPeserta}
                          {c.nomorSlot && c.nomorSlot > 1 ? ` (#${c.nomorSlot})` : ''}
                        </span>
                      ))}
                      {wheelCandidates.length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Tidak ada peserta tersisa di siklus ini.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Tabs for Iuran Checklist & Peserta List (5 cols on lg) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  {/* Right Header Navigation Tabs */}
                  <div className="flex items-center border-b border-slate-100 dark:border-slate-800 p-2 gap-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                    <button
                      type="button"
                      onClick={() => setActiveSideTab('iuran')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                        activeSideTab === 'iuran'
                          ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Iuran Putaran Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSideTab('peserta')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                        activeSideTab === 'peserta'
                          ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Daftar Peserta ({kelompokDetail.peserta.length})
                    </button>
                  </div>

                  {/* Tab 1: Iuran Putaran Terakhir */}
                  {activeSideTab === 'iuran' && (
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {kelompokDetail.putaran.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Putaran #{kelompokDetail.putaran[0].putaranKe}
                                </span>
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  Pemenang: {kelompokDetail.putaran[0].namaPemenang}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Terkumpul
                                </span>
                                <div className="text-sm font-bold text-teal-600 dark:text-teal-400">
                                  Rp {kelompokDetail.putaran[0].totalTerkumpul.toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>

                            {/* Checklist Items */}
                            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                              {kelompokDetail.putaran[0].pembayaran.map((p) => {
                                const isChecked = localIuranState[p.id] ?? p.statusBayar;
                                return (
                                  <div
                                    key={p.id}
                                    onClick={() => handleToggleIuran(p.id)}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                          isChecked
                                            ? 'bg-teal-600 border-teal-600 text-white'
                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                        }`}
                                      >
                                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                          {p.peserta.namaPeserta}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                          Rp {p.nominal.toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    </div>

                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                        isChecked
                                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {isChecked ? 'Lunas' : 'Belum Setor'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Belum ada putaran yang dijalankan.
                            <br />
                            Putar roda undian di samping untuk memulai putaran pertama!
                          </div>
                        )}
                      </div>

                      {kelompokDetail.putaran.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={handleSaveIuranChanges}
                            disabled={isSaving}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white text-xs font-medium shadow-sm transition-colors"
                          >
                            Simpan Perubahan Iuran
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Peserta List */}
                  {activeSideTab === 'peserta' && (
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Search & Add Button */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={searchPesertaQuery}
                              onChange={(e) => setSearchPesertaQuery(e.target.value)}
                              placeholder="Cari peserta..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddPesertaModalOpen(true)}
                            className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shrink-0"
                            title="Tambah Peserta"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* List of participants */}
                        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                          {filteredPeserta.map((p, idx) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 text-slate-400 text-right font-mono text-[11px]">
                                  {idx + 1}.
                                </span>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {p.namaPeserta}
                                    {p.nomorSlot > 1 ? ` (Slot #${p.nomorSlot})` : ''}
                                  </div>
                                  {p.anggota?.noRumah && (
                                    <div className="text-[11px] text-slate-400">
                                      Rumah No. {p.anggota.noRumah}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                {p.sudahMenang ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                                    Sudah Dapat
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium">
                                    Belum Dapat
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Total: {kelompokDetail.peserta.length} peserta</span>
                        <button
                          type="button"
                          onClick={() => setIsAddPesertaModalOpen(true)}
                          className="text-teal-600 dark:text-teal-400 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Peserta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Area: History of Rounds (Riwayat Pengundian) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Riwayat Putaran & Pemenang
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Total {kelompokDetail.putaran.length} Putaran Telah Terlaksana
                  </span>
                </div>

                {kelompokDetail.putaran.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {kelompokDetail.putaran.map((putaran) => {
                      const dateStr = new Date(putaran.tanggalKocok).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });
                      const paidCount = putaran.pembayaran.filter((p) => p.statusBayar).length;
                      const totalMembers = putaran.pembayaran.length;

                      return (
                        <div
                          key={putaran.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                              #{putaran.putaranKe}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>{putaran.namaPemenang}</span>
                                <span className="text-xs font-normal text-slate-400">
                                  ({dateStr})
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Iuran Terkumpul: Rp {putaran.totalTerkumpul.toLocaleString('id-ID')}{' '}
                                ({paidCount}/{totalMembers} Warga Lunas)
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:self-center self-end">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Dana Diterima</span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                Rp {putaran.nominalDiterima.toLocaleString('id-ID')}
                              </span>
                            </div>

                            <a
                              href={getWhatsAppShareUrl(putaran)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 transition-colors"
                              title="Bagikan ke WhatsApp Warga"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share WA</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat putaran sebelumnya.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Modal: Konfirmasi Pemenang Undian */}
          {isWinnerModalOpen && pendingWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Pemenang Terpilih!
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {pendingWinner.namaPeserta}
                  </h3>
                  {pendingWinner.nomorSlot && pendingWinner.nomorSlot > 1 && (
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Nomor Slot: #{pendingWinner.nomorSlot}
                    </span>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Berhak menerima total hadiah arisan putaran ini:
                  </p>
                  <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                    Rp {kelompokDetail?.stats.estimasiHadiah.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmWinner}
                    disabled={isSaving}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-md shadow-teal-700/20"
                  >
                    {isSaving ? 'Menyimpan Hasil...' : 'Konfirmasi & Simpan Pemenang'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWinnerModalOpen(false);
                      setPendingWinner(null);
                    }}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                  >
                    Batal / Kocok Ulang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Buat Kelompok Baru */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Buat Kelompok Arisan Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateKelompok} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kelompok Arisan *
                    </label>
                    <input
                      type="text"
                      required
                      value={newKelompokForm.nama}
                      onChange={(e) =>
                        setNewKelompokForm({ ...newKelompokForm, nama: e.target.value })
                      }
                      placeholder="e.g. Arisan Bulanan RT 04, Arisan PKK Anggrek"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nominal Iuran / Putaran (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newKelompokForm.nominalIuran}
                        onChange={(e) =>
                          setNewKelompokForm({
                            ...newKelompokForm,
                            nominalIuran: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Periode Kocokan
                      </label>
                      <select
                        value={newKelompokForm.periodeTipe}
                        onChange={(e) =>
                          setNewKelompokForm({
                            ...newKelompokForm,
                            periodeTipe: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="bulanan">Bulanan</option>
                        <option value="dua_mingguan">Dua Mingguan</option>
                        <option value="mingguan">Mingguan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Keterangan / Catatan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={newKelompokForm.keterangan}
                      onChange={(e) =>
                        setNewKelompokForm({ ...newKelompokForm, keterangan: e.target.value })
                      }
                      placeholder="e.g. Diundi setiap pertemuan RT malam Minggu Pon"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* Multi-select from existing warga */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-medium text-slate-700 dark:text-slate-300">
                        Pilih Peserta Awal dari Data Warga ({newKelompokForm.selectedAnggotaIds.length} dipilih)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (newKelompokForm.selectedAnggotaIds.length === allAnggota.length) {
                            setNewKelompokForm({ ...newKelompokForm, selectedAnggotaIds: [] });
                          } else {
                            setNewKelompokForm({
                              ...newKelompokForm,
                              selectedAnggotaIds: allAnggota.map((a) => a.id),
                            });
                          }
                        }}
                        className="text-[11px] text-teal-600 hover:underline font-medium"
                      >
                        {newKelompokForm.selectedAnggotaIds.length === allAnggota.length
                          ? 'Batal Semua'
                          : 'Pilih Semua'}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
                      {allAnggota.map((warga) => {
                        const isSelected = newKelompokForm.selectedAnggotaIds.includes(warga.id);
                        return (
                          <label
                            key={warga.id}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                                : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="font-medium">{warga.nama}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setNewKelompokForm({
                                    ...newKelompokForm,
                                    selectedAnggotaIds: newKelompokForm.selectedAnggotaIds.filter(
                                      (id) => id !== warga.id
                                    ),
                                  });
                                } else {
                                  setNewKelompokForm({
                                    ...newKelompokForm,
                                    selectedAnggotaIds: [
                                      ...newKelompokForm.selectedAnggotaIds,
                                      warga.id,
                                    ],
                                  });
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan Kelompok'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Tambah Peserta Baru */}
          {isAddPesertaModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Tambah Peserta Arisan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddPesertaModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddPeserta} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Pilih dari Data Warga RT (Opsional)
                    </label>
                    <select
                      value={newPesertaForm.anggotaId}
                      onChange={(e) => {
                        const aid = e.target.value;
                        const found = allAnggota.find((a) => a.id === aid);
                        setNewPesertaForm({
                          ...newPesertaForm,
                          anggotaId: aid,
                          namaPeserta: found ? found.nama : '',
                          noHp: found?.noHp || '',
                        });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">-- Masukkan Nama Manual / Bebas --</option>
                      {allAnggota.map((warga) => (
                        <option key={warga.id} value={warga.id}>
                          {warga.nama} (Rumah {warga.noRumah})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nama Peserta di Arisan *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPesertaForm.namaPeserta}
                      onChange={(e) =>
                        setNewPesertaForm({ ...newPesertaForm, namaPeserta: e.target.value })
                      }
                      placeholder="e.g. Bpk. Supardi / Ny. Siti (Slot 2)"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nomor Slot / Urutan
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newPesertaForm.nomorSlot}
                        onChange={(e) =>
                          setNewPesertaForm({ ...newPesertaForm, nomorSlot: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        No. WhatsApp (Opsional)
                      </label>
                      <input
                        type="tel"
                        value={newPesertaForm.noHp}
                        onChange={(e) =>
                          setNewPesertaForm({ ...newPesertaForm, noHp: e.target.value })
                        }
                        placeholder="0812xxxx"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddPesertaModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-sm transition-colors"
                    >
                      {isSaving ? 'Menyimpan...' : 'Tambah Peserta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavBar />
    </div>
  );
}
