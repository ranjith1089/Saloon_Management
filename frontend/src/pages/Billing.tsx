/**
 * Billing page — Ship 3A of SaaS conversion.
 * Owner-facing view of the current plan + upgrade CTAs. Actual payment
 * runs in Ship 3B via Razorpay Subscriptions; today the "Upgrade" button
 * opens a pre-filled WhatsApp conversation with the sales team so the
 * salon owner can start the transaction while we plumb Razorpay in.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, Crown, Zap, Building2, MessageCircle, AlertTriangle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { PLANS, CURRENCY_SYMBOL, PlanCode } from '@/config/plans';

const WHATSAPP = '918754006483';

export default function Billing() {
  const { organization: org, isLoading } = useOrganization();
  const [busy, setBusy] = useState<PlanCode | null>(null);

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

  const requestUpgrade = (plan: PlanCode) => {
    setBusy(plan);
    const text = encodeURIComponent(
      `Hi Aveon team! I'd like to upgrade "${org.name}" to the ${plan} plan. My org id: ${org.slug}.`
    );
    // Small delay so the button shows the spinner briefly — feels responsive
    setTimeout(() => {
      window.open(`https://wa.me/${WHATSAPP}?text=${text}`, '_blank');
      setBusy(null);
    }, 200);
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
                               <><MessageCircle className="w-4 h-4" /> Upgrade via WhatsApp</>}
                </button>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Automated card / UPI checkout is coming — for now, tap "Upgrade" and our team
          activates your plan within an hour. No credit card locked in until then.
        </p>
      </div>

      {/* Limits card */}
      <div className="card !p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold">Your usage</div>
            <div className="text-sm text-gray-600 mt-1">
              {org._count?.branches ?? 0} branch{org._count?.branches === 1 ? '' : 'es'} ·{' '}
              {org._count?.users ?? 0} team member{org._count?.users === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
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
