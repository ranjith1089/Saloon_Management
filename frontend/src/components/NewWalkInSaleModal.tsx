import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Receipt, User, UserPlus } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDefaultTaxRate } from '@/hooks/useDefaultTaxRate';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'WALKIN' | 'REGISTERED';

export default function NewWalkInSaleModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { methods: paymentMethods } = usePaymentMethods();
  const { rate: gstRate, name: taxName } = useDefaultTaxRate();

  const [mode, setMode] = useState<Mode>('WALKIN');
  const [applyGst, setApplyGst] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      branchId: '',
      serviceId: '',
      staffId: '',
      customerId: '',
      walkInName: '',
      walkInPhone: '',
      amount: 0,
      paymentMethod: 'Cash',
      reference: '',
      notes: '',
    },
  });

  const branchId = watch('branchId');
  const serviceId = watch('serviceId');
  const customerId = watch('customerId');
  const amount = Number(watch('amount') || 0);

  useEffect(() => {
    if (open) {
      reset();
      setMode('WALKIN');
      setApplyGst(false);
    }
  }, [open, reset]);

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
    enabled: open,
  });

  const { data: services } = useQuery({
    queryKey: ['services-select', branchId],
    queryFn: async () => {
      const params = branchId ? `?branchId=${branchId}&limit=200` : '?limit=200';
      return (await api.get(`/services${params}`)).data.data;
    },
    enabled: open && !!branchId,
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-select-walkin', branchId],
    queryFn: async () => (await api.get(`/staff?branchId=${branchId}&limit=100`)).data.data,
    enabled: open && !!branchId,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => (await api.get('/customers?limit=500')).data.data,
    enabled: open && mode === 'REGISTERED',
  });

  const { data: activeMembership } = useQuery({
    queryKey: ['active-membership', customerId],
    queryFn: async () => (await api.get(`/memberships/active/${customerId}`)).data.data,
    enabled: mode === 'REGISTERED' && !!customerId,
  });

  // Auto-fill amount from the selected service's price (or memberPrice).
  const selectedService = useMemo(
    () => (services || []).find((s: any) => s.id === serviceId),
    [services, serviceId]
  );
  useEffect(() => {
    if (!selectedService) return;
    const useMember = activeMembership && selectedService.memberPrice !== null && selectedService.memberPrice !== undefined;
    setValue('amount', Number(useMember ? selectedService.memberPrice : selectedService.price));
  }, [selectedService, activeMembership, setValue]);

  const taxAmount = applyGst ? Math.round((amount * gstRate) / 100 * 100) / 100 : 0;
  const total = Math.round((amount + taxAmount) * 100) / 100;

  const submit = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        branchId: data.branchId,
        serviceId: data.serviceId,
        staffId: data.staffId,
        amount: Number(data.amount),
        taxRate: applyGst ? gstRate : 0,
        paymentMethod: data.paymentMethod,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      };
      if (mode === 'REGISTERED') {
        if (!data.customerId) throw new Error('Pick a customer');
        payload.customerId = data.customerId;
      } else {
        payload.walkInName = data.walkInName?.trim() || 'Walk-in customer';
        payload.walkInPhone = data.walkInPhone || undefined;
      }
      return api.post('/bookings/quick-sale', payload);
    },
    onSuccess: () => {
      toast.success(`Sale recorded · ₹${total.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ['service-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-staff-grid'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Walk-in Service Sale"
      description="Record a service that just happened — no scheduling needed"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => submit.mutate(d))}
            disabled={submit.isPending}
            className="btn-primary"
          >
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Receipt className="w-4 h-4 mr-1" /> Record ₹{total.toLocaleString()}</>
            )}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Service selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Branch *</label>
            <select className="input" {...register('branchId', { required: 'Required' })}>
              <option value="">-- Select branch --</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && <p className="text-xs text-red-600 mt-1">{errors.branchId.message}</p>}
          </div>
          <div>
            <label className="label">Service *</label>
            <select className="input" disabled={!branchId} {...register('serviceId', { required: 'Required' })}>
              <option value="">-- Select service --</option>
              {services?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{Number(s.price).toLocaleString()} ({s.duration} min)
                </option>
              ))}
            </select>
            {errors.serviceId && <p className="text-xs text-red-600 mt-1">{errors.serviceId.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Sold by (staff) *</label>
          <select className="input" disabled={!branchId} {...register('staffId', { required: 'Required' })}>
            <option value="">-- Select staff --</option>
            {staffList?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.user?.profile?.firstName} {s.user?.profile?.lastName} — {s.designation || s.employeeCode}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 mt-1">Staff earns commission on this sale.</p>
        </div>

        {/* Customer mode toggle */}
        <div>
          <label className="label">Customer</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('WALKIN')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                mode === 'WALKIN' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              <div className="text-left">
                <div className="text-sm font-semibold">Walk-in</div>
                <div className="text-[10px] text-gray-500">No account needed</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('REGISTERED')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                mode === 'REGISTERED' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <div className="text-left">
                <div className="text-sm font-semibold">Registered</div>
                <div className="text-[10px] text-gray-500">Pick from customers</div>
              </div>
            </button>
          </div>
        </div>

        {mode === 'WALKIN' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" {...register('walkInName')} placeholder="Optional — helps if they come back" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...register('walkInPhone')} placeholder="Optional" />
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Registered customer *</label>
            <select className="input" {...register('customerId')}>
              <option value="">-- Select customer --</option>
              {customers?.map((c: any) => (
                <option key={c.userId} value={c.userId}>
                  {c.user?.profile?.firstName} {c.user?.profile?.lastName} — {c.user?.email}
                </option>
              ))}
            </select>
            {activeMembership && (
              <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                {activeMembership.plan?.name} member — member price auto-applied.
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <label className="label">Amount Received (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              {...register('amount', { required: true, min: 0 })}
            />
          </div>
          <div>
            <label className="label">Payment Method *</label>
            <select className="input" {...register('paymentMethod', { required: true })}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Tax</label>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setApplyGst(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                !applyGst ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              Non GST
            </button>
            <button
              type="button"
              onClick={() => setApplyGst(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                applyGst ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              {taxName} {gstRate}%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Reference / Txn ID</label>
            <input className="input font-mono" {...register('reference')} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" {...register('notes')} placeholder="Optional" />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-sm space-y-1 tabular-nums">
          <div className="flex justify-between text-gray-700">
            <span>Amount</span><span>₹{amount.toLocaleString()}</span>
          </div>
          {applyGst && (
            <div className="flex justify-between text-gray-700">
              <span>{taxName} ({gstRate}%)</span><span>+₹{taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-primary-200 font-semibold">
            <span>Total to record</span>
            <span className="text-primary-700">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
