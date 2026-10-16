'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, AlertCircle } from 'lucide-react';

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
}

// Harmonious palette tailored for Komuna
const SLICE_COLORS = [
  '#f95713', // Brand Orange
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#d97706', // Amber
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#e11d48', // Rose
  '#2563eb', // Blue
  '#ea580c', // Orange dark
  '#0891b2', // Cyan
  '#ca8a04', // Yellow
  '#9333ea', // Purple
];

export default function SpinWheel({ candidates, onSpinEnd, disabled = false }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0); // in radians
  const [, setSelectedWinner] = useState<SpinCandidate | null>(null);

  // Audio Context for synthetic mechanical click ticker sound
  const playTickSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted or not supported, ignore silently
    }
  }, []);

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (rotationAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = 380;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 16;

      ctx.clearRect(0, 0, size, size);

      const numSlices = candidates.length;
      if (numSlices === 0) {
        // Empty placeholder state
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '600 14px Outfit, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Semua peserta sudah menang', centerX, centerY - 10);
        ctx.font = '400 12px Outfit, system-ui, sans-serif';
        ctx.fillText('(Siklus Selesai - Siap Reset)', centerX, centerY + 12);
        ctx.restore();
        return;
      }

      const arc = (2 * Math.PI) / numSlices;

      // Draw outer rim shadow & ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.restore();

      // Draw Slices
      for (let i = 0; i < numSlices; i++) {
        const angle = rotationAngle + i * arc;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.closePath();

        const color = SLICE_COLORS[i % SLICE_COLORS.length];
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Slice text rendering
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';

        // Adjust font size based on number of participants
        const fontSize = numSlices > 24 ? 10 : numSlices > 16 ? 11 : numSlices > 10 ? 12 : 13;
        ctx.font = `600 ${fontSize}px Outfit, system-ui, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 3;

        const candidate = candidates[i];
        let displayName = candidate.namaPeserta;
        if (candidate.nomorSlot && candidate.nomorSlot > 1) {
          displayName += ` (#${candidate.nomorSlot})`;
        }

        // Truncate if too long for slice
        const maxTextLen = numSlices > 20 ? 11 : 16;
        if (displayName.length > maxTextLen) {
          displayName = displayName.substring(0, maxTextLen - 2) + '..';
        }

        ctx.fillText(displayName, radius - 18, 4);
        ctx.restore();

        ctx.restore();
      }

      // Draw decorative dots along the outer rim
      const dotCount = Math.min(Math.max(numSlices * 2, 16), 36);
      for (let d = 0; d < dotCount; d++) {
        const dotAngle = (d * (2 * Math.PI)) / dotCount + rotationAngle;
        const dotX = centerX + (radius + 2) * Math.cos(dotAngle);
        const dotY = centerY + (radius + 2) * Math.sin(dotAngle);

        ctx.save();
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = d % 2 === 0 ? '#fbbf24' : '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // Draw Center Hub
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 6;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Hub Center Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#f95713';
      ctx.fill();

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

    const duration = 4500;
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
    <div className="flex flex-col items-center justify-center p-2">
      {/* Pointer & Wheel Container */}
      <div className="relative flex items-center justify-center">
        {/* Top Indicator Arrow / Needle */}
        <div 
          className="absolute -top-3.5 z-20 flex flex-col items-center drop-shadow-md pointer-events-none"
          style={{ transform: 'translateX(-50%)', left: '50%' }}
        >
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 -mt-1 ring-2 ring-white" />
        </div>

        {/* Canvas Wheel */}
        <canvas
          ref={canvasRef}
          style={{ width: '380px', height: '380px' }}
          className="max-w-full aspect-square rounded-full select-none"
        />
      </div>

      {/* Action Button & Info */}
      <div className="mt-5 flex flex-col items-center gap-2.5 w-full max-w-sm">
        <button
          type="button"
          onClick={startSpin}
          disabled={isSpinning || disabled || candidates.length === 0}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
            isSpinning
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : candidates.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-md active:scale-[0.99]'
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
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Putar Roda Arisan ({candidates.length} Peserta)</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center font-medium">
          {candidates.length > 0
            ? 'Hanya peserta yang belum pernah menang di siklus ini yang masuk dalam roda.'
            : 'Siklus telah selesai. Silakan klik "Mulai Siklus Baru" untuk mengundi kembali.'}
        </p>
      </div>
    </div>
  );
}
