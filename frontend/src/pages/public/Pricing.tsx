import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import SectionHeading from '@/components/public/SectionHeading';
import { usePageMeta } from '@/hooks/usePageMeta';



const CURRENCIES = {
  INR: { sym: '₹', starter: 249,  growth: 699,  pro: 1399, region: 'India' },
  USD: { sym: '$', starter: 39,   growth: 79,   pro: 149,  region: 'USA' },
  GBP: { sym: '£', starter: 29,   growth: 59,   pro: 119,  region: 'UK / EU' },
  AED: { sym: 'AED ', starter: 149, growth: 349, pro: 649, region: 'UAE' },
} as const;
type Ccy = keyof typeof CURRENCIES;

const TIER_FEATURES: { label: string; starter: boolean | string; growth: boolean | string; pro: boolean | string }[] = [
  { label: 'Branches',                     starter: '1',        growth: 'Up to 3',    pro: 'Unlimited' },
  { label: 'Staff members',                starter: 'Up to 3',  growth: 'Up to 10',   pro: 'Unlimited' },
  { label: 'Bookings — Table/Calendar/Staff-grid', starter: true, growth: true, pro: true },
  { label: 'Unified POS + printable receipt', starter: true, growth: true, pro: true },
  { label: 'Public booking widget',        starter: true,       growth: true,         pro: true },
  { label: 'WhatsApp msgs included/mo',    starter: '100',      growth: '500',        pro: '1,000' },
  { label: 'Memberships & member pricing', starter: false,      growth: true,         pro: true },
  { label: 'Referrals + loyalty streaks',  starter: false,      growth: true,         pro: true },
  { label: 'Growth toolkit (rebook/winback/birthday)', starter: false, growth: true, pro: true },
  { label: 'Multi-branch consolidated reports', starter: false, growth: false,        pro: true },
  { label: 'Access control matrix',        starter: false,      growth: true,         pro: true },
  { label: 'Priority WhatsApp support',    starter: false,      growth: false,        pro: true },
  { label: 'Custom branding + logo',       starter: true,       growth: true,         pro: true },
  { label: 'API access',                   starter: false,      growth: false,        pro: true },
];

const FAQ = [
  { q: 'Do you charge setup or onboarding fees?', a: 'Never. Sign up, use the 14-day trial, then pick a plan when you\'re ready.' },
  { q: 'What happens after the free trial?', a: 'Your data stays. Pick a plan and continue, or extend the trial by asking us on WhatsApp. We don\'t auto-charge you.' },
  { q: 'Can I switch plans later?', a: 'Yes, up or down, any time. Changes take effect on the next billing cycle.' },
  { q: 'What if I use more WhatsApp messages than my plan includes?', a: '₹1 per extra message. Billed at the end of the month. No surprises.' },
  { q: 'Do you support other countries?', a: 'Yes — the app supports any currency via Settings. Pricing here is in INR by default; switch the toggle for USD / GBP / AED.' },
  { q: 'Is my data secure and portable?', a: 'JWT auth, bcrypt hashing, server-side role scoping. You can export all your data as CSV any time.' },
  { q: 'What payment methods can I use to pay you?', a: 'UPI, credit/debit card, and bank transfer for annual plans.' },
  { q: 'Do you offer a discount for annual billing?', a: 'Yes — pay annually and get 2 months free (17% off).' },
];

export default function Pricing() {
  usePageMeta({
    title: 'Pricing — Salon & SPA Management from ₹249/mo',
    description: 'Simple pricing for Salon and SPA Management software. Starter ₹249, Growth ₹699, Pro ₹1,399 — all + GST. 14-day free trial, no credit card. Available in INR, USD, GBP, AED.',
    keywords: 'Salon software pricing, saloon software pricing India, SPA management pricing, salon software cost, cheap salon software',
  });
  const [ccy, setCcy] = useState<Ccy>('INR');
  const [annual, setAnnual] = useState(false);
  const c = CURRENCIES[ccy];
  const price = (n: number) => `${c.sym}${(annual ? Math.round(n * 10) : n).toLocaleString('en-IN')}`;

  return (
    <>
      {/* Hero */}
      <section className="container-x py-16 sm:py-24 text-center">
        <div className="eyebrow mb-3">Pricing</div>
        <h1 className="h-display text-5xl sm:text-6xl md:text-7xl">
          Simple. Transparent. <span className="text-brand-600">No surprises.</span>
        </h1>
        <p className="mt-6 text-lg text-charcoal/70 max-w-2xl mx-auto">
          Start free for 14 days. Pick a plan when you're ready. Cancel any time.
        </p>

        {/* Toggles */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="inline-flex bg-white rounded-full p-1 border border-charcoal/10 shadow-soft">
            {(['INR','USD','GBP','AED'] as Ccy[]).map((k) => (
              <button
                key={k}
                onClick={() => setCcy(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ccy === k ? 'bg-brand-600 text-white' : 'text-charcoal/60 hover:text-charcoal'}`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="inline-flex bg-white rounded-full p-1 border border-charcoal/10 shadow-soft">
            <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${!annual ? 'bg-brand-600 text-white' : 'text-charcoal/60'}`}>
              Monthly
            </button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${annual ? 'bg-brand-600 text-white' : 'text-charcoal/60'}`}>
              Annual · 2 months free
            </button>
          </div>
        </div>
        <p className="text-xs text-charcoal/50 mt-3">
          Prices shown for {c.region}. {ccy === 'INR' ? '18% GST additional as per Indian tax law.' : 'All prices exclude taxes.'}
        </p>
      </section>

      {/* Tier cards */}
      <section className="container-x pb-16">
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <TierCard
            name="Starter" tag="Solo salons"
            price={price(c.starter)} suffix={annual ? '/year' : `/mo per branch${ccy === 'INR' ? ' + GST' : ''}`}
            desc="Everything you need to run a single salon."
            features={['Bookings + POS', 'Public booking widget', '500 WhatsApp msgs', 'Up to 3 staff', 'Custom branding']}
          />
          <TierCard
            name="Growth" tag="Most popular" highlight
            price={price(c.growth)} suffix={annual ? '/year' : `/mo per branch${ccy === 'INR' ? ' + GST' : ''}`}
            desc="For salons ready to grow their client base."
            features={['Everything in Starter', 'Memberships', 'Referrals + loyalty', 'Growth toolkit', '2,000 WhatsApp msgs', 'Up to 10 staff']}
          />
          <TierCard
            name="Pro" tag="Chains & spas"
            price={price(c.pro)} suffix={annual ? '/year' : `/mo per branch${ccy === 'INR' ? ' + GST' : ''}`}
            desc="Multi-branch operations with priority support."
            features={['Everything in Growth', 'Multi-branch reports', 'Unlimited staff', '5,000 WhatsApp msgs', 'API access', 'Priority support']}
          />
        </div>
        <p className="text-center mt-8 text-xs text-charcoal/60">
          14-day free trial · No credit card · Cancel anytime · Setup in 10 minutes
        </p>
      </section>

      {/* Feature matrix */}
      <section className="bg-white border-y border-charcoal/5">
        <div className="container-x py-16">
          <SectionHeading eyebrow="Compare plans" title="Every feature, side by side." />
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left py-3 px-4 font-semibold text-charcoal/60">Feature</th>
                  <th className="py-3 px-4 font-semibold">Starter</th>
                  <th className="py-3 px-4 font-semibold bg-brand-50 rounded-t-lg">Growth</th>
                  <th className="py-3 px-4 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((f, i) => (
                  <tr key={f.label} className={i % 2 ? 'bg-cream/50' : ''}>
                    <td className="text-left py-3 px-4">{f.label}</td>
                    <td className="text-center py-3 px-4">{renderCell(f.starter)}</td>
                    <td className="text-center py-3 px-4 bg-brand-50/50">{renderCell(f.growth)}</td>
                    <td className="text-center py-3 px-4">{renderCell(f.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="container-x py-20">
        <SectionHeading eyebrow="Add-ons" title="Only pay for what you actually use." />
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { title: 'Extra WhatsApp messages', price: '₹1', unit: 'per message', desc: 'Billed monthly, only if you exceed your plan limit.' },
            { title: 'SMS credits',             price: '₹0.25', unit: 'per message', desc: 'Optional SMS fallback for customers without WhatsApp.' },
            { title: 'White-label + custom domain', price: '₹1,000', unit: '/mo',   desc: 'Your branding, your domain, no "Powered by" line.' },
          ].map((a) => (
            <div key={a.title} className="card-soft p-6">
              <div className="text-xs uppercase font-semibold text-brand-600 tracking-widest">Add-on</div>
              <div className="font-display font-black text-xl mt-2">{a.title}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-black text-2xl">{a.price}</span>
                <span className="text-sm text-charcoal/60">{a.unit}</span>
              </div>
              <p className="text-sm text-charcoal/70 mt-3">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-y border-charcoal/5">
        <div className="container-x py-20">
          <SectionHeading eyebrow="FAQ" title="Questions people ask before signing up." />
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="card-soft p-5 group">
                <summary className="flex items-center justify-between cursor-pointer font-semibold list-none">
                  {f.q}
                  <span className="text-brand-600 text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-charcoal/70 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 text-white p-10 sm:p-14 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3" />
          <h2 className="h-display text-3xl sm:text-4xl">Still unsure? Talk to a human.</h2>
          <p className="mt-3 text-white/80">Book a 15-minute demo. We'll answer every question you've got.</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link to="/register" className="bg-white text-brand-600 hover:bg-cream font-semibold px-6 py-3 rounded-full">
              Start free trial <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <a href="https://wa.me/918754006483" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold px-6 py-3 rounded-full">
              <MessageCircle className="w-4 h-4 inline mr-1" /> WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function TierCard({ name, tag, price, suffix, desc, features, highlight = false }: any) {
  return (
    <div className={`rounded-3xl p-6 flex flex-col ${highlight ? 'bg-charcoal text-white shadow-pop scale-[1.03] relative' : 'bg-white border border-charcoal/10 shadow-soft'}`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div className={`text-xs font-semibold uppercase tracking-widest ${highlight ? 'text-brand-500' : 'text-brand-600'}`}>{tag}</div>
      <div className="font-display font-black text-3xl mt-1">{name}</div>
      <p className={`text-sm mt-2 ${highlight ? 'text-white/60' : 'text-charcoal/60'}`}>{desc}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display font-black text-5xl">{price}</span>
        <span className={`text-sm ${highlight ? 'text-white/60' : 'text-charcoal/60'}`}>{suffix}</span>
      </div>
      <ul className="mt-6 space-y-2.5 flex-1">
        {features.map((f: string) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? 'text-brand-500' : 'text-brand-600'}`} /> {f}
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`mt-6 text-center font-semibold py-3 rounded-full transition-all ${highlight ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-charcoal hover:bg-black text-white'}`}
      >
        Start free trial
      </Link>
    </div>
  );
}

function renderCell(v: boolean | string) {
  if (v === true) return <Check className="w-4 h-4 text-brand-600 inline" />;
  if (v === false) return <X className="w-4 h-4 text-charcoal/20 inline" />;
  return <span className="font-medium text-sm">{v}</span>;
}
