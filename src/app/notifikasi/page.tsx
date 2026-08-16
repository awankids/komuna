import React from 'react';
import { db } from '@/lib/db';
import NotifikasiClient from './NotifikasiClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotifikasiPage() {
  const notifikasi = await db.notifikasi.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <NotifikasiClient initialData={notifikasi} />;
}
