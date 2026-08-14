import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Counts up from 0 to `to` when the element scrolls into view.
 * `prefix`/`suffix` wrap the number (e.g. `₹` prefix, `%` suffix).
 * Non-numeric values (`10 min`, `3×`, `₹0`) render as-is.
 */
export default function AnimatedNumber({
  value, duration = 1400,
}: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    // Split into prefix + digits + suffix (e.g. "₹42K" → ₹ | 42 | K)
    const m = value.match(/^([^\d]*)(\d[\d,]*)([^\d]*)$/);
    if (!m) { setDisplay(value); return; }
    const [, pre, num, suf] = m;
    const target = parseInt(num.replace(/,/g, ''), 10);
    if (!Number.isFinite(target)) { setDisplay(value); return; }

    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // Ease-out cubic — snappy start, gentle finish
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(target * eased).toLocaleString('en-IN');
      setDisplay(`${pre}${current}${suf}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref}>{display}</span>;
}
