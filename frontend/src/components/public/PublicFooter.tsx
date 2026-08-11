import { Link } from 'react-router-dom';
import { Scissors, Instagram, Facebook, Youtube, Mail, Phone } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-charcoal text-white/80">
      <div className="container-x py-14 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-xl">Salon</span>
          </Link>
          <p className="mt-4 text-sm max-w-sm">
            The modern operating system for salons and spas. Built in India,
            trusted by growing salons across tier-2 and tier-3 cities.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/features" className="hover:text-white">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/register" className="hover:text-white">Free trial</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Reach us</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> <a href="mailto:contact@aveoninfotech.com" className="hover:text-white">contact@aveoninfotech.com</a></li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> <a href="tel:+918754006483" className="hover:text-white">+91 87540 06483</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Aveon Infotech Private Limited. All rights reserved.</p>
          <p>Crafted in Chennai · Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
