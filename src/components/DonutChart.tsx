import React from 'react';

interface DonutChartProps {
  pemasukan: number;
  pengeluaran: number;
  saldoAwal: number;
  saldoAkhir: string;
}

export default function DonutChart({
  pemasukan,
  pengeluaran,
  saldoAwal,
  saldoAkhir,
}: DonutChartProps) {
  // SVG Circle parameters for radius 50
  const radius = 50;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius; // ~314.16
  
  const total = pemasukan + pengeluaran + saldoAwal;
  
  // Percentages
  const pPct = total > 0 ? (pemasukan / total) * 100 : 60;
  const ePct = total > 0 ? (pengeluaran / total) * 100 : 30;
  const sPct = total > 0 ? (saldoAwal / total) * 100 : 10;
  
  // Calculate dasharray values
  const pLength = (pPct / 100) * circumference;
  const eLength = (ePct / 100) * circumference;
  const sLength = (sPct / 100) * circumference;
  
  // Calculate offsets
  const pOffset = 0;
  const eOffset = -pLength;
  const sOffset = -(pLength + eLength);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          {/* Pemasukan (Green) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#22c55e" // green-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${pLength} ${circumference}`}
            strokeDashoffset={pOffset}
            strokeLinecap="butt"
            className="transition-all duration-500 ease-out"
          />
          {/* Pengeluaran (Red/Orange) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#ef4444" // red-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${eLength} ${circumference}`}
            strokeDashoffset={eOffset}
            strokeLinecap="butt"
            className="transition-all duration-500 ease-out"
          />
          {/* Saldo Awal (Gray) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#cbd5e1" // slate-300
            strokeWidth={strokeWidth}
            strokeDasharray={`${sLength} ${circumference}`}
            strokeDashoffset={sOffset}
            strokeLinecap="butt"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Saldo Akhir</span>
          <span className="text-sm font-bold text-slate-700 mt-0.5">{saldoAkhir}</span>
        </div>
      </div>
      
      {/* Chart Legend */}
      <div className="flex flex-col gap-1.5 mt-4 w-full px-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
            <span className="text-slate-500">Pemasukan</span>
          </div>
          <span className="font-semibold text-slate-700">{Math.round(pPct)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
            <span className="text-slate-500">Pengeluaran</span>
          </div>
          <span className="font-semibold text-slate-700">{Math.round(ePct)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-300"></span>
            <span className="text-slate-500">Saldo Awal</span>
          </div>
          <span className="font-semibold text-slate-700">{Math.round(sPct)}%</span>
        </div>
      </div>
    </div>
  );
}
