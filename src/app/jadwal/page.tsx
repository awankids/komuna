'use client';

import React, { useState, useEffect } from 'react';
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
  Edit
} from 'lucide-react';
import Link from 'next/link';

interface Rombongan {
  id: string;
  nama: string;
  ketuaId: string | null;
  hariPiket: number | null;
  ketuaNama: string;
  activeMemberCount: number;
  activeMembers: { id: string; nama: string }[];
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

  // Month and year filters
  const [selectedMonth, setSelectedMonth] = useState('07'); // Default July
  const [selectedYear, setSelectedYear] = useState('2026'); // Default 2026
  
  // Rombongan filtering inside the calendar view
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');

  // Generator loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Simulated Today's Date: 16 Juli 2026
  const SIMULATED_TODAY_STR = '2026-07-16';

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch monthly schedules & jimpitan
      const resBulanan = await fetch(`/api/jimpitan/bulanan?month=${selectedMonth}&year=${selectedYear}`);
      const dataBulanan = await resBulanan.json();
      if (!dataBulanan.error) {
        setSchedules(dataBulanan.schedules || []);
        setJimpitanList(dataBulanan.jimpitan || []);
      }

      // 2. Fetch rombongan
      const resRom = await fetch('/api/rombongan');
      const dataRom = await resRom.json();
      if (!dataRom.error) {
        setRombonganList(dataRom);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Gagal memuat data jadwal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Handle assigning Rombongan to weekday
  const handleAssignGroupToDay = async (dayVal: number, groupId: string) => {
    try {
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
        if (data.error) triggerToast(data.error, 'error');
        else {
          triggerToast(`Berhasil mengosongkan jadwal hari piket`, 'success');
          fetchData();
        }
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
        if (data.error) triggerToast(data.error, 'error');
        else {
          triggerToast(`Berhasil menetapkan ${group.nama} untuk piket hari tersebut`, 'success');
          fetchData();
        }
      }
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

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto pb-24 md:pb-16 font-sans">
          
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
              
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[120px] text-center">
                📅 {getMonthName(selectedMonth)} {selectedYear}
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
                href="/anggota"
                className="px-4 py-2.5 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-600 flex items-center gap-1.5"
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
                const isToday = cell.dateKey === SIMULATED_TODAY_STR;
                
                // Group filtering
                const isFilteredOut = 
                  selectedRombonganFilter !== 'all' && 
                  sched && 
                  sched.anggota?.rombonganId !== selectedRombonganFilter;

                // Jimpitan status check
                const jimp = jimpitanList.find(j => j.tanggal.split('T')[0] === cell.dateKey);
                const hasJimpitan = jimp && jimp.nominal > 0;

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] border rounded-3xl p-3 flex flex-col justify-between transition-all text-left relative group ${
                      !cell.isCurrentMonth 
                        ? 'bg-slate-50/40 text-slate-300 border-slate-100 pointer-events-none' 
                        : hasJimpitan
                          ? 'bg-emerald-50/60 border-emerald-500/25 hover:bg-emerald-50/80 shadow-xs'
                          : isToday
                            ? 'bg-[var(--brand-light)]/40 border-[var(--brand-primary)]/40 shadow-inner'
                            : 'bg-white hover:bg-slate-50/40 border-slate-100 hover:border-slate-200'
                    } ${isFilteredOut ? 'opacity-30' : ''}`}
                  >
                    
                    {/* Top row of cell */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        !cell.isCurrentMonth 
                          ? 'text-slate-350' 
                          : isToday 
                            ? 'text-[var(--brand-primary)]' 
                            : 'text-slate-550'
                      }`}>
                        {cell.dayNum}
                      </span>

                      {/* Status Check / Today Badge */}
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
                        </div>
                      )}
                    </div>

                    {/* Middle scheduler contents */}
                    {cell.isCurrentMonth && sched ? (() => {
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
                    })() : null}

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
              
              <Link 
                href="/anggota"
                className="px-4 py-2 border border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-2xl hover:bg-[var(--brand-light)] transition-all flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rombongan</span>
              </Link>
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

                    {/* Edit button */}
                    <div className="border-t border-slate-50 pt-3 mt-3">
                      <Link 
                        href="/anggota"
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Rombongan</span>
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
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>
    </div>
  );
}
