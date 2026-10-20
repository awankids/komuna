'use client';

import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { TestimonialItem } from '@/lib/landing-defaults';

interface LandingTestimonialsProps {
  testimonials: TestimonialItem[];
}

export default function LandingTestimonials({ testimonials }: LandingTestimonialsProps) {
  return (
    <section id="testimoni" className="py-20 bg-slate-50/60 font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#00880F] text-xs font-black tracking-tight">
            <span>💬 Cerita Nyata Warga</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Dipercaya Pengurus & Warga{' '}
            <span className="text-[#00AA13]">di Berbagai Daerah</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Kisah nyata dari para ketua RT, bendahara, dan petugas siskamling yang telah merasakan kemudahan Komuna.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="p-7 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between group"
            >
              <div>
                {/* Author Info */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${
                        item.avatarColor || 'bg-[#00AA13]'
                      } text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                        {item.role}
                      </p>
                    </div>
                  </div>
                  <Quote className="w-6 h-6 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1 mb-3.5">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote Body */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Verified Badge */}
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-extrabold text-[#00880F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pengguna Terverifikasi</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
