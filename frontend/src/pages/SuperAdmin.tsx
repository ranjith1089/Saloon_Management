/**
 * Super-admin dashboard — Ship 5A of SaaS conversion.
 *
 * Aveon-side view of every tenant in the platform. Lists all orgs with
 * search + filter + basic actions (change plan, extend trial, suspend).
 * Guarded by <RoleGuard allow={['SUPERADMIN']}> in App.tsx so nobody
 * except Aveon staff can even hit the route.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Loader2, ShieldCheck, TrendingUp, Users, AlertTriangle,
  Building2, Crown, MoreHorizontal, X, ExternalLink,
} from 'lucide-react';
import api from '@/services/api';

const PLANS = ['TRIAL', 'STARTER', 'GROWTH', 'PRO'] as const;
const STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;

type OrgRow = {
  id: string; slug: string; name: string; plan: typeof PLANS[number];
  status: typeof STATUSES[number]; trialEndsAt: string | null; createdAt: string;
  isDefault: boolean;
  _count: { users: number; branches: number };
  owner: { email: string; profile?: { firstName: string; lastName: string; phone?: string | null } } | null;
};

type Summary = {
  totalOrgs: number;
  plans: Record<string, number>;
  trialActive: number;
  trialExpired: number;
  mrrThisMonth: number;
  invoicesThisMonth: number;
};

export default function SuperAdmin() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [drawer, setDrawer] = useState<string | null>(null);

  const summaryQ = useQuery<Summary>({
    queryKey: ['sa-summary'],
    queryFn: async () => (await api.get('/super-admin/summary')).data.data,
    staleTime: 60_000,
  });

  const orgsQ = useQuery<{ rows: OrgRow[]; total: number }>({
    queryKey: ['sa-orgs', search, planFilter, statusFilter],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (planFilter) params.plan = planFilter;
      if (statusFilter) params.status = statusFilter;
      return (await api.get('/super-admin/organizations', { params })).data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <div className="text-xs uppercase font-semibold tracking-widest text-purple-700">Super-admin</div>
          </div>
          <h1 className="text-2xl font-bold">Platform overview</h1>
          <p className="text-sm text-gray-500 mt-1">Every tenant on the platform. Aveon-staff only.</p>
        </div>
      </header>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryTile icon={Building2} label="Organizations" value={summaryQ.data?.totalOrgs ?? '—'} tone="blue" />
        <SummaryTile icon={Users}     label="On trial (active)"  value={summaryQ.data?.trialActive ?? '—'}  tone="amber" />
        <SummaryTile icon={AlertTriangle} label="Trial expired" value={summaryQ.data?.trialExpired ?? '—'} tone="red" />
        <SummaryTile icon={Crown}     label="Paying tenants"     value={
          (summaryQ.data ? (summaryQ.data.plans.STARTER || 0) + (summaryQ.data.plans.GROWTH || 0) + (summaryQ.data.plans.PRO || 0) : '—')
        } tone="green" />
        <SummaryTile icon={TrendingUp} label="MRR this month"
          value={summaryQ.data ? `₹${Number(summaryQ.data.mrrThisMonth).toLocaleString('en-IN')}` : '—'}
          tone="purple"
          sub={summaryQ.data ? `${summaryQ.data.invoicesThisMonth} invoices` : undefined}
        />
      </div>

      {/* Filters */}
      <div className="card !p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug…"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All plans</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto text-xs text-gray-500">
          {orgsQ.data ? `${orgsQ.data.rows.length} of ${orgsQ.data.total}` : ''}
        </div>
      </div>

      {/* Orgs table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th className="text-right">Users</Th>
                <Th className="text-right">Branches</Th>
                <Th>Trial ends</Th>
                <Th>Owner</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {orgsQ.isLoading && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500"><Loader2 className="w-5 h-5 inline animate-spin" /> Loading…</td></tr>
              )}
              {orgsQ.data?.rows.map((org) => (
                <tr key={org.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold flex items-center gap-2">
                      {org.name}
                      {org.isDefault && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Default</span>}
                    </div>
                    <div className="text-[11px] font-mono text-gray-500">{org.slug}</div>
                  </td>
                  <td className="py-3 px-4"><PlanChip plan={org.plan} /></td>
                  <td className="py-3 px-4"><StatusChip status={org.status} /></td>
                  <td className="py-3 px-4 text-right tabular-nums">{org._count.users}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{org._count.branches}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {org.trialEndsAt
                      ? new Date(org.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600 truncate max-w-[180px]">
                    {org.owner?.email || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setDrawer(org.id)} className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1">
                      Manage <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {orgsQ.data?.rows.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No organizations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && <OrgDrawer orgId={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function Th({ children, className = '' }: any) {
  return <th className={`py-2.5 px-4 text-xs uppercase font-semibold tracking-widest text-gray-500 ${className}`}>{children}</th>;
}

function PlanChip({ plan }: { plan: string }) {
  const tone =
    plan === 'PRO'     ? 'bg-purple-100 text-purple-700' :
    plan === 'GROWTH'  ? 'bg-primary-100 text-primary-700' :
    plan === 'STARTER' ? 'bg-blue-100 text-blue-700' :
                         'bg-amber-100 text-amber-700';
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tone}`}>{plan}</span>;
}
function StatusChip({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE'    ? 'bg-green-100 text-green-700' :
    status === 'SUSPENDED' ? 'bg-red-100   text-red-700'   :
                             'bg-gray-100  text-gray-700';
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tone}`}>{status}</span>;
}
function SummaryTile({ icon: Icon, label, value, tone, sub }: any) {
  const bg = {
    blue:   'bg-blue-100 text-blue-700',
    amber:  'bg-amber-100 text-amber-700',
    red:    'bg-red-100 text-red-700',
    green:  'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  }[tone as string] || 'bg-gray-100 text-gray-700';
  return (
    <div className="card !p-3">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">{label}</div>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <div className="font-bold text-xl tabular-nums mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org drawer — right-side panel with actions
// ---------------------------------------------------------------------------
function OrgDrawer({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const detailQ = useQuery({
    queryKey: ['sa-org', orgId],
    queryFn: async () => (await api.get(`/super-admin/organizations/${orgId}`)).data.data,
  });
  const org = detailQ.data;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['sa-summary'] });
    qc.invalidateQueries({ queryKey: ['sa-orgs'] });
    qc.invalidateQueries({ queryKey: ['sa-org', orgId] });
  };

  const changePlan = useMutation({
    mutationFn: async (plan: string) => (await api.patch(`/super-admin/organizations/${orgId}/plan`, { plan })).data,
    onSuccess: () => { toast.success('Plan updated'); invalidateAll(); },
  });
  const extendTrial = useMutation({
    mutationFn: async (days: number) => (await api.post(`/super-admin/organizations/${orgId}/extend-trial`, { days })).data,
    onSuccess: () => { toast.success('Trial extended'); invalidateAll(); },
  });
  const setStatus = useMutation({
    mutationFn: async (status: string) => (await api.patch(`/super-admin/organizations/${orgId}/status`, { status })).data,
    onSuccess: () => { toast.success('Status updated'); invalidateAll(); },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Organization</div>
            <div className="font-bold text-lg mt-1">{org?.name || '…'}</div>
            <div className="text-[11px] font-mono text-gray-500">{org?.slug}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {detailQ.isLoading || !org ? (
          <div className="p-5 text-gray-500 text-sm"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Key facts */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Fact label="Plan">    <PlanChip plan={org.plan} /></Fact>
              <Fact label="Status">  <StatusChip status={org.status} /></Fact>
              <Fact label="Branches">{org._count.branches}</Fact>
              <Fact label="Users">   {org._count.users}</Fact>
              <Fact label="Country"> {org.country || '—'}</Fact>
              <Fact label="Currency">{org.currency}</Fact>
              <Fact label="Trial ends">{org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('en-IN') : '—'}</Fact>
              <Fact label="Created"> {new Date(org.createdAt).toLocaleDateString('en-IN')}</Fact>
            </div>

            {/* Owner */}
            {org.owner && (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-xs uppercase font-semibold tracking-widest text-gray-500 mb-1">Owner</div>
                <div className="font-semibold">
                  {org.owner.profile?.firstName} {org.owner.profile?.lastName}
                </div>
                <div className="text-xs text-gray-600">{org.owner.email}</div>
                {org.owner.profile?.phone && (
                  <a href={`https://wa.me/${org.owner.profile.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                     className="text-xs text-green-700 hover:underline inline-flex items-center gap-1 mt-1">
                    WhatsApp <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Usage */}
            <div className="border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
              <div className="text-xs uppercase font-semibold tracking-widest text-gray-500 mb-2">Usage this month</div>
              <div>WhatsApp: <span className="tabular-nums font-semibold">{org.usage.waMsgsThisMonth}</span> / {org.usage.waMsgsCap ?? '∞'}</div>
              <div>Branches: <span className="tabular-nums font-semibold">{org._count.branches}</span> / {org.usage.branchesCap ?? '∞'}</div>
              <div>Staff:    <span className="tabular-nums font-semibold">{org._count.users}</span>   / {org.usage.staffCap ?? '∞'}</div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Change plan</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PLANS.map((p) => (
                  <button
                    key={p}
                    onClick={() => changePlan.mutate(p)}
                    disabled={changePlan.isPending || org.plan === p}
                    className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${
                      org.plan === p
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                        : 'border-gray-300 hover:border-primary-600 hover:text-primary-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Extend trial</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => extendTrial.mutate(days)}
                    disabled={extendTrial.isPending}
                    className="text-xs font-semibold py-2 rounded-lg border border-gray-300 hover:border-primary-600 hover:text-primary-600"
                  >
                    +{days} days
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase font-semibold tracking-widest text-gray-500">Status</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['ACTIVE', 'SUSPENDED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (s === 'SUSPENDED' && !confirm(`Suspend ${org.name}? Their users will no longer be able to log in.`)) return;
                      setStatus.mutate(s);
                    }}
                    disabled={setStatus.isPending || org.status === s || org.isDefault}
                    className={`text-xs font-semibold py-2 rounded-lg border ${
                      s === 'SUSPENDED'
                        ? 'border-red-300 text-red-700 hover:bg-red-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {org.isDefault && <p className="text-[11px] text-gray-500">The Default Organization can't be suspended.</p>}
            </div>

            {/* Invoices */}
            {org.invoices.length > 0 && (
              <div>
                <div className="text-xs uppercase font-semibold tracking-widest text-gray-500 mb-2">Recent invoices</div>
                <ul className="text-xs space-y-1">
                  {org.invoices.slice(0, 5).map((inv: any) => (
                    <li key={inv.id} className="flex items-center justify-between border-b border-gray-100 pb-1 last:border-0">
                      <span>{new Date(inv.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="tabular-nums font-semibold">₹{Number(inv.amount).toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        inv.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                  'bg-amber-100 text-amber-700'
                      }`}>{inv.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold tracking-widest text-gray-500">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
