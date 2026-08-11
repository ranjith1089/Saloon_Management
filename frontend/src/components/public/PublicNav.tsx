import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Scissors, LogIn } from 'lucide-react';

const links = [
  { to: '/',         label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/pricing',  label: 'Pricing' },
  { to: '/about',    label: 'About' },
  { to: '/blog',     label: 'Blog' },
  { to: '/contact',  label: 'Contact' },
];

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'bg-cream/85 backdrop-blur border-b border-charcoal/5' : 'bg-transparent'}`}>
      <div className="container-x flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-xl">Salon</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-charcoal/70 hover:text-charcoal'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-brand-600 border border-charcoal/15 hover:border-brand-600 px-4 py-2.5 rounded-full transition-colors"
          >
            <LogIn className="w-4 h-4" /> Login
          </Link>
          <Link to="/register" className="btn-hero text-sm !py-2.5">Start free trial</Link>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal hover:text-brand-600 border border-charcoal/15 px-3 py-1.5 rounded-full"
          >
            <LogIn className="w-3.5 h-3.5" /> Login
          </Link>
          <button onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-charcoal/5 bg-cream/95 backdrop-blur">
          <div className="container-x py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-charcoal/80'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link to="/login" className="btn-hero-secondary text-sm justify-center">
                <LogIn className="w-4 h-4" /> Login
              </Link>
              <Link to="/register" className="btn-hero text-sm justify-center">Start free trial</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
