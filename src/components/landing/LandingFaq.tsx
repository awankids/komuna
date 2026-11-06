'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FaqItem } from '@/lib/landing-defaults';

interface LandingFaqProps {
  faqs: FaqItem[];
}

export default function LandingFaq({ faqs }: LandingFaqProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white dark:bg-[#0f172a] font-sans border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Tanya Jawab Seputar Komuna</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Informasi seputar pendaftaran, keamanan data, dan pengoperasian aplikasi untuk pengurus RT.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[var(--brand-primary)] bg-orange-50/20 dark:bg-orange-950/15 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full p-4.5 sm:p-5 flex items-center justify-between gap-3 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-[var(--brand-primary)] dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center text-xs shrink-0 font-extrabold">
                      Q
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[var(--brand-primary)]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3.5 pl-13 sm:pl-14 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
