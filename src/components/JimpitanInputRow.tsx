'use client';

import React, { useState, useRef } from 'react';

interface JimpitanInputRowProps {
  dateKey: string;
  dateStr: string;
  initialValue: number; // nominal dari server
  isFuture: boolean;
  isSaving: boolean;
  onSave: (dateKey: string, nominal: number) => void;
}

/**
 * Komponen baris input jimpitan yang TERISOLASI.
 * State lokal di sini tidak menyebabkan parent (JimpitanBulananPage) re-render,
 * sehingga Gboard Android tidak kehilangan komposisi teks.
 */
export default function JimpitanInputRow({
  dateKey,
  dateStr,
  initialValue,
  isFuture,
  isSaving,
  onSave,
}: JimpitanInputRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleBlur = () => {
    const rawText = inputRef.current?.value || '';
    const numVal = parseInt(rawText.replace(/\D/g, ''), 10) || 0;
    if (numVal !== initialValue) {
      setIsDirty(false);
      onSave(dateKey, numVal);
    } else {
      setIsDirty(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleChange = () => {
    setIsDirty(true);
  };

  if (isFuture) {
    return <span className="text-slate-300 font-bold text-xs">-</span>;
  }

  return (
    <div className="relative w-full max-w-[90px] md:max-w-[110px]">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-bold text-slate-400">Rp</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        disabled={isSaving}
        aria-label={`Nominal jimpitan tanggal ${dateStr}`}
        defaultValue={initialValue > 0 ? initialValue.toLocaleString('id-ID') : ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0"
        className={`w-full pl-7 md:pl-8 pr-2.5 py-1.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-full text-[11px] md:text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 focus:bg-white transition-all text-left ${
          isDirty ? 'border-amber-400 bg-amber-50/20' : ''
        }`}
      />
    </div>
  );
}
