/**
 * Public booking widget — no login required.
 * Salon owner shares https://<host>/book/<branchId> on Insta / website.
 * Also embeddable as <iframe src="https://<host>/book/<branchId>?embed=1">.
 *
 * Flow: Service → Staff → Date → Time → Contact → Success.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Phone, User } from 'lucide-react';
import api from '@/services/api';

type Step = 'service' | 'staff' | 'date' | 'time' | 'contact' | 'done';

interface Branch { id: string; name: string; description?: string; address?: string; phone?: string; logo?: string; openTime: string; closeTime: string; city?: string; }
interface Service { id: string; name: string; description?: string; duration: number; price: number; category?: string; image?: string; }
interface Staff { id: string; name: string; designation?: string; photo?: string; experience?: number; }
interface Slot { time: string; available: boolean; }

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDuration = (m: number) => m >= 60 ? `${Math.floor(m/60)}h${m%60 ? ' '+(m%60)+'m' : ''}` : `${m}m`;

export default function PublicBooking() {
  const { branchId = '' } = useParams();
  const [sp] = useSearchParams();
  const isEmbed = sp.get('embed') === '1';

  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '', email: '', notes: '' });
  const [confirmation, setConfirmation] = useState<{ bookingNumber: string; startTime: string; bookingDate: string } | null>(null);

  const branchQ = useQuery({
    queryKey: ['public-branch', branchId],
    queryFn: async () => (await api.get(`/public/branches/${branchId}`)).data?.data as Branch,
    enabled: !!branchId,
  });

  const servicesQ = useQuery({
    queryKey: ['public-services', branchId],
    queryFn: async () => (await api.get(`/public/branches/${branchId}/services`)).data?.data as Service[],
    enabled: !!branchId,
  });

  const staffQ = useQuery({
    queryKey: ['public-staff', branchId, service?.id],
    queryFn: async () => (await api.get(`/public/branches/${branchId}/staff`, { params: { serviceId: service!.id } })).data?.data as Staff[],
    enabled: !!branchId && !!service?.id,
  });

  const slotsQ = useQuery({
    queryKey: ['public-slots', branchId, staff?.id, service?.id, date],
    queryFn: async () => (await api.get(`/public/branches/${branchId}/slots`, { params: { staffId: staff!.id, serviceId: service!.id, date } })).data?.data as Slot[],
    enabled: !!branchId && !!staff?.id && !!service?.id && !!date,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await api.post('/public/bookings', {
        branchId,
        serviceId: service!.id,
        staffId: staff!.id,
        bookingDate: date,
        startTime: time,
        customerName: contact.name.trim(),
        customerPhone: contact.phone.trim(),
        customerEmail: contact.email.trim() || undefined,
        notes: contact.notes.trim() || undefined,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setConfirmation(data);
      setStep('done');
    },
  });

  // Next 14 days as pickable date chips
  const dateOptions = useMemo(() => {
    const out: { iso: string; label: string; sub: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        iso,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sub: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      });
    }
    return out;
  }, []);

  const goBack = () => {
    if (step === 'staff') setStep('service');
    else if (step === 'date') setStep('staff');
    else if (step === 'time') setStep('date');
    else if (step === 'contact') setStep('time');
  };

  useEffect(() => {
    // Reset downstream when upstream selection changes
    if (!service) { setStaff(null); setDate(''); setTime(''); }
  }, [service]);

  if (branchQ.isLoading) {
    return <FullscreenCenter><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></FullscreenCenter>;
  }
  if (branchQ.error || !branchQ.data) {
    return <FullscreenCenter><div className="text-center text-gray-600"><p className="text-lg font-semibold">Booking page unavailable</p><p className="text-sm mt-1">This branch is not accepting online bookings right now.</p></div></FullscreenCenter>;
  }
  const branch = branchQ.data;

  return (
    <div className={isEmbed ? 'bg-transparent min-h-screen' : 'bg-gradient-to-br from-primary-50 via-white to-primary-50 min-h-screen'}>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Salon header */}
        {!isEmbed && (
          <div className="mb-6 flex items-center gap-4">
            {branch.logo ? (
              <img src={branch.logo} alt="" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xl">
                {branch.name.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{branch.name}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                {branch.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{branch.address}</span>}
                {branch.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{branch.phone}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {step !== 'done' && (
          <StepProgress step={step} />
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          {step !== 'service' && step !== 'done' && (
            <button onClick={goBack} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step === 'service' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Choose a service</h2>
              {servicesQ.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <div className="grid grid-cols-1 gap-2">
                  {servicesQ.data?.length === 0 && <p className="text-sm text-gray-500">No services available.</p>}
                  {servicesQ.data?.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setService(s); setStep('staff'); }}
                      className="text-left border border-gray-200 hover:border-primary-500 rounded-xl p-3 flex items-center gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{fmtDuration(s.duration)} · {s.category || 'Service'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary-700">{money(s.price)}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'staff' && (
            <>
              <h2 className="text-lg font-semibold mb-1">Choose a stylist</h2>
              <p className="text-sm text-gray-500 mb-4">For {service?.name}</p>
              {staffQ.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <div className="grid grid-cols-2 gap-2">
                  {staffQ.data?.length === 0 && <p className="col-span-2 text-sm text-gray-500">No stylists available for this service. Please pick another.</p>}
                  {staffQ.data?.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setStaff(s); setStep('date'); }}
                      className="border border-gray-200 hover:border-primary-500 rounded-xl p-3 flex flex-col items-center text-center transition-colors"
                    >
                      {s.photo ? (
                        <img src={s.photo} alt="" className="w-16 h-16 rounded-full object-cover mb-2" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="font-medium text-sm">{s.name}</div>
                      {s.designation && <div className="text-xs text-gray-500 mt-0.5">{s.designation}</div>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'date' && (
            <>
              <h2 className="text-lg font-semibold mb-1">Pick a date</h2>
              <p className="text-sm text-gray-500 mb-4">{service?.name} · {staff?.name}</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {dateOptions.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => { setDate(d.iso); setStep('time'); }}
                    className="border border-gray-200 hover:border-primary-500 rounded-xl p-2 text-center transition-colors"
                  >
                    <div className="text-xs text-gray-500">{d.sub}</div>
                    <div className="font-semibold text-sm">{d.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'time' && (
            <>
              <h2 className="text-lg font-semibold mb-1">Pick a time</h2>
              <p className="text-sm text-gray-500 mb-4">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              {slotsQ.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : slotsQ.data?.length === 0 ? (
                <p className="text-sm text-gray-500">No slots today. Try another day.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {slotsQ.data?.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => { setTime(s.time); setStep('contact'); }}
                      className={
                        'rounded-lg py-2 text-sm font-medium transition-colors ' +
                        (s.available
                          ? 'border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-900'
                          : 'border border-transparent bg-gray-100 text-gray-400 cursor-not-allowed line-through')
                      }
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'contact' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Your details</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                  <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Priya Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="98765 43210" />
                  <p className="text-xs text-gray-500 mt-1">We'll send booking updates over WhatsApp.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Any preferences?" />
                </div>

                {/* Summary card */}
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mt-4">
                  <div className="text-xs font-semibold text-primary-700 uppercase mb-2">Booking summary</div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Service:</span> <span className="font-medium">{service?.name}</span></div>
                    <div><span className="text-gray-500">With:</span> <span className="font-medium">{staff?.name}</span></div>
                    <div><span className="text-gray-500">When:</span> <span className="font-medium">{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {time}</span></div>
                    <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{fmtDuration(service?.duration || 0)}</span></div>
                    <div className="pt-1 border-t border-primary-200 mt-2"><span className="text-gray-500">Total:</span> <span className="font-bold text-primary-700">{money(service?.price || 0)}</span> <span className="text-xs text-gray-500">(pay at salon)</span></div>
                  </div>
                </div>

                {submit.isError && (
                  <p className="text-sm text-red-600">{(submit.error as any)?.response?.data?.message || 'Could not create booking. Try again.'}</p>
                )}

                <button
                  onClick={() => submit.mutate()}
                  disabled={submit.isPending || contact.name.trim().length < 2 || contact.phone.trim().length < 6}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm booking
                </button>
              </div>
            </>
          )}

          {step === 'done' && confirmation && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-1">Booking requested!</h2>
              <p className="text-sm text-gray-600 mb-4">
                Reference <span className="font-mono font-semibold">{confirmation.bookingNumber}</span>
              </p>
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-left inline-block">
                <div><span className="text-gray-500">Service:</span> <span className="font-medium">{service?.name}</span></div>
                <div><span className="text-gray-500">Stylist:</span> <span className="font-medium">{staff?.name}</span></div>
                <div><span className="text-gray-500">When:</span> <span className="font-medium">{new Date(confirmation.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {confirmation.startTime}</span></div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                The salon will confirm shortly. You'll get a WhatsApp message when they do.
              </p>
              {branch.phone && (
                <a href={`tel:${branch.phone}`} className="mt-4 inline-block text-sm text-primary-600 hover:underline">
                  Call salon: {branch.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {!isEmbed && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by your salon software
          </p>
        )}
      </div>
    </div>
  );
}

function StepProgress({ step }: { step: Step }) {
  const steps: Step[] = ['service', 'staff', 'date', 'time', 'contact'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((s, i) => (
        <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-primary-600' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

function FullscreenCenter({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6">{children}</div>;
}
