import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Crown, CalendarDays, IndianRupee, Clock, Send, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

function planDuration(days: number) {
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`;
  if (days % 30 === 0) return `${days / 30} month${days === 30 ? '' : 's'}`;
  return `${days} days`;
}

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

  // Available plans the customer can browse (read-only for CUSTOMER).
  const { data: plans } = useQuery({
    queryKey: ['membership-plans-browse'],
    queryFn: async () => (await api.get('/membership-plans')).data.data as any[],
  });
  const activePlans = (plans || []).filter((p: any) => p.isActive);

  // "Request this plan" — customers can't self-enrol (payment is at the
  // counter), so a request is logged as an inquiry for staff to follow up.
  const requestPlan = useMutation({
    mutationFn: async (plan: any) => {
      const fullName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')
        || user?.email?.split('@')[0]
        || 'Customer';
      return api.post('/inquiries', {
        name: fullName,
        email: user?.email,
        phone: user?.profile?.phone || null,
        subject: `Membership request: ${plan.name}`,
        message: `${fullName} would like to enrol in the "${plan.name}" plan (₹${Number(plan.price).toLocaleString()} / ${planDuration(plan.durationDays)}). Please follow up.`,
        source: 'membership-request',
      });
    },
    onSuccess: () => toast.success('Request sent — the salon will get in touch.'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not send request'),
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
          <p className="text-xs">Browse the plans below and request one — the salon will help you enrol.</p>
        </div>
      )}

      {/* Available plans — browse & request */}
      {activePlans.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">{active ? 'Other plans' : 'Available plans'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activePlans.map((p: any) => {
              const isCurrent = active?.plan?.id === p.id;
              return (
                <div key={p.id} className="card border-t-4" style={{ borderTopColor: p.color }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                    </div>
                    <Crown className="w-5 h-5 flex-shrink-0" style={{ color: p.color }} />
                  </div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-2xl font-bold">₹{Number(p.price).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">/ {planDuration(p.durationDays)}</span>
                  </div>
                  <button
                    disabled={isCurrent || requestPlan.isPending}
                    onClick={() => requestPlan.mutate(p)}
                    className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {requestPlan.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      'Current plan'
                    ) : (
                      <><Send className="w-4 h-4" /> Request this plan</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Requesting a plan notifies the salon — enrolment and payment are completed at the counter.
          </p>
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
