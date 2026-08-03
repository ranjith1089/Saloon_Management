import { useQuery } from '@tanstack/react-query';
import { Crown, CalendarDays, IndianRupee, Clock } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function MyMembership() {
  const { user } = useAuthStore();

  // Active membership (fast lookup)
  const { data: active } = useQuery({
    queryKey: ['my-active-membership'],
    queryFn: async () => (await api.get(`/memberships/active/${user?.id}`)).data.data,
    enabled: !!user?.id,
  });

  // Full history (server filters to own memberships for CUSTOMER)
  const { data: history } = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => (await api.get('/memberships?limit=100')).data.data as any[],
  });

  const now = Date.now();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6" /> My Membership
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your active plan and history</p>
      </div>

      {active ? (
        <div
          className="card border-2"
          style={{ borderColor: active.plan?.color }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${active.plan?.color}20`, color: active.plan?.color }}
            >
              <Crown className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{active.plan?.name}</h2>
              <p className="text-sm text-gray-600 mt-0.5">{active.plan?.description || 'Enjoy member pricing on services and products.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Valid until</div>
                    <div className="font-medium">
                      {new Date(active.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Days left</div>
                    <div className="font-medium">
                      {Math.max(0, Math.ceil((new Date(active.endDate).getTime() - now) / (24 * 3600 * 1000)))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <IndianRupee className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Paid</div>
                    <div className="font-medium">₹{Number(active.paidAmount).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <Crown className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="mb-1 font-medium">No active membership</p>
          <p className="text-xs">Ask at the counter to enrol in a membership plan and unlock member pricing.</p>
        </div>
      )}

      {(history || []).length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">Membership history</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">Plan</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Start</th>
                  <th className="px-4 py-2 font-medium text-gray-700">End</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-right">Paid</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history!.map((m) => {
                  const expired = new Date(m.endDate).getTime() < now;
                  const effective = m.status === 'CANCELLED' ? 'CANCELLED' : expired ? 'EXPIRED' : m.status;
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-2 font-medium">{m.plan?.name}</td>
                      <td className="px-4 py-2 text-xs">{new Date(m.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-xs">{new Date(m.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">₹{Number(m.paidAmount).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          effective === 'ACTIVE' ? 'bg-green-100 text-green-700'
                          : effective === 'EXPIRED' ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                        }`}>{effective}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
