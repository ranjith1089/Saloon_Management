/**
 * High-fidelity CSS-only mockups of the actual product UI. Used across the
 * marketing site so we don't need to ship or maintain raster screenshots.
 * Every mock is scaled to fit its container.
 */
import { Calendar, Users, DollarSign, TrendingUp, ShoppingBag, Package, Scissors, CheckCircle2, MessageCircle } from 'lucide-react';

// -----------------------------------------------------------------------------
// Dashboard KPI board
// -----------------------------------------------------------------------------
export function DashboardMock() {
  const kpis = [
    { icon: Calendar,    label: 'Appointments',  value: '18',       color: 'bg-blue-100 text-blue-600' },
    { icon: DollarSign,  label: 'Revenue',       value: '₹17,106',  color: 'bg-green-100 text-green-600' },
    { icon: ShoppingBag, label: 'Products',      value: '₹4,450',   color: 'bg-pink-100 text-pink-600' },
    { icon: TrendingUp,  label: 'Commissions',   value: '₹2,790',   color: 'bg-purple-100 text-purple-600' },
    { icon: Users,       label: 'Customers',     value: '247',      color: 'bg-orange-100 text-orange-600' },
  ];
  const bars = [40, 65, 45, 80, 55, 90, 70, 100, 85, 60, 75, 95, 88, 72];
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-black text-lg">Dashboard</div>
          <div className="text-[10px] text-charcoal/50">Overview of your salon</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">R</div>
      </div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-2.5">
            <div className={`w-6 h-6 rounded-lg ${k.color} flex items-center justify-center mb-1`}>
              <k.icon className="w-3 h-3" />
            </div>
            <div className="text-[9px] text-charcoal/60 truncate">{k.label}</div>
            <div className="font-bold text-xs tabular-nums truncate">{k.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3">
        <div className="text-[10px] font-semibold text-charcoal/60 mb-2">Revenue · Last 14 days</div>
        <div className="flex items-end gap-1 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Bookings — staff-grid calendar
// -----------------------------------------------------------------------------
export function BookingsMock() {
  const staff = ['Amit', 'Priya', 'Ravi', 'Meera'];
  const slots = ['10:00','10:30','11:00','11:30','12:00'];
  const bookings: Record<string, { at: number; label: string; color: string }[]> = {
    Amit:  [{ at: 0, label: 'Haircut', color: 'bg-blue-500' }, { at: 3, label: 'Facial', color: 'bg-purple-500' }],
    Priya: [{ at: 1, label: 'Manicure', color: 'bg-pink-500' }],
    Ravi:  [{ at: 2, label: 'Beard trim', color: 'bg-amber-500' }],
    Meera: [{ at: 0, label: 'Massage', color: 'bg-green-500' }, { at: 4, label: 'Pedicure', color: 'bg-rose-500' }],
  };
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-black text-lg">Bookings · Today</div>
        <div className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Staff Grid</div>
      </div>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="grid grid-cols-[50px_repeat(4,1fr)] text-[10px] bg-charcoal/5 font-semibold">
          <div className="p-2 text-charcoal/60">Time</div>
          {staff.map((s) => <div key={s} className="p-2 text-center">{s}</div>)}
        </div>
        {slots.map((slot, r) => (
          <div key={slot} className="grid grid-cols-[50px_repeat(4,1fr)] border-t border-charcoal/5">
            <div className="p-2 text-[9px] text-charcoal/50">{slot}</div>
            {staff.map((s) => {
              const b = bookings[s]?.find((x) => x.at === r);
              return (
                <div key={s} className="p-1 min-h-[28px]">
                  {b && (
                    <div className={`${b.color} text-white text-[9px] font-semibold rounded px-1.5 py-0.5 truncate`}>
                      {b.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// POS — unified sales
// -----------------------------------------------------------------------------
export function POSMock() {
  const tiles = [
    { name: 'Haircut',       price: '₹500', color: 'bg-brand-100 text-brand-700' },
    { name: 'Facial',        price: '₹1,200', color: 'bg-purple-100 text-purple-700' },
    { name: 'Manicure',      price: '₹400',   color: 'bg-pink-100 text-pink-700' },
    { name: 'Massage',       price: '₹1,800', color: 'bg-blue-100 text-blue-700' },
    { name: 'Hair Color',    price: '₹2,500', color: 'bg-amber-100 text-amber-700' },
    { name: 'Beard Trim',    price: '₹250',   color: 'bg-green-100 text-green-700' },
  ];
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-black text-lg">Sales · POS</div>
        <div className="flex gap-1">
          <span className="text-[10px] font-semibold bg-brand-600 text-white px-2 py-1 rounded-full">Products</span>
          <span className="text-[10px] font-semibold bg-white text-charcoal/60 px-2 py-1 rounded-full">Services</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 grid grid-cols-3 gap-2">
          {tiles.map((t) => (
            <div key={t.name} className={`${t.color} rounded-xl p-2 text-center`}>
              <Scissors className="w-4 h-4 mx-auto mb-1" />
              <div className="text-[10px] font-semibold truncate">{t.name}</div>
              <div className="text-[10px] font-bold">{t.price}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 flex flex-col">
          <div className="text-[10px] font-semibold text-charcoal/60 mb-2">Cart</div>
          <div className="space-y-1 text-[10px] flex-1">
            <div className="flex justify-between"><span>Haircut</span><span>₹500</span></div>
            <div className="flex justify-between"><span>Serum ×2</span><span>₹1,600</span></div>
          </div>
          <div className="border-t border-charcoal/10 pt-2 mt-2">
            <div className="flex justify-between text-[10px]"><span>GST 18%</span><span>₹378</span></div>
            <div className="flex justify-between font-bold text-xs"><span>Total</span><span className="text-brand-600">₹2,478</span></div>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2 text-[9px] font-semibold">
            <div className="bg-brand-600 text-white rounded py-1 text-center">Cash</div>
            <div className="border border-charcoal/10 rounded py-1 text-center">UPI</div>
            <div className="border border-charcoal/10 rounded py-1 text-center">Card</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// WhatsApp automation
// -----------------------------------------------------------------------------
export function WhatsAppMock() {
  const messages = [
    { to: 'Priya S.', text: 'Hi Priya! Reminder: your Facial is tomorrow at 3 PM with Amit. Reply CANCEL if needed.', delivered: true },
    { to: 'Arun K.',  text: 'Hi Arun! Miss you at Trendy Trims. Book your next Haircut and get 20% off — link:', delivered: true },
    { to: 'Divya R.', text: 'Happy Birthday Divya! 🎉 Enjoy 25% off any service this week. Book any time.', delivered: false },
  ];
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-display font-black text-lg">WhatsApp Automation</div>
          <div className="text-[10px] text-charcoal/50">Cloud API · 1,247 sent this month</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center">
          <MessageCircle className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-3 flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {m.to.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold">{m.to}</div>
                <div className="text-[9px] text-charcoal/50 flex items-center gap-1">
                  {m.delivered && <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />}
                  {m.delivered ? 'Delivered' : 'Queued'}
                </div>
              </div>
              <div className="text-[10px] text-charcoal/70 line-clamp-2 mt-0.5">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Products / Inventory
// -----------------------------------------------------------------------------
export function ProductsMock() {
  const products = [
    { name: 'Kerastase Nutritive', stock: 15, price: '₹2,400', low: false },
    { name: 'Wella Color Touch',   stock: 3,  price: '₹1,800', low: true },
    { name: "L'Oreal Shampoo",     stock: 28, price: '₹850',   low: false },
    { name: 'Streax Hair Serum',   stock: 8,  price: '₹450',   low: false },
  ];
  return (
    <div className="bg-cream rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-black text-lg">Products</div>
        <div className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">3 branches</div>
      </div>
      <div className="bg-white rounded-xl divide-y divide-charcoal/5">
        {products.map((p) => (
          <div key={p.name} className="p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{p.name}</div>
              <div className="text-[10px] text-charcoal/60">{p.price}</div>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.low ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              ×{p.stock}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
