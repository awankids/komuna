import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

// GET all hutang & piutang records with summary statistics
export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipe = searchParams.get('tipe'); // "semua" | "piutang" | "hutang"
    const status = searchParams.get('status'); // "semua" | "belum_lunas" | "sebagian" | "lunas"
    const q = searchParams.get('q'); // search query
    const sort = searchParams.get('sort') || 'jatuhTempo'; // "jatuhTempo" | "nominalDesc" | "terbaru"

    // Base query filter
    const where: any = {
      komunitasId: tenant.komunitasId,
    };

    if (tipe && tipe !== 'semua') {
      where.tipe = tipe;
    }

    if (status && status !== 'semua') {
      where.status = status;
    }

    if (q && q.trim()) {
      const search = q.trim();
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { namaPihak: { contains: search, mode: 'insensitive' } },
        { catatan: { contains: search, mode: 'insensitive' } },
        { kontakPihak: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine ordering
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'jatuhTempo') {
      // Prioritize items with jatuh tempo, nulls last
      orderBy = [{ jatuhTempo: 'asc' }, { createdAt: 'desc' }];
    } else if (sort === 'nominalDesc') {
      orderBy = { sisaNominal: 'desc' };
    } else if (sort === 'terbaru') {
      orderBy = { createdAt: 'desc' };
    }

    // 1. Fetch filtered items
    const items = await db.hutangPiutang.findMany({
      where,
      include: {
        anggota: {
          select: {
            id: true,
            nama: true,
            noRumah: true,
            noHp: true,
          },
        },
        riwayatBayar: {
          orderBy: { tanggalBayar: 'desc' },
        },
      },
      orderBy,
    });

    // 2. Fetch all active items for global KPI calculation (regardless of filter)
    const allRecords = await db.hutangPiutang.findMany({
      where: {
        komunitasId: tenant.komunitasId,
      },
      select: {
        id: true,
        tipe: true,
        status: true,
        totalNominal: true,
        sisaNominal: true,
        jatuhTempo: true,
      },
    });

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let totalPiutangAktif = 0;
    let totalHutangAktif = 0;
    let countJatuhTempoSegera = 0;
    let countOverdue = 0;
    let countLunas = 0;
    let countAktif = 0;

    for (const record of allRecords) {
      if (record.status === 'lunas') {
        countLunas++;
        continue;
      }

      countAktif++;

      if (record.tipe === 'piutang') {
        totalPiutangAktif += record.sisaNominal;
      } else if (record.tipe === 'hutang') {
        totalHutangAktif += record.sisaNominal;
      }

      if (record.jatuhTempo) {
        const jt = new Date(record.jatuhTempo);
        if (jt < now) {
          countOverdue++;
          countJatuhTempoSegera++;
        } else if (jt <= sevenDaysFromNow) {
          countJatuhTempoSegera++;
        }
      }
    }

    const netReceivables = totalPiutangAktif - totalHutangAktif;

    return NextResponse.json({
      data: items,
      summary: {
        totalPiutangAktif,
        totalHutangAktif,
        netReceivables,
        countJatuhTempoSegera,
        countOverdue,
        countLunas,
        countAktif,
        totalCount: allRecords.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching hutang piutang:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data hutang dan piutang' },
      { status: 500 }
    );
  }
}

// POST new hutang or piutang record
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const {
      tipe,
      judul,
      namaPihak,
      kontakPihak,
      anggotaId,
      totalNominal,
      tanggalMulai,
      jatuhTempo,
      kategori,
      catatan,
      diisiOleh = 'Admin RT',
      catatDiKas = false,
    } = body;

    // Basic validation
    if (!tipe || !judul || !namaPihak || !totalNominal || !tanggalMulai) {
      return NextResponse.json(
        { error: 'Tipe, Judul, Nama Pihak, Nominal, dan Tanggal Mulai wajib diisi' },
        { status: 400 }
      );
    }

    const nominalInt = parseInt(totalNominal, 10);
    if (isNaN(nominalInt) || nominalInt <= 0) {
      return NextResponse.json(
        { error: 'Nominal harus berupa angka valid lebih dari 0' },
        { status: 400 }
      );
    }

    const startDate = new Date(tanggalMulai);
    const dueDate = jatuhTempo ? new Date(jatuhTempo) : null;

    // Use a transaction if we also need to record to Kas RT
    const result = await db.$transaction(async (tx) => {
      // 1. Create HutangPiutang record
      const created = await tx.hutangPiutang.create({
        data: {
          komunitasId: tenant.komunitasId,
          tipe,
          judul: judul.trim(),
          namaPihak: namaPihak.trim(),
          kontakPihak: kontakPihak ? kontakPihak.trim() : null,
          anggotaId: anggotaId && anggotaId !== 'none' ? anggotaId : null,
          totalNominal: nominalInt,
          sisaNominal: nominalInt,
          tanggalMulai: startDate,
          jatuhTempo: dueDate,
          status: 'belum_lunas',
          kategori: kategori || (tipe === 'piutang' ? 'sosial' : 'operasional'),
          catatan: catatan ? catatan.trim() : null,
          diisiOleh,
        },
      });

      // 2. If catatDiKas is requested on creation
      if (catatDiKas) {
        if (tipe === 'piutang') {
          // Kas RT dipinjamkan ke pihak luar -> Kas Berkurang (Pengeluaran)
          await tx.transaksiKeuangan.create({
            data: {
              komunitasId: tenant.komunitasId,
              tanggal: startDate,
              jenis: 'pengeluaran',
              sumber: 'manual',
              kategori: 'Pinjaman / Piutang',
              keterangan: `Penyaluran Piutang: ${judul.trim()} (${namaPihak.trim()})`,
              nominal: nominalInt,
            },
          });
        } else if (tipe === 'hutang') {
          // Kas RT menerima pinjaman/talangan tunai -> Kas Bertambah (Pemasukan)
          await tx.transaksiKeuangan.create({
            data: {
              komunitasId: tenant.komunitasId,
              tanggal: startDate,
              jenis: 'pemasukan',
              sumber: 'manual',
              kategori: 'Hutang / Talangan',
              keterangan: `Penerimaan Pinjaman/Talangan: ${judul.trim()} (${namaPihak.trim()})`,
              nominal: nominalInt,
            },
          });
        }
      }

      // 3. Create Notification
      const labelTipe = tipe === 'piutang' ? 'Piutang Warga' : 'Kewajiban Hutang';
      await tx.notifikasi.create({
        data: {
          title: `Catatan Baru: ${labelTipe}`,
          message: `${judul.trim()} (${namaPihak.trim()}) sebesar Rp ${nominalInt.toLocaleString('id-ID')} telah dicatat oleh ${diisiOleh}.`,
          type: tipe === 'piutang' ? 'info' : 'warning',
        },
      });

      return created;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hutang piutang:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data hutang/piutang baru' },
      { status: 500 }
    );
  }
}
