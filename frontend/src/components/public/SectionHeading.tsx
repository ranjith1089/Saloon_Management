import { ReactNode } from 'react';

export default function SectionHeading({
  eyebrow, title, sub, center = true,
}: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={`${center ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'} mb-10 sm:mb-14`}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 className="h-display text-3xl sm:text-4xl md:text-5xl text-charcoal">{title}</h2>
      {sub && <p className="mt-4 text-charcoal/70 text-base sm:text-lg leading-relaxed">{sub}</p>}
    </div>
  );
}
