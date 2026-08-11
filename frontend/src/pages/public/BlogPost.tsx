import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Clock, ArrowLeft, MessageCircle } from 'lucide-react';
import { POSTS } from '@/content/posts';

// Minimal markdown-ish renderer — handles ##, ###, bold, and paragraphs.
function renderBody(body: string) {
  const lines = body.split('\n');
  const out: JSX.Element[] = [];
  let key = 0;
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;
    if (line.startsWith('## ')) {
      out.push(<h2 key={key++} className="font-display font-black text-2xl sm:text-3xl mt-10 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      out.push(<h3 key={key++} className="font-bold text-xl mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [line.slice(2)];
      // (single-item bullets are handled paragraph-style to keep it simple)
      out.push(<li key={key++} className="ml-6 list-disc text-charcoal/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: applyInline(items[0]) }} />);
    } else {
      out.push(<p key={key++} className="text-charcoal/80 leading-relaxed mt-4" dangerouslySetInnerHTML={{ __html: applyInline(line) }} />);
    }
  });
  return out;
}

function applyInline(s: string) {
  // **bold**
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const post = POSTS.find((p) => p.slug === slug);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post) return <Navigate to="/blog" replace />;

  const others = POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <article className="container-x py-16 max-w-3xl">
        <Link to="/blog" className="text-sm text-charcoal/60 hover:text-brand-600 flex items-center gap-1 mb-8">
          <ArrowLeft className="w-4 h-4" /> All posts
        </Link>

        <div className="flex items-center gap-3 text-xs text-charcoal/60 mb-4">
          <span className="bg-brand-50 text-brand-600 font-semibold px-2 py-1 rounded-full">{post.category}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readMin} min read</span>
          <span>· {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        <h1 className="h-display text-4xl sm:text-5xl md:text-6xl leading-tight">{post.title}</h1>
        <p className="mt-4 text-lg text-charcoal/70 leading-relaxed">{post.excerpt}</p>

        <div className="mt-8 aspect-[16/8] rounded-3xl bg-gradient-to-br from-brand-50 to-cream flex items-center justify-center text-9xl">
          {post.cover}
        </div>

        <div className="prose prose-lg max-w-none mt-10">
          {renderBody(post.body)}
        </div>

        <div className="mt-14 pt-8 border-t border-charcoal/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
            {post.author.slice(0, 1)}
          </div>
          <div>
            <div className="font-semibold">{post.author}</div>
            <div className="text-sm text-charcoal/60">Founder · Aveon Infotech</div>
          </div>
          <a href="https://wa.me/918754006483" target="_blank" rel="noreferrer" className="ml-auto btn-hero-secondary text-sm">
            <MessageCircle className="w-4 h-4" /> Chat
          </a>
        </div>
      </article>

      {/* Related */}
      <section className="bg-white border-t border-charcoal/5">
        <div className="container-x py-16">
          <h2 className="h-display text-2xl sm:text-3xl mb-6">Keep reading</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {others.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="card-soft p-5 hover:-translate-y-1 hover:shadow-pop transition-all group">
                <div className="text-4xl mb-3">{p.cover}</div>
                <div className="text-xs text-brand-600 font-semibold">{p.category}</div>
                <h3 className="font-display font-bold text-lg mt-1 group-hover:text-brand-600 transition-colors">{p.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
