import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error('WEBHOOK_SECRET is missing');
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    const signature = req.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'No signature found' }, { status: 401 });
    }

    const rawBody = await req.text();
    
    // Verifikasi Signature HMAC SHA-256 dari GitHub
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    // Menghindari Timing Attacks
    const sigBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);
    if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = req.headers.get('x-github-event');
    
    // Kita hanya peduli pada event 'push'
    if (event !== 'push') {
       return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    
    // Hanya proses commit yang masuk ke branch utama (main atau master)
    const branch = payload.ref?.replace('refs/heads/', '');
    if (branch !== 'main' && branch !== 'master') {
       return NextResponse.json({ message: 'Not main branch, ignoring' }, { status: 200 });
    }

    const commits = payload.commits || [];
    let notifikasiCount = 0;

    for (const commit of commits) {
       // Ambil hanya baris pertama dari pesan commit
       const messageLines = commit.message.split('\n');
       const firstLine = messageLines[0].trim();
       
       const lowerMsg = firstLine.toLowerCase();
       
       // Saring commit: hanya proses jika mengandung feat, fix, atau update
       if (lowerMsg.startsWith('feat') || lowerMsg.startsWith('fix') || lowerMsg.startsWith('update')) {
          
          let title = 'Pembaruan Sistem';
          let type = 'info';

          if (lowerMsg.startsWith('feat')) {
             title = '🚀 Fitur Baru';
             type = 'success';
          } else if (lowerMsg.startsWith('fix')) {
             title = '🔧 Perbaikan Bug';
             type = 'success';
          } else if (lowerMsg.startsWith('update')) {
             title = '🔄 Pembaruan Sistem';
             type = 'info';
          }

          // Format pesan agar lebih bersih dari "feat(notifikasi):" -> "Add dedicated notifications page..."
          let cleanMessage = firstLine;
          if (cleanMessage.includes(':')) {
             cleanMessage = cleanMessage.split(':').slice(1).join(':').trim();
             // Huruf pertama kapital
             if (cleanMessage.length > 0) {
                 cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
             }
          }

          // Hindari pesan kosong
          if (!cleanMessage) cleanMessage = 'Pembaruan tanpa keterangan.';

          // Simpan ke database
          await db.notifikasi.create({
             data: {
                title,
                message: cleanMessage,
                type,
             }
          });
          notifikasiCount++;
       }
    }

    return NextResponse.json({ success: true, processed: notifikasiCount }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
