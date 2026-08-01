import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Crown, Users, CalendarClock, Edit2, Trash2, Ban, IndianRupee,
} from 'lucide-react';
import api from '@/services/api';
import NewMembershipModal from '@/components/NewMembershipModal';
import NewPlanModal from '@/components/NewPlanModal';

type Tab = 'active' | 'plans';

export default function Memberships() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('active');
  const [memOpen, setMemOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-sm text-gray-500 mt-1">Plans and customer subscriptions</p>
        </div>
        {tab === 'active' ? (
          <button className="btn-primary" onClick={() => setMemOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Membership
          </button>
        ) : (
          <button className="btn-primary" onClick={() => { setEditPlan(null); setPlanOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Plan
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['active', 'plans'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'active' ? <Users className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
            {t === 'active' ? 'Memberships' : 'Plans'}
          </button>
        ))}
      </div>

      {tab === 'plans' ? <PlansTab onEdit={(p) => { setEditPlan(p); setPlanOpen(true); }} /> : <MembershipsTab />}

      <NewMembershipModal open={memOpen} onClose={() => setMemOpen(false)} />
      <NewPlanModal
        open={planOpen}
        onClose={() => { setPlanOpen(false); setEditPlan(null); queryClient.invalidateQueries({ queryKey: ['membership-plans'] }); }}
        plan={editPlan}
      />
    </div>
  );
}

// ============ PLANS TAB ============
function PlansTab({ onEdit }: { onEdit: (p: any) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => (await api.get('/membership-plans')).data.data,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/membership-plans/${id}`),
    onSuccess: () => {
      toast.success('Plan deactivated');
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
    },
  });

  const plans = data || [];

  if (isLoading) return <div className="card text-center py-8 text-gray-500">Loading…</div>;
  if (plans.length === 0)
    return (
      <div className="card text-center py-12 text-gray-500">
        <Crown className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p>No plans yet.</p>
        <p className="text-xs mt-1">Add a plan (e.g. "Gold Annual") to start enrolling customers.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((p: any) => (
        <div key={p.id} className={`card ${!p.isActive ? 'opacity-50' : ''}`}>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${p.color}20`, color: p.color }}
            >
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{p.name}</h3>
              {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Price</span>
              <span className="text-lg font-bold text-primary-600">₹{Number(p.price).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Duration</span>
              <span className="text-sm">{p.durationDays} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Active members</span>
              <span className="text-sm font-medium">{p._count?.memberships ?? 0}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1">
            <button onClick={() => onEdit(p)} className="btn-secondary flex-1 text-xs !py-1.5 inline-flex items-center justify-center gap-1">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            {p.isActive && (
              <button
                onClick={() => {
                  if (confirm(`Deactivate "${p.name}"? Existing members keep their subscription until it expires.`)) {
                    deleteMut.mutate(p.id);
                  }
                }}
                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                title="Deactivate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ MEMBERSHIPS TAB ============
function MembershipsTab() {
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['memberships', activeOnly],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (activeOnly) params.active = 'true';
      return (await api.get('/memberships', { params })).data;
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => api.post(`/memberships/${id}/cancel`),
    onSuccess: () => {
      toast.success('Membership cancelled');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });

  const memberships = data?.data || [];
  const totalRevenue = data?.meta?.totalRevenue || 0;

  const now = new Date();
  const summary = useMemo(() => {
    const active = memberships.filter((m: any) => m.status === 'ACTIVE' && new Date(m.endDate) > now).length;
    return { active, revenue: totalRevenue };
  }, [memberships, totalRevenue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Active memberships" value={summary.active} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Membership revenue" value={`₹${Number(summary.revenue).toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} />
      </div>

      <div className="card p-2 flex items-center gap-3">
        <button
          onClick={() => setActiveOnly((v) => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
            activeOnly ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          {activeOnly ? '● Active only' : '○ Show all'}
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Start</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">End</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : memberships.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No memberships yet.</p>
                </td></tr>
              ) : (
                memberships.map((m: any) => {
                  const expired = new Date(m.endDate) < now;
                  const effectiveStatus = m.status === 'CANCELLED' ? 'CANCELLED' : expired ? 'EXPIRED' : m.status;
                  const daysLeft = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (24 * 3600 * 1000));
                  return (
                    <tr key={m.id} className={`hover:bg-gray-50 ${effectiveStatus !== 'ACTIVE' ? 'opacity-70' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {m.customer?.profile?.firstName} {m.customer?.profile?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{m.customer?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${m.plan?.color}20`, color: m.plan?.color }}
                        >
                          <Crown className="w-3 h-3" /> {m.plan?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(m.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(m.endDate).toLocaleDateString()}
                        {effectiveStatus === 'ACTIVE' && daysLeft <= 30 && (
                          <span className="block text-[10px] text-amber-700">{daysLeft}d left</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(m.paidAmount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          effectiveStatus === 'ACTIVE' ? 'bg-green-100 text-green-700'
                          : effectiveStatus === 'EXPIRED' ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {effectiveStatus === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel membership for ${m.customer?.profile?.firstName}? They will no longer receive member pricing.`)) {
                                cancelMut.mutate(m.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 rounded text-red-600"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
