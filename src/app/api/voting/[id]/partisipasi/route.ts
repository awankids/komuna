import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const maskPhoneNumber = (phone?: string | null): string | null => {
  if (!phone) return null;
  const clean = phone.trim();
  if (clean.length <= 6) return '***';
  return clean.slice(0, 4) + '****' + clean.slice(-3);
};

// GET /api/voting/[id]/partisipasi - Daftar partisipasi warga (sudah vs belum vote)
export async function GET(request: Request, context: RouteContext) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const { id: votingId } = await context.params;

    const voting = await db.voting.findFirst({
      where: { id: votingId, komunitasId: tenant.komunitasId },
      include: {
        opsi: true,
      },
    });

    if (!voting) {
      return NextResponse.json({ error: 'Voting tidak ditemukan' }, { status: 404 });
    }

    const isPengurus = ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS'].includes(tenant.role);

    // Ambil seluruh suara masuk untuk voting ini
    const semuaSuara = await db.votingSuara.findMany({
      where: { votingId },
      select: {
        id: true,
        opsiId: true,
        anggotaId: true,
        noRumah: true,
        namaPemilih: true,
        alasanMemilih: true,
        dicatatOleh: true,
        waktuVote: true,
      },
    });

    // Peta suara berdasarkan noRumah dan anggotaId
    type SuaraRecord = typeof semuaSuara[0];
    const votedByNoRumah = new Map<string, SuaraRecord>();
    const votedByAnggotaId = new Map<string, SuaraRecord>();

    semuaSuara.forEach((s) => {
      if (s.noRumah) {
        votedByNoRumah.set(s.noRumah.trim().toLowerCase(), s);
      }
      if (s.anggotaId) {
        votedByAnggotaId.set(s.anggotaId, s);
      }
    });

    if (voting.tipeHakSuara === 'per_kk') {
      // 1. Rekapitulasi per Kepala Keluarga / Rumah
      const anggotaList = await db.anggota.findMany({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
          statusKeluarga: 'kepala_keluarga',
        },
        select: {
          id: true,
          nama: true,
          noRumah: true,
          noHp: true,
          rombongan: {
            select: { nama: true },
          },
        },
        orderBy: [{ noRumah: 'asc' }],
      });

      // Filter unik noRumah
      const seenHouses = new Set<string>();
      const listKK = anggotaList.filter((a) => {
        const key = a.noRumah.trim().toLowerCase();
        if (seenHouses.has(key)) return false;
        seenHouses.add(key);
        return true;
      });

      const daftarPartisipasi = listKK.map((kk) => {
        const voteRecord = votedByNoRumah.get(kk.noRumah.trim().toLowerCase());
        const hasVoted = !!voteRecord;

        return {
          id: kk.id,
          nama: kk.nama,
          noRumah: kk.noRumah,
          // Privasi UU PDP: Hanya pengurus yang dapat melihat nomor HP lengkap untuk keperluan broadcast
          noHp: isPengurus ? kk.noHp : maskPhoneNumber(kk.noHp),
          rombongan: kk.rombongan?.nama || '-',
          hasVoted,
          waktuVote: voteRecord?.waktuVote || null,
          dicatatOleh: voteRecord?.dicatatOleh || null,
          alasanMemilih: voting.tipeKerahasiaan === 'terbuka' ? voteRecord?.alasanMemilih : null,
          pilihanOpsi:
            voting.tipeKerahasiaan === 'terbuka' && voteRecord
              ? voting.opsi.find((o) => o.id === voteRecord.opsiId)?.judulOpsi
              : null,
        };
      });

      const totalTarget = daftarPartisipasi.length;
      const totalSudah = daftarPartisipasi.filter((p) => p.hasVoted).length;
      const totalBelum = totalTarget - totalSudah;

      return NextResponse.json({
        tipeHakSuara: 'per_kk',
        tipeKerahasiaan: voting.tipeKerahasiaan,
        totalTarget,
        totalSudah,
        totalBelum,
        persentase: totalTarget > 0 ? Math.round((totalSudah / totalTarget) * 100) : 0,
        daftar: daftarPartisipasi,
      });
    } else {
      // 2. Rekapitulasi per Setiap Warga Dewasa
      const wargaList = await db.anggota.findMany({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
        },
        select: {
          id: true,
          nama: true,
          noRumah: true,
          noHp: true,
          statusKeluarga: true,
          rombongan: {
            select: { nama: true },
          },
        },
        orderBy: [{ noRumah: 'asc' }, { nama: 'asc' }],
      });

      const daftarPartisipasi = wargaList.map((w) => {
        const voteRecord = votedByAnggotaId.get(w.id);
        const hasVoted = !!voteRecord;

        return {
          id: w.id,
          nama: w.nama,
          noRumah: w.noRumah,
          noHp: isPengurus ? w.noHp : maskPhoneNumber(w.noHp),
          statusKeluarga: w.statusKeluarga,
          rombongan: w.rombongan?.nama || '-',
          hasVoted,
          waktuVote: voteRecord?.waktuVote || null,
          dicatatOleh: voteRecord?.dicatatOleh || null,
          alasanMemilih: voting.tipeKerahasiaan === 'terbuka' ? voteRecord?.alasanMemilih : null,
          pilihanOpsi:
            voting.tipeKerahasiaan === 'terbuka' && voteRecord
              ? voting.opsi.find((o) => o.id === voteRecord.opsiId)?.judulOpsi
              : null,
        };
      });

      const totalTarget = daftarPartisipasi.length;
      const totalSudah = daftarPartisipasi.filter((p) => p.hasVoted).length;
      const totalBelum = totalTarget - totalSudah;

      return NextResponse.json({
        tipeHakSuara: 'per_warga',
        tipeKerahasiaan: voting.tipeKerahasiaan,
        totalTarget,
        totalSudah,
        totalBelum,
        persentase: totalTarget > 0 ? Math.round((totalSudah / totalTarget) * 100) : 0,
        daftar: daftarPartisipasi,
      });
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal mengambil data partisipasi';
    console.error('Error fetching voting participation:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
