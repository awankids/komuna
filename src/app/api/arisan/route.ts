import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findNextWetonDate } from '@/lib/javanese-date';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // "aktif" | "selesai" | "semua"

    const where: any = {
      komunitasId: tenant.komunitasId,
    };
    if (status && status !== 'semua') {
      where.status = status;
    }

    const kelompokList = await db.kelompokArisan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        peserta: {
          select: {
            id: true,
            namaPeserta: true,
            nomorSlot: true,
            sudahMenang: true,
            tanggalMenang: true,
            noHp: true,
            anggotaId: true,
          },
          orderBy: { namaPeserta: 'asc' },
        },
        putaran: {
          orderBy: { putaranKe: 'desc' },
          take: 1,
          select: {
            id: true,
            putaranKe: true,
            tanggalKocok: true,
            hariJawa: true,
            namaPemenang: true,
            nominalDiterima: true,
            totalTarget: true,
            totalTerkumpul: true,
            nominalDiserahkan: true,
            nominalKurang: true,
            statusTalangan: true,
          },
        },
        _count: {
          select: {
            peserta: true,
            putaran: true,
          },
        },
      },
    });

    const data = kelompokList.map((k) => {
      const totalPeserta = k._count.peserta;
      const sudahMenangCount = k.peserta.filter((p) => p.sudahMenang).length;
      const belumMenangCount = totalPeserta - sudahMenangCount;
      const latestPutaran = k.putaran[0] || null;

      return {
        id: k.id,
        nama: k.nama,
        nominalIuran: k.nominalIuran,
        periodeTipe: k.periodeTipe,
        hariJawa: k.hariJawa,
        waktuKocok: k.waktuKocok,
        lokasiKocok: k.lokasiKocok,
        autoSinkronAgenda: k.autoSinkronAgenda,
        tanggalMulai: k.tanggalMulai,
        status: k.status,
        keterangan: k.keterangan,
        createdAt: k.createdAt,
        totalPeserta,
        sudahMenangCount,
        belumMenangCount,
        totalPutaran: k._count.putaran,
        latestPutaran,
        estimasiHadiah: totalPeserta * k.nominalIuran,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching arisan list:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data arisan', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const {
      nama,
      nominalIuran,
      periodeTipe = 'bulanan',
      hariJawa,
      waktuKocok = '19:30',
      lokasiKocok = 'Balai Pertemuan RT',
      autoSinkronAgenda = true,
      keterangan,
      tanggalMulai,
      pesertaList = [],
    } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama kelompok arisan wajib diisi' },
        { status: 400 }
      );
    }

    const nominal = Number(nominalIuran);
    if (isNaN(nominal) || nominal < 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal iuran harus berupa angka positif' },
        { status: 400 }
      );
    }

    const newKelompok = await db.kelompokArisan.create({
      data: {
        komunitasId: tenant.komunitasId,
        nama: nama.trim(),
        nominalIuran: nominal,
        periodeTipe: periodeTipe || 'bulanan',
        hariJawa: hariJawa?.trim() || null,
        waktuKocok: waktuKocok?.trim() || null,
        lokasiKocok: lokasiKocok?.trim() || null,
        autoSinkronAgenda: Boolean(autoSinkronAgenda),
        keterangan: keterangan?.trim() || null,
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : new Date(),
        status: 'aktif',
        peserta: {
          create: (pesertaList as Array<any>).map((p: any, idx: number) => ({
            namaPeserta: (p.namaPeserta || p.nama || `Peserta ${idx + 1}`).trim(),
            anggotaId: p.anggotaId || null,
            nomorSlot: Number(p.nomorSlot) || 1,
            noHp: p.noHp?.trim() || null,
            sudahMenang: false,
          })),
        },
      },
      include: {
        peserta: true,
      },
    });

    // Otomatis sinkronkan pertemuan pertama ke Agenda RT jika diaktifkan
    if (autoSinkronAgenda && hariJawa) {
      try {
        const nextAgendaDate = findNextWetonDate(hariJawa);
        await db.agenda.create({
          data: {
            komunitasId: tenant.komunitasId,
            judul: `Rapat Rutin & Kocokan Arisan: ${newKelompok.nama}`,
            kategori: 'rapat',
            tanggal: nextAgendaDate,
            waktuMulai: waktuKocok || '19:30',
            lokasi: lokasiKocok || 'Balai RT',
            keterangan: `Pertemuan rutin warga (${hariJawa}) dan pengundian arisan kelompok ${newKelompok.nama}.`,
            status: 'terjadwal',
          },
        });
      } catch (agendaErr) {
        console.warn('Gagal membuat agenda otomatis:', agendaErr);
      }
    }

    return NextResponse.json({ success: true, data: newKelompok }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating kelompok arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat kelompok arisan baru', details: error.message },
      { status: 500 }
    );
  }
}
