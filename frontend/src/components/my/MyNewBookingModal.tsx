/**
 * Customer-facing "New Booking" modal — used from /my/bookings.
 * Uses the /public/* endpoints so it works with CUSTOMER-role tokens
 * (the admin NewBookingModal hits /customers which requires STAFF+).
 * On submit, POSTs to /bookings with the logged-in customer's own id.
 */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Calendar, Clock, MapPin, Scissors, User, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type Step = 'service' | 'when' | 'confirm';
interface Branch { id: string; name: string; address?: string; openTime: string; closeTime: string; }
interface Service { id: string; name: string; description?: string; duration: number; price: number; category?: string; }
interface Staff { id: string; name: string; designation?: string; photo?: string; }
interface Slot { time: string; available: boolean; }

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDuration = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`);

export default function MyNewBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('service');
  const [branchId, setBranchId] = useState('');
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Reset on open/close so a stale state from a previous session doesn't leak.
  useEffect(() => {
    if (open) {
      setStep('service');
      setBranchId('');
      setService(null);
      setStaff(null);
      setDate('');
      setTime('');
      setNotes('');
    }
  }, [open]);

  // Data — every list uses /public/* which any authenticated role can hit.
  const branchesQ = useQuery({
    queryKey: ['public-branches'],
    queryFn: async () => (await api.get('/public/branches')).data.data as Branch[],
    enabled: open,
  });
  const servicesQ = useQuery({
    queryKey: ['public-services', branchId],
    queryFn: async () => (await api.get(`/public/branches/${branchId}/services`)).data.data as Service[],
    enabled: open && !!branchId,
  });
  const staffQ = useQuery({
    queryKey: ['public-staff', branchId, service?.id],
    queryFn: async () =>
      (await api.get(`/public/branches/${branchId}/staff`, { params: { serviceId: service!.id } })).data.data as Staff[],
    enabled: open && !!branchId && !!service?.id,
  });
  const slotsQ = useQuery({
    queryKey: ['public-slots', branchId, staff?.id, service?.id, date],
    queryFn: async () =>
      (await api.get(`/public/branches/${branchId}/slots`, {
        params: { staffId: staff!.id, serviceId: service!.id, date },
      })).data.data as Slot[],
    enabled: open && !!branchId && !!staff?.id && !!service?.id && !!date,
  });

  const dateOptions = useMemo(() => {
    const out: { iso: string; label: string; sub: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sub: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      });
    }
    return out;
  }, []);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Login required');
      if (!branchId || !service || !staff || !date || !time) throw new Error('Fill every step');
      const res = await api.post('/bookings', {
        customerId: user.id,
        branchId,
        serviceId: service.id,
        staffId: staff.id,
        bookingDate: date,
        startTime: time,
        notes: notes || undefined,
        status: 'PENDING',
      });
      return res.data?.data;
    },
    onSuccess: (b) => {
      toast.success(`Booking requested · ${b?.bookingNumber || ''}`);
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Booking failed'),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold">New Booking</h3>
            <p className="text-sm text-gray-500">
              Step {step === 'service' ? 1 : step === 'when' ? 2 : 3} of 3
              {' · '}
              {step === 'service' ? 'Service' : step === 'when' ? 'Date & Time' : 'Confirm'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 flex gap-1">
          {(['service', 'when', 'confirm'] as Step[]).map((s, i) => {
            const active = ['service', 'when', 'confirm'].indexOf(step) >= i;
            return <div key={s} className={`h-1.5 flex-1 rounded-full ${active ? 'bg-primary-600' : 'bg-gray-200'}`} />;
          })}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {step === 'service' && (
            <>
              <div>
                <label className="label"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Branch</label>
                <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setService(null); setStaff(null); }} className="input">
                  <option value="">— Select branch —</option>
                  {branchesQ.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {branchesQ.isLoading && <p className="text-xs text-gray-500 mt-1"><Loader2 className="w-3 h-3 inline animate-spin" /> Loading branches…</p>}
              </div>

              <div>
                <label className="label"><Scissors className="w-3.5 h-3.5 inline mr-1" /> Service</label>
                {!branchId ? (
                  <p className="text-sm text-gray-500 italic">Select a branch first.</p>
                ) : servicesQ.isLoading ? (
                  <p className="text-sm text-gray-500"><Loader2 className="w-3 h-3 inline animate-spin" /> Loading…</p>
                ) : servicesQ.data?.length === 0 ? (
                  <p className="text-sm text-gray-500">No services available at this branch.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                    {servicesQ.data?.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setService(s)}
                        className={`text-left border rounded-lg p-3 transition-colors ${
                          service?.id === s.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-500'
                        }`}
                      >
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{fmtDuration(s.duration)} · {s.category || 'Service'}</div>
                        <div className="text-sm font-bold text-primary-700 mt-1">{money(s.price)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'when' && service && (
            <>
              <div>
                <label className="label"><User className="w-3.5 h-3.5 inline mr-1" /> Stylist</label>
                {staffQ.isLoading ? (
                  <p className="text-sm text-gray-500"><Loader2 className="w-3 h-3 inline animate-spin" /> Loading…</p>
                ) : staffQ.data?.length === 0 ? (
                  <p className="text-sm text-gray-500">No stylists at this branch offer {service.name}. Try another service.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {staffQ.data?.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setStaff(s); setTime(''); }}
                        className={`text-center border rounded-lg p-2 transition-colors ${
                          staff?.id === s.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-500'
                        }`}
                      >
                        {s.photo ? (
                          <img src={s.photo} alt="" className="w-10 h-10 rounded-full object-cover mx-auto mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="text-xs font-medium truncate">{s.name}</div>
                        {s.designation && <div className="text-[10px] text-gray-500 truncate">{s.designation}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {staff && (
                <div>
                  <label className="label"><Calendar className="w-3.5 h-3.5 inline mr-1" /> Date</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {dateOptions.map((d) => (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => { setDate(d.iso); setTime(''); }}
                        className={`border rounded-lg p-1.5 text-center transition-colors ${
                          date === d.iso ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-500'
                        }`}
                      >
                        <div className="text-[10px] text-gray-500">{d.sub}</div>
                        <div className="text-xs font-semibold">{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {staff && date && (
                <div>
                  <label className="label"><Clock className="w-3.5 h-3.5 inline mr-1" /> Time</label>
                  {slotsQ.isLoading ? (
                    <p className="text-sm text-gray-500"><Loader2 className="w-3 h-3 inline animate-spin" /> Loading slots…</p>
                  ) : slotsQ.data?.length === 0 ? (
                    <p className="text-sm text-gray-500">No slots on this day.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                      {slotsQ.data?.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setTime(s.time)}
                          className={`rounded py-1.5 text-xs font-medium transition-colors ${
                            time === s.time
                              ? 'bg-primary-600 text-white'
                              : s.available
                                ? 'border border-gray-200 hover:border-primary-500'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'confirm' && service && staff && (
            <>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-2">Booking summary</div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-500">Service:</span> <span className="font-medium">{service.name}</span></div>
                  <div><span className="text-gray-500">Stylist:</span> <span className="font-medium">{staff.name}</span></div>
                  <div><span className="text-gray-500">When:</span> <span className="font-medium">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {time}
                  </span></div>
                  <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{fmtDuration(service.duration)}</span></div>
                  <div className="pt-1 border-t border-primary-200 mt-2">
                    <span className="text-gray-500">Total:</span>{' '}
                    <span className="font-bold text-primary-700">{money(service.price)}</span>{' '}
                    <span className="text-xs text-gray-500">(pay at salon)</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" placeholder="Any preferences?" />
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {step !== 'service' ? (
            <button
              type="button"
              onClick={() => setStep(step === 'confirm' ? 'when' : 'service')}
              className="btn-secondary text-sm"
            >
              Back
            </button>
          ) : <span />}

          {step === 'service' && (
            <button
              type="button"
              disabled={!branchId || !service}
              onClick={() => setStep('when')}
              className="btn-primary text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 'when' && (
            <button
              type="button"
              disabled={!staff || !date || !time}
              onClick={() => setStep('confirm')}
              className="btn-primary text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 'confirm' && (
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
              className="btn-primary text-sm"
            >
              {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Confirm booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
