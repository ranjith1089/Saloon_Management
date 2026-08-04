/**
 * Public splash / landing page at the app root. Serves logged-out visitors
 * a friendly hero with clear paths (Login / Register / Learn more) instead
 * of auto-redirecting to /login. Logged-in users are bounced straight to
 * their dashboard so this page never gets in their way.
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, ExternalLink, Scissors, Sparkles, MessageCircle, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Where the marketing site will live once deployed. Update when the real
// public URL exists.
const MARKETING_URL = 'https://salon-marketing.vercel.app';

export default function PublicHome() {
  const nav = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) nav('/dashboard', { replace: true });
  }, [isAuthenticated, user, nav]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Simple public nav */}
      <header className="border-b border-gray-200/60 bg-white/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">Salon</span>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href={MARKETING_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary-600 px-3 py-2 rounded-full transition-colors"
            >
              Learn more <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 border border-gray-300 hover:border-primary-600 hover:text-primary-600 px-4 py-2 rounded-full transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full shadow-lg transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" /> Sign up free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Now with WhatsApp Cloud API
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-gray-900">
          The salon software that <span className="text-primary-600">fills your chairs</span>.
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Bookings, POS, memberships, WhatsApp reminders, and a booking widget
          for your Instagram bio — all in one place. Built for Indian salons.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-full shadow-xl transition-all hover:-translate-y-0.5"
          >
            Start 14-day free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-full shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" /> I already have an account
          </Link>
          <a
            href={MARKETING_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-semibold px-4 py-3 transition-colors"
          >
            Learn more <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          No credit card · Cancel anytime · Setup in 10 minutes
        </p>

        {/* Feature strip */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: MessageCircle, title: 'WhatsApp reminders', text: 'Cut no-shows by 60%.' },
            { icon: ShoppingBag,   title: 'Unified POS',        text: 'Products + services on one bill.' },
            { icon: Sparkles,      title: 'Booking widget',     text: 'Put it in your Insta bio.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-left">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-gray-900">{f.title}</div>
              <div className="text-sm text-gray-600 mt-0.5">{f.text}</div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs text-gray-400">
          © {new Date().getFullYear()} Aveon Infotech Private Limited
        </p>
      </main>
    </div>
  );
}
