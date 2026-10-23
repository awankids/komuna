import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface VoteRequestBody {
  opsiId: string;
  anggotaId?: string;
  noRumah?: string;
  namaPemilih?: string;
  alasanMemilih?: string;
  isBantuWarga?: boolean;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Sesi telah berakhir, silakan login kembali' }, { status: 401 });
    }

    const { id: votingId } = await context.params;
    const body: VoteRequestBody = await request.json();

    const {
      opsiId,
      anggotaId: inputAnggotaId,
      noRumah: inputNoRumah,
      namaPemilih: inputNamaPemilih,
      alasanMemilih,
      isBantuWarga = false,
    } = body;

    if (!opsiId) {
      return NextResponse.json({ error: 'Silakan pilih salah satu opsi suara' }, { status: 400 });
    }

    // 1. Ambil data voting
    const voting = await db.voting.findFirst({
      where: {
        id: votingId,
        komunitasId: tenant.komunitasId,
      },
      include: {
        opsi: true,
      },
    });

    if (!voting) {
      return NextResponse.json({ error: 'Musyawarah voting tidak ditemukan' }, { status: 404 });
    }

    // Validasi masa aktif
    if (voting.status !== 'aktif') {
      return NextResponse.json({ error: 'Musyawarah voting ini sudah ditutup atau tidak aktif' }, { status: 400 });
    }

    if (new Date(voting.tanggalSelesai) < new Date()) {
      return NextResponse.json({ error: 'Batas waktu pemungutan suara telah berakhir' }, { status: 400 });
    }

    // Validasi opsi valid
    const targetOpsi = voting.opsi.find((o) => o.id === opsiId);
    if (!targetOpsi) {
      return NextResponse.json({ error: 'Opsi yang dipilih tidak valid untuk voting ini' }, { status: 400 });
    }

    // 2. Tentukan identitas pemilih
    let finalAnggotaId: string | null = null;
    let finalNoRumah = '';
    let finalNamaPemilih = '';
    let dicatatOleh = 'Mandiri';

    if (isBantuWarga) {
      // Fitur khusus Pengurus RT untuk membantu warga lansia / offline
      if (!['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS'].includes(tenant.role)) {
        return NextResponse.json({ error: 'Hanya pengurus yang dapat membantu mencatatkan suara warga' }, { status: 403 });
      }

      if (!inputAnggotaId) {
        return NextResponse.json({ error: 'Warga yang dibantu wajib dipilih dari daftar' }, { status: 400 });
      }

      const targetAnggota = await db.anggota.findFirst({
        where: { id: inputAnggotaId, komunitasId: tenant.komunitasId },
      });

      if (!targetAnggota) {
        return NextResponse.json({ error: 'Data warga tidak ditemukan di komunitas ini' }, { status: 404 });
      }

      finalAnggotaId = targetAnggota.id;
      finalNoRumah = targetAnggota.noRumah.trim();
      finalNamaPemilih = targetAnggota.nama.trim();
      dicatatOleh = `${tenant.nama} (Pengurus)`;
    } else {
      // Voting mandiri oleh pengguna yang sedang login
      let userAnggota = null;

      if (inputAnggotaId) {
        userAnggota = await db.anggota.findFirst({
          where: { id: inputAnggotaId, komunitasId: tenant.komunitasId },
        });
      } else {
        // Cari nomor HP user dari tabel User untuk pencocokan akurat ke tabel Anggota
        const userAccount = await db.user.findUnique({
          where: { id: tenant.userId },
          select: { noHp: true, nama: true },
        });

        const orConditions: Array<{ noHp?: string; nama?: { equals: string; mode: 'insensitive' } }> = [];
        if (userAccount?.noHp) {
          orConditions.push({ noHp: userAccount.noHp });
        }
        orConditions.push({ nama: { equals: tenant.nama, mode: 'insensitive' } });

        userAnggota = await db.anggota.findFirst({
          where: {
            komunitasId: tenant.komunitasId,
            OR: orConditions,
          },
        });
      }

      if (userAnggota) {
        finalAnggotaId = userAnggota.id;
        finalNoRumah = userAnggota.noRumah.trim();
        finalNamaPemilih = userAnggota.nama.trim();
      } else {
        // Fallback jika akun belum terhubung dengan data anggota spesifik
        const inputNo = (inputNoRumah || '').trim();
        if (!inputNo) {
          return NextResponse.json({ error: 'Nomor rumah / KK wajib dicantumkan untuk verifikasi hak suara' }, { status: 400 });
        }
        finalNoRumah = inputNo;
        finalNamaPemilih = (inputNamaPemilih || tenant.nama || 'Warga').trim();
      }
    }

    if (!finalNoRumah) {
      return NextResponse.json({ error: 'Nomor rumah / KK tidak valid' }, { status: 400 });
    }

    // Batasi panjang alasan memilih (Security & DB protection)
    const sanitizedAlasan = alasanMemilih ? alasanMemilih.trim().slice(0, 500) : null;

    // 3. Eksekusi Atomic Transaction untuk pencegahan Race Condition & Duplicate Vote
    const recordedVote = await db.$transaction(async (tx) => {
      if (voting.tipeHakSuara === 'per_kk') {
        // 1 Suara per KK / Nomor Rumah
        const existingVote = await tx.votingSuara.findFirst({
          where: {
            votingId: voting.id,
            noRumah: {
              equals: finalNoRumah,
              mode: 'insensitive',
            },
          },
        });

        if (existingVote) {
          throw new Error(
            `Hak suara untuk Rumah / KK No. ${finalNoRumah} sudah digunakan sebelumnya (${existingVote.namaPemilih}).`
          );
        }
      } else {
        // 1 Suara per Warga (Anggota)
        if (finalAnggotaId) {
          const existingVote = await tx.votingSuara.findFirst({
            where: {
              votingId: voting.id,
              anggotaId: finalAnggotaId,
            },
          });

          if (existingVote) {
            throw new Error(`Warga atas nama "${finalNamaPemilih}" sudah memberikan suara sebelumnya.`);
          }
        } else {
          // Fallback by name & house
          const existingVote = await tx.votingSuara.findFirst({
            where: {
              votingId: voting.id,
              namaPemilih: { equals: finalNamaPemilih, mode: 'insensitive' },
              noRumah: { equals: finalNoRumah, mode: 'insensitive' },
            },
          });

          if (existingVote) {
            throw new Error(`Suara atas nama "${finalNamaPemilih}" sudah tercatat sebelumnya.`);
          }
        }
      }

      // 4. Rekam Suara Masuk
      return await tx.votingSuara.create({
        data: {
          votingId: voting.id,
          opsiId,
          anggotaId: finalAnggotaId,
          noRumah: finalNoRumah,
          namaPemilih: finalNamaPemilih,
          alasanMemilih: sanitizedAlasan,
          dicatatOleh,
          komunitasId: tenant.komunitasId,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'Suara Anda berhasil tercatat dalam musyawarah ini!',
        data: {
          id: recordedVote.id,
          opsiId: recordedVote.opsiId,
          waktuVote: recordedVote.waktuVote,
          namaPemilih: recordedVote.namaPemilih,
          noRumah: recordedVote.noRumah,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal mengirim suara';
    console.error('Error recording vote:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}
