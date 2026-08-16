'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, Settings2 } from 'lucide-react';

interface TransactionFormProps {
  modalMode: 'add' | 'edit';
  currentTxId: string;
  initialTanggal: string;
  initialJenis: 'pemasukan' | 'pengeluaran';
  initialKategori: string;
  initialKeterangan: string;
  initialSubKeterangan: string;
  initialNominal: string;
  categories: { pemasukan: string[]; pengeluaran: string[] };
  isJimpitan: boolean;
  onSubmit: (data: {
    tanggal: string;
    jenis: 'pemasukan' | 'pengeluaran';
    kategori: string;
    keterangan: string;
    nominal: string;
  }) => void;
  onCancel: () => void;
  onOpenCategoryModal: (jenis: 'pemasukan' | 'pengeluaran') => void;
}

export default function TransactionForm({
  modalMode,
  currentTxId,
  initialTanggal,
  initialJenis,
  initialKategori,
  initialKeterangan,
  initialSubKeterangan,
  initialNominal,
  categories,
  isJimpitan,
  onSubmit,
  onCancel,
  onOpenCategoryModal,
}: TransactionFormProps) {
  // All state is INSIDE this isolated component - parent never re-renders this
  const [jenis, setJenis] = useState<'pemasukan' | 'pengeluaran'>(initialJenis);
  const [kategori, setKategori] = useState(initialKategori);
  const [tanggal, setTanggal] = useState(initialTanggal);

  // Uncontrolled refs for text inputs - no state = no re-render on typing
  const keteranganRef = useRef<HTMLInputElement>(null);
  const subKeteranganRef = useRef<HTMLInputElement>(null);
  const nominalRef = useRef<HTMLInputElement>(null);

  // Update kategori when jenis changes
  const handleJenisChange = (newJenis: 'pemasukan' | 'pengeluaran') => {
    setJenis(newJenis);
    // Default to first category of the selected type
    const firstCat = categories[newJenis]?.[0] || '';
    setKategori(firstCat);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const keteranganValue = keteranganRef.current?.value || '';
    const subKeteranganValue = subKeteranganRef.current?.value || '';
    const nominalValue = nominalRef.current?.value || '';
    const fullKeterangan = subKeteranganValue
      ? `${keteranganValue} / ${subKeteranganValue}`
      : keteranganValue;
    onSubmit({
      tanggal,
      jenis,
      kategori,
      keterangan: fullKeterangan,
      nominal: nominalValue,
    });
  };

  return (
    <form
      key={modalMode + currentTxId}
      onSubmit={handleFormSubmit}
      className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-left space-y-5"
    >
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
        {modalMode === 'add' ? 'Tambah Transaksi Kas' : 'Edit Transaksi Kas'}
      </h3>

      {isJimpitan && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            Catatan: Mengubah nominal jimpitan susulan ini akan otomatis memperbarui nominal jimpitan harian terkait di halaman Jimpitan.
          </p>
        </div>
      )}

      <div className="space-y-4">

        {/* Tanggal */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713] transition-colors"
            required
          />
        </div>

        {/* Jenis */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Transaksi</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleJenisChange('pemasukan')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                jenis === 'pemasukan'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => handleJenisChange('pengeluaran')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                jenis === 'pengeluaran'
                  ? 'bg-red-50 text-red-650 border-red-250 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        {/* Kategori */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
            <button
              type="button"
              onClick={() => onOpenCategoryModal(jenis)}
              className="text-[10px] font-bold text-[#f95713] hover:text-orange-600 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>Kelola Kategori</span>
            </button>
          </div>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713] cursor-pointer transition-colors"
          >
            {categories[jenis]?.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Keterangan - UNCONTROLLED via ref, no onChange state update */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan Utama</label>
          <input
            ref={keteranganRef}
            type="text"
            placeholder="e.g. Pembayaran Listrik Pos Ronda"
            defaultValue={initialKeterangan}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713] transition-colors"
            required
          />
        </div>

        {/* Sub Keterangan - UNCONTROLLED via ref */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail / Keterangan Tambahan (Opsional)</label>
          <input
            ref={subKeteranganRef}
            type="text"
            placeholder="e.g. Pak Ahmad / Sapu, Pel, dll"
            defaultValue={initialSubKeterangan}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713] transition-colors"
          />
        </div>

        {/* Nominal - UNCONTROLLED via ref */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nominal (Rp)</label>
          <input
            ref={nominalRef}
            type="number"
            placeholder="e.g. 150000"
            defaultValue={initialNominal}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#f95713] transition-colors"
            min="1"
            required
          />
        </div>

      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-[#f95713] hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-100 transition-all text-xs cursor-pointer"
        >
          Simpan Transaksi
        </button>
      </div>
    </form>
  );
}
