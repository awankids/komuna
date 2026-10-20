'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import JimpitanInputRow from '@/components/JimpitanInputRow';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Check,
  Coins
} from 'lucide-react';
import Link from 'next/link';

// --- MODULE-LEVEL STATIC CONSTANTS (Zero Re-allocation) ---
const IDR_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatRp = (num: number): string => {
  return IDR_FORMATTER.format(num).replace('IDR', 'Rp').trim();
};

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
};

const getMonthName = (monthStr: string): string => MONTH_NAMES[monthStr] || 'Juli';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
const PASARAN_NAMES = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const;
const PASARAN_REF_MS = new Date(Date.UTC(1945, 7, 17)).getTime(); // Aug 17, 1945 UTC

const getPasaran = (timeMs: number): string => {
  const diffDays = Math.floor((timeMs - PASARAN_REF_MS) / 86400000);
  const index = ((diffDays % 5) + 5) % 5;
  return PASARAN_NAMES[index];
};

const ROMBONGAN_COLOR_STYLES = [
  'bg-emerald-50 text-emerald-600 border-emerald-100', // R1
  'bg-sky-50 text-sky-600 border-sky-100', // R2
  'bg-purple-50 text-purple-600 border-purple-100', // R3
  'bg-orange-50 text-orange-600 border-orange-100', // R4
  'bg-pink-50 text-pink-600 border-pink-100', // R5
  'bg-indigo-50 text-indigo-600 border-indigo-100', // R6
  'bg-amber-50 text-amber-600 border-amber-100', // R7
] as const;

const getRombonganColor = (rombonganId: string | null, indexMap: Map<string, number>): string => {
  if (!rombonganId) return 'bg-slate-50 text-slate-400 border-slate-100';
  const idx = indexMap.get(rombonganId);
  if (idx === undefined || idx < 0) return ROMBONGAN_COLOR_STYLES[0];
  return ROMBONGAN_COLOR_STYLES[idx % ROMBONGAN_COLOR_STYLES.length];
};

const sanitizeCSV = (str: string): string => {
  if (!str) return '""';
  let val = str;
  if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
    val = `'${val}`;
  }
  return `"${val.replace(/"/g, '""')}"`;
};

// --- DATA TYPES ---
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
  dayLabel: string;
  pasaran: string;
  dateStr: string;
  petugasName: string;
  petugasNoRumah: string;
  rombonganId: string | null;
  rombonganNama: string | null;
  rombonganColorClass: string;
  jadwalId: string | null;
  jimpitanId: string | null;
  nominal: number;
  status: 'sudah_isi' | 'belum_isi' | 'belum_lewat';
  isFuture: boolean;
  isToday: boolean;
}

interface ScheduleAPI {
  id: string;
  tanggal: string;
}

interface JimpitanAPI {
  id: string;
  tanggal: string;
  nominal: number;
}

// --- MEMOIZED ROW COMPONENT (Prevents 30 Unnecessary Row Re-renders) ---
const JimpitanRowItem = React.memo(function JimpitanRowItem({
  item,
  isSaving,
  onSave
}: {
  item: DayRecord;
  isSaving: boolean;
  onSave: (dateKey: string, nominal: number) => void;
}) {
  const isFut = item.isFuture;
  const isTod = item.isToday;

  let dotColor = 'bg-slate-200';
  if (isTod) dotColor = 'bg-[var(--brand-primary)]';
  else if (item.status === 'sudah_isi') dotColor = 'bg-emerald-500';
  else if (item.status === 'belum_isi') dotColor = 'bg-slate-400';

  return (
    <div 
      className={`flex items-stretch py-4 pl-4 pr-1 transition-colors relative ${
        isTod 
          ? 'bg-[var(--brand-light)]/20' 
          : isFut 
            ? 'bg-slate-50/20 opacity-60' 
            : 'hover:bg-slate-50/40 bg-white'
      }`}
    >
      {/* Status Dot */}
      <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 -ml-[5px] md:-ml-1.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-white shadow-sm z-10">
        <div className={`w-full h-full rounded-full ${dotColor}`} />
      </div>

      {/* Left: Date Block */}
      <div className="flex flex-col items-center justify-center w-[60px] md:w-[72px] shrink-0 border-r border-slate-100 pr-3 mr-3 md:mr-4">
        <span className={`text-xl md:text-2xl font-black tracking-tighter ${isTod ? 'text-[var(--brand-primary)]' : 'text-slate-800'}`}>
          {String(item.dayNum).padStart(2, '0')}
        </span>
        <span className={`text-[10px] md:text-xs font-bold mt-0.5 ${isTod ? 'text-[var(--brand-primary)]' : 'text-slate-700'}`}>
          {item.dayLabel}
        </span>
        <span className={`text-[9px] md:text-[10px] font-semibold mt-0.5 ${isTod ? 'text-[var(--brand-primary)] opacity-80' : 'text-slate-400'}`}>
          {item.pasaran}
        </span>
      </div>

      {/* Middle: Officer Info */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        {item.petugasName !== 'Tanpa Petugas' ? (
          <>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Ketua Rombongan</span>
            <span className="font-bold text-slate-800 text-xs md:text-sm mt-0.5 truncate">{item.petugasName}</span>
            {item.petugasNoRumah && (
              <span className="text-[10px] md:text-[11px] text-slate-400 font-medium mt-0.5">{item.petugasNoRumah}</span>
            )}
            {item.rombonganNama && (
              <div className="mt-2">
                <span className={`text-[8px] md:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${item.rombonganColorClass}`}>
                  {item.rombonganNama}
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-400 font-semibold italic flex items-center h-full">Belum ada petugas</span>
        )}
      </div>

      {/* Right: Nominal & Status */}
      <div className="flex flex-col items-end justify-center shrink-0 w-[100px] md:w-[120px]">
        <JimpitanInputRow
          dateKey={item.dateKey}
          dateStr={item.dateStr}
          initialValue={item.nominal}
          isFuture={isFut}
          isSaving={isSaving}
          onSave={onSave}
        />
        <div className="mt-2 flex items-center justify-end w-full pr-5 md:pr-6 relative">
          <span className={`text-[8px] md:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide ${
            item.status === 'sudah_isi' 
              ? 'bg-emerald-50 text-emerald-600' 
              : item.status === 'belum_isi' 
                ? 'bg-red-50 text-red-500' 
                : 'bg-slate-50 text-slate-400'
          }`}>
            {item.status === 'sudah_isi' ? 'Diisi' : item.status === 'belum_isi' ? 'Kosong' : 'Belum'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 absolute right-0" />
        </div>
      </div>
    </div>
  );
});

// --- MAIN PAGE COMPONENT ---
export default function JimpitanBulananPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const today = new Date();
    return String(today.getFullYear());
  });
  
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [rombonganList, setRombonganList] = useState<Rombongan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonthSent, setIsMonthSent] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ dateKey: string; nominal: number } | null>(null);

  // Filters
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Per-date saving state (lock only the row being saved, not the whole screen)
  const [savingDateKeys, setSavingDateKeys] = useState<Record<string, boolean>>({});

  // Ref untuk scroll-to-today otomatis setelah data dimuat
  const todayRowRef = useRef<HTMLDivElement>(null);

  // Target State — null berarti belum dimuat dari server (bukan Rp 3jt hardcoded)
  const [targetBulanIni, setTargetBulanIni] = useState<number | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState('');
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const triggerToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  }, []);

  const getTodayStr = (): string => {
    try {
      const tz = typeof window !== 'undefined' ? (localStorage.getItem('komuna-timezone') || 'Asia/Jakarta') : 'Asia/Jakarta';
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  // 1. Load global target ONCE on initial mount (no re-fetching on month changes)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          // Hanya set jika ada nilai positif - jangan pakai fallback hardcoded
          const val = typeof data?.targetJimpitan === 'number' && data.targetJimpitan > 0
            ? data.targetJimpitan
            : null;
          setTargetBulanIni(val);
        }
      })
      .catch(err => {
        console.error('Failed to load target:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch monthly data & rombongan in parallel with AbortController (prevents race condition)
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [resRom, resMonthly] = await Promise.all([
          rombonganList.length === 0 
            ? fetch('/api/rombongan', { signal: controller.signal }).then(r => r.json())
            : Promise.resolve(rombonganList),
          fetch(`/api/jimpitan/bulanan?month=${selectedMonth}&year=${selectedYear}`, { signal: controller.signal }).then(r => r.json())
        ]);

        if (controller.signal.aborted) return;

        const loadedRombongan: Rombongan[] = Array.isArray(resRom) ? resRom : rombonganList;
        if (rombonganList.length === 0 && Array.isArray(resRom)) {
          setRombonganList(loadedRombongan);
        }

        if (resMonthly.error) {
          triggerToast(resMonthly.error, 'error');
          return;
        }

        const schedules: ScheduleAPI[] = resMonthly.schedules || [];
        const jimpitan: JimpitanAPI[] = resMonthly.jimpitan || [];
        setIsMonthSent(!!resMonthly.isSent);

        // Build fast O(1) Map lookups
        const rombonganPiketMap = new Map<number, Rombongan>();
        loadedRombongan.forEach(r => {
          if (r.hariPiket !== null) rombonganPiketMap.set(r.hariPiket, r);
        });

        const rombonganIndexMap = new Map<string, number>();
        loadedRombongan.forEach((r, idx) => rombonganIndexMap.set(r.id, idx));

        const schedMap = new Map<string, ScheduleAPI>();
        schedules.forEach((s) => {
          const sDate = s.tanggal ? new Date(s.tanggal).toISOString().split('T')[0] : '';
          if (sDate) schedMap.set(sDate, s);
        });

        const jimpMap = new Map<string, JimpitanAPI>();
        jimpitan.forEach((j) => {
          const jDate = j.tanggal ? new Date(j.tanggal).toISOString().split('T')[0] : '';
          if (jDate) jimpMap.set(jDate, j);
        });

        const y = parseInt(selectedYear, 10);
        const m = parseInt(selectedMonth, 10) - 1;
        const numDays = new Date(y, m + 1, 0).getDate();
        const todayStr = getTodayStr();
        const monthName = getMonthName(selectedMonth);

        const records: DayRecord[] = [];

        for (let d = 1; d <= numDays; d++) {
          const loopTimeMs = Date.UTC(y, m, d);
          const loopDate = new Date(loopTimeMs);
          const loopDateStr = loopDate.toISOString().split('T')[0];

          const sched = schedMap.get(loopDateStr);
          const jimp = jimpMap.get(loopDateStr);

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

          const dayOfWeek = loopDate.getUTCDay(); // 0 = Sun, 1 = Mon ...
          const weekdayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
          const assignedGroup = rombonganPiketMap.get(weekdayNum);

          const petugasName = assignedGroup ? assignedGroup.ketuaNama : 'Tanpa Petugas';
          const petugasNoRumah = assignedGroup ? assignedGroup.ketuaNoRumah : '';
          const rombonganId = assignedGroup ? assignedGroup.id : null;
          const rombonganNama = assignedGroup ? assignedGroup.nama : null;
          const rombonganColorClass = getRombonganColor(rombonganId, rombonganIndexMap);

          const dayLabel = DAY_LABELS[dayOfWeek];
          const dayName = DAY_NAMES[dayOfWeek];
          const pasaran = getPasaran(loopTimeMs);
          const dateFormatted = `${dayName}, ${d} ${monthName} ${y}`;

          records.push({
            dateKey: loopDateStr,
            dayNum: d,
            dayLabel,
            pasaran,
            dateStr: dateFormatted,
            petugasName,
            petugasNoRumah,
            rombonganId,
            rombonganNama,
            rombonganColorClass,
            jadwalId: sched?.id || null,
            jimpitanId: jimp?.id || null,
            nominal: jimp?.nominal || 0,
            status,
            isFuture,
            isToday
          });
        }

        setDayRecords(records);
      } catch (e: any) {
        if (!controller.signal.aborted) {
          console.error(e);
          triggerToast('Gagal memuat rincian jimpitan', 'error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [selectedMonth, selectedYear, triggerToast]);

  // Handle month prev/next arrows
  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth, 10) - 1;
    let y = parseInt(selectedYear, 10);
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth, 10) + 1;
    let y = parseInt(selectedYear, 10);
    if (m === 13) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  // Save handler per day
  const executeSave = useCallback(async (dateKey: string, nominal: number) => {
    const record = dayRecords.find(r => r.dateKey === dateKey);
    if (!record) return;

    setSavingDateKeys(prev => ({ ...prev, [dateKey]: true }));
    try {
      const res = await fetch('/api/jimpitan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: `${dateKey}T00:00:00Z`,
          nominal,
          jadwalId: record.jadwalId,
          // diisiOleh tidak dikirim dari client - server baca dari session JWT
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
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menyimpan jimpitan otomatis', 'error');
    } finally {
      setSavingDateKeys(prev => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
    }
  }, [dayRecords, triggerToast]);

  const handleAutoSave = useCallback((dateKey: string, nominal: number) => {
    if (isMonthSent) {
      setConfirmData({ dateKey, nominal });
      setShowConfirmModal(true);
    } else {
      executeSave(dateKey, nominal);
    }
  }, [isMonthSent, executeSave]);

  // Real Excel (CSV) Exporter with full injection protection & URL revoke
  const handleExportExcel = () => {
    let csvContent = '\uFEFFsep=;\r\n';
    
    // Title & Metadata
    csvContent += `LAPORAN JIMPITAN BULANAN - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}\r\n`;
    csvContent += `Total Terkumpul;${totalTerkumpul}\r\n`;
    csvContent += `Target Bulanan;${targetBulanIni}\r\n`;
    csvContent += `Sisa Target;${sisaTarget}\r\n`;
    csvContent += `Hari Terisi;${filledCount} dari ${totalDays} hari (${rasioPengisian}%)\r\n\r\n`;

    // Headers
    csvContent += 'Tanggal;Hari;Pasaran;Petugas Piket;Rombongan;Nominal (Rp);Status\r\n';
    
    // Rows
    dayRecords.forEach(r => {
      const statusText = r.nominal > 0 ? 'Sudah Diisi' : (r.isFuture ? 'Belum Tiba' : 'Belum Diisi');
      csvContent += `${r.dayNum};${sanitizeCSV(r.dayLabel)};${sanitizeCSV(r.pasaran)};${sanitizeCSV(r.petugasName)};${sanitizeCSV(r.rombonganNama || '-')};${r.nominal};${sanitizeCSV(statusText)}\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-jimpitan-${selectedMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerToast('Laporan Jimpitan CSV berhasil diunduh!', 'success');
  };

  // Dynamic summary stats - semua dibungkus useMemo agar tidak recalculate setiap render
  const totalDays = useMemo(() => dayRecords.length, [dayRecords]);

  const totalTerkumpul = useMemo(() => {
    return dayRecords.reduce((sum, r) => sum + r.nominal, 0);
  }, [dayRecords]);

  const filledCount = useMemo(() => {
    return dayRecords.filter(r => r.nominal > 0).length;
  }, [dayRecords]);

  const rasioPengisian = useMemo(
    () => (totalDays > 0 ? Math.round((filledCount / totalDays) * 100) : 0),
    [filledCount, totalDays]
  );

  const sisaTarget = useMemo(
    () => (targetBulanIni !== null ? Math.max(0, targetBulanIni - totalTerkumpul) : null),
    [targetBulanIni, totalTerkumpul]
  );

  const persentaseTarget = useMemo(
    () => (targetBulanIni && targetBulanIni > 0 ? Math.round((totalTerkumpul / targetBulanIni) * 100) : 0),
    [targetBulanIni, totalTerkumpul]
  );

  const targetHarian = useMemo(
    () => (targetBulanIni && totalDays > 0 ? Math.round(targetBulanIni / totalDays) : null),
    [targetBulanIni, totalDays]
  );

  const avgTerkumpul = useMemo(() => {
    return filledCount > 0 ? Math.round(totalTerkumpul / filledCount) : 0;
  }, [totalTerkumpul, filledCount]);

  const remainingDays = useMemo(() => {
    // Gunakan getTodayStr() yang timezone-aware (konsisten dengan data baris)
    const todayStr = getTodayStr();
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10) - 1;
    if (isNaN(y) || isNaN(m)) return 0;
    const numDays = new Date(y, m + 1, 0).getDate();
    const [ty, tm, td] = todayStr.split('-').map(Number);
    if (y < ty || (y === ty && m < tm - 1)) return 0;
    if (y > ty || (y === ty && m > tm - 1)) return numDays;
    return Math.max(0, numDays - td);
  }, [selectedMonth, selectedYear]);

  // Frontend filters (fast-path returns dayRecords if filters are default 'all')
  const filteredRecords = useMemo(() => {
    if (selectedRombonganFilter === 'all' && selectedStatusFilter === 'all') {
      return dayRecords;
    }
    return dayRecords.filter(item => {
      if (selectedRombonganFilter !== 'all' && item.rombonganId !== selectedRombonganFilter) {
        return false;
      }
      if (selectedStatusFilter === 'sudah_isi' && item.nominal === 0) return false;
      if (selectedStatusFilter === 'belum_isi' && item.nominal > 0) return false;
      return true;
    });
  }, [dayRecords, selectedRombonganFilter, selectedStatusFilter]);

  const handleSaveTarget = async (val: number) => {
    if (isNaN(val) || val <= 0) {
      setTargetError('Target harus berupa angka lebih dari 0');
      return;
    }
    if (val > 1_000_000_000) {
      setTargetError('Target terlalu besar (maks Rp 1 Miliar)');
      return;
    }
    setTargetError('');
    setIsSavingTarget(true);
    setTargetBulanIni(val);
    setIsEditingTarget(false);
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, targetJimpitan: val })
      });
      triggerToast('Target bulanan berhasil diperbarui', 'success');
    } catch (e) {
      console.error('Gagal menyimpan target jimpitan', e);
      triggerToast('Gagal menyimpan target bulanan', 'error');
    } finally {
      setIsSavingTarget(false);
    }
  };

  // Scroll-to-today: setelah data bulan ini dimuat, geser ke baris hari ini secara smooth
  useEffect(() => {
    if (!isLoading && dayRecords.length > 0) {
      const timer = setTimeout(() => {
        todayRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, dayRecords]);

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Jimpitan" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-clip">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
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

          {/* Filters and Navigation Bar */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            
            {/* Period Selector */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                aria-label="Bulan sebelumnya"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
                  {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map(yr => (
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

          {/* Sticky Gojek-Style Jimpitan Summary Card */}
          <div className="sticky top-16 md:top-20 z-20 -mx-4 sm:-mx-6 md:-mx-8 xl:-mx-10 2xl:-mx-12 px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-3 bg-[#f8fafc] border-b border-slate-200/80 shadow-xs transition-all">
            <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
            
            {/* Top Bar: Title, Sync Badge & Quick Action */}
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0 shadow-xs">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs md:text-sm font-bold text-slate-800 truncate">
                    Ringkasan {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                  <span 
                    title="Nominal otomatis tersinkronisasi ke menu Kas RT sebagai pemasukan Jimpitan"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 shrink-0"
                  >
                    <Check className="w-2.5 h-2.5" />
                    Auto-sync Kas RT
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportExcel}
                  aria-label="Export Excel"
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
              </div>
            </div>

            {/* Middle Grid: Gojek Wallet Pods (Left: Total Balance, Right: Progress & Metrics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
              
              {/* Left Pod: Total Jimpitan Terkumpul */}
              <div className="lg:col-span-5 flex flex-col justify-center text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Jimpitan Terkumpul
                  </span>
                  {/* Subtle live indicator */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Update
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--brand-primary)] tracking-tight">
                    {formatRp(totalTerkumpul)}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span 
                    title={filledCount > 0 ? `Rata-rata dari ${filledCount} hari terisi` : 'Belum ada hari terisi'}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/50"
                  >
                    <span className="text-slate-400 font-normal">Realisasi:</span>
                    {formatRp(avgTerkumpul)}/hari
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    &bull; {filledCount} dari {totalDays} hari terisi ({rasioPengisian}%)
                  </span>
                </div>
              </div>

              {/* Vertical Divider (Desktop Only) */}
              <div className="hidden lg:block w-px h-16 bg-slate-100" />

              {/* Right Pod: Target & Visual Progress Bar */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-2 text-left">
                
                {/* Target Header Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target:</span>
                    {!isEditingTarget ? (
                      <div className="flex items-center gap-1">
                        {targetBulanIni !== null ? (
                          <span className="font-extrabold text-slate-800 text-xs md:text-sm">
                            {formatRp(targetBulanIni)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">Belum diatur</span>
                        )}
                        <button
                          onClick={() => {
                            setTargetError('');
                            setIsEditingTarget(true);
                          }}
                          aria-label="Edit target bulan ini"
                          title="Ubah Target"
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <input
                            ref={targetInputRef}
                            autoFocus
                            type="text"
                            inputMode="numeric"
                            defaultValue={targetBulanIni !== null ? targetBulanIni.toLocaleString('id-ID') : ''}
                            placeholder="cth: 3.000.000"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt(targetInputRef.current?.value?.replace(/\D/g, '') || '0', 10);
                                handleSaveTarget(val);
                              }
                              if (e.key === 'Escape') {
                                setIsEditingTarget(false);
                                setTargetError('');
                              }
                            }}
                            className="w-28 text-xs font-bold border-b-2 border-[var(--brand-primary)] outline-none bg-transparent py-0.5 text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                          />
                          <button
                            disabled={isSavingTarget}
                            onClick={() => {
                              const val = parseInt(targetInputRef.current?.value?.replace(/\D/g, '') || '0', 10);
                              handleSaveTarget(val);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer disabled:opacity-50"
                            title="Simpan Target"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {targetError && (
                          <span className="text-[10px] text-red-500 font-semibold">{targetError}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Percentage Status */}
                  <div className="flex items-center gap-1 font-extrabold text-[11px]">
                    {targetBulanIni === null ? (
                      <span className="text-slate-400 font-semibold text-[10px]">-</span>
                    ) : persentaseTarget >= 100 ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Target Tercapai!
                      </span>
                    ) : (
                      <span className="text-[var(--brand-primary)]">
                        {persentaseTarget}% Tercapai
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Progress Bar - tampilkan skeleton jika target belum diatur */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  {targetBulanIni !== null ? (
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-amber-500 transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, persentaseTarget)}%` }}
                    />
                  ) : (
                    <div className="h-full rounded-full bg-slate-200/60 animate-pulse w-1/3" />
                  )}
                </div>

                {/* Target Sub-info Row: Sisa Target & Kebutuhan Harian */}
                <div className="flex items-center justify-between text-[10px] md:text-[11px] text-slate-400 font-semibold pt-0.5">
                  <span>
                    {sisaTarget !== null ? (
                      <>
                        Sisa: <strong className={sisaTarget === 0 ? 'text-emerald-600' : 'text-slate-700'}>{formatRp(sisaTarget)}</strong>
                        {remainingDays > 0 ? ` (${remainingDays} hari lagi)` : ' (Bulan Selesai)'}
                      </>
                    ) : (
                      <span className="italic">Set target untuk lihat sisa</span>
                    )}
                  </span>
                  <span>
                    {targetHarian !== null ? (
                      <>Kebutuhan: <strong className="text-slate-700">{formatRp(targetHarian)}/hari</strong></>
                    ) : null}
                  </span>
                </div>

              </div>

            </div>

          </div>
          </div>

          {/* Main Jimpitan List Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
            
            {/* Header of List Card: Title & Color Indicators Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Penarikan Harian
              </span>
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
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
            </div>

            <div className="p-4 md:p-6">
              {isLoading ? (
                /* Skeleton Loading - lebih profesional dari teks "Memuat..." */
                <div className="flex flex-col divide-y divide-slate-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-stretch py-4 pl-4 pr-1 gap-3 animate-pulse">
                      <div className="flex flex-col items-center justify-center w-[60px] shrink-0 border-r border-slate-100 pr-3 mr-3 gap-1.5">
                        <div className="h-6 w-8 rounded bg-slate-200" />
                        <div className="h-3 w-6 rounded bg-slate-100" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-2">
                        <div className="h-3 w-16 rounded bg-slate-100" />
                        <div className="h-4 w-32 rounded bg-slate-200" />
                      </div>
                      <div className="flex flex-col items-end justify-center gap-2 w-[100px]">
                        <div className="h-7 w-20 rounded-full bg-slate-200" />
                        <div className="h-4 w-12 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="text-3xl">ðŸ“‹</div>
                  <p className="text-slate-400 font-semibold text-sm">Tidak ada data setoran jimpitan.</p>
                  <p className="text-slate-300 text-xs">Coba ubah filter atau pilih bulan lain.</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex flex-col divide-y divide-slate-100 relative ml-2 md:ml-0 border-l border-slate-100 md:border-none">
                    {filteredRecords.map((item) => (
                      <div key={item.dateKey} ref={item.isToday ? todayRowRef : undefined}>
                        <JimpitanRowItem
                          item={item}
                          isSaving={!!savingDateKeys[item.dateKey]}
                          onSave={handleAutoSave}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                disabled={!!savingDateKeys[confirmData.dateKey]}
                className="flex-1 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingDateKeys[confirmData.dateKey] ? 'Menyimpan...' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

