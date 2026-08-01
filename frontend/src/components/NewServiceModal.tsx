import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props { open: boolean; onClose: () => void; }

export default function NewServiceModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      memberPrice: '' as any,
      duration: 30,
      categoryId: '',
      status: true,
      branchIds: [] as string[],
    },
  });

  const selectedBranchIds = watch('branchIds') || [];

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/services/categories')).data.data,
    enabled: open,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-list-modal'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/services', {
      ...data,
      price: Number(data.price),
      memberPrice: data.memberPrice === '' || data.memberPrice === null ? null : Number(data.memberPrice),
      duration: Number(data.duration),
    }),
    onSuccess: () => {
      toast.success('Service created');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  const toggleBranch = (branchId: string) => {
    const current = selectedBranchIds || [];
    if (current.includes(branchId)) {
      setValue('branchIds', current.filter((id) => id !== branchId));
    } else {
      setValue('branchIds', [...current, branchId]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Service"
      description="Add a new service to your catalog"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => createMutation.mutate(d))}
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Service'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label">Service Name *</label>
          <input className="input" {...register('name', { required: 'Required', minLength: 2 })} placeholder="e.g. Men's Haircut" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Price (₹) *</label>
            <input type="number" step="0.01" min="0" className="input" {...register('price', { required: true, min: 0.01 })} />
            {errors.price && <p className="text-xs text-red-600 mt-1">Must be positive</p>}
          </div>
          <div>
            <label className="label">Member Price (₹)</label>
            <input type="number" step="0.01" min="0" className="input" {...register('memberPrice')} placeholder="blank = same" />
            <p className="text-[11px] text-gray-500 mt-1">Blank = same as regular</p>
          </div>
          <div>
            <label className="label">Duration (min) *</label>
            <input type="number" min="5" step="5" className="input" {...register('duration', { required: true, min: 5 })} />
            {errors.duration && <p className="text-xs text-red-600 mt-1">Min 5 minutes</p>}
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" {...register('categoryId', { required: 'Required' })}>
              <option value="">-- Select --</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.parent?.name ? `${c.parent.name} > ${c.name}` : c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
        </div>

        <div>
          <label className="label">Available at Branches ({selectedBranchIds.length} selected)</label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
            {branches?.length === 0 ? (
              <p className="text-xs text-gray-500">No branches yet. Create a branch first.</p>
            ) : (
              branches?.map((b: any) => (
                <label key={b.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1.5 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBranchIds.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                    className="w-4 h-4"
                  />
                  <span>{b.name}</span>
                  <span className="text-xs text-gray-500">— {b.city?.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="svc-status" {...register('status')} className="w-4 h-4" defaultChecked />
          <label htmlFor="svc-status" className="text-sm">Service is active</label>
        </div>
      </form>
    </Modal>
  );
}
