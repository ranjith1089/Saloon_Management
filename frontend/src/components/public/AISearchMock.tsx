import { Sparkles, Search, Bot, TrendingUp } from 'lucide-react';

/**
 * Compact CSS-only mockup of the AI Search / Insights feature.
 * Shows a natural-language query and an AI-composed answer with a
 * couple of chart tiles.
 */
export default function AISearchMock() {
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-display font-black text-lg flex items-center gap-2">
            AI Search & Insights
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="text-[10px] text-charcoal/50">Ask anything about your salon in plain English</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-brand-600 text-white flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-soft">
        <Search className="w-4 h-4 text-charcoal/40" />
        <div className="flex-1 text-xs text-charcoal">
          Who are my top 5 customers this month by revenue?
        </div>
        <div className="text-[9px] text-white bg-brand-600 rounded-md px-2 py-1 font-semibold">Ask</div>
      </div>

      {/* AI answer bubble */}
      <div className="mt-3 bg-white rounded-xl p-3">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-brand-600 text-white flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-charcoal/80">
              Here are your top 5 by revenue this month:
            </div>
            <div className="mt-2 space-y-1">
              {[
                { name: 'Priya S.',   revenue: '₹8,400', bookings: 6 },
                { name: 'Arun M.',    revenue: '₹6,200', bookings: 4 },
                { name: 'Divya R.',   revenue: '₹5,800', bookings: 5 },
                { name: 'Ravi K.',    revenue: '₹4,900', bookings: 3 },
                { name: 'Meera P.',   revenue: '₹4,100', bookings: 4 },
              ].map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-[10px] py-1 border-t border-charcoal/5 first:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-charcoal/40 font-mono w-3">{i + 1}</span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-charcoal/50">{c.bookings} visits</span>
                  </div>
                  <span className="font-bold text-brand-700">{c.revenue}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[9px] text-purple-700 bg-purple-50 rounded px-2 py-1">
              <TrendingUp className="w-3 h-3" />
              Suggested: Send Priya, Divya &amp; Meera a "thanks for your loyalty" WhatsApp — you may lift their next-visit rate by ~22%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
