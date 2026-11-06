'use client';

import React from 'react';
import { Star, Quote, CheckCircle2, MessageSquare } from 'lucide-react';
import { TestimonialItem } from '@/lib/landing-defaults';

interface LandingTestimonialsProps {
  testimonials: TestimonialItem[];
}

export default function LandingTestimonials({ testimonials }: LandingTestimonialsProps) {
  return (
    <section id="testimoni" className="py-10 sm:py-14 bg-[#f8fafc] dark:bg-[#0b0f19] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-9">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Cerita Nyata Warga</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Dipercaya Pengurus & Warga{' '}
            <span className="text-[var(--brand-primary)]">di Berbagai Daerah</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Kisah nyata dari para ketua RT, bendahara, dan petugas siskamling yang merasakan kemudahan transparansi Komuna.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((item, idx) => {
            const avatarBg =
              idx === 0
                ? 'bg-[var(--brand-primary)]'
                : idx === 1
                ? 'bg-blue-600'
                : 'bg-emerald-600';

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between group"
              >
                <div>
                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9.5 h-9.5 rounded-xl ${avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {item.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.role}
                        </p>
                      </div>
                    </div>
                    <Quote className="w-5 h-5 text-orange-200 dark:text-orange-950/60" />
                  </div>

                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mb-2.5">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote Body */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Verified Badge */}
                <div className="pt-3 mt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pengurus Terverifikasi</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
