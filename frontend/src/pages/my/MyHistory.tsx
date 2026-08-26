import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Check, Star, Filter, X } from 'lucide-react';
import api from '@/services/api';
import MyReviewModal from '@/components/my/MyReviewModal';

function paymentDate(b: any) {
  return new Date(b.paidAt || b.updatedAt || b.bookingDate);
}

export default function MyHistory() {
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [method, setMethod] = useState('');

  const { data } = useQuery({
    queryKey: ['my-bookings-history'],
    queryFn: async () => (await api.get('/bookings?limit=200&paymentStatus=PAID')).data.data as any[],
  });

  // The customer's own reviews, mapped bookingId -> review, so each paid row
  // shows either its rating or a "Rate" button.
  const { data: reviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => (await api.get('/reviews?limit=200')).data.data as any,
  });
  const reviewByBooking: Record<string, any> = {};
  for (const r of reviews?.reviews || reviews?.data || (Array.isArray(reviews) ? reviews : [])) {
    if (r?.bookingId) reviewByBooking[r.bookingId] = r;
  }

  const allPaid = (data || []).sort(
    (a, b) => paymentDate(b).getTime() - paymentDate(a).getTime()
  );

  // Distinct payment methods present, for the filter dropdown.
  const methods = useMemo(
    () => Array.from(new Set(allPaid.map((b) => b.paymentMethod).filter(Boolean))) as string[],
    [allPaid]
  );

  const paid = useMemo(() => {
    const fromTs = from ? new Date(from).setHours(0, 0, 0, 0) : null;
    const toTs = to ? new Date(to).setHours(23, 59, 59, 999) : null;
    return allPaid.filter((b) => {
      const t = paymentDate(b).getTime();
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      if (method && b.paymentMethod !== method) return false;
      return true;
    });
  }, [allPaid, from, to, method]);

  const hasFilter = !!(from || to || method);
  const clearFilters = () => { setFrom(''); setTo(''); setMethod(''); };
  const total = paid.reduce((s, b) => s + Number(b.totalAmount), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-6 h-6" /> Payment History
        </h1>
        <p className="text-sm text-gray-500 mt-1">Every paid appointment</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{hasFilter ? 'Total (filtered)' : 'Total spent'}</p>
            <p className="text-3xl font-bold tabular-nums">₹{total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">across {paid.length} payment{paid.length === 1 ? '' : 's'}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <Receipt className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-gray-500 pb-2">
            <Filter className="w-4 h-4" /> Filter
          </div>
          <div>
            <label className="label text-xs">From</label>
            <input type="date" className="input !py-1.5" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input type="date" className="input !py-1.5" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Method</label>
            <select className="input !py-1.5" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">All methods</option>
              {methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button onClick={clearFilters} className="btn-secondary !py-1.5 text-xs inline-flex items-center gap-1 mb-0.5">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Paid on</th>
                <th className="px-4 py-3 font-medium text-gray-700">Service</th>
                <th className="px-4 py-3 font-medium text-gray-700">Method</th>
                <th className="px-4 py-3 font-medium text-gray-700">Reference</th>
                <th className="px-4 py-3 font-medium text-gray-700 text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-700 text-center">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paid.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  {hasFilter ? 'No payments match these filters.' : 'No payments yet.'}
                </td></tr>
              ) : (
                paid.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-xs">
                      {b.paidAt ? new Date(b.paidAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.service?.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(b.bookingDate).toLocaleDateString()} · {b.branch?.name}
                        {b.staff?.user?.profile?.firstName && (
                          <> · with {b.staff.user.profile.firstName} {b.staff.user.profile.lastName}</>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        <Check className="w-3 h-3" /> {b.paymentMethod || 'PAID'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{b.paymentRef || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-600">
                      ₹{Number(b.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {reviewByBooking[b.id] ? (
                        <span className="inline-flex items-center gap-0.5 text-yellow-500">
                          {reviewByBooking[b.id].rating}
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" /> Rate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewBooking && (
        <MyReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} />
      )}
    </div>
  );
}
