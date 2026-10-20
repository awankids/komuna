import { db } from './db';

export interface StreakCheckResult {
  hasStreakAlert: boolean;
  emptyDates: string[];
  notificationCreated?: boolean;
}

/**
 * Checks if the last 3 days before today have missing/zero jimpitan records.
 * If 3 consecutive days are empty, an in-app warning notification is automatically created (max once per 24 hours).
 */
export async function checkAndTriggerJimpitanStreakAlert(komunitasId: string): Promise<StreakCheckResult> {
  try {
    // Current date in Asia/Jakarta (WIB)
    const nowWibStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const [todayY, todayM, todayD] = nowWibStr.split('-').map(Number);
    const todayDateUtc = new Date(Date.UTC(todayY, todayM - 1, todayD));

    // Get the 3 previous days (H-1, H-2, H-3)
    const pastDays: { dateKey: string; start: Date; end: Date; formattedStr: string }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(todayDateUtc);
      d.setUTCDate(todayDateUtc.getUTCDate() - i);
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      const formattedStr = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC'
      });
      const dateKey = d.toISOString().split('T')[0];
      pastDays.push({ dateKey, start, end, formattedStr });
    }

    // Check jimpitan records for each of the 3 days
    const emptyDates: string[] = [];
    for (const day of pastDays) {
      const record = await db.jimpitan.findFirst({
        where: {
          komunitasId,
          tanggal: {
            gte: day.start,
            lte: day.end
          }
        }
      });
      if (!record || record.nominal <= 0) {
        emptyDates.push(day.formattedStr);
      }
    }

    // If not all 3 days are empty, there's no 3-day bolong streak
    if (emptyDates.length < 3) {
      return { hasStreakAlert: false, emptyDates };
    }

    // Deduplication check: Has a streak alert been created in the last 24 hours for this tenant?
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentAlert = await db.notifikasi.findFirst({
      where: {
        komunitasId,
        type: 'warning',
        title: { contains: 'Jimpitan Bolong' },
        createdAt: { gte: oneDayAgo }
      }
    });

    if (existingRecentAlert) {
      return { hasStreakAlert: true, emptyDates, notificationCreated: false };
    }

    // Create the alert notification
    const formattedDatesList = [...emptyDates].reverse().join(', ');
    const title = '⚠️ Perhatian: Jimpitan Bolong 3 Hari';
    const message = `Pencatatan jimpitan belum terisi selama 3 hari berturut-turut (${formattedDatesList}). Mohon segera berkoordinasi dengan petugas atau rombongan piket terkait.`;

    await db.notifikasi.create({
      data: {
        title,
        message,
        type: 'warning',
        isRead: false,
        komunitasId
      }
    });

    return { hasStreakAlert: true, emptyDates, notificationCreated: true };
  } catch (error) {
    console.error('Failed to check jimpitan streak:', error);
    return { hasStreakAlert: false, emptyDates: [] };
  }
}
