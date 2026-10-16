'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CurrentUser {
  id?: string;
  nama: string;
  email?: string;
  role: string;
  noHp?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(c => c.trim().startsWith('komuna_user='));
      if (userCookie) {
        const rawValue = userCookie.split('=').slice(1).join('=');
        return JSON.parse(decodeURIComponent(rawValue));
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        if (data && data.nama) {
          const loadedUser: CurrentUser = {
            id: data.id,
            nama: data.nama,
            email: data.email,
            role: (data.role || 'WARGA').toUpperCase(),
            noHp: data.noHp,
          };
          setUser(loadedUser);
          return loadedUser;
        }
      }
    } catch (e) {
      console.error('Failed to sync current user', e);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchUser();

    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener('komuna_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('komuna_profile_updated', handleProfileUpdate);
  }, [fetchUser]);

  const hasRole = useCallback((...allowedRoles: string[]) => {
    if (!user) return false;
    const currentRole = (user.role || '').toUpperCase();
    // SUPER_ADMIN has access to everything
    if (currentRole === 'SUPER_ADMIN') return true;
    return allowedRoles.map(r => r.toUpperCase()).includes(currentRole);
  }, [user]);

  const canAccess = useCallback((route: string) => {
    if (!user) return false;
    const currentRole = (user.role || '').toUpperCase();
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') return true;

    if (route.startsWith('/pengaturan')) {
      return false;
    }
    if (route.startsWith('/kas') || route.startsWith('/hutang-piutang')) {
      return currentRole === 'BENDAHARA';
    }
    if (route.startsWith('/anggota')) {
      return currentRole === 'SEKRETARIS';
    }
    if (route.startsWith('/laporan')) {
      return currentRole === 'BENDAHARA' || currentRole === 'SEKRETARIS';
    }

    return true;
  }, [user]);

  return {
    user,
    role: (user?.role || 'WARGA').toUpperCase(),
    hasRole,
    canAccess,
    loading,
    refresh: fetchUser,
  };
}
