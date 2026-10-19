import 'dotenv/config';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('Seeding initial Komunitas and Demo account...');

  // 1. Find or create default Komunitas for Dayu 02
  let defaultKomunitas = await db.komunitas.findFirst({
    where: { slug: 'dayu-02' },
  });

  if (!defaultKomunitas) {
    defaultKomunitas = await db.komunitas.create({
      data: {
        nama: 'RT Dayu 02',
        slug: 'dayu-02',
        tingkatWilayah: 'RT',
        noRt: '02',
        noRw: '01',
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
    console.log('Created default Komunitas:', defaultKomunitas.id);
  } else {
    console.log('Existing default Komunitas:', defaultKomunitas.id);
  }

  // 2. Link existing admin to default Komunitas
  await db.user.updateMany({
    where: { email: 'admin@komuna.id' },
    data: {
      komunitasId: defaultKomunitas.id,
      jabatan: 'Ketua RT',
    },
  });
  console.log('Updated admin@komuna.id with komunitasId and jabatan');

  // 3. Ensure demo user exists
  const demoEmail = 'demo@komuna.id';
  let demoUser = await db.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    demoUser = await db.user.create({
      data: {
        nama: 'Pengurus Demo (Simulasi RT)',
        email: demoEmail,
        noHp: '081200000000',
        passwordHash: hashPassword('demokomuna123'),
        role: 'ADMIN',
        jabatan: 'Ketua RT (Demo)',
        statusAktif: true,
        komunitasId: defaultKomunitas.id,
      },
    });
    console.log('Created demo user:', demoUser.email);
  } else {
    console.log('Existing demo user found:', demoUser.email);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
