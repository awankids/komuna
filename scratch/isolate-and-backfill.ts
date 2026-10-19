import 'dotenv/config';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('=== STARTING DATA ISOLATION & BACKFILL ===');

  // 1. Get Dayu RT 02 Komunitas
  let dayuKomunitas = await db.komunitas.findFirst({
    where: { slug: 'dayu-02' },
  });

  if (!dayuKomunitas) {
    dayuKomunitas = await db.komunitas.create({
      data: {
        nama: 'RT Dayu 02',
        slug: 'dayu-02',
        tingkatWilayah: 'RT',
        noRt: '02',
        dusunPerumahan: 'Dayu DK1',
        desaKelurahan: 'Sinduharjo',
        kecamatan: 'Ngaglik',
        kotaKabupaten: 'Kabupaten Sleman',
        provinsi: 'D.I. Yogyakarta',
        targetJimpitan: 500000,
        temaWarna: 'orange',
        modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
        estimasiKk: '30-70',
        statusAktif: true,
      },
    });
    console.log('Created Dayu Komunitas:', dayuKomunitas.id);
  } else {
    console.log('Found existing Dayu Komunitas:', dayuKomunitas.id);
  }

  // 2. Ensure admin@komuna.id belongs to Dayu 02
  await db.user.updateMany({
    where: { email: 'admin@komuna.id' },
    data: {
      komunitasId: dayuKomunitas.id,
      jabatan: 'Ketua RT Dayu 02',
    },
  });
  console.log('Linked admin@komuna.id to Dayu RT 02');

  // 3. Backfill ALL existing operational records to Dayu RT 02
  const anggotaRes = await db.anggota.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${anggotaRes.count} Anggota to Dayu RT 02`);

  const jimpitanRes = await db.jimpitan.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${jimpitanRes.count} Jimpitan to Dayu RT 02`);

  const transaksiRes = await db.transaksiKeuangan.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${transaksiRes.count} Transaksi to Dayu RT 02`);

  const agendaRes = await db.agenda.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${agendaRes.count} Agenda to Dayu RT 02`);

  const pengurusRes = await db.pengurusRT.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${pengurusRes.count} Pengurus to Dayu RT 02`);

  const suratRes = await db.suratPengantar.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${suratRes.count} Surat to Dayu RT 02`);

  const mutasiRes = await db.mutasiWarga.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${mutasiRes.count} Mutasi to Dayu RT 02`);

  const programRes = await db.programKerja.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${programRes.count} ProgramKerja to Dayu RT 02`);

  const asetRes = await db.inventarisAset.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${asetRes.count} Aset to Dayu RT 02`);

  const arisanRes = await db.kelompokArisan.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${arisanRes.count} Arisan to Dayu RT 02`);

  const rombonganRes = await db.rombongan.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Backfilled ${rombonganRes.count} Rombongan to Dayu RT 02`);

  const configRes = await db.pengaturanAplikasi.updateMany({
    where: { komunitasId: null },
    data: { komunitasId: dayuKomunitas.id },
  });
  console.log(`Linked existing PengaturanAplikasi to Dayu RT 02`);

  // 4. Create or Update Isolated Demo Sandbox Komunitas
  let demoKomunitas = await db.komunitas.findFirst({
    where: { slug: 'demo-sandbox' },
  });

  if (!demoKomunitas) {
    demoKomunitas = await db.komunitas.create({
      data: {
        nama: 'RT 04 Sukamaju (Simulasi Demo)',
        slug: 'demo-sandbox',
        tingkatWilayah: 'RT',
        noRt: '04',
        noRw: '02',
        dusunPerumahan: 'Kampung Sukamaju',
        desaKelurahan: 'Sukamaju',
        kecamatan: 'Cilodong',
        kotaKabupaten: 'Kota Depok',
        provinsi: 'Jawa Barat',
        targetJimpitan: 3000000,
        temaWarna: 'orange',
        modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
        estimasiKk: '30-70',
        statusAktif: true,
      },
    });
    console.log('Created Demo Sandbox Komunitas:', demoKomunitas.id);
  } else {
    console.log('Found Demo Sandbox Komunitas:', demoKomunitas.id);
  }

  // 5. Connect demo@komuna.id EXCLUSIVELY to Demo Sandbox
  let demoUser = await db.user.findUnique({
    where: { email: 'demo@komuna.id' },
  });

  if (demoUser) {
    await db.user.update({
      where: { id: demoUser.id },
      data: {
        komunitasId: demoKomunitas.id,
        nama: 'Pengurus Demo (Simulasi Sukamaju)',
        jabatan: 'Ketua RT (Demo)',
      },
    });
    console.log('Updated demo@komuna.id to belong to demo-sandbox');
  } else {
    demoUser = await db.user.create({
      data: {
        nama: 'Pengurus Demo (Simulasi Sukamaju)',
        email: 'demo@komuna.id',
        noHp: '081200000000',
        passwordHash: hashPassword('demokomuna123'),
        role: 'ADMIN',
        jabatan: 'Ketua RT (Demo)',
        statusAktif: true,
        komunitasId: demoKomunitas.id,
      },
    });
    console.log('Created demo user under demo-sandbox');
  }

  // 6. Seed mock data for Demo Sandbox if it has no anggota yet
  const demoAnggotaCount = await db.anggota.count({
    where: { komunitasId: demoKomunitas.id },
  });

  if (demoAnggotaCount === 0) {
    console.log('Seeding mock data for Demo Sandbox...');
    const w1 = await db.anggota.create({
      data: {
        nama: 'Slamet Rahardjo (Simulasi)',
        noRumah: 'A-01',
        noHp: '081234567891',
        statusKeluarga: 'kepala_keluarga',
        isWajibJimpitan: true,
        isWajibRonda: true,
        komunitasId: demoKomunitas.id,
      },
    });

    const w2 = await db.anggota.create({
      data: {
        nama: 'Budi Santoso (Simulasi)',
        noRumah: 'A-02',
        noHp: '081234567892',
        statusKeluarga: 'kepala_keluarga',
        isWajibJimpitan: true,
        isWajibRonda: true,
        komunitasId: demoKomunitas.id,
      },
    });

    const w3 = await db.anggota.create({
      data: {
        nama: 'Drs. Hendro Wibowo (Simulasi)',
        noRumah: 'B-01',
        noHp: '081234567893',
        statusKeluarga: 'kepala_keluarga',
        isWajibJimpitan: true,
        isWajibRonda: false,
        komunitasId: demoKomunitas.id,
      },
    });

    await db.transaksiKeuangan.create({
      data: {
        tanggal: new Date(),
        jenis: 'pemasukan',
        sumber: 'manual',
        kategori: 'Kas Bulanan',
        keterangan: 'Penerimaan Kas Iuran Warga Bulan Berjalan (Demo)',
        nominal: 1250000,
        komunitasId: demoKomunitas.id,
      },
    });

    await db.transaksiKeuangan.create({
      data: {
        tanggal: new Date(),
        jenis: 'pengeluaran',
        sumber: 'manual',
        kategori: 'Kebersihan',
        keterangan: 'Pembelian kantong sampah & alat kerja bakti (Demo)',
        nominal: 150000,
        komunitasId: demoKomunitas.id,
      },
    });

    console.log('Demo Sandbox seeded with 3 mock citizens and 2 sample transactions');
  }

  console.log('=== DATA ISOLATION & BACKFILL COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((e) => {
    console.error('Error during data isolation:', e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
