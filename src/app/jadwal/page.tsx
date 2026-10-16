'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Plus, 
  Calendar, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  RotateCw,
  Edit,
  Flag,
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getIndonesianHoliday } from '@/lib/holidays';

interface RombonganMember {
  id: string;
  nama: string;
  noRumah?: string;
  noHp?: string | null;
  statusKeluarga?: string;
}

interface Rombongan {
  id: string;
  nama: string;
  ketuaId: string | null;
  hariPiket: number | null;
  ketuaNama: string;
  activeMemberCount: number;
  activeMembers: RombonganMember[];
}

interface WargaOption {
  id: string;
  nama: string;
  noRumah: string;
  statusKeluarga?: string;
  rombonganId?: string | null;
  rombongan?: { id: string; nama: string } | null;
}

interface Anggota {
  id: string;
  nama: string;
  noRumah: string;
  noHp: string | null;
  rombonganId: string | null;
  rombongan: { id: string; nama: string } | null;
  statusAktif: boolean;
}

interface Schedule {
  id: string;
  anggotaId: string;
  anggota: Anggota;
  tanggal: string;
  keterangan: string | null;
}

export default function JadwalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rombonganList, setRombonganList] = useState<Rombongan[]>([]);
  const [jimpitanList, setJimpitanList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic month and year filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const today = new Date();
    return String(today.getFullYear());
  });
  
  // Rombongan filtering inside the calendar view
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');

  // Generator loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Modal Kelola Rombongan & Anggota
  const [isRombonganModalOpen, setIsRombonganModalOpen] = useState(false);
  const [editingRombongan, setEditingRombongan] = useState<Rombongan | null>(null);
  const [romFormNama, setRomFormNama] = useState('');
  const [romFormHariPiket, setRomFormHariPiket] = useState<string>('none');
  const [romFormKetuaId, setRomFormKetuaId] = useState<string>('none');
  const [selectedNewAnggotaId, setSelectedNewAnggotaId] = useState<string>('');
  const [allWargaList, setAllWargaList] = useState<WargaOption[]>([]);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isSavingRombongan, setIsSavingRombongan] = useState(false);

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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch monthly schedules & jimpitan
      const resBulanan = await fetch(`/api/jimpitan/bulanan?month=${selectedMonth}&year=${selectedYear}`);
      const dataBulanan = await resBulanan.json();
      if (!isMountedRef.current) return;

      let currentSchedules = dataBulanan.error ? [] : (dataBulanan.schedules || []);
      if (!dataBulanan.error) {
        setJimpitanList(dataBulanan.jimpitan || []);
      }

      // 2. Fetch rombongan
      const resRom = await fetch('/api/rombongan');
      const dataRom = await resRom.json();
      if (!isMountedRef.current) return;

      const loadedRombongan: Rombongan[] = dataRom.error ? [] : dataRom;
      setRombonganList(loadedRombongan);

      // 3. Fetch all active citizens for group assignment dropdown
      const resAng = await fetch('/api/anggota');
      const dataAng = await resAng.json();
      if (isMountedRef.current && Array.isArray(dataAng)) {
        setAllWargaList(dataAng.filter((a: any) => a.statusAktif));
      }

      // Check if any rombongan has hariPiket assigned
      const hasAssignedGroups = loadedRombongan.some(r => r.hariPiket && r.hariPiket > 0);

      // If no schedules exist for this month yet, but rombongan hariPiket are set, auto-generate!
      if (currentSchedules.length === 0 && hasAssignedGroups) {
        const resGen = await fetch('/api/jadwal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            startYear: selectedYear,
            startMonth: selectedMonth
          })
        });
        const dataGen = await resGen.json();
        if (isMountedRef.current && dataGen.schedules && dataGen.schedules.length > 0) {
          const resBulanan2 = await fetch(`/api/jimpitan/bulanan?month=${selectedMonth}&year=${selectedYear}`);
          const dataBulanan2 = await resBulanan2.json();
          if (isMountedRef.current && !dataBulanan2.error) {
            currentSchedules = dataBulanan2.schedules || [];
          }
        }
      }

      if (isMountedRef.current) {
        setSchedules(currentSchedules);
      }
    } catch (e) {
      console.error(e);
      if (isMountedRef.current) triggerToast('Gagal memuat data jadwal', 'error');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, [selectedMonth, selectedYear]);

  // Modal Handlers: Open Edit / Add
  const handleOpenEditRombongan = (rom: Rombongan) => {
    setEditingRombongan(rom);
    setRomFormNama(rom.nama);
    setRomFormHariPiket(rom.hariPiket ? String(rom.hariPiket) : 'none');
    setRomFormKetuaId(rom.ketuaId || 'none');
    setSelectedNewAnggotaId('');
    setIsRombonganModalOpen(true);
  };

  const handleOpenAddRombongan = () => {
    setEditingRombongan(null);
    setRomFormNama('');
    setRomFormHariPiket('none');
    setRomFormKetuaId('none');
    setSelectedNewAnggotaId('');
    setIsRombonganModalOpen(true);
  };

  const handleAddMemberToRombongan = async () => {
    if (!editingRombongan || !selectedNewAnggotaId) return;
    setIsUpdatingMember(true);
    try {
      const res = await fetch('/api/rombongan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRombongan.id,
          addAnggotaId: selectedNewAnggotaId
        })
      });
      if (res.ok) {
        const updatedRom = await res.json();
        setEditingRombongan(updatedRom);
        setSelectedNewAnggotaId('');
        triggerToast('Anggota berhasil ditambahkan ke rombongan', 'success');
        fetchData();
      } else {
        triggerToast('Gagal menambahkan anggota ke rombongan', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleRemoveMemberFromRombongan = async (anggotaId: string) => {
    if (!editingRombongan) return;
    setIsUpdatingMember(true);
    try {
      const res = await fetch('/api/rombongan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRombongan.id,
          removeAnggotaId: anggotaId
        })
      });
      if (res.ok) {
        const updatedRom = await res.json();
        setEditingRombongan(updatedRom);
        if (romFormKetuaId === anggotaId) {
          setRomFormKetuaId('none');
        }
        triggerToast('Anggota dikeluarkan dari rombongan', 'success');
        fetchData();
      } else {
        triggerToast('Gagal mengeluarkan anggota dari rombongan', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleSaveRombongan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!romFormNama.trim()) {
      triggerToast('Nama rombongan wajib diisi', 'error');
      return;
    }
    setIsSavingRombongan(true);
    try {
      if (editingRombongan) {
        const res = await fetch('/api/rombongan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRombongan.id,
            nama: romFormNama.trim(),
            hariPiket: romFormHariPiket,
            ketuaId: romFormKetuaId
          })
        });
        if (res.ok) {
          triggerToast('Data rombongan berhasil diperbarui', 'success');
          setIsRombonganModalOpen(false);
          fetchData();
        } else {
          const errData = await res.json();
          triggerToast(errData.error || 'Gagal menyimpan rombongan', 'error');
        }
      } else {
        const res = await fetch('/api/rombongan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: romFormNama.trim()
          })
        });
        if (res.ok) {
          const newRom = await res.json();
          if (romFormHariPiket !== 'none' || romFormKetuaId !== 'none') {
            await fetch('/api/rombongan', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: newRom.id,
                nama: newRom.nama,
                hariPiket: romFormHariPiket,
                ketuaId: romFormKetuaId
              })
            });
          }
          triggerToast('Rombongan baru berhasil dibuat', 'success');
          setIsRombonganModalOpen(false);
          fetchData();
        } else {
          const errData = await res.json();
          triggerToast(errData.error || 'Gagal menambahkan rombongan', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      triggerToast('Terjadi kesalahan saat menyimpan data', 'error');
    } finally {
      setIsSavingRombongan(false);
    }
  };

  // Handle assigning Rombongan to weekday
  const handleAssignGroupToDay = async (dayVal: number, groupId: string) => {
    try {
      let successMsg = '';
      if (groupId === 'none') {
        const group = rombonganList.find(r => r.hariPiket === dayVal);
        if (!group) return;
        const res = await fetch('/api/rombongan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: group.id,
            nama: group.nama,
            hariPiket: 'none'
          })
        });
        const data = await res.json();
        if (data.error) {
          triggerToast(data.error, 'error');
          return;
        }
        successMsg = `Berhasil mengosongkan jadwal hari piket`;
      } else {
        const group = rombonganList.find(r => r.id === groupId);
        if (!group) return;
        const res = await fetch('/api/rombongan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: group.id,
            nama: group.nama,
            hariPiket: dayVal
          })
        });
        const data = await res.json();
        if (data.error) {
          triggerToast(data.error, 'error');
          return;
        }
        successMsg = `Berhasil menetapkan ${group.nama} untuk piket hari tersebut`;
      }

      // Auto-generate/update schedule for selected month immediately
      await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          startYear: selectedYear,
          startMonth: selectedMonth
        })
      });

      triggerToast(successMsg, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menetapkan hari piket', 'error');
    }
  };

  // Handle month prev/next increments
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

  // Generate schedule automatically
  const handleGenerateSchedule = async () => {
    if (!confirm(`Apakah Anda yakin ingin men-generate ulang jadwal untuk ${getMonthName(selectedMonth)} ${selectedYear}?\nSemua jadwal manual pada bulan ini akan diganti.`)) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          startYear: selectedYear,
          startMonth: selectedMonth
        }),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(data.message, 'success');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerToast('Gagal membuat jadwal otomatis', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getHariPiketLabel = (hariVal: number | null) => {
    if (!hariVal) return 'Belum Ditentukan';
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[hariVal - 1] || 'Belum Ditentukan';
  };

  // Helper to resolve month names in Indonesian
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
    if (!dateStr) return '';
    const pasaranNames = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const reference = new Date(Date.UTC(1945, 7, 17)); // Aug 17, 1945 = Legi
    const date = new Date(`${dateStr}T00:00:00Z`);
    const diffDays = Math.floor((date.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
    const index = ((diffDays % 5) + 5) % 5;
    return pasaranNames[index];
  };

  // Color matching index for Rombongan badges
  const getRombonganColor = (index: number) => {
    const colorStyles = [
      'bg-emerald-50 text-emerald-600 border-emerald-100', // R1
      'bg-sky-50 text-sky-600 border-sky-100', // R2
      'bg-purple-50 text-purple-600 border-purple-100', // R3
      'bg-orange-50 text-orange-600 border-orange-100', // R4
      'bg-pink-50 text-pink-600 border-pink-100', // R5
      'bg-indigo-50 text-indigo-600 border-indigo-100', // R6
      'bg-amber-50 text-amber-600 border-amber-100', // R7
    ];
    return colorStyles[index % colorStyles.length];
  };

  const getRombonganColorClass = (rombonganId: string | null) => {
    if (!rombonganId) return 'bg-slate-50 text-slate-400 border-slate-100';
    const index = rombonganList.findIndex(r => r.id === rombonganId);
    return getRombonganColor(index >= 0 ? index : 0);
  };

  // Calendar Math: Monday to Sunday grid generator
  const getCalendarDays = () => {
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10) - 1; // 0-indexed for JS Date
    
    // First day of target month
    const firstDayDate = new Date(y, m, 1);
    let firstDayOfWeek = firstDayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Monday offset adjustment:
    // Sun (0) -> offset 6
    // Mon (1) -> offset 0
    // Tue (2) -> offset 1
    // ...
    // Sat (6) -> offset 5
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Days in current month
    const numDaysCurrent = new Date(y, m + 1, 0).getDate();
    
    // Days in previous month
    const numDaysPrev = new Date(y, m, 0).getDate();
    
    const days = [];
    
    // Prepend padding days from previous month
    for (let i = mondayOffset - 1; i >= 0; i--) {
      days.push({
        dayNum: numDaysPrev - i,
        isCurrentMonth: false,
        dateKey: ''
      });
    }
    
    // Append actual month days
    for (let d = 1; d <= numDaysCurrent; d++) {
      const dateObj = new Date(Date.UTC(y, m, d));
      const dateKey = dateObj.toISOString().split('T')[0];
      days.push({
        dayNum: d,
        isCurrentMonth: true,
        dateKey
      });
    }
    
    // Append padding days from next month to complete standard 42 cell layout (6 weeks)
    const remainingCells = 42 - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      days.push({
        dayNum: d,
        isCurrentMonth: false,
        dateKey: ''
      });
    }
    
    return days;
  };

  const getScheduleForDate = (dateKey: string) => {
    if (!dateKey) return null;
    return schedules.find(s => {
      const sDate = s.tanggal.split('T')[0];
      return sDate === dateKey;
    });
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Jadwal" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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

          {/* Page Title */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Jadwal Jimpitan</h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Kelola jadwal petugas jimpitan per rombongan.</p>
          </div>

          {/* Month Navigator Control bar */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            
            {/* Prev/Next Month Trigger */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[120px] flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{getMonthName(selectedMonth)} {selectedYear}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Middle Filters / Triggers */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Filter Rombongan */}
              <select
                value={selectedRombonganFilter}
                onChange={(e) => setSelectedRombonganFilter(e.target.value)}
                className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-660 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Rombongan</option>
                {rombonganList.map((rom) => (
                  <option key={rom.id} value={rom.id}>{rom.nama}</option>
                ))}
              </select>

              {/* Kelola Rombongan Link */}
              <Link 
                href="/anggota?tab=rombongan"
                className="px-4 py-2.5 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-600 flex items-center gap-1.5"
                title="Kelola data rombongan di menu kependudukan"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Kelola Rombongan</span>
              </Link>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Jadwal</span>
              </button>

            </div>
          </div>

          {/* Info Alert Box */}
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-center gap-3 text-left">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-[#1e40af]">
              Jadwal dibuat berdasarkan rombongan. Setiap hari diisi oleh 1 rombongan secara bergilir.
            </span>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6 text-left">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="min-w-[750px]">
            
            {/* Days of week header dropdown selections */}
            <div className="grid grid-cols-7 gap-4 mb-6 text-center border-b border-slate-100 pb-4">
              {[
                { label: 'Senin', val: 1 },
                { label: 'Selasa', val: 2 },
                { label: 'Rabu', val: 3 },
                { label: 'Kamis', val: 4 },
                { label: 'Jumat', val: 5 },
                { label: 'Sabtu', val: 6 },
                { label: 'Minggu', val: 7 }
              ].map((day) => {
                const assigned = rombonganList.find(r => r.hariPiket === day.val);
                return (
                  <div key={day.val} className="flex flex-col items-center gap-1.5 py-1">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">{day.label}</span>
                    <select
                      value={assigned?.id || 'none'}
                      onChange={(e) => handleAssignGroupToDay(day.val, e.target.value)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 px-2 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer w-full text-center transition-all"
                    >
                      <option value="none">Kosong</option>
                      {rombonganList.map((rom) => (
                        <option key={rom.id} value={rom.id}>{rom.nama}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-4">
              {calendarDays.map((cell, idx) => {
                const sched = getScheduleForDate(cell.dateKey) || null;
                const todayStr = getTodayStr();
                const isToday = cell.dateKey === todayStr;
                
                // Fallback group assignment for this day of week if sched DB record is null
                let fallbackGroup: Rombongan | undefined;
                if (cell.isCurrentMonth && cell.dateKey) {
                  const dParts = cell.dateKey.split('-').map(Number);
                  const dObj = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2]));
                  const dayOfWeek = dObj.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
                  const weekdayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
                  fallbackGroup = rombonganList.find(r => r.hariPiket === weekdayNum);
                }

                // Group filtering
                const effectiveGroup = sched ? sched.anggota?.rombonganId : (fallbackGroup?.id || null);
                const isFilteredOut = 
                  selectedRombonganFilter !== 'all' && 
                  effectiveGroup !== selectedRombonganFilter;

                // Jimpitan status check
                const jimp = jimpitanList.find(j => j.tanggal.split('T')[0] === cell.dateKey);
                const hasJimpitan = jimp && jimp.nominal > 0;
                const holidayInfo = cell.isCurrentMonth ? getIndonesianHoliday(cell.dateKey) : null;
                const isRedDate = holidayInfo?.isRedDate;

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] border rounded-3xl p-3 flex flex-col justify-between transition-all text-left relative group ${
                      !cell.isCurrentMonth 
                        ? 'bg-slate-50/40 text-slate-300 border-slate-100 pointer-events-none' 
                        : isRedDate
                          ? 'bg-red-50/35 hover:bg-red-50/60 border-red-200/60 shadow-2xs'
                          : hasJimpitan
                            ? 'bg-emerald-50/60 border-emerald-500/25 hover:bg-emerald-50/80 shadow-xs'
                            : isToday
                              ? 'bg-[var(--brand-light)]/40 border-[var(--brand-primary)]/40 shadow-inner'
                              : 'bg-white hover:bg-slate-50/40 border-slate-100 hover:border-slate-200'
                    } ${isFilteredOut ? 'opacity-30' : ''}`}
                  >
                    
                    {/* Top row of cell */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-baseline gap-1.5 text-left">
                        <span className={`text-xs font-extrabold leading-none ${
                          !cell.isCurrentMonth 
                            ? 'text-slate-350' 
                            : isRedDate
                              ? 'text-red-600'
                              : isToday 
                                ? 'text-[var(--brand-primary)]' 
                                : 'text-slate-700'
                        }`}>
                          {cell.dayNum}
                        </span>
                        {cell.isCurrentMonth && cell.dateKey && (
                          <span className={`text-[9px] font-semibold ${
                            isRedDate ? 'text-red-500 font-bold' : isToday ? 'text-[var(--brand-primary)]' : 'text-slate-400'
                          }`}>
                            {getPasaran(cell.dateKey)}
                          </span>
                        )}
                      </div>

                      {/* Status Check / Today Badge & Add Button */}
                      {cell.isCurrentMonth && (
                        <div className="flex items-center gap-1">
                          {hasJimpitan && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {isToday && (
                            <span className="text-[7px] font-bold uppercase tracking-wider bg-[var(--brand-primary)] text-white px-1.5 py-0.5 rounded">
                              Hari Ini
                            </span>
                          )}
                          <Link
                            href="/agenda"
                            className="w-5 h-5 rounded-md bg-slate-100/80 hover:bg-[var(--brand-primary)] hover:text-white text-slate-500 flex items-center justify-center transition-all opacity-70 group-hover:opacity-100"
                            title="Tambah Agenda pada tanggal ini"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* National Holiday Badge if present */}
                    {holidayInfo && holidayInfo.name !== 'Hari Minggu' && (
                      <div className="mt-1">
                        <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md border flex items-center gap-1 truncate leading-tight ${
                          holidayInfo.type === 'national' 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`} title={holidayInfo.name}>
                          <Flag className={`w-2.5 h-2.5 shrink-0 ${holidayInfo.type === 'national' ? 'text-red-600' : 'text-amber-600'}`} />
                          <span className="truncate">{holidayInfo.name}</span>
                        </span>
                      </div>
                    )}

                    {/* Middle scheduler contents */}
                    {cell.isCurrentMonth ? (
                      sched ? (() => {
                        const groupOfMember = rombonganList.find(r => r.id === sched.anggota?.rombonganId);
                        const ketuaNama = groupOfMember?.ketuaNama || 'Belum Ditentukan';
                        
                        return (
                          <div className="space-y-1.5 mt-3 flex-1 flex flex-col justify-end">
                            <div className="flex">
                              <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md border ${getRombonganColorClass(sched.anggota?.rombonganId)}`}>
                                {sched.anggota?.rombongan?.nama || 'Rombongan'}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-700 line-clamp-1">
                              {sched.anggota?.nama}
                            </div>
                            <div className="text-[9px] text-slate-400 font-semibold leading-none">
                              Ketua: {ketuaNama}
                            </div>
                          </div>
                        );
                      })() : fallbackGroup ? (
                        <div className="space-y-1.5 mt-3 flex-1 flex flex-col justify-end">
                          <div className="flex">
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md border ${getRombonganColorClass(fallbackGroup.id)}`}>
                              {fallbackGroup.nama}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 line-clamp-1">
                            {fallbackGroup.ketuaNama || 'Petugas Rombongan'}
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold leading-none">
                            Ketua: {fallbackGroup.ketuaNama || 'Belum Ditentukan'}
                          </div>
                        </div>
                      ) : null
                    ) : null}

                  </div>
                );
              })}
            </div>

          </div>
          </div>
          </div>

          {/* Section: Daftar Rombongan (Rombongan details list) */}
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-slate-850 tracking-tight">Daftar Rombongan</h3>
              
              <button 
                type="button"
                onClick={handleOpenAddRombongan}
                className="px-4 py-2 border border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-2xl hover:bg-[var(--brand-light)] transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rombongan</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {rombonganList.map((rom, index) => {
                return (
                  <div key={rom.id} className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-sm flex flex-col justify-between min-h-[300px]">
                    
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getRombonganColor(index)}`}>
                          {rom.nama}
                        </span>
                        <span className="text-[10px] bg-slate-50 border border-slate-150 text-slate-500 font-semibold px-2 py-0.5 rounded-md">
                          {rom.activeMemberCount} Anggota
                        </span>
                      </div>
                      
                      <div className="pt-2 flex items-center justify-between gap-2 text-left">
                        <div>
                          <span className="text-[9px] text-slate-400 font-medium block">Ketua Rombongan</span>
                          <span className="text-xs font-bold text-slate-750">{rom.ketuaNama}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-medium block">Hari Piket</span>
                          <span className="text-xs font-bold text-[var(--brand-primary)]">{getHariPiketLabel(rom.hariPiket)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member List */}
                    <div className="flex-1 mt-4 overflow-y-auto max-h-[140px] border-t border-slate-50 pt-3">
                      {rom.activeMembers.length === 0 ? (
                        <div className="text-[11px] text-slate-400 font-medium py-4">Belum ada anggota aktif.</div>
                      ) : (
                        <ol className="space-y-1.5">
                          {rom.activeMembers.map((member, idx) => (
                            <li key={member.id} className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                              <span className="text-slate-400 font-medium">{idx + 1}.</span>
                              <span className="line-clamp-1">{member.nama}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    {/* Action buttons: Atur Anggota & Lihat KK */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3 mt-3">
                      <button 
                        type="button"
                        onClick={() => handleOpenEditRombongan(rom)}
                        className="w-full py-2 bg-[var(--brand-light)] hover:bg-orange-100 text-[var(--brand-primary)] font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Atur jadwal, ketua, dan anggota rombongan ini"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Atur Anggota</span>
                      </button>
                      <Link 
                        href={`/anggota?tab=kk&rombonganId=${rom.id}`}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-colors text-center"
                        title="Buka daftar Kartu Keluarga rombongan ini"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lihat KK</span>
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Yellow Tips Box & Generate Ulang Jadwal Button */}
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-6 flex items-center justify-between gap-6 text-left">
            <div className="flex gap-3 items-start max-w-3xl">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Tips</h4>
                <p className="text-xs font-medium text-amber-750 leading-relaxed">
                  Untuk mengubah jadwal, ubah dulu data anggota di setiap rombongan. Kemudian gunakan fitur &quot;Generate Ulang Jadwal&quot; jika ingin merotasi ulang.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
              className="px-5 py-3 border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-light)] font-bold rounded-2xl transition-all text-xs cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Men-generate...' : 'Generate Ulang Jadwal'}</span>
            </button>
          </div>

          {/* Footer print notice */}
          <div className="text-center text-[10px] text-slate-400 font-medium">
            Jadwal dapat dicetak dan dibagikan ke petugas jimpitan.
          </div>

        </main>

        {/* Modal Kelola Rombongan & Anggota */}
        {isRombonganModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {editingRombongan ? `Kelola ${editingRombongan.nama}` : 'Tambah Rombongan Baru'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Atur nama rombongan, hari piket, ketua, dan anggota ronda
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsRombonganModalOpen(false)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 text-left flex-1">
                
                {/* Shortcut Banner to Data Warga / KK */}
                {editingRombongan && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-medium">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Ingin melihat detail berkas Kartu Keluarga rombongan ini?</span>
                    </div>
                    <Link 
                      href={`/anggota?tab=kk&rombonganId=${editingRombongan.id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] shrink-0 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Buka Data KK</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Form Metadata: Nama, Hari Piket, Ketua */}
                <form id="rom-meta-form" onSubmit={handleSaveRombongan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Nama Rombongan</label>
                      <input 
                        type="text"
                        value={romFormNama}
                        onChange={(e) => setRomFormNama(e.target.value)}
                        placeholder="Contoh: ROMBONGAN 1 - MLM SELASA"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Hari Piket Ronda</label>
                      <select
                        value={romFormHariPiket}
                        onChange={(e) => setRomFormHariPiket(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer"
                      >
                        <option value="none">Belum Ditentukan</option>
                        <option value="1">Senin</option>
                        <option value="2">Selasa</option>
                        <option value="3">Rabu</option>
                        <option value="4">Kamis</option>
                        <option value="5">Jumat</option>
                        <option value="6">Sabtu</option>
                        <option value="7">Minggu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Ketua Rombongan</label>
                      <select
                        value={romFormKetuaId}
                        onChange={(e) => setRomFormKetuaId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer"
                      >
                        <option value="none">Belum Ditentukan</option>
                        {(editingRombongan?.activeMembers || []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama} {m.noRumah ? `(No. ${m.noRumah})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>

                {/* Members Management (Only if editing an existing group) */}
                {editingRombongan ? (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Daftar Anggota Ronda ({editingRombongan.activeMembers.length})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Warga yang dijadwalkan piket jimpitan & ronda pada rombongan ini
                        </p>
                      </div>
                    </div>

                    {/* Add Member Row */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row gap-2 items-center">
                      <select 
                        value={selectedNewAnggotaId}
                        onChange={(e) => setSelectedNewAnggotaId(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih Warga / Kepala Keluarga --</option>
                        {allWargaList
                          .filter(w => !editingRombongan.activeMembers.some(m => m.id === w.id))
                          .map(w => {
                            const statusRom = w.rombongan?.nama 
                              ? `(Saat ini: ${w.rombongan.nama})` 
                              : '(Belum ada rombongan)';
                            return (
                              <option key={w.id} value={w.id}>
                                {w.nama} - No. {w.noRumah || '-'} {statusRom}
                              </option>
                            );
                          })}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedNewAnggotaId || isUpdatingMember}
                        onClick={handleAddMemberToRombongan}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isUpdatingMember ? 'Menambahkan...' : 'Tambahkan'}</span>
                      </button>
                    </div>

                    {/* Current Member List */}
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {editingRombongan.activeMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                          Belum ada anggota di rombongan ini. Pilih warga di atas untuk menambahkan.
                        </div>
                      ) : (
                        editingRombongan.activeMembers.map((m, idx) => {
                          const isLeader = editingRombongan.ketuaId === m.id;
                          return (
                            <div 
                              key={m.id}
                              className="p-2.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 text-center text-slate-400 font-bold text-[11px]">{idx + 1}.</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800 truncate">{m.nama}</span>
                                    {isLeader && (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 font-bold text-[9px] rounded-md border border-amber-200">
                                        Ketua
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    Rumah: {m.noRumah || '-'} {m.statusKeluarga ? `• ${m.statusKeluarga.replace('_', ' ')}` : ''}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isUpdatingMember}
                                onClick={() => handleRemoveMemberFromRombongan(m.id)}
                                className="px-2.5 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                                title="Keluarkan dari rombongan ini"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Keluarkan</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-xs text-amber-800">
                    <p className="font-semibold">Catatan:</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Setelah rombongan baru disimpan, Anda dapat langsung menambahkan anggota warga ke dalamnya.
                    </p>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsRombonganModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  form="rom-meta-form"
                  disabled={isSavingRombongan}
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSavingRombongan ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>
    </div>
  );
}
