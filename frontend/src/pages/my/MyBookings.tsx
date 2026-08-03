import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, User, Plus, Ban, Check } from 'lucide-react';
import api from '@/services/api';
import NewBookingModal from '@/components/NewBookingModal';

type Tab = 'upcoming' | 'past';

function combineDateTime(bookingDate: string, hhmm: string) {
  const d = new Date(bookingDate);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

function canCancel(b: any) {
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status)) return false;
  return (combineDateTime(b.bookingDate, b.startTime).getTime() - Date.now()) / (1000 * 60 * 60) >= 2;
}

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings?limit=200')).data.data as any[],
  });

  const cancel = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/bookings/${id}/status`, { status: 'CANCELLED', cancelReason: reason }),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] });
    },
  });

  const bookings = data || [];
  const now = Date.now();
  const upcoming = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) &&
    combineDateTime(b.bookingDate, b.startTime).getTime() >= now - 3600_000
  ).sort((a, b) => combineDateTime(a.bookingDate, a.startTime).getTime() - combineDateTime(b.bookingDate, b.startTime).getTime());
  const past = bookings
    .filter((b) => !upcoming.includes(b))
    .sort((a, b) => combineDateTime(b.bookingDate, b.startTime).getTime() - combineDateTime(a.bookingDate, a.startTime).getTime());

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Upcoming and past appointments</p>
        </div>
        <button className="btn-primary" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Book Appointment
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize ${
              tab === t ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
            }`}
          >
            {t} <span className="text-xs opacity-70 ml-1">
              ({t === 'upcoming' ? upcoming.length : past.length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : list.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          {tab === 'upcoming' ? (
            <>
              <p className="mb-3">No upcoming appointments.</p>
              <button className="btn-primary" onClick={() => setNewOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Book your first appointment
              </button>
            </>
          ) : (
            <p>No past bookings yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => {
            const start = combineDateTime(b.bookingDate, b.startTime);
            const statusColor = {
              PENDING: 'bg-yellow-100 text-yellow-800',
              CONFIRMED: 'bg-blue-100 text-blue-700',
              IN_PROGRESS: 'bg-purple-100 text-purple-700',
              COMPLETED: 'bg-green-100 text-green-700',
              CANCELLED: 'bg-red-100 text-red-700',
              NO_SHOW: 'bg-gray-200 text-gray-700',
            }[b.status as string] || 'bg-gray-100 text-gray-700';

            return (
              <div key={b.id} className="card">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="w-16 text-center flex-shrink-0">
                    <div className="text-xs text-gray-500 uppercase">
                      {start.toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-primary-600">{start.getDate()}</div>
                    <div className="text-[10px] text-gray-500">
                      {start.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{b.service?.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                      {b.paymentStatus === 'PAID' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          <Check className="w-3 h-3" /> PAID
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.startTime} – {b.endTime}</div>
                      <div className="flex items-center gap-1"><User className="w-3 h-3" /> {b.staff?.user?.profile?.firstName} {b.staff?.user?.profile?.lastName}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.branch?.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary-600">₹{Number(b.totalAmount).toLocaleString()}</div>
                    {canCancel(b) && (
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for cancelling? (optional)') || 'Cancelled by customer';
                          cancel.mutate({ id: b.id, reason });
                        }}
                        className="mt-2 text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewBookingModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
