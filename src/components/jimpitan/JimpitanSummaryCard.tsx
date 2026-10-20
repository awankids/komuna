'use client';

import React from 'react';
import { Coins, Check, FileSpreadsheet, Pencil } from 'lucide-react';

interface JimpitanSummaryCardProps {
  monthName: string;
  selectedYear: string;
  totalTerkumpul: number;
  avgTerkumpul: number;
  filledCount: number;
  totalDays: number;
  rasioPengisian: number;
  targetBulanIni: number | null;
  sisaTarget: number | null;
  targetHarian: number | null;
  persentaseTarget: number;
  remainingDays: number;
  isEditingTarget: boolean;
  isSavingTarget: boolean;
  targetError: string;
  targetInputRef: React.RefObject<HTMLInputElement | null>;
  onStartEditTarget: () => void;
  onCancelEditTarget: () => void;
  onSaveTarget: (val: number) => void;
  onExportExcel: () => void;
  formatRp: (val: number) => string;
}

export const JimpitanSummaryCard = React.memo(function JimpitanSummaryCard({
  monthName,
  selectedYear,
  totalTerkumpul,
  avgTerkumpul,
  filledCount,
  totalDays,
  rasioPengisian,
  targetBulanIni,
  sisaTarget,
  targetHarian,
  persentaseTarget,
  remainingDays,
  isEditingTarget,
  isSavingTarget,
  targetError,
  targetInputRef,
  onStartEditTarget,
  onCancelEditTarget,
  onSaveTarget,
  onExportExcel,
  formatRp,
}: JimpitanSummaryCardProps) {
  return (
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
                Ringkasan {monthName} {selectedYear}
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
              onClick={onExportExcel}
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
                      onClick={onStartEditTarget}
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
                            onSaveTarget(val);
                          }
                          if (e.key === 'Escape') {
                            onCancelEditTarget();
                          }
                        }}
                        className="w-28 text-xs font-bold border-b-2 border-[var(--brand-primary)] outline-none bg-transparent py-0.5 text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                      />
                      <button
                        disabled={isSavingTarget}
                        onClick={() => {
                          const val = parseInt(targetInputRef.current?.value?.replace(/\D/g, '') || '0', 10);
                          onSaveTarget(val);
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
                  <span className="text-[var(--brand-primary)]">{persentaseTarget}% Tercapai</span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
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
                    Sisa:{' '}
                    <strong className={sisaTarget === 0 ? 'text-emerald-600' : 'text-slate-700'}>
                      {formatRp(sisaTarget)}
                    </strong>
                    {remainingDays > 0 ? ` (${remainingDays} hari lagi)` : ' (Bulan Selesai)'}
                  </>
                ) : (
                  <span className="italic">Set target untuk lihat sisa</span>
                )}
              </span>
              <span>
                {targetHarian !== null ? (
                  <>
                    Kebutuhan: <strong className="text-slate-700">{formatRp(targetHarian)}/hari</strong>
                  </>
                ) : null}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
