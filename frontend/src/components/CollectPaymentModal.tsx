import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, CreditCard } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  booking: any | null;
}

const FALLBACK_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export default function CollectPaymentModal({ open, onClose, booking }: Props) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      method: 'Cash',
      amount: 0,
      reference: '',
      alsoComplete: false,
    },
  });

  // Load enabled payment methods from Settings (falls back to defaults if empty).
  const { data: methodsData } = useQuery({
    queryKey: ['payment-methods-enabled'],
    queryFn: async () => (await api.get('/settings/payment-methods')).data.data,
    enabled: open,
  });

  const availableMethods: string[] =
    methodsData && methodsData.length > 0
      ? methodsData.filter((m: any) => m.enabled).map((m: any) => m.name)
      : FALLBACK_METHODS;

  useEffect(() => {
    if (open && booking) {
      reset({
        method: availableMethods[0] || 'Cash',
        amount: Number(booking.totalAmount || 0),
        reference: '',
        alsoComplete: booking.status !== 'COMPLETED',
      });
    }
    // Intentionally omitting availableMethods to avoid resetting form on
    // background refetch — set only when modal opens with a booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking, reset]);

  const collect = useMutation({
    mutationFn: async (data: any) =>
      api.post(`/bookings/${booking.id}/collect-payment`, {
        method: data.method,
        reference: data.reference || undefined,
        amount: Number(data.amount),
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
              <><CreditCard className="w-4 h-4 mr-1" /> Mark as Paid</>
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

        <div>
          <label className="label">Payment Method *</label>
          <select className="input" {...register('method', { required: true })}>
            {availableMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {methodsData && methodsData.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              Configure real payment methods in Settings → Payment Methods.
            </p>
          )}
        </div>

        <div>
          <label className="label">Reference / Transaction ID</label>
          <input className="input font-mono" {...register('reference')} placeholder="Optional — UPI ref, card slip #, etc." />
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
