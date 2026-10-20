'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RombonganOption {
  id: string;
  nama: string;
}

interface JimpitanFilterBarProps {
  selectedMonth: string;
  selectedYear: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (month: string) => void;
  onSelectYear: (year: string) => void;
  selectedRombonganFilter: string;
  onSelectRombonganFilter: (val: string) => void;
  selectedStatusFilter: string;
  onSelectStatusFilter: (val: string) => void;
  rombonganList: RombonganOption[];
}

export const JimpitanFilterBar = React.memo(function JimpitanFilterBar({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  selectedRombonganFilter,
  onSelectRombonganFilter,
  selectedStatusFilter,
  onSelectStatusFilter,
  rombonganList,
}: JimpitanFilterBarProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
      {/* Period Selector */}
      <div className="flex items-center gap-2 justify-between sm:justify-start">
        <button
          onClick={onPrevMonth}
          aria-label="Bulan sebelumnya"
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
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
            onChange={(e) => onSelectYear(e.target.value)}
            aria-label="Pilih Tahun"
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:text-[var(--brand-primary)] transition-colors"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onNextMonth}
          aria-label="Bulan berikutnya"
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Rombongan Filter */}
        <select
          value={selectedRombonganFilter}
          onChange={(e) => onSelectRombonganFilter(e.target.value)}
          aria-label="Filter Rombongan"
          className="bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
        >
          <option value="all">Semua Rombongan</option>
          {rombonganList.map((rom) => (
            <option key={rom.id} value={rom.id}>
              {rom.nama}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => onSelectStatusFilter(e.target.value)}
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
  );
});
