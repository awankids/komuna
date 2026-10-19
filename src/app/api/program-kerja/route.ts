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
    const tahunParam = searchParams.get('tahun');
    const targetYear = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();
    const bidang = searchParams.get('bidang');

    const where: any = { 
      tahun: targetYear,
      komunitasId: tenant.komunitasId,
    };
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
    const tenant = await requireTenantContext();
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
        dokumentasiUrl: dokumentasiUrl || null,
        komunitasId: tenant.komunitasId,
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
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID program kerja wajib disertakan' }, { status: 400 });
    }

    const existing = await db.programKerja.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan di komunitas Anda' }, { status: 404 });
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
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID program kerja wajib disertakan' }, { status: 400 });
    }

    const existing = await db.programKerja.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan di komunitas Anda' }, { status: 404 });
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
