'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit, 
  Trash2, 
  Tag, 
  FileText,
  Filter,
  Check,
  Ban
} from 'lucide-react';

interface AgendaItem {
  id: string;
  judul: string;
  kategori: string; // kerjabakti, rapat, sosial, posyandu, umum
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  lokasi: string | null;
  keterangan: string | null;
  status: string; // terjadwal, selesai, dibatalkan
  createdAt: string;
}

export default function AgendaPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [agendaList, setAgendaList] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState('08');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Category Filter inside calendar
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modal States
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State (For Add / Edit)
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState('umum');
  const [formTanggal, setFormTanggal] = useState('');
  const [formWaktuMulai, setFormWaktuMulai] = useState('09:00');
  const [formWaktuSelesai, setFormWaktuSelesai] = useState('11:00');
  const [formLokasi, setFormLokasi] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formStatus, setFormStatus] = useState('terjadwal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tz = localStorage.getItem('komuna-timezone') || 'Asia/Jakarta';
      const now = new Date();
      const formatterM = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: '2-digit' });
      const formatterY = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' });
      setSelectedMonth(formatterM.format(now));
      setSelectedYear(formatterY.format(now));
    }
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch Agendas for the selected month
  const fetchAgendaData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agenda?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        setAgendaList(data);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Gagal memuat data agenda', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendaData();
  }, [selectedMonth, selectedYear]);

  // Month navigation helpers
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

  const getMonthName = (monthStr: string) => {
    const names: { [key: string]: string } = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return names[monthStr] || 'Agustus';
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

  // Category Colors
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'kerjabakti':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rapat':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'sosial':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'posyandu':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'kerjabakti': return 'Kerja Bakti';
      case 'rapat': return 'Rapat RT';
      case 'sosial': return 'Arisan / Sosial';
      case 'posyandu': return 'Posyandu';
      default: return 'Umum';
    }
  };

  // Calendar Math
  const getCalendarDays = () => {
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10) - 1;
    
    const firstDayDate = new Date(y, m, 1);
    let firstDayOfWeek = firstDayDate.getDay();
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const numDaysCurrent = new Date(y, m + 1, 0).getDate();
    const numDaysPrev = new Date(y, m, 0).getDate();
    
    const days = [];
    
    // Padding previous month
    for (let i = mondayOffset - 1; i >= 0; i--) {
      days.push({
        dayNum: numDaysPrev - i,
        isCurrentMonth: false,
        dateKey: ''
      });
    }
    
    // Current month days
    for (let d = 1; d <= numDaysCurrent; d++) {
      const dateObj = new Date(Date.UTC(y, m, d));
      const dateKey = dateObj.toISOString().split('T')[0];
      days.push({
        dayNum: d,
        isCurrentMonth: true,
        dateKey
      });
    }
    
    // Padding next month to fill 42 cells
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

  const calendarDays = getCalendarDays();

  // Get Agendas for a specific date
  const getAgendasForDate = (dateKey: string) => {
    if (!dateKey) return [];
    return agendaList.filter(a => {
      const aDate = a.tanggal.split('T')[0];
      if (aDate !== dateKey) return false;
      if (selectedCategoryFilter !== 'all' && a.kategori !== selectedCategoryFilter) return false;
      return true;
    });
  };

  // Open Date Detail Modal
  const handleOpenDateModal = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setIsModalOpen(true);
    setIsFormOpen(false);
    resetForm(dateKey);
  };

  // Reset Form
  const resetForm = (dateKey?: string) => {
    setEditingAgendaId(null);
    setFormJudul('');
    setFormKategori('umum');
    setFormTanggal(dateKey || selectedDateKey || getTodayStr());
    setFormWaktuMulai('09:00');
    setFormWaktuSelesai('11:00');
    setFormLokasi('');
    setFormKeterangan('');
    setFormStatus('terjadwal');
  };

  // Open Edit Mode
  const handleEditClick = (agenda: AgendaItem) => {
    setEditingAgendaId(agenda.id);
    setFormJudul(agenda.judul);
    setFormKategori(agenda.kategori);
    setFormTanggal(agenda.tanggal.split('T')[0]);
    setFormWaktuMulai(agenda.waktuMulai || '09:00');
    setFormWaktuSelesai(agenda.waktuSelesai || '11:00');
    setFormLokasi(agenda.lokasi || '');
    setFormKeterangan(agenda.keterangan || '');
    setFormStatus(agenda.status || 'terjadwal');
    setIsFormOpen(true);
  };

  // Submit Agenda (Create / Update)
  const handleSubmitAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formTanggal) {
      triggerToast('Judul dan tanggal wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingAgendaId || undefined,
        judul: formJudul,
        kategori: formKategori,
        tanggal: formTanggal,
        waktuMulai: formWaktuMulai,
        waktuSelesai: formWaktuSelesai,
        lokasi: formLokasi,
        keterangan: formKeterangan,
        status: formStatus,
      };

      const res = await fetch('/api/agenda', {
        method: editingAgendaId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(
          editingAgendaId ? 'Agenda berhasil diperbarui' : 'Agenda baru berhasil ditambahkan',
          'success'
        );
        setIsFormOpen(false);
        resetForm(selectedDateKey || undefined);
        fetchAgendaData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menyimpan agenda', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Agenda
  const handleDeleteAgenda = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda ini?')) return;
    try {
      const res = await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast('Agenda berhasil dihapus', 'success');
        fetchAgendaData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menghapus agenda', 'error');
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (agenda: AgendaItem, newStatus: string) => {
    try {
      const res = await fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agenda.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(`Status agenda diubah ke ${newStatus}`, 'success');
        fetchAgendaData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengubah status', 'error');
    }
  };

  // Formatted date string for modal header
  const getFormattedDateString = (dateKey: string | null) => {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Agenda" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
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

          {/* Title Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Agenda Kegiatan RT</h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium">Jadwal acara, rapat pengurus, posyandu, dan kerja bakti warga.</p>
            </div>

            <button
              onClick={() => {
                setSelectedDateKey(getTodayStr());
                setIsModalOpen(true);
                setIsFormOpen(true);
                resetForm(getTodayStr());
              }}
              className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda</span>
            </button>
          </div>

          {/* Month Navigator & Category Filter Control Bar */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
            
            {/* Prev/Next Month Trigger */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 min-w-[140px] text-center">
                📅 {getMonthName(selectedMonth)} {selectedYear}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Category */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="kerjabakti">Kerja Bakti</option>
                <option value="rapat">Rapat RT</option>
                <option value="sosial">Arisan / Sosial</option>
                <option value="posyandu">Posyandu</option>
                <option value="umum">Umum</option>
              </select>
            </div>

          </div>

          {/* Calendar Grid Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6 text-left">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="min-w-[750px]">
            
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-4 mb-4 text-center border-b border-slate-100 pb-3">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
                    <span key={d} className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 gap-3">
                  {calendarDays.map((cell, idx) => {
                    const cellAgendas = getAgendasForDate(cell.dateKey);
                    const todayStr = getTodayStr();
                    const isToday = cell.dateKey === todayStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth) handleOpenDateModal(cell.dateKey);
                        }}
                        className={`min-h-[115px] border rounded-2xl p-2.5 flex flex-col justify-between transition-all text-left relative cursor-pointer group ${
                          !cell.isCurrentMonth 
                            ? 'bg-slate-50/40 text-slate-300 border-slate-100 pointer-events-none' 
                            : isToday
                              ? 'bg-[var(--brand-light)]/30 border-[var(--brand-primary)]/40 hover:bg-[var(--brand-light)]/50 shadow-xs'
                              : cellAgendas.length > 0
                                ? 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                                : 'bg-white hover:bg-slate-50/60 border-slate-100'
                        }`}
                      >
                        {/* Day Header */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-baseline gap-1.5 text-left">
                            <span className={`text-xs font-bold leading-none ${
                              !cell.isCurrentMonth 
                                ? 'text-slate-350' 
                                : isToday 
                                  ? 'text-[var(--brand-primary)]' 
                                  : 'text-slate-700'
                            }`}>
                              {cell.dayNum}
                            </span>
                            {cell.isCurrentMonth && cell.dateKey && (
                              <span className={`text-[9px] font-semibold ${
                                isToday ? 'text-[var(--brand-primary)]' : 'text-slate-400'
                              }`}>
                                {getPasaran(cell.dateKey)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isToday && cell.isCurrentMonth && (
                              <span className="text-[7px] font-bold uppercase tracking-wider bg-[var(--brand-primary)] text-white px-1.5 py-0.5 rounded">
                                Hari Ini
                              </span>
                            )}
                            {cell.isCurrentMonth && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDateKey(cell.dateKey);
                                  setIsModalOpen(true);
                                  setIsFormOpen(true);
                                  resetForm(cell.dateKey);
                                }}
                                className="w-5 h-5 rounded-md bg-slate-100/80 hover:bg-[var(--brand-primary)] hover:text-white text-slate-500 flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                                title="Tambah Agenda pada tanggal ini"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Agendas Preview List */}
                        {cell.isCurrentMonth && (
                          <div className="space-y-1.5 mt-2 flex-1 flex flex-col justify-start overflow-hidden">
                            {cellAgendas.slice(0, 3).map((item) => (
                              <div 
                                key={item.id}
                                className={`text-[9.5px] font-bold p-1.5 rounded-xl border text-left leading-tight transition-transform group-hover:scale-[1.01] ${getCategoryBadgeClass(item.kategori)} ${
                                  item.status === 'selesai' ? 'line-through opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate">{item.judul}</span>
                                  {item.waktuMulai && (
                                    <span className="text-[8.5px] opacity-80 shrink-0">{item.waktuMulai}</span>
                                  )}
                                </div>
                                {item.lokasi && (
                                  <div className="text-[8px] opacity-75 truncate flex items-center gap-0.5 mt-0.5 font-medium">
                                    <span>📍 {item.lokasi}</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            {cellAgendas.length > 3 && (
                              <span className="text-[8px] font-bold text-slate-400 pl-1 block">
                                +{cellAgendas.length - 3} agenda lagi
                              </span>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Detail & Entry Popup Modal */}
      {isModalOpen && selectedDateKey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-wider">Detail Agenda Tanggal</span>
                <h3 className="text-base font-bold text-slate-800 tracking-tight mt-0.5">
                  {getFormattedDateString(selectedDateKey)}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-left">
              
              {/* Form Mode (Add / Edit) */}
              {isFormOpen ? (
                <form onSubmit={handleSubmitAgenda} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {editingAgendaId ? 'Edit Agenda' : 'Tambah Agenda Baru'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  </div>

                  {/* Judul Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Judul Agenda <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kerja Bakti Bersihkan Selokan"
                      value={formJudul}
                      onChange={(e) => setFormJudul(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* Kategori & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Kategori</label>
                      <select
                        value={formKategori}
                        onChange={(e) => setFormKategori(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="umum">Umum</option>
                        <option value="kerjabakti">Kerja Bakti</option>
                        <option value="rapat">Rapat RT</option>
                        <option value="sosial">Arisan / Sosial</option>
                        <option value="posyandu">Posyandu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="terjadwal">Terjadwal</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                      </select>
                    </div>
                  </div>

                  {/* Waktu Mulai & Selesai */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Jam Mulai</label>
                      <input
                        type="time"
                        value={formWaktuMulai}
                        onChange={(e) => setFormWaktuMulai(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Jam Selesai</label>
                      <input
                        type="time"
                        value={formWaktuSelesai}
                        onChange={(e) => setFormWaktuSelesai(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  {/* Lokasi */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Lokasi Kegiatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Balai RT 04"
                      value={formLokasi}
                      onChange={(e) => setFormLokasi(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Catatan / Keterangan</label>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan kegiatan..."
                      value={formKeterangan}
                      onChange={(e) => setFormKeterangan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Agenda'}
                    </button>
                  </div>

                </form>
              ) : (
                /* List View of Agendas on selected date */
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Daftar Kegiatan ({getAgendasForDate(selectedDateKey).length})
                    </span>

                    <button
                      onClick={() => {
                        resetForm(selectedDateKey);
                        setIsFormOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Agenda</span>
                    </button>
                  </div>

                  {getAgendasForDate(selectedDateKey).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Belum ada agenda pada tanggal ini.</p>
                      <p className="text-[11px] text-slate-400 font-medium">Klik tombol "Tambah Agenda" di atas untuk membuat kegiatan baru.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getAgendasForDate(selectedDateKey).map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-md border inline-block ${getCategoryBadgeClass(item.kategori)}`}>
                                {getCategoryLabel(item.kategori)}
                              </span>

                              <h5 className={`text-sm font-bold text-slate-800 ${item.status === 'selesai' ? 'line-through text-slate-400' : ''}`}>
                                {item.judul}
                              </h5>
                            </div>

                            {/* Action dropdown / buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Agenda"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteAgenda(item.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Agenda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Time & Location Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium border-t border-slate-50 pt-2.5">
                            {item.waktuMulai && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.waktuMulai}{item.waktuSelesai ? ` - ${item.waktuSelesai}` : ''}</span>
                              </div>
                            )}

                            {item.lokasi && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.lokasi}</span>
                              </div>
                            )}
                          </div>

                          {/* Description if present */}
                          {item.keterangan && (
                            <p className="text-xs text-slate-500 font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {item.keterangan}
                            </p>
                          )}

                          {/* Status buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'selesai' ? 'text-emerald-600' : item.status === 'dibatalkan' ? 'text-red-500' : 'text-sky-600'
                            }`}>
                              Status: {item.status}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {item.status !== 'terjadwal' && (
                                <button
                                  onClick={() => handleToggleStatus(item, 'terjadwal')}
                                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>Terjadwal</span>
                                </button>
                              )}

                              {item.status !== 'selesai' && (
                                <button
                                  onClick={() => handleToggleStatus(item, 'selesai')}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Selesai</span>
                                </button>
                              )}

                              {item.status !== 'dibatalkan' && (
                                <button
                                  onClick={() => handleToggleStatus(item, 'dibatalkan')}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Batalkan</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Mobile Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}
