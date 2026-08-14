import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import WhatsAppBubble from '@/components/public/WhatsAppBubble';
import StickyDemoBar from '@/components/public/StickyDemoBar';
import { useAuthStore } from '@/store/authStore';

/**
 * Layout for all public marketing pages (Home, Features, Pricing, About,
 * Blog, Contact). Adds the `public-body` class to <body> so the app's
 * default grey background flips to the cream marketing tone, then flips
 * back when the user navigates into the authed app.
 *
 * Logged-in users hitting the marketing home get bounced to /dashboard so
 * the landing page never gets in the way of daily work.
 */
export default function PublicLayout() {
  const { isAuthenticated } = useAuthStore();
  const { pathname } = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    document.body.classList.add('public-body');
    return () => { document.body.classList.remove('public-body'); };
  }, []);

  useEffect(() => {
    if (isAuthenticated && pathname === '/') nav('/dashboard', { replace: true });
  }, [isAuthenticated, pathname, nav]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <WhatsAppBubble />
      <StickyDemoBar />
    </div>
  );
}
