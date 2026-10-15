import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let list = await db.pengurusRT.findMany({
      orderBy: [
        { urutan: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        anggota: {
          select: {
            id: true,
            nama: true,
            noRumah: true,
            noHp: true
          }
        }
      }
    });

    // Auto-seed default pengurus if table is empty
    if (list.length === 0) {
      const defaultOfficers = [
        {
          jabatan: 'Ketua RT',
          kategori: 'inti',
          nama: 'Bpk. Bambang Sutrisno',
          noHp: '081234567890',
          alamatRumah: 'Blok A No. 04',
          urutan: 1,
          periode: '2024 - 2029',
          statusAktif: true,
          keterangan: 'Penandatangan Dokumen Resmi & Legalitas RT'
        },
        {
          jabatan: 'Sekretaris',
          kategori: 'inti',
          nama: 'Bpk. Ahmad Dahlan',
          noHp: '081234567891',
          alamatRumah: 'Blok B No. 12',
          urutan: 2,
          periode: '2024 - 2029',
          statusAktif: true,
          keterangan: 'Administrasi, Agenda & Arsip Warga'
        },
        {
          jabatan: 'Bendahara',
          kategori: 'inti',
          nama: 'Ibu Siti Rahmawati',
          noHp: '081234567892',
          alamatRumah: 'Blok A No. 07',
          urutan: 3,
          periode: '2024 - 2029',
          statusAktif: true,
          keterangan: 'Penandatangan Laporan Kas & Pengelola Jimpitan'
        },
        {
          jabatan: 'Seksi Keamanan & Ketertiban',
          kategori: 'seksi',
          nama: 'Bpk. Agus Santoso',
          noHp: '081234567893',
          alamatRumah: 'Blok C No. 01',
          urutan: 4,
          periode: '2024 - 2029',
          statusAktif: true,
          keterangan: 'Koordinator Ronda & Keamanan Lingkungan'
        },
        {
          jabatan: 'Seksi Pembangunan & Kebersihan',
          kategori: 'seksi',
          nama: 'Bpk. Heru Triyono',
          noHp: '081234567894',
          alamatRumah: 'Blok D No. 05',
          urutan: 5,
          periode: '2024 - 2029',
          statusAktif: true,
          keterangan: 'Perawatan Fasilitas & Kerja Bakti'
        }
      ];

      for (const item of defaultOfficers) {
        await db.pengurusRT.create({ data: item });
      }

      list = await db.pengurusRT.findMany({
        orderBy: [
          { urutan: 'asc' },
          { createdAt: 'asc' }
        ],
        include: {
          anggota: {
            select: {
              id: true,
              nama: true,
              noRumah: true,
              noHp: true
            }
          }
        }
      });
    }

    // Helper signatures extraction
    const ketua = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('ketua'))?.nama || '';
    const bendahara = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('bendahara'))?.nama || '';
    const sekretaris = list.find(p => p.statusAktif && p.jabatan.toLowerCase().includes('sekretaris'))?.nama || '';

    return NextResponse.json({
      success: true,
      data: list,
      signatures: {
        ketuaRt: ketua,
        bendahara,
        sekretaris
      }
    });
  } catch (error) {
    console.error('Failed to fetch PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengurus' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      jabatan, 
      kategori = 'inti', 
      nama, 
      nik, 
      noHp, 
      alamatRumah, 
      anggotaId, 
      urutan = 99, 
      periode = '2024 - 2029', 
      statusAktif = true, 
      keterangan 
    } = body;

    if (!jabatan || !nama) {
      return NextResponse.json({ error: 'Jabatan dan Nama pengurus wajib diisi' }, { status: 400 });
    }

    const created = await db.pengurusRT.create({
      data: {
        jabatan,
        kategori,
        nama,
        nik: nik || null,
        noHp: noHp || null,
        alamatRumah: alamatRumah || null,
        anggotaId: anggotaId || null,
        urutan: Number(urutan) || 1,
        periode: periode || '2024 - 2029',
        statusAktif: Boolean(statusAktif),
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Failed to create PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal menambahkan pengurus baru' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      jabatan, 
      kategori, 
      nama, 
      nik, 
      noHp, 
      alamatRumah, 
      anggotaId, 
      urutan, 
      periode, 
      statusAktif, 
      keterangan 
    } = body;

    if (!id || !nama || !jabatan) {
      return NextResponse.json({ error: 'ID, Nama, dan Jabatan wajib diisi' }, { status: 400 });
    }

    const updated = await db.pengurusRT.update({
      where: { id },
      data: {
        jabatan,
        kategori: kategori || 'inti',
        nama,
        nik: nik !== undefined ? nik : undefined,
        noHp: noHp !== undefined ? noHp : undefined,
        alamatRumah: alamatRumah !== undefined ? alamatRumah : undefined,
        anggotaId: anggotaId !== undefined ? anggotaId : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        periode: periode !== undefined ? periode : undefined,
        statusAktif: statusAktif !== undefined ? Boolean(statusAktif) : undefined,
        keterangan: keterangan !== undefined ? keterangan : undefined
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data pengurus' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pengurus wajib disertakan' }, { status: 400 });
    }

    await db.pengurusRT.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Pengurus berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete PengurusRT:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengurus' }, { status: 500 });
  }
}
