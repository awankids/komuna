import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET single hutang piutang detail with riwayat bayar
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const item = await db.hutangPiutang.findUnique({
      where: { id },
      include: {
        anggota: true,
        riwayatBayar: {
          orderBy: { tanggalBayar: 'desc' },
          include: {
            transaksiKas: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error fetching detail hutang piutang:', error);
    return NextResponse.json(
      { error: 'Gagal memuat detail data' },
      { status: 500 }
    );
  }
}

// PUT / UPDATE hutang piutang details
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
      judul,
      namaPihak,
      kontakPihak,
      anggotaId,
      jatuhTempo,
      kategori,
      catatan,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existing = await db.hutangPiutang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    const updated = await db.hutangPiutang.update({
      where: { id },
      data: {
        judul: judul ? judul.trim() : existing.judul,
        namaPihak: namaPihak ? namaPihak.trim() : existing.namaPihak,
        kontakPihak: kontakPihak !== undefined ? (kontakPihak ? kontakPihak.trim() : null) : existing.kontakPihak,
        anggotaId: anggotaId !== undefined ? (anggotaId && anggotaId !== 'none' ? anggotaId : null) : existing.anggotaId,
        jatuhTempo: jatuhTempo ? new Date(jatuhTempo) : null,
        kategori: kategori || existing.kategori,
        catatan: catatan !== undefined ? (catatan ? catatan.trim() : null) : existing.catatan,
      },
      include: {
        anggota: true,
        riwayatBayar: {
          orderBy: { tanggalBayar: 'desc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating hutang piutang:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data' },
      { status: 500 }
    );
  }
}

// DELETE hutang piutang record
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existing = await db.hutangPiutang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    await db.hutangPiutang.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting hutang piutang:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data' },
      { status: 500 }
    );
  }
}
