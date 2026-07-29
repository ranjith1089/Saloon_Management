import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import NewBookingModal from '@/components/NewBookingModal';

export default function Bookings() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/bookings')).data,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      return api.patch(`/bookings/${id}/status`, { status, cancelReason: reason });
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setOpenMenu(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all appointments</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Booking
        </button>
      </div>

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

      <NewBookingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
