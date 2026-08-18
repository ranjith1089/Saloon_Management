/**
 * Onboarding wizard — Ship 2B of SaaS conversion.
 * Walks a fresh OWNER through the minimum setup (Branch → Service → Done)
 * so they can start booking within minutes. Uses existing endpoints —
 * nothing new backend-side needed.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, Loader2, Building2, Scissors, CheckCircle2, Sparkles, MapPin } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type Step = 'welcome' | 'branch' | 'service' | 'done';

export default function Onboarding() {
  const nav = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<Step>('welcome');
  const [branchId, setBranchId] = useState('');
  const [branch, setBranch] = useState({ name: '', address: '', phone: '', cityId: '' });
  const [service, setService] = useState({ name: '', duration: '45', price: '', categoryId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) nav('/login', { replace: true });
  }, [isAuthenticated, nav]);

  // Bail out if the org already has a branch AND a service — the wizard is
  // for fresh orgs only. Owners can always revisit specific pages later.
  const statusQ = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => (await api.get('/organizations/onboarding-status')).data.data as {
      hasBranch: boolean; hasService: boolean; complete: boolean;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (statusQ.data?.complete) nav('/dashboard', { replace: true });
  }, [statusQ.data, nav]);

  // Reference data for pickers
  const citiesQ = useQuery({
    queryKey: ['onboarding-cities'],
    queryFn: async () => (await api.get('/locations/cities')).data.data as any[],
    staleTime: 5 * 60_000,
  });
  const catsQ = useQuery({
    queryKey: ['onboarding-service-cats'],
    queryFn: async () => (await api.get('/services/categories')).data.data as any[],
    staleTime: 5 * 60_000,
  });

  const createBranch = async () => {
    if (!branch.name || !branch.address || !branch.phone) {
      toast.error('Fill in every field');
      return;
    }
    setSaving(true);
    try {
      const cityId = branch.cityId || citiesQ.data?.[0]?.id;
      if (!cityId) throw new Error('No cities available — add a city in Settings first');
      const { data } = await api.post('/branches', {
        name: branch.name.trim(),
        address: branch.address.trim(),
        phone: branch.phone.trim(),
        email: user?.email || 'branch@salon.com',
        cityId,
      });
      const created = data?.data ?? data;
      setBranchId(created.id);
      toast.success(`Branch "${created.name}" created`);
      setStep('service');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not create branch');
    } finally {
      setSaving(false);
    }
  };

  const createService = async () => {
    if (!service.name || !service.price) {
      toast.error('Give the service a name and price');
      return;
    }
    setSaving(true);
    try {
      const categoryId = service.categoryId || catsQ.data?.[0]?.id;
      const payload: any = {
        name: service.name.trim(),
        duration: Number(service.duration),
        price: Number(service.price),
      };
      if (categoryId) payload.categoryId = categoryId;
      if (branchId) payload.branchIds = [branchId];
      await api.post('/services', payload);
      toast.success('First service added!');
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create service');
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;
  const stepIndex = step === 'welcome' ? 0 : step === 'branch' ? 1 : step === 'service' ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        {step !== 'welcome' && step !== 'done' && (
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-primary-700 font-semibold mb-2">
              Step {stepIndex} of {totalSteps}
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= stepIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Welcome, {user?.email?.split('@')[0]}!</h1>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                Let's get your salon ready to take bookings. Three quick steps and
                you're live.
              </p>
              <ul className="mt-6 text-left inline-block space-y-2">
                {[
                  { i: Building2, t: 'Add your first branch' },
                  { i: Scissors,  t: 'Add your first service' },
                  { i: CheckCircle2, t: 'Start taking bookings' },
                ].map((r, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                      <r.i className="w-4 h-4" />
                    </div>
                    {r.t}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setStep('branch')}
                className="mt-8 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg inline-flex items-center gap-2"
              >
                Let's go <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'branch' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your first branch</h2>
                  <p className="text-sm text-gray-500">You can add more later.</p>
                </div>
              </div>
              <div className="space-y-3">
                <input placeholder="Branch name (e.g. Anna Nagar)" value={branch.name} onChange={(e) => setBranch({ ...branch, name: e.target.value })} className="input" />
                <input placeholder="Full address" value={branch.address} onChange={(e) => setBranch({ ...branch, address: e.target.value })} className="input" />
                <input placeholder="Phone number" value={branch.phone} onChange={(e) => setBranch({ ...branch, phone: e.target.value })} className="input" />
                <select value={branch.cityId} onChange={(e) => setBranch({ ...branch, cityId: e.target.value })} className="input">
                  <option value="">
                    {citiesQ.isLoading ? 'Loading cities…' : '— Pick a city —'}
                  </option>
                  {(citiesQ.data || []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {(citiesQ.data?.length ?? 0) === 0 && !citiesQ.isLoading && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> No cities loaded — the first one available will be used.
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep('welcome')} className="btn-secondary">Back</button>
                <button onClick={createBranch} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </>
          )}

          {step === 'service' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your first service</h2>
                  <p className="text-sm text-gray-500">Add more in the Services page anytime.</p>
                </div>
              </div>
              <div className="space-y-3">
                <input placeholder="Service name (e.g. Men's Haircut)" value={service.name} onChange={(e) => setService({ ...service, name: e.target.value })} className="input" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input type="number" min={5} value={service.duration} onChange={(e) => setService({ ...service, duration: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Price (₹)</label>
                    <input type="number" min={0} placeholder="500" value={service.price} onChange={(e) => setService({ ...service, price: e.target.value })} className="input" />
                  </div>
                </div>
                <select value={service.categoryId} onChange={(e) => setService({ ...service, categoryId: e.target.value })} className="input">
                  <option value="">
                    {catsQ.isLoading ? 'Loading categories…' : '— Pick a category (optional) —'}
                  </option>
                  {(catsQ.data || []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep('branch')} className="btn-secondary">Back</button>
                <button onClick={createService} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & finish <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold">You're ready!</h2>
              <p className="text-gray-600 mt-2 max-w-sm mx-auto">
                Your salon is live. Next up: add your staff, share your booking link,
                and start filling chairs.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => nav('/dashboard')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => nav('/staff')}
                  className="border border-gray-300 hover:border-primary-600 text-gray-800 font-semibold px-6 py-3 rounded-full"
                >
                  Add staff
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Trial · Aveon Infotech Private Limited
        </p>
      </div>
    </div>
  );
}
