'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Save, 
  RefreshCw, 
  ExternalLink, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  BarChart3, 
  MessageSquare, 
  HelpCircle, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { DEFAULT_LANDING_DATA, LandingPageData, FaqItem } from '@/lib/landing-defaults';

export default function AdminCmsPage() {
  const [data, setData] = useState<LandingPageData>(DEFAULT_LANDING_DATA);
  const [activeTab, setActiveTab] = useState<'hero' | 'stats' | 'features' | 'steps' | 'testimonials' | 'faq' | 'footer'>('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCmsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cms/landing');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load CMS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCmsData();
  }, []);

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/cms/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        triggerToast('Semua perubahan landing page berhasil disimpan!');
      } else {
        triggerToast(resJson.error || 'Gagal menyimpan perubahan.', 'error');
      }
    } catch (e: any) {
      triggerToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengembalikan seluruh konten landing page ke pengaturan default mockup?')) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/cms/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        setData(DEFAULT_LANDING_DATA);
        triggerToast('Konten berhasil di-reset ke nilai default mockup!');
      } else {
        triggerToast('Gagal mereset konten.', 'error');
      }
    } catch {
      triggerToast('Gagal mereset konten.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper updater functions
  const updateHero = (key: keyof LandingPageData['hero'], val: string) => {
    setData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [key]: val },
    }));
  };

  const updateFooter = (key: keyof LandingPageData['footer'], val: string) => {
    setData((prev) => ({
      ...prev,
      footer: { ...prev.footer, [key]: val },
    }));
  };

  const updateFeature = (index: number, key: 'title' | 'description', val: string) => {
    setData((prev) => {
      const next = [...prev.features];
      next[index] = { ...next[index], [key]: val };
      return { ...prev, features: next };
    });
  };

  const updateStep = (index: number, key: 'title' | 'description', val: string) => {
    setData((prev) => {
      const nextSteps = [...prev.stepsSection.steps];
      nextSteps[index] = { ...nextSteps[index], [key]: val };
      return {
        ...prev,
        stepsSection: { ...prev.stepsSection, steps: nextSteps },
      };
    });
  };

  const updateStat = (index: number, key: 'value' | 'label', val: string) => {
    setData((prev) => {
      const nextStats = [...prev.statsTrust.stats];
      nextStats[index] = { ...nextStats[index], [key]: val };
      return {
        ...prev,
        statsTrust: { ...prev.statsTrust, stats: nextStats },
      };
    });
  };

  const updateTestimonial = (index: number, key: 'name' | 'role' | 'quote', val: string) => {
    setData((prev) => {
      const next = [...prev.testimonials];
      next[index] = { ...next[index], [key]: val };
      return { ...prev, testimonials: next };
    });
  };

  const addFaqItem = () => {
    setData((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          id: `faq_${Date.now()}`,
          question: 'Pertanyaan baru?',
          answer: 'Jawaban penjelasan untuk pertanyaan ini.',
        },
      ],
    }));
  };

  const updateFaq = (index: number, key: 'question' | 'answer', val: string) => {
    setData((prev) => {
      const next = [...prev.faqs];
      next[index] = { ...next[index], [key]: val };
      return { ...prev, faqs: next };
    });
  };

  const deleteFaq = (index: number) => {
    setData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-700'
              : 'bg-rose-800 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Kembali ke Dashboard RT"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                CMS Landing Page
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Kelola teks, fitur, dan konten halaman publik komuna.id
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Lihat Live</span>
          </Link>

          <button
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors disabled:opacity-50"
            title="Reset ke nilai default"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </header>

      {/* Main CMS Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'hero'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hero Section</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'features'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>6 Kartu Fitur</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'steps'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3 Langkah Cara Kerja</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Metrik & Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'testimonials'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Testimoni Pengguna</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ ({data.faqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('footer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'footer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Kontak & Footer</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="mt-6 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          
          {/* TAB 1: HERO SECTION */}
          {activeTab === 'hero' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Hero Section Editor</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola teks judul utama, subheadline, tombol CTA, dan social proof.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Teks Badge Atas</label>
                  <input
                    type="text"
                    value={data.hero.badge}
                    onChange={(e) => updateHero('badge', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Social Proof Label</label>
                  <input
                    type="text"
                    value={data.hero.socialProofText}
                    onChange={(e) => updateHero('socialProofText', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Headline Utama (Baris 1)</label>
                  <input
                    type="text"
                    value={data.hero.headlineMain}
                    onChange={(e) => updateHero('headlineMain', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Headline Highlight Hijau (Baris 2)</label>
                  <input
                    type="text"
                    value={data.hero.headlineHighlight}
                    onChange={(e) => updateHero('headlineHighlight', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subheadline Deskripsi</label>
                  <textarea
                    rows={3}
                    value={data.hero.subheadline}
                    onChange={(e) => updateHero('subheadline', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tombol Primer (Text)</label>
                  <input
                    type="text"
                    value={data.hero.ctaPrimaryText}
                    onChange={(e) => updateHero('ctaPrimaryText', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tombol Primer (Link URL)</label>
                  <input
                    type="text"
                    value={data.hero.ctaPrimaryLink}
                    onChange={(e) => updateHero('ctaPrimaryLink', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tombol Sekunder (Text)</label>
                  <input
                    type="text"
                    value={data.hero.ctaSecondaryText}
                    onChange={(e) => updateHero('ctaSecondaryText', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tombol Sekunder (Link URL)</label>
                  <input
                    type="text"
                    value={data.hero.ctaSecondaryLink}
                    onChange={(e) => updateHero('ctaSecondaryLink', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6 KARTU FITUR */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">6 Kartu Fitur Unggulan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Edit judul dan penjelasan kartu fitur bento di bawah hero.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.features.map((feat, idx) => (
                  <div key={feat.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-left">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      Fitur #{idx + 1}
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Fitur</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi Singkat</label>
                      <textarea
                        rows={2}
                        value={feat.description}
                        onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 3 LANGKAH CARA KERJA */}
          {activeTab === 'steps' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">3 Langkah Cara Kerja</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola alur registrasi cepat 3 langkah.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Seksi</label>
                  <input
                    type="text"
                    value={data.stepsSection.title}
                    onChange={(e) => setData({ ...data, stepsSection: { ...data.stepsSection, title: e.target.value } })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subjudul Seksi</label>
                  <input
                    type="text"
                    value={data.stepsSection.subtitle}
                    onChange={(e) => setData({ ...data, stepsSection: { ...data.stepsSection, subtitle: e.target.value } })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
                {data.stepsSection.steps.map((st, idx) => (
                  <div key={st.number} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-left">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Langkah {st.number}
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Langkah</label>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => updateStep(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi Langkah</label>
                      <textarea
                        rows={3}
                        value={st.description}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: METRIK & STATISTIK */}
          {activeTab === 'stats' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">4 Kartu Metrik & Kepercayaan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ubah angka pencapaian RT aktif, keamanan data, dan kepuasan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {data.statsTrust.stats.map((st, idx) => (
                  <div key={st.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-left">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Angka / Nilai Capaian</label>
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => updateStat(idx, 'value', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-black text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Label Keterangan</label>
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => updateStat(idx, 'label', e.target.value)}
                        className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TESTIMONI PENGGUNA */}
          {activeTab === 'testimonials' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Testimoni Pengguna</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola ulasan dari Ketua RT, Bendahara, maupun Warga.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.testimonials.map((testi, idx) => (
                  <div key={testi.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-left">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Tokoh / Pengguna</label>
                      <input
                        type="text"
                        value={testi.name}
                        onChange={(e) => updateTestimonial(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan / Peran</label>
                      <input
                        type="text"
                        value={testi.role}
                        onChange={(e) => updateTestimonial(idx, 'role', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Kutipan Ulasan (Quote)</label>
                      <textarea
                        rows={3}
                        value={testi.quote}
                        onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs italic"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FAQ (TANYA JAWAB) */}
          {activeTab === 'faq' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Kelola FAQ (Tanya Jawab)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tambah atau sesuaikan pertanyaan umum warga.</p>
                </div>
                <button
                  onClick={addFaqItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah FAQ</span>
                </button>
              </div>

              <div className="space-y-4">
                {data.faqs.map((faq, idx) => (
                  <div key={faq.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        FAQ #{idx + 1}
                      </span>
                      <button
                        onClick={() => deleteFaq(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pertanyaan</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                        className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jawaban Penjelasan</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                        className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: KONTAK & FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Kontak & Tautan Footer</h2>
                <p className="text-xs text-slate-500 mt-0.5">Atur nomor WhatsApp bantuan, link media sosial, dan hak cipta.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp CS / Bantuan</label>
                  <input
                    type="text"
                    value={data.footer.waNumber}
                    onChange={(e) => updateFooter('waNumber', e.target.value)}
                    placeholder="6281234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link Instagram</label>
                  <input
                    type="text"
                    value={data.footer.igUrl}
                    onChange={(e) => updateFooter('igUrl', e.target.value)}
                    placeholder="https://instagram.com/komuna.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link YouTube Channel</label>
                  <input
                    type="text"
                    value={data.footer.ytUrl}
                    onChange={(e) => updateFooter('ytUrl', e.target.value)}
                    placeholder="https://youtube.com/@komuna"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Hak Cipta</label>
                  <input
                    type="text"
                    value={data.footer.copyright}
                    onChange={(e) => updateFooter('copyright', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
