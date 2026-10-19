import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

// GET all schedules along with anggota info for this tenant
export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const schedules = await db.jadwalPetugas.findMany({
      where: {
        anggota: {
          komunitasId: tenant.komunitasId,
        }
      },
      include: {
        anggota: true,
      },
      orderBy: { tanggal: 'asc' },
    });
    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil data jadwal' }, { status: 500 });
  }
}

// POST or GENERATE schedules
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    
    // Check if it is a generate action
    if (body.action === 'generate') {
      const { startYear, startMonth } = body;
      if (!startYear || !startMonth) {
        return NextResponse.json({ error: 'Tahun dan bulan mulai wajib diisi' }, { status: 400 });
      }

      // Fetch all Rombongan groups for this tenant along with active members
      const groups = await db.rombongan.findMany({
        where: {
          komunitasId: tenant.komunitasId,
        },
        include: {
          anggota: {
            where: { statusAktif: true, komunitasId: tenant.komunitasId },
            orderBy: { nama: 'asc' },
          },
        },
        orderBy: { nama: 'asc' },
      });

      if (groups.length === 0) {
        return NextResponse.json({ error: 'Tidak ada kelompok rombongan untuk membuat jadwal' }, { status: 400 });
      }

      // Generate date array for the month
      const yearNum = parseInt(startYear, 10);
      const monthNum = parseInt(startMonth, 10) - 1; // 0-indexed month
      
      const numDays = new Date(yearNum, monthNum + 1, 0).getDate();
      const createdSchedules = [];

      // Delete existing schedules for this month first only for this tenant
      const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1));
      const endOfMonth = new Date(Date.UTC(yearNum, monthNum, numDays, 23, 59, 59, 999));
      
      await db.jadwalPetugas.deleteMany({
        where: {
          tanggal: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          anggota: {
            komunitasId: tenant.komunitasId,
          }
        },
      });

      // Keep track of rotation pointer for each group ID
      const groupPointers: { [key: string]: number } = {};
      groups.forEach(g => {
        groupPointers[g.id] = 0;
      });

      // Round-robin assignment based on groups (Fixed Day logic mapped by database hariPiket setting)
      for (let day = 1; day <= numDays; day++) {
        const date = new Date(Date.UTC(yearNum, monthNum, day));
        
        // 1=Senin, 2=Selasa, ..., 7=Minggu
        const dayOfWeek = date.getDay();
        const weekdayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        // Find Rombongan group whose hariPiket matches this weekdayNum
        const group = groups.find(g => g.hariPiket === weekdayNum);

        if (group && group.anggota.length > 0) {
          const ptr = groupPointers[group.id];
          const member = group.anggota[ptr % group.anggota.length];
          groupPointers[group.id] = ptr + 1;

          const schedule = await db.jadwalPetugas.create({
            data: {
              anggotaId: member.id,
              tanggal: date,
              keterangan: 'Jadwal Ronda/Jimpitan Bulanan',
            },
          });
          createdSchedules.push(schedule);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Berhasil men-generate ${createdSchedules.length} jadwal jimpitan berdasarkan rombongan.`,
        schedules: createdSchedules 
      });
    }

    // Otherwise, assign a single schedule manually
    const { anggotaId, tanggal, keterangan } = body;
    
    if (!anggotaId || !tanggal) {
      return NextResponse.json({ error: 'ID Anggota dan Tanggal wajib diisi' }, { status: 400 });
    }

    // Verify anggota belongs to this tenant
    const targetMember = await db.anggota.findFirst({
      where: { id: anggotaId, komunitasId: tenant.komunitasId }
    });
    if (!targetMember) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    const dateVal = new Date(tanggal);

    // Check if schedule for this date already exists for this tenant
    const existing = await db.jadwalPetugas.findFirst({
      where: {
        tanggal: {
          gte: new Date(dateVal.setHours(0, 0, 0, 0)),
          lte: new Date(dateVal.setHours(23, 59, 59, 999)),
        },
        anggota: {
          komunitasId: tenant.komunitasId,
        }
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Jadwal untuk tanggal ini sudah ada di komunitas Anda' }, { status: 400 });
    }

    const newSchedule = await db.jadwalPetugas.create({
      data: {
        anggotaId,
        tanggal: new Date(tanggal),
        keterangan: keterangan || 'Piket Jimpitan RT',
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambahkan jadwal petugas' }, { status: 500 });
  }
}

// DELETE a schedule
export async function DELETE(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID jadwal wajib dicantumkan' }, { status: 400 });
    }

    // Verify schedule belongs to this tenant
    const sched = await db.jadwalPetugas.findFirst({
      where: { id },
      include: { anggota: true }
    });

    if (!sched || sched.anggota?.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan di komunitas Anda' }, { status: 404 });
    }
    
    await db.jadwalPetugas.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 });
  }
}
