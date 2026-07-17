import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all transactions and calculate running balance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "01" - "12"
    const year = searchParams.get('year'); // "2026"

    if (!month || !year) {
      return NextResponse.json({ error: 'Bulan dan Tahun wajib diisi' }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10) - 1;

    // 1. Fetch all transactions from database
    const transactions = await db.transaksiKeuangan.findMany({
      orderBy: { tanggal: 'asc' }
    });

    // 2. Calculate running balance (saldo)
    let currentBalance = 0;
    const computedTx = transactions.map(t => {
      if (t.jenis === 'pemasukan') {
        currentBalance += t.nominal;
      } else {
        currentBalance -= t.nominal;
      }
      return {
        ...t,
        isVirtual: false,
        detailKeterangan: t.sumber === 'manual' ? t.keterangan.split(' / ')[1] || '' : '',
        keteranganText: t.sumber === 'manual' ? t.keterangan.split(' / ')[0] || t.keterangan : t.keterangan,
        saldo: currentBalance
      };
    });

    // 3. Filter for selected month
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));

    // Saldo Awal is the balance just before this month starts
    const txBeforeMonth = computedTx.filter(t => new Date(t.tanggal) < startOfMonth);
    const saldoAwal = txBeforeMonth.length > 0 ? txBeforeMonth[txBeforeMonth.length - 1].saldo : 0;

    // Filter transactions for this month
    const monthTx = computedTx.filter(t => {
      const d = new Date(t.tanggal);
      return d >= startOfMonth && d <= endOfMonth;
    });

    // Adjust Saldo Awal if there is a manual Saldo Awal transaction
    let finalSaldoAwal = saldoAwal;
    const saldoAwalTx = monthTx.find(t => t.kategori === 'Saldo Awal');
    if (saldoAwalTx) {
      finalSaldoAwal = saldoAwalTx.nominal;
    }

    const totalPemasukan = monthTx
      .filter(t => t.jenis === 'pemasukan' && t.kategori !== 'Saldo Awal')
      .reduce((sum, t) => sum + t.nominal, 0);

    const totalPengeluaran = monthTx
      .filter(t => t.jenis === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);

    const saldoAkhir = finalSaldoAwal + totalPemasukan - totalPengeluaran;

    // Sort month transactions in descending order (latest first)
    monthTx.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    // 4. Fetch the real jimpitan sum for this month
    const jimpitanRecords = await db.jimpitan.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const jimpitanTotal = jimpitanRecords.reduce((sum, j) => sum + j.nominal, 0);
    
    // Count filled days with nominal > 0
    const filledDaysSet = new Set<string>();
    jimpitanRecords.forEach(j => {
      if (j.nominal > 0) {
        filledDaysSet.add(new Date(j.tanggal).toISOString().split('T')[0]);
      }
    });

    // Check if jimpitan of this month has already been sent
    const isJimpitanSent = monthTx.some(t => t.sumber === 'jimpitan');

    return NextResponse.json({
      transactions: monthTx,
      summary: {
        saldoAwal: finalSaldoAwal,
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir
      },
      jimpitan: {
        total: jimpitanTotal,
        filledDays: filledDaysSet.size,
        isSent: isJimpitanSent
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data transaksi kas' }, { status: 500 });
  }
}

// POST new transaction
export async function POST(request: Request) {
  try {
    const { tanggal, jenis, kategori, keterangan, nominal, sumber } = await request.json();

    if (!tanggal || !jenis || !keterangan || nominal === undefined || nominal <= 0) {
      return NextResponse.json({ error: 'Data transaksi tidak lengkap atau tidak valid' }, { status: 400 });
    }

    const newTx = await db.transaksiKeuangan.create({
      data: {
        tanggal: new Date(tanggal),
        jenis,
        sumber: sumber || 'manual',
        kategori,
        keterangan,
        nominal: parseInt(nominal, 10),
      }
    });

    return NextResponse.json(newTx, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Gagal menambahkan transaksi baru' }, { status: 500 });
  }
}

// PUT update transaction
export async function PUT(request: Request) {
  try {
    const { id, tanggal, jenis, kategori, keterangan, nominal } = await request.json();

    if (!id || !tanggal || !jenis || !keterangan || nominal === undefined || nominal <= 0) {
      return NextResponse.json({ error: 'Data update transaksi tidak lengkap' }, { status: 400 });
    }

    const tx = await db.transaksiKeuangan.findUnique({ where: { id } });
    if (tx && tx.sumber === 'jimpitan') {
      const startOfDay = new Date(Date.UTC(tx.tanggal.getUTCFullYear(), tx.tanggal.getUTCMonth(), tx.tanggal.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(tx.tanggal.getUTCFullYear(), tx.tanggal.getUTCMonth(), tx.tanggal.getUTCDate(), 23, 59, 59, 999));
      
      const relatedJimpitan = await db.jimpitan.findFirst({
        where: {
          tanggal: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      if (relatedJimpitan) {
        await db.jimpitan.update({
          where: { id: relatedJimpitan.id },
          data: { nominal: parseInt(nominal, 10) }
        });
      }
    }

    const updatedTx = await db.transaksiKeuangan.update({
      where: { id },
      data: {
        tanggal: new Date(tanggal),
        jenis,
        kategori,
        keterangan,
        nominal: parseInt(nominal, 10),
      }
    });

    return NextResponse.json(updatedTx);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data transaksi' }, { status: 500 });
  }
}

// DELETE transaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    const tx = await db.transaksiKeuangan.findUnique({ where: { id } });
    if (tx && tx.sumber === 'jimpitan') {
      const startOfDay = new Date(Date.UTC(tx.tanggal.getUTCFullYear(), tx.tanggal.getUTCMonth(), tx.tanggal.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(tx.tanggal.getUTCFullYear(), tx.tanggal.getUTCMonth(), tx.tanggal.getUTCDate(), 23, 59, 59, 999));
      
      const relatedJimpitan = await db.jimpitan.findFirst({
        where: {
          tanggal: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      if (relatedJimpitan) {
        await db.jimpitan.update({
          where: { id: relatedJimpitan.id },
          data: { nominal: 0 }
        });
      }
    }

    await db.transaksiKeuangan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
