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
    const jenis = searchParams.get('jenis');

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const where: any = {
      komunitasId: tenant.komunitasId,
      tanggalPeristiwa: {
        gte: startOfYear,
        lte: endOfYear
      }
    };

    if (jenis && jenis !== 'all') {
      where.jenisMutasi = jenis;
    }

    const items = await db.mutasiWarga.findMany({
      where,
      orderBy: { tanggalPeristiwa: 'desc' }
    });

    // Summary calculation
    let totalLahir = 0;
    let totalMeninggal = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    items.forEach(m => {
      if (m.jenisMutasi === 'lahir') totalLahir += 1;
      else if (m.jenisMutasi === 'meninggal') totalMeninggal += 1;
      else if (m.jenisMutasi === 'masuk') totalMasuk += 1;
      else if (m.jenisMutasi === 'keluar') totalKeluar += 1;
    });

    const deltaNetto = (totalLahir + totalMasuk) - (totalMeninggal + totalKeluar);

    // Total Registered Residents in Anggota table for this tenant
    const totalWargaAktif = await db.anggota.count({ 
      where: { 
        statusAktif: true,
        komunitasId: tenant.komunitasId,
      } 
    });

    return NextResponse.json({
      tahun: targetYear,
      data: items,
      summary: {
        totalLahir,
        totalMeninggal,
        totalMasuk,
        totalKeluar,
        deltaNetto,
        totalWargaAktif
      }
    });
  } catch (error: any) {
    console.error('Error fetching mutasi warga:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat mutasi warga' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { 
      jenisMutasi, 
      tanggalPeristiwa, 
      namaWarga, 
      nik, 
      noRumah, 
      jenisKelamin, 
      keterangan, 
      anggotaId,
      dicatatOleh 
    } = body;

    if (!jenisMutasi || !namaWarga) {
      return NextResponse.json({ error: 'Jenis mutasi dan nama warga wajib diisi' }, { status: 400 });
    }

    const item = await db.mutasiWarga.create({
      data: {
        jenisMutasi,
        tanggalPeristiwa: tanggalPeristiwa ? new Date(tanggalPeristiwa) : new Date(),
        namaWarga,
        nik: nik || null,
        noRumah: noRumah || null,
        jenisKelamin: jenisKelamin || null,
        keterangan: keterangan || null,
        anggotaId: anggotaId || null,
        dicatatOleh: dicatatOleh || 'Sekretaris RT',
        komunitasId: tenant.komunitasId,
      }
    });

    // If anggotaId provided and mutasi is 'meninggal' or 'keluar', optionally set statusAktif to false
    if (anggotaId && (jenisMutasi === 'meninggal' || jenisMutasi === 'keluar')) {
      await db.anggota.updateMany({
        where: { id: anggotaId, komunitasId: tenant.komunitasId },
        data: { statusAktif: false }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: item, message: 'Data mutasi warga berhasil dicatat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mutasi warga:', error);
    return NextResponse.json({ error: error.message || 'Gagal mencatat mutasi warga' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mutasi wajib disertakan' }, { status: 400 });
    }

    const existing = await db.mutasiWarga.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Data mutasi tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    await db.mutasiWarga.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Data mutasi berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting mutasi:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus mutasi' }, { status: 500 });
  }
}
