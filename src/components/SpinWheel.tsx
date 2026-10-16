'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, AlertCircle, Sparkles, Lock } from 'lucide-react';

export interface SpinCandidate {
  id: string;
  namaPeserta: string;
  nomorSlot?: number;
  sudahMenang?: boolean;
  noHp?: string | null;
}

interface SpinWheelProps {
  candidates: SpinCandidate[];
  onSpinEnd: (winner: SpinCandidate) => void;
  disabled?: boolean;
  disabledReason?: string;
}

// Harmonious, festive, and modern color palette
const SLICE_COLORS = [
  '#ea580c', // Warm Orange
  '#0d9488', // Teal
  '#2563eb', // Royal Blue
  '#059669', // Emerald Green
  '#7c3aed', // Purple / Violet
  '#d97706', // Golden Amber
  '#e11d48', // Crimson Rose
  '#0284c7', // Sky Blue
  '#16a34a', // Fresh Green
  '#9333ea', // Deep Violet
  '#f59e0b', // Yellow Amber
  '#0891b2', // Deep Cyan
];

export default function SpinWheel({
  candidates,
  onSpinEnd,
  disabled = false,
  disabledReason,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0); // in radians
  const [, setSelectedWinner] = useState<SpinCandidate | null>(null);

  // Audio Context for mechanical ticker sound
  const playTickSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio not permitted or not supported, ignore silently
    }
  }, []);

  // Draw wheel on canvas (Fixed resolution 600x600 for sharp, perfectly circular render)
  const drawWheel = useCallback(
    (rotationAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const size = 600; // Internal buffer size (high-res 1:1 square)
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const outerRadius = size / 2 - 16;
      const wheelRadius = outerRadius - 14;

      ctx.clearRect(0, 0, size, size);

      const numSlices = candidates.length;

      // 1. Empty placeholder state
      if (numSlices === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '600 20px Outfit, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Semua peserta sudah menang', centerX, centerY - 14);
        ctx.font = '500 16px Outfit, system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(Siklus Selesai - Siap Reset)', centerX, centerY + 18);
        ctx.restore();
        return;
      }

      const arc = (2 * Math.PI) / numSlices;

      // 2. Outer Decorative Golden / Navy Bezel Rim
      ctx.save();
      // Outer drop shadow
      ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;

      // Rim base
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.restore();

      // Gold accent ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius - 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner rim border
      ctx.beginPath();
      ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // 3. Draw Slices
      for (let i = 0; i < numSlices; i++) {
        const angle = rotationAngle + i * arc;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, wheelRadius, angle, angle + arc);
        ctx.closePath();

        const color = SLICE_COLORS[i % SLICE_COLORS.length];
        ctx.fillStyle = color;
        ctx.fill();

        // Slice divider border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Slice text rendering (aligned radially from center outward)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';

        // Dynamic font size depending on number of candidates
        const fontSize = numSlices > 24 ? 14 : numSlices > 16 ? 16 : numSlices > 10 ? 18 : 20;
        ctx.font = `700 ${fontSize}px Outfit, system-ui, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        const candidate = candidates[i];
        let displayName = candidate.namaPeserta;
        if (candidate.nomorSlot && candidate.nomorSlot > 1) {
          displayName += ` (#${candidate.nomorSlot})`;
        }

        // Truncate cleanly if string is too long for the slice depth
        const maxTextLen = numSlices > 22 ? 12 : numSlices > 14 ? 16 : 20;
        if (displayName.length > maxTextLen) {
          displayName = displayName.substring(0, maxTextLen - 2) + '..';
        }

        // Render text slightly inside the outer wheel border
        ctx.fillText(displayName, wheelRadius - 26, fontSize / 3.2);
        ctx.restore();

        ctx.restore();
      }

      // 4. Decorative Glowing Studs / Light Bulbs around outer bezel
      const dotCount = Math.min(Math.max(numSlices * 2, 20), 40);
      for (let d = 0; d < dotCount; d++) {
        const dotAngle = (d * (2 * Math.PI)) / dotCount + rotationAngle;
        const dotDistance = (outerRadius + wheelRadius) / 2 + 1;
        const dotX = centerX + dotDistance * Math.cos(dotAngle);
        const dotY = centerY + dotDistance * Math.sin(dotAngle);

        ctx.save();
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.8, 0, 2 * Math.PI);
        ctx.fillStyle = d % 2 === 0 ? '#fef08a' : '#ffffff';
        ctx.shadowColor = d % 2 === 0 ? '#f59e0b' : '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      }

      // 5. Center Hub: Multi-Tiered Metallic Medallion
      ctx.save();
      // Outer shadow of hub
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;

      // Outer gold ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 52, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // Middle deep navy ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 46, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Inner Brand Orange circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#f95713';
      ctx.fill();
      ctx.restore();

      // Golden Star / Sparkle in the exact center
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px Outfit, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText('★', centerX, centerY + 1);
      ctx.restore();
    },
    [candidates]
  );

  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation]);

  // Start spinning
  const startSpin = () => {
    if (isSpinning || disabled || candidates.length === 0) return;

    setSelectedWinner(null);
    setIsSpinning(true);

    const numSlices = candidates.length;
    const arc = (2 * Math.PI) / numSlices;

    // Pick a random winning index
    const winningIndex = Math.floor(Math.random() * numSlices);
    const winnerCandidate = candidates[winningIndex];

    // Pointer is at the top: 12 o'clock (270 deg)
    const pointerAngle = (3 * Math.PI) / 2;

    const sliceCenterInNormal = winningIndex * arc + arc / 2;
    let targetOffset = (pointerAngle - sliceCenterInNormal) % (2 * Math.PI);
    if (targetOffset < 0) targetOffset += 2 * Math.PI;

    // Add 6 to 8 full spins
    const extraRotations = 6 + Math.floor(Math.random() * 3);
    const startAngle = currentRotation % (2 * Math.PI);
    const totalRotationSpan = extraRotations * 2 * Math.PI + (targetOffset - startAngle);

    const duration = 4600;
    const startTime = performance.now();
    let lastTickIndex = -1;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const newRotation = startAngle + totalRotationSpan * easedProgress;
      setCurrentRotation(newRotation);

      const currentNormalAngle = (newRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentSliceIndex = Math.floor(
        ((pointerAngle - currentNormalAngle + 2 * Math.PI) % (2 * Math.PI)) / arc
      );
      if (currentSliceIndex !== lastTickIndex) {
        lastTickIndex = currentSliceIndex;
        playTickSound();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSelectedWinner(winnerCandidate);
        onSpinEnd(winnerCandidate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-1">
      {/* 
        Responsive Wheel Container:
        - aspect-square + w-full + max-w ensures width = height strictly at all times!
        - Eliminates any oval / stretched distortion on mobile.
      */}
      <div className="relative w-full max-w-[320px] xs:max-w-[350px] sm:max-w-[400px] aspect-square flex items-center justify-center mx-auto select-none">
        
        {/* Sleek 3D Pointer / Needle at 12 o'clock */}
        <div 
          className="absolute -top-3 z-30 flex flex-col items-center drop-shadow-lg pointer-events-none"
          style={{ transform: 'translateX(-50%)', left: '50%' }}
        >
          {/* Main Arrow Pin with Gold Trim */}
          <div className="relative flex flex-col items-center">
            {/* Triangular arrow head */}
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[28px] border-t-rose-600 drop-shadow-sm" />
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-amber-400 -mt-[27px]" />
            <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[20px] border-t-rose-600 -mt-[23px]" />

            {/* Top gold rivet / bolt */}
            <div className="w-4 h-4 rounded-full bg-amber-400 ring-2 ring-white shadow-md -mt-2" />
          </div>
        </div>

        {/* 
          Canvas Wheel:
          - NO fixed inline width/height!
          - Controlled strictly by w-full h-full aspect-square to remain 100% round.
        */}
        <canvas
          ref={canvasRef}
          className="w-full h-full aspect-square rounded-full block select-none drop-shadow-md"
        />
      </div>

      {/* Action Button & Info */}
      <div className="mt-5 flex flex-col items-center gap-2.5 w-full max-w-sm px-2">
        <button
          type="button"
          onClick={startSpin}
          disabled={isSpinning || disabled || candidates.length === 0}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
            isSpinning
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
              : candidates.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              : disabled
              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none hover:bg-slate-100'
              : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white active:scale-[0.99] shadow-orange-700/20'
          }`}
        >
          {isSpinning ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Memutar Roda Arisan...</span>
            </>
          ) : candidates.length === 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Semua Peserta Sudah Menang</span>
            </>
          ) : disabled ? (
            <>
              <Lock className="w-4 h-4 text-amber-600" />
              <span>{disabledReason || 'Roda Belum Dapat Diputar'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Putar Roda Arisan ({candidates.length} Peserta Siap Undi)</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
          {disabled && candidates.length > 0 && disabledReason ? (
            <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 block text-[11px]">
              🔒 {disabledReason}
            </span>
          ) : candidates.length > 0 ? (
            'Hanya peserta yang belum pernah menang di siklus ini yang masuk dalam roda.'
          ) : (
            'Siklus telah selesai. Silakan klik "Mulai Siklus Baru" untuk mengundi kembali.'
          )}
        </p>
      </div>
    </div>
  );
}
