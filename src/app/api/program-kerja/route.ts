import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SEED_PROKER = [
  {
    tahun: 2026,
    bidang: 'lingkungan',
    namaProgram: 'Kerja Bakti Rutin Triwulan & Pembersihan Saluran Air',
    targetBulan: 'Maret, Juni, Sept, Des 2026',
    anggaranRencana: 1200000,
    anggaranRealisasi: 1150000,
    status: 'terlaksana',
    persentase: 100,
    keteranganHasil: 'Terlaksana 4 kali putaran, lingkungan bebas banjir dan bebas jentik nyamuk DB'
  },
  {
    tahun: 2026,
    bidang: 'keamanan',
    namaProgram: 'Revitalisasi Pos Ronda & Pemasangan 4 Titik Kamera CCTV Online',
    targetBulan: 'April 2026',
    anggaranRencana: 4500000,
    anggaranRealisasi: 4250000,
    status: 'terlaksana',
    persentase: 100,
    keteranganHasil: 'Pos ronda diperbaiki, 4 kamera CCTV online aktif memantau gerbang utama dan pertigaan'
  },
  {
    tahun: 2026,
    bidang: 'sosial_pkk',
    namaProgram: 'Pemeriksaan Kesehatan Posyandu Balita & Lansia Rutin PKK RT',
    targetBulan: 'Rutin Setiap Bulan',
    anggaranRencana: 2400000,
    anggaranRealisasi: 2100000,
    status: 'terlaksana',
    persentase: 100,
    keteranganHasil: 'Pemberian Makanan Tambahan (PMT) balita dan cek tensi/gula darah rutin lansia'
  },
  {
    tahun: 2026,
    bidang: 'kepemudaan',
    namaProgram: 'Peringatan Gebyar Kemerdekaan HUT RI Ke-81 & Pentas Seni Warga',
    targetBulan: 'Agustus 2026',
    anggaranRencana: 8000000,
    anggaranRealisasi: 8350000,
    status: 'terlaksana',
    persentase: 100,
    keteranganHasil: 'Lomba anak-anak, tirakatan malam 17-an, jalan santai bersama 120 warga RT'
  },
  {
    tahun: 2026,
    bidang: 'pembangunan',
    namaProgram: 'Pengecatan Marka Jalan & Penomoran Rumah Warga Seragam',
    targetBulan: 'Oktober 2026',
    anggaranRencana: 2000000,
    anggaranRealisasi: 1400000,
    status: 'berjalan',
    persentase: 70,
    keteranganHasil: 'Blok A dan B selesai dicat dan dipasang plat nomor baru, Blok C dan D sedang berjalan'
  },
  {
    tahun: 2026,
    bidang: 'keagamaan',
    namaProgram: 'Pengajian Rutin Keliling & Santunan Yatim Piatu',
    targetBulan: 'Bulan Ramadhan & Muharram',
    anggaranRencana: 1500000,
    anggaranRealisasi: 1500000,
    status: 'terlaksana',
    persentase: 100,
    keteranganHasil: 'Santunan tersalurkan ke 8 anak yatim di sekitar lingkungan'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const targetYear = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();
    const bidang = searchParams.get('bidang');

    // Auto seed if empty
    const count = await db.programKerja.count();
    if (count === 0) {
      for (const item of SEED_PROKER) {
        await db.programKerja.create({ data: item });
      }
    }

    const where: any = { tahun: targetYear };
    if (bidang && bidang !== 'all') {
      where.bidang = bidang;
    }

    const items = await db.programKerja.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    // Summary calculation
    const totalProgram = items.length;
    let totalTerlaksana = 0;
    let totalBerjalan = 0;
    let totalTertunda = 0;
    let totalAnggaranRencana = 0;
    let totalAnggaranRealisasi = 0;

    items.forEach(p => {
      totalAnggaranRencana += p.anggaranRencana;
      totalAnggaranRealisasi += p.anggaranRealisasi;
      if (p.status === 'terlaksana') totalTerlaksana += 1;
      else if (p.status === 'berjalan') totalBerjalan += 1;
      else totalTertunda += 1;
    });

    const persentaseKetercapaian = totalProgram > 0 
      ? Math.round((totalTerlaksana / totalProgram) * 100) 
      : 0;

    return NextResponse.json({
      tahun: targetYear,
      data: items,
      summary: {
        totalProgram,
        totalTerlaksana,
        totalBerjalan,
        totalTertunda,
        persentaseKetercapaian,
        totalAnggaranRencana,
        totalAnggaranRealisasi
      }
    });
  } catch (error: any) {
    console.error('Error fetching program kerja:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat program kerja' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tahun, 
      bidang, 
      namaProgram, 
      targetBulan, 
      anggaranRencana, 
      anggaranRealisasi, 
      status, 
      persentase, 
      keteranganHasil, 
      dokumentasiUrl 
    } = body;

    if (!namaProgram) {
      return NextResponse.json({ error: 'Nama program kerja wajib diisi' }, { status: 400 });
    }

    const item = await db.programKerja.create({
      data: {
        tahun: Number(tahun) || new Date().getFullYear(),
        bidang: bidang || 'lingkungan',
        namaProgram,
        targetBulan: targetBulan || null,
        anggaranRencana: Number(anggaranRencana) || 0,
        anggaranRealisasi: Number(anggaranRealisasi) || 0,
        status: status || 'terlaksana',
        persentase: Number(persentase) || 100,
        keteranganHasil: keteranganHasil || null,
        dokumentasiUrl: dokumentasiUrl || null
      }
    });

    return NextResponse.json({ success: true, data: item, message: 'Program kerja berhasil dicatat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating program kerja:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan program kerja' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID program kerja wajib disertakan' }, { status: 400 });
    }

    if (updateData.tahun !== undefined) updateData.tahun = Number(updateData.tahun);
    if (updateData.anggaranRencana !== undefined) updateData.anggaranRencana = Number(updateData.anggaranRencana);
    if (updateData.anggaranRealisasi !== undefined) updateData.anggaranRealisasi = Number(updateData.anggaranRealisasi);
    if (updateData.persentase !== undefined) updateData.persentase = Number(updateData.persentase);

    const updated = await db.programKerja.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating program kerja:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui program kerja' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID program kerja wajib disertakan' }, { status: 400 });
    }

    await db.programKerja.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Program kerja berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting program kerja:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus program kerja' }, { status: 500 });
  }
}
