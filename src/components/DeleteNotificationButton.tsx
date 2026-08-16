'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteNotificationButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notifikasi/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        router.refresh(); // Refresh Server Component
      } else {
        alert('Gagal menghapus notifikasi');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Hapus notifikasi"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
