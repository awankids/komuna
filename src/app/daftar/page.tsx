'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Users, 
  Gift, 
  Package, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle,
  RefreshCw,
  Home,
  CheckCircle2
} from 'lucide-react';

interface FormData {
  // Step 1: Admin
  namaAdmin: string;
  jabatanAdmin: string;
  noHpAdmin: string;
  emailAdmin: string;
  passwordAdmin: string;
  passwordConfirm: string;

  // Step 2: Wilayah
  tingkatWilayah: string;
  noRt: string;
  noRw: string;
  dusunPerumahan: string;
  desaKelurahan: string;
  kecamatan: string;
  kotaKabupaten: string;
  provinsi: string;
  kodePos: string;

  // Step 3: Operasional
  estimasiKk: string;
  modulAktif: string[];
  targetJimpitan: number;
  temaWarna: string;

  // Step 4: Konfirmasi
  muatDataSimulasi: boolean;
  setujuKetentuan: boolean;
}

export default function RegisterWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<FormData>({
    namaAdmin: '',
    jabatanAdmin: 'Ketua RT',
    noHpAdmin: '',
    emailAdmin: '',
    passwordAdmin: '',
    passwordConfirm: '',

    tingkatWilayah: 'RT',
    noRt: '',
    noRw: '',
    dusunPerumahan: '',
    desaKelurahan: '',
    kecamatan: '',
    kotaKabupaten: '',
    provinsi: '',
    kodePos: '',

    estimasiKk: '30-70',
    modulAktif: ['jimpitan', 'kas', 'anggota'],
    targetJimpitan: 2000000,
    temaWarna: 'orange',

    muatDataSimulasi: true,
    setujuKetentuan: true,
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const toggleModul = (modulKey: string) => {
    setFormData((prev) => {
      const exists = prev.modulAktif.includes(modulKey);
      if (exists) {
        return { ...prev, modulAktif: prev.modulAktif.filter((k) => k !== modulKey) };
      } else {
        return { ...prev, modulAktif: [...prev.modulAktif, modulKey] };
      }
    });
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.namaAdmin.trim()) {
        setErrorMessage('Nama lengkap penanggung jawab wajib diisi');
        return false;
      }
      if (!formData.noHpAdmin.trim()) {
        setErrorMessage('Nomor WhatsApp wajib diisi untuk koordinasi & notifikasi');
        return false;
      }
      if (!formData.emailAdmin.trim() || !formData.emailAdmin.includes('@')) {
        setErrorMessage('Alamat email wajib diisi dengan format valid');
        return false;
      }
      if (!formData.passwordAdmin || formData.passwordAdmin.length < 6) {
        setErrorMessage('Kata sandi minimal 6 karakter');
        return false;
      }
      if (formData.passwordAdmin !== formData.passwordConfirm) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.noRt.trim() && !formData.dusunPerumahan.trim()) {
        setErrorMessage('Nomor RT atau nama perumahan/kampung wajib diisi');
        return false;
      }
      if (!formData.desaKelurahan.trim()) {
        setErrorMessage('Desa / Kelurahan wajib diisi untuk identitas surat dan laporan');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.modulAktif.length === 0) {
        setErrorMessage('Pilih minimal satu modul operasional');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!formData.setujuKetentuan) {
        setErrorMessage('Harap setujui pernyataan komitmen kerahasiaan data kependudukan');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/register-rt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Terjadi kendala saat mendaftar. Silakan periksa kembali.');
        setIsLoading(false);
      } else {
        // Berhasil mendaftar, langsung arahkan ke dashboard
        router.push('/?welcome=new_rt');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage('Gagal menghubungi server. Pastikan koneksi internet Anda stabil.');
      setIsLoading(false);
    }
  };

  const stepTitles = [
    { number: 1, title: 'Akun Pengurus', desc: 'Penanggung jawab' },
    { number: 2, title: 'Identitas Wilayah', desc: 'RT, RW & Desa' },
    { number: 3, title: 'Operasional', desc: 'Modul & Target' },
    { number: 4, title: 'Peluncuran', desc: 'Konfirmasi & Mulai' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 font-sans">
      
      {/* Container Card */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-7 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali ke halaman login"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-[var(--brand-primary)]">
                  Komuna Onboarding
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Pendaftaran RT / Desa Baru</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Buka Ruang Kerja Komunitas
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Sudah punya akun?</span>
            <Link href="/login" className="font-bold text-[var(--brand-primary)] hover:underline">
              Masuk
            </Link>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-5 sm:px-8 py-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {stepTitles.map((step) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <div 
                  key={step.number}
                  className={`flex items-center gap-2.5 transition-opacity ${
                    isCurrent ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'
                  }`}
                >
                  <div 
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                        ? 'bg-[var(--brand-primary)] text-white shadow-xs' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Area */}
        <div className="p-6 sm:p-8">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ========================================================
                STEP 1: Data Pengurus / Penanggung Jawab
               ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-orange-900 dark:text-orange-300">
                    Langkah 1: Akun Administrator
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Akun ini akan memiliki akses penuh sebagai Administrator utama untuk mengelola warga, jimpitan, dan laporan keuangan RT.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Nama Lengkap Pengurus <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaAdmin}
                      onChange={(e) => updateField('namaAdmin', e.target.value)}
                      placeholder="Contoh: Bambang Sudarmanto"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Jabatan di Lingkungan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.jabatanAdmin}
                      onChange={(e) => updateField('jabatanAdmin', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    >
                      <option value="Ketua RT">Ketua RT</option>
                      <option value="Wakil Ketua RT">Wakil Ketua RT</option>
                      <option value="Sekretaris RT">Sekretaris RT</option>
                      <option value="Bendahara RT">Bendahara RT</option>
                      <option value="Ketua RW">Ketua RW</option>
                      <option value="Kepala Dusun">Kepala Dusun / Dukuh</option>
                      <option value="Perangkat Desa">Perangkat Desa / Kelurahan</option>
                      <option value="Inisiator Warga">Warga Penggagas</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noHpAdmin}
                      onChange={(e) => updateField('noHpAdmin', e.target.value)}
                      placeholder="081234567890"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Alamat Email Login <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.emailAdmin}
                      onChange={(e) => updateField('emailAdmin', e.target.value)}
                      placeholder="nama@komuna.id atau email pribadi Anda"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.passwordAdmin}
                        onChange={(e) => updateField('passwordAdmin', e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Ulangi Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.passwordConfirm}
                      onChange={(e) => updateField('passwordConfirm', e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 2: Identitas Komunitas & Wilayah
               ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-blue-900 dark:text-blue-300">
                    Langkah 2: Identitas Wilayah Lingkungan
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Data wilayah ini akan otomatis dicetak pada kop surat pengantar resmi, tanda terima jimpitan, dan laporan pertanggungjawaban kas.
                  </p>
                </div>

                {/* Tingkat Wilayah Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Tingkat Organisasi / Lingkungan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'RT', label: 'Rukun Tetangga (RT)' },
                      { id: 'RW', label: 'Rukun Warga (RW)' },
                      { id: 'DUSUN', label: 'Dusun / Dukuh' },
                      { id: 'PAGUYUBAN', label: 'Paguyuban Warga' },
                    ].map((tingkat) => (
                      <button
                        key={tingkat.id}
                        type="button"
                        onClick={() => updateField('tingkatWilayah', tingkat.id)}
                        className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          formData.tingkatWilayah === tingkat.id
                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        {tingkat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Nomor RT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noRt}
                      onChange={(e) => updateField('noRt', e.target.value)}
                      placeholder="Misal: 03 atau 04"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Nomor RW (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.noRw}
                      onChange={(e) => updateField('noRw', e.target.value)}
                      placeholder="Misal: 08"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Nama Dusun / Perumahan / Kampung
                    </label>
                    <input
                      type="text"
                      value={formData.dusunPerumahan}
                      onChange={(e) => updateField('dusunPerumahan', e.target.value)}
                      placeholder="Contoh: Perumahan Griya Kencana atau Dusun Dayu"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Desa / Kelurahan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.desaKelurahan}
                      onChange={(e) => updateField('desaKelurahan', e.target.value)}
                      placeholder="Contoh: Sinduharjo"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kecamatan}
                      onChange={(e) => updateField('kecamatan', e.target.value)}
                      placeholder="Contoh: Ngaglik"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Kota / Kabupaten
                    </label>
                    <input
                      type="text"
                      value={formData.kotaKabupaten}
                      onChange={(e) => updateField('kotaKabupaten', e.target.value)}
                      placeholder="Contoh: Kabupaten Sleman"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      value={formData.provinsi}
                      onChange={(e) => updateField('provinsi', e.target.value)}
                      placeholder="Contoh: D.I. Yogyakarta"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 3: Karakteristik & Kebiasaan Operasional
               ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-purple-900 dark:text-purple-300">
                    Langkah 3: Karakteristik & Modul Aktif
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Pilih modul yang paling dibutuhkan lingkungan Anda saat ini. Modul lain dapat Anda aktifkan atau nonaktifkan kapan saja di menu Pengaturan.
                  </p>
                </div>

                {/* Modul Checkboxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Modul Operasional yang Ingin Diaktifkan
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'jimpitan',
                        title: 'Jimpitan & Ronda Harian',
                        desc: 'Pencatatan koin harian petugas ronda & rekap status bulanan',
                        icon: <TrendingUp className="w-4 h-4 text-orange-500" />
                      },
                      {
                        key: 'kas',
                        title: 'Buku Kas & Cetak LPJ',
                        desc: 'Pencatatan pemasukan, pengeluaran & download laporan PDF',
                        icon: <FileText className="w-4 h-4 text-emerald-500" />
                      },
                      {
                        key: 'anggota',
                        title: 'Data Warga & Keluarga',
                        desc: 'Daftar kepala keluarga, mutasi penduduk & hierarki anggota',
                        icon: <Users className="w-4 h-4 text-blue-500" />
                      },
                      {
                        key: 'surat',
                        title: 'Surat Pengantar Ber-QR',
                        desc: 'Pembuatan surat pengantar domisili, SKCK, dll dengan verifikasi QR',
                        icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      },
                      {
                        key: 'arisan',
                        title: 'Arisan Warga & Roda Putar',
                        desc: 'Iuran arisan bulanan & undian putar pemenang transparan',
                        icon: <Gift className="w-4 h-4 text-purple-500" />
                      },
                      {
                        key: 'inventaris',
                        title: 'Inventaris & Peminjaman Aset',
                        desc: 'Catat aset bersama (tenda, sound system, kursi) & peminjaman warga',
                        icon: <Package className="w-4 h-4 text-amber-500" />
                      },
                    ].map((modul) => {
                      const isChecked = formData.modulAktif.includes(modul.key);
                      return (
                        <div
                          key={modul.key}
                          onClick={() => toggleModul(modul.key)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-orange-50/50 dark:bg-orange-950/20 border-[var(--brand-primary)]'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isChecked 
                              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white' 
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              {modul.icon}
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                                {modul.title}
                              </h3>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {modul.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target Jimpitan & Estimasi KK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Estimasi Jumlah Kepala Keluarga (KK)
                    </label>
                    <select
                      value={formData.estimasiKk}
                      onChange={(e) => updateField('estimasiKk', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    >
                      <option value="<30">Kurang dari 30 KK (Lingkungan Kecil)</option>
                      <option value="30-70">30 - 70 KK (Standar RT)</option>
                      <option value=">70">Lebih dari 70 KK (Lingkungan Besar)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Target Jimpitan Bulanan (Rp)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={formData.targetJimpitan}
                      onChange={(e) => updateField('targetJimpitan', Number(e.target.value))}
                      placeholder="2000000"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring-strong)] focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>

                {/* Tema Warna Lingkungan */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Pilihan Aksen Warna Tampilan
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'orange', name: 'Orange Komuna', colorBg: 'bg-[#f95713]' },
                      { id: 'emerald', name: 'Hijau Zamrud', colorBg: 'bg-emerald-600' },
                      { id: 'blue', name: 'Biru Harmoni', colorBg: 'bg-blue-600' },
                      { id: 'violet', name: 'Ungu Teduh', colorBg: 'bg-violet-600' },
                    ].map((tema) => (
                      <button
                        key={tema.id}
                        type="button"
                        onClick={() => updateField('temaWarna', tema.id)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          formData.temaWarna === tema.id
                            ? 'border-[var(--brand-primary)] bg-orange-50/40 dark:bg-orange-950/20 font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${tema.colorBg} shrink-0`} />
                        <span className="text-xs text-slate-800 dark:text-slate-200">{tema.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                STEP 4: Konfirmasi & Peluncuran
               ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-300">
                    Langkah 4: Tinjauan & Peluncuran
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Periksa kembali data pendaftaran Anda sebelum ruang kerja RT dibuat dan siap digunakan.
                  </p>
                </div>

                {/* Bento Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Wilayah Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Home className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Wilayah RT / Lingkungan</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formData.tingkatWilayah} {formData.noRt ? `RT ${formData.noRt}` : ''} {formData.noRw ? `RW ${formData.noRw}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {[formData.dusunPerumahan, formData.desaKelurahan, formData.kecamatan, formData.kotaKabupaten]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>

                  {/* Admin Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Administrator Utama</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formData.namaAdmin}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {formData.jabatanAdmin} • {formData.emailAdmin}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      WhatsApp: {formData.noHpAdmin}
                    </p>
                  </div>

                </div>

                {/* Database Initialization Choice */}
                <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Opsi Permulaan Data Awal
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => updateField('muatDataSimulasi', true)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        formData.muatDataSimulasi
                          ? 'border-[var(--brand-primary)] bg-white dark:bg-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          formData.muatDataSimulasi ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-slate-400'
                        }`}>
                          {formData.muatDataSimulasi && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Muat Data Contoh (Latihan)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">
                        Menyiapkan 3 contoh data warga dan kas awal agar Anda bisa langsung mencoba simulasi sebelum input data warga asli.
                      </p>
                    </div>

                    <div
                      onClick={() => updateField('muatDataSimulasi', false)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        !formData.muatDataSimulasi
                          ? 'border-[var(--brand-primary)] bg-white dark:bg-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          !formData.muatDataSimulasi ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-slate-400'
                        }`}>
                          {!formData.muatDataSimulasi && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Mulai Lembaran Kosong</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6">
                        Ruang kerja dimulai dalam keadaan bersih tanpa data dummy, siap untuk input warga nyata.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy & Ethics Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.setujuKetentuan}
                      onChange={(e) => updateField('setujuKetentuan', e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-600 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] mt-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Saya menyatakan data lingkungan ini sah, dan saya berkomitmen mengelola data kependudukan warga secara bertanggung jawab untuk kepentingan gotong royong dan ketertiban administrasi lingkungan.
                    </span>
                  </label>
                </div>

              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Batal
                </Link>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Lanjut ke Langkah {currentStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-7 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold rounded-xl shadow-md shadow-[var(--brand-ring)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mempersiapkan Ruang Kerja RT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Buat Akun RT & Buka Ruang Kerja</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

        </div>

      </div>

      {/* Trust & Support Footer Note */}
      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Butuh bantuan pengisian atau ingin impor data warga dari Excel?{' '}
        <a 
          href="https://wa.me/628978506111?text=Halo%20Admin%20Komuna%2C%20saya%20sedang%20mendaftar%20akun%20RT%20dan%20butuh%20bantuan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[var(--brand-primary)] font-semibold hover:underline"
        >
          Hubungi Tim Komuna via WhatsApp
        </a>
      </div>

    </main>
  );
}
