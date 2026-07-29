import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props { open: boolean; onClose: () => void; }

export default function NewCustomerModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: 'customer123',
      phone: '',
      gender: 'MALE',
      dob: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postcode: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/customers', data),
    onSuccess: () => {
      toast.success('Customer created');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Customer"
      description="Add a new customer to your database"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => createMutation.mutate(d))}
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Customer'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Contact Info</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className="input" {...register('firstName', { required: 'Required' })} />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" {...register('lastName', { required: 'Required' })} />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" {...register('email', { required: 'Required' })} />
            {errors.email && <p className="text-xs text-red-600 mt-1">Valid email required</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input type="text" className="input" {...register('password', { minLength: 6 })} placeholder="Default: customer123" />
            <p className="text-xs text-gray-500 mt-1">Customer will use this to log in</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} placeholder="+91..." />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" {...register('gender')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input" {...register('dob')} />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2">Address (optional)</h3>

        <div>
          <label className="label">Street Address</label>
          <input className="input" {...register('address')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">City</label>
            <input className="input" {...register('city')} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" {...register('state')} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" {...register('country')} />
          </div>
          <div>
            <label className="label">Postcode</label>
            <input className="input" {...register('postcode')} />
          </div>
        </div>

        <div>
          <label className="label">Internal Notes</label>
          <textarea className="input" rows={2} {...register('notes')} placeholder="Preferences, allergies, etc." />
        </div>
      </form>
    </Modal>
  );
}
