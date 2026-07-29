import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, RefreshCcw } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props { open: boolean; onClose: () => void; }

export default function NewCouponModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 3);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      perUserLimit: 0,
      validFrom: today,
      validTo: nextMonth.toISOString().split('T')[0],
      isActive: true,
    },
  });

  const discountType = watch('discountType');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setValue('code', code);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/coupons', {
      ...data,
      discountValue: Number(data.discountValue),
      minOrderAmount: Number(data.minOrderAmount) || undefined,
      maxDiscount: Number(data.maxDiscount) || undefined,
      usageLimit: Number(data.usageLimit) || undefined,
      perUserLimit: Number(data.perUserLimit) || undefined,
    }),
    onSuccess: () => {
      toast.success('Coupon created');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Coupon"
      description="Create a discount code or promotional offer"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => createMutation.mutate(d))}
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Coupon'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Coupon Code *</label>
            <div className="flex gap-2">
              <input
                className="input font-mono uppercase"
                placeholder="WELCOME10"
                {...register('code', {
                  required: 'Required',
                  minLength: { value: 3, message: 'Min 3 chars' },
                  pattern: { value: /^[A-Z0-9]+$/i, message: 'Letters & numbers only' },
                })}
              />
              <button
                type="button"
                onClick={generateCode}
                className="btn-secondary flex-shrink-0"
                title="Generate random code"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
            {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="label">Display Name *</label>
            <input className="input" {...register('name', { required: 'Required' })} placeholder="e.g. Welcome Offer" />
            {errors.name && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} placeholder="e.g. 10% off for first-time customers" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Discount Type *</label>
            <select className="input" {...register('discountType')}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="label">
              Discount Value * {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={discountType === 'PERCENTAGE' ? 100 : undefined}
              className="input"
              {...register('discountValue', { required: true, min: 0.01 })}
            />
            {errors.discountValue && <p className="text-xs text-red-600 mt-1">Must be positive</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Min Order Amount (₹)</label>
            <input type="number" min="0" className="input" {...register('minOrderAmount')} placeholder="0 = no minimum" />
          </div>
          {discountType === 'PERCENTAGE' && (
            <div>
              <label className="label">Max Discount Cap (₹)</label>
              <input type="number" min="0" className="input" {...register('maxDiscount')} placeholder="0 = no cap" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Total Usage Limit</label>
            <input type="number" min="0" className="input" {...register('usageLimit')} placeholder="0 = unlimited" />
          </div>
          <div>
            <label className="label">Per-User Limit</label>
            <input type="number" min="0" className="input" {...register('perUserLimit')} placeholder="0 = unlimited" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Valid From *</label>
            <input type="date" className="input" {...register('validFrom', { required: 'Required' })} />
          </div>
          <div>
            <label className="label">Valid To *</label>
            <input type="date" className="input" {...register('validTo', { required: 'Required' })} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="coupon-active" {...register('isActive')} className="w-4 h-4" defaultChecked />
          <label htmlFor="coupon-active" className="text-sm">Coupon is active</label>
        </div>
      </form>
    </Modal>
  );
}
