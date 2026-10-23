import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

interface PrismaVotingWhere {
  komunitasId: string;
  status?: string;
  kategori?: string;
}

interface IncomingOpsi {
  judulOpsi: string;
  deskripsiOpsi?: string;
  gambarUrl?: string;
  perkiraanBiaya?: number;
}

interface CreateVotingBody {
  judul: string;
  deskripsi: string;
  kategori?: string;
  tipeHakSuara?: string;
  tipeKerahasiaan?: string;
  kuorumPersen?: number;
  tanggalMulai?: string;
  tanggalSelesai: string;
  estimasiBiaya?: number;
  lampiranUrl?: string;
  opsi: IncomingOpsi[];
}

// GET /api/voting - Daftar agenda voting
export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'aktif', 'selesai', 'draft', 'all'
    const kategori = searchParams.get('kategori');

    const whereClause: PrismaVotingWhere = {
      komunitasId: tenant.komunitasId,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (kategori && kategori !== 'all') {
      whereClause.kategori = kategori;
    }

    // 1. Ambil jumlah total warga & KK di komunitas untuk kalkulasi kuorum akurat
    const [totalAnggota, daftarKepalaKeluarga] = await Promise.all([
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
        select: { noRumah: true },
      }),
    ]);

    // Unikkan noRumah KK jika ada data berulang
    const totalKK = new Set(daftarKepalaKeluarga.map((k) => k.noRumah.trim().toLowerCase())).size || daftarKepalaKeluarga.length || 1;

    // 2. Query daftar voting beserta opsi dan jumlah suaranya
    const votingList = await db.voting.findMany({
      where: whereClause,
      include: {
        opsi: {
          orderBy: { urutan: 'asc' },
          include: {
            _count: {
              select: { suara: true },
            },
          },
        },
        _count: {
          select: {
            suara: true,
            komentar: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // 'aktif' lebih dulu dari 'selesai'
        { createdAt: 'desc' },
      ],
    });

    // 3. Format payload respons dengan indikator kuorum & statistik
    const formatted = votingList.map((item) => {
      const totalTargetPemilih = item.tipeHakSuara === 'per_kk' ? totalKK : totalAnggota || 1;
      const totalSuaraMasuk = item._count.suara;
      const persentasePartisipasi = Math.round((totalSuaraMasuk / totalTargetPemilih) * 100);
      const isKuorumTerpenuhi = persentasePartisipasi >= item.kuorumPersen;

      // Cek apakah sudah lewat deadline
      const now = new Date();
      const isExpired = new Date(item.tanggalSelesai) < now;
      const computedStatus = item.status === 'aktif' && isExpired ? 'selesai' : item.status;

      // Cari opsi pemenang / unggul
      let leadingOpsiId: string | null = null;
      let maxSuara = 0;
      item.opsi.forEach((o) => {
        const count = o._count.suara;
        if (count > maxSuara) {
          maxSuara = count;
          leadingOpsiId = o.id;
        }
      });

      return {
        id: item.id,
        judul: item.judul,
        deskripsi: item.deskripsi,
        kategori: item.kategori,
        tipeHakSuara: item.tipeHakSuara,
        tipeKerahasiaan: item.tipeKerahasiaan,
        status: computedStatus,
        kuorumPersen: item.kuorumPersen,
        tanggalMulai: item.tanggalMulai,
        tanggalSelesai: item.tanggalSelesai,
        estimasiBiaya: item.estimasiBiaya,
        lampiranUrl: item.lampiranUrl,
        dibuatOleh: item.dibuatOleh,
        createdAt: item.createdAt,
        totalTargetPemilih,
        totalSuaraMasuk,
        persentasePartisipasi,
        isKuorumTerpenuhi,
        isExpired,
        komentarCount: item._count.komentar,
        leadingOpsiId: maxSuara > 0 ? leadingOpsiId : null,
        opsi: item.opsi.map((o) => ({
          id: o.id,
          urutan: o.urutan,
          judulOpsi: o.judulOpsi,
          deskripsiOpsi: o.deskripsiOpsi,
          gambarUrl: o.gambarUrl,
          perkiraanBiaya: o.perkiraanBiaya,
          totalSuara: o._count.suara,
          persentase: totalSuaraMasuk > 0 ? Math.round((o._count.suara / totalSuaraMasuk) * 100) : 0,
        })),
      };
    });

    return NextResponse.json({
      data: formatted,
      meta: {
        totalKK,
        totalAnggota,
        totalVotingAktif: formatted.filter((v) => v.status === 'aktif').length,
        totalVotingSelesai: formatted.filter((v) => v.status === 'selesai').length,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal mengambil data voting';
    console.error('Error fetching voting list:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

// POST /api/voting - Buat voting / musyawarah baru
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    if (!['SUPER_ADMIN', 'ADMIN', 'SEKRETARIS', 'BENDAHARA'].includes(tenant.role)) {
      return NextResponse.json({ error: 'Hanya pengurus yang dapat membuka musyawarah voting' }, { status: 403 });
    }

    const body: CreateVotingBody = await request.json();
    const {
      judul,
      deskripsi,
      kategori = 'umum',
      tipeHakSuara = 'per_kk',
      tipeKerahasiaan = 'anonim',
      kuorumPersen = 50,
      tanggalMulai,
      tanggalSelesai,
      estimasiBiaya = 0,
      lampiranUrl,
      opsi = [],
    } = body;

    const trimmedJudul = (judul || '').trim();
    const trimmedDeskripsi = (deskripsi || '').trim();

    if (!trimmedJudul || !trimmedDeskripsi) {
      return NextResponse.json({ error: 'Judul dan Deskripsi musyawarah wajib diisi' }, { status: 400 });
    }

    if (!tanggalSelesai) {
      return NextResponse.json({ error: 'Batas akhir waktu pemungutan suara wajib ditentukan' }, { status: 400 });
    }

    if (!Array.isArray(opsi) || opsi.length < 2) {
      return NextResponse.json({ error: 'Musyawarah voting memerlukan minimal 2 pilihan opsi' }, { status: 400 });
    }

    const startDate = tanggalMulai ? new Date(tanggalMulai) : new Date();
    const endDate = new Date(tanggalSelesai);

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Format tanggal batas akhir voting tidak valid' }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Batas akhir voting harus lebih lama dari tanggal mulai' }, { status: 400 });
    }

    // Bound values (Safety & Defense)
    const validKuorum = Math.min(100, Math.max(1, Number(kuorumPersen) || 50));
    const validEstimasiBiaya = Math.max(0, Number(estimasiBiaya) || 0);

    // Buat data voting dan opsi dalam satu transaksi
    const newVoting = await db.$transaction(async (tx) => {
      const created = await tx.voting.create({
        data: {
          judul: trimmedJudul.slice(0, 200),
          deskripsi: trimmedDeskripsi.slice(0, 5000),
          kategori: (kategori || 'umum').slice(0, 50),
          tipeHakSuara: tipeHakSuara === 'per_warga' ? 'per_warga' : 'per_kk',
          tipeKerahasiaan: tipeKerahasiaan === 'terbuka' ? 'terbuka' : 'anonim',
          status: 'aktif',
          kuorumPersen: validKuorum,
          tanggalMulai: startDate,
          tanggalSelesai: endDate,
          estimasiBiaya: validEstimasiBiaya,
          lampiranUrl: lampiranUrl ? lampiranUrl.slice(0, 500) : null,
          dibuatOleh: tenant.nama || 'Pengurus RT',
          komunitasId: tenant.komunitasId,
          opsi: {
            create: opsi.map((op: IncomingOpsi, idx: number) => ({
              urutan: idx + 1,
              judulOpsi: (op.judulOpsi || `Pilihan ${idx + 1}`).trim().slice(0, 200),
              deskripsiOpsi: op.deskripsiOpsi ? op.deskripsiOpsi.trim().slice(0, 1000) : null,
              gambarUrl: op.gambarUrl ? op.gambarUrl.trim().slice(0, 500) : null,
              perkiraanBiaya: Math.max(0, Number(op.perkiraanBiaya) || 0),
            })),
          },
        },
        include: {
          opsi: true,
        },
      });

      return created;
    });

    // Otomatis kirim notifikasi in-app ke seluruh warga komunitas
    db.notifikasi.create({
      data: {
        title: '🗳️ Musyawarah Warga Dibuka!',
        message: `Pengurus membuka pemungutan suara: **${trimmedJudul}**. Mohon berpartisipasi menyampaikan suara Anda.`,
        type: 'info',
        isRead: false,
        komunitasId: tenant.komunitasId,
      },
    }).catch((err) => console.error('Gagal membuat notifikasi voting:', err));

    return NextResponse.json(newVoting, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal membuat voting baru';
    console.error('Error creating voting:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
