'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  ShieldCheck, 
  Building2,
  ExternalLink,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface VerifiedData {
  nomorSurat: string;
  judulSurat: string;
  jenisSurat: string;
  namaWarga: string;
  nikMasked: string | null;
  alamat: string;
  keperluan: string;
  keteranganTambahan: string | null;
  tanggalSurat: string;
  berlakuHingga: string | null;
  isExpired: boolean;
  status: string;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  kotaSurat: string;
  createdAt: string;
}

export default function VerifikasiSuratPage() {
  const params = useParams();
  const code = params?.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{
    valid: boolean;
    data?: VerifiedData;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!code) return;

    const verify = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/surat/verifikasi/${code}`);
        const json = await res.json();
        setResult(json);
      } catch (err) {
        setResult({
          valid: false,
          message: 'Gagal terhubung ke server verifikasi dokumen'
        });
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [code]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-xl mx-auto w-full my-auto space-y-6">
        
        {/* Header App Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-[var(--brand-primary)] text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Sistem Verifikasi Digital Komuna</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Verifikasi Keaslian Surat
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Pemeriksaan validitas dokumen dan legalitas tanda tangan pengurus RT
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Memeriksa keaslian dokumen...</p>
          </div>
        )}

        {/* Error / Invalid State */}
        {!isLoading && (!result || !result.valid || !result.data) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Dokumen Tidak Ditemukan</h2>
              <p className="text-xs text-slate-400 font-medium">
                {result?.message || 'Kode verifikasi tidak terdaftar pada basis data resmi RT. Dokumen ini berisiko tidak valid atau palsu.'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 font-mono">
              Token ID: {code}
            </div>
          </div>
        )}

        {/* Valid State */}
        {!isLoading && result?.valid && result.data && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden text-left space-y-0">
            
            {/* Status Banner */}
            <div className={`p-6 border-b flex items-start gap-4 ${
              result.data.isExpired
                ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                result.data.isExpired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {result.data.isExpired ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  result.data.isExpired ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {result.data.isExpired ? 'Masa Berlaku Habis' : 'Dokumen Asli & Sah'}
                </span>
                <h2 className="text-base font-bold text-slate-800 pt-1">
                  {result.data.isExpired
                    ? 'Surat Resmi Telah Melewati Masa Berlaku'
                    : 'Surat Terdaftar Resmi di Database RT'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Diterbitkan oleh Pengurus RT setempat dengan legalitas sah.
                </p>
              </div>
            </div>

            {/* Document Details Table */}
            <div className="p-6 space-y-4 text-xs divide-y divide-slate-100">
              
              <div className="pb-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Nomor Surat:</span>
                <span className="font-bold text-slate-800 font-mono text-right">{result.data.nomorSurat}</span>
              </div>

              <div className="py-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Perihal Dokumen:</span>
                <span className="font-bold text-slate-800 text-right">{result.data.judulSurat}</span>
              </div>

              <div className="py-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Nama Pemohon:</span>
                <span className="font-bold text-slate-800 text-right">{result.data.namaWarga}</span>
              </div>

              {result.data.nikMasked && (
                <div className="py-3 flex justify-between items-start">
                  <span className="text-slate-400 font-semibold">NIK (Tersensor):</span>
                  <span className="font-mono font-bold text-slate-700 text-right">{result.data.nikMasked}</span>
                </div>
              )}

              <div className="py-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Alamat Domisili:</span>
                <span className="font-semibold text-slate-700 text-right max-w-[240px]">{result.data.alamat}</span>
              </div>

              <div className="py-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Keperluan / Tujuan:</span>
                <span className="font-bold text-[var(--brand-primary)] text-right max-w-[240px]">{result.data.keperluan}</span>
              </div>

              <div className="py-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Tanggal Diterbitkan:</span>
                <span className="font-semibold text-slate-700 text-right">{formatDate(result.data.tanggalSurat)}</span>
              </div>

              {result.data.berlakuHingga && (
                <div className="py-3 flex justify-between items-start">
                  <span className="text-slate-400 font-semibold">Berlaku Sampai:</span>
                  <span className={`font-semibold text-right ${result.data.isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                    {formatDate(result.data.berlakuHingga)}
                  </span>
                </div>
              )}

              <div className="pt-3 flex justify-between items-start">
                <span className="text-slate-400 font-semibold">Penandatangan Resmi:</span>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{result.data.namaPenandatangan}</p>
                  <p className="text-[11px] text-slate-400">{result.data.jabatanPenandatangan} ({result.data.kotaSurat})</p>
                </div>
              </div>

            </div>

            {/* Footer Notice */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center space-y-1">
              <p>
                Dokumen ini diverifikasi secara real-time melalui sistem informasi kependudukan warga <strong>komuna.id</strong>.
              </p>
            </div>

          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[var(--brand-primary)] transition"
          >
            <span>Buka Beranda Komuna</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      <footer className="text-center text-[11px] text-slate-400 pt-6">
        &copy; {new Date().getFullYear()} komuna.id • Transparan, Terpadu, Kebersamaan
      </footer>
    </div>
  );
}
