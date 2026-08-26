import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Save, User as UserIcon } from 'lucide-react';
import api from '@/services/api';

const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const POSTCODE_RE = /^\d{6}$/;
const PLACE_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
const ADDRESS_RE = /^[A-Za-z0-9\s,.#/'()-]*$/;

// Optional text field: empty is fine, but a non-empty value must match.
const optText = (re: RegExp, max: number, msg: string) =>
  z.string().trim().max(max, `Max ${max} characters`)
    .refine((v) => v === '' || re.test(v), msg);

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Required').max(50, 'Max 50').regex(NAME_RE, 'Letters only'),
  lastName: z.string().trim().min(2, 'Required').max(50, 'Max 50').regex(NAME_RE, 'Letters only'),
  phone: optText(PHONE_RE, 10, 'Enter a valid 10-digit mobile number'),
  address: optText(ADDRESS_RE, 255, 'Invalid characters'),
  city: optText(PLACE_RE, 80, 'Letters only'),
  state: optText(PLACE_RE, 80, 'Letters only'),
  country: optText(PLACE_RE, 80, 'Letters only'),
  postcode: optText(POSTCODE_RE, 6, 'Enter a valid 6-digit postcode'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function MyProfile() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.data,
  });

  const { register, handleSubmit, formState: { isDirty, errors }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
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
            <input className="input" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Phone</label>
          <input className="input" inputMode="numeric" maxLength={10} {...register('phone')} placeholder="10-digit mobile" />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
          {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">City</label><input className="input" {...register('city')} />
            {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="label">State</label><input className="input" {...register('state')} />
            {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <label className="label">Country</label><input className="input" {...register('country')} />
            {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country.message}</p>}
          </div>
          <div>
            <label className="label">Postcode</label><input className="input" inputMode="numeric" maxLength={6} {...register('postcode')} />
            {errors.postcode && <p className="text-xs text-red-600 mt-1">{errors.postcode.message}</p>}
          </div>
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
