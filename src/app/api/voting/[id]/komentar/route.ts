import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface KomentarRequestBody {
  pesan: string;
}

// POST /api/voting/[id]/komentar - Kirim aspirasi atau komentar warga
export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi' }, { status: 401 });
    }

    const { id: votingId } = await context.params;
    const body: KomentarRequestBody = await request.json();
    const { pesan } = body;

    if (!pesan || !pesan.trim()) {
      return NextResponse.json({ error: 'Pesan komentar tidak boleh kosong' }, { status: 400 });
    }

    // Keamanan: Batasi panjang pesan untuk melindungi database
    const sanitizedPesan = pesan.trim().slice(0, 1000);

    const voting = await db.voting.findFirst({
      where: { id: votingId, komunitasId: tenant.komunitasId },
    });

    if (!voting) {
      return NextResponse.json({ error: 'Voting tidak ditemukan' }, { status: 404 });
    }

    // Keamanan: Cegah peniruan identitas (identity spoofing) dengan selalu mengambil nama dari sesi terverifikasi server
    const verifiedNama = (tenant.nama || 'Warga').trim();
    const verifiedRole = ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS'].includes(tenant.role) ? 'Pengurus' : 'Warga';

    const newKomentar = await db.votingKomentar.create({
      data: {
        votingId,
        namaPengirim: verifiedNama,
        rolePengirim: verifiedRole,
        pesan: sanitizedPesan,
      },
    });

    return NextResponse.json(newKomentar, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Gagal mengirim komentar';
    console.error('Error posting comment:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
