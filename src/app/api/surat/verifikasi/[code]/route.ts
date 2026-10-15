import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: 'Kode verifikasi tidak ditemukan' }, { status: 400 });
    }

    const surat = await db.suratPengantar.findUnique({
      where: { kodeVerifikasi: code },
      include: {
        anggota: {
          select: {
            nama: true,
            noRumah: true
          }
        }
      }
    });

    if (!surat) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Surat tidak terdaftar atau kode verifikasi tidak valid' 
      }, { status: 404 });
    }

    // Mask NIK for public verification privacy (e.g., 337409******0001)
    const maskNik = (nikStr: string | null) => {
      if (!nikStr || nikStr.length < 8) return nikStr;
      return nikStr.substring(0, 6) + '******' + nikStr.substring(nikStr.length - 4);
    };

    const isExpired = surat.berlakuHingga ? new Date() > new Date(surat.berlakuHingga) : false;

    return NextResponse.json({
      valid: true,
      data: {
        nomorSurat: surat.nomorSurat,
        judulSurat: surat.judulSurat,
        jenisSurat: surat.jenisSurat,
        namaWarga: surat.namaWarga,
        nikMasked: maskNik(surat.nik),
        alamat: surat.alamat,
        keperluan: surat.keperluan,
        keteranganTambahan: surat.keteranganTambahan,
        tanggalSurat: surat.tanggalSurat,
        berlakuHingga: surat.berlakuHingga,
        isExpired,
        status: surat.status,
        namaPenandatangan: surat.namaPenandatangan,
        jabatanPenandatangan: surat.jabatanPenandatangan,
        kotaSurat: surat.kotaSurat,
        createdAt: surat.createdAt
      }
    });
  } catch (error) {
    console.error('Failed to verify surat:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memverifikasi surat' }, { status: 500 });
  }
}
