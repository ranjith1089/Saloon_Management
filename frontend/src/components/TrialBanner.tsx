/**
 * Trial state banner — shown at the top of the authed app whenever the
 * tenant is on the TRIAL plan. Persistent (not dismissible) once inside
 * the last 3 days, softer nudge earlier on. Expired trials get a red
 * "please upgrade" state.
 *
 * Silent no-op on paid plans and while the /organizations/me query is
 * still loading, so it never flashes on first paint.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

const DISMISS_KEY = 'trial-banner-dismissed-day';

export default function TrialBanner() {
  const { organization: org } = useOrganization();
  const [dismissed, setDismissed] = useState<string | null>(
    () => localStorage.getItem(DISMISS_KEY)
  );
  const { pathname } = useLocation();

  // Hide on billing page — the user is already dealing with the upgrade
  // and the banner would be visual noise there.
  if (pathname.startsWith('/billing')) return null;
  if (!org || org.plan !== 'TRIAL') return null;

  const daysLeft = org.trialDaysRemaining ?? 0;
  const expired  = !!org.trialExpired;
  const today    = new Date().toISOString().slice(0, 10);

  // Users can snooze the banner once per day when they still have >3 days.
  // Under 3 days OR expired = always shown, undismissible.
  const canDismiss = !expired && daysLeft > 3;
  if (canDismiss && dismissed === today) return null;

  const tone = expired
    ? { bg: 'bg-red-600',    text: 'text-white', Icon: AlertTriangle }
    : daysLeft <= 3
      ? { bg: 'bg-amber-500', text: 'text-white', Icon: AlertTriangle }
      : { bg: 'bg-primary-600', text: 'text-white', Icon: Sparkles };

  return (
    <div className={`${tone.bg} ${tone.text} print:hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 text-sm">
        <tone.Icon className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {expired ? (
            <span>
              <strong>Your free trial has ended.</strong>{' '}
              Upgrade now to keep taking bookings.
            </span>
          ) : daysLeft === 0 ? (
            <span>
              <strong>Trial ends today.</strong>{' '}
              Pick a plan to keep everything running tomorrow.
            </span>
          ) : (
            <span>
              <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your free trial.</strong>{' '}
              Pick a plan any time — nothing changes until you do.
            </span>
          )}
        </div>
        <Link
          to="/billing"
          className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1 rounded-full font-semibold text-xs flex-shrink-0"
        >
          {expired ? 'Upgrade now' : 'See plans'} <ArrowRight className="w-3 h-3" />
        </Link>
        {canDismiss && (
          <button
            onClick={() => { localStorage.setItem(DISMISS_KEY, today); setDismissed(today); }}
            className="opacity-70 hover:opacity-100 flex-shrink-0"
            title="Snooze for today"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
