'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { 
  FileText, 
  Printer, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  Copy, 
  ArrowRight, 
  FileCheck, 
  RotateCcw, 
  ShieldCheck, 
  Info,
  Clock,
  Layers,
  Sparkles,
  Download,
  Building2,
  Settings2,
  ChevronUp,
  ChevronDown,
  Save,
  Edit3
} from 'lucide-react';

interface AnggotaItem {
  id: string;
  nama: string;
  noRumah: string;
  noHp: string | null;
  nik?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  statusPerkawinan?: string | null;
  statusKeluarga?: string;
}

interface PengurusSignatory {
  id: string;
  nama: string;
  jabatan: string;
  statusAktif: boolean;
}

interface SuratItem {
  id: string;
  nomorSurat: string;
  nomorUrut: number;
  jenisSurat: string;
  judulSurat: string;
  anggotaId: string | null;
  namaWarga: string;
  nik: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string | null;
  agama: string | null;
  pekerjaan: string | null;
  statusPerkawinan: string | null;
  alamat: string;
  keperluan: string;
  keteranganTambahan: string | null;
  tanggalSurat: string;
  berlakuHingga: string | null;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  kotaSurat: string;
  kodeVerifikasi: string;
  status: string;
  createdAt: string;
}

// 8 Template Surat Preset
const TEMPLATES = [
  {
    id: 'ktp_kk',
    name: 'Pengantar KTP / KK',
    title: 'SURAT PENGANTAR KTP / KK',
    keperluanDefault: 'Permohonan penerbitan e-KTP baru / perpanjangan Kartu Keluarga (KK) di Kelurahan.',
    keteranganDefault: 'Warga tersebut di atas adalah benar penduduk tetap di lingkungan RT kami.'
  },
  {
    id: 'skck',
    name: 'Pengantar SKCK',
    title: 'SURAT PENGANTAR SKCK',
    keperluanDefault: 'Persyaratan pengurusan Surat Keterangan Catatan Kepolisian (SKCK) di Polsek / Polres untuk keperluan melamar pekerjaan.',
    keteranganDefault: 'Selama bertempat tinggal di lingkungan kami, warga tersebut berkelakuan baik dan tidak pernah terlibat tindak pidana.'
  },
  {
    id: 'domisili',
    name: 'Keterangan Domisili',
    title: 'SURAT KETERANGAN DOMISILI',
    keperluanDefault: 'Surat keterangan domisili tinggal sementara untuk kelengkapan administrasi perbankan / pekerjaan / sekolah.',
    keteranganDefault: 'Yang bersangkutan benar saat ini bertempat tinggal dan berdomisili di lingkungan kami.'
  },
  {
    id: 'sku',
    name: 'Keterangan Usaha (SKU)',
    title: 'SURAT KETERANGAN USAHA',
    keperluanDefault: 'Keterangan izin usaha mikro dan pengajuan permodalan / Kredit Usaha Rakyat (KUR) di Bank.',
    keteranganDefault: 'Menerangkan bahwa yang bersangkutan benar memiliki dan menjalankan kegiatan usaha di wilayah RT kami.'
  },
  {
    id: 'belum_nikah',
    name: 'Keterangan Belum Menikah',
    title: 'SURAT KETERANGAN BELUM MENIKAH',
    keperluanDefault: 'Persyaratan administrasi pendaftaran pernikahan di Kantor Urusan Agama (KUA) / Disdukcapil.',
    keteranganDefault: 'Berdasarkan catatan kependudukan kami, warga tersebut hingga saat ini berstatus belum pernah menikah (Lajang).'
  },
  {
    id: 'kematian',
    name: 'Keterangan Kematian',
    title: 'SURAT KETERANGAN KEMATIAN',
    keperluanDefault: 'Pengurusan Akta Kematian di Disdukcapil dan klaim santunan duka / asuransi.',
    keteranganDefault: 'Menerangkan bahwa nama tersebut telah meninggal dunia di kediamannya.'
  },
  {
    id: 'keramaian',
    name: 'Izin Keramaian Warga',
    title: 'SURAT PENGANTAR IZIN KERAMAIAN',
    keperluanDefault: 'Permohonan izin keramaian / penggunaan fasilitas jalan lingkungan untuk penyelenggaraan acara hajatan keluarga.',
    keteranganDefault: 'Kegiatan diselenggarakan dengan tetap menjaga ketertiban, keamanan, dan kebersihan lingkungan sekitar.'
  },
  {
    id: 'kustom',
    name: 'Surat Kustom / Bebas',
    title: 'SURAT KETERANGAN PENGANTAR',
    keperluanDefault: 'Untuk keperluan pengurusan administratif di instansi terkait.',
    keteranganDefault: 'Demikian surat keterangan pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.'
  }
];

export default function SuratPengantarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buat' | 'arsip'>('buat');

  // Master Data
  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>([]);
  const [pengurusList, setPengurusList] = useState<PengurusSignatory[]>([]);
  const [suratList, setSuratList] = useState<SuratItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // App Config
  const [appConfig, setAppConfig] = useState({
    namaApp: 'komuna.id',
    namaRt: 'RT 04',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    kotaWilayah: 'Semarang',
  });

  // Next Auto Numbering
  const [autoNomorSurat, setAutoNomorSurat] = useState('');

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState('ktp_kk');
  const [formData, setFormData] = useState({
    nomorSurat: '',
    judulSurat: 'SURAT PENGANTAR KTP / KK',
    anggotaId: '',
    namaWarga: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    pekerjaan: 'Karyawan Swasta',
    statusPerkawinan: 'Belum Kawin',
    alamat: 'Jl. Klipang Blok A No. 04',
    keperluan: 'Permohonan penerbitan e-KTP baru / perpanjangan Kartu Keluarga (KK) di Kelurahan.',
    keteranganTambahan: 'Warga tersebut di atas adalah benar penduduk tetap di lingkungan RT kami.',
    tanggalSurat: new Date().toISOString().split('T')[0],
    namaPenandatangan: 'Bpk. Bambang Sutrisno',
    jabatanPenandatangan: 'Ketua RT 04',
    kotaSurat: 'Semarang',
    kodeVerifikasi: 'KOMUNA-' + Math.random().toString(36).substring(2, 9).toUpperCase()
  });

  // Custom Kop & Redaksi State
  const [isCustomKopOpen, setIsCustomKopOpen] = useState(false);
  const [kopConfig, setKopConfig] = useState({
    baris1: '',
    baris2: '',
    baris3: '',
  });

  const [redaksiConfig, setRedaksiConfig] = useState({
    kalimatPembuka: '',
    kalimatKeterangan: '',
    labelKeperluan: 'Maksud / Keperluan Surat:',
    kalimatPenutup: 'Demikian surat pengantar ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh instansi yang bersangkutan.'
  });

  // Filter Arsip
  const [searchArsip, setSearchArsip] = useState('');
  const [filterJenisArsip, setFilterJenisArsip] = useState('all');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [anggotaRes, pengurusRes, suratRes, configRes] = await Promise.all([
        fetch('/api/anggota'),
        fetch('/api/pengurus'),
        fetch('/api/surat'),
        fetch('/api/config')
      ]);

      if (anggotaRes.ok) {
        const json = await anggotaRes.json();
        setAnggotaList(json.data || json || []);
      }

      if (configRes.ok) {
        const json = await configRes.json();
        setAppConfig(prev => ({ ...prev, ...json }));
        setFormData(prev => ({ 
          ...prev, 
          kotaSurat: json.kotaWilayah || prev.kotaSurat,
          jabatanPenandatangan: `Ketua ${json.namaRt || 'RT 04'}`
        }));

        const defaultKop1 = `PAGUYUBAN RUKUN TETANGGA ${(json.namaRt || 'RT 04').toUpperCase()}`;
        const defaultKop2 = `KELURAHAN WILAYAH KOTA ${(json.kotaWilayah || 'Semarang').toUpperCase()}`;
        const defaultKop3 = `Alamat Sekretariat: ${json.namaRt || 'RT 04'}, Kota ${json.kotaWilayah || 'Semarang'}. Kontak Layanan Warga: 0812-3456-7890`;

        const savedKop = localStorage.getItem('komuna_custom_kop');
        if (savedKop) {
          try {
            setKopConfig(JSON.parse(savedKop));
          } catch (e) {
            setKopConfig({ baris1: defaultKop1, baris2: defaultKop2, baris3: defaultKop3 });
          }
        } else {
          setKopConfig({ baris1: defaultKop1, baris2: defaultKop2, baris3: defaultKop3 });
        }

        const savedRedaksi = localStorage.getItem('komuna_custom_redaksi');
        if (savedRedaksi) {
          try {
            setRedaksiConfig(JSON.parse(savedRedaksi));
          } catch (e) {}
        } else {
          setRedaksiConfig(prev => ({
            ...prev,
            kalimatPembuka: `Yang bertanda tangan di bawah ini, Pengurus ${json.namaRt || 'RT 04'}, Kota ${json.kotaWilayah || 'Semarang'}, dengan ini menerangkan bahwa:`,
            kalimatKeterangan: `Bahwa orang tersebut di atas adalah benar-benar warga yang bertempat tinggal di lingkungan kami dan tercatat sebagai penduduk di ${json.namaRt || 'RT 04'}.`,
            labelKeperluan: 'Maksud / Keperluan Surat:',
            kalimatPenutup: 'Demikian surat pengantar ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh instansi yang bersangkutan.'
          }));
        }
      }

      if (pengurusRes.ok) {
        const json = await pengurusRes.json();
        const pList: PengurusSignatory[] = json.data || [];
        setPengurusList(pList);
        const ketua = json.signatures?.ketuaRt || pList.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama;
        if (ketua) {
          setFormData(prev => ({ ...prev, namaPenandatangan: ketua }));
        }
      }

      if (suratRes.ok) {
        const json = await suratRes.json();
        setSuratList(json.data || []);
        if (json.nextNomorSurat) {
          setAutoNomorSurat(json.nextNomorSurat);
          setFormData(prev => ({ ...prev, nomorSurat: json.nextNomorSurat }));
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data pendukung surat', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Template Selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        judulSurat: tmpl.title,
        keperluan: tmpl.keperluanDefault,
        keteranganTambahan: tmpl.keteranganDefault
      }));
    }
  };

  // Save Custom Kop & Redaksi to LocalStorage
  const handleSaveCustomKopAndRedaksi = () => {
    localStorage.setItem('komuna_custom_kop', JSON.stringify(kopConfig));
    localStorage.setItem('komuna_custom_redaksi', JSON.stringify(redaksiConfig));
    showToast('Kustomisasi Kop & Redaksi berhasil disimpan ke browser ini', 'success');
  };

  // Reset Kop & Redaksi to Default
  const handleResetKopAndRedaksi = () => {
    const defaultKop1 = `PAGUYUBAN RUKUN TETANGGA ${(appConfig.namaRt || 'RT 04').toUpperCase()}`;
    const defaultKop2 = `KELURAHAN WILAYAH KOTA ${(appConfig.kotaWilayah || 'Semarang').toUpperCase()}`;
    const defaultKop3 = `Alamat Sekretariat: ${appConfig.namaRt || 'RT 04'}, Kota ${appConfig.kotaWilayah || 'Semarang'}. Kontak Layanan Warga: 0812-3456-7890`;

    const defKop = { baris1: defaultKop1, baris2: defaultKop2, baris3: defaultKop3 };
    const defRedaksi = {
      kalimatPembuka: `Yang bertanda tangan di bawah ini, Pengurus ${appConfig.namaRt || 'RT 04'}, Kota ${appConfig.kotaWilayah || 'Semarang'}, dengan ini menerangkan bahwa:`,
      kalimatKeterangan: `Bahwa orang tersebut di atas adalah benar-benar warga yang bertempat tinggal di lingkungan kami dan tercatat sebagai penduduk di ${appConfig.namaRt || 'RT 04'}.`,
      labelKeperluan: 'Maksud / Keperluan Surat:',
      kalimatPenutup: 'Demikian surat pengantar ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh instansi yang bersangkutan.'
    };

    setKopConfig(defKop);
    setRedaksiConfig(defRedaksi);
    localStorage.removeItem('komuna_custom_kop');
    localStorage.removeItem('komuna_custom_redaksi');
    showToast('Kop & Redaksi dikembalikan ke pengaturan default');
  };

  // Handle Resident Selection
  const handleSelectWarga = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData(prev => ({ ...prev, anggotaId: '' }));
      return;
    }

    const warga = anggotaList.find(w => w.id === selectedId);
    if (warga) {
      setFormData(prev => ({
        ...prev,
        anggotaId: warga.id,
        namaWarga: warga.nama,
        nik: warga.nik || prev.nik,
        tempatLahir: warga.tempatLahir || prev.tempatLahir,
        tanggalLahir: warga.tanggalLahir ? warga.tanggalLahir.split('T')[0] : prev.tanggalLahir,
        jenisKelamin: warga.jenisKelamin || prev.jenisKelamin,
        agama: warga.agama || prev.agama,
        pekerjaan: warga.pekerjaan || prev.pekerjaan,
        statusPerkawinan: warga.statusPerkawinan || prev.statusPerkawinan,
        alamat: warga.noRumah ? `${appConfig.namaRt}, No. Rumah ${warga.noRumah}` : prev.alamat
      }));
    }
  };

  // Submit Save & Register
  const handleSaveSurat = async () => {
    if (!formData.namaWarga.trim() || !formData.keperluan.trim() || !formData.alamat.trim()) {
      showToast('Nama Warga, Alamat, dan Keperluan surat wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jenisSurat: selectedTemplate,
          nomorSuratCustom: formData.nomorSurat
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menerbitkan surat');

      showToast('Surat pengantar berhasil diterbitkan dan masuk ke Buku Register', 'success');
      
      // Update state with newly created token
      if (json.data?.kodeVerifikasi) {
        setFormData(prev => ({ ...prev, kodeVerifikasi: json.data.kodeVerifikasi }));
      }
      
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Terjadi kesalahan saat menerbitkan surat', 'error');
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy WhatsApp Broadcast Format
  const handleCopyWhatsApp = () => {
    const text = `*SURAT PENGANTAR ${appConfig.namaRt.toUpperCase()}*
Nomor: ${formData.nomorSurat}
Hal: ${formData.judulSurat}

Yth. Bpk/Ibu *${formData.namaWarga}*,
Surat pengantar RT Anda telah diterbitkan untuk keperluan:
👉 *${formData.keperluan}*

Penandatangan: ${formData.namaPenandatangan} (${formData.jabatanPenandatangan})
Tanggal: ${new Date(formData.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

Tautan Verifikasi Keabsahan Surat:
https://komuna-nu.vercel.app/verifikasi-surat/${formData.kodeVerifikasi}

_Silakan gunakan surat ini sebagaimana mestinya. Terima kasih._`;

    navigator.clipboard.writeText(text);
    showToast('Teks ringkasan surat berhasil disalin untuk WhatsApp', 'success');
  };

  // Load old letter into preview
  const handleLoadOldSurat = (item: SuratItem) => {
    setSelectedTemplate(item.jenisSurat);
    setFormData({
      nomorSurat: item.nomorSurat,
      judulSurat: item.judulSurat,
      anggotaId: item.anggotaId || '',
      namaWarga: item.namaWarga,
      nik: item.nik || '',
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir ? item.tanggalLahir.split('T')[0] : '',
      jenisKelamin: item.jenisKelamin || 'Laki-laki',
      agama: item.agama || 'Islam',
      pekerjaan: item.pekerjaan || 'Karyawan Swasta',
      statusPerkawinan: item.statusPerkawinan || 'Belum Kawin',
      alamat: item.alamat,
      keperluan: item.keperluan,
      keteranganTambahan: item.keteranganTambahan || '',
      tanggalSurat: item.tanggalSurat ? item.tanggalSurat.split('T')[0] : new Date().toISOString().split('T')[0],
      namaPenandatangan: item.namaPenandatangan,
      jabatanPenandatangan: item.jabatanPenandatangan,
      kotaSurat: item.kotaSurat,
      kodeVerifikasi: item.kodeVerifikasi
    });
    setActiveTab('buat');
    showToast(`Memuat data surat: ${item.nomorSurat}`);
  };

  // Delete old letter
  const handleDeleteSurat = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini dari buku register?')) return;
    try {
      const res = await fetch(`/api/surat?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Surat berhasil dihapus dari register');
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus surat', 'error');
    }
  };

  // Verification URL for QR Code
  const qrVerificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verifikasi-surat/${formData.kodeVerifikasi}`
    : `https://komuna-nu.vercel.app/verifikasi-surat/${formData.kodeVerifikasi}`;

  // Filtered register
  const filteredSurat = suratList.filter(s => {
    if (filterJenisArsip !== 'all' && s.jenisSurat !== filterJenisArsip) return false;
    if (!searchArsip.trim()) return true;
    const q = searchArsip.toLowerCase();
    return (
      s.namaWarga.toLowerCase().includes(q) ||
      s.nomorSurat.toLowerCase().includes(q) ||
      s.keperluan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border border-slate-200 bg-white text-slate-800 animate-in fade-in slide-in-from-top-4">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeMenu="Surat Pengantar" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {/* Print CSS Engine */}
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm 18mm;
              }
              body {
                background: white !important;
                color: black !important;
                font-family: 'Times New Roman', Times, serif !important;
              }
              .no-print, header, aside, nav, .sidebar-container, .mobile-navbar, button {
                display: none !important;
              }
              #print-surat {
                display: block !important;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .page-break {
                page-break-after: always;
              }
            }
          `}</style>

          {/* Desktop 24-inch fluid container */}
          <div className="no-print max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                      Layanan Surat Pengantar RT Online
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">
                      Penerbitan surat pengantar warga otomatis, pratinjau lembar resmi A4, dan verifikasi QR Code keabsahan dokumen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Buttons */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setActiveTab('buat')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'buat'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Surat Baru</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('arsip')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'arsip'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Buku Register ({suratList.length})</span>
                  </span>
                </button>
              </div>
            </div>

            {/* TAB 1: BUAT SURAT BARU & LIVE SIMULATOR */}
            {activeTab === 'buat' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-7 items-start">
                
                {/* LEFT COLUMN: 5 COLS - Form Builder & Template Picker */}
                <div className="lg:col-span-5 space-y-5 text-left">
                  
                  {/* Template Picker Pills */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                        Pilih Template Surat
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">{TEMPLATES.length} Pilihan</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleSelectTemplate(tmpl.id)}
                          className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                            selectedTemplate === tmpl.id
                              ? 'bg-orange-50 border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold shadow-xs'
                              : 'bg-slate-50/70 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <p className="line-clamp-2 leading-tight">{tmpl.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collapsible Custom Kop & Redaksi Accordion */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsCustomKopOpen(!isCustomKopOpen)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-orange-50 text-[var(--brand-primary)]">
                          <Settings2 className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span>Kustomisasi Kop & Redaksi Kata-Kata</span>
                            <span className="text-[10px] font-semibold text-[var(--brand-primary)] bg-orange-50 px-2 py-0.5 rounded-full">
                              Bisa Diedit
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Ubah 3 baris Kop Surat RT atau redaksi kalimat surat sesuai kebutuhan lingkungan
                          </p>
                        </div>
                      </div>
                      <div className="text-slate-400 p-1">
                        {isCustomKopOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isCustomKopOpen && (
                      <div className="p-5 pt-1 border-t border-slate-100 space-y-4 bg-slate-50/40">
                        {/* Section A: Kop Surat */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              Format 3 Baris Kop Surat Resmi
                            </span>
                            <span className="text-[10px] text-slate-400">Pratinjau otomatis berubah</span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Baris 1: Nama Lembaga / RT (Huruf Kapital)
                              </label>
                              <input
                                type="text"
                                value={kopConfig.baris1}
                                onChange={(e) => setKopConfig(prev => ({ ...prev, baris1: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                                placeholder="PAGUYUBAN RUKUN TETANGGA RT 04"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Baris 2: Kelurahan / Kecamatan / Wilayah
                              </label>
                              <input
                                type="text"
                                value={kopConfig.baris2}
                                onChange={(e) => setKopConfig(prev => ({ ...prev, baris2: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                                placeholder="KELURAHAN WILAYAH KOTA SEMARANG"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Baris 3: Alamat Sekretariat & Kontak Layanan
                              </label>
                              <input
                                type="text"
                                value={kopConfig.baris3}
                                onChange={(e) => setKopConfig(prev => ({ ...prev, baris3: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                                placeholder="Alamat Sekretariat: Balai RT 04. Kontak: 0812-..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section B: Redaksi Kata-Kata Isi Surat */}
                        <div className="space-y-3 pt-3 border-t border-slate-200/60">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            Redaksi Kalimat Isi Surat
                          </span>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Kalimat Pembuka
                              </label>
                              <textarea
                                rows={2}
                                value={redaksiConfig.kalimatPembuka}
                                onChange={(e) => setRedaksiConfig(prev => ({ ...prev, kalimatPembuka: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                                placeholder="Yang bertanda tangan di bawah ini, Pengurus RT..."
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Kalimat Keterangan Status Warga (di bawah tabel)
                              </label>
                              <textarea
                                rows={2}
                                value={redaksiConfig.kalimatKeterangan}
                                onChange={(e) => setRedaksiConfig(prev => ({ ...prev, kalimatKeterangan: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                                placeholder="Bahwa orang tersebut di atas adalah benar-benar warga yang bertempat tinggal di lingkungan kami..."
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Label Judul Box Keperluan
                              </label>
                              <input
                                type="text"
                                value={redaksiConfig.labelKeperluan}
                                onChange={(e) => setRedaksiConfig(prev => ({ ...prev, labelKeperluan: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                                placeholder="Maksud / Keperluan Surat:"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Kalimat Penutup
                              </label>
                              <textarea
                                rows={2}
                                value={redaksiConfig.kalimatPenutup}
                                onChange={(e) => setRedaksiConfig(prev => ({ ...prev, kalimatPenutup: e.target.value }))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                                placeholder="Demikian surat pengantar ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh instansi yang bersangkutan."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Save & Reset buttons */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={handleResetKopAndRedaksi}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reset ke Default</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveCustomKopAndRedaksi}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan Sebagai Default RT</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Builder Card */}
                  <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-600" />
                        Biodata Pemohon & Surat
                      </h3>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Auto-fill Siap
                      </span>
                    </div>

                    {/* Pilih Warga Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Pilih dari Database Warga
                      </label>
                      <select
                        value={formData.anggotaId}
                        onChange={handleSelectWarga}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                      >
                        <option value="">-- Ketik Manual atau Pilih Warga --</option>
                        {anggotaList.map((w) => {
                          const roleLabel = w.statusKeluarga === 'istri' ? ' - Istri' : w.statusKeluarga === 'anak' ? ' - Anak' : w.statusKeluarga === 'orang_tua' ? ' - Orang Tua' : w.statusKeluarga === 'kepala_keluarga' ? ' - Kepala Keluarga' : '';
                          return (
                            <option key={w.id} value={w.id}>
                              {w.nama} ({w.noRumah}{roleLabel})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Nomor Surat & Judul Surat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Nomor Surat Resmi
                        </label>
                        <input
                          type="text"
                          value={formData.nomorSurat}
                          onChange={(e) => setFormData(prev => ({ ...prev, nomorSurat: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder={autoNomorSurat}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Perihal Dokumen
                        </label>
                        <input
                          type="text"
                          value={formData.judulSurat}
                          onChange={(e) => setFormData(prev => ({ ...prev, judulSurat: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>

                    {/* Nama Warga & NIK */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Nama Lengkap Pemohon *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.namaWarga}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaWarga: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder="Bp. Joko Susanto"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          NIK (16 Digit)
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={formData.nik}
                          onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder="337409..."
                        />
                      </div>
                    </div>

                    {/* Tempat / Tgl Lahir */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={formData.tempatLahir}
                          onChange={(e) => setFormData(prev => ({ ...prev, tempatLahir: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder="Semarang"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={formData.tanggalLahir}
                          onChange={(e) => setFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>

                    {/* Jenis Kelamin, Agama, Pekerjaan */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Kelamin</label>
                        <select
                          value={formData.jenisKelamin}
                          onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                          className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Agama</label>
                        <select
                          value={formData.agama}
                          onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                          className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                        >
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Nikah</label>
                        <select
                          value={formData.statusPerkawinan}
                          onChange={(e) => setFormData(prev => ({ ...prev, statusPerkawinan: e.target.value }))}
                          className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                        >
                          <option value="Belum Kawin">Belum Kawin</option>
                          <option value="Kawin">Kawin</option>
                          <option value="Cerai Hidup">Cerai Hidup</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>
                    </div>

                    {/* Pekerjaan & Alamat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Pekerjaan</label>
                        <input
                          type="text"
                          value={formData.pekerjaan}
                          onChange={(e) => setFormData(prev => ({ ...prev, pekerjaan: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder="Karyawan Swasta"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Tempat Tinggal *</label>
                        <input
                          type="text"
                          required
                          value={formData.alamat}
                          onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                          placeholder="Jl. Klipang Blok A No. 04"
                        />
                      </div>
                    </div>

                    {/* Keperluan Surat */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Keperluan Surat Pengantar *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={formData.keperluan}
                        onChange={(e) => setFormData(prev => ({ ...prev, keperluan: e.target.value }))}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                        placeholder="Contoh: Permohonan SKCK untuk melamar pekerjaan"
                      />
                    </div>

                    {/* Pejabat Penandatangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-600">Pejabat Penandatangan</label>
                          {pengurusList.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  const p = pengurusList.find(x => x.nama === e.target.value);
                                  setFormData(prev => ({
                                    ...prev,
                                    namaPenandatangan: p?.nama || prev.namaPenandatangan,
                                    jabatanPenandatangan: p?.jabatan || prev.jabatanPenandatangan
                                  }));
                                }
                              }}
                              className="text-[10px] text-[var(--brand-primary)] font-bold bg-orange-50 rounded px-1.5 py-0.5 cursor-pointer outline-none"
                              value=""
                            >
                              <option value="">Ganti...</option>
                              {pengurusList.map(p => (
                                <option key={p.id} value={p.nama}>{p.jabatan}: {p.nama}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          type="text"
                          value={formData.namaPenandatangan}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaPenandatangan: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Surat</label>
                        <input
                          type="date"
                          value={formData.tanggalSurat}
                          onChange={(e) => setFormData(prev => ({ ...prev, tanggalSurat: e.target.value }))}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleCopyWhatsApp}
                        className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks WA</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveSurat}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Simpan ke Register</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePrint}
                          className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Dokumen A4</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

                {/* RIGHT COLUMN: 7 COLS - Live A4 Document Paper Simulator */}
                <div className="lg:col-span-7 flex flex-col items-center">
                  
                  <div className="w-full flex items-center justify-between pb-3 px-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-slate-600">
                      <Printer className="w-4 h-4 text-[var(--brand-primary)]" />
                      Pratinjau Kertas Cetak A4 (Live Simulator)
                    </span>
                    <span>Standar Kop Surat Resmi Kedinasan</span>
                  </div>

                  {/* ========================================================== */}
                  {/* LEMBAR KERTAS A4 SURAT PENGANTAR (PRINTABLE CONTAINER)     */}
                  {/* ========================================================== */}
                  <div
                    id="print-surat"
                    className="w-full max-w-[760px] bg-white rounded-2xl shadow-md border border-slate-200/80 p-8 sm:p-12 text-black leading-normal text-[13px] font-serif min-h-[920px] flex flex-col justify-between"
                  >
                    <div>
                      {/* Kop Surat Resmi */}
                      <div className="border-b-[3px] border-double border-black pb-3 text-center space-y-0.5">
                        <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-sans">
                          {kopConfig.baris1 || `PAGUYUBAN RUKUN TETANGGA ${appConfig.namaRt.toUpperCase()}`}
                        </h2>
                        <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase font-sans">
                          {kopConfig.baris2 || `KELURAHAN WILAYAH KOTA ${appConfig.kotaWilayah.toUpperCase()}`}
                        </h3>
                        <p className="text-[11px] font-sans text-gray-700 italic">
                          {kopConfig.baris3 || `Alamat Sekretariat: ${appConfig.namaRt}, Kota ${appConfig.kotaWilayah}. Kontak Layanan Warga: 0812-3456-7890`}
                        </p>
                      </div>

                      {/* Judul & Nomor Surat */}
                      <div className="text-center my-6 space-y-1">
                        <h1 className="text-base font-bold uppercase underline tracking-wider font-sans">
                          {formData.judulSurat}
                        </h1>
                        <p className="text-xs font-mono font-medium">
                          Nomor: {formData.nomorSurat || autoNomorSurat}
                        </p>
                      </div>

                      {/* Kalimat Pembuka */}
                      <div className="space-y-4 text-justify">
                        <p>
                          {redaksiConfig.kalimatPembuka || `Yang bertanda tangan di bawah ini, Pengurus ${appConfig.namaRt}, Kota ${appConfig.kotaWilayah}, dengan ini menerangkan bahwa:`}
                        </p>

                        {/* Tabel Biodata Pemohon */}
                        <div className="pl-4 sm:pl-6 space-y-1.5 font-sans text-[12px]">
                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Nama Lengkap</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7 font-bold uppercase">{formData.namaWarga || '...........................................'}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">NIK (KTP)</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7 font-mono font-semibold">{formData.nik || '...........................................'}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Tempat / Tgl. Lahir</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7">
                              {formData.tempatLahir ? `${formData.tempatLahir}, ` : ''}
                              {formData.tanggalLahir
                                ? new Date(formData.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                : '...........................................'}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Jenis Kelamin</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7">{formData.jenisKelamin}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Kewarganegaraan / Agama</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7">Indonesia (WNI) / {formData.agama}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Pekerjaan</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7">{formData.pekerjaan || '...........................................'}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Status Perkawinan</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7">{formData.statusPerkawinan}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-gray-700">Alamat Tempat Tinggal</span>
                            <span className="col-span-1">:</span>
                            <span className="col-span-7 font-medium">{formData.alamat || '...........................................'}</span>
                          </div>
                        </div>

                        {/* Paragraf Keterangan Pokok */}
                        <p className="pt-2">
                          {redaksiConfig.kalimatKeterangan || `Bahwa orang tersebut di atas adalah benar-benar warga yang bertempat tinggal di lingkungan kami dan tercatat sebagai penduduk di ${appConfig.namaRt}.`}
                        </p>

                        <div className="p-3 bg-gray-50 border border-gray-300 rounded font-sans text-xs space-y-1">
                          <p className="font-bold text-gray-800">{redaksiConfig.labelKeperluan || 'Maksud / Keperluan Surat:'}</p>
                          <p className="italic text-gray-900 leading-relaxed font-serif text-[13px]">
                            "{formData.keperluan}"
                          </p>
                        </div>

                        {formData.keteranganTambahan && (
                          <p className="text-[12px] italic text-gray-800">
                            Catatan: {formData.keteranganTambahan}
                          </p>
                        )}

                        <p>
                          {redaksiConfig.kalimatPenutup || 'Demikian surat pengantar ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh instansi yang bersangkutan.'}
                        </p>
                      </div>
                    </div>

                    {/* Section Tanda Tangan & QR Code Verifikasi */}
                    <div className="pt-10">
                      <div className="flex justify-between items-end">
                        
                        {/* Kiri: Tanda Tangan Pemohon & QR Code */}
                        <div className="space-y-3 text-center">
                          <p className="text-xs">Tanda Tangan Pemohon,</p>
                          <div className="h-14"></div>
                          <p className="font-bold underline text-xs uppercase">
                            ( {formData.namaWarga || '............................'} )
                          </p>
                          
                          {/* QR Code Container */}
                          <div className="flex items-center gap-2.5 pt-2 text-left bg-gray-50 p-2 rounded border border-gray-200">
                            <QRCodeSVG 
                              value={qrVerificationUrl}
                              size={52}
                              level="M"
                              includeMargin={false}
                            />
                            <div className="text-[9px] font-sans text-gray-600 leading-tight">
                              <p className="font-bold text-gray-800 flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Validasi Digital
                              </p>
                              <p>Pindai untuk cek keabsahan surat resmi ini.</p>
                              <p className="font-mono text-gray-400 mt-0.5">{formData.kodeVerifikasi}</p>
                            </div>
                          </div>
                        </div>

                        {/* Kanan: Tanda Tangan Pengurus RT */}
                        <div className="text-center w-56 space-y-1">
                          <p className="text-xs">
                            {formData.kotaSurat}, {new Date(formData.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="font-bold text-xs uppercase">
                            PENGURUS {appConfig.namaRt.toUpperCase()}
                          </p>
                          <p className="text-xs">{formData.jabatanPenandatangan}</p>
                          <div className="h-16 flex items-center justify-center">
                            <span className="text-[10px] text-gray-300 italic font-sans">[ Stempel RT ]</span>
                          </div>
                          <p className="font-bold underline text-xs">
                            ( {formData.namaPenandatangan || '............................'} )
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: BUKU REGISTER & ARSIP SURAT KELUAR */}
            {activeTab === 'arsip' && (
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-5 text-left">
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama warga, nomor surat, keperluan..."
                      value={searchArsip}
                      onChange={(e) => setSearchArsip(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={filterJenisArsip}
                      onChange={(e) => setFilterJenisArsip(e.target.value)}
                      className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                    >
                      <option value="all">Semua Jenis Surat</option>
                      {TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={fetchData}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      title="Refresh Data"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table of Archived Letters */}
                {filteredSurat.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">Belum ada surat pengantar yang terdaftar</p>
                    <p className="text-xs">Surat yang diterbitkan pada form akan otomatis diarsipkan di sini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">No. Surat</th>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Nama Pemohon</th>
                          <th className="py-3 px-4">Perihal / Jenis</th>
                          <th className="py-3 px-4">Keperluan</th>
                          <th className="py-3 px-4">Penandatangan</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSurat.map((surat) => (
                          <tr key={surat.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {surat.nomorSurat}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(surat.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                              {surat.namaWarga}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-[var(--brand-primary)] whitespace-nowrap">
                                {surat.judulSurat}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={surat.keperluan}>
                              {surat.keperluan}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {surat.namaPenandatangan}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleLoadOldSurat(surat)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-[var(--brand-primary)] bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                                  title="Lihat & Cetak Ulang"
                                >
                                  Buka & Cetak
                                </button>
                                <a
                                  href={`/verifikasi-surat/${surat.kodeVerifikasi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                  title="Halaman Verifikasi QR"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteSurat(surat.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Hapus dari Register"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

          </div>

        </main>

        <MobileNavBar />
      </div>

    </div>
  );
}
