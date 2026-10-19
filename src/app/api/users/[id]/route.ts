import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, hashPassword, requireTenantContext } from '@/lib/auth';

const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS', 'PETUGAS', 'WARGA'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat mengubah data pengguna' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { nama, email, noHp, role, passwordBaru, statusAktif } = body;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && existingUser.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Akses ditolak: Pengguna bukan bagian dari komunitas Anda' }, { status: 403 });
    }

    const updateData: any = {};

    if (nama && nama.trim()) {
      updateData.nama = nama.trim();
    }

    if (noHp !== undefined) {
      updateData.noHp = noHp ? noHp.trim() : null;
    }

    if (statusAktif !== undefined) {
      // Prevent deactivating own account
      if (session.id === id && statusAktif === false) {
        return NextResponse.json({ error: 'Anda tidak dapat menonaktifkan akun Anda sendiri' }, { status: 400 });
      }
      updateData.statusAktif = Boolean(statusAktif);
    }

    if (role && VALID_ROLES.includes(role)) {
      // Prevent demoting own role if currently logged in
      if (session.id === id && role !== session.role && session.role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Anda tidak dapat menurunkan role akun Anda sendiri' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailTaken = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (emailTaken) {
          return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain' }, { status: 400 });
        }
        updateData.email = normalizedEmail;
      }
    }

    // Reset password if provided by admin
    if (passwordBaru && passwordBaru.trim()) {
      if (passwordBaru.length < 6) {
        return NextResponse.json({ error: 'Kata sandi baru minimal 6 karakter' }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(passwordBaru.trim());
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        statusAktif: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenantContext();
    const session = await getServerSession();
    if (!session || !ALLOWED_ADMIN_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat menghapus akun' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna tidak valid' }, { status: 400 });
    }

    // Prevent deleting self
    if (session.id === id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && targetUser.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Akses ditolak: Pengguna bukan bagian dari komunitas Anda' }, { status: 403 });
    }

    // Check count of admins to avoid deleting the last admin within the community
    const adminCount = await db.user.count({
      where: {
        komunitasId: tenant.komunitasId,
        role: { in: ALLOWED_ADMIN_ROLES },
      },
    });

    if (ALLOWED_ADMIN_ROLES.includes(targetUser.role) && adminCount <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menghapus admin terakhir pada sistem komunitas Anda' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Akun pengguna berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna: ' + error.message }, { status: 500 });
  }
}
