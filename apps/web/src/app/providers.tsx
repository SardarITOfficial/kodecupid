'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
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

/** Routes that actually need a member session. */
const MEMBER_PREFIXES = ['/app', '/profile', '/settings', '/onboarding'];
/** Admin routes exist under /admin, but the login pages must not probe for a session. */
const ADMIN_PREFIXES = ['/admin'];
const ADMIN_PUBLIC_PATHS = ['/admin/login', '/admin/accept-invite'];

function needsMemberSession(pathname: string | null): boolean {
  if (!pathname) return false;
  return MEMBER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function needsAdminSession(pathname: string | null): boolean {
  if (!pathname) return false;
  if (ADMIN_PUBLIC_PATHS.includes(pathname)) return false;
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [member, setMemberState] = useState<MemberSession | null>(null);
  const [admin, setAdminState] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMember = useCallback(async (): Promise<MemberSession | null> => {
    try {
      const session = await apiFetch<MemberSession>('/auth/me', { auth: 'member' });
      setMemberState(session);
      return session;
    } catch (error) {
      if (!(error instanceof ApiError)) {
        // Network failures are treated like signed-out rather than crashing the app.
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

    // Public pages never ask for a session, so an anonymous visitor produces no
    // 401 noise in the console and no wasted round trips.
    const wantMember = needsMemberSession(pathname);
    const wantAdmin = needsAdminSession(pathname);

    if (!wantMember && !wantAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      await Promise.all([wantMember ? refreshMember() : null, wantAdmin ? refreshAdmin() : null]);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, refreshAdmin, refreshMember]);

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
