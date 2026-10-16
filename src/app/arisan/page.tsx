'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import SpinWheel, { SpinCandidate } from '@/components/SpinWheel';
import {
  HARI_LIST,
  PASARAN_LIST,
  getHariJawa,
  getPasaran,
  getWeton,
  findNextWetonDate,
} from '@/lib/javanese-date';
import {
  Sparkles,
  Plus,
  Users,
  Trophy,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Share2,
  X,
  Search,
  Check,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  Settings,
  UserCheck,
  UserX,
  Coins,
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  Home,
} from 'lucide-react';

interface AnggotaOption {
  id: string;
  nama: string;
  noRumah: string;
  noHp?: string | null;
}

interface AgendaOption {
  id: string;
  judul: string;
  tanggal: string;
  waktuMulai?: string | null;
  lokasi?: string | null;
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
  statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir';
  statusBayar: boolean;
  tanggalBayar?: string | null;
  nominal: number;
  metode: string;
  catatan?: string | null;
  peserta: PesertaArisanItem;
}

interface PutaranItem {
  id: string;
  putaranKe: number;
  tanggalKocok: string;
  hariJawa?: string | null;
  agendaId?: string | null;
  agenda?: {
    id: string;
    judul: string;
    tanggal: string;
    lokasi?: string | null;
    status: string;
  } | null;
  totalTarget: number;
  totalTerkumpul: number;
  nominalDiserahkan: number;
  nominalKurang: number;
  statusTalangan: string; // "tidak_ditalangi" | "ditalangi_kas"
  nominalTalangan: number;
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
  hariJawa?: string | null;
  waktuKocok?: string | null;
  lokasiKocok?: string | null;
  autoSinkronAgenda: boolean;
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
  hariJawa?: string | null;
  waktuKocok?: string | null;
  lokasiKocok?: string | null;
  status: string;
  totalPeserta: number;
  sudahMenangCount: number;
  belumMenangCount: number;
  totalPutaran: number;
  estimasiHadiah: number;
  latestPutaran?: {
    id: string;
    putaranKe: number;
    tanggalKocok: string;
    hariJawa?: string | null;
    namaPemenang?: string | null;
    nominalDiterima: number;
    totalTarget: number;
    totalTerkumpul: number;
    nominalDiserahkan: number;
    nominalKurang: number;
    statusTalangan: string;
  } | null;
}

export default function ArisanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kelompokList, setKelompokList] = useState<KelompokSummary[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string | null>(null);
  const [kelompokDetail, setKelompokDetail] = useState<KelompokDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // References
  const [allAnggota, setAllAnggota] = useState<AnggotaOption[]>([]);
  const [upcomingAgendas, setUpcomingAgendas] = useState<AgendaOption[]>([]);

  // Sub-tab: "iuran" vs "peserta"
  const [activeSideTab, setActiveSideTab] = useState<'iuran' | 'peserta'>('iuran');

  // Filter for Iuran & Kehadiran checklist
  const [iuranFilter, setIuranFilter] = useState<
    'semua' | 'tidak_berangkat_belum_bayar' | 'tidak_berangkat' | 'belum_bayar' | 'lunas' | 'punya_tunggakan_lalu'
  >('semua');

  // Gating & verification states
  const [isAbsensiConfirmed, setIsAbsensiConfirmed] = useState(false);
  const [expandedPutaranId, setExpandedPutaranId] = useState<string | null>(null);

  // Search filter for participant list
  const [searchPesertaQuery, setSearchPesertaQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditKelompokModalOpen, setIsEditKelompokModalOpen] = useState(false);
  const [isAddPesertaModalOpen, setIsAddPesertaModalOpen] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<SpinCandidate | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form: Buat Kelompok Baru
  const [newKelompokForm, setNewKelompokForm] = useState({
    nama: '',
    nominalIuran: '50000',
    periodeTipe: 'bulanan',
    hariJawa: 'Minggu Pon',
    waktuKocok: '19:30',
    lokasiKocok: 'Balai Pertemuan RT',
    autoSinkronAgenda: true,
    keterangan: '',
    selectedAnggotaIds: [] as string[],
  });

  // Form: Edit Kelompok
  const [editKelompokForm, setEditKelompokForm] = useState({
    nama: '',
    nominalIuran: '50000',
    periodeTipe: 'bulanan',
    hariJawa: 'Minggu Pon',
    waktuKocok: '19:30',
    lokasiKocok: 'Balai Pertemuan RT',
    autoSinkronAgenda: true,
    keterangan: '',
    status: 'aktif',
  });

  // Form: Tambah Peserta Manual / dari Warga
  const [newPesertaForm, setNewPesertaForm] = useState({
    namaPeserta: '',
    anggotaId: '',
    nomorSlot: '1',
    noHp: '',
  });

  // Form: Konfirmasi Pengundian & Pemenang
  const [winnerConfigForm, setWinnerConfigForm] = useState({
    tanggalKocok: new Date().toISOString().split('T')[0],
    hariJawa: '',
    agendaId: '',
    statusTalangan: 'tidak_ditalangi', // "tidak_ditalangi" | "ditalangi_kas"
    sinkronAgendaBerikutnya: true,
    lokasiBerikutnya: '',
    tanggalBerikutnya: '',
    catatan: '',
  });

  // Helper memisahkan Hari dan Pasaran dari string hariJawa (e.g. "Minggu Pon")
  const parseHariPasaran = (hjStr: string | null | undefined) => {
    if (!hjStr) return { hari: 'Minggu', pasaran: 'Pon' };
    const clean = hjStr.replace(/^malam\s+/i, '').trim();
    const parts = clean.split(' ');
    const hari = HARI_LIST.find((h) => h.toLowerCase() === parts[0]?.toLowerCase()) || 'Minggu';
    const pasaran = PASARAN_LIST.find((p) => p.toLowerCase() === parts[1]?.toLowerCase()) || 'Pon';
    return { hari, pasaran };
  };

  const editKelompokHari = useMemo(() => {
    return parseHariPasaran(editKelompokForm.hariJawa).hari;
  }, [editKelompokForm.hariJawa]);

  const editKelompokPasaran = useMemo(() => {
    return parseHariPasaran(editKelompokForm.hariJawa).pasaran;
  }, [editKelompokForm.hariJawa]);

  const nextEditMeetingFormatted = useMemo(() => {
    try {
      const d = findNextWetonDate(editKelompokForm.hariJawa || 'Minggu Pon');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [editKelompokForm.hariJawa]);

  const newKelompokHari = useMemo(() => {
    return parseHariPasaran(newKelompokForm.hariJawa).hari;
  }, [newKelompokForm.hariJawa]);

  const newKelompokPasaran = useMemo(() => {
    return parseHariPasaran(newKelompokForm.hariJawa).pasaran;
  }, [newKelompokForm.hariJawa]);

  const nextNewMeetingFormatted = useMemo(() => {
    try {
      const d = findNextWetonDate(newKelompokForm.hariJawa || 'Minggu Pon');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [newKelompokForm.hariJawa]);

  // Local state for Iuran & Kehadiran checklist changes in active putaran
  const [localIuranState, setLocalIuranState] = useState<
    Record<
      string,
      {
        statusBayar: boolean;
        statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir';
        catatan?: string;
      }
    >
  >({});

  // Local talangan toggle in checklist
  const [localTalanganMode, setLocalTalanganMode] = useState<'tidak_ditalangi' | 'ditalangi_kas'>('tidak_ditalangi');

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
          const targetId =
            preferredId ||
            (selectedKelompokId && json.data.some((k: any) => k.id === selectedKelompokId)
              ? selectedKelompokId
              : json.data[0].id);
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
  const fetchKelompokDetail = async (id: string, preserveLocalState: boolean = false) => {
    try {
      const res = await fetch(`/api/arisan/${id}`);
      const json = await res.json();
      if (json.success) {
        setKelompokDetail(json.data);

        // Pre-fill edit kelompok form
        setEditKelompokForm({
          nama: json.data.nama,
          nominalIuran: String(json.data.nominalIuran),
          periodeTipe: json.data.periodeTipe || 'bulanan',
          hariJawa: json.data.hariJawa || 'Minggu Pon',
          waktuKocok: json.data.waktuKocok || '19:30',
          lokasiKocok: json.data.lokasiKocok || 'Balai RT',
          autoSinkronAgenda: json.data.autoSinkronAgenda ?? true,
          keterangan: json.data.keterangan || '',
          status: json.data.status || 'aktif',
        });

        // Selalu inisialisasi lembar presensi & iuran segar untuk persiapan putaran berikutnya
        if (!preserveLocalState) {
          const map: Record<
            string,
            { statusBayar: boolean; statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir'; catatan?: string }
          > = {};
          if (Array.isArray(json.data.peserta)) {
            json.data.peserta.forEach((peserta: any) => {
              map[peserta.id] = {
                statusBayar: false,
                statusKehadiran: 'hadir',
                catatan: '',
              };
            });
          }
          setLocalIuranState(map);
          setLocalTalanganMode('tidak_ditalangi');
          setIsAbsensiConfirmed(false);
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

  // Fetch upcoming agendas for linking
  const fetchUpcomingAgendas = async () => {
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUpcomingAgendas(
          data
            .filter((ag: any) => ag.status === 'terjadwal')
            .map((ag: any) => ({
              id: ag.id,
              judul: ag.judul,
              tanggal: ag.tanggal,
              waktuMulai: ag.waktuMulai,
              lokasi: ag.lokasi,
            }))
        );
      }
    } catch (err) {
      console.warn('Error fetching agendas:', err);
    }
  };

  useEffect(() => {
    fetchKelompokList();
    fetchAllAnggota();
    fetchUpcomingAgendas();
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

  // Tunggakan peserta dari seluruh putaran sebelumnya yang belum lunas
  const tunggakanByPesertaId = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        putaranKe: number;
        tanggalKocok: string;
        nominal: number;
        pembayaranId: string;
        putaranId: string;
      }>
    >();

    if (!kelompokDetail || !kelompokDetail.putaran) return map;

    kelompokDetail.putaran.forEach((putaran) => {
      if (Array.isArray(putaran.pembayaran)) {
        putaran.pembayaran.forEach((pem) => {
          if (!pem.statusBayar) {
            const list = map.get(pem.pesertaId) || [];
            list.push({
              putaranKe: putaran.putaranKe,
              tanggalKocok: putaran.tanggalKocok,
              nominal: pem.nominal,
              pembayaranId: pem.id,
              putaranId: putaran.id,
            });
            map.set(pem.pesertaId, list);
          }
        });
      }
    });

    return map;
  }, [kelompokDetail]);

  const totalSemuaTunggakan = useMemo(() => {
    let sum = 0;
    tunggakanByPesertaId.forEach((list) => {
      list.forEach((item) => {
        sum += item.nominal;
      });
    });
    return sum;
  }, [tunggakanByPesertaId]);

  interface UnifiedIuranRow {
    rowKey: string;
    pesertaId: string;
    namaPeserta: string;
    noRumah?: string | null;
    noHp?: string | null;
    nominal: number;
    statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir';
    statusBayar: boolean;
    sudahMenang?: boolean;
    tunggakanLalu: Array<{
      putaranKe: number;
      tanggalKocok: string;
      nominal: number;
      pembayaranId: string;
      putaranId: string;
    }>;
  }

  // Baris presensi & iuran peserta untuk persiapan putaran berjalan
  const unifiedIuranRows: UnifiedIuranRow[] = useMemo(() => {
    if (!kelompokDetail || !kelompokDetail.peserta) return [];

    return kelompokDetail.peserta.map((peserta) => {
      const state = localIuranState[peserta.id] || {
        statusBayar: false,
        statusKehadiran: 'hadir',
      };
      const tunggakanLalu = tunggakanByPesertaId.get(peserta.id) || [];

      return {
        rowKey: peserta.id,
        pesertaId: peserta.id,
        namaPeserta: peserta.namaPeserta,
        noRumah: peserta.anggota?.noRumah,
        noHp: peserta.noHp,
        nominal: kelompokDetail.nominalIuran,
        statusKehadiran: state.statusKehadiran,
        statusBayar: state.statusBayar,
        sudahMenang: peserta.sudahMenang,
        tunggakanLalu,
      };
    });
  }, [kelompokDetail, localIuranState, tunggakanByPesertaId]);

  // Real-time calculation of active putaran finance & attendance
  const latestPutaranStats = useMemo(() => {
    if (!kelompokDetail) {
      return {
        totalTarget: 0,
        totalTerkumpul: 0,
        nominalKurang: 0,
        nominalDiserahkan: 0,
        paidCount: 0,
        unpaidCount: 0,
        hadirCount: 0,
        izinCount: 0,
        tidakHadirCount: 0,
        absenCount: 0,
        absenDanNunggakCount: 0,
      };
    }

    const totalTarget = kelompokDetail.peserta.length * kelompokDetail.nominalIuran;
    let totalTerkumpul = 0;
    let paidCount = 0;
    let hadirCount = 0;
    let izinCount = 0;
    let tidakHadirCount = 0;
    let absenDanNunggakCount = 0;

    unifiedIuranRows.forEach((r) => {
      if (r.statusBayar) {
        totalTerkumpul += r.nominal;
        paidCount++;
      }

      if (r.statusKehadiran === 'hadir') {
        hadirCount++;
      } else if (r.statusKehadiran === 'izin') {
        izinCount++;
        if (!r.statusBayar) absenDanNunggakCount++;
      } else {
        tidakHadirCount++;
        if (!r.statusBayar) absenDanNunggakCount++;
      }
    });

    const absenCount = izinCount + tidakHadirCount;
    const unpaidCount = unifiedIuranRows.length - paidCount;
    const nominalKurang = Math.max(0, totalTarget - totalTerkumpul);
    const nominalDiserahkan =
      localTalanganMode === 'ditalangi_kas' ? totalTarget : totalTerkumpul;

    return {
      totalTarget,
      totalTerkumpul,
      nominalKurang,
      nominalDiserahkan,
      paidCount,
      unpaidCount,
      hadirCount,
      izinCount,
      tidakHadirCount,
      absenCount,
      absenDanNunggakCount,
    };
  }, [kelompokDetail, unifiedIuranRows, localTalanganMode]);

  // Gating & Kondisi Kesiapan Roda Putar
  const isIuranComplete = useMemo(() => {
    if (!kelompokDetail || kelompokDetail.peserta.length === 0) return false;
    return latestPutaranStats.nominalKurang === 0 || localTalanganMode === 'ditalangi_kas';
  }, [kelompokDetail, latestPutaranStats.nominalKurang, localTalanganMode]);

  const isReadyToSpin = useMemo(() => {
    if (!kelompokDetail || kelompokDetail.peserta.length === 0) return false;
    if (wheelCandidates.length === 0) return false;
    return isAbsensiConfirmed && isIuranComplete;
  }, [kelompokDetail, wheelCandidates.length, isAbsensiConfirmed, isIuranComplete]);

  const spinDisabledReason = useMemo(() => {
    if (!kelompokDetail || kelompokDetail.peserta.length === 0) {
      return 'Tambahkan peserta terlebih dahulu';
    }
    if (wheelCandidates.length === 0) {
      return 'Semua peserta sudah menang (Siklus Selesai)';
    }
    if (!isAbsensiConfirmed) {
      return 'Absensi belum dikonfirmasi (Tandai kehadiran & klik "Konfirmasi Absensi Selesai")';
    }
    if (!isIuranComplete) {
      return `Uang iuran kurang Rp ${latestPutaranStats.nominalKurang.toLocaleString('id-ID')} (Lengkapi atau Aktifkan Talangan Kas RT)`;
    }
    return undefined;
  }, [
    kelompokDetail,
    wheelCandidates.length,
    isAbsensiConfirmed,
    isIuranComplete,
    latestPutaranStats.nominalKurang,
  ]);

  // Quick actions: Tandai Semua Hadir
  const handleMarkAllHadir = () => {
    setLocalIuranState((prev) => {
      const next = { ...prev };
      unifiedIuranRows.forEach((r) => {
        const cur = next[r.rowKey] || { statusBayar: r.statusBayar, statusKehadiran: 'hadir' };
        next[r.rowKey] = { ...cur, statusKehadiran: 'hadir' };
      });
      return next;
    });
    setIsAbsensiConfirmed(true);
    showToast('Seluruh peserta ditandai Hadir & Absensi terverifikasi', 'success');
  };

  // Quick actions: Tandai Semua Lunas
  const handleMarkAllLunas = () => {
    setLocalIuranState((prev) => {
      const next = { ...prev };
      unifiedIuranRows.forEach((r) => {
        const cur = next[r.rowKey] || { statusBayar: false, statusKehadiran: r.statusKehadiran };
        next[r.rowKey] = { ...cur, statusBayar: true };
      });
      return next;
    });
    showToast('Seluruh peserta ditandai Lunas iuran arisan', 'success');
  };

  // Reset Lembar Kerja Presensi untuk pertemuan ini
  const handleResetLembarPresensi = () => {
    if (!kelompokDetail) return;
    const isOk = window.confirm(
      'Reset lembar presensi & iuran untuk persiapan pertemuan ini?\n\nSemua peserta akan kembali ke status belum bayar dan siap diabsen ulang.'
    );
    if (!isOk) return;

    const freshMap: Record<
      string,
      { statusBayar: boolean; statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir'; catatan?: string }
    > = {};
    kelompokDetail.peserta.forEach((p) => {
      freshMap[p.id] = { statusBayar: false, statusKehadiran: 'hadir', catatan: '' };
    });
    setLocalIuranState(freshMap);
    setLocalTalanganMode('tidak_ditalangi');
    setIsAbsensiConfirmed(false);
    showToast('Lembar presensi telah di-reset untuk pertemuan baru', 'success');
  };

  // Lunasi tunggakan dari putaran sebelumnya
  const handlePayArrears = async (pembayaranId: string, putaranId: string) => {
    if (!selectedKelompokId) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${selectedKelompokId}/iuran`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          putaranId,
          pembayaranId,
          statusBayar: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Tunggakan putaran lalu berhasil dilunasi', 'success');
        await fetchKelompokDetail(selectedKelompokId, true);
        await fetchKelompokList(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal melunasi tunggakan', 'error');
      }
    } catch (err) {
      console.error('Error paying arrears:', err);
      showToast('Terjadi kesalahan saat melunasi tunggakan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Iuran items based on iuranFilter tab
  const filteredIuranItems = useMemo(() => {
    return unifiedIuranRows.filter((r) => {
      if (iuranFilter === 'punya_tunggakan_lalu') {
        return r.tunggakanLalu.length > 0;
      }
      if (iuranFilter === 'tidak_berangkat_belum_bayar') {
        return r.statusKehadiran !== 'hadir' && !r.statusBayar;
      }
      if (iuranFilter === 'tidak_berangkat') {
        return r.statusKehadiran !== 'hadir';
      }
      if (iuranFilter === 'belum_bayar') {
        return !r.statusBayar;
      }
      if (iuranFilter === 'lunas') {
        return r.statusBayar;
      }
      return true; // semua
    });
  }, [unifiedIuranRows, iuranFilter]);

  // When spin finishes, open the confirmation dialog with automatic weton and host calculation
  const handleSpinEnd = (winner: SpinCandidate) => {
    setPendingWinner(winner);
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const todayHariJawa = getHariJawa(todayDateStr);

    const winnerData = kelompokDetail?.peserta.find((p) => p.id === winner.id);
    const noRumah = winnerData?.anggota?.noRumah;
    const defaultHostLocation = `Rumah Bpk/Ibu ${winner.namaPeserta}${
      noRumah ? ` (No. ${noRumah})` : ''
    }`;

    let nextMeetingDateStr = '';
    try {
      const nextDate = kelompokDetail?.hariJawa
        ? findNextWetonDate(kelompokDetail.hariJawa, new Date(today.getTime() + 86400000 * 2))
        : new Date(today.getTime() + 86400000 * 30);
      nextMeetingDateStr = nextDate.toISOString().split('T')[0];
    } catch {
      nextMeetingDateStr = '';
    }

    setWinnerConfigForm({
      tanggalKocok: todayDateStr,
      hariJawa: kelompokDetail?.hariJawa || todayHariJawa,
      agendaId: upcomingAgendas.length > 0 ? upcomingAgendas[0].id : '',
      statusTalangan: localTalanganMode,
      sinkronAgendaBerikutnya: kelompokDetail?.autoSinkronAgenda ?? true,
      lokasiBerikutnya: defaultHostLocation,
      tanggalBerikutnya: nextMeetingDateStr,
      catatan: `Undian putaran ke-${(kelompokDetail?.putaran.length || 0) + 1}`,
    });
    setIsWinnerModalOpen(true);
  };

  // Confirm winner and commit to database
  const handleConfirmWinner = async () => {
    if (!selectedKelompokId || !pendingWinner) return;

    try {
      setIsSaving(true);
      const kehadiranDanIuranList = unifiedIuranRows.map((r) => ({
        pesertaId: r.pesertaId,
        statusKehadiran: r.statusKehadiran,
        statusBayar: r.statusBayar,
      }));

      const res = await fetch(`/api/arisan/${selectedKelompokId}/kocok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pemenangId: pendingWinner.id,
          tanggalKocok: winnerConfigForm.tanggalKocok,
          hariJawa: winnerConfigForm.hariJawa,
          agendaId: winnerConfigForm.agendaId || null,
          statusTalangan: localTalanganMode,
          kehadiranDanIuranList,
          sinkronAgendaBerikutnya: winnerConfigForm.sinkronAgendaBerikutnya,
          lokasiBerikutnya: winnerConfigForm.lokasiBerikutnya,
          tanggalBerikutnya: winnerConfigForm.tanggalBerikutnya,
          catatan: winnerConfigForm.catatan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        setIsWinnerModalOpen(false);
        setPendingWinner(null);

        // Fetch detail, which will reset presensi for the next round
        await fetchKelompokDetail(selectedKelompokId, false);
        await fetchKelompokList(selectedKelompokId);
        await fetchUpcomingAgendas();
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

  // Delete Kelompok Arisan
  const handleDeleteKelompok = async () => {
    if (!kelompokDetail) return;
    const isConfirmed = window.confirm(
      `Hapus kelompok arisan "${kelompokDetail.nama}"?\n\nTindakan ini permanen. Seluruh data peserta, putaran, presensi kehadiran, dan riwayat iuran akan dihapus.`
    );
    if (!isConfirmed) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${kelompokDetail.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Kelompok arisan "${kelompokDetail.nama}" berhasil dihapus`, 'success');
        setIsEditKelompokModalOpen(false);
        setSelectedKelompokId(null);
        setKelompokDetail(null);
        await fetchKelompokList();
      } else {
        showToast(json.error || 'Gagal menghapus kelompok arisan', 'error');
      }
    } catch (err) {
      console.error('Error deleting kelompok:', err);
      showToast('Terjadi kesalahan saat menghapus kelompok', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle local iuran status
  const handleToggleIuranStatus = (pembayaranId: string) => {
    setLocalIuranState((prev) => {
      const current = prev[pembayaranId] || { statusBayar: false, statusKehadiran: 'hadir' };
      return {
        ...prev,
        [pembayaranId]: {
          ...current,
          statusBayar: !current.statusBayar,
        },
      };
    });
  };

  // Change presence status (hadir / izin / tidak_hadir)
  const handleChangeKehadiran = (
    pembayaranId: string,
    statusKehadiran: 'hadir' | 'izin' | 'tidak_hadir'
  ) => {
    setLocalIuranState((prev) => {
      const current = prev[pembayaranId] || { statusBayar: false, statusKehadiran: 'hadir' };
      return {
        ...prev,
        [pembayaranId]: {
          ...current,
          statusKehadiran,
        },
      };
    });
  };

  // Save Iuran & Kehadiran changes to DB
  const handleSaveIuranChanges = async () => {
    if (!selectedKelompokId || !kelompokDetail?.putaran[0]) return;
    const latestPutaran = kelompokDetail.putaran[0];

    try {
      setIsSaving(true);
      const payload = latestPutaran.pembayaran.map((p) => {
        const state = localIuranState[p.id] || {
          statusBayar: p.statusBayar,
          statusKehadiran: p.statusKehadiran,
          catatan: p.catatan,
        };
        return {
          id: p.id,
          statusBayar: state.statusBayar,
          statusKehadiran: state.statusKehadiran,
          catatan: state.catatan,
        };
      });

      const res = await fetch(`/api/arisan/${selectedKelompokId}/iuran`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          putaranId: latestPutaran.id,
          pembayaranList: payload,
          statusTalangan: localTalanganMode,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Status kehadiran & iuran putaran berhasil disimpan', 'success');
        await fetchKelompokDetail(selectedKelompokId);
        await fetchKelompokList(selectedKelompokId);
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

  // Save Edit Kelompok Form
  const handleUpdateKelompok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelompokId) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/arisan/${selectedKelompokId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: editKelompokForm.nama,
          nominalIuran: Number(editKelompokForm.nominalIuran),
          periodeTipe: editKelompokForm.periodeTipe,
          hariJawa: editKelompokForm.hariJawa,
          waktuKocok: editKelompokForm.waktuKocok,
          lokasiKocok: editKelompokForm.lokasiKocok,
          autoSinkronAgenda: editKelompokForm.autoSinkronAgenda,
          keterangan: editKelompokForm.keterangan,
          status: editKelompokForm.status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Pengaturan kelompok arisan berhasil diperbarui!', 'success');
        setIsEditKelompokModalOpen(false);
        await fetchKelompokDetail(selectedKelompokId);
        await fetchKelompokList(selectedKelompokId);
      } else {
        showToast(json.error || 'Gagal memperbarui kelompok', 'error');
      }
    } catch (err) {
      console.error('Error updating kelompok:', err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Manual Sync Next Agenda RT
  const handleManualSyncAgenda = async () => {
    if (!kelompokDetail || !kelompokDetail.hariJawa) {
      showToast('Tentukan Hari Jawa terlebih dahulu di pengaturan kelompok', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const nextDate = findNextWetonDate(kelompokDetail.hariJawa);
      const nextRound = (kelompokDetail.putaran.length || 0) + 1;

      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: `Rapat Rutin & Arisan: ${kelompokDetail.nama} (#${nextRound})`,
          kategori: 'rapat',
          tanggal: nextDate.toISOString(),
          waktuMulai: kelompokDetail.waktuKocok || '19:30',
          lokasi: kelompokDetail.lokasiKocok || 'Balai RT',
          keterangan: `Pertemuan warga rutin (${kelompokDetail.hariJawa}) dan pengundian arisan putaran ke-${nextRound}.`,
          status: 'terjadwal',
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(`Agenda berhasil ditambahkan ke kalender RT untuk tanggal ${nextDate.toLocaleDateString('id-ID')}`, 'success');
        await fetchUpcomingAgendas();
      } else {
        showToast(json.error || 'Gagal menambahkan agenda', 'error');
      }
    } catch (err) {
      console.error('Error syncing agenda:', err);
      showToast('Terjadi kesalahan saat menyinkronkan ke agenda', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset cycle
  const handleResetSiklus = async () => {
    if (!selectedKelompokId) return;
    if (
      !confirm(
        'Apakah Anda yakin ingin me-reset siklus arisan ini? Semua peserta akan dapat diundi kembali untuk siklus babak baru.'
      )
    ) {
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
          hariJawa: newKelompokForm.hariJawa,
          waktuKocok: newKelompokForm.waktuKocok,
          lokasiKocok: newKelompokForm.lokasiKocok,
          autoSinkronAgenda: newKelompokForm.autoSinkronAgenda,
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
          hariJawa: 'Malam Minggu Pon',
          waktuKocok: '19:30',
          lokasiKocok: 'Balai Pertemuan RT',
          autoSinkronAgenda: true,
          keterangan: '',
          selectedAnggotaIds: [],
        });
        await fetchKelompokList(json.data.id);
        await fetchUpcomingAgendas();
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

  // Enhanced WhatsApp share message generator
  const getWhatsAppShareUrl = (putaran: PutaranItem) => {
    const groupName = kelompokDetail?.nama || 'Arisan RT';
    const dateFormatted = new Date(putaran.tanggalKocok).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hariJawaStr = putaran.hariJawa ? ` (${putaran.hariJawa})` : '';
    const prizeFormatted = `Rp ${putaran.nominalDiserahkan.toLocaleString('id-ID')}`;
    const targetFormatted = `Rp ${putaran.totalTarget.toLocaleString('id-ID')}`;

    const paidMembers = putaran.pembayaran.filter((p) => p.statusBayar);
    const unpaidMembers = putaran.pembayaran.filter((p) => !p.statusBayar);
    const absentMembers = putaran.pembayaran.filter((p) => p.statusKehadiran !== 'hadir');
    const absentAndUnpaid = putaran.pembayaran.filter((p) => p.statusKehadiran !== 'hadir' && !p.statusBayar);

    let message = `🎉 *PENGUMUMAN HASIL RAPAT & ARISAN* 🎉\n` +
      `*Kelompok:* ${groupName}\n` +
      `*Putaran Ke:* #${putaran.putaranKe}\n` +
      `*Waktu:* ${dateFormatted}${hariJawaStr}\n\n` +
      `Alhamdulillah, selamat kepada pemenang undian:\n` +
      `🏆 *${putaran.namaPemenang}*\n` +
      `Dana yang diserahkan: *${prizeFormatted}* (dari total hak: ${targetFormatted})\n\n`;

    if (putaran.nominalKurang > 0) {
      message += `⚠️ *Catatan Keuangan:* Terdapat kekurangan iuran sebesar *Rp ${putaran.nominalKurang.toLocaleString('id-ID')}* (${unpaidMembers.length} warga belum setor).\n`;
      if (putaran.statusTalangan === 'ditalangi_kas') {
        message += `_Kekurangan telah ditalangi sementara oleh Kas Pengurus agar pemenang menerima penuh._\n\n`;
      } else {
        message += `_Pemenang menerima dana seadanya terlebih dahulu dan kekurangan akan diserahkan setelah iuran tertagih._\n\n`;
      }
    }

    message += `📊 *Rekap Transparansi Pertemuan:*\n` +
      `• Hadir di Pertemuan: ${putaran.pembayaran.length - absentMembers.length} warga\n` +
      `• Tidak Berangkat: ${absentMembers.length} warga\n` +
      `• Iuran Lunas: ${paidMembers.length} warga (Rp ${putaran.totalTerkumpul.toLocaleString('id-ID')})\n` +
      `• Belum Bayar: ${unpaidMembers.length} warga\n\n`;

    if (absentAndUnpaid.length > 0) {
      message += `📌 *Daftar Belum Hadir & Belum Setor Iuran:*\n`;
      absentAndUnpaid.forEach((m, idx) => {
        message += `${idx + 1}. ${m.peserta.namaPeserta}\n`;
      });
      message += `_Bagi warga yang berhalangan hadir, mohon kesediaannya untuk menitipkan/mentransfer iuran ke Bendahara. Terima kasih!_\n\n`;
    }

    message += `_Salam Hangat, Pengurus Paguyuban RT / Komuna_`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeMenu="Arisan Warga" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Content Container */}
        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
          {/* Notification Toast */}
          {notification && (
            <div
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all animate-bounce ${
                notification.type === 'success'
                  ? 'bg-emerald-600 shadow-emerald-100'
                  : 'bg-rose-600 shadow-rose-100'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                    Arisan & Pertemuan Warga
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">
                    Jadwal weton hari Jawa, pengundian roda putar digital, presensi rapat, dan transparansi keuangan.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {kelompokDetail && (
                <>
                  <button
                    type="button"
                    onClick={handleManualSyncAgenda}
                    disabled={isSaving}
                    className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Jadwalkan pertemuan berikutnya ke kalender Agenda RT"
                  >
                    <BookmarkPlus className="w-4 h-4 text-teal-600" />
                    <span>Jadwalkan ke Agenda RT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditKelompokModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Pengaturan Kelompok</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteKelompok}
                    disabled={isSaving}
                    className="px-3.5 py-2.5 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Hapus kelompok arisan ini"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Hapus Kelompok</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kelompok Baru</span>
              </button>
            </div>
          </div>

          {/* Group Selector Pills */}
          {kelompokList.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {kelompokList.map((k) => {
                const isSelected = k.id === selectedKelompokId;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setSelectedKelompokId(k.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{k.nama}</span>
                    {k.hariJawa && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-[var(--brand-primary)]'
                        }`}
                      >
                        {k.hariJawa}
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {k.totalPeserta} Warga
                    </span>
                  </button>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Belum Ada Kelompok Arisan
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Mulai buat kelompok arisan pertama untuk warga RT, bapak-bapak, atau ibu-ibu PKK dengan klik tombol di bawah.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kelompok Arisan</span>
              </button>
            </div>
          ) : null}

          {/* Active Group Details */}
          {kelompokDetail && (
            <>
              {/* Group Schedule & Location Banner */}
              <div className="bg-gradient-to-r from-orange-50/80 via-white to-amber-50/60 p-4 rounded-2xl border border-orange-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span className="font-semibold text-slate-400">Jadwal Kalender RT:</span>
                    <span className="font-bold text-slate-900">
                      {kelompokDetail.hariJawa || 'Belum diatur'}
                    </span>
                    {kelompokDetail.hariJawa && (
                      <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-medium">
                        Berikutnya: {findNextWetonDate(kelompokDetail.hariJawa).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-slate-400">Pukul:</span>
                    <span className="font-bold text-slate-900">
                      {kelompokDetail.waktuKocok ? `${kelompokDetail.waktuKocok} WIB` : '19:30 WIB'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-400">Lokasi:</span>
                    <span className="font-bold text-slate-900">
                      {kelompokDetail.lokasiKocok || 'Balai RT 04'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/agenda"
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span>Kalender Agenda RT</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </a>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                      kelompokDetail.autoSinkronAgenda
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {kelompokDetail.autoSinkronAgenda ? 'Auto-Sync: Aktif' : 'Sync: Manual'}
                  </span>
                </div>
              </div>

              {/* 4 Bento Grid Metric Cards: Real-Time Financials & Attendance */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Hak Hadiah (Target) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-orange-50 text-[var(--brand-primary)]">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Hak Hadiah (Target)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-xl font-bold text-slate-800">
                        Rp {latestPutaranStats.totalTarget.toLocaleString('id-ID')}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {kelompokDetail.peserta.length} Warga × Rp {kelompokDetail.nominalIuran.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Uang Terkumpul */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Iuran Terkumpul
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-xl font-bold text-emerald-600">
                        Rp {latestPutaranStats.totalTerkumpul.toLocaleString('id-ID')}
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {latestPutaranStats.paidCount} dari {kelompokDetail.peserta.length} Warga Lunas
                    </span>
                  </div>
                </div>

                {/* Metric 3: Kekurangan / Nunggak */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div
                    className={`p-3 rounded-2xl ${
                      latestPutaranStats.nominalKurang > 0
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Kekurangan Iuran
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3
                        className={`text-xl font-bold ${
                          latestPutaranStats.nominalKurang > 0 ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        Rp {latestPutaranStats.nominalKurang.toLocaleString('id-ID')}
                      </h3>
                    </div>
                    <span className="text-[11px] text-rose-500 font-medium">
                      {latestPutaranStats.unpaidCount} Orang Belum Bayar
                    </span>
                  </div>
                </div>

                {/* Metric 4: Diserahkan ke Pemenang */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Dana Diserahkan
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-xl font-bold text-blue-600">
                        Rp {latestPutaranStats.nominalDiserahkan.toLocaleString('id-ID')}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        localTalanganMode === 'ditalangi_kas'
                          ? 'bg-blue-100 text-blue-800'
                          : latestPutaranStats.nominalKurang > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {localTalanganMode === 'ditalangi_kas'
                        ? 'Ditalangi Kas RT'
                        : latestPutaranStats.nominalKurang > 0
                        ? 'Diserahkan Seadanya'
                        : 'Diserahkan Penuh'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main 2 Columns: Spin Wheel & Right Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Area: The Lucky Spin Wheel */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Roda Pengocokan Arisan Digital
                        </h2>
                        {kelompokDetail.hariJawa && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Setiap {kelompokDetail.hariJawa}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-orange-50 text-[var(--brand-primary)] font-bold">
                      Putaran ke-{(kelompokDetail.putaran.length || 0) + 1}
                    </span>
                  </div>

                  {/* SOP Stepper Status Card: Gating Indicator */}
                  <div className="w-full mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          SOP Kocokan Arisan RT (Putaran #{(kelompokDetail.putaran.length || 0) + 1})
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isReadyToSpin
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReadyToSpin ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Siap Diputar</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Prasyarat Belum Lengkap</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Step 1: Absensi */}
                      <div
                        className={`p-3 rounded-xl border transition ${
                          isAbsensiConfirmed
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <UserCheck
                              className={`w-3.5 h-3.5 ${
                                isAbsensiConfirmed ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                            1. Absensi Warga
                          </span>
                          {isAbsensiConfirmed ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                              Wajib Dicek
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          {latestPutaranStats.hadirCount} Berangkat • {latestPutaranStats.absenCount} Tidak Hadir
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAbsensiConfirmed(!isAbsensiConfirmed)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                              isAbsensiConfirmed
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isAbsensiConfirmed ? '✓ Absensi Selesai' : 'Konfirmasi Absensi Selesai'}
                          </button>
                          <button
                            type="button"
                            onClick={handleMarkAllHadir}
                            className="text-[10px] font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
                          >
                            Semua Hadir
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Penyerahan Uang Iuran */}
                      <div
                        className={`p-3 rounded-xl border transition ${
                          isIuranComplete
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <Coins
                              className={`w-3.5 h-3.5 ${
                                isIuranComplete ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                            2. Penyerahan Iuran
                          </span>
                          {isIuranComplete ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              {localTalanganMode === 'ditalangi_kas' ? 'Ditalangi Kas' : 'Lengkap 100%'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                              Kurang Uang
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          Terkumpul: <strong>Rp {latestPutaranStats.totalTerkumpul.toLocaleString('id-ID')}</strong>
                          {latestPutaranStats.nominalKurang > 0 && (
                            <span className="text-rose-600">
                              {' '}
                              (Kurang Rp {latestPutaranStats.nominalKurang.toLocaleString('id-ID')})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {latestPutaranStats.nominalKurang > 0 && localTalanganMode !== 'ditalangi_kas' ? (
                            <button
                              type="button"
                              onClick={() => setLocalTalanganMode('ditalangi_kas')}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                            >
                              Aktifkan Talangan Kas RT
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={handleMarkAllLunas}
                            className="text-[10px] font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
                          >
                            Semua Lunas
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Wheel (Strictly Circular 1:1) */}
                  <SpinWheel
                    candidates={wheelCandidates}
                    onSpinEnd={handleSpinEnd}
                    disabled={isSaving || !isReadyToSpin}
                    disabledReason={spinDisabledReason}
                  />

                  {/* Active Candidates Preview */}
                  <div className="w-full mt-6 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-600 mb-2 flex items-center justify-between">
                      <span>Peserta Dalam Roda ({wheelCandidates.length} warga)</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Siap Diundi
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {wheelCandidates.map((c) => (
                        <span
                          key={c.id}
                          className="text-xs px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          {c.namaPeserta}
                          {c.nomorSlot && c.nomorSlot > 1 ? ` (#${c.nomorSlot})` : ''}
                        </span>
                      ))}
                      {wheelCandidates.length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Semua peserta telah menang di siklus ini. Silakan klik reset untuk memulai siklus baru.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Tabs for Iuran & Presensi vs Peserta List */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  {/* Right Header Navigation Tabs */}
                  <div className="flex items-center border-b border-slate-100 p-2 gap-1 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setActiveSideTab('iuran')}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        activeSideTab === 'iuran'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Presensi & Iuran Putaran Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSideTab('peserta')}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        activeSideTab === 'peserta'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Daftar Peserta ({kelompokDetail.peserta.length})
                    </button>
                  </div>

                  {/* Tab 1: Presensi Kehadiran & Iuran Putaran */}
                  {activeSideTab === 'iuran' && (
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {kelompokDetail.peserta.length > 0 ? (
                          <>
                            {/* Round Info & Attendance summary */}
                            <div className="mb-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-800 text-xs block">
                                    Persiapan Putaran #{(kelompokDetail.putaran.length || 0) + 1}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {kelompokDetail.hariJawa || 'Pertemuan RT'} • Lokasi: {kelompokDetail.lokasiKocok || 'Balai RT'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleResetLembarPresensi}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                                  title="Reset status kehadiran dan bayar untuk persiapan pertemuan ini"
                                >
                                  <RotateCcw className="w-3 h-3 text-slate-400" />
                                  <span>Reset Lembar</span>
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {latestPutaranStats.hadirCount} Berangkat
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  {latestPutaranStats.absenCount} Tidak Berangkat
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  {latestPutaranStats.absenDanNunggakCount} Absen & Nunggak
                                </span>
                              </div>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
                              <button
                                type="button"
                                onClick={() => setIuranFilter('semua')}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                  iuranFilter === 'semua'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Semua ({unifiedIuranRows.length})
                              </button>

                              {unifiedIuranRows.filter((r) => r.tunggakanLalu.length > 0).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setIuranFilter('punya_tunggakan_lalu')}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                    iuranFilter === 'punya_tunggakan_lalu'
                                      ? 'bg-rose-700 text-white'
                                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  }`}
                                >
                                  Nunggak Lalu ({unifiedIuranRows.filter((r) => r.tunggakanLalu.length > 0).length})
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setIuranFilter('tidak_berangkat_belum_bayar')}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                  iuranFilter === 'tidak_berangkat_belum_bayar'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                Absen & Nunggak ({latestPutaranStats.absenDanNunggakCount})
                              </button>

                              <button
                                type="button"
                                onClick={() => setIuranFilter('tidak_berangkat')}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                  iuranFilter === 'tidak_berangkat'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Tidak Berangkat ({latestPutaranStats.absenCount})
                              </button>

                              <button
                                type="button"
                                onClick={() => setIuranFilter('belum_bayar')}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                  iuranFilter === 'belum_bayar'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                Belum Bayar ({latestPutaranStats.unpaidCount})
                              </button>

                              <button
                                type="button"
                                onClick={() => setIuranFilter('lunas')}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                                  iuranFilter === 'lunas'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                Lunas ({latestPutaranStats.paidCount})
                              </button>
                            </div>

                            {/* Checklist & Attendance Items */}
                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                              {filteredIuranItems.map((p) => {
                                const isAbsenAndUnpaid =
                                  p.statusKehadiran !== 'hadir' && !p.statusBayar;
                                const totalTunggakanLalu = p.tunggakanLalu.reduce(
                                  (sum, it) => sum + it.nominal,
                                  0
                                );

                                return (
                                  <div
                                    key={p.rowKey}
                                    className={`p-2.5 rounded-2xl border transition-colors ${
                                      isAbsenAndUnpaid
                                        ? 'bg-rose-50/70 border-rose-200'
                                        : p.statusBayar
                                        ? 'bg-emerald-50/60 border-emerald-200'
                                        : 'bg-white border-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      {/* Left: Participant Name & House */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-bold text-slate-800 truncate">
                                            {p.namaPeserta}
                                          </span>
                                          {p.sudahMenang && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                              Sudah Dapat
                                            </span>
                                          )}
                                          {isAbsenAndUnpaid && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-800 font-bold shrink-0">
                                              Absen & Nunggak
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                          Rp {p.nominal.toLocaleString('id-ID')}
                                          {p.noRumah ? ` • Rumah ${p.noRumah}` : ''}
                                        </div>
                                      </div>

                                      {/* Right: Presence Selector & Payment Toggle */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Presence Selector */}
                                        <select
                                          value={p.statusKehadiran}
                                          onChange={(e) =>
                                            handleChangeKehadiran(
                                              p.rowKey,
                                              e.target.value as 'hadir' | 'izin' | 'tidak_hadir'
                                            )
                                          }
                                          className={`text-[10px] font-bold px-2 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                                            p.statusKehadiran === 'hadir'
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                              : p.statusKehadiran === 'izin'
                                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                                              : 'bg-rose-100 text-rose-800 border-rose-300'
                                          }`}
                                        >
                                          <option value="hadir">Berangkat</option>
                                          <option value="izin">Izin</option>
                                          <option value="tidak_hadir">Tidak Hadir</option>
                                        </select>

                                        {/* Payment Button Toggle */}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleIuranStatus(p.rowKey)}
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 cursor-pointer transition ${
                                            p.statusBayar
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                                          }`}
                                        >
                                          {p.statusBayar ? (
                                            <>
                                              <Check className="w-3 h-3 stroke-[3]" />
                                              <span>Lunas</span>
                                            </>
                                          ) : (
                                            <span>Belum</span>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Tunggakan Lalu Alert & Settle Action */}
                                    {totalTunggakanLalu > 0 && (
                                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                        <span className="text-rose-700 font-bold flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                          <span>
                                            Nunggak Lalu: Rp {totalTunggakanLalu.toLocaleString('id-ID')}
                                          </span>
                                          <span className="font-normal text-rose-500">
                                            ({p.tunggakanLalu.map((t) => `#${t.putaranKe}`).join(', ')})
                                          </span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePayArrears(
                                              p.tunggakanLalu[0].pembayaranId,
                                              p.tunggakanLalu[0].putaranId
                                            )
                                          }
                                          disabled={isSaving}
                                          className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition cursor-pointer"
                                        >
                                          Lunasi Tagihan
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="py-14 text-center text-slate-400 text-xs">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                            Belum ada peserta dalam kelompok arisan ini.
                            <br />
                            Tambahkan peserta terlebih dahulu untuk mencatat presensi & iuran.
                          </div>
                        )}
                      </div>

                      {kelompokDetail.peserta.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                          {/* Talangan Toggle Switch */}
                          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs cursor-pointer">
                            <div>
                              <span className="font-bold text-slate-800 block">
                                Talangi Kekurangan dari Kas RT
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Pemenang menerima uang penuh; kas RT menggantikan sementara uang warga yang nunggak.
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={localTalanganMode === 'ditalangi_kas'}
                              onChange={(e) =>
                                setLocalTalanganMode(e.target.checked ? 'ditalangi_kas' : 'tidak_ditalangi')
                              }
                              className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] w-4 h-4 cursor-pointer"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleSaveIuranChanges}
                            disabled={isSaving}
                            className="w-full py-2.5 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            {kelompokDetail.putaran.length > 0
                              ? 'Simpan Perubahan Kehadiran & Iuran'
                              : 'Simpan Kesiapan Presensi & Iuran'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Peserta List */}
                  {activeSideTab === 'peserta' && (
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
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
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddPesertaModalOpen(true)}
                            className="p-2 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] transition-colors shrink-0 cursor-pointer shadow-sm"
                            title="Tambah Peserta"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* List of participants */}
                        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                          {filteredPeserta.map((p, idx) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 text-slate-400 text-right font-mono text-[11px]">
                                  {idx + 1}.
                                </span>
                                <div>
                                  <div className="font-bold text-slate-800">
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
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    Sudah Dapat
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                                    Belum Dapat
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Total: {kelompokDetail.peserta.length} peserta</span>
                        <button
                          type="button"
                          onClick={() => setIsAddPesertaModalOpen(true)}
                          className="text-[var(--brand-primary)] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Peserta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Area: History of Rounds */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">
                        Riwayat Putaran & Catatan Keuangan Arisan
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        Total {kelompokDetail.putaran.length} Putaran Telah Terlaksana
                      </span>
                    </div>
                  </div>
                </div>

                {kelompokDetail.putaran.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {kelompokDetail.putaran.map((putaran) => {
                      const dateStr = new Date(putaran.tanggalKocok).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });
                      const paidCount = putaran.pembayaran.filter((p) => p.statusBayar).length;
                      const absentCount = putaran.pembayaran.filter((p) => p.statusKehadiran !== 'hadir').length;
                      const totalMembers = putaran.pembayaran.length;

                      return (
                        <div
                          key={putaran.id}
                          className="py-4 space-y-2 text-sm"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-9 h-9 rounded-2xl bg-orange-50 text-[var(--brand-primary)] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                                #{putaran.putaranKe}
                              </span>
                              <div>
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                  <span>{putaran.namaPemenang}</span>
                                  {putaran.hariJawa && (
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-orange-50 text-[var(--brand-primary)] font-medium">
                                      {putaran.hariJawa}
                                    </span>
                                  )}
                                  <span className="text-xs font-normal text-slate-400">
                                    ({dateStr})
                                  </span>
                                </div>

                                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                  <span>
                                    Iuran Terkumpul: <strong>Rp {putaran.totalTerkumpul.toLocaleString('id-ID')}</strong> ({paidCount}/{totalMembers} Lunas)
                                  </span>
                                  {putaran.nominalKurang > 0 && (
                                    <span className="text-rose-600 font-semibold">
                                      • Kurang: Rp {putaran.nominalKurang.toLocaleString('id-ID')}
                                    </span>
                                  )}
                                  <span>
                                    • {totalMembers - absentCount} Hadir ({absentCount} Absen)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 md:self-center self-end">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Dana Diterima Pemenang</span>
                                <span className="font-bold text-emerald-600 text-base">
                                  Rp {putaran.nominalDiserahkan.toLocaleString('id-ID')}
                                </span>
                                {putaran.statusTalangan === 'ditalangi_kas' && (
                                  <span className="text-[10px] text-blue-600 font-bold block">
                                    (Ditalangi Kas)
                                  </span>
                                )}
                              </div>

                              <a
                                href={getWhatsAppShareUrl(putaran)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                                title="Bagikan Rekap & Pemenang ke WhatsApp Warga"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share WA</span>
                              </a>
                            </div>
                          </div>

                          {/* Accordion Toggle: Rincian Kehadiran & Tunggakan */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPutaranId(
                                  expandedPutaranId === putaran.id ? null : putaran.id
                                )
                              }
                              className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>
                                {expandedPutaranId === putaran.id
                                  ? 'Tutup Rincian Putaran'
                                  : 'Lihat Rincian Kehadiran & Tunggakan'}
                              </span>
                              {expandedPutaranId === putaran.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {putaran.agenda?.lokasi && (
                              <span className="text-[11px] text-slate-500">
                                Tuan Rumah: <strong>{putaran.agenda.lokasi}</strong>
                              </span>
                            )}
                          </div>

                          {/* Expanded Details: Absent List & Unpaid List */}
                          {expandedPutaranId === putaran.id && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {/* Kolom 1: Daftar Yang Tidak Berangkat / Izin */}
                                <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                                  <div className="font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-100">
                                    <span className="flex items-center gap-1.5 text-amber-700">
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Warga Tidak Berangkat / Izin</span>
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                                      {putaran.pembayaran.filter((p) => p.statusKehadiran !== 'hadir').length} Orang
                                    </span>
                                  </div>
                                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {putaran.pembayaran
                                      .filter((p) => p.statusKehadiran !== 'hadir')
                                      .map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center justify-between py-1 text-[11px] border-b border-slate-50"
                                        >
                                          <div>
                                            <span className="font-medium text-slate-800">
                                              {p.peserta.namaPeserta}
                                            </span>
                                            <span
                                              className={`ml-1.5 text-[9px] px-1 py-0.2 rounded font-bold ${
                                                p.statusKehadiran === 'izin'
                                                  ? 'bg-blue-50 text-blue-700'
                                                  : 'bg-rose-50 text-rose-700'
                                              }`}
                                            >
                                              {p.statusKehadiran === 'izin' ? 'Izin' : 'Tidak Hadir'}
                                            </span>
                                          </div>
                                          <span
                                            className={`text-[10px] font-bold ${
                                              p.statusBayar ? 'text-emerald-600' : 'text-rose-600'
                                            }`}
                                          >
                                            {p.statusBayar ? '✓ Lunas' : 'Belum Bayar'}
                                          </span>
                                        </div>
                                      ))}
                                    {putaran.pembayaran.filter((p) => p.statusKehadiran !== 'hadir').length === 0 && (
                                      <p className="text-slate-400 italic text-[11px] py-1">
                                        Seluruh warga hadir lengkap pada putaran ini.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Kolom 2: Daftar Tunggakan Iuran & Tombol Pelunasan */}
                                <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5">
                                  <div className="font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-100">
                                    <span className="flex items-center gap-1.5 text-rose-700">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Daftar Tunggakan (Siap Ditagih)</span>
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800">
                                      {putaran.pembayaran.filter((p) => !p.statusBayar).length} Orang
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {putaran.pembayaran
                                      .filter((p) => !p.statusBayar)
                                      .map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center justify-between py-1 text-[11px] border-b border-slate-50"
                                        >
                                          <div>
                                            <span className="font-medium text-slate-800">
                                              {p.peserta.namaPeserta}
                                            </span>
                                            <div className="text-[10px] text-rose-600 font-bold">
                                              Rp {p.nominal.toLocaleString('id-ID')}
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handlePayArrears(p.id, putaran.id)}
                                            disabled={isSaving}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition cursor-pointer"
                                          >
                                            Tandai Lunas
                                          </button>
                                        </div>
                                      ))}
                                    {putaran.pembayaran.filter((p) => !p.statusBayar).length === 0 && (
                                      <p className="text-emerald-600 font-medium text-[11px] py-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Seluruh iuran putaran ini telah lunas 100%.</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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

          {/* Modal: Konfirmasi Pemenang Undian dengan Sinkronisasi Agenda & Talangan */}
          {isWinnerModalOpen && pendingWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 text-left space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="text-center space-y-2 pb-2 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                    <Trophy className="w-7 h-7 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                      Pemenang Terpilih!
                    </span>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {pendingWinner.namaPeserta}
                    </h3>
                    <div className="text-sm font-extrabold text-emerald-600 mt-1">
                      Hak Hadiah Total: Rp {kelompokDetail?.stats.estimasiHadiah.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Configuration Fields for This Round */}
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal Pengundian
                      </label>
                      <input
                        type="date"
                        value={winnerConfigForm.tanggalKocok}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const hj = getHariJawa(newDate);
                          setWinnerConfigForm({
                            ...winnerConfigForm,
                            tanggalKocok: newDate,
                            hariJawa: hj,
                          });
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Hari Jawa (Kalender RT)
                      </label>
                      <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-bold flex items-center justify-between">
                        <span>{winnerConfigForm.hariJawa || getHariJawa(winnerConfigForm.tanggalKocok)}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Kalender RT
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hubungkan ke Agenda Rapat RT (dari Kalender)
                    </label>
                    <select
                      value={winnerConfigForm.agendaId}
                      onChange={(e) => {
                        const agId = e.target.value;
                        const ag = upcomingAgendas.find((a) => a.id === agId);
                        if (ag) {
                          const dateStr = new Date(ag.tanggal).toISOString().split('T')[0];
                          setWinnerConfigForm({
                            ...winnerConfigForm,
                            agendaId: agId,
                            tanggalKocok: dateStr,
                            hariJawa: getHariJawa(dateStr),
                          });
                        } else {
                          setWinnerConfigForm({
                            ...winnerConfigForm,
                            agendaId: '',
                          });
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Bebas / Tidak Terhubung ke Agenda Tertentu --</option>
                      {upcomingAgendas.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.judul} • {getHariJawa(ag.tanggal)}, {new Date(ag.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kebijakan Penyerahan Uang
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                          winnerConfigForm.statusTalangan === 'tidak_ditalangi'
                            ? 'bg-orange-50 border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="statusTalangan"
                          value="tidak_ditalangi"
                          checked={winnerConfigForm.statusTalangan === 'tidak_ditalangi'}
                          onChange={() =>
                            setWinnerConfigForm({
                              ...winnerConfigForm,
                              statusTalangan: 'tidak_ditalangi',
                            })
                          }
                          className="sr-only"
                        />
                        <span>Serahkan Seadanya</span>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Sesuai uang yang terkumpul malam ini.
                        </p>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                          winnerConfigForm.statusTalangan === 'ditalangi_kas'
                            ? 'bg-orange-50 border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="statusTalangan"
                          value="ditalangi_kas"
                          checked={winnerConfigForm.statusTalangan === 'ditalangi_kas'}
                          onChange={() =>
                            setWinnerConfigForm({
                              ...winnerConfigForm,
                              statusTalangan: 'ditalangi_kas',
                            })
                          }
                          className="sr-only"
                        />
                        <span>Ditalangi Kas RT</span>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Pemenang menerima penuh 100%.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Penugasan Pemenang sebagai Tuan Rumah Agenda Arisan/Rapat Berikutnya */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <Home className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Tuan Rumah Rapat & Arisan RT Berikutnya</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Sesuai tata tertib arisan RT, pemenang putaran ini (
                      <strong>{pendingWinner.namaPeserta}</strong>) resmi menjadi{' '}
                      <strong>Tuan Rumah</strong> untuk agenda rapat & arisan RT putaran berikutnya!
                    </p>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Lokasi Pertemuan Berikutnya (Rumah Tuan Rumah):
                      </label>
                      <input
                        type="text"
                        value={winnerConfigForm.lokasiBerikutnya}
                        onChange={(e) =>
                          setWinnerConfigForm({
                            ...winnerConfigForm,
                            lokasiBerikutnya: e.target.value,
                          })
                        }
                        placeholder="Rumah Bpk/Ibu Pemenang"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Tanggal Pertemuan Berikutnya (Siklus Selapanan):
                      </label>
                      <input
                        type="date"
                        value={winnerConfigForm.tanggalBerikutnya}
                        onChange={(e) =>
                          setWinnerConfigForm({
                            ...winnerConfigForm,
                            tanggalBerikutnya: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={winnerConfigForm.sinkronAgendaBerikutnya}
                      onChange={(e) =>
                        setWinnerConfigForm({
                          ...winnerConfigForm,
                          sinkronAgendaBerikutnya: e.target.checked,
                        })
                      }
                      className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span className="text-slate-700 font-medium">
                      Otomatis masukkan jadwal ke Agenda Rapat RT di rumah pemenang
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmWinner}
                    disabled={isSaving}
                    className="w-full py-3 px-4 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    {isSaving ? 'Menyimpan Hasil...' : 'Konfirmasi & Tetapkan Pemenang'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWinnerModalOpen(false);
                      setPendingWinner(null);
                    }}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 rounded-2xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    Batal / Kocok Ulang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Pengaturan Kelompok Arisan (Hari Jawa, Waktu, Lokasi, Sinkron) */}
          {isEditKelompokModalOpen && kelompokDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">
                    Pengaturan Kelompok Arisan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditKelompokModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateKelompok} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kelompok Arisan *
                    </label>
                    <input
                      type="text"
                      required
                      value={editKelompokForm.nama}
                      onChange={(e) =>
                        setEditKelompokForm({ ...editKelompokForm, nama: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nominal Iuran (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        value={editKelompokForm.nominalIuran}
                        onChange={(e) =>
                          setEditKelompokForm({
                            ...editKelompokForm,
                            nominalIuran: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Status Kelompok
                      </label>
                      <select
                        value={editKelompokForm.status}
                        onChange={(e) =>
                          setEditKelompokForm({ ...editKelompokForm, status: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                  </div>

                  {/* Pengaturan Hari Jawa (Weton & Pasaran) disesuaikan dengan Kalender Agenda RT */}
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                        <span>Hari Jawa & Jadwal Pertemuan (Kalender Agenda RT)</span>
                      </label>
                      <span className="text-[10px] text-orange-700 font-bold bg-white px-2 py-0.5 rounded-full border border-orange-200">
                        Sinkron Kalender RT
                      </span>
                    </div>

                    {/* Quick sync dari agenda kalender jika ada */}
                    {upcomingAgendas.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Sesuaikan dari Agenda Rapat di Kalender RT (Opsional):
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const agId = e.target.value;
                            const ag = upcomingAgendas.find((a) => a.id === agId);
                            if (ag) {
                              const hj = getHariJawa(ag.tanggal);
                              setEditKelompokForm({
                                ...editKelompokForm,
                                hariJawa: hj,
                                waktuKocok: ag.waktuMulai || editKelompokForm.waktuKocok || '19:30',
                                lokasiKocok: ag.lokasi || editKelompokForm.lokasiKocok || 'Balai RT',
                              });
                            }
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Rapat dari Kalender Agenda RT --</option>
                          {upcomingAgendas.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.judul} • {getHariJawa(ag.tanggal)}, {new Date(ag.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {ag.waktuMulai ? `(${ag.waktuMulai})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pilih Hari & Pasaran Sesuai Kalender RT */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Hari & Pasaran Sesuai Kalender Agenda RT:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Hari</label>
                          <select
                            value={editKelompokHari}
                            onChange={(e) => {
                              const newHj = `${e.target.value} ${editKelompokPasaran}`;
                              setEditKelompokForm({ ...editKelompokForm, hariJawa: newHj });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                          >
                            {HARI_LIST.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Pasaran Kalender RT</label>
                          <select
                            value={editKelompokPasaran}
                            onChange={(e) => {
                              const newHj = `${editKelompokHari} ${e.target.value}`;
                              setEditKelompokForm({ ...editKelompokForm, hariJawa: newHj });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                          >
                            {PASARAN_LIST.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Preview info tanggal */}
                    <div className="p-2.5 rounded-xl bg-white border border-orange-100 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-slate-600">
                          Sesuai Kalender RT: <strong className="text-slate-900">{editKelompokForm.hariJawa || 'Minggu Pon'}</strong>
                        </span>
                      </div>
                      <span className="text-slate-500 font-medium text-[10px]">
                        Pertemuan berikutnya: <strong>{nextEditMeetingFormatted}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pukul Pelaksanaan
                      </label>
                      <input
                        type="time"
                        value={editKelompokForm.waktuKocok}
                        onChange={(e) =>
                          setEditKelompokForm({
                            ...editKelompokForm,
                            waktuKocok: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lokasi Rapat
                      </label>
                      <input
                        type="text"
                        value={editKelompokForm.lokasiKocok}
                        onChange={(e) =>
                          setEditKelompokForm({
                            ...editKelompokForm,
                            lokasiKocok: e.target.value,
                          })
                        }
                        placeholder="Balai RT / Rumah Pemenang"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editKelompokForm.autoSinkronAgenda}
                      onChange={(e) =>
                        setEditKelompokForm({
                          ...editKelompokForm,
                          autoSinkronAgenda: e.target.checked,
                        })
                      }
                      className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span className="text-slate-700 font-medium">
                      Otomatis sinkronkan pertemuan arisan ke kalender Agenda RT
                    </span>
                  </label>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteKelompok}
                      disabled={isSaving}
                      className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kelompok</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditKelompokModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Buat Kelompok Baru */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">
                    Buat Kelompok Arisan Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateKelompok} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kelompok Arisan *
                    </label>
                    <input
                      type="text"
                      required
                      value={newKelompokForm.nama}
                      onChange={(e) =>
                        setNewKelompokForm({ ...newKelompokForm, nama: e.target.value })
                      }
                      placeholder="e.g. Arisan Bapak-Bapak RT 04, Arisan PKK"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
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
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
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
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="bulanan">Bulanan (Selapanan)</option>
                        <option value="dua_mingguan">Dua Mingguan</option>
                        <option value="mingguan">Mingguan</option>
                      </select>
                    </div>
                  </div>

                  {/* Pengaturan Hari Jawa (Weton & Pasaran) disesuaikan dengan Kalender Agenda RT */}
                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                        <span>Hari Jawa & Jadwal Pertemuan (Kalender Agenda RT)</span>
                      </label>
                      <span className="text-[10px] text-orange-700 font-bold bg-white px-2 py-0.5 rounded-full border border-orange-200">
                        Sinkron Kalender RT
                      </span>
                    </div>

                    {/* Quick sync dari agenda kalender jika ada */}
                    {upcomingAgendas.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Sesuaikan dari Agenda Rapat di Kalender RT (Opsional):
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const agId = e.target.value;
                            const ag = upcomingAgendas.find((a) => a.id === agId);
                            if (ag) {
                              const hj = getHariJawa(ag.tanggal);
                              setNewKelompokForm({
                                ...newKelompokForm,
                                hariJawa: hj,
                                waktuKocok: ag.waktuMulai || newKelompokForm.waktuKocok || '19:30',
                                lokasiKocok: ag.lokasi || newKelompokForm.lokasiKocok || 'Balai RT',
                              });
                            }
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Rapat dari Kalender Agenda RT --</option>
                          {upcomingAgendas.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.judul} • {getHariJawa(ag.tanggal)}, {new Date(ag.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {ag.waktuMulai ? `(${ag.waktuMulai})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pilih Hari & Pasaran Sesuai Kalender RT */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Hari & Pasaran Sesuai Kalender Agenda RT:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Hari</label>
                          <select
                            value={newKelompokHari}
                            onChange={(e) => {
                              const newHj = `${e.target.value} ${newKelompokPasaran}`;
                              setNewKelompokForm({ ...newKelompokForm, hariJawa: newHj });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                          >
                            {HARI_LIST.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Pasaran Kalender RT</label>
                          <select
                            value={newKelompokPasaran}
                            onChange={(e) => {
                              const newHj = `${newKelompokHari} ${e.target.value}`;
                              setNewKelompokForm({ ...newKelompokForm, hariJawa: newHj });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer"
                          >
                            {PASARAN_LIST.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Preview info tanggal */}
                    <div className="p-2.5 rounded-xl bg-white border border-orange-100 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-slate-600">
                          Sesuai Kalender RT: <strong className="text-slate-900">{newKelompokForm.hariJawa || 'Minggu Pon'}</strong>
                        </span>
                      </div>
                      <span className="text-slate-500 font-medium text-[10px]">
                        Pertemuan berikutnya: <strong>{nextNewMeetingFormatted}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Waktu Pertemuan
                      </label>
                      <input
                        type="time"
                        value={newKelompokForm.waktuKocok}
                        onChange={(e) =>
                          setNewKelompokForm({
                            ...newKelompokForm,
                            waktuKocok: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lokasi Pertemuan
                      </label>
                      <input
                        type="text"
                        value={newKelompokForm.lokasiKocok}
                        onChange={(e) =>
                          setNewKelompokForm({
                            ...newKelompokForm,
                            lokasiKocok: e.target.value,
                          })
                        }
                        placeholder="Balai RT"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKelompokForm.autoSinkronAgenda}
                      onChange={(e) =>
                        setNewKelompokForm({
                          ...newKelompokForm,
                          autoSinkronAgenda: e.target.checked,
                        })
                      }
                      className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span className="text-slate-700 font-medium">
                      Otomatis masukkan jadwal ke Agenda Rapat RT
                    </span>
                  </label>

                  {/* Multi-select from existing warga */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">
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
                        className="text-[11px] text-[var(--brand-primary)] hover:underline font-bold cursor-pointer"
                      >
                        {newKelompokForm.selectedAnggotaIds.length === allAnggota.length
                          ? 'Batal Semua'
                          : 'Pilih Semua'}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 bg-slate-50">
                      {allAnggota.map((warga) => {
                        const isSelected = newKelompokForm.selectedAnggotaIds.includes(warga.id);
                        return (
                          <label
                            key={warga.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? 'bg-orange-50 text-[var(--brand-primary)] font-bold'
                                : 'hover:bg-white text-slate-700'
                            }`}
                          >
                            <span>{warga.nama} (Rumah {warga.noRumah})</span>
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
                              className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">
                    Tambah Peserta Arisan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddPesertaModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddPeserta} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] cursor-pointer"
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
                    <label className="block font-bold text-slate-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Slot / Urutan
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newPesertaForm.nomorSlot}
                        onChange={(e) =>
                          setNewPesertaForm({ ...newPesertaForm, nomorSlot: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        No. WhatsApp (Opsional)
                      </label>
                      <input
                        type="tel"
                        value={newPesertaForm.noHp}
                        onChange={(e) =>
                          setNewPesertaForm({ ...newPesertaForm, noHp: e.target.value })
                        }
                        placeholder="0812xxxx"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddPesertaModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
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
