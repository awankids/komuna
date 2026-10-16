import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all Rombongan along with count of active members and leader details
export async function GET() {
  try {
    const rombongan = await db.rombongan.findMany({
      include: {
        ketua: true,
        anggota: {
          where: { statusAktif: true }
        }
      },
      orderBy: { nama: 'asc' },
    });
    
    // Format the response to return the counts nicely
    const formatted = rombongan.map(rom => ({
      id: rom.id,
      nama: rom.nama,
      ketuaId: rom.ketuaId,
      hariPiket: rom.hariPiket,
      ketuaNama: rom.ketua?.nama || 'Belum Ditentukan',
      ketuaNoRumah: rom.ketua?.noRumah || '',
      activeMemberCount: rom.anggota.length,
      // also return list of all active members in this group to choose leader from
      activeMembers: rom.anggota.map(a => ({ 
        id: a.id, 
        nama: a.nama,
        noRumah: a.noRumah,
        noHp: a.noHp,
        statusKeluarga: a.statusKeluarga
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching rombongan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data rombongan' }, { status: 500 });
  }
}

// POST create new Rombongan group
export async function POST(request: Request) {
  try {
    const { nama } = await request.json();
    if (!nama) {
      return NextResponse.json({ error: 'Nama rombongan wajib diisi' }, { status: 400 });
    }

    const existing = await db.rombongan.findUnique({
      where: { nama }
    });

    if (existing) {
      return NextResponse.json({ error: 'Nama rombongan sudah digunakan' }, { status: 400 });
    }

    const newRom = await db.rombongan.create({
      data: { nama }
    });

    return NextResponse.json(newRom, { status: 201 });
  } catch (error: any) {
    console.error('Error creating rombongan:', error);
    return NextResponse.json({ error: 'Gagal menambahkan rombongan baru' }, { status: 500 });
  }
}

async function regenerateSchedules(yearNum: number, monthNum: number) {
  // Fetch all groups
  const groups = await db.rombongan.findMany({
    include: {
      anggota: {
        where: { statusAktif: true },
        orderBy: { nama: 'asc' },
      },
    },
    orderBy: { nama: 'asc' },
  });

  if (groups.length === 0) return;

  const numDays = new Date(yearNum, monthNum + 1, 0).getDate();
  const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1));
  const endOfMonth = new Date(Date.UTC(yearNum, monthNum, numDays, 23, 59, 59, 999));

  // Delete existing
  await db.jadwalPetugas.deleteMany({
    where: {
      tanggal: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const groupPointers: { [key: string]: number } = {};
  groups.forEach(g => {
    groupPointers[g.id] = 0;
  });

  for (let day = 1; day <= numDays; day++) {
    const date = new Date(Date.UTC(yearNum, monthNum, day));
    const dayOfWeek = date.getDay();
    const weekdayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    const group = groups.find(g => g.hariPiket === weekdayNum);

    if (group && group.anggota.length > 0) {
      const ptr = groupPointers[group.id];
      const member = group.anggota[ptr % group.anggota.length];
      groupPointers[group.id] = ptr + 1;

      await db.jadwalPetugas.create({
        data: {
          anggotaId: member.id,
          tanggal: date,
          keterangan: 'Jadwal Ronda/Jimpitan Bulanan',
        },
      });
    }
  }
}

// PUT update Rombongan (name, leader assignment, schedule day, and add/remove members)
export async function PUT(request: Request) {
  try {
    const { id, nama, ketuaId, hariPiket, addAnggotaId, removeAnggotaId } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID rombongan wajib diisi' }, { status: 400 });
    }

    // 1. Handle adding an anggota to this rombongan
    if (addAnggotaId) {
      await db.anggota.update({
        where: { id: addAnggotaId },
        data: { rombonganId: id, isWajibRonda: true }
      });
    }

    // 2. Handle removing an anggota from this rombongan
    if (removeAnggotaId) {
      await db.anggota.update({
        where: { id: removeAnggotaId },
        data: { rombonganId: null }
      });
      // If the removed member was the ketua, clear ketuaId
      const currentRom = await db.rombongan.findUnique({ where: { id } });
      if (currentRom?.ketuaId === removeAnggotaId) {
        await db.rombongan.update({
          where: { id },
          data: { ketuaId: null }
        });
      }
    }

    // 3. Handle updating metadata (nama, ketuaId, hariPiket) if provided
    const dataToUpdate: any = {};

    if (nama) {
      // Check if name is already taken by another group
      const duplicate = await db.rombongan.findFirst({
        where: {
          nama,
          NOT: { id }
        }
      });

      if (duplicate) {
        return NextResponse.json({ error: 'Nama rombongan sudah digunakan' }, { status: 400 });
      }
      dataToUpdate.nama = nama;
    }

    // If day is assigned, clear it from other groups first to maintain 1-to-1 weekday assignment mapping
    if (hariPiket && hariPiket !== 'none') {
      const dayVal = parseInt(hariPiket, 10);
      await db.rombongan.updateMany({
        where: {
          hariPiket: dayVal,
          NOT: { id }
        },
        data: { hariPiket: null }
      });
    }

    if (ketuaId !== undefined) {
      dataToUpdate.ketuaId = ketuaId === 'none' ? null : (ketuaId || null);
    }
    if (hariPiket !== undefined) {
      dataToUpdate.hariPiket = hariPiket === 'none' ? null : (hariPiket ? parseInt(hariPiket, 10) : null);
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await db.rombongan.update({
        where: { id },
        data: dataToUpdate
      });
    }

    // Auto-regenerate schedules for current month & year if hariPiket was updated
    if (hariPiket !== undefined) {
      const now = new Date();
      await regenerateSchedules(now.getFullYear(), now.getMonth());
    }

    // Return the fresh full formatted rombongan
    const fresh = await db.rombongan.findUnique({
      where: { id },
      include: {
        ketua: true,
        anggota: {
          where: { statusAktif: true }
        }
      }
    });

    if (!fresh) {
      return NextResponse.json({ error: 'Rombongan tidak ditemukan' }, { status: 404 });
    }

    const formatted = {
      id: fresh.id,
      nama: fresh.nama,
      ketuaId: fresh.ketuaId,
      hariPiket: fresh.hariPiket,
      ketuaNama: fresh.ketua?.nama || 'Belum Ditentukan',
      ketuaNoRumah: fresh.ketua?.noRumah || '',
      activeMemberCount: fresh.anggota.length,
      activeMembers: fresh.anggota.map(a => ({ 
        id: a.id, 
        nama: a.nama,
        noRumah: a.noRumah,
        noHp: a.noHp,
        statusKeluarga: a.statusKeluarga
      }))
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error updating rombongan:', error);
    return NextResponse.json({ error: 'Gagal memperbarui rombongan' }, { status: 500 });
  }
}

// DELETE Rombongan group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID rombongan wajib dicantumkan' }, { status: 400 });
    }

    await db.rombongan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Rombongan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting rombongan:', error);
    return NextResponse.json({ error: 'Gagal menghapus rombongan' }, { status: 500 });
  }
}
