import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { POSTS } from '@/content/posts';
import SectionHeading from '@/components/SectionHeading';

const CATEGORIES = ['All', 'Growth', 'Running a salon', 'Product'];

export default function Blog() {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? POSTS : POSTS.filter((p) => p.category === cat);
  const [featured, ...rest] = filtered;

  return (
    <>
      <section className="container-x py-16 sm:py-20 text-center">
        <div className="eyebrow mb-3">Blog</div>
        <h1 className="h-display text-5xl sm:text-6xl md:text-7xl">
          Ideas for salons that <span className="text-brand-600">actually want to grow</span>.
        </h1>
        <p className="mt-6 text-lg text-charcoal/70 max-w-2xl mx-auto">
          Playbooks, KPI breakdowns, and stories from real Indian salons.
        </p>
      </section>

      {/* Category chips */}
      <div className="container-x">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                cat === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-charcoal/10 text-charcoal/70 hover:border-brand-600 hover:text-brand-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured + grid */}
      <section className="container-x pb-20">
        {featured && (
          <Link to={`/blog/${featured.slug}`} className="card-soft grid md:grid-cols-2 gap-6 p-6 mb-8 hover:shadow-pop transition-all group">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-50 to-cream flex items-center justify-center text-8xl">
              {featured.cover}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs text-charcoal/60">
                <span className="bg-brand-50 text-brand-600 font-semibold px-2 py-1 rounded-full">{featured.category}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.readMin} min</span>
              </div>
              <h2 className="h-display text-3xl sm:text-4xl mt-3 group-hover:text-brand-600 transition-colors">{featured.title}</h2>
              <p className="mt-3 text-charcoal/70">{featured.excerpt}</p>
              <div className="mt-4 text-brand-600 font-semibold flex items-center gap-1">
                Read post <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="card-soft p-5 hover:-translate-y-1 hover:shadow-pop transition-all group">
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-brand-50 to-cream flex items-center justify-center text-6xl mb-4">
                {p.cover}
              </div>
              <div className="flex items-center gap-2 text-xs text-charcoal/60 mb-2">
                <span className="bg-brand-50 text-brand-600 font-semibold px-2 py-1 rounded-full">{p.category}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.readMin} min</span>
              </div>
              <h3 className="font-display font-bold text-xl group-hover:text-brand-600 transition-colors">{p.title}</h3>
              <p className="text-sm text-charcoal/70 mt-2 line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
