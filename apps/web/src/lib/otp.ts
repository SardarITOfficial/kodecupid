export interface PendingOtp {
  challengeId: string;
  phone: string;
  expiresAt: string;
  resendAvailableAt: string;
  debugCode?: string;
  flow: 'register' | 'login';
}

const KEY = 'kc_pending_otp';

export function savePendingOtp(value: PendingOtp): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function readPendingOtp(): PendingOtp | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOtp;
  } catch {
    return null;
  }
}

export function clearPendingOtp(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}
