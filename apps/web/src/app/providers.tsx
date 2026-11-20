'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AdminSession, MemberSession } from '@kodecupid/shared';
import { apiFetch, ApiError } from '@/lib/api';

interface SessionContextValue {
  member: MemberSession | null;
  admin: AdminSession | null;
  loading: boolean;
  refreshMember: () => Promise<MemberSession | null>;
  refreshAdmin: () => Promise<AdminSession | null>;
  setMember: (session: MemberSession) => void;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [member, setMemberState] = useState<MemberSession | null>(null);
  const [admin, setAdminState] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMember = useCallback(async (): Promise<MemberSession | null> => {
    try {
      const session = await apiFetch<MemberSession>('/auth/me', { auth: 'member' });
      setMemberState(session);
      return session;
    } catch (error) {
      if (error instanceof ApiError) {
        setMemberState(null);
        return null;
      }
      setMemberState(null);
      return null;
    }
  }, []);

  const refreshAdmin = useCallback(async (): Promise<AdminSession | null> => {
    try {
      const session = await apiFetch<AdminSession>('/admin/auth/me', { auth: 'admin' });
      setAdminState(session);
      return session;
    } catch {
      setAdminState(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([refreshMember(), refreshAdmin()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAdmin, refreshMember]);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setMemberState(null);
  }, []);

  const adminLogout = useCallback(async () => {
    await apiFetch('/admin/auth/logout', { method: 'POST', auth: 'admin' }).catch(() => undefined);
    setAdminState(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      member,
      admin,
      loading,
      refreshMember,
      refreshAdmin,
      setMember: setMemberState,
      logout,
      adminLogout,
    }),
    [member, admin, loading, refreshMember, refreshAdmin, logout, adminLogout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside <Providers>');
  }
  return context;
}
