import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ExistingVoteData {
  id: string;
  opsiId: string;
  waktuVote: Date;
  alasanMemilih: string | null;
}

interface VotingPatchBody {
  status?: string;
  judul?: string;
  deskripsi?: string;
  tanggalSelesai?: string;
  kuorumPersen?: number;
  estimasiBiaya?: number;
}

// GET /api/voting/[id] - Detail lengkap voting, status kuorum, hasil, & komentar
export async function GET(request: Request, context: RouteContext) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { id } = await context.params;

    const voting = await db.voting.findFirst({
      where: {
        id,
        komunitasId: tenant.komunitasId,
      },
      include: {
        opsi: {
          orderBy: { urutan: 'asc' },
          include: {
            _count: {
              select: { suara: true },
            },
            suara: {
              select: {
                id: true,
                namaPemilih: true,
                noRumah: true,
                alasanMemilih: true,
                waktuVote: true,
              },
            },
          },
        },
        komentar: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            suara: true,
            komentar: true,
          },
        },
      },
    });

    if (!voting) {
      return NextResponse.json({ error: 'Data musyawarah voting tidak ditemukan' }, { status: 404 });
    }

    // 1. Hitung total target pemilih (KK atau seluruh warga aktif)
    const [totalAnggota, daftarKK, totalKas] = await Promise.all([
      db.anggota.count({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
        },
      }),
      db.anggota.findMany({
        where: {
          komunitasId: tenant.komunitasId,
          statusAktif: true,
          statusKeluarga: 'kepala_keluarga',
        },
        select: { noRumah: true, nama: true, id: true },
      }),
      // Hitung saldo Kas RT saat ini jika voting berkaitan dengan estimasi biaya
      db.transaksiKeuangan.findMany({
        where: { komunitasId: tenant.komunitasId },
        select: { jenis: true, nominal: true },
      }),
    ]);

    const totalKK = new Set(daftarKK.map((k) => k.noRumah.trim().toLowerCase())).size || daftarKK.length || 1;
    const totalTargetPemilih = voting.tipeHakSuara === 'per_kk' ? totalKK : totalAnggota || 1;
    const totalSuaraMasuk = voting._count.suara;
    const persentasePartisipasi = Math.round((totalSuaraMasuk / totalTargetPemilih) * 100);
    const isKuorumTerpenuhi = persentasePartisipasi >= voting.kuorumPersen;

    // Kalkulasi saldo kas RT
    const saldoKasSaatIni = totalKas.reduce((acc, curr) => {
      return curr.jenis === 'pemasukan' ? acc + curr.nominal : acc - curr.nominal;
    }, 0);

    const persentaseBebanKas =
      voting.estimasiBiaya && voting.estimasiBiaya > 0 && saldoKasSaatIni > 0
        ? Math.min(100, Math.round((voting.estimasiBiaya / saldoKasSaatIni) * 100))
        : 0;

    // 2. Cek apakah user yang login / anggota terkait sudah memberikan suara
    const userAccount = await db.user.findUnique({
      where: { id: tenant.userId },
      select: { noHp: true, nama: true },
    });

    const orConditions: Array<{ noHp?: string; nama?: { equals: string; mode: 'insensitive' } }> = [];
    if (userAccount?.noHp) {
      orConditions.push({ noHp: userAccount.noHp });
    }
    orConditions.push({ nama: { equals: tenant.nama, mode: 'insensitive' } });

    const userAnggota = await db.anggota.findFirst({
      where: {
        komunitasId: tenant.komunitasId,
        OR: orConditions,
      },
    });

    let hasVoted = false;
    let existingVoteData: ExistingVoteData | null = null;

    if (userAnggota) {
      if (voting.tipeHakSuara === 'per_kk') {
        const vote = await db.votingSuara.findFirst({
          where: {
            votingId: voting.id,
            noRumah: {
              equals: userAnggota.noRumah.trim(),
              mode: 'insensitive',
            },
          },
        });
        if (vote) {
          hasVoted = true;
          existingVoteData = {
            id: vote.id,
            opsiId: vote.opsiId,
            waktuVote: vote.waktuVote,
            alasanMemilih: vote.alasanMemilih,
          };
        }
      } else {
        const vote = await db.votingSuara.findFirst({
          where: {
            votingId: voting.id,
            anggotaId: userAnggota.id,
          },
        });
        if (vote) {
          hasVoted = true;
          existingVoteData = {
            id: vote.id,
            opsiId: vote.opsiId,
            waktuVote: vote.waktuVote,
            alasanMemilih: vote.alasanMemilih,
          };
        }
      }
    }

    // Cek status kadaluarsa
    const now = new Date();
    const isExpired = new Date(voting.tanggalSelesai) < now;
    const computedStatus = voting.status === 'aktif' && isExpired ? 'selesai' : voting.status;

    // Format opsi voting
    let leadingOpsiId: string | null = null;
    let maxSuara = 0;

    voting.opsi.forEach((o) => {
      const count = o._count.suara;
      if (count > maxSuara) {
        maxSuara = count;
        leadingOpsiId = o.id;
      }
    });

    const formattedOpsi = voting.opsi.map((o) => {
      return {
        id: o.id,
        urutan: o.urutan,
        judulOpsi: o.judulOpsi,
        deskripsiOpsi: o.deskripsiOpsi,
        gambarUrl: o.gambarUrl,
        perkiraanBiaya: o.perkiraanBiaya,
        totalSuara: o._count.suara,
        persentase: totalSuaraMasuk > 0 ? Math.round((o._count.suara / totalSuaraMasuk) * 100) : 0,
        // Jika mode anonim, sembunyikan detail pemilih dari opsi
        pemilih:
          voting.tipeKerahasiaan === 'terbuka'
            ? o.suara.map((s) => ({
                id: s.id,
                namaPemilih: s.namaPemilih,
                noRumah: s.noRumah,
                alasanMemilih: s.alasanMemilih,
                waktuVote: s.waktuVote,
              }))
            : [],
      };
    });

    return NextResponse.json({
      id: voting.id,
      judul: voting.judul,
      deskripsi: voting.deskripsi,
      kategori: voting.kategori,
      tipeHakSuara: voting.tipeHakSuara,
      tipeKerahasiaan: voting.tipeKerahasiaan,
      status: computedStatus,
      kuorumPersen: voting.kuorumPersen,
      tanggalMulai: voting.tanggalMulai,
      tanggalSelesai: voting.tanggalSelesai,
      estimasiBiaya: voting.estimasiBiaya,
      lampiranUrl: voting.lampiranUrl,
      dibuatOleh: voting.dibuatOleh,
      createdAt: voting.createdAt,
      totalTargetPemilih,
      totalSuaraMasuk,
      persentasePartisipasi,
      isKuorumTerpenuhi,
      isExpired,
      leadingOpsiId: maxSuara > 0 ? leadingOpsiId : null,
      saldoKasSaatIni,
      persentaseBebanKas,
      opsi: formattedOpsi,
      komentar: voting.komentar,
      currentUserVote: {
        hasVoted,
        vote: existingVoteData,
        anggotaTerdaftar: userAnggota
          ? {
              id: userAnggota.id,
              nama: userAnggota.nama,
              noRumah: userAnggota.noRumah,
            }
          : null,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal mengambil detail voting';
    console.error('Error fetching voting detail:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// PATCH /api/voting/[id] - Update status, tutup voting lebih awal, atau perbarui data
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const tenant = await requireTenantContext();
    if (!['SUPER_ADMIN', 'ADMIN', 'SEKRETARIS', 'BENDAHARA'].includes(tenant.role)) {
      return NextResponse.json({ error: 'Hanya pengurus yang berwenang mengubah voting' }, { status: 403 });
    }

    const { id } = await context.params;
    const body: VotingPatchBody = await request.json();

    const existing = await db.voting.findFirst({
      where: { id, komunitasId: tenant.komunitasId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Voting tidak ditemukan' }, { status: 404 });
    }

    const updateData: {
      status?: string;
      judul?: string;
      deskripsi?: string;
      tanggalSelesai?: Date;
      kuorumPersen?: number;
      estimasiBiaya?: number;
    } = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.judul !== undefined) updateData.judul = body.judul.trim().slice(0, 200);
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi.trim().slice(0, 5000);
    if (body.tanggalSelesai !== undefined) updateData.tanggalSelesai = new Date(body.tanggalSelesai);
    if (body.kuorumPersen !== undefined) updateData.kuorumPersen = Math.min(100, Math.max(1, Number(body.kuorumPersen)));
    if (body.estimasiBiaya !== undefined) updateData.estimasiBiaya = Math.max(0, Number(body.estimasiBiaya));

    const updated = await db.voting.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Notifikasi jika voting ditutup
    if (body.status === 'selesai' && existing.status !== 'selesai') {
      db.notifikasi.create({
        data: {
          title: '📢 Musyawarah Voting Selesai!',
          message: `Pemungutan suara: **${existing.judul}** telah resmi ditutup. Hasil keputusan musyawarah kini dapat dilihat warga.`,
          type: 'success',
          isRead: false,
          komunitasId: tenant.komunitasId,
        },
      }).catch((e) => console.error('Failed notification on voting close', e));
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui voting';
    console.error('Error updating voting:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// DELETE /api/voting/[id] - Hapus agenda voting (Admin/Super Admin only)
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const tenant = await requireTenantContext();
    if (!['SUPER_ADMIN', 'ADMIN'].includes(tenant.role)) {
      return NextResponse.json({ error: 'Hanya Administrator yang dapat menghapus voting' }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await db.voting.findFirst({
      where: { id, komunitasId: tenant.komunitasId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Voting tidak ditemukan' }, { status: 404 });
    }

    await db.voting.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ message: 'Voting berhasil dihapus' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal menghapus voting';
    console.error('Error deleting voting:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
