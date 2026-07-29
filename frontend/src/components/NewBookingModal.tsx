import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Calendar, User, Scissors, Building2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  customerId: string;
  branchId: string;
  serviceId: string;
  staffId: string;
  bookingDate: string;
  startTime: string;
  notes?: string;
}

export default function NewBookingModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      customerId: '',
      branchId: '',
      serviceId: '',
      staffId: '',
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      notes: '',
    },
  });

  const watchBranch = watch('branchId');
  const watchService = watch('serviceId');
  const watchStaff = watch('staffId');
  const watchDate = watch('bookingDate');

  // Load dropdowns
  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
    enabled: open,
  });

  const { data: services } = useQuery({
    queryKey: ['services-select', watchBranch],
    queryFn: async () => {
      const params = watchBranch ? `?branchId=${watchBranch}&limit=100` : '?limit=100';
      return (await api.get(`/services${params}`)).data.data;
    },
    enabled: open && !!watchBranch,
  });

  const { data: staff } = useQuery({
    queryKey: ['staff-select', watchBranch],
    queryFn: async () => {
      const params = watchBranch ? `?branchId=${watchBranch}&limit=100` : '?limit=100';
      return (await api.get(`/staff${params}`)).data.data;
    },
    enabled: open && !!watchBranch,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => (await api.get('/customers?limit=100')).data.data,
    enabled: open,
  });

  // Filter staff to those who provide the selected service
  const eligibleStaff = useMemo(() => {
    if (!staff || !watchService) return staff || [];
    return staff.filter((s: any) => s.services?.some((sv: any) => sv.serviceId === watchService));
  }, [staff, watchService]);

  // Available time slots
  const { data: slots } = useQuery({
    queryKey: ['slots', watchStaff, watchDate, watchService],
    queryFn: async () => {
      const res = await api.get('/bookings/available-slots', {
        params: { staffId: watchStaff, date: watchDate, serviceId: watchService },
      });
      return res.data.data;
    },
    enabled: open && !!watchStaff && !!watchDate && !!watchService,
  });

  const selectedService = useMemo(
    () => services?.find((s: any) => s.id === watchService),
    [services, watchService]
  );

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await api.post('/bookings', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Booking created successfully!');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleClose();
    },
  });

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const onSubmit = (data: FormValues) => createMutation.mutate(data);

  const canProceedToStep2 = watchBranch && watchService && watchStaff;
  const canProceedToStep3 = watchDate && watch('startTime');
  const canProceedToStep4 = watch('customerId');

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Booking"
      description={`Step ${step} of 3`}
      size="lg"
      footer={
        <>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">
              Back
            </button>
          )}
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={!canProceedToStep4 || createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Booking'}
            </button>
          )}
        </>
      }
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                n <= step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            ></div>
            <p className={`text-xs mt-1 ${n <= step ? 'text-primary-600' : 'text-gray-400'}`}>
              {n === 1 ? 'Service' : n === 2 ? 'Date & Time' : 'Customer'}
            </p>
          </div>
        ))}
      </div>

      {/* STEP 1 — Branch, Service, Staff */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1">
              <Building2 className="w-4 h-4" /> Branch
            </label>
            <select className="input" {...register('branchId', { required: 'Select a branch' })}>
              <option value="">-- Select branch --</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.branchId && <p className="text-xs text-red-600 mt-1">{errors.branchId.message}</p>}
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <Scissors className="w-4 h-4" /> Service
            </label>
            <select
              className="input"
              disabled={!watchBranch}
              {...register('serviceId', { required: 'Select a service' })}
              onChange={(e) => {
                setValue('serviceId', e.target.value);
                setValue('staffId', ''); // reset staff when service changes
              }}
            >
              <option value="">-- Select service --</option>
              {services?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{Number(s.price).toLocaleString()} ({s.duration} min)
                </option>
              ))}
            </select>
            {!watchBranch && (
              <p className="text-xs text-gray-500 mt-1">Select a branch first</p>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <User className="w-4 h-4" /> Staff
            </label>
            <select
              className="input"
              disabled={!watchService}
              {...register('staffId', { required: 'Select staff' })}
            >
              <option value="">-- Select staff --</option>
              {eligibleStaff?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.user?.profile?.firstName} {s.user?.profile?.lastName} — {s.designation}
                </option>
              ))}
            </select>
            {watchService && eligibleStaff?.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No staff assigned to this service at this branch. Assign staff via the Staff page first.
              </p>
            )}
          </div>

          {selectedService && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
              <p className="text-sm font-medium text-primary-900">{selectedService.name}</p>
              <p className="text-xs text-primary-700 mt-1">
                Duration: {selectedService.duration} min · Price: ₹{Number(selectedService.price).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Date & Time */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              className="input"
              min={new Date().toISOString().split('T')[0]}
              {...register('bookingDate', { required: 'Select a date' })}
            />
          </div>

          <div>
            <label className="label">Time Slot</label>
            {!slots || slots.slots?.length === 0 ? (
              <div className="text-sm text-gray-500 border border-gray-200 rounded-lg p-4 text-center">
                {slots?.message || 'Loading available slots...'}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                {slots.slots.map((slot: any) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setValue('startTime', slot.startTime)}
                    className={`text-xs py-2 rounded-lg border transition-colors ${
                      watch('startTime') === slot.startTime
                        ? 'bg-primary-600 text-white border-primary-600'
                        : slot.available
                          ? 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                          : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Selected: <span className="font-medium">{watch('startTime')}</span>
              {selectedService && ` (${selectedService.duration} min)`}
            </p>
          </div>
        </div>
      )}

      {/* STEP 3 — Customer & Notes */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1">
              <User className="w-4 h-4" /> Customer
            </label>
            <select className="input" {...register('customerId', { required: 'Select a customer' })}>
              <option value="">-- Select customer --</option>
              {customers?.map((c: any) => (
                <option key={c.userId} value={c.userId}>
                  {c.user?.profile?.firstName} {c.user?.profile?.lastName} — {c.user?.email}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-red-600 mt-1">{errors.customerId.message}</p>}
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Special requests, preferences..."
              {...register('notes')}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium mb-2">Booking Summary</p>
            <div className="text-xs space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-medium text-gray-900">{selectedService?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-medium text-gray-900">
                  {new Date(watchDate).toLocaleDateString()} at {watch('startTime')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium text-gray-900">{selectedService?.duration} min</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-semibold text-primary-600">
                  ₹{Number(selectedService?.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
