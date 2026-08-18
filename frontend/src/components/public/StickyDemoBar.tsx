import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, ArrowRight } from 'lucide-react';

/**
 * Mobile-only sticky bottom bar that appears after the visitor scrolls past
 * the hero. Two paths — Start free trial, or WhatsApp. Dismissed for the
 * session in sessionStorage so it doesn't re-appear after they close it.
 */
export default function StickyDemoBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('stickyBar.dismissed') === '1') return;
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 md:hidden">
      <div className="bg-white/95 backdrop-blur border-t border-charcoal/10 shadow-2xl px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => { setVisible(false); sessionStorage.setItem('stickyBar.dismissed', '1'); }}
          className="w-7 h-7 flex items-center justify-center text-charcoal/40 hover:text-charcoal flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <a
          href="https://wa.me/918754006483"
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-full flex items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
        <Link
          to="/start-salon"
          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 rounded-full flex items-center justify-center gap-1.5"
        >
          Start free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
