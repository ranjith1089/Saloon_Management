import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewMembershipModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerId: '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      paymentMethod: 'Cash',
      notes: '',
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['membership-plans', 'active'],
    queryFn: async () => (await api.get('/membership-plans', { params: { isActive: true } })).data.data,
    enabled: open,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => (await api.get('/customers?limit=500')).data.data,
    enabled: open,
  });

  const planId = watch('planId');
  const selectedPlan = useMemo(() => plans?.find((p: any) => p.id === planId), [plans, planId]);
  const startDate = watch('startDate');

  // Auto-fill paidAmount from plan.price when the plan changes.
  useEffect(() => {
    if (selectedPlan) setValue('paidAmount', Number(selectedPlan.price));
  }, [selectedPlan, setValue]);

  const endDatePreview = useMemo(() => {
    if (!selectedPlan || !startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + selectedPlan.durationDays);
    return d.toLocaleDateString();
  }, [selectedPlan, startDate]);

  const create = useMutation({
    mutationFn: async (data: any) => api.post('/memberships', {
      ...data,
      paidAmount: Number(data.paidAmount),
    }),
    onSuccess: () => {
      toast.success('Membership created');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Membership"
      description="Enroll a customer into a plan"
      size="md"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => create.mutate(d))}
            disabled={create.isPending}
            className="btn-primary"
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Membership'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label">Customer *</label>
          <select className="input" {...register('customerId', { required: true })}>
            <option value="">-- Select customer --</option>
            {customers?.map((c: any) => (
              <option key={c.userId} value={c.userId}>
                {c.user?.profile?.firstName} {c.user?.profile?.lastName} — {c.user?.email}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Plan *</label>
          <select className="input" {...register('planId', { required: true })}>
            <option value="">-- Select plan --</option>
            {plans?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{Number(p.price).toLocaleString()} · {p.durationDays} days
              </option>
            ))}
          </select>
          {errors.planId && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" {...register('startDate', { required: true })} />
          </div>
          <div>
            <label className="label">End Date (auto)</label>
            <div className="input bg-gray-50 text-gray-600">{endDatePreview || '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Paid Amount (₹) *</label>
            <input type="number" min="0" step="0.01" className="input" {...register('paidAmount', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" {...register('paymentMethod')}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank Transfer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} {...register('notes')} />
        </div>
      </form>
    </Modal>
  );
}
