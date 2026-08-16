import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to parse "YYYY-MM-DD" or ISO string into a safe UTC Date
const parseUtcDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanDateStr = dateStr.split('T')[0];
  const parts = cleanDateStr.split('-').map(Number);
  if (parts.length === 3) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0));
  }
  return new Date(dateStr);
};

// GET all agenda for a month & year (or all if omitted)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (month && year) {
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10) - 1; // 0-indexed month

      const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
      const numDays = new Date(yearNum, monthNum + 1, 0).getDate();
      const endOfMonth = new Date(Date.UTC(yearNum, monthNum, numDays, 23, 59, 59, 999));

      const agendaList = await db.agenda.findMany({
        where: {
          tanggal: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: [
          { tanggal: 'asc' },
          { waktuMulai: 'asc' },
        ],
      });

      return NextResponse.json(agendaList);
    }

    // Default: return all
    const allAgenda = await db.agenda.findMany({
      orderBy: [
        { tanggal: 'asc' },
        { waktuMulai: 'asc' },
      ],
    });

    return NextResponse.json(allAgenda);
  } catch (error: any) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json({ error: 'Gagal mengambil data agenda' }, { status: 500 });
  }
}

// POST create new agenda
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judul, kategori, tanggal, waktuMulai, waktuSelesai, lokasi, keterangan, status } = body;

    if (!judul || !tanggal) {
      return NextResponse.json({ error: 'Judul dan tanggal wajib diisi' }, { status: 400 });
    }

    const dateVal = parseUtcDate(tanggal);

    const newAgenda = await db.agenda.create({
      data: {
        judul,
        kategori: kategori || 'umum',
        tanggal: dateVal,
        waktuMulai: waktuMulai || null,
        waktuSelesai: waktuSelesai || null,
        lokasi: lokasi || null,
        keterangan: keterangan || null,
        status: status || 'terjadwal',
      },
    });

    // Trigger Smart Notification for Agenda (Fire and forget)
    const formattedDate = new Date(dateVal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const locationString = lokasi ? ` di ${lokasi}` : '';
    const timeString = waktuMulai ? ` pkl ${waktuMulai}` : '';
    
    db.notifikasi.create({
      data: {
        title: 'Agenda Baru 📅',
        message: `Ada agenda baru: **${judul}** pada tanggal ${formattedDate}${timeString}${locationString}.`,
        type: 'info',
        isRead: false
      }
    }).catch(err => console.error('Failed to create agenda notification:', err));

    return NextResponse.json(newAgenda, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    return NextResponse.json({ error: 'Gagal menambahkan agenda baru: ' + (error.message || error) }, { status: 500 });
  }
}

// PUT update existing agenda
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, judul, kategori, tanggal, waktuMulai, waktuSelesai, lokasi, keterangan, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID agenda wajib dicantumkan' }, { status: 400 });
    }

    const updateData: any = {};
    if (judul !== undefined) updateData.judul = judul;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (tanggal !== undefined) updateData.tanggal = parseUtcDate(tanggal);
    if (waktuMulai !== undefined) updateData.waktuMulai = waktuMulai;
    if (waktuSelesai !== undefined) updateData.waktuSelesai = waktuSelesai;
    if (lokasi !== undefined) updateData.lokasi = lokasi;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (status !== undefined) updateData.status = status;

    const updatedAgenda = await db.agenda.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedAgenda);
  } catch (error: any) {
    console.error('Error updating agenda:', error);
    return NextResponse.json({ error: 'Gagal memperbarui agenda: ' + (error.message || error) }, { status: 500 });
  }
}

// DELETE an agenda
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID agenda wajib dicantumkan' }, { status: 400 });
    }

    await db.agenda.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Agenda berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting agenda:', error);
    return NextResponse.json({ error: 'Gagal menghapus agenda: ' + (error.message || error) }, { status: 500 });
  }
}
