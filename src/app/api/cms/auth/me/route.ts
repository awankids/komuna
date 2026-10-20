import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CMS_AUTH_COOKIE_NAME, verifyCmsSessionToken } from '@/lib/cms-auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cmsCookie = cookieStore.get(CMS_AUTH_COOKIE_NAME);

    if (!cmsCookie || !cmsCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await verifyCmsSessionToken(cmsCookie.value);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: user.username,
        nama: user.nama,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
