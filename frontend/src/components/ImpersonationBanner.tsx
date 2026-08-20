/**
 * Impersonation banner — Ship 5B.
 * Shown at the very top of the authed app whenever the current session
 * is a super-admin acting as another user. Prominent + persistent so
 * nobody forgets they're driving somebody else's tenant.
 */
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const ORIGINAL_KEY = 'impersonation_original';

/**
 * Decode the JWT payload without verifying (verification stays server-side).
 * Only used to surface the `act` claim on the banner.
 */
function decodeJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), '=');
    return JSON.parse(atob(b64));
  } catch { return null; }
}

export default function ImpersonationBanner() {
  const { user, setAuth } = useAuthStore();
  const payload = decodeJwt<{ act?: { userId: string; email: string } }>(localStorage.getItem('accessToken'));
  const actor = payload?.act;
  if (!actor) return null;

  const returnToAdmin = () => {
    try {
      const raw = sessionStorage.getItem(ORIGINAL_KEY);
      if (!raw) {
        // No stash — safest fallback is a hard reload to login.
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      const { user: prevUser, accessToken, refreshToken } = JSON.parse(raw);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setAuth(prevUser, accessToken, refreshToken);
      sessionStorage.removeItem(ORIGINAL_KEY);
      window.location.href = '/super-admin';
    } catch {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-purple-700 text-white print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <strong>Impersonating {user?.email}</strong>{' '}
          <span className="opacity-80">— actions here are attributed to {actor.email}.</span>
        </div>
        <button
          onClick={returnToAdmin}
          className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1 rounded-full font-semibold text-xs flex-shrink-0"
        >
          <LogOut className="w-3 h-3" /> Return to admin
        </button>
      </div>
    </div>
  );
}

/** Helper for the SuperAdmin drawer to store the current session before impersonating. */
export function stashOriginalSession() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!accessToken || !refreshToken || !user) return;
  sessionStorage.setItem(ORIGINAL_KEY, JSON.stringify({ user, accessToken, refreshToken }));
}
