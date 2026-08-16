import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Endpoint diagnostik - hanya bisa diakses sekali untuk seed notifikasi historis
// DELETE this file after use in production
export async function POST() {
  try {
    const historicalNotifs = [
      {
        title: '🔧 Perbaikan Bug',
        message: 'Convert all text inputs to uncontrolled refs across all pages to fix Android Gboard IME bug',
        type: 'success',
      },
      {
        title: '🔧 Perbaikan Bug',
        message: 'Remove user-scalable=no to restore Android IME text input on all pages',
        type: 'success',
      },
      {
        title: '🔧 Perbaikan Bug',
        message: 'Isolate TransactionForm to separate component to prevent Android Gboard re-render bug',
        type: 'success',
      },
      {
        title: '🚀 Fitur Baru',
        message: 'Add GitHub push webhook endpoint for automated system notifications',
        type: 'success',
      },
      {
        title: '🔧 Perbaikan Bug',
        message: 'Remove transform animations from all modals to prevent Android Gboard composition bug',
        type: 'success',
      },
      {
        title: '🚀 Fitur Baru',
        message: 'Add dedicated notifications page and route header link',
        type: 'success',
      },
    ];

    const created = await db.notifikasi.createMany({
      data: historicalNotifs,
      skipDuplicates: false,
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const dbUrl = process.env.DATABASE_URL;

  return NextResponse.json({
    webhookSecretConfigured: !!secret,
    webhookSecretLength: secret?.length ?? 0,
    databaseConfigured: !!dbUrl,
    timestamp: new Date().toISOString(),
  });
}
