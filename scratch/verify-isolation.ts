import 'dotenv/config';
import { db } from '../src/lib/db';

async function main() {
  console.log('--- VERIFYING TENANT ISOLATION ---');

  const communities = await db.komunitas.findMany({
    include: {
      _count: {
        select: {
          anggota: true,
          transaksi: true,
          jimpitan: true,
          rombongan: true,
          users: true,
          arisan: true,
          hutangPiutang: true,
          inventaris: true,
          pengurus: true,
        }
      }
    }
  });

  console.log(`Found ${communities.length} communities:`);
  for (const c of communities) {
    console.log(`\n[Komunitas: ${c.nama} (slug: ${c.slug}, id: ${c.id})]`);
    console.log(`  - Anggota        : ${c._count.anggota}`);
    console.log(`  - Transaksi      : ${c._count.transaksi}`);
    console.log(`  - Jimpitan       : ${c._count.jimpitan}`);
    console.log(`  - Rombongan      : ${c._count.rombongan}`);
    console.log(`  - Pengurus       : ${c._count.pengurus}`);
    console.log(`  - Users          : ${c._count.users}`);
    console.log(`  - Arisan         : ${c._count.arisan}`);
    console.log(`  - Hutang/Piutang : ${c._count.hutangPiutang}`);
    console.log(`  - Inventaris     : ${c._count.inventaris}`);
  }

  // Check if any row has null komunitasId
  const nullAnggota = await db.anggota.count({ where: { komunitasId: null } });
  const nullTx = await db.transaksiKeuangan.count({ where: { komunitasId: null } });
  const nullJimpitan = await db.jimpitan.count({ where: { komunitasId: null } });

  console.log('\n--- NULL CHECK (Unassigned Rows) ---');
  console.log(`  - Unassigned Anggota  : ${nullAnggota}`);
  console.log(`  - Unassigned Transaksi: ${nullTx}`);
  console.log(`  - Unassigned Jimpitan : ${nullJimpitan}`);

  if (nullAnggota === 0 && nullTx === 0 && nullJimpitan === 0) {
    console.log('\n>>> SUCCESS: All core records are strictly assigned to specific communities! <<<');
  } else {
    console.log('\n>>> WARNING: Found unassigned records! <<<');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
