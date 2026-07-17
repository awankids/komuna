import { PrismaClient } from '../src/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Sebelum Cleanup ===');
  const before = await db.jimpitan.findMany({ orderBy: { tanggal: 'asc' } });
  before.forEach(j => {
    console.log(`id: ${j.id} | tanggal: ${j.tanggal.toISOString()} | nominal: ${j.nominal}`);
  });

  // Delete ALL existing jimpitan records (bad timezone data) so users can start fresh
  const del = await db.jimpitan.deleteMany({});
  console.log(`\nDihapus ${del.count} record jimpitan lama (salah timezone)`);

  // Also clean up matching TransaksiKeuangan jimpitan entries
  const delTx = await db.transaksiKeuangan.deleteMany({ where: { sumber: 'jimpitan' } });
  console.log(`Dihapus ${delTx.count} transaksi keuangan jimpitan terkait`);

  console.log('\n=== Setelah Cleanup ===');
  const after = await db.jimpitan.findMany({});
  console.log(`Total records tersisa: ${after.length}`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
