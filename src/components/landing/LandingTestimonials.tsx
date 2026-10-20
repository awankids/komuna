'use client';

import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { TestimonialItem } from '@/lib/landing-defaults';

interface LandingTestimonialsProps {
  testimonials: TestimonialItem[];
}

export default function LandingTestimonials({ testimonials }: LandingTestimonialsProps) {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div className="text-left space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-tight">
              Testimoni
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Apa Kata Pengguna?
            </h2>
          </div>

          <a
            href="#faq"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors self-start sm:self-auto"
          >
            <span>Pertanyaan Umum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3 Testimonials Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between"
            >
              <div>
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full ${item.avatarColor || 'bg-emerald-600'} text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs`}>
                    {item.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {item.role}
                    </p>
                  </div>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
