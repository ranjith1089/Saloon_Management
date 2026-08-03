import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, CreditCard, Receipt } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDefaultTaxRate } from '@/hooks/useDefaultTaxRate';

interface Props {
  open: boolean;
  onClose: () => void;
  booking: any | null;
}

export default function CollectPaymentModal({ open, onClose, booking }: Props) {
  const queryClient = useQueryClient();
  const { methods: availableMethods, configured: methodsConfigured } = usePaymentMethods();
  const { rate: gstRate, name: taxName } = useDefaultTaxRate();

  // Non GST vs GST toggle — stored outside react-hook-form because it's not
  // a plain input; simpler to manage as local state.
  const [applyGst, setApplyGst] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      method: 'Cash',
      amount: 0,
      reference: '',
      alsoComplete: false,
    },
  });

  useEffect(() => {
    if (open && booking) {
      reset({
        method: availableMethods[0] || 'Cash',
        amount: Number(booking.totalAmount || 0),
        reference: '',
        alsoComplete: booking.status !== 'COMPLETED',
      });
      setApplyGst(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking, reset]);

  const collect = useMutation({
    mutationFn: async (data: any) =>
      api.post(`/bookings/${booking.id}/collect-payment`, {
        method: data.method,
        reference: data.reference || undefined,
        amount: Number(data.amount),
        taxRate: applyGst ? gstRate : 0,
        alsoComplete: !!data.alsoComplete,
      }),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
    },
  });

  const amount = Number(watch('amount') || 0);
  const originalTotal = Number(booking?.totalAmount || 0);
  const diff = amount - originalTotal;
  const taxAmount = applyGst ? Math.round((amount * gstRate) / 100 * 100) / 100 : 0;
  const finalTotal = Math.round((amount + taxAmount) * 100) / 100;

  if (!booking) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Collect Payment"
      description={`${booking.bookingNumber} · ${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim()}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => collect.mutate(d))}
            disabled={collect.isPending}
            className="btn-primary"
          >
            {collect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><CreditCard className="w-4 h-4 mr-1" /> Collect ₹{finalTotal.toLocaleString()}</>
            )}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span className="font-medium">{booking.service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Staff</span>
            <span className="font-medium">
              {booking.staff?.user?.profile?.firstName} {booking.staff?.user?.profile?.lastName}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-200">
            <span className="text-gray-500">Original total</span>
            <span className="font-medium">₹{originalTotal.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <label className="label">Amount Received (₹) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            {...register('amount', { required: true, min: 0 })}
          />
          {errors.amount && <p className="text-xs text-red-600 mt-1">Required</p>}
          {diff !== 0 && (
            <p className={`text-xs mt-1 ${diff > 0 ? 'text-green-700' : 'text-amber-700'}`}>
              {diff > 0
                ? `+₹${diff.toLocaleString()} above original total (tip / adjustment)`
                : `−₹${Math.abs(diff).toLocaleString()} below original total`}
            </p>
          )}
        </div>

        {/* GST toggle */}
        <div>
          <label className="label flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Tax</label>
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

        <div>
          <label className="label">Payment Method *</label>
          <select className="input" {...register('method', { required: true })}>
            {availableMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {!methodsConfigured && (
            <p className="text-[11px] text-gray-500 mt-1">
              Configure real payment methods in Settings → Payment Methods.
            </p>
          )}
        </div>

        <div>
          <label className="label">Reference / Transaction ID</label>
          <input className="input font-mono" {...register('reference')} placeholder="Optional — UPI ref, card slip #, etc." />
        </div>

        {/* Live summary — matches what the backend will compute */}
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Amount</span>
            <span>₹{amount.toLocaleString()}</span>
          </div>
          {applyGst && (
            <div className="flex justify-between text-gray-700">
              <span>{taxName} ({gstRate}%)</span>
              <span>+₹{taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-primary-200 font-semibold">
            <span>Total to collect</span>
            <span className="text-primary-700">₹{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
          <label className="flex items-start gap-2 p-3 bg-primary-50 border border-primary-100 rounded-lg cursor-pointer">
            <input type="checkbox" {...register('alsoComplete')} className="w-4 h-4 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-900">Also mark as COMPLETED</div>
              <div className="text-[11px] text-primary-700 mt-0.5">
                Creates the staff commission earning and updates customer stats.
              </div>
            </div>
          </label>
        )}
      </form>
    </Modal>
  );
}
