import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, hashPassword, requireTenantContext } from '@/lib/auth';

const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS', 'WARGA'];

export async function GET() {
  try {
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat melihat daftar pengguna' }, { status: 403 });
    }

    const where: any = {};
    if (session.role !== 'SUPER_ADMIN') {
      where.komunitasId = tenant.komunitasId;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        statusAktif: true,
        komunitasId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengguna: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat menambahkan pengguna baru' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, email, noHp, password, role } = body;

    if (!nama || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan kata sandi wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter' }, { status: 400 });
    }

    const assignedRole = role && VALID_ROLES.includes(role) ? role : 'WARGA';
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    const newUser = await db.user.create({
      data: {
        komunitasId: tenant.komunitasId,
        nama: nama.trim(),
        email: normalizedEmail,
        noHp: noHp ? noHp.trim() : null,
        passwordHash,
        role: assignedRole,
        statusAktif: true,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        statusAktif: true,
        komunitasId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Gagal membuat pengguna: ' + error.message }, { status: 500 });
  }
}
