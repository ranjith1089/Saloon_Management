import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Wallet, CheckCircle2, XCircle, Loader2, Eye } from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/Modal';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function Payouts() {
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => (await api.get('/finance/payouts')).data,
  });

  // Backend wraps the list as { payouts, total, page, limit } inside data.
  const payouts = data?.data?.payouts || [];
  const summary = useMemo(() => {
    const totals = { total: 0, paid: 0, pending: 0 };
    payouts.forEach((p: any) => {
      totals.total += Number(p.amount);
      if (p.status === 'PAID') totals.paid += Number(p.amount);
      else if (p.status !== 'FAILED') totals.pending += Number(p.amount);
    });
    return totals;
  }, [payouts]);

  const markPaid = useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference?: string }) =>
      api.patch(`/finance/payouts/${id}/pay`, reference ? { reference } : {}),
    onSuccess: () => {
      toast.success('Payout marked as paid');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => api.patch(`/finance/payouts/${id}/cancel`),
    onSuccess: () => {
      toast.success('Payout cancelled — earnings returned to pending');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Batch staff commissions into payouts</p>
        </div>
        <button className="btn-primary" onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Payout
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Payout Volume" value={summary.total} tone="blue" />
        <StatCard label="Paid Out" value={summary.paid} tone="green" />
        <StatCard label="In-Flight" value={summary.pending} tone="yellow" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Period</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700"># Earnings</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No payouts yet</p>
                  <p className="text-xs mt-1">Create a payout to batch pending commissions.</p>
                </td></tr>
              ) : (
                payouts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {p.staff?.user?.profile?.firstName} {p.staff?.user?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{p.staff?.employeeCode}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(p.periodStart).toLocaleDateString()} → {new Date(p.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary-600">
                      ₹{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">{p._count?.earnings ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailId(p.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {p.status !== 'PAID' && p.status !== 'FAILED' && (
                          <>
                            <button
                              onClick={() => {
                                const ref = prompt('Payment reference (optional)') || undefined;
                                markPaid.mutate({ id: p.id, reference: ref });
                              }}
                              className="p-1.5 hover:bg-green-50 rounded text-green-600"
                              title="Mark as paid"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Cancel this payout? Earnings will be returned to pending.')) {
                                  cancel.mutate(p.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600"
                              title="Cancel payout"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewPayoutModal open={newOpen} onClose={() => setNewOpen(false)} />
      <PayoutDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'yellow' }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">₹{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 ${tones[tone]} rounded-xl flex items-center justify-center`}>
          <Wallet className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ============ NEW PAYOUT MODAL ============
function NewPayoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { methods: paymentMethods, configured: methodsConfigured } = usePaymentMethods();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      staffId: '',
      periodStart: firstOfMonth(),
      periodEnd: today(),
      paymentMethod: '',
      reference: '',
      notes: '',
    },
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-select'],
    queryFn: async () => (await api.get('/staff?limit=200')).data.data,
    enabled: open,
  });

  const staffId = watch('staffId');
  const periodStart = watch('periodStart');
  const periodEnd = watch('periodEnd');

  // Detect whether the picked range covers a single calendar month — if so,
  // pull the target-aware payable amount from the commissions endpoint.
  const monthAlignment = (() => {
    if (!periodStart || !periodEnd) return null;
    const s = new Date(periodStart);
    const e = new Date(periodEnd);
    if (s.getFullYear() !== e.getFullYear() || s.getMonth() !== e.getMonth()) return null;
    return { year: s.getFullYear(), month: s.getMonth() + 1 };
  })();

  const { data: monthlySummary } = useQuery({
    queryKey: ['staff-commission', staffId, monthAlignment?.year, monthAlignment?.month],
    queryFn: async () =>
      (await api.get(`/finance/commissions/staff/${staffId}`, {
        params: { year: monthAlignment!.year, month: monthAlignment!.month },
      })).data.data,
    enabled: open && !!staffId && !!monthAlignment,
  });

  // Fallback: preview flat-sum of pending earnings for the period.
  const { data: earningsPreview } = useQuery({
    queryKey: ['earnings-preview', staffId, periodStart, periodEnd],
    queryFn: async () =>
      (await api.get('/finance/earnings', {
        params: { staffId, payoutStatus: 'PENDING', startDate: periodStart, endDate: periodEnd, limit: 500 },
      })).data.data,
    enabled: open && !!staffId && !!periodStart && !!periodEnd,
  });

  const useTargetAware = monthlySummary && monthlySummary.monthlyTarget > 0;
  const previewTotal = useTargetAware
    ? Number(monthlySummary.payableCommission || 0)
    : Number(earningsPreview?.summary?.totalCommission || 0);
  const previewCount = useTargetAware
    ? monthlySummary.targetMet
      ? 1 // target met — we'll create one payout for the excess
      : 0
    : earningsPreview?.earnings?.length || 0;

  const create = useMutation({
    mutationFn: async (data: any) => api.post('/finance/payouts', data),
    onSuccess: () => {
      toast.success('Payout created');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Payout"
      description="Batch pending earnings into a single payout"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => create.mutate(d))}
            disabled={create.isPending || previewCount === 0}
            className="btn-primary"
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Payout'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label">Staff *</label>
          <select className="input" {...register('staffId', { required: true })}>
            <option value="">-- Select staff --</option>
            {staffList?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.user?.profile?.firstName} {s.user?.profile?.lastName} — {s.employeeCode}
              </option>
            ))}
          </select>
          {errors.staffId && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Period Start *</label>
            <input type="date" className="input" {...register('periodStart', { required: true })} />
          </div>
          <div>
            <label className="label">Period End *</label>
            <input type="date" className="input" {...register('periodEnd', { required: true })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Payment Method</label>
            <select className="input" {...register('paymentMethod')}>
              <option value="">-- Select method --</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {!methodsConfigured && (
              <p className="text-[11px] text-gray-500 mt-1">
                Configure real methods in Settings → Payment Methods.
              </p>
            )}
          </div>
          <div>
            <label className="label">Reference</label>
            <input className="input" {...register('reference')} placeholder="Optional txn ID" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} {...register('notes')} />
        </div>

        {staffId && (
          <div
            className={`rounded-lg p-4 ${
              previewTotal <= 0 ? 'bg-amber-50 border border-amber-200' : 'bg-primary-50 border border-primary-200'
            }`}
          >
            {useTargetAware ? (
              // Target-aware preview
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-gray-900">Target-aware calculation (single month)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between"><span>Achieved:</span><span className="font-medium">₹{Number(monthlySummary.achieved).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Target:</span><span className="font-medium">₹{Number(monthlySummary.monthlyTarget).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Excess:</span><span className="font-medium">₹{Number(monthlySummary.excess).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Rate:</span><span className="font-medium">{monthlySummary.commissionRate}%</span></div>
                </div>
                {monthlySummary.targetMet ? (
                  <p className="pt-1 border-t border-primary-200 text-primary-900">
                    Payable: <span className="font-semibold">₹{previewTotal.toLocaleString()}</span>
                  </p>
                ) : (
                  <p className="pt-1 border-t border-amber-300 text-amber-800">
                    Below target — no commission payable this month.
                  </p>
                )}
              </div>
            ) : previewCount === 0 ? (
              <p className="text-sm text-amber-800">No pending earnings in the selected period.</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-900">
                  Flat calculation — {previewCount} pending earning{previewCount === 1 ? '' : 's'} will be batched.
                </p>
                <p className="text-sm text-primary-700">
                  Total commission: <span className="font-semibold">₹{previewTotal.toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

// ============ DETAIL MODAL ============
function PayoutDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['payout-detail', id],
    queryFn: async () => (await api.get(`/finance/payouts/${id}`)).data.data,
    enabled: !!id,
  });

  return (
    <Modal open={!!id} onClose={onClose} title="Payout Details" size="lg">
      {isLoading || !data ? (
        <div className="text-center py-8 text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Staff">
              {data.staff?.user?.profile?.firstName} {data.staff?.user?.profile?.lastName}
            </Field>
            <Field label="Employee Code">{data.staff?.employeeCode}</Field>
            <Field label="Period">
              {new Date(data.periodStart).toLocaleDateString()} → {new Date(data.periodEnd).toLocaleDateString()}
            </Field>
            <Field label="Status">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[data.status]}`}>
                {data.status}
              </span>
            </Field>
            <Field label="Payment Method">{data.paymentMethod || '—'}</Field>
            <Field label="Reference">{data.reference || '—'}</Field>
            <Field label="Total Amount">
              <span className="text-primary-600 font-semibold">₹{Number(data.amount).toLocaleString()}</span>
            </Field>
            <Field label="Paid At">{data.paidAt ? new Date(data.paidAt).toLocaleString() : '—'}</Field>
          </div>

          {data.notes && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
              {data.notes}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">
              Included Earnings ({data.earnings?.length || 0})
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Service</th>
                    <th className="text-right px-3 py-2 font-medium">Base</th>
                    <th className="text-right px-3 py-2 font-medium">Rate</th>
                    <th className="text-right px-3 py-2 font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.earnings?.map((e: any) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2">{e.booking?.service?.name}</td>
                      <td className="px-3 py-2 text-right">₹{Number(e.baseAmount).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{e.commissionRate}%</td>
                      <td className="px-3 py-2 text-right font-medium text-primary-600">
                        ₹{Number(e.commissionAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-0.5 text-gray-900">{children}</div>
    </div>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}
function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}
