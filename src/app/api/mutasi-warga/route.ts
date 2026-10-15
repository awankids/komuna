import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SEED_MUTASI = [
  {
    jenisMutasi: 'lahir',
    tanggalPeristiwa: new Date('2026-02-14'),
    namaWarga: 'Muhammad Arkan Maulana (Anak dari Bpk. Irfan)',
    noRumah: 'Blok B-08',
    jenisKelamin: 'Laki-laki',
    keterangan: 'Kelahiran anak kedua, persalinan normal di RS Hermina Pandanaran'
  },
  {
    jenisMutasi: 'masuk',
    tanggalPeristiwa: new Date('2026-03-01'),
    namaWarga: 'Bpk. Hendra Gunawan & Keluarga (3 Jiwa)',
    noRumah: 'Blok A-12',
    jenisKelamin: 'Laki-laki',
    keterangan: 'Pindah masuk dari Semarang Barat, membeli rumah di Blok A-12'
  },
  {
    jenisMutasi: 'meninggal',
    tanggalPeristiwa: new Date('2026-04-18'),
    namaWarga: 'Alm. Bpk. Sastro Hardjono (Usia 76 Th)',
    noRumah: 'Blok C-03',
    jenisKelamin: 'Laki-laki',
    keterangan: 'Tutup usia karena sakit sepuh, dimakamkan di TPU Sendangguwo'
  },
  {
    jenisMutasi: 'masuk',
    tanggalPeristiwa: new Date('2026-05-10'),
    namaWarga: 'Ibu Ratna Dewi & Suami (2 Jiwa)',
    noRumah: 'Blok B-15',
    jenisKelamin: 'Perempuan',
    keterangan: 'Warga baru mengontrak rumah Bpk. Sumardi selama 2 tahun'
  },
  {
    jenisMutasi: 'keluar',
    tanggalPeristiwa: new Date('2026-06-25'),
    namaWarga: 'Bpk. Rahmat Hidayat & Keluarga (4 Jiwa)',
    noRumah: 'Blok D-04',
    jenisKelamin: 'Laki-laki',
    keterangan: 'Pindah domisili ke Jakarta Selatan karena mutasi dinas BUMN'
  },
  {
    jenisMutasi: 'lahir',
    tanggalPeristiwa: new Date('2026-08-05'),
    namaWarga: 'Alisha Zahra Putri (Putri dari Bpk. Danang)',
    noRumah: 'Blok A-05',
    jenisKelamin: 'Perempuan',
    keterangan: 'Kelahiran anak pertama di RS Roemani'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const targetYear = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();
    const jenis = searchParams.get('jenis');

    // Auto seed if empty
    const count = await db.mutasiWarga.count();
    if (count === 0) {
      for (const item of SEED_MUTASI) {
        await db.mutasiWarga.create({ data: item });
      }
    }

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const where: any = {
      tanggalPeristiwa: {
        gte: startOfYear,
        lte: endOfYear
      }
    };

    if (jenis && jenis !== 'all') {
      where.jenisMutasi = jenis;
    }

    const items = await db.mutasiWarga.findMany({
      where,
      orderBy: { tanggalPeristiwa: 'desc' }
    });

    // Summary calculation
    let totalLahir = 0;
    let totalMeninggal = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    items.forEach(m => {
      if (m.jenisMutasi === 'lahir') totalLahir += 1;
      else if (m.jenisMutasi === 'meninggal') totalMeninggal += 1;
      else if (m.jenisMutasi === 'masuk') totalMasuk += 1;
      else if (m.jenisMutasi === 'keluar') totalKeluar += 1;
    });

    const deltaNetto = (totalLahir + totalMasuk) - (totalMeninggal + totalKeluar);

    // Total Registered Residents in Anggota table
    const totalWargaAktif = await db.anggota.count({ where: { statusAktif: true } });

    return NextResponse.json({
      tahun: targetYear,
      data: items,
      summary: {
        totalLahir,
        totalMeninggal,
        totalMasuk,
        totalKeluar,
        deltaNetto,
        totalWargaAktif
      }
    });
  } catch (error: any) {
    console.error('Error fetching mutasi warga:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat mutasi warga' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      jenisMutasi, 
      tanggalPeristiwa, 
      namaWarga, 
      nik, 
      noRumah, 
      jenisKelamin, 
      keterangan, 
      anggotaId,
      dicatatOleh 
    } = body;

    if (!jenisMutasi || !namaWarga) {
      return NextResponse.json({ error: 'Jenis mutasi dan nama warga wajib diisi' }, { status: 400 });
    }

    const item = await db.mutasiWarga.create({
      data: {
        jenisMutasi,
        tanggalPeristiwa: tanggalPeristiwa ? new Date(tanggalPeristiwa) : new Date(),
        namaWarga,
        nik: nik || null,
        noRumah: noRumah || null,
        jenisKelamin: jenisKelamin || null,
        keterangan: keterangan || null,
        anggotaId: anggotaId || null,
        dicatatOleh: dicatatOleh || 'Sekretaris RT'
      }
    });

    // If anggotaId provided and mutasi is 'meninggal' or 'keluar', optionally set statusAktif to false
    if (anggotaId && (jenisMutasi === 'meninggal' || jenisMutasi === 'keluar')) {
      await db.anggota.update({
        where: { id: anggotaId },
        data: { statusAktif: false }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: item, message: 'Data mutasi warga berhasil dicatat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mutasi warga:', error);
    return NextResponse.json({ error: error.message || 'Gagal mencatat mutasi warga' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mutasi wajib disertakan' }, { status: 400 });
    }

    await db.mutasiWarga.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Data mutasi berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting mutasi:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus mutasi' }, { status: 500 });
  }
}
