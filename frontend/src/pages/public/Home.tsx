import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Play, MessageCircle, Calendar, ShoppingBag, Users,
  Crown, TrendingUp, Star, Zap, Sparkles, CheckCircle2,
} from 'lucide-react';
import SectionHeading from '@/components/public/SectionHeading';
import { DashboardMock, BookingsMock, POSMock, WhatsAppMock, ProductsMock } from '@/components/public/DashboardMock';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="container-x pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white border border-charcoal/10 rounded-full px-3 py-1 text-xs font-semibold text-brand-600 shadow-soft mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Now with WhatsApp Cloud API
            </div>
            <h1 className="h-display text-5xl sm:text-6xl md:text-7xl leading-[0.9]">
              The salon software that <span className="text-brand-600">fills your chairs</span>.
            </h1>
            <p className="mt-6 text-lg text-charcoal/70 max-w-xl leading-relaxed">
              Bookings, POS, memberships, WhatsApp reminders, and a booking widget
              for your Instagram bio — all in one place. Built for Indian salons.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-hero">
                Start 14-day free trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/features" className="btn-hero-secondary">
                <Play className="w-4 h-4" /> See it in action
              </Link>
            </div>
            <p className="mt-4 text-xs text-charcoal/50">
              No credit card · Cancel anytime · Setup in 10 minutes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-pop border-8 border-white bg-white">
              <DashboardMock />
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-pop flex items-center gap-2 border border-charcoal/5">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-xs font-semibold">WhatsApp sent</div>
                <div className="text-[10px] text-charcoal/60">2 min ago</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-pop flex items-center gap-2 border border-charcoal/5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Sale · ₹2,478</div>
                <div className="text-[10px] text-charcoal/60">Just now</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-charcoal/5 bg-white">
        <div className="container-x py-8 flex flex-wrap items-center justify-around gap-6 text-charcoal/40 font-display font-black text-lg sm:text-xl">
          <span>Trendy Trims</span>
          <span>Glow Studio</span>
          <span>Urban Cuts</span>
          <span>Silk & Style</span>
          <span>The Grooming Co.</span>
          <span>Bloom Salon</span>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="Sound familiar?"
          title={<>Running a salon shouldn't feel like <span className="text-brand-600">herding cats</span>.</>}
          sub="If you're juggling WhatsApp bookings, a paper diary, and half a dozen apps just to close the day, you're leaving money on the table."
        />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: '📵', title: 'No-shows eating profit', text: 'Customers book on WhatsApp, forget the appointment, and no one gets reminded.' },
            { icon: '📓', title: 'Paper diary chaos', text: 'Double bookings, missed follow-ups, and no idea which staff is your best performer.' },
            { icon: '💸', title: 'Revenue leaks', text: 'Product sales unaccounted, tips forgotten, memberships expiring silently.' },
          ].map((c) => (
            <div key={c.title} className="card-soft p-6">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-lg mb-1">{c.title}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE BENTO */}
      <section className="bg-white border-y border-charcoal/5">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Everything you need"
            title={<>One app. <span className="text-brand-600">Every corner</span> of your salon.</>}
            sub="Stop stitching together 5 tools. Salon replaces your diary, POS, marketing, and CRM in a single, gorgeous interface your staff will actually use."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BentoCard span="md:col-span-2" icon={MessageCircle} title="WhatsApp automation" tag="Cloud API" desc="Booking confirmations, reminders, birthday wishes and win-back messages — sent automatically via the official WhatsApp Cloud API." />
            <BentoCard icon={Calendar} title="Smart bookings" desc="Table, calendar & staff-grid views. Drag to reschedule. Instant conflict detection." />
            <BentoCard icon={ShoppingBag} title="Unified POS" desc="Sell products and services on one ticket. Tap-to-add tiles. Printable receipt." />
            <BentoCard icon={Zap} title="Public booking widget" desc="Share on Instagram bio. Customers book without an account. Bookings land in your dashboard." />
            <BentoCard icon={Crown} title="Memberships" desc="Plan builder, member pricing, auto-applied at booking and POS." />
            <BentoCard span="md:col-span-2" icon={TrendingUp} title="Growth toolkit" tag="Built-in" desc="Rebook lapsed customers, win back the ones who ghosted, and celebrate birthdays — with one click, over WhatsApp." />
            <BentoCard icon={Users} title="Staff & payouts" desc="Monthly revenue targets, target-aware commission, payouts calculated automatically." />
          </div>
        </div>
      </section>

      <ProductShowcase />

      {/* HOW IT WORKS */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Live in ten minutes. Really."
          sub="No consultants, no long onboarding calls. Sign up, add your branches, and start booking."
        />
        <div className="grid md:grid-cols-3 gap-4 relative">
          {[
            { n: '01', title: 'Sign up free', text: 'Create your account. 14-day trial, no card.' },
            { n: '02', title: 'Add branches & staff', text: 'Import services, set prices, upload staff photos.' },
            { n: '03', title: 'Go live', text: 'Share your booking widget on Instagram. First appointment lands.' },
          ].map((s, i) => (
            <div key={s.n} className="card-soft p-8 relative">
              <div className="font-display font-black text-6xl text-brand-100">{s.n}</div>
              <h3 className="font-bold text-xl mt-2">{s.title}</h3>
              <p className="text-charcoal/70 mt-1">{s.text}</p>
              {i < 2 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-600 bg-cream" />}
            </div>
          ))}
        </div>
      </section>

      {/* NUMBERS */}
      <section className="bg-charcoal text-white">
        <div className="container-x py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: '10 min',   l: 'Average setup time' },
            { n: '60%',      l: 'Fewer no-shows' },
            { n: '3×',       l: 'More Instagram bookings' },
            { n: '₹0',       l: 'Setup fee, ever' },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display font-black text-4xl md:text-5xl text-brand-500">{s.n}</div>
              <div className="text-white/60 text-sm mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="Real owners"
          title={<>Loved by salon owners who <span className="text-brand-600">actually run salons</span>.</>}
        />
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card-soft p-6 flex flex-col">
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <blockquote className="text-charcoal/80 flex-1">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  {t.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-charcoal/60">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="bg-white border-y border-charcoal/5">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Plans that scale with you"
            title="Priced for real salons. Not enterprises."
            sub="Start free. Upgrade when you're ready. Cancel any time."
          />
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '₹999', tag: 'Solo salons', features: ['Bookings + POS', '500 WhatsApp msgs', 'Up to 3 staff', 'Public booking widget'] },
              { name: 'Growth',  price: '₹2,499', tag: 'Most popular', highlight: true, features: ['Everything in Starter', 'Memberships & referrals', '2,000 WhatsApp msgs', 'Up to 10 staff', 'Growth toolkit'] },
              { name: 'Pro',     price: '₹4,999', tag: 'Chains', features: ['Everything in Growth', 'Multi-branch reports', 'Unlimited staff', '5,000 WhatsApp msgs', 'Priority support'] },
            ].map((p) => (
              <div key={p.name} className={`rounded-3xl p-6 ${p.highlight ? 'bg-charcoal text-white shadow-pop scale-[1.02]' : 'bg-cream border border-charcoal/5'}`}>
                <div className={`text-xs font-semibold uppercase tracking-widest ${p.highlight ? 'text-brand-500' : 'text-brand-600'}`}>{p.tag}</div>
                <div className="font-display font-black text-2xl mt-1">{p.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display font-black text-4xl">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/60' : 'text-charcoal/60'}`}>/mo</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.highlight ? 'text-brand-500' : 'text-brand-600'}`} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="btn-hero-secondary">See full comparison <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-x py-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 text-white p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0.5px, transparent 1px), radial-gradient(circle at 80% 70%, white 0.5px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <h2 className="h-display text-4xl sm:text-5xl md:text-6xl">Ready to fill your chairs?</h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              14-day free trial. Setup takes ten minutes. Your first WhatsApp confirmation goes out today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="bg-white text-brand-600 hover:bg-cream font-semibold px-6 py-3 rounded-full shadow-2xl">
                Start free trial
              </Link>
              <Link to="/contact" className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold px-6 py-3 rounded-full">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductShowcase() {
  const TABS = [
    { key: 'dashboard', label: 'Dashboard',  Comp: DashboardMock,  desc: 'Every KPI that actually matters — appointments, revenue, product sales, commissions, customers.' },
    { key: 'bookings',  label: 'Bookings',   Comp: BookingsMock,   desc: 'Staff-grid, table, or calendar view. Drag to reschedule. Instant conflict detection.' },
    { key: 'pos',       label: 'POS',        Comp: POSMock,        desc: 'Products and services on one ticket. Quick-pay buttons for Cash / UPI / Card. GST handled server-side.' },
    { key: 'whatsapp',  label: 'WhatsApp',   Comp: WhatsAppMock,   desc: 'Automated confirmations, reminders, and win-back messages via the official WhatsApp Cloud API.' },
    { key: 'products',  label: 'Products',   Comp: ProductsMock,   desc: 'Shared catalog. Per-branch stock. Low-stock alerts. MRP / Buy / Sell / Member pricing.' },
  ];
  const [active, setActive] = useState('dashboard');
  const current = TABS.find((t) => t.key === active)!;
  const Comp = current.Comp;
  return (
    <section className="bg-white border-y border-charcoal/5">
      <div className="container-x py-20">
        <SectionHeading
          eyebrow="See it in action"
          title={<>The product, up close.</>}
          sub="Every screen below is live UI — the same components that ship in the app."
        />
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                active === t.key ? 'bg-brand-600 text-white shadow-pop' : 'bg-cream border border-charcoal/10 text-charcoal/70 hover:border-brand-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-cream to-brand-50 p-4 sm:p-8 shadow-pop">
            <div className="flex items-center gap-1.5 mb-3 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <div className="flex-1 mx-3 h-6 bg-white/70 rounded-md text-[10px] text-charcoal/50 flex items-center px-3">
                salon.aveoninfotech.com/{current.key === 'dashboard' ? '' : current.key}
              </div>
            </div>
            <Comp />
          </div>
          <p className="mt-6 text-center text-charcoal/70 max-w-xl mx-auto">{current.desc}</p>
        </motion.div>
      </div>
    </section>
  );
}

function BentoCard({ icon: Icon, title, desc, tag, span = '' }: any) {
  return (
    <div className={`card-soft p-6 hover:-translate-y-1 hover:shadow-pop transition-all ${span}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        {tag && <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{tag}</span>}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-charcoal/70 text-sm mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Owner · Trendy Trims, Chennai',
    quote: 'The WhatsApp reminders alone cut our no-shows in half. Setup was actually 10 minutes — I was suspicious at first.' },
  { name: 'Arun M.', role: 'Manager · Urban Cuts, Coimbatore',
    quote: 'We put the booking link in our Instagram bio and got 12 walk-ins the first week. This paid for itself in 3 days.' },
  { name: 'Divya R.', role: 'Founder · Bloom Salon, Kochi',
    quote: 'Finally a salon software that works on my phone AND my laptop. Staff picked it up in one day.' },
];
