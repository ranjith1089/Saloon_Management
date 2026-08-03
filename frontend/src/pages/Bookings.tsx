import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Calendar as CalendarIcon, MoreVertical, List, LayoutGrid, Columns3,
  X, CreditCard, Check, Search, Filter, Clock, MapPin, User as UserIcon, IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import NewBookingModal from '@/components/NewBookingModal';
import BookingCalendar from '@/components/BookingCalendar';
import BookingStaffGrid from '@/components/BookingStaffGrid';
import CollectPaymentModal from '@/components/CollectPaymentModal';

type Mode = 'table' | 'calendar' | 'grid';
type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-200 text-gray-700',
};

const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export default function Bookings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'CUSTOMER';

  const [modalOpen, setModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('table');
  const [selected, setSelected] = useState<any | null>(null);
  const [payingFor, setPayingFor] = useState<any | null>(null);
  const [prefill, setPrefill] = useState<{ staffId?: string; startTime?: string; date?: string; branchId?: string } | null>(null);

  // Filters (table view only)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/bookings?limit=500')).data,
    enabled: mode === 'table',
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/bookings/${id}/status`, { status, cancelReason: reason }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-staff-grid'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] });
      setOpenMenu(null);
      setSelected(null);
    },
  });

  const all = data?.data || [];
  const filtered = useMemo(() => {
    return (all as any[]).filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          b.bookingNumber,
          b.customer?.profile?.firstName,
          b.customer?.profile?.lastName,
          b.customer?.email,
          b.service?.name,
          `${b.staff?.user?.profile?.firstName || ''} ${b.staff?.user?.profile?.lastName || ''}`,
          b.branch?.name,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, statusFilter, search]);

  // Summary tiles
  const summary = useMemo(() => {
    const s = { total: all.length, upcoming: 0, revenue: 0, unpaid: 0 };
    const nowTs = Date.now();
    (all as any[]).forEach((b) => {
      if (b.paymentStatus === 'PAID') s.revenue += Number(b.totalAmount);
      else if (b.status !== 'CANCELLED') s.unpaid += Number(b.totalAmount);
      const dt = new Date(b.bookingDate);
      const [h, m] = String(b.startTime).split(':').map(Number);
      dt.setHours(h, m, 0, 0);
      if (dt.getTime() >= nowTs && ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)) s.upcoming++;
    });
    return s;
  }, [all]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isCustomer ? 'My Bookings' : 'Bookings'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCustomer ? 'Your upcoming and past appointments' : 'Manage all appointments'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['table', 'calendar', 'grid'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors ${
                  mode === m ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m === 'table' && <><List className="w-3.5 h-3.5" /> Table</>}
                {m === 'calendar' && <><LayoutGrid className="w-3.5 h-3.5" /> Calendar</>}
                {m === 'grid' && <><Columns3 className="w-3.5 h-3.5" /> Staff Grid</>}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setPrefill(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Booking
          </button>
        </div>
      </div>

      {/* Summary tiles — table mode only, hidden for CUSTOMER */}
      {mode === 'table' && !isCustomer && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryTile label="Total bookings" value={summary.total} icon={<CalendarIcon className="w-4 h-4" />} tone="blue" />
          <SummaryTile label="Upcoming" value={summary.upcoming} icon={<Clock className="w-4 h-4" />} tone="yellow" />
          <SummaryTile label="Revenue collected" value={`₹${summary.revenue.toLocaleString()}`} icon={<IndianRupee className="w-4 h-4" />} tone="green" />
          <SummaryTile label="Awaiting payment" value={`₹${summary.unpaid.toLocaleString()}`} icon={<CreditCard className="w-4 h-4" />} tone="red" />
        </div>
      )}

      {mode === 'calendar' ? (
        <BookingCalendar onSelectBooking={setSelected} />
      ) : mode === 'grid' ? (
        <BookingStaffGrid
          onSelectBooking={setSelected}
          onCreateBooking={(p) => { setPrefill(p); setModalOpen(true); }}
        />
      ) : (
        <>
          {/* Filter bar (table view) */}
          <div className="card p-3 flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search by customer, service, staff, booking #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full">
              {(['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                    statusFilter === s ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
            {(search || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <div className="text-xs text-gray-500 ml-auto">
              {filtered.length} of {all.length}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Service / Booking</th>
                    <th className="text-left px-4 py-3 font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold">Staff / Branch</th>
                    <th className="text-left px-4 py-3 font-semibold">When</th>
                    <th className="text-right px-4 py-3 font-semibold">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-4 py-4">
                          <div className="animate-pulse flex items-center gap-3">
                            <div className="h-4 bg-gray-100 rounded flex-1" />
                            <div className="h-4 w-16 bg-gray-100 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        {all.length === 0 ? (
                          <>
                            <p className="text-gray-600 font-medium">No bookings yet</p>
                            <p className="text-xs text-gray-400 mt-1">Create your first booking to get started.</p>
                            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
                              <Plus className="w-4 h-4 mr-1" /> Create First Booking
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-600 font-medium">No results</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Nothing matches "<span className="font-mono">{search}</span>"
                              {statusFilter !== 'ALL' && <> with status <span className="font-semibold">{statusFilter}</span></>}.
                            </p>
                            <button
                              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                              className="btn-secondary text-xs mt-3 inline-flex items-center gap-1"
                            >
                              <Filter className="w-3 h-3" /> Clear filters
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((booking: any) => (
                      <tr
                        key={booking.id}
                        className={`hover:bg-primary-50/30 transition-colors cursor-pointer ${
                          booking.status === 'CANCELLED' ? 'opacity-60' : ''
                        }`}
                        onClick={() => setSelected(booking)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{booking.service?.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{booking.bookingNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span>
                              {booking.customer?.profile?.firstName
                                ? `${booking.customer.profile.firstName} ${booking.customer.profile.lastName || ''}`.trim()
                                : (booking.walkInName || 'Walk-in')}
                            </span>
                            {!booking.customerId && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">WALK-IN</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.customer?.email || booking.walkInPhone || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{booking.staff?.user?.profile?.firstName} {booking.staff?.user?.profile?.lastName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{booking.branch?.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{new Date(booking.bookingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-500 font-mono">{booking.startTime}–{booking.endTime}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          ₹{Number(booking.totalAmount).toLocaleString()}
                          {Number(booking.taxAmount) > 0 && (
                            <div className="text-[10px] text-gray-400">incl. tax</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${STATUS_PILL[booking.status]}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {booking.paymentStatus === 'PAID' ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium"
                              title={booking.paymentRef ? `Ref: ${booking.paymentRef}` : ''}
                            >
                              <Check className="w-3 h-3" /> {booking.paymentMethod || 'PAID'}
                            </span>
                          ) : booking.status === 'CANCELLED' ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : isCustomer ? (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                              UNPAID
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayingFor(booking); }}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 font-medium"
                            >
                              <CreditCard className="w-3 h-3" /> Collect
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                          {!isCustomer && NEXT_STATUS[booking.status]?.length > 0 && (
                            <>
                              <button
                                onClick={() => setOpenMenu(openMenu === booking.id ? null : booking.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                              {openMenu === booking.id && (
                                <div className="absolute right-4 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                  {NEXT_STATUS[booking.status].map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => {
                                        let reason;
                                        if (s === 'CANCELLED') {
                                          reason = prompt('Cancellation reason?') || 'Cancelled by admin';
                                        }
                                        statusMutation.mutate({ id: booking.id, status: s, reason });
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                    >
                                      Mark as <span className="font-medium">{s.replace('_', ' ')}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{selected.bookingNumber}</p>
                <h2 className="text-lg font-semibold mt-0.5 truncate">{selected.service?.name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[selected.status]}`}>
                    {selected.status.replace('_', ' ')}
                  </span>
                  {selected.paymentStatus === 'PAID' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      <Check className="w-3 h-3" /> PAID
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              {/* Hero: amount */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
                <p className="text-[11px] text-primary-700 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-primary-700 mt-1 tabular-nums">
                  ₹{Number(selected.totalAmount).toLocaleString()}
                </p>
                {Number(selected.taxAmount) > 0 && (
                  <p className="text-[11px] text-primary-600 mt-1">
                    incl. tax ₹{Number(selected.taxAmount).toLocaleString()}
                  </p>
                )}
              </div>

              <DetailRow icon={<CalendarIcon className="w-4 h-4" />} label="When">
                <div>
                  {new Date(selected.bookingDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                  {selected.startTime} – {selected.endTime}
                </div>
              </DetailRow>

              <DetailRow icon={<UserIcon className="w-4 h-4" />} label="Customer">
                {selected.customer?.profile?.firstName ? (
                  <>
                    <div>{selected.customer.profile.firstName} {selected.customer.profile.lastName || ''}</div>
                    <div className="text-xs text-gray-500">{selected.customer?.email}</div>
                    {selected.customer?.profile?.phone && (
                      <div className="text-xs text-gray-500">{selected.customer.profile.phone}</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span>{selected.walkInName || 'Walk-in customer'}</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">WALK-IN</span>
                    </div>
                    {selected.walkInPhone && (
                      <div className="text-xs text-gray-500">{selected.walkInPhone}</div>
                    )}
                  </>
                )}
              </DetailRow>

              <DetailRow icon={<UserIcon className="w-4 h-4" />} label="Staff">
                <div>{selected.staff?.user?.profile?.firstName} {selected.staff?.user?.profile?.lastName}</div>
                {selected.staff?.designation && (
                  <div className="text-xs text-gray-500">{selected.staff.designation}</div>
                )}
              </DetailRow>

              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Branch">
                {selected.branch?.name}
              </DetailRow>

              <DetailRow icon={<CreditCard className="w-4 h-4" />} label="Payment">
                {selected.paymentStatus === 'PAID' ? (
                  <div className="space-y-0.5">
                    <div className="font-medium text-green-700">Paid via {selected.paymentMethod || '—'}</div>
                    {selected.paymentRef && (
                      <div className="text-xs text-gray-500 font-mono">ref: {selected.paymentRef}</div>
                    )}
                    {selected.paidAt && (
                      <div className="text-xs text-gray-500">{new Date(selected.paidAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                    {selected.paymentStatus}
                  </span>
                )}
              </DetailRow>

              {selected.notes && (
                <DetailRow icon={<CalendarIcon className="w-4 h-4" />} label="Notes">
                  <p className="whitespace-pre-wrap">{selected.notes}</p>
                </DetailRow>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2">
              {!isCustomer && selected.paymentStatus !== 'PAID' && selected.status !== 'CANCELLED' && (
                <button onClick={() => setPayingFor(selected)} className="btn-primary text-xs">
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> Collect Payment
                </button>
              )}
              {!isCustomer && NEXT_STATUS[selected.status]?.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    let reason;
                    if (s === 'CANCELLED') {
                      reason = prompt('Cancellation reason?') || 'Cancelled by admin';
                    }
                    statusMutation.mutate({ id: selected.id, status: s, reason });
                  }}
                  className="btn-secondary text-xs"
                >
                  Mark as {s.replace('_', ' ')}
                </button>
              ))}
              {isCustomer && canCustomerCancel(selected) && (
                <button
                  onClick={() => {
                    const reason = prompt('Reason for cancelling? (optional)') || 'Cancelled by customer';
                    statusMutation.mutate({ id: selected.id, status: 'CANCELLED', reason });
                  }}
                  className="btn-danger text-xs"
                >
                  Cancel this booking
                </button>
              )}
              {isCustomer && !canCustomerCancel(selected) && selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
                <p className="text-xs text-gray-500 italic">
                  Bookings can only be cancelled at least 2 hours before start time.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <NewBookingModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefill(null); }}
        prefill={prefill || undefined}
      />
      <CollectPaymentModal
        open={!!payingFor}
        onClose={() => setPayingFor(null)}
        booking={payingFor}
      />
    </div>
  );
}

function canCustomerCancel(b: any) {
  if (!b || b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.status === 'NO_SHOW') return false;
  const [h, m] = String(b.startTime).split(':').map(Number);
  const start = new Date(b.bookingDate);
  start.setHours(h, m, 0, 0);
  return (start.getTime() - Date.now()) / (1000 * 60 * 60) >= 2;
}

function SummaryTile({ label, value, icon, tone }: { label: string; value: any; icon: React.ReactNode; tone: 'blue' | 'green' | 'yellow' | 'red' }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="card !p-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg font-bold tabular-nums truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="mt-0.5 text-gray-900">{children}</div>
      </div>
    </div>
  );
}
