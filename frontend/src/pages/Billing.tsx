/**
 * Billing page — Ship 3A of SaaS conversion.
 * Owner-facing view of the current plan + upgrade CTAs. Actual payment
 * runs in Ship 3B via Razorpay Subscriptions; today the "Upgrade" button
 * opens a pre-filled WhatsApp conversation with the sales team so the
 * salon owner can start the transaction while we plumb Razorpay in.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Loader2, Sparkles, Crown, Zap, Building2, MessageCircle, AlertTriangle, ExternalLink, Receipt } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { PLANS, CURRENCY_SYMBOL, PlanCode } from '@/config/plans';
import api from '@/services/api';

const WHATSAPP = '918754006483';

interface BillingStatus {
  configured: boolean;
  webhookConfigured: boolean;
  plansConfigured: Record<string, boolean>;
}
interface InvoiceRow {
  id: string;
  amount: string | number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  issuedAt: string;
  paidAt?: string | null;
  pdfUrl?: string | null;
}

export default function Billing() {
  const { organization: org, isLoading } = useOrganization();
  const [busy, setBusy] = useState<PlanCode | null>(null);

  // Is Razorpay live on the server right now?
  const statusQ = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: async () => (await api.get('/billing/status')).data.data,
    staleTime: 5 * 60_000,
  });
  const invoicesQ = useQuery<InvoiceRow[]>({
    queryKey: ['billing-invoices'],
    queryFn: async () => (await api.get('/billing/invoices')).data.data,
    enabled: !!statusQ.data?.configured,
    staleTime: 60_000,
  });
  const canCharge = !!statusQ.data?.configured;

  if (isLoading || !org) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading billing…</div>
      </div>
    );
  }

  const ccy = (org.currency as 'INR' | 'USD' | 'GBP' | 'AED') || 'INR';
  const sym = CURRENCY_SYMBOL[ccy];
  const currentPlan = org.plan;
  const trialDays = org.trialDaysRemaining ?? 0;
  const expired = org.trialExpired;

  const requestUpgrade = async (plan: PlanCode) => {
    setBusy(plan);
    try {
      if (canCharge && statusQ.data?.plansConfigured?.[plan]) {
        // Live path — create a Razorpay Subscription, redirect to hosted checkout.
        const res = await api.post('/billing/subscribe', { plan });
        const shortUrl = res.data?.data?.shortUrl;
        if (!shortUrl) throw new Error('No checkout URL returned');
        window.open(shortUrl, '_blank');
        toast.success('Checkout opened in a new tab — complete payment there.');
      } else {
        // Ship-3A WhatsApp fallback
        const text = encodeURIComponent(
          `Hi Aveon team! I'd like to upgrade "${org.name}" to the ${plan} plan. My org id: ${org.slug}.`
        );
        window.open(`https://wa.me/${WHATSAPP}?text=${text}`, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not start upgrade');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing &amp; Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and see what each plan unlocks.</p>
      </div>

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`card !p-6 ${expired ? 'border-red-200 bg-red-50/40' : ''}`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              currentPlan === 'TRIAL' ? 'bg-amber-100 text-amber-700' :
              currentPlan === 'PRO'   ? 'bg-purple-100 text-purple-700' :
              currentPlan === 'GROWTH'? 'bg-primary-100 text-primary-700' :
                                        'bg-blue-100 text-blue-700'
            }`}>
              {currentPlan === 'PRO' ? <Crown className="w-6 h-6" /> :
               currentPlan === 'GROWTH' ? <Zap className="w-6 h-6" /> :
                                          <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Current plan</div>
              <div className="font-bold text-xl">{currentPlan}</div>
              {currentPlan === 'TRIAL' && (
                <div className={`text-sm mt-1 ${expired ? 'text-red-700' : 'text-gray-600'}`}>
                  {expired
                    ? <><AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Trial ended — pick a plan to keep working</>
                    : `${trialDays} ${trialDays === 1 ? 'day' : 'days'} left in your free trial`}
                </div>
              )}
              {currentPlan !== 'TRIAL' && (
                <div className="text-sm text-gray-600 mt-1">
                  Active · billed monthly
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Organization</div>
            <div className="font-semibold">{org.name}</div>
            <div className="text-xs text-gray-500 font-mono">{org.slug}</div>
          </div>
        </div>
      </motion.div>

      {/* Plan comparison */}
      <div>
        <div className="text-xs uppercase font-semibold tracking-widest text-gray-500 mb-3">Choose a plan</div>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.code;
            return (
              <motion.div
                key={p.code}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-5 flex flex-col ${
                  p.highlight
                    ? 'bg-gray-900 text-white shadow-xl'
                    : 'bg-white border border-gray-200 shadow-sm'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {p.highlight && (
                  <div className="inline-block bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mb-3 self-start">
                    Most popular
                  </div>
                )}
                <div className={`text-xs uppercase font-semibold tracking-widest ${p.highlight ? 'text-primary-400' : 'text-primary-600'}`}>
                  {p.tag}
                </div>
                <div className="font-bold text-2xl mt-1">{p.name}</div>
                <p className={`text-sm mt-1 ${p.highlight ? 'text-white/70' : 'text-gray-600'}`}>{p.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-black text-3xl">{sym}{p.price[ccy].toLocaleString('en-IN')}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-gray-500'}`}>
                    /mo per branch{ccy === 'INR' ? ' + GST' : ''}
                  </span>
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.highlight ? 'text-primary-400' : 'text-primary-600'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => requestUpgrade(p.code)}
                  disabled={isCurrent || busy === p.code}
                  className={`mt-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : p.highlight
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-900 hover:bg-black text-white'
                  }`}
                >
                  {busy === p.code ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   isCurrent ? <><CheckCircle2 className="w-4 h-4" /> Current plan</> :
                   canCharge && statusQ.data?.plansConfigured?.[p.code]
                     ? <><ExternalLink className="w-4 h-4" /> Subscribe · pay online</>
                     : <><MessageCircle className="w-4 h-4" /> Upgrade via WhatsApp</>}
                </button>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          {canCharge
            ? 'Card / UPI checkout is powered by Razorpay. You can cancel any time before the next cycle.'
            : 'Automated card / UPI checkout is coming — for now, tap "Upgrade" and our team activates your plan within an hour. No credit card locked in until then.'}
        </p>
      </div>

      {/* Invoice history — only shows once Razorpay is live and there's at least one row. */}
      {canCharge && (invoicesQ.data?.length ?? 0) > 0 && (
        <div className="card !p-5">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-500" /> Invoice history
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-widest text-gray-500">Date</th>
                  <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-widest text-gray-500">Amount</th>
                  <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-widest text-gray-500">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {(invoicesQ.data || []).map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">{new Date(inv.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-2 pr-4 font-medium">
                      {inv.currency === 'INR' ? '₹' : inv.currency + ' '}
                      {Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID'   ? 'bg-green-100 text-green-700' :
                        inv.status === 'FAILED' ? 'bg-red-100 text-red-700'   :
                                                  'bg-amber-100 text-amber-700'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage — current-month WA + branch / staff caps */}
      <div className="card !p-5">
        <div className="font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" /> Your usage this month
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <UsageBar
            label="Branches"
            used={org._count?.branches ?? 0}
            cap={org.usage?.branchesCap ?? null}
          />
          <UsageBar
            label="Team members"
            used={org._count?.users ?? 0}
            cap={org.usage?.staffCap ?? null}
          />
          <UsageBar
            label="WhatsApp msgs"
            used={org.usage?.waMsgsThisMonth ?? 0}
            cap={org.usage?.waMsgsCap ?? null}
          />
        </div>
      </div>

      {/* Contact */}
      {null /* keep spacing */}
      <div className="rounded-2xl bg-gray-900 text-white p-6 flex items-start gap-4">
        <MessageCircle className="w-8 h-8 text-primary-400 flex-shrink-0" />
        <div>
          <div className="font-bold">Have a question about billing?</div>
          <div className="text-sm text-white/70 mt-1">
            Talk to a human on WhatsApp — usually reply in minutes.
          </div>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1 flex-shrink-0"
        >
          Chat
        </a>
      </div>
    </div>
  );
}

// Small usage bar. Unlimited → shows the "∞" glyph and no meter.
function UsageBar({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  const unlimited = cap === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(cap!, 1)) * 100));
  const tone = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-primary-600';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs uppercase font-semibold tracking-widest text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700">
          {used.toLocaleString('en-IN')} {unlimited ? '/ ∞' : `/ ${cap!.toLocaleString('en-IN')}`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {!unlimited && <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}
