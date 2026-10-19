import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext();
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await db.notifikasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    // Tenant isolation check: cannot touch other communities' notifications
    if (existing.komunitasId && tenant?.komunitasId && existing.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const updatedNotif = await db.notifikasi.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotif);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext();
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await db.notifikasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 });
    }

    // Tenant isolation check: cannot delete other communities' notifications
    if (existing.komunitasId && tenant?.komunitasId && existing.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await db.notifikasi.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
