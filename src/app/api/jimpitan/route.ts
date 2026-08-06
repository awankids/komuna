import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { tanggal, nominal, jadwalId, diisiOleh } = await request.json();
    
    if (!tanggal || nominal === undefined || nominal < 0) {
      return NextResponse.json({ error: 'Tanggal dan nominal valid wajib diisi' }, { status: 400 });
    }
    
    const dateVal = new Date(tanggal);
    const startOfDay = new Date(Date.UTC(
      dateVal.getUTCFullYear(), dateVal.getUTCMonth(), dateVal.getUTCDate(), 0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      dateVal.getUTCFullYear(), dateVal.getUTCMonth(), dateVal.getUTCDate(), 23, 59, 59, 999
    ));
    
    // 1. Check if schedule exists for this date if not provided
    let finalJadwalId = jadwalId;
    if (!finalJadwalId) {
      const sched = await db.jadwalPetugas.findFirst({
        where: {
          tanggal: {
            gte: startOfDay,
            lte: endOfDay,
          }
        }
      });
      if (sched) {
        finalJadwalId = sched.id;
      }
    }

    // Get schedule & member details to populate transaction description if needed
    let petugasName = 'Warga';
    if (finalJadwalId) {
      const schedDetails = await db.jadwalPetugas.findUnique({
        where: { id: finalJadwalId },
        include: {
          anggota: {
            include: {
              rombongan: {
                include: {
                  ketua: true
                }
              }
            }
          }
        },
      });
      if (schedDetails && schedDetails.anggota?.rombongan) {
        const r = schedDetails.anggota.rombongan;
        const romName = r.nama.split(' - ')[0] || r.nama;
        const ketuaName = r.ketua ? r.ketua.nama : '-';
        petugasName = `${romName} (Ketua: ${ketuaName})`;
      } else if (schedDetails && schedDetails.anggota) {
        petugasName = schedDetails.anggota.nama;
      }
    } else {
      // Fallback based on day of week
      const day = dateVal.getUTCDay();
      const hariPiket = day === 0 ? 7 : day;
      const rombonganInfo: { [key: number]: { nama: string; ketua: string } } = {
        1: { nama: 'Rombongan 1', ketua: 'Bp Suratijo' },
        2: { nama: 'Rombongan 2', ketua: 'Bp Daliman (Thole)' },
        3: { nama: 'Rombongan 3', ketua: 'Bp Salim Khudhori' },
        4: { nama: 'Rombongan 4', ketua: 'Bp Ngatijan' },
        5: { nama: 'Rombongan 5', ketua: 'Bp Maryanto' },
        6: { nama: 'Rombongan 6', ketua: 'Bp Aris Putranto' },
        7: { nama: 'Rombongan 7', ketua: 'Bp Maryadi' },
      };
      const fallback = rombonganInfo[hariPiket];
      if (fallback) {
        petugasName = `${fallback.nama} (Ketua: ${fallback.ketua})`;
      }
    }
    
    // 2. Check if Jimpitan already recorded for this day to track difference
    const existingJimpitan = await db.jimpitan.findFirst({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });
    
    const oldNominal = existingJimpitan ? existingJimpitan.nominal : 0;
    let resultJimpitan;
    
    if (existingJimpitan) {
      // Update existing jimpitan
      resultJimpitan = await db.jimpitan.update({
        where: { id: existingJimpitan.id },
        data: {
          nominal,
          jadwalId: finalJadwalId || null,
          diisiOleh: diisiOleh || 'Admin RT',
          diisiPada: new Date(),
        }
      });
    } else {
      // Create new jimpitan
      resultJimpitan = await db.jimpitan.create({
        data: {
          tanggal: startOfDay,
          jadwalId: finalJadwalId || null,
          nominal,
          diisiOleh: diisiOleh || 'Admin RT',
        }
      });
    }

    // 3. Late entry check: has this month already been sent to Kas RT?
    const monthNum = startOfDay.getUTCMonth(); // 0-indexed
    const yearNum = startOfDay.getUTCFullYear();
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));

    const monthlyKasSent = await db.transaksiKeuangan.findFirst({
      where: {
        sumber: 'jimpitan',
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    if (monthlyKasSent) {
      const diff = nominal - oldNominal;
      if (diff !== 0) {
        // 1. Check if a specific transaction for this exact date already exists
        const existingTxForDay = await db.transaksiKeuangan.findFirst({
          where: {
            sumber: 'jimpitan',
            tanggal: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (existingTxForDay) {
          const newNominalTx = existingTxForDay.nominal + diff;
          if (newNominalTx <= 0) {
            await db.transaksiKeuangan.delete({
              where: { id: existingTxForDay.id }
            });
          } else {
            await db.transaksiKeuangan.update({
              where: { id: existingTxForDay.id },
              data: {
                nominal: newNominalTx,
                jenis: 'pemasukan'
              }
            });
          }
        } else {
          // 2. If no specific daily transaction, update the monthly bulk transaction if available
          const bulkTx = await db.transaksiKeuangan.findFirst({
            where: {
              sumber: 'jimpitan',
              tanggal: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          });

          if (bulkTx) {
            const updatedNominal = Math.max(0, bulkTx.nominal + diff);
            await db.transaksiKeuangan.update({
              where: { id: bulkTx.id },
              data: {
                nominal: updatedNominal
              }
            });
          } else if (diff > 0) {
            const formattedJimpitanDate = `${startOfDay.getUTCDate()} ${startOfDay.toLocaleString('id-ID', { month: 'long', timeZone: 'UTC' })} ${startOfDay.getUTCFullYear()}`;
            await db.transaksiKeuangan.create({
              data: {
                tanggal: startOfDay,
                jenis: 'pemasukan',
                sumber: 'jimpitan',
                kategori: 'Jimpitan',
                keterangan: `Jimpitan Susulan (${formattedJimpitanDate}) - Petugas: ${petugasName}`,
                nominal: diff
              }
            });
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, jimpitan: resultJimpitan });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mencatat jimpitan harian' }, { status: 500 });
  }
}

// GET dashboard state aggregation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const todayDate = new Date();
    const defaultMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
    const defaultYear = String(todayDate.getFullYear());

    const month = searchParams.get('month') || defaultMonth;
    const year = searchParams.get('year') || defaultYear;
    
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10) - 1;

    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));
    
    // Get all transactions to date to calculate overall Saldo Kas and Saldo Awal correctly
    const allTx = await db.transaksiKeuangan.findMany({
      orderBy: { tanggal: 'asc' }
    });

    let currentBalance = 0;
    const computedTx = allTx.map(t => {
      if (t.jenis === 'pemasukan') {
        currentBalance += t.nominal;
      } else {
        currentBalance -= t.nominal;
      }
      return {
        ...t,
        saldo: currentBalance
      };
    });

    const saldoKas = currentBalance; // current overall balance

    // Calculate Saldo Awal for the selected month
    const txBeforeMonth = computedTx.filter(t => new Date(t.tanggal) < startOfMonth);
    const saldoAwal = txBeforeMonth.length > 0 ? txBeforeMonth[txBeforeMonth.length - 1].saldo : 0;

    // Filter transactions for this month
    const monthlyTx = computedTx.filter(t => {
      const d = new Date(t.tanggal);
      return d >= startOfMonth && d <= endOfMonth;
    });

    let finalSaldoAwal = saldoAwal;
    const saldoAwalTx = monthlyTx.find(t => t.kategori === 'Saldo Awal');
    if (saldoAwalTx) {
      finalSaldoAwal = saldoAwalTx.nominal;
    }

    const totalPemasukan = monthlyTx
      .filter(t => t.jenis === 'pemasukan' && t.kategori !== 'Saldo Awal')
      .reduce((sum, t) => sum + t.nominal, 0);
      
    const totalPengeluaran = monthlyTx
      .filter(t => t.jenis === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);
      
    // Get monthly jimpitan
    const monthlyJimpitan = await db.jimpitan.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      }
    });
    
    const totalJimpitan = monthlyJimpitan.reduce((sum, j) => sum + j.nominal, 0);
    
    // Get recent 4 transactions
    const recentTx = await db.transaksiKeuangan.findMany({
      orderBy: { tanggal: 'desc' },
      take: 4,
    });
    
    // Get today's schedule
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
    
    const todaySchedule = await db.jadwalPetugas.findFirst({
      where: {
        tanggal: {
          gte: startOfToday,
          lte: endOfToday,
        }
      },
      include: {
        anggota: true
      }
    });
    
    // Get today's jimpitan value
    const todayJimpitan = await db.jimpitan.findFirst({
      where: {
        tanggal: {
          gte: startOfToday,
          lte: endOfToday,
        }
      }
    });

    // Get yesterday's schedule & jimpitan
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0));
    const endOfYesterday = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999));

    const yesterdaySchedule = await db.jadwalPetugas.findFirst({
      where: {
        tanggal: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        }
      },
      include: {
        anggota: true
      }
    });

    const yesterdayJimpitan = await db.jimpitan.findFirst({
      where: {
        tanggal: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        }
      }
    });
    
    return NextResponse.json({
      saldoKas,
      saldoAwal: finalSaldoAwal,
      totalJimpitan,
      totalPemasukan,
      totalPengeluaran,
      recentTx,
      todaySchedule,
      todayJimpitan: todayJimpitan ? todayJimpitan.nominal : null,
      yesterdaySchedule,
      yesterdayJimpitan: yesterdayJimpitan ? yesterdayJimpitan.nominal : null,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil data ringkasan' }, { status: 500 });
  }
}
