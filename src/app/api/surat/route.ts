import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const jenis = searchParams.get('jenis') || '';

    // Fetch config for RT/RW format
    const config = await db.pengaturanAplikasi.findFirst();
    const namaRt = config?.namaRt || 'RT 04';

    // Calculate Next Letter Number
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const romanMonth = ROMAN_MONTHS[currentMonthIdx];

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearCount = await db.suratPengantar.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const nextUrut = yearCount + 1;
    const formattedUrut = String(nextUrut).padStart(3, '0');
    const cleanRt = namaRt.replace(/\s+/g, '.');
    const nextNomorSurat = `${formattedUrut}/${cleanRt}/${romanMonth}/${currentYear}`;

    // Filter query
    const whereClause: any = {};
    if (jenis && jenis !== 'all') {
      whereClause.jenisSurat = jenis;
    }
    if (search.trim()) {
      whereClause.OR = [
        { namaWarga: { contains: search, mode: 'insensitive' } },
        { nomorSurat: { contains: search, mode: 'insensitive' } },
        { keperluan: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } }
      ];
    }

    const list = await db.suratPengantar.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        anggota: {
          select: {
            id: true,
            nama: true,
            noRumah: true,
            noHp: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: list,
      nextNomorSurat,
      nextUrut,
      totalSurat: list.length
    });
  } catch (error) {
    console.error('Failed to fetch SuratPengantar:', error);
    return NextResponse.json({ error: 'Gagal mengambil data surat pengantar' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      jenisSurat,
      judulSurat,
      anggotaId,
      namaWarga,
      nik,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      pekerjaan,
      statusPerkawinan,
      alamat,
      keperluan,
      keteranganTambahan,
      tanggalSurat,
      berlakuHingga,
      namaPenandatangan,
      jabatanPenandatangan,
      kotaSurat,
      nomorSuratCustom
    } = body;

    if (!namaWarga || !alamat || !keperluan) {
      return NextResponse.json(
        { error: 'Nama Warga, Alamat, dan Keperluan surat wajib diisi' },
        { status: 400 }
      );
    }

    // Determine Nomor Surat
    let nomorSurat = nomorSuratCustom?.trim();
    const now = tanggalSurat ? new Date(tanggalSurat) : new Date();
    const currentYear = now.getFullYear();
    const romanMonth = ROMAN_MONTHS[now.getMonth()];

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearCount = await db.suratPengantar.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const nextUrut = yearCount + 1;

    if (!nomorSurat) {
      const config = await db.pengaturanAplikasi.findFirst();
      const namaRt = config?.namaRt || 'RT 04';
      const cleanRt = namaRt.replace(/\s+/g, '.');
      nomorSurat = `${String(nextUrut).padStart(3, '0')}/${cleanRt}/${romanMonth}/${currentYear}`;
    }

    // Default 30 days validity
    const validUntil = berlakuHingga ? new Date(berlakuHingga) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create Surat Record
    const created = await db.suratPengantar.create({
      data: {
        nomorSurat,
        nomorUrut: nextUrut,
        jenisSurat: jenisSurat || 'ktp_kk',
        judulSurat: judulSurat || 'SURAT PENGANTAR',
        anggotaId: anggotaId || null,
        namaWarga,
        nik: nik || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        jenisKelamin: jenisKelamin || null,
        agama: agama || null,
        pekerjaan: pekerjaan || null,
        statusPerkawinan: statusPerkawinan || null,
        alamat,
        keperluan,
        keteranganTambahan: keteranganTambahan || null,
        tanggalSurat: now,
        berlakuHingga: validUntil,
        namaPenandatangan: namaPenandatangan || 'Ketua RT',
        jabatanPenandatangan: jabatanPenandatangan || 'Ketua RT',
        kotaSurat: kotaSurat || 'Semarang',
        status: 'aktif',
        dibuatOleh: 'Admin RT'
      }
    });

    // If anggotaId exists, update resident's biodata to enrich master data
    if (anggotaId) {
      try {
        await db.anggota.update({
          where: { id: anggotaId },
          data: {
            nik: nik || undefined,
            tempatLahir: tempatLahir || undefined,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
            jenisKelamin: jenisKelamin || undefined,
            agama: agama || undefined,
            pekerjaan: pekerjaan || undefined,
            statusPerkawinan: statusPerkawinan || undefined
          }
        });
      } catch (err) {
        console.warn('Failed to update Anggota biodata:', err);
      }
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Failed to create SuratPengantar:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nomor surat sudah pernah digunakan, gunakan nomor lain' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menerbitkan surat pengantar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID surat wajib disertakan' }, { status: 400 });
    }

    await db.suratPengantar.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Surat pengantar berhasil dihapus dari arsip' });
  } catch (error) {
    console.error('Failed to delete SuratPengantar:', error);
    return NextResponse.json({ error: 'Gagal menghapus surat' }, { status: 500 });
  }
}
