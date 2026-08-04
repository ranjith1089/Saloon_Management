import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Scissors } from 'lucide-react';

const links = [
  { to: '/',         label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/pricing',  label: 'Pricing' },
  { to: '/about',    label: 'About' },
  { to: '/blog',     label: 'Blog' },
  { to: '/contact',  label: 'Contact' },
];

export default function Nav() {
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
          <a href="https://saloon-management-nine.vercel.app/login" className="text-sm font-medium text-charcoal/70 hover:text-charcoal px-3">Login</a>
          <a href="https://saloon-management-nine.vercel.app/register" className="btn-primary text-sm !py-2.5">Start free trial</a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
            <a href="https://saloon-management-nine.vercel.app/register" className="btn-primary text-sm justify-center mt-2">Start free trial</a>
          </div>
        </div>
      )}
    </header>
  );
}
