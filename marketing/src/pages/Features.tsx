import { Link } from 'react-router-dom';
import {
  Calendar, ShoppingBag, Users, Crown, TrendingUp, MessageCircle,
  Link2, Gift, Package, Building2, BarChart3, ShieldCheck, ArrowRight, CheckCircle2,
} from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';

const APP = 'https://saloon-management-nine.vercel.app';

const GROUPS = [
  {
    id: 'bookings', icon: Calendar, title: 'Bookings that actually work',
    tag: 'Core',
    desc: 'Three views (Table, Calendar, Staff-grid). Instant conflict detection. Walk-in support baked in — no need to create a customer account to record an appointment.',
    points: ['Drag to reschedule', 'Colour-coded status flow', 'Walk-in mode for shop-floor sales', 'One tap to collect payment'],
  },
  {
    id: 'pos', icon: ShoppingBag, title: 'Unified point of sale',
    tag: 'Sales',
    desc: 'Products and services on one ticket. Quick-pay buttons for Cash / UPI / Card. Attach a pending booking to auto-pull the customer and service. GST handled server-side.',
    points: ['Tap-to-add product & service tiles', 'Mixed cart · one printable receipt', 'Attach pending booking → mark complete', 'Payment method dropdown with custom emoji icons'],
  },
  {
    id: 'whatsapp', icon: MessageCircle, title: 'WhatsApp automation',
    tag: 'Growth',
    desc: 'Booking confirmations, reminders, birthday wishes and win-back messages sent via the official WhatsApp Cloud API. Templates you can edit yourself. Test-send from Settings.',
    points: ['Cloud API (not deep-links)', 'Editable template bank', 'Best-effort — never blocks a booking', 'Free tier includes 500 msgs/month'],
  },
  {
    id: 'widget', icon: Link2, title: 'Public booking widget',
    tag: 'Growth',
    desc: 'Every branch gets a shareable URL. Drop it on Instagram bio, WhatsApp status, or embed as an iframe on your website. Customers book in 5 taps without an account.',
    points: ['Mobile-first 5-step wizard', 'Iframe embed for any website', 'Copy-paste Insta-bio share text', 'PENDING status so spam can\'t block slots'],
  },
  {
    id: 'memberships', icon: Crown, title: 'Memberships & member pricing',
    tag: 'Retention',
    desc: 'Sell packages that lock in customers. Set member-price separately on each service. Applied automatically at booking and POS. Track validity and renewals.',
    points: ['Plan builder with validity', 'Auto-applied member pricing', 'MEMBER badges across the app', 'Renewal reminders'],
  },
  {
    id: 'referrals', icon: Gift, title: 'Referrals & loyalty',
    tag: 'Growth',
    desc: 'Every customer gets a 6-character share code. Both parties earn points on the referee\'s first completed booking. Loyalty streak card lives on the customer home screen.',
    points: ['Shareable code + WhatsApp share button', 'Auto-award on first booking', 'Admin overview of all referrals', 'Streak-based loyalty psychology'],
  },
  {
    id: 'growth', icon: TrendingUp, title: 'Growth toolkit',
    tag: 'Retention',
    desc: 'Three tabs (Rebook, Win-back, Birthdays) that surface exactly who to contact today, with WhatsApp / SMS deep-links pre-filled with editable message templates.',
    points: ['{name} / {days} / {service} placeholders', 'One-tap WhatsApp or SMS', 'No cron setup needed', 'Copy-safe for offline outreach'],
  },
  {
    id: 'staff', icon: Users, title: 'Staff & payouts',
    tag: 'Ops',
    desc: 'Monthly revenue targets, target-aware commissions (paid only above target), automatic payouts, weekly schedules. Staff see their own bookings and earnings — nothing else.',
    points: ['Target × Commission % model', 'Verification queue for new hires', 'Photo upload via Cloudinary', 'Staff dashboard scoped by role'],
  },
  {
    id: 'products', icon: Package, title: 'Products & stock',
    tag: 'Ops',
    desc: 'Shared product catalog, per-branch stock counts. Low-stock and expiring alerts. Buy price, MRP, sell price, and member price all tracked separately.',
    points: ['Shared catalog · per-branch counts', 'Buy/Sell/Member price fields', 'Expiry-date tracking', 'Low-stock badge across POS'],
  },
  {
    id: 'branches', icon: Building2, title: 'Multi-branch, from day one',
    tag: 'Scale',
    desc: 'Every entity — bookings, staff, stock, bookings — is scoped to a branch. Multi-branch reporting rolled up on the Reports page. Switch branches from any picker.',
    points: ['Per-branch price overrides', 'Independent operating hours', 'Roll-up reports across all branches', 'Owner-visible only'],
  },
  {
    id: 'reports', icon: BarChart3, title: 'Reports that answer questions',
    tag: 'Insights',
    desc: 'Revenue trends, service vs product mix, staff performance, membership take-up, payment method share. Filter by branch and date range. Export ready in v1.1.',
    points: ['30-day revenue trend chart', 'Staff commission summary', 'Membership take-up funnel', 'Product vs service mix'],
  },
  {
    id: 'security', icon: ShieldCheck, title: 'Roles & permissions',
    tag: 'Security',
    desc: 'ADMIN / MANAGER / STAFF / CUSTOMER with a proper permissions matrix. All money math computed server-side. Server-side scoping so staff literally cannot see other staff\'s data.',
    points: ['4 role tiers, editable matrix', 'Server-side scoped queries', 'Money math never trusted from client', 'Dedicated /my/* customer portal'],
  },
];

export default function Features() {
  return (
    <>
      {/* Hero */}
      <section className="container-x py-16 sm:py-24 text-center">
        <div className="eyebrow mb-3">Features</div>
        <h1 className="h-display text-5xl sm:text-6xl md:text-7xl">
          Everything a modern salon <span className="text-brand-600">actually needs</span>.
        </h1>
        <p className="mt-6 text-lg text-charcoal/70 max-w-2xl mx-auto">
          Twelve capability groups. Zero add-ons. No hidden fees.
        </p>
      </section>

      {/* Feature groups */}
      <div className="container-x pb-24">
        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sticky sub-nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              <div className="eyebrow mb-3">Jump to</div>
              {GROUPS.map((g) => (
                <a key={g.id} href={`#${g.id}`} className="block text-sm text-charcoal/60 hover:text-brand-600 py-1.5">
                  {g.title.split(' ')[0]}
                </a>
              ))}
            </nav>
          </aside>

          {/* Groups */}
          <div className="space-y-14">
            {GROUPS.map((g, i) => (
              <section id={g.id} key={g.id} className={`scroll-mt-24 grid md:grid-cols-2 gap-8 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="card-soft aspect-[4/3] p-8 flex items-center justify-center bg-gradient-to-br from-brand-50 to-cream">
                  <g.icon className="w-20 h-20 text-brand-600 opacity-40" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                    {g.tag}
                  </span>
                  <h2 className="h-display text-3xl sm:text-4xl mt-3 mb-3">{g.title}</h2>
                  <p className="text-charcoal/70 leading-relaxed">{g.desc}</p>
                  <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {g.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-charcoal/80">
                        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="container-x pb-20">
        <div className="rounded-3xl bg-charcoal text-white p-10 sm:p-14 text-center">
          <h2 className="h-display text-3xl sm:text-4xl">See it running on your own salon.</h2>
          <p className="mt-3 text-white/70">14-day free trial. No credit card. Live in ten minutes.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href={`${APP}/register`} className="btn-primary">
              Start free trial <ArrowRight className="w-4 h-4" />
            </a>
            <Link to="/pricing" className="btn-secondary">See pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
}
