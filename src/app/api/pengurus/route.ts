import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const list = await db.pengurusRT.findMany({
      where: {
        komunitasId: tenant.komunitasId,
      },
      orderBy: [
        { urutan: 'asc' },
        { createdAt: 'asc' }
      ],
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

    // Helper signatures extraction
    const ketua = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '';
    const bendahara = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || '';
    const sekretaris = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '';

    return NextResponse.json({
      success: true,
      data: list,
      signatures: {
        ketuaRt: ketua,
        bendahara,
        sekretaris
      }
    });
  } catch (error) {
    console.error('Failed to fetch PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengurus' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { 
      jabatan, 
      kategori = 'inti', 
      nama, 
      nik, 
      noHp, 
      alamatRumah, 
      anggotaId, 
      urutan = 99, 
      periode = '2024 - 2029', 
      statusAktif = true, 
      keterangan 
    } = body;

    if (!jabatan || !nama) {
      return NextResponse.json({ error: 'Jabatan dan Nama pengurus wajib diisi' }, { status: 400 });
    }

    const created = await db.pengurusRT.create({
      data: {
        jabatan,
        kategori,
        nama,
        nik: nik || null,
        noHp: noHp || null,
        alamatRumah: alamatRumah || null,
        anggotaId: anggotaId || null,
        urutan: Number(urutan) || 1,
        periode: periode || '2024 - 2029',
        statusAktif: Boolean(statusAktif),
        keterangan: keterangan || null,
        komunitasId: tenant.komunitasId,
      }
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Failed to create PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal menambahkan pengurus baru' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { 
      id, 
      jabatan, 
      kategori, 
      nama, 
      nik, 
      noHp, 
      alamatRumah, 
      anggotaId, 
      urutan, 
      periode, 
      statusAktif, 
      keterangan 
    } = body;

    if (!id || !nama || !jabatan) {
      return NextResponse.json({ error: 'ID, Nama, dan Jabatan wajib diisi' }, { status: 400 });
    }

    const existing = await db.pengurusRT.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Pengurus tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    const updated = await db.pengurusRT.update({
      where: { id },
      data: {
        jabatan,
        kategori: kategori || 'inti',
        nama,
        nik: nik !== undefined ? nik : undefined,
        noHp: noHp !== undefined ? noHp : undefined,
        alamatRumah: alamatRumah !== undefined ? alamatRumah : undefined,
        anggotaId: anggotaId !== undefined ? anggotaId : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        periode: periode !== undefined ? periode : undefined,
        statusAktif: statusAktif !== undefined ? Boolean(statusAktif) : undefined,
        keterangan: keterangan !== undefined ? keterangan : undefined
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data pengurus' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pengurus wajib disertakan' }, { status: 400 });
    }

    const existing = await db.pengurusRT.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Pengurus tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    await db.pengurusRT.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Pengurus berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengurus' }, { status: 500 });
  }
}
