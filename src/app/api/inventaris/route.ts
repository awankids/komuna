import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SEED_INVENTARIS = [
  {
    kodeBarang: 'AST-TND-01',
    namaBarang: 'Tenda Terop Besi Pipa 4 x 6 Meter',
    kategori: 'tenda_kursi',
    jumlah: 2,
    satuan: 'unit',
    kondisiBaik: 2,
    kondisiRusak: 0,
    lokasiSimpan: 'Gudang Balai RT',
    tahunPengadaan: 2024,
    sumberPerolehan: 'Kas RT',
    statusTahunIni: 'tetap',
    keterangan: 'Lengkap dengan terpal atap biru dan tirai samping'
  },
  {
    kodeBarang: 'AST-KRS-02',
    namaBarang: 'Kursi Lipat Chitose Busa Hitam',
    kategori: 'tenda_kursi',
    jumlah: 100,
    satuan: 'buah',
    kondisiBaik: 94,
    kondisiRusak: 6,
    lokasiSimpan: 'Gudang Balai RT',
    tahunPengadaan: 2024,
    sumberPerolehan: 'Swadaya Warga',
    statusTahunIni: 'tetap',
    keterangan: '6 buah perlu diservis las kaki penyangga'
  },
  {
    kodeBarang: 'AST-SND-03',
    namaBarang: 'Sound System Wireless Portable 15 Inch + 2 Mic',
    kategori: 'elektronik_sound',
    jumlah: 1,
    satuan: 'set',
    kondisiBaik: 1,
    kondisiRusak: 0,
    lokasiSimpan: 'Rumah Ketua RT',
    tahunPengadaan: 2026,
    sumberPerolehan: 'Kas RT',
    statusTahunIni: 'bertambah_baru',
    keterangan: 'Pengadaan baru tahun berjalan untuk rapat warga dan tirakatan'
  },
  {
    kodeBarang: 'AST-RMP-04',
    namaBarang: 'Mesin Potong Rumput Dorong 4-Tak',
    kategori: 'kebersihan',
    jumlah: 2,
    satuan: 'unit',
    kondisiBaik: 1,
    kondisiRusak: 1,
    lokasiSimpan: 'Pos Ronda Utama',
    tahunPengadaan: 2025,
    sumberPerolehan: 'Kas RT',
    statusTahunIni: 'perbaikan',
    keterangan: '1 unit sedang diservis karburator di bengkel'
  },
  {
    kodeBarang: 'AST-PMP-05',
    namaBarang: 'Pompa Air Celup Submersible Banjir 2 Inch',
    kategori: 'kebersihan',
    jumlah: 1,
    satuan: 'unit',
    kondisiBaik: 1,
    kondisiRusak: 0,
    lokasiSimpan: 'Pos Ronda Utama',
    tahunPengadaan: 2026,
    sumberPerolehan: 'Bantuan Kelurahan',
    statusTahunIni: 'bertambah_baru',
    keterangan: 'Siaga darurat genangan air musim penghujan'
  },
  {
    kodeBarang: 'AST-TGG-06',
    namaBarang: 'Tangga Lipat Aluminium Teleskopik 3.8 Meter',
    kategori: 'peralatan',
    jumlah: 1,
    satuan: 'unit',
    kondisiBaik: 1,
    kondisiRusak: 0,
    lokasiSimpan: 'Gudang Balai RT',
    tahunPengadaan: 2025,
    sumberPerolehan: 'Kas RT',
    statusTahunIni: 'tetap',
    keterangan: 'Untuk perbaikan lampu jalan dan pasang umbul-umbul'
  },
  {
    kodeBarang: 'AST-CKL-07',
    namaBarang: 'Set Cangkul, Sekop, & Gerobak Sorong Artco',
    kategori: 'kebersihan',
    jumlah: 6,
    satuan: 'set',
    kondisiBaik: 5,
    kondisiRusak: 1,
    lokasiSimpan: 'Gudang Balai RT',
    tahunPengadaan: 2024,
    sumberPerolehan: 'Swadaya Warga',
    statusTahunIni: 'tetap',
    keterangan: 'Perlengkapan kerja bakti rutin warga'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search')?.toLowerCase() || '';

    // Auto-seed if empty
    const count = await db.inventarisAset.count();
    if (count === 0) {
      for (const item of SEED_INVENTARIS) {
        await db.inventarisAset.create({ data: item });
      }
    }

    const where: any = {};
    if (kategori && kategori !== 'all') {
      where.kategori = kategori;
    }

    let items = await db.inventarisAset.findMany({
      where,
      include: {
        peminjaman: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (search) {
      items = items.filter(i => 
        i.namaBarang.toLowerCase().includes(search) ||
        (i.kodeBarang && i.kodeBarang.toLowerCase().includes(search)) ||
        (i.lokasiSimpan && i.lokasiSimpan.toLowerCase().includes(search))
      );
    }

    // Calculate Summary Stats
    const totalJenis = items.length;
    let totalUnit = 0;
    let totalBaik = 0;
    let totalRusak = 0;
    let bertambahTahunIni = 0;

    items.forEach(i => {
      totalUnit += i.jumlah;
      totalBaik += i.kondisiBaik;
      totalRusak += i.kondisiRusak;
      if (i.statusTahunIni === 'bertambah_baru') {
        bertambahTahunIni += i.jumlah;
      }
    });

    return NextResponse.json({
      data: items,
      summary: {
        totalJenis,
        totalUnit,
        totalBaik,
        totalRusak,
        bertambahTahunIni
      }
    });
  } catch (error: any) {
    console.error('Error fetching inventaris:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat inventaris' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      kodeBarang, 
      namaBarang, 
      kategori, 
      jumlah, 
      satuan, 
      kondisiBaik, 
      kondisiRusak, 
      lokasiSimpan, 
      tahunPengadaan, 
      sumberPerolehan, 
      statusTahunIni, 
      keterangan 
    } = body;

    if (!namaBarang) {
      return NextResponse.json({ error: 'Nama barang wajib diisi' }, { status: 400 });
    }

    const newItem = await db.inventarisAset.create({
      data: {
        kodeBarang: kodeBarang || `AST-${Date.now().toString().slice(-4)}`,
        namaBarang,
        kategori: kategori || 'peralatan',
        jumlah: Number(jumlah) || 1,
        satuan: satuan || 'unit',
        kondisiBaik: Number(kondisiBaik) >= 0 ? Number(kondisiBaik) : Number(jumlah) || 1,
        kondisiRusak: Number(kondisiRusak) || 0,
        lokasiSimpan: lokasiSimpan || 'Gudang Balai RT',
        tahunPengadaan: Number(tahunPengadaan) || new Date().getFullYear(),
        sumberPerolehan: sumberPerolehan || 'Kas RT',
        statusTahunIni: statusTahunIni || 'tetap',
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventaris:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan inventaris' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID inventaris wajib disertakan' }, { status: 400 });
    }

    if (updateData.jumlah !== undefined) updateData.jumlah = Number(updateData.jumlah);
    if (updateData.kondisiBaik !== undefined) updateData.kondisiBaik = Number(updateData.kondisiBaik);
    if (updateData.kondisiRusak !== undefined) updateData.kondisiRusak = Number(updateData.kondisiRusak);
    if (updateData.tahunPengadaan !== undefined) updateData.tahunPengadaan = Number(updateData.tahunPengadaan);

    const updated = await db.inventarisAset.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating inventaris:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui inventaris' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID inventaris wajib disertakan' }, { status: 400 });
    }

    await db.inventarisAset.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Inventaris berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting inventaris:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus inventaris' }, { status: 500 });
  }
}
