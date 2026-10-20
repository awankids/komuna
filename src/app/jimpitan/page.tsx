'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import JimpitanInputRow from '@/components/JimpitanInputRow';
import { JimpitanFilterBar } from '@/components/jimpitan/JimpitanFilterBar';
import { JimpitanSummaryCard } from '@/components/jimpitan/JimpitanSummaryCard';
import { CheckCircle2, AlertCircle, Info, ChevronRight } from 'lucide-react';

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

const getMonthName = (monthStr: string): string => {
  const currentMonthKey = String(new Date().getMonth() + 1).padStart(2, '0');
  return MONTH_NAMES[monthStr] || MONTH_NAMES[currentMonthKey] || 'Bulan';
};

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

const sanitizeCSV = (val: string | number): string => {
  const str = String(val ?? '');
  if (!str) return '""';
  let cleaned = str;
  if (cleaned.startsWith('=') || cleaned.startsWith('+') || cleaned.startsWith('-') || cleaned.startsWith('@')) {
    cleaned = `'${cleaned}`;
  }
  return `"${cleaned.replace(/"/g, '""')}"`;
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
  diisiOleh: string | null;
  diisiPada: string | null;
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
  diisiOleh?: string;
  diisiPada?: string;
}

// --- MEMOIZED ROW COMPONENT ---
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

      {/* Middle: Officer Info & Audit info */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        {item.petugasName !== 'Tanpa Petugas' ? (
          <>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Ketua Rombongan</span>
            <span className="font-bold text-slate-800 text-xs md:text-sm mt-0.5 truncate">{item.petugasName}</span>
            {item.petugasNoRumah && (
              <span className="text-[10px] md:text-[11px] text-slate-400 font-medium mt-0.5">{item.petugasNoRumah}</span>
            )}
            {item.rombonganNama && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`text-[8px] md:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${item.rombonganColorClass}`}>
                  {item.rombonganNama}
                </span>
                {item.diisiOleh && item.nominal > 0 && (
                  <span className="text-[9px] text-slate-400 font-medium">
                    Diinput: <strong className="text-slate-600 font-semibold">{item.diisiOleh}</strong>
                  </span>
                )}
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
          <span 
            title={item.diisiOleh ? `Diinput oleh: ${item.diisiOleh}${item.diisiPada ? ` (${item.diisiPada})` : ''}` : undefined}
            className={`text-[8px] md:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide ${
              item.status === 'sudah_isi' 
                ? 'bg-emerald-50 text-emerald-600' 
                : item.status === 'belum_isi' 
                  ? 'bg-red-50 text-red-500' 
                  : 'bg-slate-50 text-slate-400'
            }`}
          >
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

  // Per-date saving state
  const [savingDateKeys, setSavingDateKeys] = useState<Record<string, boolean>>({});

  // Ref untuk scroll-to-today otomatis setelah data dimuat
  const todayRowRef = useRef<HTMLDivElement>(null);

  // Target State: null jika belum diatur di database
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

  // 1. Load global target ONCE on initial mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
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

  // 2. Fetch monthly data & rombongan in parallel with AbortController
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

          const dayOfWeek = loopDate.getUTCDay();
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
            diisiOleh: jimp?.diisiOleh || null,
            diisiPada: jimp?.diisiPada ? new Date(jimp.diisiPada).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
            status,
            isFuture,
            isToday
          });
        }

        setDayRecords(records);
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error(err);
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
  }, [selectedMonth, selectedYear, triggerToast, rombonganList]);

  // Handle month prev/next navigation
  const handlePrevMonth = useCallback(() => {
    let m = parseInt(selectedMonth, 10) - 1;
    let y = parseInt(selectedYear, 10);
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  }, [selectedMonth, selectedYear]);

  const handleNextMonth = useCallback(() => {
    let m = parseInt(selectedMonth, 10) + 1;
    let y = parseInt(selectedYear, 10);
    if (m === 13) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  }, [selectedMonth, selectedYear]);

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
            return { 
              ...r, 
              nominal, 
              status: newStatus,
              diisiOleh: data.jimpitan?.diisiOleh || r.diisiOleh || 'Admin'
            };
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

  // Dynamic summary stats (useMemo)
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

  // Frontend filters
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

  // Atomic PATCH target save
  const handleSaveTarget = useCallback(async (val: number) => {
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
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetJimpitan: val })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast('Target bulanan berhasil diperbarui', 'success');
      }
    } catch (e) {
      console.error('Gagal menyimpan target jimpitan', e);
      triggerToast('Gagal menyimpan target bulanan', 'error');
    } finally {
      setIsSavingTarget(false);
    }
  }, [triggerToast]);

  // Real Excel (CSV) Exporter with full injection protection
  const handleExportExcel = useCallback(() => {
    let csvContent = '\uFEFFsep=;\r\n';
    
    // Title & Metadata
    csvContent += `LAPORAN JIMPITAN BULANAN - ${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}\r\n`;
    csvContent += `Total Terkumpul;${totalTerkumpul}\r\n`;
    csvContent += `Target Bulanan;${targetBulanIni ?? '-'}\r\n`;
    csvContent += `Sisa Target;${sisaTarget ?? '-'}\r\n`;
    csvContent += `Hari Terisi;${filledCount} dari ${totalDays} hari (${rasioPengisian}%)\r\n\r\n`;

    // Headers
    csvContent += 'Tanggal;Hari;Pasaran;Petugas Piket;Rombongan;Nominal (Rp);Status;Diinput Oleh\r\n';
    
    // Rows
    dayRecords.forEach(r => {
      const statusText = r.nominal > 0 ? 'Sudah Diisi' : (r.isFuture ? 'Belum Tiba' : 'Belum Diisi');
      csvContent += `${sanitizeCSV(r.dayNum)};${sanitizeCSV(r.dayLabel)};${sanitizeCSV(r.pasaran)};${sanitizeCSV(r.petugasName)};${sanitizeCSV(r.rombonganNama || '-')};${r.nominal};${sanitizeCSV(statusText)};${sanitizeCSV(r.diisiOleh || '-')}\r\n`;
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
  }, [dayRecords, selectedMonth, selectedYear, totalTerkumpul, targetBulanIni, sisaTarget, filledCount, totalDays, rasioPengisian, triggerToast]);

  // Scroll-to-today
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

          {/* Filters and Navigation Bar (Modular Component) */}
          <JimpitanFilterBar
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectMonth={setSelectedMonth}
            onSelectYear={setSelectedYear}
            selectedRombonganFilter={selectedRombonganFilter}
            onSelectRombonganFilter={setSelectedRombonganFilter}
            selectedStatusFilter={selectedStatusFilter}
            onSelectStatusFilter={setSelectedStatusFilter}
            rombonganList={rombonganList}
          />

          {/* Sticky Gojek-Style Jimpitan Summary Card (Modular Component) */}
          <JimpitanSummaryCard
            monthName={getMonthName(selectedMonth)}
            selectedYear={selectedYear}
            totalTerkumpul={totalTerkumpul}
            avgTerkumpul={avgTerkumpul}
            filledCount={filledCount}
            totalDays={totalDays}
            rasioPengisian={rasioPengisian}
            targetBulanIni={targetBulanIni}
            sisaTarget={sisaTarget}
            targetHarian={targetHarian}
            persentaseTarget={persentaseTarget}
            remainingDays={remainingDays}
            isEditingTarget={isEditingTarget}
            isSavingTarget={isSavingTarget}
            targetError={targetError}
            targetInputRef={targetInputRef}
            onStartEditTarget={() => {
              setTargetError('');
              setIsEditingTarget(true);
            }}
            onCancelEditTarget={() => {
              setIsEditingTarget(false);
              setTargetError('');
            }}
            onSaveTarget={handleSaveTarget}
            onExportExcel={handleExportExcel}
            formatRp={formatRp}
          />

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
                /* Skeleton Loading */
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
                  <div className="text-3xl">📋</div>
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
