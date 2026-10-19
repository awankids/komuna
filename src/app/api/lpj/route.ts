import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

const DEFAULT_EVALUASI = {
  kataPengantar: 'Puji dan syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas terselenggaranya seluruh program kerja dan pelayanan warga di lingkungan RT kita sepanjang tahun ini. Laporan Pertanggungjawaban ini kami susun sebagai bentuk transparansi, akuntabilitas, dan keterbukaan tata kelola kepengurusan Rukun Tetangga.',
  kendalaTantangan: '1. Partisipasi kerja bakti di beberapa blok perumahan masih perlu ditingkatkan karena kesibukan warga.\n2. Curah hujan tinggi pada musim penghujan sempat menyebabkan debit saluran air meluap sebelum dinormalisasi.\n3. Beberapa inventaris terop dan kursi mengalami keausan setelah sering digunakan untuk kegiatan bersama.',
  solusiTindakan: '1. Mengoptimalkan reminder kegiatan melalui pesan WhatsApp grup warga dan pendekatan personal antarkerabat.\n2. Mengajukan bantuan pompa celup air ke pihak Kelurahan yang telah berhasil terealisasi.\n3. Mengalokasikan dana pemeliharaan kas RT untuk perbaikan berkala pada kaki kursi dan tenda.',
  usulanRencana: '1. Pembangunan resapan biopori di setiap gang untuk pencegahan genangan air.\n2. Pemasangan penerangan lampu tenaga surya (solar cell) di 5 titik sudut lingkungan yang masih gelap.\n3. Pelatihan tanggap darurat bencana dan P3K lingkungan bekerjasama dengan Puskesmas.\n4. Pengadaan proyektor/layar untuk kemudahan rapat warga dan nonton bareng kemerdekaan.',
  estimasiAnggaran: 12500000
};

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const targetYear = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    // 1. App Configuration & Legalitas
    const config = await db.pengaturanAplikasi.findFirst({
      where: { komunitasId: tenant.komunitasId },
    }) || {
      namaApp: 'komuna.id',
      namaRt: 'RT',
      tagline: 'Kebersamaan, Terpadu, Transparan',
      targetJimpitan: 3000000,
      kotaWilayah: 'Semarang',
      nomorSk: 'SK.04/RW.02/KEL.SDG/2024',
      periodeAktif: '2024 - 2029'
    };

    // 2. Susunan Pengurus RT
    const pengurus = await db.pengurusRT.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        statusAktif: true,
      },
      orderBy: { urutan: 'asc' }
    });

    const ketuaRt = pengurus.find(p => p.jabatan.toLowerCase().includes('ketua') && !p.jabatan.toLowerCase().includes('wakil'))?.nama || 'Bpk. Bambang Sutrisno';
    const sekretaris = pengurus.find(p => p.jabatan.toLowerCase().includes('sekretaris'))?.nama || 'Bpk. Joko Susanto';
    const bendahara = pengurus.find(p => p.jabatan.toLowerCase().includes('bendahara'))?.nama || 'Ibu Siti Rahmawati';

    // 3. Mutasi Warga (Pilar 1)
    const mutasiList = await db.mutasiWarga.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tanggalPeristiwa: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: { tanggalPeristiwa: 'asc' }
    });

    let totalLahir = 0;
    let totalMeninggal = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    mutasiList.forEach(m => {
      if (m.jenisMutasi === 'lahir') totalLahir++;
      else if (m.jenisMutasi === 'meninggal') totalMeninggal++;
      else if (m.jenisMutasi === 'masuk') totalMasuk++;
      else if (m.jenisMutasi === 'keluar') totalKeluar++;
    });

    const totalWargaAktif = await db.anggota.count({
      where: { komunitasId: tenant.komunitasId, statusAktif: true },
    });
    const totalKkAktif = await db.anggota.count({
      where: { komunitasId: tenant.komunitasId, statusAktif: true, statusKeluarga: 'kepala_keluarga' },
    });
    const totalLaki = await db.anggota.count({
      where: { komunitasId: tenant.komunitasId, statusAktif: true, jenisKelamin: 'Laki-laki' },
    });
    const totalPerempuan = await db.anggota.count({
      where: { komunitasId: tenant.komunitasId, statusAktif: true, jenisKelamin: 'Perempuan' },
    });
    const deltaNetto = (totalLahir + totalMasuk) - (totalMeninggal + totalKeluar);

    // 4. Realisasi Keuangan Kas (Pilar Keuangan 1 Tahun)
    const transactions = await db.transaksiKeuangan.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tanggal: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      orderBy: { tanggal: 'asc' }
    });

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const kategoriSummary: Record<string, { pemasukan: number; pengeluaran: number }> = {};

    transactions.forEach(t => {
      const kat = t.kategori || 'Umum';
      if (!kategoriSummary[kat]) {
        kategoriSummary[kat] = { pemasukan: 0, pengeluaran: 0 };
      }

      if (t.jenis === 'pemasukan') {
        totalPemasukan += t.nominal;
        kategoriSummary[kat].pemasukan += t.nominal;
      } else {
        totalPengeluaran += t.nominal;
        kategoriSummary[kat].pengeluaran += t.nominal;
      }
    });

    // Saldo Awal (sebelum 1 Jan tahun target)
    const priorTransactions = await db.transaksiKeuangan.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tanggal: { lt: startOfYear }
      }
    });

    let saldoAwalTahun = 0;
    priorTransactions.forEach(t => {
      if (t.jenis === 'pemasukan') saldoAwalTahun += t.nominal;
      else saldoAwalTahun -= t.nominal;
    });

    const saldoAkhirTahun = saldoAwalTahun + totalPemasukan - totalPengeluaran;

    // 5. Realisasi Program Kerja (Pilar 2)
    const prokerList = await db.programKerja.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tahun: targetYear,
      },
      orderBy: { createdAt: 'asc' }
    });

    let totalProker = prokerList.length;
    let prokerTerlaksana = 0;
    let totalAnggaranRencana = 0;
    let totalAnggaranRealisasi = 0;

    prokerList.forEach(p => {
      totalAnggaranRencana += p.anggaranRencana;
      totalAnggaranRealisasi += p.anggaranRealisasi;
      if (p.status === 'terlaksana') prokerTerlaksana++;
    });

    const persentaseCapaianProker = totalProker > 0 
      ? Math.round((prokerTerlaksana / totalProker) * 100) 
      : 0;

    // 6. Inventaris & Aset RT (Pilar 3)
    const inventarisList = await db.inventarisAset.findMany({
      where: {
        komunitasId: tenant.komunitasId,
      },
      orderBy: { createdAt: 'asc' }
    });

    let totalUnitAset = 0;
    let totalAsetBaik = 0;
    let totalAsetRusak = 0;
    let asetBertambahTahunIni = 0;

    inventarisList.forEach(i => {
      totalUnitAset += i.jumlah;
      totalAsetBaik += i.kondisiBaik;
      totalAsetRusak += i.kondisiRusak;
      if (i.statusTahunIni === 'bertambah_baru' || i.tahunPengadaan === targetYear) {
        asetBertambahTahunIni += i.jumlah;
      }
    });

    // 7. Evaluasi & Rencana Masa Depan (Pilar 4)
    let evaluasi = await db.evaluasiTahunan.findFirst({
      where: {
        komunitasId: tenant.komunitasId,
        tahun: targetYear,
      }
    });

    if (!evaluasi) {
      evaluasi = {
        id: 'default',
        tahun: targetYear,
        ...DEFAULT_EVALUASI,
        komunitasId: tenant.komunitasId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return NextResponse.json({
      tahun: targetYear,
      config,
      signatories: {
        ketuaRt,
        sekretaris,
        bendahara
      },
      pengurus,
      mutasi: {
        list: mutasiList,
        summary: {
          totalLahir,
          totalMeninggal,
          totalMasuk,
          totalKeluar,
          deltaNetto,
          totalWargaAktif,
          totalKkAktif,
          totalLaki,
          totalPerempuan
        }
      },
      keuangan: {
        saldoAwalTahun,
        totalPemasukan,
        totalPengeluaran,
        saldoAkhirTahun,
        kategoriSummary,
        transaksiCount: transactions.length
      },
      programKerja: {
        list: prokerList,
        summary: {
          totalProker,
          prokerTerlaksana,
          persentaseCapaianProker,
          totalAnggaranRencana,
          totalAnggaranRealisasi
        }
      },
      inventaris: {
        list: inventarisList,
        summary: {
          totalJenis: inventarisList.length,
          totalUnitAset,
          totalAsetBaik,
          totalAsetRusak,
          asetBertambahTahunIni
        }
      },
      evaluasi
    });
  } catch (error: any) {
    console.error('Error compiling LPJ data:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyusun data LPJ' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { 
      tahun, 
      kataPengantar, 
      kendalaTantangan, 
      solusiTindakan, 
      usulanRencana, 
      estimasiAnggaran 
    } = body;

    const targetYear = Number(tahun) || new Date().getFullYear();

    const evaluasi = await db.evaluasiTahunan.upsert({
      where: {
        komunitasId_tahun: {
          komunitasId: tenant.komunitasId,
          tahun: targetYear,
        },
      },
      update: {
        kataPengantar: kataPengantar || null,
        kendalaTantangan: kendalaTantangan || '',
        solusiTindakan: solusiTindakan || '',
        usulanRencana: usulanRencana || '',
        estimasiAnggaran: Number(estimasiAnggaran) || 0
      },
      create: {
        komunitasId: tenant.komunitasId,
        tahun: targetYear,
        kataPengantar: kataPengantar || null,
        kendalaTantangan: kendalaTantangan || '',
        solusiTindakan: solusiTindakan || '',
        usulanRencana: usulanRencana || '',
        estimasiAnggaran: Number(estimasiAnggaran) || 0
      }
    });

    return NextResponse.json({ success: true, data: evaluasi, message: 'Catatan evaluasi dan rencana tahun depan berhasil disimpan' });
  } catch (error: any) {
    console.error('Error saving evaluasi:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan evaluasi' }, { status: 500 });
  }
}
