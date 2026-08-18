/**
 * Dedicated "Start your salon" signup page — Ship 2B of SaaS conversion.
 *
 * Different from the plain /register in three ways:
 *   1. Collects salon-owner-specific fields (salon name, country, currency)
 *      that the backend uses to create the Organization.
 *   2. Defaults role to OWNER so the new org is properly seated.
 *   3. Lives inside the marketing PublicLayout so it feels like a natural
 *      end-cap of the pricing / features journey rather than an app screen.
 *
 * On success the customer lands in the app, at /onboarding, which walks
 * them through Branch → Service → Staff → Done.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, Loader2, Sparkles, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { usePageMeta } from '@/hooks/usePageMeta';

const COUNTRIES: { code: string; name: string; currency: string; flag: string }[] = [
  { code: 'IN', name: 'India',              currency: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States',      currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom',     currency: 'GBP', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada',             currency: 'CAD', flag: '🇨🇦' },
];

export default function StartSalon() {
  usePageMeta({
    title: 'Start your Salon — 14-day free trial | Salon & SPA Management',
    description: 'Create your salon account in 60 seconds. Bookings, POS, WhatsApp, memberships and AI Search — 14-day trial, no credit card.',
    keywords: 'salon signup, saloon signup, start a salon, spa signup, salon software free trial',
  });

  const nav = useNavigate();
  const { setAuth } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    salonName: '',
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    password:  '',
    country:   'IN',
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const currency = COUNTRIES.find((c) => c.code === form.country)?.currency || 'INR';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    if (form.salonName.trim().length < 2) { toast.error('Give your salon a name'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', {
        email:     form.email.trim(),
        password:  form.password,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim() || undefined,
        role:      'OWNER',
        salonName: form.salonName.trim(),
        country:   form.country,
        currency,
      });
      const payload = data?.data ?? data;
      setAuth(payload.user, payload.accessToken, payload.refreshToken);
      toast.success('Your salon is live! Let\'s finish set-up…');
      nav('/onboarding', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-x py-12 sm:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
      {/* Left — value */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 bg-white border border-charcoal/10 rounded-full px-3 py-1 text-xs font-semibold text-brand-600 shadow-soft mb-5">
          <Sparkles className="w-3.5 h-3.5" /> 14-day free trial · No credit card
        </div>
        <h1 className="h-display text-4xl sm:text-5xl md:text-6xl leading-[0.95]">
          Start your salon in <span className="text-brand-600">60 seconds</span>.
        </h1>
        <p className="mt-4 text-lg text-charcoal/70 max-w-lg">
          Bookings, POS, WhatsApp, memberships and AI Search — one account,
          your team, your customers.
        </p>
        <ul className="mt-8 space-y-3 max-w-md">
          {[
            'Your account is ready before your first coffee',
            'Trial period until you\'re confident',
            'Cancel anytime · your data is yours',
            'Support in Tamil, Hindi and English',
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" /> {t}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid grid-cols-3 gap-4 max-w-md text-center">
          {[
            { icon: Zap, l: 'Live in 10 min' },
            { icon: ShieldCheck, l: 'Your data, isolated' },
            { icon: Sparkles, l: 'AI Search included' },
          ].map((s) => (
            <div key={s.l} className="p-3 rounded-xl bg-white border border-charcoal/5 shadow-soft">
              <s.icon className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <div className="text-xs text-charcoal/70">{s.l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right — form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={submit}
        className="card-soft p-6 sm:p-8 space-y-4 max-w-lg w-full lg:sticky lg:top-24"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Salon name *</label>
          <input
            required
            value={form.salonName}
            onChange={(e) => setForm({ ...form, salonName: e.target.value })}
            placeholder="Trendy Trims"
            className="w-full px-4 py-3 border border-charcoal/15 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Your first name *</label>
            <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Last name *</label>
            <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-4 py-3 border border-charcoal/15 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Work email *</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@salon.com" className="w-full px-4 py-3 border border-charcoal/15 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Phone (WhatsApp)</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" className="w-full px-4 py-3 border border-charcoal/15 rounded-xl" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Password *</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6+ characters" className="w-full px-4 py-3 border border-charcoal/15 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">Country / currency</label>
          <div className="grid grid-cols-5 gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setForm({ ...form, country: c.code })}
                className={`px-2 py-2 rounded-lg text-center transition-colors border ${
                  form.country === c.code
                    ? 'bg-brand-50 border-brand-600 text-brand-700'
                    : 'border-charcoal/10 hover:border-brand-400'
                }`}
              >
                <div className="text-lg leading-none">{c.flag}</div>
                <div className="text-[10px] font-semibold mt-1">{c.currency}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-hero w-full justify-center !py-3.5 mt-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start free trial <ArrowRight className="w-4 h-4" /></>}
        </button>
        <p className="text-xs text-center text-charcoal/50">
          By continuing you agree to our terms. Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold">Login</Link>
        </p>
      </motion.form>
    </div>
  );
}
