import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CMS_AUTH_COOKIE_NAME, verifyCmsSessionToken } from '@/lib/cms-auth';
import { getCmsData, saveCmsData, resetCmsData } from '@/lib/cms-db';
import { LandingPageData } from '@/lib/landing-defaults';

// Helper verifikasi sesi CMS mandiri
async function getAuthorizedCmsUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyCmsSessionToken(token);
}

// GET: Ambil konten landing page (Publik, 100% terisolasi dari DB RT)
export async function GET() {
  try {
    const data = await getCmsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get landing CMS data:', error);
    return NextResponse.json({ error: 'Gagal memuat konten CMS' }, { status: 500 });
  }
}

// PUT: Perbarui konten CMS (Khusus Super Admin CMS yang terautentikasi)
export async function PUT(request: Request) {
  try {
    const cmsUser = await getAuthorizedCmsUser();
    if (!cmsUser) {
      return NextResponse.json(
        { error: 'Akses ditolak: Sesi CMS tidak valid atau telah berakhir. Silakan login kembali di /admin/login.' },
        { status: 401 }
      );
    }

    const payload: Partial<LandingPageData> = await request.json();
    const result = await saveCmsData(payload, cmsUser.nama || cmsUser.username || 'Platform Super Admin');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Gagal menyimpan perubahan CMS' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Konten landing page berhasil diperbarui', 
      data: result.data 
    });
  } catch (error: any) {
    console.error('Failed to update landing CMS data:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menyimpan perubahan CMS' }, { status: 500 });
  }
}

// POST: Reset konten CMS (Khusus Super Admin CMS yang terautentikasi)
export async function POST(request: Request) {
  try {
    const cmsUser = await getAuthorizedCmsUser();
    if (!cmsUser) {
      return NextResponse.json(
        { error: 'Akses ditolak: Sesi CMS tidak valid. Silakan login di /admin/login.' },
        { status: 401 }
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
