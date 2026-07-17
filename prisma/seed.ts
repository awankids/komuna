import { PrismaClient } from '../src/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import * as crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database with dynamic Rombongan structure...');

  // 1. Clear database
  await prisma.transaksiKeuangan.deleteMany({});
  await prisma.jimpitan.deleteMany({});
  await prisma.jadwalPetugas.deleteMany({});
  await prisma.anggota.deleteMany({});
  await prisma.rombongan.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      nama: 'Admin RT 04',
      email: 'admin@komuna.id',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
    },
  });
  console.log('Created user:', admin.email);

  // 3. Create 7 Rombongan Groups first (representing 7 days of the week)
  const rom1 = await prisma.rombongan.create({ data: { nama: 'Rombongan 1', hariPiket: 1 } });
  const rom2 = await prisma.rombongan.create({ data: { nama: 'Rombongan 2', hariPiket: 2 } });
  const rom3 = await prisma.rombongan.create({ data: { nama: 'Rombongan 3', hariPiket: 3 } });
  const rom4 = await prisma.rombongan.create({ data: { nama: 'Rombongan 4', hariPiket: 4 } });
  const rom5 = await prisma.rombongan.create({ data: { nama: 'Rombongan 5', hariPiket: 5 } });
  const rom6 = await prisma.rombongan.create({ data: { nama: 'Rombongan 6', hariPiket: 6 } });
  const rom7 = await prisma.rombongan.create({ data: { nama: 'Rombongan 7', hariPiket: 7 } });
  console.log('Created 7 Rombongan groups.');

  // 4. Create Members and assign them to these groups
  const budi = await prisma.anggota.create({
    data: { nama: 'Budi Santoso', noRumah: 'No. 12', noHp: '0812-3456-7890', rombonganId: rom1.id, statusAktif: true },
  });
  const siti = await prisma.anggota.create({
    data: { nama: 'Siti Aminah', noRumah: 'No. 24', noHp: '0813-2345-6789', rombonganId: rom2.id, statusAktif: true },
  });
  const doni = await prisma.anggota.create({
    data: { nama: 'Doni Setiawan', noRumah: 'No. 36', noHp: '0812-8765-4321', rombonganId: rom3.id, statusAktif: true },
  });
  const rini = await prisma.anggota.create({
    data: { nama: 'Rini Wulandari', noRumah: 'No. 48', noHp: '0813-3456-1122', rombonganId: rom4.id, statusAktif: true },
  });
  const agus = await prisma.anggota.create({
    data: { nama: 'Agus Hermawan', noRumah: 'No. 60', noHp: '0812-9988-7766', rombonganId: rom5.id, statusAktif: true },
  });
  const maya = await prisma.anggota.create({
    data: { nama: 'Maya Lestari', noRumah: 'No. 72', noHp: '0813-6677-8899', rombonganId: rom6.id, statusAktif: true },
  });
  const ahmad = await prisma.anggota.create({
    data: { nama: 'Pak Ahmad', noRumah: 'No. 15', noHp: '0812-1122-3344', rombonganId: rom7.id, statusAktif: true },
  });
  
  // Remaining specific members
  const ibusiti = await prisma.anggota.create({
    data: { nama: 'Ibu Siti', noRumah: 'No. 27', noHp: '0813-4433-5566', rombonganId: rom2.id, statusAktif: true },
  });
  const hadi = await prisma.anggota.create({
    data: { nama: 'Pak Hadi', noRumah: 'No. 39', noHp: '0812-7788-9900', rombonganId: rom3.id, statusAktif: true },
  });
  const dewi = await prisma.anggota.create({
    data: { nama: 'Ibu Dewi', noRumah: 'No. 51', noHp: '0813-9900-2211', rombonganId: rom4.id, statusAktif: true },
  });
  const joko = await prisma.anggota.create({
    data: { nama: 'Pak Joko', noRumah: 'No. 63', noHp: '0812-3344-5566', rombonganId: rom1.id, statusAktif: true },
  });
  const lina = await prisma.anggota.create({
    data: { nama: 'Ibu Lina', noRumah: 'No. 75', noHp: '0813-5566-7788', rombonganId: rom2.id, statusAktif: true },
  });
  const andi = await prisma.anggota.create({
    data: { nama: 'Andi', noRumah: 'No. 8', noHp: '0812-3456-7891', rombonganId: rom1.id, statusAktif: true },
  });

  // Assign Leaders (Ketua Rombongan)
  await prisma.rombongan.update({ where: { id: rom1.id }, data: { ketuaId: budi.id } });
  await prisma.rombongan.update({ where: { id: rom2.id }, data: { ketuaId: siti.id } });
  await prisma.rombongan.update({ where: { id: rom3.id }, data: { ketuaId: doni.id } });
  await prisma.rombongan.update({ where: { id: rom4.id }, data: { ketuaId: rini.id } });
  await prisma.rombongan.update({ where: { id: rom5.id }, data: { ketuaId: agus.id } });
  await prisma.rombongan.update({ where: { id: rom6.id }, data: { ketuaId: maya.id } });
  await prisma.rombongan.update({ where: { id: rom7.id }, data: { ketuaId: ahmad.id } });

  // Generate additional active members to match the total members of 72
  // We want to distribute them among Rombongan 1-7
  const romList = [rom1, rom2, rom3, rom4, rom5, rom6, rom7];
  
  // Total members currently: 13 active
  // We need 55 more active members (to reach 68 active members in total)
  for (let i = 1; i <= 55; i++) {
    const assignedRom = romList[(i - 1) % romList.length];
    await prisma.anggota.create({
      data: {
        nama: `Warga Aktif #${i}`,
        noRumah: `No. ${100 + i}`,
        noHp: `0812-9900-00${i}`,
        rombonganId: assignedRom.id,
        statusAktif: true,
      }
    });
  }

  // Generate 4 inactive members
  for (let i = 1; i <= 4; i++) {
    await prisma.anggota.create({
      data: {
        nama: `Mantan Warga #${i}`,
        noRumah: `No. 90${i}`,
        noHp: null,
        rombonganId: null,
        statusAktif: false,
      }
    });
  }

  console.log('Created 72 total members and set leaders for 7 groups.');

  // 5. Create Schedules
  const j14 = await prisma.jadwalPetugas.create({
    data: {
      anggotaId: siti.id,
      tanggal: new Date('2026-07-14T00:00:00Z'),
      keterangan: 'Piket Jimpitan RT',
    },
  });
  const j15 = await prisma.jadwalPetugas.create({
    data: {
      anggotaId: andi.id,
      tanggal: new Date('2026-07-15T00:00:00Z'),
      keterangan: 'Piket Jimpitan RT',
    },
  });
  const j16 = await prisma.jadwalPetugas.create({
    data: {
      anggotaId: budi.id,
      tanggal: new Date('2026-07-16T00:00:00Z'),
      keterangan: 'Piket Jimpitan RT',
    },
  });
  console.log('Created schedules.');

  // 6. Create Jimpitan Harian
  await prisma.jimpitan.create({
    data: {
      tanggal: new Date('2026-07-14T00:00:00Z'),
      jadwalId: j14.id,
      nominal: 90000,
      diisiOleh: 'Admin RT',
      diisiPada: new Date('2026-07-14T17:00:00Z'),
    },
  });
  await prisma.jimpitan.create({
    data: {
      tanggal: new Date('2026-07-15T00:00:00Z'),
      jadwalId: j15.id,
      nominal: 95000,
      diisiOleh: 'Admin RT',
      diisiPada: new Date('2026-07-15T17:00:00Z'),
    },
  });
  console.log('Created daily jimpitan.');

  // 7. Create Finance Transactions (TransaksiKeuangan)
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-14T00:00:00Z'),
      jenis: 'pemasukan',
      sumber: 'jimpitan',
      keterangan: 'Jimpitan - 14 Juli 2026 (Oleh: Siti)',
      nominal: 90000,
    },
  });
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-14T12:00:00Z'),
      jenis: 'pengeluaran',
      sumber: 'manual',
      kategori: 'kebersihan',
      keterangan: 'Kebersihan Lingkungan - Pembelian alat kebersihan',
      nominal: -150000,
    },
  });
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-15T10:00:00Z'),
      jenis: 'pemasukan',
      sumber: 'manual',
      kategori: 'sumbangan',
      keterangan: 'Sumbangan Warga - Pak Ahmad',
      nominal: 200000,
    },
  });
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-15T00:00:00Z'),
      jenis: 'pemasukan',
      sumber: 'jimpitan',
      keterangan: 'Jimpitan - 15 Juli 2026 (Oleh: Andi)',
      nominal: 95000,
    },
  });
  
  // Base balance setups
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-01T00:00:00Z'),
      jenis: 'pemasukan',
      sumber: 'manual',
      keterangan: 'Saldo Kas RT & Jimpitan Sebelumnya (Kumulatif)',
      nominal: 3065000,
    },
  });
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-01T00:00:00Z'),
      jenis: 'pemasukan',
      sumber: 'manual',
      keterangan: 'Saldo Kas Awal Bulan (Bawaan Bulan Lalu)',
      nominal: 6800000,
    },
  });
  await prisma.transaksiKeuangan.create({
    data: {
      tanggal: new Date('2026-07-01T00:00:00Z'),
      jenis: 'pengeluaran',
      sumber: 'manual',
      keterangan: 'Honor Keamanan & Listrik Pos Ronda',
      nominal: -1650000,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
