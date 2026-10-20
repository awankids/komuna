import { NextResponse } from 'next/server';
import { 
  verifyCmsCredentials, 
  signCmsSessionToken, 
  CMS_AUTH_COOKIE_NAME 
} from '@/lib/cms-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password CMS wajib diisi' },
        { status: 400 }
      );
    }

    const isValid = verifyCmsCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Kredensial CMS tidak valid. Periksa username dan password Anda.' },
        { status: 401 }
      );
    }

    // Generate CMS Session Token
    const cmsUser = {
      id: 'cms-superadmin',
      username: username.trim(),
      nama: 'Platform Super Admin',
      role: 'CMS_SUPER_ADMIN' as const,
    };

    const token = await signCmsSessionToken(cmsUser);

    const response = NextResponse.json({
      success: true,
      message: 'Login CMS berhasil',
      user: {
        username: cmsUser.username,
        nama: cmsUser.nama,
        role: cmsUser.role,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';

    // Set cookie terisolasi khusus CMS
    response.cookies.set({
      name: CMS_AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error: any) {
    console.error('CMS Login Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login CMS' },
      { status: 500 }
    );
  }
}
