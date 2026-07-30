import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, MoreVertical, List, LayoutGrid, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import NewBookingModal from '@/components/NewBookingModal';
import BookingCalendar from '@/components/BookingCalendar';

type Mode = 'table' | 'calendar';

export default function Bookings() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('table');
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/bookings')).data,
    enabled: mode === 'table',
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      return api.patch(`/bookings/${id}/status`, { status, cancelReason: reason });
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setOpenMenu(null);
      setSelected(null);
    },
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-700',
  };

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1 ${
                mode === 'table' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1 ${
                mode === 'calendar' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Booking
          </button>
        </div>
      </div>

      {mode === 'calendar' ? (
        <BookingCalendar onSelectBooking={setSelected} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Booking #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Date/Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : data?.data?.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No bookings found</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">
                      <Plus className="w-4 h-4 mr-1" /> Create First Booking
                    </button>
                  </td></tr>
                ) : (
                  data?.data?.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{booking.bookingNumber}</td>
                      <td className="px-4 py-3">
                        {booking.customer?.profile?.firstName} {booking.customer?.profile?.lastName}
                      </td>
                      <td className="px-4 py-3">{booking.service?.name}</td>
                      <td className="px-4 py-3">
                        {booking.staff?.user?.profile?.firstName} {booking.staff?.user?.profile?.lastName}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(booking.bookingDate).toLocaleDateString()} {booking.startTime}
                      </td>
                      <td className="px-4 py-3 font-medium">₹{Number(booking.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 relative">
                        {nextStatuses[booking.status]?.length > 0 && (
                          <>
                            <button
                              onClick={() => setOpenMenu(openMenu === booking.id ? null : booking.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {openMenu === booking.id && (
                              <div className="absolute right-4 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                                {nextStatuses[booking.status].map((s) => (
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
                                    Mark as {s.replace('_', ' ')}
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
      )}

      {/* Booking details drawer (opens from calendar click) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-mono">{selected.bookingNumber}</p>
                <h2 className="text-lg font-semibold mt-0.5">{selected.service?.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <Row label="When">
                {new Date(selected.bookingDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                <br />
                <span className="font-mono">{selected.startTime} – {selected.endTime}</span>
              </Row>
              <Row label="Customer">
                {selected.customer?.profile?.firstName} {selected.customer?.profile?.lastName}
                <br />
                <span className="text-xs text-gray-500">{selected.customer?.email}</span>
              </Row>
              <Row label="Staff">
                {selected.staff?.user?.profile?.firstName} {selected.staff?.user?.profile?.lastName}
              </Row>
              <Row label="Branch">{selected.branch?.name}</Row>
              <Row label="Total">
                <span className="text-primary-600 font-semibold">
                  ₹{Number(selected.totalAmount).toLocaleString()}
                </span>
              </Row>
              {selected.notes && <Row label="Notes">{selected.notes}</Row>}
            </div>
            {nextStatuses[selected.status]?.length > 0 && (
              <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2">
                {nextStatuses[selected.status].map((s) => (
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
              </div>
            )}
          </div>
        </div>
      )}

      <NewBookingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-0.5 text-gray-900">{children}</div>
    </div>
  );
}
