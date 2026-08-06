'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Info,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface Rombongan {
  id: string;
  nama: string;
  hariPiket: number | null;
  ketuaNama: string;
  ketuaNoRumah: string;
}

interface DayRecord {
  dateKey: string; // YYYY-MM-DD
  dayNum: number;
  dayLabel: string; // e.g. "Sel", "Rab"
  dateStr: string; // e.g. "Kamis, 1 Juli 2026"
  petugasName: string;
  petugasNoRumah: string;
  rombonganId: string | null;
  rombonganNama: string | null;
  jadwalId: string | null;
  jimpitanId: string | null;
  nominal: number;
  status: 'sudah_isi' | 'belum_isi' | 'belum_lewat';
  isFuture: boolean;
  isToday: boolean;
}

export default function JimpitanBulananPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('07'); // Default July
  const [selectedYear, setSelectedYear] = useState('2026'); // Default 2026
  
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [rombonganList, setRombonganList] = useState<Rombongan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonthSent, setIsMonthSent] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ dateKey: string; nominal: number } | null>(null);

  // Filters
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modified local nominal inputs
  const [modifiedNominals, setModifiedNominals] = useState<{ [dateKey: string]: number }>({});
  const [inputsText, setInputsText] = useState<{ [dateKey: string]: string }>({});
  
  // Bulk saving state
  const [isSaving, setIsSaving] = useState(false);

  // Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Dynamic today date relative to chosen timezone
  const getTodayStr = () => {
    let tz = 'Asia/Jakarta';
    if (typeof window !== 'undefined') {
      tz = localStorage.getItem('komuna-timezone') || 'Asia/Jakarta';
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchMonthlyData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch rombongan list first
      const resRom = await fetch('/api/rombongan');
      const dataRom = await resRom.json();
      const loadedRombongan: Rombongan[] = dataRom.error ? [] : dataRom;
      setRombonganList(loadedRombongan);

      // 2. Fetch schedules and jimpitan bulanan
      const res = await fetch(`/api/jimpitan/bulanan?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
        return;
      }
      
      const { schedules, jimpitan, isSent } = data;
      setIsMonthSent(!!isSent);

      // Generate all days for selected month
      const y = parseInt(selectedYear, 10);
      const m = parseInt(selectedMonth, 10) - 1;
      const numDays = new Date(y, m + 1, 0).getDate();
      
      const todayStr = getTodayStr();
      const records: DayRecord[] = [];
      
      for (let d = 1; d <= numDays; d++) {
        const loopDate = new Date(Date.UTC(y, m, d));
        const loopDateStr = loopDate.toISOString().split('T')[0];
        
        // Match schedules (still needed for jadwalId relation)
        const sched = schedules.find((s: any) => {
          const sDate = new Date(s.tanggal).toISOString().split('T')[0];
          return sDate === loopDateStr;
        });
        
        // Match jimpitan
        const jimp = jimpitan.find((j: any) => {
          const jDate = new Date(j.tanggal).toISOString().split('T')[0];
          return jDate === loopDateStr;
        });
        
        const isToday = loopDateStr === todayStr;
        const isFuture = loopDateStr > todayStr;
        
        let status: 'sudah_isi' | 'belum_isi' | 'belum_lewat' = 'belum_lewat';
        if (jimp && jimp.nominal > 0) {
          status = 'sudah_isi';
        } else if (isFuture) {
          status = 'belum_lewat';
        } else {
          status = 'belum_isi';
        }
        
        // Find the group assigned to this day of the week
        const dayOfWeek = loopDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const weekdayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
        const assignedGroup = loadedRombongan.find(r => r.hariPiket === weekdayNum);

        const petugasName = assignedGroup ? assignedGroup.ketuaNama : 'Tanpa Petugas';
        const petugasNoRumah = assignedGroup ? assignedGroup.ketuaNoRumah : '';
        const rombonganId = assignedGroup ? assignedGroup.id : null;
        const rombonganNama = assignedGroup ? assignedGroup.nama : null;

        // Indonesian day short name: e.g. "Selasa" -> "Sel", "Minggu" -> "Min"
        const weekdayLong = loopDate.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'UTC' });
        const dayLabel = weekdayLong.substring(0, 3); // "Sel", "Rab", etc.
        const dateFormatted = `${weekdayLong}, ${d} ${loopDate.toLocaleDateString('id-ID', { month: 'long', timeZone: 'UTC' })} ${y}`;
        
        records.push({
          dateKey: loopDateStr,
          dayNum: d,
          dayLabel,
          dateStr: dateFormatted,
          petugasName,
          petugasNoRumah,
          rombonganId,
          rombonganNama,
          jadwalId: sched?.id || null,
          jimpitanId: jimp?.id || null,
          nominal: jimp?.nominal || 0,
          status,
          isFuture,
          isToday
        });
      }
      
      setDayRecords(records);
      setModifiedNominals({});
      setInputsText({});
    } catch (e) {
      console.error(e);
      triggerToast('Gagal memuat rincian jimpitan', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load target on mount and when month/year changes
  useEffect(() => {
    fetchMonthlyData();
    if (typeof window !== 'undefined') {
      const savedTarget = localStorage.getItem(`komuna-target-${selectedMonth}-${selectedYear}`);
      if (savedTarget) {
        setTargetBulanIni(parseInt(savedTarget, 10));
      } else {
        setTargetBulanIni(3000000); // default target
      }
    }
  }, [selectedMonth, selectedYear]);

  // Handle month prev/next arrows
  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth, 10);
    let y = parseInt(selectedYear, 10);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth, 10);
    let y = parseInt(selectedYear, 10);
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleInputChange = (dateKey: string, text: string) => {
    setInputsText(prev => ({ ...prev, [dateKey]: text }));
    const numericVal = parseInt(text.replace(/\D/g, ''), 10) || 0;
    setModifiedNominals(prev => ({ ...prev, [dateKey]: numericVal }));
  };

  const handleAutoSave = async (dateKey: string, nominal: number) => {
    const record = dayRecords.find(r => r.dateKey === dateKey);
    if (!record) return;

    if (isMonthSent) {
      setConfirmData({ dateKey, nominal });
      setShowConfirmModal(true);
    } else {
      executeSave(dateKey, nominal);
    }
  };

  const executeSave = async (dateKey: string, nominal: number) => {
    const record = dayRecords.find(r => r.dateKey === dateKey);
    if (!record) return;

    try {
      const res = await fetch('/api/jimpitan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: `${dateKey}T00:00:00Z`,
          nominal,
          jadwalId: record.jadwalId,
          diisiOleh: 'Admin RT'
        })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(`Nominal Rp ${nominal.toLocaleString('id-ID')} disimpan`, 'success');
        setDayRecords(prev => prev.map(r => {
          if (r.dateKey === dateKey) {
            const newStatus = nominal > 0 ? 'sudah_isi' : (r.isFuture ? 'belum_lewat' : 'belum_isi');
            return { ...r, nominal, status: newStatus };
          }
          return r;
        }));
        setModifiedNominals(prev => {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        });
        setInputsText(prev => {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menyimpan jimpitan otomatis', 'error');
    }
  };

  // Real Excel (CSV) Exporter
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "sep=;\r\n"; // separator specifier
    
    // Title & Metadata
    csvContent += `LAPORAN JIMPITAN BULANAN - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}\r\n`;
    csvContent += `Total Terkumpul;${totalTerkumpul}\r\n`;
    csvContent += `Target Bulanan;${targetBulanIni}\r\n`;
    csvContent += `Sisa Target;${sisaTarget}\r\n`;
    csvContent += `Hari Terisi;${filledCount} dari ${totalDays} hari (${rasioPengisian}%)\r\n\r\n`;

    // Headers
    csvContent += "Tanggal;Hari;Petugas Piket;Rombongan;Nominal (Rp);Status\r\n";
    
    // Rows
    dayRecords.forEach(r => {
      const localVal = modifiedNominals[r.dateKey];
      const nominalVal = localVal !== undefined ? localVal : r.nominal;
      const statusText = nominalVal > 0 ? "Sudah Diisi" : (r.isFuture ? "Belum Tiba" : "Belum Diisi");
      
      csvContent += `${r.dayNum};${r.dayLabel};${r.petugasName};${r.rombonganNama || '-'};${nominalVal};${statusText}\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-jimpitan-${selectedMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Laporan Jimpitan CSV berhasil diunduh!', 'success');
  };

  // Helper formatting values
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

  // Javanese pasaran (5-day cycle): Reference Aug 17, 1945 = Legi
  const getPasaran = (dateStr: string): string => {
    const pasaranNames = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const reference = new Date(Date.UTC(1945, 7, 17)); // Aug 17, 1945
    const date = new Date(`${dateStr}T00:00:00Z`);
    const diffDays = Math.floor((date.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
    const index = ((diffDays % 5) + 5) % 5;
    return pasaranNames[index];
  };

  // Color index for badges
  const getRombonganColorClass = (rombonganId: string | null) => {
    if (!rombonganId) return 'bg-slate-50 text-slate-400 border-slate-100';
    const romIndex = rombonganList.findIndex(r => r.id === rombonganId);
    const colorStyles = [
      'bg-emerald-50 text-emerald-600 border-emerald-100', // R1
      'bg-sky-50 text-sky-600 border-sky-100', // R2
      'bg-purple-50 text-purple-600 border-purple-100', // R3
      'bg-orange-50 text-orange-600 border-orange-100', // R4
      'bg-pink-50 text-pink-600 border-pink-100', // R5
      'bg-indigo-50 text-indigo-600 border-indigo-100', // R6
      'bg-amber-50 text-amber-600 border-amber-100', // R7
    ];
    return colorStyles[romIndex >= 0 ? romIndex % colorStyles.length : 0];
  };

  // Editable target state
  const [targetBulanIni, setTargetBulanIni] = useState(3000000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInputText, setTargetInputText] = useState('');

  // Calculate dynamic summary stats
  const totalDays = dayRecords.length;
  
  // Calculate total terkumpul (taking dirty values into account)
  const totalTerkumpul = dayRecords.reduce((sum, r) => {
    const localVal = modifiedNominals[r.dateKey];
    return sum + (localVal !== undefined ? localVal : r.nominal);
  }, 0);

  // Count filled days
  const filledCount = dayRecords.filter(r => {
    const val = modifiedNominals[r.dateKey] !== undefined ? modifiedNominals[r.dateKey] : r.nominal;
    return val > 0;
  }).length;

  const rasioPengisian = totalDays > 0 ? Math.round((filledCount / totalDays) * 100) : 0;
  const sisaTarget = Math.max(0, targetBulanIni - totalTerkumpul);

  // Compute remaining days dynamically based on selected month/year vs today
  const remainingDays = (() => {
    const today = new Date();
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10) - 1;
    const numDays = new Date(y, m + 1, 0).getDate();
    // If selected month is in the past, 0 hari lagi
    if (y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth())) {
      return 0;
    }
    // If selected month is in the future, all days remain
    if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) {
      return numDays;
    }
    // Current month: remaining = days left from today
    return Math.max(0, numDays - today.getDate());
  })();

  // Apply frontend filters
  const filteredRecords = dayRecords.filter(item => {
    // Rombongan Filter
    if (selectedRombonganFilter !== 'all' && item.rombonganId !== selectedRombonganFilter) {
      return false;
    }
    // Status Filter
    if (selectedStatusFilter !== 'all') {
      const nominalVal = modifiedNominals[item.dateKey] !== undefined ? modifiedNominals[item.dateKey] : item.nominal;
      
      if (selectedStatusFilter === 'sudah_isi' && nominalVal === 0) {
        return false;
      }
      if (selectedStatusFilter === 'belum_isi' && nominalVal > 0) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Jimpitan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto pb-24 md:pb-16 font-sans">
          
          {/* Toast Notification */}
          {showToast && (
            <div className={`fixed bottom-20 right-6 md:bottom-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
              toastType === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
            }`}>
              {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Title Area */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Jimpitan</h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Catat nominal jimpitan harian sesuai jadwal petugas.</p>
          </div>

          {/* Filters and navigation bar */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            
            {/* Period selector */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                aria-label="Bulan sebelumnya"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <span className="text-xs mr-1">📅</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  aria-label="Pilih Bulan"
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:text-[var(--brand-primary)] transition-colors"
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
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  aria-label="Pilih Tahun"
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:text-[var(--brand-primary)] transition-colors"
                >
                  {['2024', '2025', '2026', '2027', '2028'].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                aria-label="Bulan berikutnya"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Rombongan Filter */}
              <select
                value={selectedRombonganFilter}
                onChange={(e) => setSelectedRombonganFilter(e.target.value)}
                aria-label="Filter Rombongan"
                className="bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Rombongan</option>
                {rombonganList.map((rom) => (
                  <option key={rom.id} value={rom.id}>{rom.nama}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                aria-label="Filter Status"
                className="bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="sudah_isi">Sudah Diisi</option>
                <option value="belum_isi">Belum Diisi</option>
              </select>

              {/* Link button to Jadwal */}
              <Link 
                href="/jadwal"
                className="px-5 py-2.5 border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-light)] font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwal</span>
              </Link>

            </div>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap items-center gap-4 md:gap-5 px-1 justify-start">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-500">Sudah Diisi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
              <span className="text-[10px] font-semibold text-slate-500">Hari Ini</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500">Belum Diisi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="text-[10px] font-semibold text-slate-500">Belum Tiba</span>
            </div>
          </div>

          {/* Main Jimpitan Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6">
            {isLoading ? (
              <div className="py-24 text-center text-slate-400 font-semibold text-sm">Memuat data jimpitan...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-24 text-center text-slate-400 font-semibold text-sm">Tidak ada data setoran jimpitan.</div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-4 text-center w-14">Tgl</th>
                      <th className="py-4 px-4 text-center w-16">Hari</th>
                      <th className="py-4 px-4 w-[240px]">Petugas Jimpitan</th>
                      <th className="py-4 px-4 text-center w-[160px]">Rombongan</th>
                      <th className="py-4 px-4 text-center w-[180px]">Nominal (Rp)</th>
                      <th className="py-4 px-4 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((item) => {
                      const localVal = modifiedNominals[item.dateKey];
                      const activeVal = localVal !== undefined ? localVal : item.nominal;
                      
                      const isFut = item.isFuture;
                      const isTod = item.isToday;

                      return (
                        <tr 
                          key={item.dateKey} 
                          className={`transition-colors ${
                            isTod 
                              ? 'bg-orange-50/20 font-semibold' 
                              : isFut 
                                ? 'bg-slate-50/20 opacity-60' 
                                : 'hover:bg-slate-50/40'
                          }`}
                        >
                          {/* Day number */}
                          <td className="py-4 px-4 text-center font-bold text-slate-700 text-xs">
                            {String(item.dayNum).padStart(2, '0')}
                          </td>
                          
                          {/* Short weekday + Javanese Pasaran */}
                          <td className={`py-4 px-4 text-center ${isTod ? 'text-[var(--brand-primary)]' : 'text-slate-500'}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`font-bold text-xs ${isTod ? 'text-[var(--brand-primary)]' : 'text-slate-700'}`}>
                                {item.dayLabel}
                              </span>
                              <span className={`text-[9px] font-semibold ${isTod ? 'text-[var(--brand-primary)]' : 'text-slate-500'}`}>
                                {getPasaran(item.dateKey)}
                              </span>
                            </div>
                          </td>

                          {/* Officer with subtext House No. */}
                          <td className="py-4 px-4 text-xs">
                            <div className="flex flex-col text-left">
                              {item.petugasName !== 'Tanpa Petugas' ? (
                                <>
                                  <span className="text-[9px] text-slate-400 font-semibold">Ketua Rombongan</span>
                                  <span className="font-bold text-slate-800 mt-0.5">{item.petugasName}</span>
                                  {item.petugasNoRumah && (
                                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">{item.petugasNoRumah}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold italic">Belum ada petugas</span>
                              )}
                            </div>
                          </td>

                          {/* Group Rombongan Badge */}
                          <td className="py-4 px-4 text-center">
                            {item.rombonganNama ? (
                              <span className={`text-[8px] font-bold uppercase px-2.5 py-1 rounded-md border whitespace-nowrap ${getRombonganColorClass(item.rombonganId)}`}>
                                {item.rombonganNama}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Nominal Input Field */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {isFut ? (
                                <span className="text-slate-300 font-bold text-xs">-</span>
                              ) : (
                                <div className="relative w-full max-w-[140px]">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                  <input
                                    type="text"
                                    disabled={isSaving}
                                    aria-label={`Nominal jimpitan tanggal ${item.dateStr}`}
                                    value={inputsText[item.dateKey] !== undefined ? inputsText[item.dateKey] : (activeVal > 0 ? activeVal.toLocaleString('id-ID') : '')}
                                    onChange={(e) => handleInputChange(item.dateKey, e.target.value)}
                                    onBlur={() => {
                                      const localVal = modifiedNominals[item.dateKey];
                                      const activeVal = localVal !== undefined ? localVal : item.nominal;
                                      if (activeVal !== item.nominal) {
                                        handleAutoSave(item.dateKey, activeVal);
                                      } else {
                                        setInputsText(prev => {
                                          const next = { ...prev };
                                          delete next[item.dateKey];
                                          return next;
                                        });
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    placeholder="0"
                                    className={`w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:bg-white transition-all text-left ${
                                      localVal !== undefined && localVal !== item.nominal ? 'border-amber-400 ring-2 ring-amber-400/10' : ''
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 text-center">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg whitespace-nowrap ${
                              item.status === 'sudah_isi' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : item.status === 'belum_isi'
                                  ? 'bg-red-50 text-red-500'
                                  : 'bg-slate-50 text-slate-400'
                            }`}>
                              {item.status === 'sudah_isi' ? 'Diisi' : item.status === 'belum_isi' ? 'Kosong' : 'Belum'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rangkuman Footer Bulanan Cards */}
          <div className="bg-[#f8fafc] border border-slate-200/50 rounded-3xl p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              
              {/* Total Jimpitan */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Jimpitan {getMonthName(selectedMonth)} {selectedYear}</span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--brand-primary)] tracking-tight">{formatRp(totalTerkumpul)}</h3>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                    Dana terkumpul {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                </div>
              </div>

              {/* Target Bulan Ini - Editable */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-28">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Bulan Ini</span>
                  {!isEditingTarget ? (
                    <button
                      onClick={() => { setTargetInputText(String(targetBulanIni)); setIsEditingTarget(true); }}
                      aria-label="Edit target bulan ini"
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const val = parseInt(targetInputText.replace(/\D/g, ''), 10);
                        if (!isNaN(val) && val > 0) {
                          setTargetBulanIni(val);
                          localStorage.setItem(`komuna-target-${selectedMonth}-${selectedYear}`, String(val));
                        }
                        setIsEditingTarget(false);
                      }}
                      aria-label="Simpan target bulan ini"
                      className="p-1 rounded-lg hover:bg-emerald-50 transition-colors text-emerald-500 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  {isEditingTarget ? (
                    <input
                      autoFocus
                      type="text"
                      value={targetInputText}
                      onChange={(e) => setTargetInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt(targetInputText.replace(/\D/g, ''), 10);
                          if (!isNaN(val) && val > 0) {
                            setTargetBulanIni(val);
                            localStorage.setItem(`komuna-target-${selectedMonth}-${selectedYear}`, String(val));
                          }
                          setIsEditingTarget(false);
                        }
                        if (e.key === 'Escape') setIsEditingTarget(false);
                      }}
                      className="w-full text-base font-semibold text-slate-800 tracking-tight border-b-2 border-orange-400 outline-none bg-transparent py-0.5"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{formatRp(targetBulanIni)}</h3>
                  )}
                  <span className="text-[9px] text-slate-450 font-semibold block mt-0.5">
                    Rata-rata/hari: {formatRp(totalDays > 0 ? Math.round(targetBulanIni / totalDays) : 0)}
                  </span>
                </div>
              </div>

              {/* Hari Terisi */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hari Terisi</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                    {filledCount} <span className="text-xs text-slate-400 font-semibold">/ {totalDays} hari</span>
                  </h3>
                  <span className="text-[9px] text-slate-455 font-semibold block mt-0.5">{rasioPengisian}%</span>
                </div>
              </div>

              {/* Sisa Target */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between text-left h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Target</span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--brand-primary)] tracking-tight">{formatRp(sisaTarget)}</h3>
                  <span className="text-[9px] text-slate-455 font-semibold block mt-0.5">
                    {remainingDays > 0 ? `${remainingDays} hari lagi di ${getMonthName(selectedMonth)} ${selectedYear}` : `Bulan ${getMonthName(selectedMonth)} ${selectedYear} sudah selesai`}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom buttons block */}
            <div className="flex items-center justify-start pt-4 border-t border-slate-200/50">
              <button
                onClick={handleExportExcel}
                className="px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <span>Export Excel</span>
              </button>
            </div>

          </div>

          {/* Callout Info Block */}
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-center gap-3 text-left">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-[#1e40af]">
              Nominal akan otomatis masuk ke menu Kas RT sebagai pemasukan (Jimpitan).
            </span>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 font-medium">
            komuna.id v1.0.0
          </div>

        </main>
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-800">Konfirmasi Jimpitan Susulan</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Bulan ini sudah dikirim ke Kas RT. Mengisi/mengubah jimpitan susulan akan otomatis mencatat atau mengubah transaksi pemasukan di Kas RT. Apakah Anda yakin ingin melanjutkan?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  fetchMonthlyData(true); // Revert UI
                  setShowConfirmModal(false);
                  setConfirmData(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  executeSave(confirmData.dateKey, confirmData.nominal);
                  setShowConfirmModal(false);
                  setConfirmData(null);
                }}
                className="flex-1 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-sm"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
