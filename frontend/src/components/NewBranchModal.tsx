import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewBranchModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      address: '',
      cityId: '',
      phone: '',
      email: '',
      openTime: '09:00',
      closeTime: '21:00',
      status: true,
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities-list'],
    queryFn: async () => (await api.get('/locations/cities')).data.data,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/branches', data),
    onSuccess: () => {
      toast.success('Branch created');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Branch"
      description="Add a new salon location"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => createMutation.mutate(d))}
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Branch'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="label">Branch Name *</label>
          <input className="input" {...register('name', { required: 'Required', minLength: 2 })} placeholder="e.g. Glamour Cuts - MG Road" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} placeholder="Short description..." />
        </div>

        <div>
          <label className="label">Address *</label>
          <input className="input" {...register('address', { required: 'Required' })} placeholder="123 Street, Locality" />
          {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <label className="label">City *</label>
          <select className="input" {...register('cityId', { required: 'Required' })}>
            <option value="">-- Select city --</option>
            {cities?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.cityId && <p className="text-xs text-red-600 mt-1">{errors.cityId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone *</label>
            <input className="input" {...register('phone', { required: 'Required', minLength: 10 })} placeholder="+91 98765 43210" />
            {errors.phone && <p className="text-xs text-red-600 mt-1">Valid phone required</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" {...register('email', { required: 'Required' })} placeholder="branch@salon.com" />
            {errors.email && <p className="text-xs text-red-600 mt-1">Valid email required</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Open Time</label>
            <input type="time" className="input" {...register('openTime')} />
          </div>
          <div>
            <label className="label">Close Time</label>
            <input type="time" className="input" {...register('closeTime')} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="branch-status" {...register('status')} className="w-4 h-4" defaultChecked />
          <label htmlFor="branch-status" className="text-sm">Branch is active</label>
        </div>
      </form>
    </Modal>
  );
}
