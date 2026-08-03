import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Save, User as UserIcon } from 'lucide-react';
import api from '@/services/api';

export default function MyProfile() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.data,
  });

  const { register, handleSubmit, formState: { isDirty, errors }, reset } = useForm({
    values: {
      firstName: data?.profile?.firstName || '',
      lastName: data?.profile?.lastName || '',
      phone: data?.profile?.phone || '',
      address: data?.profile?.address || '',
      city: data?.profile?.city || '',
      state: data?.profile?.state || '',
      country: data?.profile?.country || '',
      postcode: data?.profile?.postcode || '',
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => (await api.patch('/auth/profile', form)).data,
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserIcon className="w-6 h-6" /> My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="label">Email</label>
            <p className="text-sm font-medium">{data?.email}</p>
          </div>
          <div>
            <label className="label">Loyalty Points</label>
            <p className="text-sm font-medium">{data?.customer?.loyaltyPoints ?? 0} pts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input className="input" {...register('firstName', { required: true })} />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" {...register('lastName', { required: true })} />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
        </div>

        <div>
          <label className="label">Phone</label>
          <input className="input" {...register('phone')} placeholder="+91 98765 43210" />
        </div>

        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div><label className="label">City</label><input className="input" {...register('city')} /></div>
          <div><label className="label">State</label><input className="input" {...register('state')} /></div>
          <div><label className="label">Country</label><input className="input" {...register('country')} /></div>
          <div><label className="label">Postcode</label><input className="input" {...register('postcode')} /></div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => reset()} disabled={!isDirty} className="btn-secondary">Reset</button>
          <button type="submit" disabled={!isDirty || save.isPending} className="btn-primary">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
