import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, requireTenantContext } from '@/lib/auth';

export async function GET() {
  try {
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak: Operasi backup hanya dapat dilakukan oleh Admin' }, { status: 403 });
    }

    const users = await db.user.findMany({
      where: { komunitasId: tenant.komunitasId },
    });
    const rombongan = await db.rombongan.findMany({
      where: { komunitasId: tenant.komunitasId },
    });
    const anggota = await db.anggota.findMany({
      where: { komunitasId: tenant.komunitasId },
    });
    const jadwalPetugas = await db.jadwalPetugas.findMany({
      where: { anggota: { komunitasId: tenant.komunitasId } },
    });
    const jimpitan = await db.jimpitan.findMany({
      where: { komunitasId: tenant.komunitasId },
    });
    const transaksiKeuangan = await db.transaksiKeuangan.findMany({
      where: { komunitasId: tenant.komunitasId },
    });

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      komunitasId: tenant.komunitasId,
      komunitasNama: tenant.komunitasNama,
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
    const filename = `backup_komuna_${tenant.komunitasSlug || 'rt'}_${formattedDate}.json`;

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
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak: Operasi restore hanya dapat dilakukan oleh Admin' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || !body.data || body.version !== '1.0.0') {
      return NextResponse.json({ error: 'Format file backup tidak valid' }, { status: 400 });
    }

    const { users, rombongan, anggota, jadwalPetugas, jimpitan, transaksiKeuangan } = body.data;

    // Use Prisma transaction to ensure atomic restore strictly scoped to tenant.komunitasId
    await db.$transaction(async (tx) => {
      // 1. Reset circular foreign keys only within this community
      await tx.rombongan.updateMany({
        where: { komunitasId: tenant.komunitasId },
        data: { ketuaId: null }
      });
      await tx.anggota.updateMany({
        where: { komunitasId: tenant.komunitasId },
        data: { rombonganId: null }
      });

      // 2. Delete existing records exclusively for this community
      await tx.transaksiKeuangan.deleteMany({
        where: { komunitasId: tenant.komunitasId },
      });
      await tx.jimpitan.deleteMany({
        where: { komunitasId: tenant.komunitasId },
      });
      await tx.jadwalPetugas.deleteMany({
        where: { anggota: { komunitasId: tenant.komunitasId } },
      });
      await tx.rombongan.deleteMany({
        where: { komunitasId: tenant.komunitasId },
      });
      await tx.anggota.deleteMany({
        where: { komunitasId: tenant.komunitasId },
      });
      
      if (users && users.length > 0) {
        // Only delete non-superadmin users of this community
        await tx.user.deleteMany({
          where: {
            komunitasId: tenant.komunitasId,
            role: { not: 'SUPER_ADMIN' },
          },
        });
      }

      // 3. Re-insert data step-by-step with forced tenant.komunitasId
      // A. Restore Users if provided
      if (users && users.length > 0) {
        for (const u of users) {
          // Check if email already used by another user
          const existingUser = await tx.user.findUnique({ where: { email: u.email } });
          if (!existingUser) {
            await tx.user.create({
              data: {
                id: u.id,
                komunitasId: tenant.komunitasId,
                nama: u.nama,
                email: u.email,
                passwordHash: u.passwordHash,
                role: u.role,
                createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
              }
            });
          }
        }
      }

      // B. Restore Anggota (without rombonganId to avoid foreign key errors)
      if (anggota && anggota.length > 0) {
        for (const a of anggota) {
          await tx.anggota.create({
            data: {
              id: a.id,
              komunitasId: tenant.komunitasId,
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
              komunitasId: tenant.komunitasId,
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
              komunitasId: tenant.komunitasId,
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
              komunitasId: tenant.komunitasId,
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

    return NextResponse.json({ success: true, message: 'Restore data berhasil dilakukan untuk komunitas Anda' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Gagal melakukan restore data: ' + error.message }, { status: 500 });
  }
}
