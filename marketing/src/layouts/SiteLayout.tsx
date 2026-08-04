import { Outlet } from 'react-router-dom';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WhatsAppBubble from '@/components/WhatsAppBubble';

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
}
