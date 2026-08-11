/**
 * Lightweight per-page SEO helper for a client-rendered SPA.
 * Sets <title> and <meta name="description">, plus the OpenGraph
 * equivalents so social-media previews match the current route.
 *
 * Google renders JS these days, so dynamically-set tags do get indexed,
 * but keeping this minimal means no extra dependency.
 */
import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  keywords?: string;
}

function setMeta(name: string, content: string, isProp = false) {
  const attr = isProp ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function usePageMeta({ title, description, keywords }: PageMeta) {
  useEffect(() => {
    const original = document.title;
    document.title = title;
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }
    if (keywords) setMeta('keywords', keywords);
    setMeta('og:title', title, true);
    setMeta('twitter:title', title);
    return () => { document.title = original; };
  }, [title, description, keywords]);
}
