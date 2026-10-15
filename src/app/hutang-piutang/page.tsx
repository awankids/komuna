'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import {
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Trash2,
  Edit3,
  MessageSquare,
  History,
  RefreshCw,
  X,
  User,
  Phone,
  Check,
  ChevronDown,
  Info,
  HelpCircle,
  ExternalLink,
  Percent,
} from 'lucide-react';

interface AnggotaOption {
  id: string;
  nama: string;
  noRumah: string;
  noHp?: string | null;
}

interface RiwayatBayarItem {
  id: string;
  tanggalBayar: string;
  nominalBayar: number;
  sisaSebelumnya: number;
  sisaSetelahnya: number;
  metode: string;
  catatan?: string | null;
  dicatatOleh: string;
  transaksiKasId?: string | null;
}

interface HutangPiutangItem {
  id: string;
  tipe: 'piutang' | 'hutang';
  judul: string;
  namaPihak: string;
  kontakPihak?: string | null;
  anggotaId?: string | null;
  anggota?: AnggotaOption | null;
  totalNominal: number;
  sisaNominal: number;
  tanggalMulai: string;
  jatuhTempo?: string | null;
  status: 'belum_lunas' | 'sebagian' | 'lunas';
  kategori?: string | null;
  catatan?: string | null;
  diisiOleh: string;
  createdAt: string;
  updatedAt: string;
  riwayatBayar?: RiwayatBayarItem[];
}

interface SummaryData {
  totalPiutangAktif: number;
  totalHutangAktif: number;
  netReceivables: number;
  countJatuhTempoSegera: number;
  countOverdue: number;
  countLunas: number;
  countAktif: number;
  totalCount: number;
}

export default function HutangPiutangPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [items, setItems] = useState<HutangPiutangItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalPiutangAktif: 0,
    totalHutangAktif: 0,
    netReceivables: 0,
    countJatuhTempoSegera: 0,
    countOverdue: 0,
    countLunas: 0,
    countAktif: 0,
    totalCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [anggotaList, setAnggotaList] = useState<AnggotaOption[]>([]);

  // Filter & Search states
  const [filterTipe, setFilterTipe] = useState<'semua' | 'piutang' | 'hutang'>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'belum_lunas' | 'sebagian' | 'lunas'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'jatuhTempo' | 'nominalDesc' | 'terbaru'>('jatuhTempo');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HutangPiutangItem | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<HutangPiutangItem | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<HutangPiutangItem | null>(null);

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waItem, setWaItem] = useState<HutangPiutangItem | null>(null);
  const [waMessageText, setWaMessageText] = useState('');

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<HutangPiutangItem | null>(null);

  // Form Add/Edit inputs
  const [formData, setFormData] = useState({
    tipe: 'piutang' as 'piutang' | 'hutang',
    judul: '',
    namaPihak: '',
    kontakPihak: '',
    anggotaId: 'none',
    totalNominal: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    jatuhTempo: '',
    kategori: 'sosial',
    catatan: '',
    catatDiKas: false,
  });

  // Form Bayar inputs
  const [payFormData, setPayFormData] = useState({
    nominalBayar: '',
    tanggalBayar: new Date().toISOString().split('T')[0],
    metode: 'tunai',
    catatan: '',
    catatDiKas: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Helper Currency
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

  // Helper Date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Calculate Due Date Status
  const getDueStatus = (dateStr?: string | null, status?: string) => {
    if (status === 'lunas') return { label: 'Lunas', color: 'text-slate-400 bg-slate-100', isUrgent: false };
    if (!dateStr) return { label: 'Tanpa Tempo', color: 'text-slate-500 bg-slate-50', isUrgent: false };

    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)} hari`,
        color: 'text-red-700 bg-red-50 border border-red-200',
        isUrgent: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Jatuh Tempo Hari Ini!',
        color: 'text-amber-800 bg-amber-50 border border-amber-200 animate-pulse',
        isUrgent: true,
      };
    }
    if (diffDays <= 7) {
      return {
        label: `${diffDays} hari lagi`,
        color: 'text-amber-700 bg-amber-50 border border-amber-200',
        isUrgent: true,
      };
    }
    return {
      label: `${diffDays} hari lagi`,
      color: 'text-slate-600 bg-slate-50 border border-slate-200',
      isUrgent: false,
    };
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterTipe !== 'semua') queryParams.append('tipe', filterTipe);
      if (filterStatus !== 'semua') queryParams.append('status', filterStatus);
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
      queryParams.append('sort', sortOption);

      const res = await fetch(`/api/hutang-piutang?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
        if (json.summary) {
          setSummary(json.summary);
        }
      } else {
        showToast('Gagal memuat data hutang dan piutang', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan jaringan saat memuat data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterTipe, filterStatus, searchQuery, sortOption]);

  // Fetch Anggota for dropdown
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchAnggota = async () => {
      try {
        const res = await fetch('/api/anggota');
        if (res.ok) {
          const data = await res.json();
          setAnggotaList(data || []);
        }
      } catch (e) {
        console.error('Error fetching anggota list:', e);
      }
    };
    fetchAnggota();
  }, []);

  // Quick WhatsApp message generator
  const openWhatsAppModal = (item: HutangPiutangItem) => {
    setWaItem(item);
    const sisa = formatRp(item.sisaNominal);
    const jatuhTempoText = item.jatuhTempo ? formatDate(item.jatuhTempo) : 'waktu dekat';
    const draft = `Salam hangat Bapak/Ibu ${item.namaPihak},\n\nSemoga selalu sehat sekeluarga. Mengingatkan secara santun perihal catatan kas RT untuk *${item.judul}*, dengan sisa nominal sebesar *${sisa}* (estimasi tempo: ${jatuhTempoText}).\n\nApabila sudah ada kesempatan untuk pelunasan atau cicilan bertahap, silakan konfirmasi kepada pengurus RT. Terima kasih atas pengertian dan kerja sama dalam kebersamaan warga RT 04. 🙏`;
    setWaMessageText(draft);
    setIsWaModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      tipe: 'piutang',
      judul: '',
      namaPihak: '',
      kontakPihak: '',
      anggotaId: 'none',
      totalNominal: '',
      tanggalMulai: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      kategori: 'sosial',
      catatan: '',
      catatDiKas: false,
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: HutangPiutangItem) => {
    setEditingItem(item);
    setFormData({
      tipe: item.tipe,
      judul: item.judul,
      namaPihak: item.namaPihak,
      kontakPihak: item.kontakPihak || '',
      anggotaId: item.anggotaId || 'none',
      totalNominal: String(item.totalNominal),
      tanggalMulai: item.tanggalMulai.split('T')[0],
      jatuhTempo: item.jatuhTempo ? item.jatuhTempo.split('T')[0] : '',
      kategori: item.kategori || (item.tipe === 'piutang' ? 'sosial' : 'operasional'),
      catatan: item.catatan || '',
      catatDiKas: false,
    });
    setIsAddEditModalOpen(true);
  };

  // Open Pay Modal
  const handleOpenPay = (item: HutangPiutangItem) => {
    setPayingItem(item);
    setPayFormData({
      nominalBayar: String(item.sisaNominal), // Default to full remaining balance
      tanggalBayar: new Date().toISOString().split('T')[0],
      metode: 'tunai',
      catatan: '',
      catatDiKas: true,
    });
    setIsPayModalOpen(true);
  };

  // Open History Modal
  const handleOpenHistory = (item: HutangPiutangItem) => {
    setHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitAddEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.namaPihak.trim() || !formData.totalNominal) {
      showToast('Harap lengkapi judul, nama pihak, dan nominal', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/hutang-piutang/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judul: formData.judul,
            namaPihak: formData.namaPihak,
            kontakPihak: formData.kontakPihak,
            anggotaId: formData.anggotaId,
            jatuhTempo: formData.jatuhTempo || null,
            kategori: formData.kategori,
            catatan: formData.catatan,
          }),
        });

        if (res.ok) {
          showToast('Data berhasil diperbarui', 'success');
          setIsAddEditModalOpen(false);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Gagal memperbarui data', 'error');
        }
      } else {
        // Create
        const res = await fetch('/api/hutang-piutang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            totalNominal: parseInt(formData.totalNominal, 10),
            jatuhTempo: formData.jatuhTempo || null,
          }),
        });

        if (res.ok) {
          showToast('Catatan baru berhasil disimpan', 'success');
          setIsAddEditModalOpen(false);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Gagal menyimpan catatan baru', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat memproses data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Pay Submit
  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;

    const nominal = parseInt(payFormData.nominalBayar, 10);
    if (isNaN(nominal) || nominal <= 0) {
      showToast('Nominal pembayaran tidak valid', 'error');
      return;
    }

    if (nominal > payingItem.sisaNominal) {
      showToast('Nominal tidak boleh melebihi sisa kewajiban', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hutang-piutang/${payingItem.id}/bayar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominalBayar: nominal,
          tanggalBayar: payFormData.tanggalBayar,
          metode: payFormData.metode,
          catatan: payFormData.catatan,
          catatDiKas: payFormData.catatDiKas,
        }),
      });

      if (res.ok) {
        showToast('Pembayaran berhasil dicatat', 'success');
        setIsPayModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal mencatat pembayaran', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat memproses pembayaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hutang-piutang/${deleteConfirmItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Data berhasil dihapus', 'success');
        setDeleteConfirmItem(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menghapus data', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat menghapus data', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'sep=;\r\n';
    csvContent += 'LAPORAN HUTANG & PIUTANG RT 04\r\n';
    csvContent += `Tanggal Ekspor:;${new Date().toLocaleDateString('id-ID')}\r\n`;
    csvContent += `Total Piutang Aktif;${summary.totalPiutangAktif}\r\n`;
    csvContent += `Total Hutang Aktif;${summary.totalHutangAktif}\r\n`;
    csvContent += `Posisi Bersih Likuiditas;${summary.netReceivables}\r\n\r\n`;

    csvContent += 'No;Tipe;Judul;Nama Pihak;Kontak;Total Nominal;Sisa Nominal;Tanggal Mulai;Jatuh Tempo;Status;Kategori;Catatan\r\n';

    items.forEach((item, idx) => {
      const tipeLabel = item.tipe === 'piutang' ? 'Piutang (Hak RT)' : 'Hutang (Kewajiban RT)';
      const statusLabel = item.status === 'lunas' ? 'Lunas' : item.status === 'sebagian' ? 'Dicicil' : 'Belum Lunas';
      csvContent += `${idx + 1};"${tipeLabel}";"${item.judul}";"${item.namaPihak}";"${item.kontakPihak || '-'}";${item.totalNominal};${item.sisaNominal};"${formatDate(item.tanggalMulai)}";"${formatDate(item.jatuhTempo)}";"${statusLabel}";"${item.kategori || '-'}";"${item.catatan || '-'}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Hutang_Piutang_RT04_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan CSV berhasil diunduh', 'success');
  };

  // Urgent list for right-panel alert widget
  const urgentList = useMemo(() => {
    return items
      .filter((i) => i.status !== 'lunas' && i.jatuhTempo)
      .sort((a, b) => new Date(a.jatuhTempo!).getTime() - new Date(b.jatuhTempo!).getTime())
      .slice(0, 4);
  }, [items]);

  // Ratio percentage calculation for gauge/donut
  const totalCombined = summary.totalPiutangAktif + summary.totalHutangAktif;
  const piutangRatioPct = totalCombined > 0 ? Math.round((summary.totalPiutangAktif / totalCombined) * 100) : 50;
  const hutangRatioPct = totalCombined > 0 ? Math.round((summary.totalHutangAktif / totalCombined) * 100) : 50;

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Hutang & Piutang" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
                toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-600 shadow-red-200'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          )}

          {/* Title Bar & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  Hutang & Piutang RT
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Pencatatan pinjaman dana sosial warga, kewajiban material vendor, dan riwayat cicilan bertahap.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={fetchData}
                disabled={isLoading}
                title="Muat ulang data"
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-[var(--brand-ring)]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Baru</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Cards (Responsive Bento Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* KPI 1: Piutang Berjalan */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                    Piutang Aktif (Hak RT)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Dana RT di luar</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {formatRp(summary.totalPiutangAktif)}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Dari pinjaman sosial & dana darurat warga
                </span>
              </div>
            </div>

            {/* KPI 2: Hutang Berjalan */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-red-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                    Hutang Aktif (Kewajiban)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Kewajiban kas ke vendor</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {formatRp(summary.totalHutangAktif)}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Tagihan material, bon, dan talangan
                </span>
              </div>
            </div>

            {/* KPI 3: Posisi Bersih Likuiditas */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-[var(--brand-primary)]/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[var(--brand-primary)] uppercase tracking-wider block">
                    Posisi Bersih (Net)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Piutang dikurang Hutang</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3
                  className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
                    summary.netReceivables >= 0 ? 'text-slate-800' : 'text-red-600'
                  }`}
                >
                  {summary.netReceivables >= 0 ? '+' : ''}
                  {formatRp(summary.netReceivables)}
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      summary.netReceivables >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-500">
                    {summary.netReceivables >= 0 ? 'Surplus Hak RT' : 'Beban Kewajiban Lebih Tinggi'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Jatuh Tempo Segera */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                    Jatuh Tempo (≤ 7 Hari)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Perlu perhatian pengurus</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {summary.countJatuhTempoSegera} <span className="text-sm font-semibold text-slate-400">Tagihan</span>
                </h3>
                <span className="text-[11px] font-medium text-amber-700 mt-1 block">
                  {summary.countOverdue > 0
                    ? `⚠️ ${summary.countOverdue} tagihan telah melewati tempo!`
                    : 'Semua tagihan masih dalam batas tempo.'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Bento Workspace: 8 Columns Ledger & 4 Columns Support Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-start">
            
            {/* LEFT COLUMN: 8 COLS (66.7%) - Records Ledger & Filter */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Filter Tabs & Search Controls Bar */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-xs space-y-4">
                {/* Tipe Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-600">
                    <button
                      onClick={() => setFilterTipe('semua')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        filterTipe === 'semua' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'hover:text-slate-900'
                      }`}
                    >
                      Semua Data
                    </button>
                    <button
                      onClick={() => setFilterTipe('piutang')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        filterTipe === 'piutang' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-emerald-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Piutang (Hak RT)
                    </button>
                    <button
                      onClick={() => setFilterTipe('hutang')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        filterTipe === 'hutang' ? 'bg-white text-red-700 shadow-xs font-bold' : 'hover:text-red-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Hutang (Vendor)
                    </button>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['semua', 'belum_lunas', 'sebagian', 'lunas'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          filterStatus === st
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {st === 'semua'
                          ? 'Semua'
                          : st === 'belum_lunas'
                          ? 'Belum Lunas'
                          : st === 'sebagian'
                          ? 'Dicicil'
                          : 'Lunas'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar & Sort Dropdown */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama pihak, judul pinjaman, keperluan, atau kontak..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 font-medium shrink-0">Urutkan:</span>
                    <select
                      value={sortOption}
                      onChange={(e: any) => setSortOption(e.target.value)}
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-[var(--brand-primary)] cursor-pointer"
                    >
                      <option value="jatuhTempo">Jatuh Tempo Terdekat</option>
                      <option value="nominalDesc">Sisa Nominal Terbesar</option>
                      <option value="terbaru">Terbaru Dicatat</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Records List Area */}
              {isLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
                  <RefreshCw className="w-8 h-8 text-[var(--brand-primary)] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Memuat catatan hutang dan piutang...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
                    <ReceiptText className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">Belum ada catatan transaksi</h3>
                  <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
                    Catatan hutang atau piutang yang sesuai dengan filter saat ini belum ditemukan. Klik tombol di bawah untuk mencatat.
                  </p>
                  <button
                    onClick={handleOpenAdd}
                    className="mt-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold hover:bg-[var(--brand-hover)] transition-all shadow-xs"
                  >
                    + Catat Baru Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {items.map((item) => {
                    const isPiutang = item.tipe === 'piutang';
                    const due = getDueStatus(item.jatuhTempo, item.status);
                    const percentPaid = item.totalNominal > 0
                      ? Math.min(100, Math.round(((item.totalNominal - item.sisaNominal) / item.totalNominal) * 100))
                      : 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl p-4 md:p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
                          item.status === 'lunas'
                            ? 'border-slate-100 opacity-90'
                            : due.isUrgent
                            ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/20 to-white'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Top Meta Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            {/* Tipe Badge */}
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                                isPiutang
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isPiutang ? (
                                <>
                                  <ArrowDownLeft className="w-3 h-3" /> Piutang (Hak RT)
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="w-3 h-3" /> Hutang (Vendor)
                                </>
                              )}
                            </span>

                            {/* Kategori Pill */}
                            {item.kategori && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
                                {item.kategori}
                              </span>
                            )}
                          </div>

                          {/* Status & Due Pill */}
                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                item.status === 'lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'sebagian'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status === 'lunas'
                                ? 'Lunas'
                                : item.status === 'sebagian'
                                ? 'Dicicil Bertahap'
                                : 'Belum Lunas'}
                            </span>

                            {/* Due Date Status */}
                            {item.jatuhTempo && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${due.color}`}>
                                {due.label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Main Body */}
                        <div className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          
                          {/* Info Column (Left 7 Cols) */}
                          <div className="md:col-span-7 space-y-1.5">
                            <h3 className="text-base font-bold text-slate-800 leading-snug">{item.judul}</h3>
                            
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {item.namaPihak}
                                {item.anggota?.noRumah && (
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    (Rumah {item.anggota.noRumah})
                                  </span>
                                )}
                              </span>

                              {item.kontakPihak && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {item.kontakPihak}
                                </span>
                              )}

                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(item.tanggalMulai)}
                              </span>
                            </div>

                            {item.catatan && (
                              <p className="text-xs text-slate-400 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100/60 mt-1">
                                &quot;{item.catatan}&quot;
                              </p>
                            )}
                          </div>

                          {/* Nominal & Progress Column (Right 5 Cols) */}
                          <div className="md:col-span-5 bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-400 font-medium">Sisa Kewajiban:</span>
                              <span
                                className={`text-lg font-extrabold tracking-tight ${
                                  item.status === 'lunas'
                                    ? 'text-slate-400 line-through'
                                    : isPiutang
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {formatRp(item.sisaNominal)}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    item.status === 'lunas' ? 'bg-emerald-500' : 'bg-[var(--brand-primary)]'
                                  }`}
                                  style={{ width: `${percentPaid}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Terbayar: {formatRp(item.totalNominal - item.sisaNominal)}</span>
                                <span className="font-semibold text-slate-600">{percentPaid}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {/* Riwayat Bayar Button */}
                            <button
                              onClick={() => handleOpenHistory(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                            >
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>Riwayat ({item.riwayatBayar?.length || 0})</span>
                            </button>

                            {/* WhatsApp Reminder (If Piutang with Phone) */}
                            {isPiutang && item.kontakPihak && item.status !== 'lunas' && (
                              <button
                                onClick={() => openWhatsAppModal(item)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Kirim WA</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit rincian data"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              title="Hapus catatan"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Bayar / Cicil Primary Action */}
                            {item.status !== 'lunas' && (
                              <button
                                onClick={() => handleOpenPay(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Bayar / Cicil</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: 4 COLS (33.3%) - Analytical Panels & Urgency Alerts */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Panel 1: Rasio Likuiditas & Beban */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Kesehatan Likuiditas RT</h3>
                  <Scale className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Piutang Aktif ({piutangRatioPct}%)
                    </span>
                    <span className="font-bold text-slate-700">{formatRp(summary.totalPiutangAktif)}</span>
                  </div>

                  {/* Dual Ratio Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${piutangRatioPct}%` }}
                    />
                    <div
                      className="bg-red-500 h-full transition-all duration-300"
                      style={{ width: `${hutangRatioPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-red-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      Hutang Vendor ({hutangRatioPct}%)
                    </span>
                    <span className="font-bold text-slate-700">{formatRp(summary.totalHutangAktif)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
                  {summary.netReceivables >= 0 ? (
                    <span className="text-emerald-700 font-medium">
                      ✓ Likuiditas RT dalam posisi aman. Nilai hak piutang warga melebihi total kewajiban hutang ke pihak vendor.
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ⚠️ Kewajiban hutang lebih besar dari piutang. Pastikan ketersediaan kas RT mencukupi sebelum jatuh tempo.
                    </span>
                  )}
                </div>
              </div>

              {/* Panel 2: Peringatan Jatuh Tempo Mendesak */}
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-800">Tenggat Terdekat (Urgent)</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {urgentList.length}
                  </span>
                </div>

                {urgentList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Tidak ada tagihan yang mendekati jatuh tempo saat ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {urgentList.map((urg) => {
                      const due = getDueStatus(urg.jatuhTempo, urg.status);
                      return (
                        <div
                          key={urg.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">{urg.judul}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${due.color}`}>
                              {due.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{urg.namaPihak}</span>
                            <span className="font-extrabold text-slate-800">{formatRp(urg.sisaNominal)}</span>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {urg.tipe === 'piutang' && urg.kontakPihak && (
                              <button
                                onClick={() => openWhatsAppModal(urg)}
                                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" /> WA
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenPay(urg)}
                              className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                            >
                              Bayar/Cicil &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Panel 3: Panduan Operasional Kas RT */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200/70 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Info className="w-4 h-4 text-[var(--brand-primary)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Petunjuk Gotong Royong</h4>
                </div>
                <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-slate-700">Piutang RT:</strong> Pinjaman sosial warga untuk musibah atau modal mikro. Pelunasan dicatat bertahap via tombol cicil.
                  </li>
                  <li>
                    <strong className="text-slate-700">Hutang RT:</strong> Tagihan belanja material pembangunan pos/gapura atau sewa alat yang dibayar bertermin ke vendor.
                  </li>
                  <li>
                    <strong className="text-slate-700">Sinkronisasi Kas:</strong> Centang sakelar saat mencatat agar mutasi Kas RT otomatis terbarui tanpa input ganda.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </main>
      </div>

      <MobileNavBar onQuickActionClick={handleOpenAdd} />

      {/* ========================================================================= */}
      {/* MODAL 1: FORM CATAT / EDIT HUTANG PIUTANG */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center font-bold">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingItem ? 'Edit Catatan' : 'Catat Hutang / Piutang Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingItem ? 'Perbarui data catatan yang ada' : 'Pencatatan hak atau kewajiban kas RT'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddEdit} className="space-y-4 text-xs md:text-sm">
              {/* Pilihan Tipe (Disabled when editing) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Transaksi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!!editingItem}
                    onClick={() => setFormData((prev) => ({ ...prev, tipe: 'piutang', kategori: 'sosial' }))}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      formData.tipe === 'piutang'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Piutang (Hak RT)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!editingItem}
                    onClick={() => setFormData((prev) => ({ ...prev, tipe: 'hutang', kategori: 'operasional' }))}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                      formData.tipe === 'hutang'
                        ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Hutang (Kewajiban)</span>
                  </button>
                </div>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Transaksi / Keperluan *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formData.tipe === 'piutang'
                      ? 'contoh: Pinjaman Darurat Medis Warga'
                      : 'contoh: Pembelian Semen & Pasir Pos Ronda'
                  }
                  value={formData.judul}
                  onChange={(e) => setFormData((prev) => ({ ...prev, judul: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                />
              </div>

              {/* Relasi Warga Terdaftar (Optional Quick-fill) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Warga Terdaftar (Opsional)
                </label>
                <select
                  value={formData.anggotaId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const found = anggotaList.find((a) => a.id === selId);
                    setFormData((prev) => ({
                      ...prev,
                      anggotaId: selId,
                      namaPihak: found ? found.nama : prev.namaPihak,
                      kontakPihak: found?.noHp ? found.noHp : prev.kontakPihak,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] cursor-pointer"
                >
                  <option value="none">-- Bukan dari daftar warga (Input manual) --</option>
                  {anggotaList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama} (Rumah {a.noRumah})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Pihak & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pihak / Toko *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama orang atau toko vendor"
                    value={formData.namaPihak}
                    onChange={(e) => setFormData((prev) => ({ ...prev, namaPihak: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="contoh: 08123456789"
                    value={formData.kontakPihak}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kontakPihak: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Total Nominal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingItem ? 'Total Nominal (Terkunci)' : 'Total Nominal (Rp) *'}
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!!editingItem}
                    placeholder="0"
                    value={formData.totalNominal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalNominal: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] disabled:bg-slate-100 disabled:text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kategori: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] cursor-pointer"
                  >
                    <option value="sosial">Sosial / Pinjaman Darurat</option>
                    <option value="pembangunan">Pembangunan & Fisik RT</option>
                    <option value="kegiatan">Kegiatan / Acara Warga</option>
                    <option value="operasional">Operasional Rutin</option>
                    <option value="lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Mulai & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jatuh Tempo (Opsional)</label>
                  <input
                    type="date"
                    value={formData.jatuhTempo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, jatuhTempo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan perjanjian lisan, saksi, nomor nota toko..."
                  value={formData.catatan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              {/* Checkbox Sakelar: Otomatis Catat Kas RT (Only on creation) */}
              {!editingItem && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="catatDiKas"
                    checked={formData.catatDiKas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, catatDiKas: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <label htmlFor="catatDiKas" className="text-xs text-slate-600 leading-snug cursor-pointer">
                    <strong className="text-slate-800 block">Otomatis Catat Transaksi di Kas RT Sekarang?</strong>
                    {formData.tipe === 'piutang'
                      ? 'Kas RT akan otomatis mencatat Pengeluaran kas sebesar nominal pinjaman.'
                      : 'Kas RT akan otomatis mencatat Pemasukan dana talangan/pinjaman yang diterima.'}
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold transition-all shadow-md shadow-[var(--brand-ring)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Catat Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BAYAR / CICIL CEPAT */}
      {/* ========================================================================= */}
      {isPayModalOpen && payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Pencatatan Pembayaran</h3>
                  <p className="text-xs text-slate-400">
                    {payingItem.tipe === 'piutang' ? 'Pelunasan piutang dari warga' : 'Pembayaran hutang ke vendor'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{payingItem.judul}</span>
                <span className="font-bold text-slate-800">{payingItem.namaPihak}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                <span className="text-xs text-slate-500">Sisa Tagihan:</span>
                <span className="text-xl font-black text-slate-900">{formatRp(payingItem.sisaNominal)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPay} className="space-y-4 text-xs md:text-sm">
              {/* Shortcut: Bayar Lunas 1-Klik */}
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Nominal yang Dibayarkan (Rp) *</label>
                <button
                  type="button"
                  onClick={() => setPayFormData((prev) => ({ ...prev, nominalBayar: String(payingItem.sisaNominal) }))}
                  className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Bayar Lunas Sepenuhnya
                </button>
              </div>

              <input
                type="number"
                required
                max={payingItem.sisaNominal}
                min={1}
                placeholder="Masukkan jumlah yang dibayarkan..."
                value={payFormData.nominalBayar}
                onChange={(e) => setPayFormData((prev) => ({ ...prev, nominalBayar: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
              />

              {/* Tanggal & Metode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Bayar *</label>
                  <input
                    type="date"
                    required
                    value={payFormData.tanggalBayar}
                    onChange={(e) => setPayFormData((prev) => ({ ...prev, tanggalBayar: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metode</label>
                  <select
                    value={payFormData.metode}
                    onChange={(e) => setPayFormData((prev) => ({ ...prev, metode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                  >
                    <option value="tunai">Tunai / Cash</option>
                    <option value="transfer">Transfer Bank</option>
                  </select>
                </div>
              </div>

              {/* Catatan Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pembayaran (Opsional)</label>
                <input
                  type="text"
                  placeholder="contoh: Cicilan ke-2 via Bu RT"
                  value={payFormData.catatan}
                  onChange={(e) => setPayFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              {/* Checkbox Sakelar: Sinkron ke Kas RT */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="catatDiKasPay"
                  checked={payFormData.catatDiKas}
                  onChange={(e) => setPayFormData((prev) => ({ ...prev, catatDiKas: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="catatDiKasPay" className="text-xs text-slate-700 leading-snug cursor-pointer">
                  <strong className="text-emerald-800 block">Otomatis Sinkron ke Kas RT</strong>
                  {payingItem.tipe === 'piutang'
                    ? 'Mencatat Pemasukan di Kas RT (dana piutang kembali ke kas RT).'
                    : 'Mencatat Pengeluaran di Kas RT (kas RT dipakai melunasi vendor).'}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RIWAYAT PEMBAYARAN CICILAN */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Riwayat Pembayaran</h3>
                  <p className="text-xs text-slate-400">{historyItem.judul}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Total Nilai Tagihan:</span>
                <span className="text-sm font-bold text-slate-800">{formatRp(historyItem.totalNominal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Sisa Belum Lunas:</span>
                <span
                  className={`text-sm font-bold ${
                    historyItem.sisaNominal === 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatRp(historyItem.sisaNominal)}
                </span>
              </div>
            </div>

            {/* Riwayat Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {!historyItem.riwayatBayar || historyItem.riwayatBayar.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada pembayaran cicilan yang dicatat untuk transaksi ini.
                </div>
              ) : (
                historyItem.riwayatBayar.map((rb, idx) => (
                  <div
                    key={rb.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        +{formatRp(rb.nominalBayar)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(rb.tanggalBayar)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Metode: <strong className="text-slate-700 uppercase">{rb.metode}</strong></span>
                      <span>Sisa setelahnya: <strong className="text-slate-700">{formatRp(rb.sisaSetelahnya)}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Dicatat oleh: {rb.dicatatOleh}</span>
                      {rb.transaksiKasId && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Tersinkron ke Kas RT
                        </span>
                      )}
                    </div>

                    {rb.catatan && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg">
                        &quot;{rb.catatan}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PENGINGAT WHATSAPP SANTUN */}
      {/* ========================================================================= */}
      {isWaModalOpen && waItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Kirim Pengingat WhatsApp</h3>
                  <p className="text-xs text-slate-400">Pesan santun gotong-royong warga RT</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Tujuan Penerima:</span>
                <span className="font-bold text-slate-800 text-sm">{waItem.namaPihak}</span>
                <span className="text-slate-500 block text-xs">{waItem.kontakPihak}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pratinjau Pesan (Bisa diedit sebelum kirim):
                </label>
                <textarea
                  rows={8}
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                >
                  Batal
                </button>

                <a
                  href={`https://wa.me/${waItem.kontakPihak?.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Chat WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: KONFIRMASI HAPUS */}
      {/* ========================================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">Hapus Catatan Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Catatan <strong>&quot;{deleteConfirmItem.judul}&quot;</strong> beserta seluruh riwayat cicilannya akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
