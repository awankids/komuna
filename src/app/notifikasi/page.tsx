import React from 'react';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';
import NotifikasiClient from './NotifikasiClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotifikasiPage() {
  const tenant = await getTenantContext();

  const whereClause = tenant?.komunitasId
    ? {
        OR: [
          { komunitasId: tenant.komunitasId }, // Notifikasi RT terdaftar
          { komunitasId: null },               // Pembaruan sistem & changelog global
        ],
      }
    : {
        komunitasId: null,
      };

  const notifikasi = await db.notifikasi.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return <NotifikasiClient initialData={notifikasi} />;
}
