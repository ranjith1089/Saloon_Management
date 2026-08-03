import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  staff?: any | null;
}

export default function NewStaffModal({ open, onClose, staff }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!staff;

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      gender: 'MALE',
      branchId: '',
      designation: '',
      salary: 0,
      commissionRate: 10,
      monthlyTarget: 0,
      experience: 0,
      bio: '',
      isVerified: true,
      serviceIds: [] as string[],
    },
  });

  // Prefill from the staff record whenever it changes (edit mode).
  useEffect(() => {
    if (staff) {
      reset({
        firstName: staff.user?.profile?.firstName || '',
        lastName: staff.user?.profile?.lastName || '',
        email: staff.user?.email || '',
        password: '',
        phone: staff.user?.profile?.phone || '',
        gender: staff.user?.profile?.gender || 'MALE',
        branchId: staff.branchId || '',
        designation: staff.designation || '',
        salary: Number(staff.salary || 0),
        commissionRate: Number(staff.commissionRate || 0),
        monthlyTarget: Number(staff.monthlyTarget || 0),
        experience: Number(staff.experience || 0),
        bio: staff.bio || '',
        isVerified: staff.isVerified ?? true,
        serviceIds: (staff.services || []).map((s: any) => s.serviceId || s.service?.id).filter(Boolean),
      });
    } else if (open) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        gender: 'MALE',
        branchId: '',
        designation: '',
        salary: 0,
        commissionRate: 10,
        monthlyTarget: 0,
        experience: 0,
        bio: '',
        isVerified: true,
        serviceIds: [],
      });
    }
  }, [staff, open, reset]);

  const selectedBranchId = watch('branchId');
  const selectedServiceIds = watch('serviceIds') || [];

  const { data: branches } = useQuery({
    queryKey: ['branches-list-modal'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
    enabled: open,
  });

  const { data: services } = useQuery({
    queryKey: ['services-for-branch', selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? `?branchId=${selectedBranchId}&limit=100` : '?limit=100';
      return (await api.get(`/services${params}`)).data.data;
    },
    enabled: open && !!selectedBranchId,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        salary: Number(data.salary),
        commissionRate: Number(data.commissionRate),
        monthlyTarget: Number(data.monthlyTarget) || null,
        experience: Number(data.experience),
      };

      if (isEdit) {
        // On edit, don't send email/password (backend doesn't touch those here).
        const { email, password, ...rest } = payload;
        return api.patch(`/staff/${staff.id}`, rest);
      }
      return api.post('/staff', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Staff updated' : 'Staff created');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['commissions-summary'] });
      handleClose();
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setValue('serviceIds', selectedServiceIds.filter((s) => s !== id));
    } else {
      setValue('serviceIds', [...selectedServiceIds, id]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Staff Member' : 'New Staff Member'}
      description={isEdit ? 'Update stylist details, target and services' : 'Add a stylist, therapist or other service provider'}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Create Staff'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Personal Info</h3>

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

        {isEdit ? (
          <div>
            <label className="label">Email</label>
            <input type="email" className="input bg-gray-50 text-gray-600" value={watch('email')} disabled />
            <p className="text-xs text-gray-500 mt-1">Email and password can't be changed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" {...register('email', { required: 'Required' })} />
              {errors.email && <p className="text-xs text-red-600 mt-1">Valid email required</p>}
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" {...register('password', { required: 'Required', minLength: 6 })} placeholder="Min 6 chars" />
              {errors.password && <p className="text-xs text-red-600 mt-1">Min 6 characters</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" {...register('gender')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2">Employment</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Branch *</label>
            <select className="input" {...register('branchId', { required: 'Required' })}>
              <option value="">-- Select branch --</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" {...register('designation')} placeholder="e.g. Senior Stylist" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Salary (₹/mo)</label>
            <input type="number" min="0" className="input" {...register('salary')} />
          </div>
          <div>
            <label className="label">Commission %</label>
            <input type="number" min="0" max="100" step="0.5" className="input" {...register('commissionRate')} />
          </div>
          <div>
            <label className="label">Experience (yrs)</label>
            <input type="number" min="0" className="input" {...register('experience')} />
          </div>
        </div>

        <div>
          <label className="label">Monthly Revenue Target (₹)</label>
          <input type="number" min="0" step="100" className="input" {...register('monthlyTarget')} placeholder="0 = flat commission on every sale" />
          <p className="text-xs text-gray-500 mt-1">
            Commission is paid only on revenue above this target. Set 0 for flat commission.
          </p>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={2} {...register('bio')} placeholder="Brief professional summary..." />
        </div>

        <div>
          <label className="label">Services Provided ({selectedServiceIds.length} selected)</label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
            {!selectedBranchId ? (
              <p className="text-xs text-gray-500">Select a branch first</p>
            ) : services?.length === 0 ? (
              <p className="text-xs text-gray-500">No services available at this branch</p>
            ) : (
              services?.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1.5 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="w-4 h-4"
                  />
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">₹{Number(s.price).toLocaleString()} · {s.duration}min</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="staff-verified" {...register('isVerified')} className="w-4 h-4" />
          <label htmlFor="staff-verified" className="text-sm">Mark as verified</label>
        </div>
      </form>
    </Modal>
  );
}
