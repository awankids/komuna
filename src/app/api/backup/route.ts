import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany();
    const rombongan = await db.rombongan.findMany();
    const anggota = await db.anggota.findMany();
    const jadwalPetugas = await db.jadwalPetugas.findMany();
    const jimpitan = await db.jimpitan.findMany();
    const transaksiKeuangan = await db.transaksiKeuangan.findMany();

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        rombongan,
        anggota,
        jadwalPetugas,
        jimpitan,
        transaksiKeuangan,
      }
    };

    const formattedDate = new Date().toISOString().split('T')[0];
    const filename = `backup_komuna_${formattedDate}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Gagal melakukan backup data: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.data || body.version !== '1.0.0') {
      return NextResponse.json({ error: 'Format file backup tidak valid' }, { status: 400 });
    }

    const { users, rombongan, anggota, jadwalPetugas, jimpitan, transaksiKeuangan } = body.data;

    // Use Prisma transaction to ensure atomic restore
    await db.$transaction(async (tx) => {
      // 1. Reset all circular foreign keys to null first
      await tx.rombongan.updateMany({
        data: { ketuaId: null }
      });
      await tx.anggota.updateMany({
        data: { rombonganId: null }
      });

      // 2. Delete all records from child tables to parent tables
      await tx.transaksiKeuangan.deleteMany();
      await tx.jimpitan.deleteMany();
      await tx.jadwalPetugas.deleteMany();
      await tx.rombongan.deleteMany();
      await tx.anggota.deleteMany();
      
      if (users && users.length > 0) {
        await tx.user.deleteMany();
      }

      // 3. Re-insert data step-by-step
      // A. Restore Users if provided
      if (users && users.length > 0) {
        for (const u of users) {
          await tx.user.create({
            data: {
              id: u.id,
              nama: u.nama,
              email: u.email,
              passwordHash: u.passwordHash,
              role: u.role,
              createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            }
          });
        }
      }

      // B. Restore Anggota (without rombonganId to avoid foreign key errors)
      if (anggota && anggota.length > 0) {
        for (const a of anggota) {
          await tx.anggota.create({
            data: {
              id: a.id,
              nama: a.nama,
              noRumah: a.noRumah,
              noHp: a.noHp,
              statusAktif: a.statusAktif ?? true,
              rombonganId: null,
              createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            }
          });
        }
      }

      // C. Restore Rombongan (without ketuaId)
      if (rombongan && rombongan.length > 0) {
        for (const r of rombongan) {
          await tx.rombongan.create({
            data: {
              id: r.id,
              nama: r.nama,
              hariPiket: r.hariPiket,
              ketuaId: null,
            }
          });
        }
      }

      // D. Update Anggota with rombonganId
      if (anggota && anggota.length > 0) {
        for (const a of anggota) {
          if (a.rombonganId) {
            await tx.anggota.update({
              where: { id: a.id },
              data: { rombonganId: a.rombonganId }
            });
          }
        }
      }

      // E. Update Rombongan with ketuaId
      if (rombongan && rombongan.length > 0) {
        for (const r of rombongan) {
          if (r.ketuaId) {
            await tx.rombongan.update({
              where: { id: r.id },
              data: { ketuaId: r.ketuaId }
            });
          }
        }
      }

      // F. Restore JadwalPetugas
      if (jadwalPetugas && jadwalPetugas.length > 0) {
        for (const jp of jadwalPetugas) {
          await tx.jadwalPetugas.create({
            data: {
              id: jp.id,
              anggotaId: jp.anggotaId,
              tanggal: new Date(jp.tanggal),
              keterangan: jp.keterangan,
            }
          });
        }
      }

      // G. Restore Jimpitan
      if (jimpitan && jimpitan.length > 0) {
        for (const j of jimpitan) {
          await tx.jimpitan.create({
            data: {
              id: j.id,
              tanggal: new Date(j.tanggal),
              jadwalId: j.jadwalId,
              nominal: j.nominal,
              diisiOleh: j.diisiOleh,
              diisiPada: j.diisiPada ? new Date(j.diisiPada) : new Date(),
              catatan: j.catatan,
              localId: j.localId,
              syncStatus: j.syncStatus,
              createdAtLocal: j.createdAtLocal ? new Date(j.createdAtLocal) : null,
              syncedAt: j.syncedAt ? new Date(j.syncedAt) : null,
            }
          });
        }
      }

      // H. Restore TransaksiKeuangan
      if (transaksiKeuangan && transaksiKeuangan.length > 0) {
        for (const t of transaksiKeuangan) {
          await tx.transaksiKeuangan.create({
            data: {
              id: t.id,
              tanggal: new Date(t.tanggal),
              jenis: t.jenis,
              sumber: t.sumber,
              kategori: t.kategori,
              keterangan: t.keterangan,
              nominal: t.nominal,
              buktiUrl: t.buktiUrl,
              localId: t.localId,
              syncStatus: t.syncStatus,
              createdAtLocal: t.createdAtLocal ? new Date(t.createdAtLocal) : null,
              syncedAt: t.syncedAt ? new Date(t.syncedAt) : null,
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Restore data berhasil dilakukan' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Gagal melakukan restore data: ' + error.message }, { status: 500 });
  }
}
