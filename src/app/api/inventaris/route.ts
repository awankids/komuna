import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search')?.toLowerCase() || '';

    const where: any = {
      komunitasId: tenant.komunitasId,
    };
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
    const tenant = await requireTenantContext();
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
        keterangan: keterangan || null,
        komunitasId: tenant.komunitasId,
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
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID inventaris wajib disertakan' }, { status: 400 });
    }

    const existing = await db.inventarisAset.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Inventaris tidak ditemukan di komunitas Anda' }, { status: 404 });
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
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID inventaris wajib disertakan' }, { status: 400 });
    }

    const existing = await db.inventarisAset.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Inventaris tidak ditemukan di komunitas Anda' }, { status: 404 });
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
