'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import TransactionForm from '@/components/TransactionForm';
import {
  Wallet,
  ArrowDown,
  ArrowUp,
  Coins,
  FileSpreadsheet,
  Plus,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PiggyBank,
  Settings2,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

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

export default function KasRTPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const today = new Date();
    return String(today.getFullYear());
  });
  const [selectedType, setSelectedType] = useState('all'); // all, pemasukan, pengeluaran

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    saldoAwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
  });

  const [jimpitanInfo, setJimpitanInfo] = useState({
    total: 0,
    filledDays: 0,
    isSent: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSendingJimpitan, setIsSendingJimpitan] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<'tanggal' | 'kategori' | 'nominal' | 'saldo'>('tanggal');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Categories states
  const [categories, setCategories] = useState<{ pemasukan: string[]; pengeluaran: string[] }>({
    pemasukan: [],
    pengeluaran: []
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryTab, setCategoryTab] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [newCategoryName, setNewCategoryName] = useState('');
  const newCategoryNameRef = useRef<HTMLInputElement>(null);
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');
  const editingCategoryNewNameRef = useRef<HTMLInputElement>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transaction Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentTxId, setCurrentTxId] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJenis, setFormJenis] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [formKategori, setFormKategori] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formSubKeterangan, setFormSubKeterangan] = useState(''); // e.g. "Pak Ahmad"
  const [formNominal, setFormNominal] = useState('');

  // Delete Confirm Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Automation Setting Modal
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transaksi?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (!data.error) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        if (data.jimpitan) {
          setJimpitanInfo(data.jimpitan);
        }
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
      triggerToast('Gagal memuat mutasi kas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/kategori');
      const data = await res.json();
      if (!data.error) {
        setCategories(data);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = newCategoryNameRef.current?.value?.trim() || '';
    if (!nameVal) return;

    try {
      const res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: categoryTab, name: nameVal })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        setCategories(data.categories);
        setNewCategoryName('');
        if (newCategoryNameRef.current) newCategoryNameRef.current.value = '';
        triggerToast('Kategori berhasil ditambahkan', 'success');
      }
    } catch (err) {
      triggerToast('Gagal menambahkan kategori', 'error');
    }
  };

  const handleEditCategory = async (oldName: string) => {
    const newNameVal = editingCategoryNewNameRef.current?.value?.trim() || editingCategoryNewName.trim();
    if (!newNameVal || newNameVal === oldName) {
      setEditingCategoryOldName(null);
      return;
    }

    try {
      const res = await fetch('/api/kategori', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: categoryTab, oldName, newName: newNameVal })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        setCategories(data.categories);
        setEditingCategoryOldName(null);
        triggerToast('Kategori berhasil diperbarui', 'success');
        fetchTransactions(); // Refresh in case transactions had this category name
      }
    } catch (err) {
      triggerToast('Gagal memperbarui kategori', 'error');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    try {
      const res = await fetch(`/api/kategori?type=${categoryTab}&name=${name}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        setCategories(data.categories);
        triggerToast('Kategori berhasil dihapus', 'success');
      }
    } catch (err) {
      triggerToast('Gagal menghapus kategori', 'error');
    }
  };

  const checkIfMonthEnded = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    const yearNum = parseInt(selectedYear, 10);
    const monthNum = parseInt(selectedMonth, 10) - 1; // 0-indexed

    return yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth);
  };

  const handleSendJimpitanToKas = async () => {
    if (!checkIfMonthEnded()) {
      triggerToast('Bulan terpilih belum berakhir', 'error');
      return;
    }
    setIsSendingJimpitan(true);
    try {
      const res = await fetch('/api/transaksi/kirim-jimpitan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(data.message, 'success');
        fetchTransactions();
      }
    } catch (e) {
      triggerToast('Gagal mengirim data jimpitan', 'error');
    } finally {
      setIsSendingJimpitan(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [txRes, catRes] = await Promise.all([
          fetch(`/api/transaksi?month=${selectedMonth}&year=${selectedYear}`),
          fetch('/api/kategori')
        ]);
        const data = await txRes.json();
        const catData = await catRes.json();
        if (isMounted) {
          if (!data.error) {
            setTransactions(data.transactions);
            setSummary(data.summary);
            if (data.jimpitan) {
              setJimpitanInfo(data.jimpitan);
            }
          }
          if (!catData.error) {
            setCategories(catData);
          }
        }
      } catch (e) {
        console.error('Error loading kas data:', e);
        if (isMounted) triggerToast('Gagal memuat data kas', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedMonth, selectedYear]);

  // Set default category when formJenis changes or categories load
  useEffect(() => {
    if (categories[formJenis] && categories[formJenis].length > 0) {
      if (!categories[formJenis].includes(formKategori)) {
        setFormKategori(categories[formJenis][0]);
      }
    }
  }, [formJenis, categories]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const sanitizeCSV = (str: string) => {
    if (!str) return '';
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      return `'${str}`;
    }
    return str;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentTxId('');
    // Default to selected month/year but today's day
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    setFormTanggal(`${selectedYear}-${selectedMonth}-${dayStr}`);
    setFormJenis('pemasukan');
    setFormKategori('Sumbangan');
    setFormKeterangan('');
    setFormSubKeterangan('');
    setFormNominal('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    if (tx.isVirtual) {
      triggerToast('Transaksi otomatis jimpitan tidak dapat diedit manual', 'error');
      return;
    }
    setModalMode('edit');
    setCurrentTxId(tx.id);
    setFormTanggal(tx.tanggal.split('T')[0]);
    setFormJenis(tx.jenis);
    setFormKategori(tx.kategori || '');
    
    // Parse keterangan "Utama / Sub"
    if (tx.sumber === 'manual' && tx.keterangan.includes(' / ')) {
      const parts = tx.keterangan.split(' / ');
      setFormKeterangan(parts[0]);
      setFormSubKeterangan(parts[1] || '');
    } else {
      setFormKeterangan(tx.keterangan);
      setFormSubKeterangan('');
    }
    
    setFormNominal(String(tx.nominal));
    setIsModalOpen(true);
  };

  const handleOpenDelete = (tx: Transaction) => {
    if (tx.isVirtual) {
      triggerToast('Transaksi otomatis jimpitan tidak dapat dihapus manual', 'error');
      return;
    }
    setTxToDelete(tx);
    setShowDeleteConfirm(true);
  };

  const handleDeleteExecute = async () => {
    if (!txToDelete) return;
    try {
      const res = await fetch(`/api/transaksi?id=${txToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast('Transaksi kas berhasil dihapus', 'success');
        fetchTransactions();
      }
    } catch (e) {
      triggerToast('Gagal menghapus transaksi', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setTxToDelete(null);
    }
  };

  const handleSubmit = async (data: {
    tanggal: string;
    jenis: 'pemasukan' | 'pengeluaran';
    kategori: string;
    keterangan: string;
    nominal: string;
  }) => {
    if (!data.tanggal || !data.keterangan || !data.nominal) {
      triggerToast('Semua kolom wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/transaksi';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = modalMode === 'add'
        ? { tanggal: data.tanggal, jenis: data.jenis, kategori: data.kategori, keterangan: data.keterangan, nominal: data.nominal }
        : { id: currentTxId, tanggal: data.tanggal, jenis: data.jenis, kategori: data.kategori, keterangan: data.keterangan, nominal: data.nominal };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const resData = await res.json();
      if (resData.error) {
        triggerToast(resData.error, 'error');
      } else {
        triggerToast(
          modalMode === 'add' ? 'Transaksi kas berhasil dicatat' : 'Data transaksi kas berhasil diperbarui',
          'success'
        );
        setIsModalOpen(false);
        fetchTransactions();
      }
    } catch (e) {
      triggerToast('Gagal menyimpan transaksi', 'error');
    }
  };

  const handleOpenCategoryModal = useCallback((jenis: 'pemasukan' | 'pengeluaran') => {
    setCategoryTab(jenis);
    setIsCategoryModalOpen(true);
  }, []);

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "sep=;\r\n"; // separator specifier
    
    // Title & Metadata
    csvContent += `LAPORAN KAS RT - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}\r\n`;
    csvContent += `Saldo Awal;${summary.saldoAwal}\r\n`;
    csvContent += `Total Pemasukan;${summary.totalPemasukan}\r\n`;
    csvContent += `Total Pengeluaran;${summary.totalPengeluaran}\r\n`;
    csvContent += `Saldo Akhir;${summary.saldoAkhir}\r\n\r\n`;
    
    // Headers
    csvContent += "Tanggal;Jenis;Kategori;Keterangan;Pemasukan (Rp);Pengeluaran (Rp);Saldo (Rp)\r\n";
    
    // Rows
    // We sort the rows chronologically (ascending) for the Excel sheet
    const excelTx = [...transactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    
    excelTx.forEach(t => {
      const d = new Date(t.tanggal);
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const pem = t.jenis === 'pemasukan' && t.kategori !== 'Saldo Awal' ? t.nominal : 0;
      const peng = t.jenis === 'pengeluaran' ? t.nominal : 0;
      
      csvContent += `${formattedDate};${t.jenis.toUpperCase()};${sanitizeCSV(t.kategori || '-')};${sanitizeCSV(t.keteranganText || t.keterangan)};${pem};${peng};${t.saldo}\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-kas-rt-${selectedMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Laporan Kas RT CSV berhasil diunduh!', 'success');
  };

  // Formatting helpers
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num).replace('IDR', 'Rp').trim();
  };

  const getMonthName = (monthStr: string) => {
    const names: { [key: string]: string } = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return names[monthStr] || 'Juli';
  };

  // Group breakdown by category
  const getCategoryBreakdown = (type: 'pemasukan' | 'pengeluaran') => {
    const breakdown: { [key: string]: number } = {};
    transactions
      .filter(t => t.jenis === type && t.kategori !== 'Saldo Awal')
      .forEach(t => {
        const cat = t.kategori || 'Lain-lain';
        if (!breakdown[cat]) breakdown[cat] = 0;
        breakdown[cat] += t.nominal;
      });
    return breakdown;
  };

  const incomeBreakdown = useMemo(() => getCategoryBreakdown('pemasukan'), [transactions]);
  const expenseBreakdown = useMemo(() => getCategoryBreakdown('pengeluaran'), [transactions]);

  // Filter transactions based on type selection
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedType === 'all') return true;
      return t.jenis === selectedType;
    });
  }, [transactions, selectedType]);

  // Sort helper function
  const handleSort = (field: 'tanggal' | 'kategori' | 'nominal' | 'saldo') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'tanggal' ? 'desc' : 'asc');
    }
  };

  // Sort transactions based on user selection
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA: number | string = '';
      let valB: number | string = '';

      if (sortField === 'tanggal') {
        valA = new Date(a.tanggal).getTime();
        valB = new Date(b.tanggal).getTime();
      } else if (sortField === 'kategori') {
        valA = (a.kategori || '').toLowerCase();
        valB = (b.kategori || '').toLowerCase();
      } else if (sortField === 'nominal') {
        valA = a.nominal;
        valB = b.nominal;
      } else if (sortField === 'saldo') {
        valA = a.saldo;
        valB = b.saldo;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  // Calculate SVG Pie/Donut Chart segments with useMemo
  const donut = useMemo(() => {
    const total = summary.totalPemasukan + summary.totalPengeluaran + summary.saldoAkhir;
    if (total === 0) return { c: 314.16, incomeDash: 0, expenseDash: 0, saldoDash: 0, incomeOffset: 0, expenseOffset: 0, saldoOffset: 0, incomePct: 0, expensePct: 0, saldoPct: 0 };

    const incomePct = (summary.totalPemasukan / total) * 100;
    const expensePct = (summary.totalPengeluaran / total) * 100;
    const saldoPct = (summary.saldoAkhir / total) * 100;

    const r = 50;
    const c = 2 * Math.PI * r;

    const incomeOffset = c;
    const expenseOffset = c - (c * incomePct) / 100;
    const saldoOffset = c - (c * (incomePct + expensePct)) / 100;

    return {
      c,
      incomeDash: (c * incomePct) / 100,
      expenseDash: (c * expensePct) / 100,
      saldoDash: (c * saldoPct) / 100,
      incomeOffset,
      expenseOffset,
      saldoOffset,
      incomePct: Math.round(incomePct),
      expensePct: Math.round(expensePct),
      saldoPct: Math.round(saldoPct)
    };
  }, [summary]);

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Kas RT" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">

          {/* Toast Notification */}
          {showToast && (
            <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
              toastType === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
            }`}>
              {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Title and Subtitle */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Kas RT</h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Kelola pemasukan dan pengeluaran kas RT.</p>
          </div>

          {/* Dashboard Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
            
            {/* Hero Card: Saldo Akhir */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[var(--brand-light)]/40 to-white rounded-3xl p-6 md:p-8 border border-[var(--brand-primary)]/30 shadow-sm flex flex-col justify-between text-left min-h-[160px] hover:border-[var(--brand-primary)]/50 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-wider block">Saldo Akhir</span>
                  <span className="text-[11px] font-semibold text-slate-400 block">Bulan {getMonthName(selectedMonth)} {selectedYear}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <PiggyBank className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-3xl lg:text-4xl font-black text-[var(--brand-primary)] tracking-tighter">{formatRp(summary.saldoAkhir)}</h3>
              </div>
            </div>

            {/* Right Column: Other Stats & Jimpitan Widget */}
            <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">
              
              {/* Secondary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                {/* Saldo Awal */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-32 hover:border-slate-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Awal</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">1 {getMonthName(selectedMonth)} {selectedYear}</span>
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{formatRp(summary.saldoAwal)}</h3>
                  </div>
                </div>

                {/* Total Pemasukan */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-32 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pemasukan</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">Bulan Ini</span>
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-emerald-600 tracking-tight">+{formatRp(summary.totalPemasukan)}</h3>
                  </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-32 hover:border-red-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengeluaran</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">Bulan Ini</span>
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-red-600 tracking-tight">-{formatRp(summary.totalPengeluaran)}</h3>
                  </div>
                </div>
              </div>

              {/* Jimpitan Widget */}
              {jimpitanInfo.total > 0 && (
                <div className="bg-[#f0f9ff] border border-blue-100 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-left flex-1 hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Status Jimpitan</h4>
                      <p className="text-xs font-semibold text-blue-900">
                        {!checkIfMonthEnded() ? (
                          <>
                            Pengumpulan jimpitan bulan ini sedang berlangsung. Terkumpul: <span className="font-extrabold text-blue-700">{formatRp(jimpitanInfo.total)}</span>
                          </>
                        ) : jimpitanInfo.isSent ? (
                          <>
                            Jimpitan sebesar <span className="font-extrabold text-blue-700">{formatRp(jimpitanInfo.total)}</span> telah dikirim ke Kas.
                          </>
                        ) : (
                          <>
                            Terdapat jimpitan sebesar <span className="font-extrabold text-blue-700">{formatRp(jimpitanInfo.total)}</span> yang belum dikirim.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/jimpitan"
                      className="px-4 py-2 bg-white text-blue-700 font-bold rounded-xl transition-all text-[11px] cursor-pointer shadow-sm hover:shadow"
                    >
                      Lihat Rekap
                    </Link>
                    {!checkIfMonthEnded() ? (
                      <div className="px-4 py-2 bg-blue-100/70 text-blue-700 font-bold rounded-xl text-[11px] flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Berjalan
                      </div>
                    ) : jimpitanInfo.isSent ? (
                      <div className="px-4 py-2 bg-emerald-100/70 text-emerald-700 font-bold rounded-xl text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Terkirim
                      </div>
                    ) : (
                      <button
                        onClick={handleSendJimpitanToKas}
                        disabled={isSendingJimpitan}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-[11px] flex items-center gap-1.5 shadow-sm"
                      >
                        Kirim
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Bar: Filter, Month selector, TAMBAH Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm gap-4">
            
            {/* Left Controls: Select Month & Type */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              
              {/* Select Month */}
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label="Pilih Bulan Kas"
                  className="pl-10 pr-8 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer appearance-none min-w-[130px]"
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Select Year */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  aria-label="Pilih Tahun Kas"
                  className="px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer appearance-none min-w-[100px]"
                >
                  {(() => {
                    const currentYearNum = new Date().getFullYear();
                    const years = [];
                    for (let y = currentYearNum - 5; y <= currentYearNum + 2; y++) {
                      years.push(y);
                    }
                    return years.map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ));
                  })()}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Select Type (Pemasukan/Pengeluaran) */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  aria-label="Filter Jenis Transaksi"
                  className="px-4 pr-8 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer appearance-none min-w-[130px]"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="pemasukan">Pemasukan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Select Sort */}
              <div className="relative">
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-');
                    setSortField(field as any);
                    setSortDirection(dir as any);
                  }}
                  aria-label="Urutkan Transaksi"
                  className="px-4 pr-8 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer appearance-none min-w-[140px]"
                >
                  <option value="tanggal-desc">Terbaru</option>
                  <option value="tanggal-asc">Terlama</option>
                  <option value="nominal-desc">Nominal Tertinggi</option>
                  <option value="nominal-asc">Nominal Terendah</option>
                  <option value="saldo-desc">Saldo Tertinggi</option>
                  <option value="saldo-asc">Saldo Terendah</option>
                  <option value="kategori-asc">Kategori (A-Z)</option>
                </select>
                <ArrowUpDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

            </div>

            {/* Right Controls: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportExcel}
                aria-label="Ekspor Laporan Kas RT ke Excel"
                className="px-5 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleOpenAdd}
                aria-label="Tambah Transaksi Kas Baru"
                className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Tambah Transaksi</span>
              </button>
            </div>

          </div>

          {/* Table: Mutasi Kas */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6 text-left">
            <h3 className="text-sm font-semibold text-slate-700 tracking-tight mb-4">Mutasi Kas</h3>

            {isLoading ? (
              <div className="py-24 text-center text-slate-400 font-bold text-sm">Memuat mutasi kas...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-24 text-center text-slate-400 font-bold text-sm">Tidak ada transaksi pada filter terpilih.</div>
            ) : (
              <div className="flex flex-col gap-3 md:gap-4">
                {sortedTransactions.map((tx) => {
                  const d = new Date(tx.tanggal);
                  const dateStr = String(d.getDate()).padStart(2, '0');
                  const monthStr = d.toLocaleString('id-ID', { month: 'short' });
                  
                  return (
                    <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm hover:border-slate-200 hover:shadow-md transition-all">
                      
                      {/* Left: Date + Icon + Info */}
                      <div className="flex items-start gap-4 w-full sm:w-auto">
                        {/* Date */}
                        <div className="flex flex-col items-center justify-center min-w-[3rem]">
                          <span className="text-xl font-black text-slate-700">{dateStr}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{monthStr}</span>
                        </div>
                        
                        {/* Vertical Divider */}
                        <div className="w-px h-10 bg-slate-100 hidden sm:block mt-1"></div>
                        
                        {/* Icon & Details */}
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5">
                            {tx.jenis === 'pemasukan' ? (
                              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <ArrowDown className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                <ArrowUp className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{tx.keteranganText || tx.keterangan}</span>
                              {tx.isVirtual ? (
                                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md">Otomatis</span>
                              ) : tx.kategori !== 'Saldo Awal' ? (
                                <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md">Manual</span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-500">{tx.kategori || 'Tanpa Kategori'}</span>
                              {tx.detailKeterangan && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span className="text-[11px] text-slate-400 font-medium">{tx.detailKeterangan}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Nominal, Saldo, Actions */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 sm:mt-0 mt-2">
                        
                        {/* Amounts */}
                        <div className="flex flex-col sm:items-end text-left sm:text-right">
                          <span className={`text-base font-black ${tx.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-red-650'}`}>
                            {tx.jenis === 'pemasukan' ? '+' : '-'}{formatRp(tx.nominal)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">Saldo: {formatRp(tx.saldo)}</span>
                        </div>
                        
                        {/* Actions */}
                        {!tx.isVirtual && tx.kategori !== 'Saldo Awal' ? (
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-100 shrink-0">
                            {tx.kategori !== 'Jimpitan' && tx.sumber !== 'jimpitan' && (
                              <button
                                onClick={() => handleOpenEdit(tx)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDelete(tx)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="pl-2 border-l border-slate-100 shrink-0 flex items-center justify-center w-8">
                             <span className="text-[10px] text-slate-300 font-semibold italic">-</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Grid: Donut Chart, Ringkasan, Rincian */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            
            {/* Donut Chart & Ringkasan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-800 tracking-tight">Ringkasan Bulan {getMonthName(selectedMonth)} {selectedYear}</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
                
                {/* Donut chart SVG */}
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background Circle */}
                    <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    
                    {/* Blue segment: Saldo Akhir */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray={donut.c}
                      strokeDashoffset={donut.saldoOffset}
                      className="transition-all duration-500"
                    />

                    {/* Green segment: Pemasukan */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={donut.c}
                      strokeDashoffset={donut.incomeOffset}
                      className="transition-all duration-500"
                    />

                    {/* Red segment: Pengeluaran */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray={donut.c}
                      strokeDashoffset={donut.expenseOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Inside Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Saldo Akhir</span>
                    <span className="text-xs font-black text-slate-850 mt-0.5">{formatRp(summary.saldoAkhir)}</span>
                  </div>
                </div>

                {/* Bullets lists */}
                <div className="space-y-4 shrink-0 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Pemasukan</span>
                      <span className="text-xs font-extrabold text-slate-700">{formatRp(summary.totalPemasukan)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Pengeluaran</span>
                      <span className="text-xs font-extrabold text-slate-700">{formatRp(summary.totalPengeluaran)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block">Saldo Akhir</span>
                      <span className="text-xs font-black text-[#f95713]">{formatRp(summary.saldoAkhir)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Rincian Pemasukan & Pengeluaran */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">Rincian Pemasukan</h3>
                <div className="space-y-3">
                  {Object.keys(incomeBreakdown).filter(cat => incomeBreakdown[cat] > 0).length === 0 ? (
                    <div className="text-xs text-slate-400 font-semibold italic py-2">Tidak ada rincian pemasukan</div>
                  ) : (
                    Object.keys(incomeBreakdown)
                      .filter(cat => incomeBreakdown[cat] > 0)
                      .map(cat => (
                        <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-500">{cat}</span>
                          <span className="font-extrabold text-emerald-600">{formatRp(incomeBreakdown[cat])}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-base font-black text-slate-800 tracking-tight mb-4">Rincian Pengeluaran</h3>
                <div className="space-y-3">
                  {Object.keys(expenseBreakdown).filter(cat => expenseBreakdown[cat] > 0).length === 0 ? (
                    <div className="text-xs text-slate-400 font-semibold italic py-2">Tidak ada rincian pengeluaran</div>
                  ) : (
                    Object.keys(expenseBreakdown)
                      .filter(cat => expenseBreakdown[cat] > 0)
                      .map(cat => (
                        <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                          <span className="font-semibold text-slate-500">{cat}</span>
                          <span className="font-extrabold text-red-650">{formatRp(expenseBreakdown[cat])}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

          </div>



          {/* Edit/Add Transaction Dialog Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)} />
              
              {/* Isolated Form Component - prevents parent re-renders from breaking Android IME */}
              <TransactionForm
                modalMode={modalMode}
                currentTxId={currentTxId}
                initialTanggal={formTanggal}
                initialJenis={formJenis}
                initialKategori={formKategori}
                initialKeterangan={formKeterangan}
                initialSubKeterangan={formSubKeterangan}
                initialNominal={formNominal}
                categories={categories}
                isJimpitan={modalMode === 'edit' && transactions.find(t => t.id === currentTxId)?.sumber === 'jimpitan' || false}
                onSubmit={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
                onOpenCategoryModal={handleOpenCategoryModal}
              />
            </div>
          )}

          {/* Delete Confirm Modal */}
          {showDeleteConfirm && txToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowDeleteConfirm(false)} />
              
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-5 text-red-500">
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Transaksi</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                  Apakah Anda yakin ingin menghapus transaksi "{txToDelete.keteranganText || txToDelete.keterangan}" sebesar <span className="font-extrabold text-slate-800">{formatRp(txToDelete.nominal)}</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
                
                {txToDelete.sumber === 'jimpitan' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex items-start gap-2.5 mb-6">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                      Peringatan: Menghapus transaksi jimpitan susulan ini akan otomatis mengosongkan nominal jimpitan harian terkait di halaman Jimpitan.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteExecute}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-650 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all text-xs cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Management Modal */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsCategoryModalOpen(false)} />
              
              {/* Modal Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 text-left space-y-5">
                <h3 className="text-base font-black text-slate-800">Kelola Kategori Kas</h3>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setCategoryTab('pemasukan'); setEditingCategoryOldName(null); }}
                    className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      categoryTab === 'pemasukan' ? 'border-[#f95713] text-[#f95713]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Kategori Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCategoryTab('pengeluaran'); setEditingCategoryOldName(null); }}
                    className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      categoryTab === 'pengeluaran' ? 'border-[#f95713] text-[#f95713]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Kategori Pengeluaran
                  </button>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    ref={newCategoryNameRef}
                    type="text"
                    placeholder="Tambah kategori baru..."
                    defaultValue={newCategoryName}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-705 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {/* List of Categories */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {categories[categoryTab] && categories[categoryTab].map((cat: string) => {
                    const isEditing = editingCategoryOldName === cat;
                    const isSystemCat = cat === 'Lain-lain' || cat === 'Saldo Awal' || cat === 'Jimpitan';
                    
                    return (
                      <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100/50">
                        {isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              ref={editingCategoryNewNameRef}
                              type="text"
                              defaultValue={editingCategoryNewName}
                              className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleEditCategory(cat)}
                              className="px-2.5 py-1 bg-emerald-500 text-white font-bold rounded-lg text-[10px] hover:bg-emerald-600 cursor-pointer animate-in fade-in"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryOldName(null)}
                              className="px-2.5 py-1 border border-slate-200 text-slate-500 font-bold rounded-lg text-[10px] hover:bg-slate-50 cursor-pointer bg-white"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-700">{cat}</span>
                            {!isSystemCat && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryOldName(cat);
                                    setEditingCategoryNewName(cat);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer"
                                  title="Edit Nama"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Hapus Kategori"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs text-center cursor-pointer w-full"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          )}



        </main>
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>
    </div>
  );
}
