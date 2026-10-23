import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/voting/[id]/berita-acara - Rekapitulasi resmi & notulen keputusan musyawarah
export async function GET(request: Request, context: RouteContext) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const { id: votingId } = await context.params;

    const [voting, komunitas, ketuaRT, daftarKK, totalAnggota] = await Promise.all([
      db.voting.findFirst({
        where: { id: votingId, komunitasId: tenant.komunitasId },
        include: {
          opsi: {
            orderBy: { urutan: 'asc' },
            include: {
              _count: { select: { suara: true } },
            },
          },
          _count: { select: { suara: true } },
        },
      }),
      db.komunitas.findUnique({
        where: { id: tenant.komunitasId },
      }),
      db.pengurusRT.findFirst({
        where: {
          komunitasId: tenant.komunitasId,
          jabatan: { contains: 'Ketua', mode: 'insensitive' },
          statusAktif: true,
        },
      }),
      db.anggota.findMany({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
          statusKeluarga: 'kepala_keluarga',
        },
        select: { noRumah: true },
      }),
      db.anggota.count({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
        },
      }),
    ]);

    if (!voting) {
      return NextResponse.json({ error: 'Data musyawarah voting tidak ditemukan' }, { status: 404 });
    }

    const totalKK = new Set(daftarKK.map((k) => k.noRumah.trim().toLowerCase())).size || daftarKK.length || 1;
    const totalTarget = voting.tipeHakSuara === 'per_kk' ? totalKK : totalAnggota || 1;
    const totalSuaraMasuk = voting._count.suara;
    const persentase = totalTarget > 0 ? Math.round((totalSuaraMasuk / totalTarget) * 100) : 0;
    const isSah = persentase >= voting.kuorumPersen;

    // Cari opsi pemenang
    let pemenang = null;
    let highestCount = -1;

    const rincianOpsi = voting.opsi.map((o) => {
      const suaraCount = o._count.suara;
      if (suaraCount > highestCount && suaraCount > 0) {
        highestCount = suaraCount;
        pemenang = {
          id: o.id,
          judulOpsi: o.judulOpsi,
          totalSuara: suaraCount,
          persentase: totalSuaraMasuk > 0 ? Math.round((suaraCount / totalSuaraMasuk) * 100) : 0,
        };
      }
      return {
        id: o.id,
        urutan: o.urutan,
        judulOpsi: o.judulOpsi,
        totalSuara: suaraCount,
        persentase: totalSuaraMasuk > 0 ? Math.round((suaraCount / totalSuaraMasuk) * 100) : 0,
        perkiraanBiaya: o.perkiraanBiaya,
      };
    });

    return NextResponse.json({
      komunitas: {
        nama: komunitas?.nama || 'Lingkungan Warga',
        noRt: komunitas?.noRt || '04',
        noRw: komunitas?.noRw || '01',
        desaKelurahan: komunitas?.desaKelurahan || '',
        kecamatan: komunitas?.kecamatan || '',
        kotaKabupaten: komunitas?.kotaKabupaten || 'Semarang',
        ketuaRT: ketuaRT?.nama || 'Ketua RT',
      },
      voting: {
        id: voting.id,
        judul: voting.judul,
        deskripsi: voting.deskripsi,
        kategori: voting.kategori,
        tipeHakSuara: voting.tipeHakSuara === 'per_kk' ? '1 Suara per Kepala Keluarga' : '1 Suara per Warga Dewasa',
        tipeKerahasiaan: voting.tipeKerahasiaan === 'anonim' ? 'Tertutup / Rahasia' : 'Terbuka / Mufakat',
        status: voting.status,
        tanggalMulai: voting.tanggalMulai,
        tanggalSelesai: voting.tanggalSelesai,
        kuorumPersen: voting.kuorumPersen,
        totalTarget,
        totalSuaraMasuk,
        persentasePartisipasi: persentase,
        isSah,
        statusKuorumTeks: isSah ? 'SAH (Kuorum Terpenuhi)' : 'TIDAK SAH / PENDING (Kuorum Belum Terpenuhi)',
        pemenang,
        rincianOpsi,
      },
      tanggalCetak: new Date(),
    });
  } catch (error: any) {
    console.error('Error generating berita acara:', error);
    return NextResponse.json({ error: 'Gagal membuat berita acara: ' + (error.message || error) }, { status: 500 });
  }
}
