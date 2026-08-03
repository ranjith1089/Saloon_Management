import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt, Search, Filter, Calendar as CalendarIcon, IndianRupee,
  CreditCard, TrendingUp, X,
} from 'lucide-react';
import api from '@/services/api';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}
function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ServicePaymentCollection() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [branchFilter, setBranchFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['service-payments', startDate, endDate, branchFilter],
    queryFn: async () => {
      const params: any = {
        paymentStatus: 'PAID',
        limit: 500,
        startDate,
        endDate,
      };
      if (branchFilter) params.branchId = branchFilter;
      return (await api.get('/bookings', { params })).data;
    },
  });

  const rows = (data?.data || []) as any[];

  const filtered = useMemo(() => {
    return rows.filter((b) => {
      if (methodFilter && b.paymentMethod !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          b.bookingNumber,
          b.customer?.profile?.firstName,
          b.customer?.profile?.lastName,
          b.customer?.email,
          b.service?.name,
          `${b.staff?.user?.profile?.firstName || ''} ${b.staff?.user?.profile?.lastName || ''}`,
          b.paymentRef,
          b.paymentMethod,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, methodFilter, search]);

  const methodOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.paymentMethod && set.add(r.paymentMethod));
    return Array.from(set).sort();
  }, [rows]);

  const summary = useMemo(() => {
    let total = 0;
    let taxCollected = 0;
    const byMethod: Record<string, number> = {};
    filtered.forEach((b) => {
      total += Number(b.totalAmount || 0);
      taxCollected += Number(b.taxAmount || 0);
      const m = b.paymentMethod || 'Unknown';
      byMethod[m] = (byMethod[m] || 0) + Number(b.totalAmount || 0);
    });
    return { total, count: filtered.length, taxCollected, byMethod };
  }, [filtered]);

  const topMethods = Object.entries(summary.byMethod)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" /> Service Payment Collection
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every paid service booking — filter, review, reconcile.
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Total collected" value={`₹${summary.total.toLocaleString()}`} icon={<IndianRupee className="w-4 h-4" />} tone="green" />
        <Tile label="Payments" value={summary.count} icon={<Receipt className="w-4 h-4" />} tone="blue" />
        <Tile label="Tax collected" value={`₹${summary.taxCollected.toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} tone="yellow" />
        <Tile
          label="Average ticket"
          value={summary.count > 0 ? `₹${Math.round(summary.total / summary.count).toLocaleString()}` : '—'}
          icon={<CreditCard className="w-4 h-4" />}
          tone="pink"
        />
      </div>

      {/* Filter bar */}
      <div className="card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by customer, service, staff, booking#, reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" className="input !py-1.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input type="date" className="input !py-1.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <select
            className="input max-w-[180px]"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All branches</option>
            {branches?.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            className="input max-w-[160px]"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All methods</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {(search || methodFilter) && (
            <button
              onClick={() => { setSearch(''); setMethodFilter(''); }}
              className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <div className="text-xs text-gray-500 ml-auto whitespace-nowrap">
            {filtered.length} of {rows.length}
          </div>
        </div>

        {topMethods.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">By method:</span>
            {topMethods.map(([method, amt]) => (
              <span
                key={method}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {method}: <span className="font-semibold text-gray-900">₹{amt.toLocaleString()}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Collected</th>
                <th className="text-left px-4 py-3 font-semibold">Service / Booking</th>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Staff / Branch</th>
                <th className="text-left px-4 py-3 font-semibold">Method</th>
                <th className="text-left px-4 py-3 font-semibold">Reference</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4">
                    <div className="animate-pulse h-4 bg-gray-100 rounded" />
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  {rows.length === 0 ? (
                    <>
                      <p className="text-gray-600 font-medium">No paid service bookings in this range</p>
                      <p className="text-xs text-gray-400 mt-1">Collect a payment on a booking to see it here.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">No results</p>
                      <button
                        onClick={() => { setSearch(''); setMethodFilter(''); }}
                        className="btn-secondary text-xs mt-3 inline-flex items-center gap-1"
                      >
                        <Filter className="w-3 h-3" /> Clear filters
                      </button>
                    </>
                  )}
                </td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {b.paidAt ? (
                        <>
                          <div>{new Date(b.paidAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-gray-500">{new Date(b.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.service?.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{b.bookingNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.customer?.profile?.firstName} {b.customer?.profile?.lastName}</div>
                      <div className="text-xs text-gray-500">{b.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.staff?.user?.profile?.firstName} {b.staff?.user?.profile?.lastName}</div>
                      <div className="text-xs text-gray-500">{b.branch?.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        <CreditCard className="w-3 h-3" /> {b.paymentMethod || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {b.paymentRef || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary-600">
                      ₹{Number(b.totalAmount).toLocaleString()}
                      {Number(b.taxAmount) > 0 && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          incl. tax ₹{Number(b.taxAmount).toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-primary-700 tabular-nums">
                    ₹{summary.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <CalendarIcon className="w-3 h-3" />
        Showing paid bookings collected between{' '}
        <span className="font-medium">{new Date(startDate).toLocaleDateString()}</span> and{' '}
        <span className="font-medium">{new Date(endDate).toLocaleDateString()}</span>.
      </p>
    </div>
  );
}

function Tile({ label, value, icon, tone }: { label: string; value: any; icon: React.ReactNode; tone: 'blue' | 'green' | 'yellow' | 'pink' }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    pink: 'bg-pink-100 text-pink-600',
  };
  return (
    <div className="card !p-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg font-bold tabular-nums truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
