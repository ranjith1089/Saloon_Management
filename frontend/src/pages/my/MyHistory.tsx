import { useQuery } from '@tanstack/react-query';
import { Receipt, Check } from 'lucide-react';
import api from '@/services/api';

export default function MyHistory() {
  const { data } = useQuery({
    queryKey: ['my-bookings-history'],
    queryFn: async () => (await api.get('/bookings?limit=200&paymentStatus=PAID')).data.data as any[],
  });

  const paid = (data || []).sort(
    (a, b) => new Date(b.paidAt || b.updatedAt).getTime() - new Date(a.paidAt || a.updatedAt).getTime()
  );

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
            <p className="text-sm text-gray-500">Total spent</p>
            <p className="text-3xl font-bold tabular-nums">₹{total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">across {paid.length} payment{paid.length === 1 ? '' : 's'}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <Receipt className="w-7 h-7" />
          </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paid.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No payments yet.
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
