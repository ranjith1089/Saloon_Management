import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  const notifications = data?.data?.notifications || [];
  const unread = data?.data?.unreadCount || 0;

  const typeColors: Record<string, string> = {
    BOOKING_CREATED: 'bg-blue-100 text-blue-700',
    BOOKING_CONFIRMED: 'bg-green-100 text-green-700',
    BOOKING_CANCELLED: 'bg-red-100 text-red-700',
    BOOKING_COMPLETED: 'bg-purple-100 text-purple-700',
    BOOKING_REMINDER: 'bg-yellow-100 text-yellow-700',
    PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-700',
    PROMOTION: 'bg-pink-100 text-pink-700',
    GENERAL: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllRead.mutate()} className="btn-secondary text-sm">
            <Check className="w-4 h-4 mr-1" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`card flex items-start gap-3 ${!n.isRead ? 'bg-primary-50/50 border-primary-100' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[n.type]}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif.mutate(n.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
