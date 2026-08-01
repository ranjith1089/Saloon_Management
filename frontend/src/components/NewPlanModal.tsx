import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  plan?: any | null;
}

export default function NewPlanModal({ open, onClose, plan }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!plan;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      color: '#dc2626',
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name || '',
        description: plan.description || '',
        price: Number(plan.price || 0),
        durationDays: plan.durationDays || 30,
        color: plan.color || '#dc2626',
        isActive: plan.isActive ?? true,
        sortOrder: plan.sortOrder || 0,
      });
    } else if (open) {
      reset();
    }
  }, [plan, open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        price: Number(data.price),
        durationDays: Number(data.durationDays),
        sortOrder: Number(data.sortOrder),
      };
      if (isEdit) return api.patch(`/membership-plans/${plan.id}`, payload);
      return api.post('/membership-plans', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Plan updated' : 'Plan created');
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Plan' : 'New Membership Plan'}
      description="Define a subscription plan customers can join"
      size="md"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save' : 'Create Plan'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label">Plan Name *</label>
          <input className="input" {...register('name', { required: true })} placeholder="e.g. Gold Annual" />
          {errors.name && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Price (₹) *</label>
            <input type="number" min="0" step="0.01" className="input" {...register('price', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Duration (days) *</label>
            <input type="number" min="1" step="1" className="input" {...register('durationDays', { required: true, min: 1 })} />
          </div>
          <div>
            <label className="label">Badge Color</label>
            <input type="color" className="input h-10 !p-1" {...register('color')} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Sort Order</label>
            <input type="number" min="0" className="input" {...register('sortOrder')} />
          </div>
          <div className="flex items-end gap-2">
            <input type="checkbox" id="plan-active" {...register('isActive')} className="w-4 h-4" />
            <label htmlFor="plan-active" className="text-sm mb-2">Plan is active</label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
