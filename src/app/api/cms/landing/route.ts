import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth';
import { getCmsData, saveCmsData, resetCmsData } from '@/lib/cms-db';
import { LandingPageData } from '@/lib/landing-defaults';

// GET landing page content (Terisolasi dari database operasional RT)
export async function GET() {
  try {
    const data = await getCmsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get landing CMS data:', error);
    return NextResponse.json({ error: 'Gagal memuat konten CMS' }, { status: 500 });
  }
}

// PUT: Perbarui konten CMS (Khusus Super Admin)
export async function PUT(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant || tenant.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin yang berhak mengubah konten landing page' },
        { status: 403 }
      );
    }

    const payload: Partial<LandingPageData> = await request.json();
    const result = await saveCmsData(payload, tenant.nama || tenant.email || 'Super Admin');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Gagal menyimpan perubahan CMS' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Konten landing page berhasil diperbarui', data: result.data });
  } catch (error: any) {
    console.error('Failed to update landing CMS data:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menyimpan perubahan CMS' }, { status: 500 });
  }
}

// POST: Reset konten CMS (Khusus Super Admin)
export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant || tenant.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin yang berhak melakukan tindakan ini' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.action === 'reset') {
      const defaultData = await resetCmsData();
      return NextResponse.json({
        success: true,
        message: 'Konten berhasil di-reset ke nilai default mockup',
        data: defaultData,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to reset landing CMS:', error);
    return NextResponse.json({ error: 'Gagal mereset konten CMS' }, { status: 500 });
  }
}
