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
    <div className="relative w-full max-w-[140px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
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
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="0"
        className={`w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:bg-white transition-all text-left ${
          isDirty ? 'border-amber-400 ring-2 ring-amber-400/10' : ''
        }`}
      />
    </div>
  );
}
