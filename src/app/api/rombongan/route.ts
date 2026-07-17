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
      ketuaNoRumah: rom.ketua?.noRumah ? `No. ${rom.ketua.noRumah}` : '',
      activeMemberCount: rom.anggota.length,
      // also return list of all active members in this group to choose leader from
      activeMembers: rom.anggota.map(a => ({ id: a.id, nama: a.nama }))
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

// PUT update Rombongan (name or leader assignment)
export async function PUT(request: Request) {
  try {
    const { id, nama, ketuaId, hariPiket } = await request.json();
    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan Nama rombongan wajib diisi' }, { status: 400 });
    }

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

    // Update dynamically so undefined fields are not wiped
    const dataToUpdate: any = { nama };
    if (ketuaId !== undefined) {
      dataToUpdate.ketuaId = ketuaId === 'none' ? null : (ketuaId || null);
    }
    if (hariPiket !== undefined) {
      dataToUpdate.hariPiket = hariPiket === 'none' ? null : (hariPiket ? parseInt(hariPiket, 10) : null);
    }

    const updated = await db.rombongan.update({
      where: { id },
      data: dataToUpdate
    });

    // Auto-regenerate schedules for July 2026 if hariPiket was updated
    if (hariPiket !== undefined) {
      await regenerateSchedules(2026, 6); // 6 is July (0-indexed)
    }

    return NextResponse.json(updated);
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
