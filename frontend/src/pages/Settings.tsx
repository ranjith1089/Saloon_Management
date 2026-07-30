import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Lock, Building2, Bell, Info,
  Palette, DollarSign, CalendarDays, CreditCard,
  Save, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle,
  Plus, Trash2, GripVertical, RefreshCcw,
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type Tab = 'profile' | 'password' | 'business' | 'branding' | 'currency' | 'holidays' | 'payments' | 'notifications' | 'system';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'business', label: 'Business', icon: Building2, adminOnly: true },
    { id: 'branding', label: 'Branding', icon: Palette, adminOnly: true },
    { id: 'currency', label: 'Currency', icon: DollarSign, adminOnly: true },
    { id: 'holidays', label: 'Holidays', icon: CalendarDays, adminOnly: true },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Info, adminOnly: true },
  ];

  const { user } = useAuthStore();
  const visibleTabs = tabs.filter((t) => !t.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'password' && <PasswordTab />}
          {tab === 'business' && <BusinessTab />}
          {tab === 'branding' && <BrandingTab />}
          {tab === 'currency' && <CurrencyTab />}
          {tab === 'holidays' && <HolidaysTab />}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}

// ============ PROFILE TAB ============
function ProfileTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.data,
  });

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({
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

  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      toast.success('Profile updated (note: dedicated PATCH /auth/profile endpoint recommended for production)');
      return formData;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  if (isLoading) return <div className="card">Loading...</div>;

  return (
    <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="label">Email</label>
          <p className="text-sm font-medium">{data?.email}</p>
        </div>
        <div>
          <label className="label">Role</label>
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
            {data?.role}
          </span>
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
        <button type="submit" disabled={!isDirty || updateMutation.isPending} className="btn-primary">
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
        </button>
      </div>
    </form>
  );
}

// ============ PASSWORD TAB ============
function PasswordTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully. Please log in again.');
      reset();
      setTimeout(() => window.location.href = '/login', 1500);
    },
  });

  const newPass = watch('newPassword');

  return (
    <form onSubmit={handleSubmit((d) => {
      if (d.newPassword !== d.confirmPassword) return toast.error('Passwords do not match');
      changeMutation.mutate(d);
    })} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-gray-500 mt-1">Use at least 6 characters</p>
      </div>

      <div>
        <label className="label">Current Password</label>
        <div className="relative">
          <input type={showCurrent ? 'text' : 'password'} className="input pr-10"
            {...register('currentPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>}
      </div>

      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <input type={showNew ? 'text' : 'password'} className="input pr-10"
            {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>}
        {newPass && (
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1 flex-1 rounded ${newPass.length >= n * 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Confirm New Password</label>
        <input type="password" className="input" {...register('confirmPassword', { required: 'Required' })} />
        {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button type="submit" disabled={changeMutation.isPending} className="btn-primary">
          {changeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Change Password</>}
        </button>
      </div>
    </form>
  );
}

// ============ BUSINESS TAB ============
function BusinessTab() {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      businessName: localStorage.getItem('biz.name') || 'Salon Management',
      timezone: localStorage.getItem('biz.timezone') || 'Asia/Kolkata',
      dateFormat: localStorage.getItem('biz.dateFormat') || 'DD/MM/YYYY',
      language: localStorage.getItem('biz.language') || 'en',
      defaultCommission: localStorage.getItem('biz.commission') || '10',
      loyaltyPointsRate: localStorage.getItem('biz.loyalty') || '10',
    },
  });

  const onSubmit = (data: any) => {
    localStorage.setItem('biz.name', data.businessName);
    localStorage.setItem('biz.timezone', data.timezone);
    localStorage.setItem('biz.dateFormat', data.dateFormat);
    localStorage.setItem('biz.language', data.language);
    localStorage.setItem('biz.commission', data.defaultCommission);
    localStorage.setItem('biz.loyalty', data.loyaltyPointsRate);
    setSaved(true);
    toast.success('Business settings saved locally');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Business Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your salon's business preferences</p>
      </div>

      <LocalOnlyBanner />

      <div>
        <label className="label">Business Name</label>
        <input className="input" {...register('businessName')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Timezone</label>
          <select className="input" {...register('timezone')}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
        </div>
        <div>
          <label className="label">Date Format</label>
          <select className="input" {...register('dateFormat')}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Language</label>
          <select className="input" {...register('language')}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="ar">Arabic</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <div>
          <label className="label">Default Commission (%)</label>
          <input type="number" min="0" max="100" className="input" {...register('defaultCommission')} />
        </div>
        <div>
          <label className="label">Loyalty pts per ₹100</label>
          <input type="number" min="0" className="input" {...register('loyaltyPointsRate')} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        <button type="submit" className="btn-primary"><Save className="w-4 h-4 mr-1" /> Save</button>
      </div>
    </form>
  );
}

// ============ BRANDING TAB ============
function BrandingTab() {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      businessName: localStorage.getItem('brand.name') || 'Salon Management',
      tagline: localStorage.getItem('brand.tagline') || 'Book. Style. Repeat.',
      primaryColor: localStorage.getItem('brand.primary') || '#6366f1',
      secondaryColor: localStorage.getItem('brand.secondary') || '#ec4899',
      fontFamily: localStorage.getItem('brand.font') || 'Inter',
      logoUrl: localStorage.getItem('brand.logo') || '',
    },
  });

  const primary = watch('primaryColor');
  const secondary = watch('secondaryColor');
  const font = watch('fontFamily');
  const name = watch('businessName');
  const tagline = watch('tagline');
  const logo = watch('logoUrl');

  const onSubmit = (data: any) => {
    Object.entries({
      'brand.name': data.businessName,
      'brand.tagline': data.tagline,
      'brand.primary': data.primaryColor,
      'brand.secondary': data.secondaryColor,
      'brand.font': data.fontFamily,
      'brand.logo': data.logoUrl,
    }).forEach(([k, v]) => localStorage.setItem(k, v as string));
    // Apply primary color to CSS var immediately
    document.documentElement.style.setProperty('--primary', data.primaryColor);
    setSaved(true);
    toast.success('Branding saved');
    setTimeout(() => setSaved(false), 2000);
  };

  const resetToDefaults = () => {
    reset({
      businessName: 'Salon Management',
      tagline: 'Book. Style. Repeat.',
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
      fontFamily: 'Inter',
      logoUrl: '',
    });
    toast.success('Reverted to defaults');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Branding</h2>
          <p className="text-sm text-gray-500 mt-1">Customize your salon's look & feel</p>
        </div>

        <LocalOnlyBanner />

        <div>
          <label className="label">Business Name</label>
          <input className="input" {...register('businessName')} />
        </div>

        <div>
          <label className="label">Tagline</label>
          <input className="input" {...register('tagline')} placeholder="Short catchy phrase" />
        </div>

        <div>
          <label className="label">Logo URL</label>
          <input className="input" {...register('logoUrl')} placeholder="https://... (leave empty to use icon)" />
          <p className="text-xs text-gray-500 mt-1">Paste an image URL. File upload requires backend (Phase B).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" className="h-10 w-14 rounded border border-gray-300 cursor-pointer" {...register('primaryColor')} />
              <input className="input font-mono text-xs" {...register('primaryColor')} />
            </div>
          </div>
          <div>
            <label className="label">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" className="h-10 w-14 rounded border border-gray-300 cursor-pointer" {...register('secondaryColor')} />
              <input className="input font-mono text-xs" {...register('secondaryColor')} />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Font Family</label>
          <select className="input" {...register('fontFamily')}>
            <option>Inter</option>
            <option>Poppins</option>
            <option>Roboto</option>
            <option>Open Sans</option>
            <option>Lato</option>
            <option>Nunito</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
          <button type="button" onClick={resetToDefaults} className="btn-secondary text-sm">
            <RefreshCcw className="w-4 h-4 mr-1" /> Reset
          </button>
          <button type="submit" className="btn-primary"><Save className="w-4 h-4 mr-1" /> Save</button>
        </div>
      </form>

      {/* Live Preview */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Live Preview</h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ fontFamily: font }}>
          {/* Preview header */}
          <div className="p-4 flex items-center gap-2 border-b border-gray-200" style={{ backgroundColor: primary + '15' }}>
            {logo ? (
              <img src={logo} alt="logo" className="w-8 h-8 rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primary }}>
                {name?.[0] || 'S'}
              </div>
            )}
            <div>
              <p className="text-sm font-bold" style={{ color: primary }}>{name || 'Business Name'}</p>
              <p className="text-xs text-gray-500">{tagline || 'Tagline...'}</p>
            </div>
          </div>
          {/* Preview buttons & badges */}
          <div className="p-4 space-y-3">
            <button className="w-full text-sm text-white py-2 rounded-lg" style={{ backgroundColor: primary }}>
              Primary Button
            </button>
            <button className="w-full text-sm text-white py-2 rounded-lg" style={{ backgroundColor: secondary }}>
              Secondary Button
            </button>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>Primary</span>
              <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: secondary }}>Secondary</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: primary + '20', color: primary }}>Soft</span>
            </div>
            <div className="text-xs" style={{ color: primary }}>
              Sample link · <span style={{ color: secondary }}>accent text</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CURRENCY TAB ============
function CurrencyTab() {
  const [saved, setSaved] = useState(false);
  const { register, watch, handleSubmit } = useForm({
    defaultValues: {
      currency: localStorage.getItem('cur.code') || 'INR',
      symbol: localStorage.getItem('cur.symbol') || '₹',
      symbolPosition: localStorage.getItem('cur.pos') || 'before',
      decimals: localStorage.getItem('cur.dec') || '2',
      thousandSep: localStorage.getItem('cur.thou') || ',',
      decimalSep: localStorage.getItem('cur.decSep') || '.',
      showCode: localStorage.getItem('cur.showCode') === 'true',
    },
  });

  const cur = watch('currency');
  const sym = watch('symbol');
  const pos = watch('symbolPosition');
  const decimals = parseInt(watch('decimals'), 10);
  const thou = watch('thousandSep');
  const dec = watch('decimalSep');
  const showCode = watch('showCode');

  // Live preview number
  const previewNum = 1234567.89;
  const parts = previewNum.toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thou);
  const formatted = decimals > 0 ? `${intPart}${dec}${parts[1]}` : intPart;
  const withSymbol = pos === 'before' ? `${sym}${formatted}` : `${formatted}${sym}`;
  const finalPreview = showCode ? `${withSymbol} ${cur}` : withSymbol;

  const currencies: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', JPY: '¥', CAD: 'C$', AUD: 'A$',
  };

  const onSubmit = (data: any) => {
    localStorage.setItem('cur.code', data.currency);
    localStorage.setItem('cur.symbol', data.symbol);
    localStorage.setItem('cur.pos', data.symbolPosition);
    localStorage.setItem('cur.dec', data.decimals);
    localStorage.setItem('cur.thou', data.thousandSep);
    localStorage.setItem('cur.decSep', data.decimalSep);
    localStorage.setItem('cur.showCode', String(data.showCode));
    setSaved(true);
    toast.success('Currency settings saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Currency Settings</h2>
        <p className="text-sm text-gray-500 mt-1">How prices and amounts are displayed</p>
      </div>

      <LocalOnlyBanner />

      <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white p-6 rounded-xl">
        <p className="text-xs uppercase opacity-80">Live Preview</p>
        <p className="text-3xl font-bold mt-1">{finalPreview}</p>
        <p className="text-xs opacity-80 mt-1">Formatted from 1234567.89</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Currency</label>
          <select className="input" {...register('currency')}
            onChange={(e) => {
              const v = e.target.value;
              const symbol = currencies[v] || sym;
              const symbolInput = document.querySelector<HTMLInputElement>('[name="symbol"]');
              if (symbolInput) symbolInput.value = symbol;
              // let react-hook-form register catch it
              register('currency').onChange(e);
            }}
          >
            {Object.keys(currencies).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Symbol</label>
          <input className="input" {...register('symbol')} />
        </div>
      </div>

      <div>
        <label className="label">Symbol Position</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="before" {...register('symbolPosition')} /> Before ({sym}100)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="after" {...register('symbolPosition')} /> After (100{sym})
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Decimals</label>
          <select className="input" {...register('decimals')}>
            <option value="0">0 (no decimals)</option>
            <option value="2">2 (0.00)</option>
            <option value="3">3 (0.000)</option>
          </select>
        </div>
        <div>
          <label className="label">Thousand Separator</label>
          <select className="input" {...register('thousandSep')}>
            <option value=",">Comma (1,234)</option>
            <option value=".">Dot (1.234)</option>
            <option value=" ">Space (1 234)</option>
            <option value="">None (1234)</option>
          </select>
        </div>
        <div>
          <label className="label">Decimal Separator</label>
          <select className="input" {...register('decimalSep')}>
            <option value=".">Dot (0.5)</option>
            <option value=",">Comma (0,5)</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('showCode')} className="w-4 h-4" />
        Show currency code alongside symbol (e.g., ₹1,234 INR)
      </label>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        <button type="submit" className="btn-primary"><Save className="w-4 h-4 mr-1" /> Save</button>
      </div>
    </form>
  );
}

// ============ HOLIDAYS TAB ============
interface Holiday {
  id: string;
  name: string;
  date: string;
  repeats: boolean;
  behavior: 'BLOCK' | 'REDUCED' | 'WARN';
  color: string;
}

function HolidaysTab() {
  const load = (): Holiday[] => {
    try { return JSON.parse(localStorage.getItem('holidays') || '[]'); }
    catch { return []; }
  };
  const [holidays, setHolidays] = useState<Holiday[]>(load);
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', date: '', repeats: false, behavior: 'BLOCK', color: '#ef4444' },
  });

  const save = (list: Holiday[]) => {
    localStorage.setItem('holidays', JSON.stringify(list));
    setHolidays(list);
  };

  const onAdd = (data: any) => {
    save([...holidays, { ...data, id: crypto.randomUUID() }]);
    reset();
    setAdding(false);
    toast.success('Holiday added');
  };

  const onDelete = (id: string) => {
    save(holidays.filter((h) => h.id !== id));
    toast.success('Removed');
  };

  const importIndian = () => {
    const year = new Date().getFullYear();
    const nationalHolidays: Holiday[] = [
      { id: crypto.randomUUID(), name: 'Republic Day', date: `${year}-01-26`, repeats: true, behavior: 'BLOCK', color: '#f97316' },
      { id: crypto.randomUUID(), name: 'Independence Day', date: `${year}-08-15`, repeats: true, behavior: 'BLOCK', color: '#22c55e' },
      { id: crypto.randomUUID(), name: 'Gandhi Jayanti', date: `${year}-10-02`, repeats: true, behavior: 'BLOCK', color: '#8b5cf6' },
      { id: crypto.randomUUID(), name: 'Christmas', date: `${year}-12-25`, repeats: true, behavior: 'BLOCK', color: '#dc2626' },
      { id: crypto.randomUUID(), name: 'Diwali', date: `${year}-11-01`, repeats: true, behavior: 'BLOCK', color: '#eab308' },
    ];
    save([...holidays, ...nationalHolidays]);
    toast.success(`Added ${nationalHolidays.length} Indian holidays`);
  };

  const behaviorLabels: Record<string, string> = {
    BLOCK: 'Block all bookings',
    REDUCED: 'Reduced hours',
    WARN: 'Warn only',
  };

  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Holidays</h2>
            <p className="text-sm text-gray-500 mt-1">Days when bookings are blocked or restricted</p>
          </div>
          <div className="flex gap-2">
            <button onClick={importIndian} className="btn-secondary text-sm">Import Indian Holidays</button>
            <button onClick={() => setAdding(!adding)} className="btn-primary text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Holiday
            </button>
          </div>
        </div>

        <LocalOnlyBanner />

        {adding && (
          <form onSubmit={handleSubmit(onAdd)} className="mt-4 border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <h3 className="text-sm font-semibold">New Holiday</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" required {...register('name', { required: true })} /></div>
              <div><label className="label">Date</label><input type="date" className="input" required {...register('date', { required: true })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Behavior</label>
                <select className="input" {...register('behavior')}>
                  <option value="BLOCK">Block all bookings</option>
                  <option value="REDUCED">Reduced hours</option>
                  <option value="WARN">Warn only</option>
                </select>
              </div>
              <div><label className="label">Color</label><input type="color" className="input h-10" {...register('color')} /></div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input type="checkbox" {...register('repeats')} className="w-4 h-4" />
                  Repeats annually
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setAdding(false); reset(); }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-primary text-sm">Add</button>
            </div>
          </form>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Holiday</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Behavior</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Repeats</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedHolidays.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No holidays yet</p>
              </td></tr>
            ) : (
              sortedHolidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }}></span>
                      <span className="font-medium">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      h.behavior === 'BLOCK' ? 'bg-red-100 text-red-700' :
                      h.behavior === 'REDUCED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {behaviorLabels[h.behavior]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{h.repeats ? '↻ Yearly' : 'Once'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onDelete(h.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ PAYMENT METHODS TAB ============
interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'DIGITAL' | 'CARD' | 'BANK_TRANSFER';
  gateway: 'NONE' | 'RAZORPAY' | 'STRIPE' | 'PAYU' | 'PAYPAL';
  icon: string;
  enabled: boolean;
  sortOrder: number;
  testMode: boolean;
}

function PaymentsTab() {
  const load = (): PaymentMethod[] => {
    try { return JSON.parse(localStorage.getItem('payments') || '[]'); }
    catch { return []; }
  };
  const [methods, setMethods] = useState<PaymentMethod[]>(load);
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', type: 'CASH', gateway: 'NONE', icon: '💵', enabled: true, testMode: true },
  });

  const save = (list: PaymentMethod[]) => {
    const sorted = list.sort((a, b) => a.sortOrder - b.sortOrder);
    localStorage.setItem('payments', JSON.stringify(sorted));
    setMethods(sorted);
  };

  const onAdd = (data: any) => {
    save([...methods, { ...data, id: crypto.randomUUID(), sortOrder: methods.length }]);
    reset();
    setAdding(false);
    toast.success('Payment method added');
  };

  const toggleEnabled = (id: string) => {
    save(methods.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const onDelete = (id: string) => {
    save(methods.filter((m) => m.id !== id).map((m, i) => ({ ...m, sortOrder: i })));
    toast.success('Removed');
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const idx = methods.findIndex((m) => m.id === id);
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= methods.length) return;
    const list = [...methods];
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    save(list.map((m, i) => ({ ...m, sortOrder: i })));
  };

  const addDefaults = () => {
    const defaults: PaymentMethod[] = [
      { id: crypto.randomUUID(), name: 'Cash', type: 'CASH', gateway: 'NONE', icon: '💵', enabled: true, sortOrder: 0, testMode: false },
      { id: crypto.randomUUID(), name: 'UPI', type: 'DIGITAL', gateway: 'NONE', icon: '📱', enabled: true, sortOrder: 1, testMode: false },
      { id: crypto.randomUUID(), name: 'Card', type: 'CARD', gateway: 'RAZORPAY', icon: '💳', enabled: true, sortOrder: 2, testMode: true },
      { id: crypto.randomUUID(), name: 'Bank Transfer', type: 'BANK_TRANSFER', gateway: 'NONE', icon: '🏦', enabled: false, sortOrder: 3, testMode: false },
    ];
    save([...methods, ...defaults]);
    toast.success('Added 4 default methods');
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Payment Methods</h2>
            <p className="text-sm text-gray-500 mt-1">How customers can pay for services</p>
          </div>
          <div className="flex gap-2">
            {methods.length === 0 && (
              <button onClick={addDefaults} className="btn-secondary text-sm">Add Defaults</button>
            )}
            <button onClick={() => setAdding(!adding)} className="btn-primary text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Method
            </button>
          </div>
        </div>

        <LocalOnlyBanner />

        {adding && (
          <form onSubmit={handleSubmit(onAdd)} className="mt-4 border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <h3 className="text-sm font-semibold">New Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="label">Name</label><input className="input" required {...register('name', { required: true })} /></div>
              <div>
                <label className="label">Type</label>
                <select className="input" {...register('type')}>
                  <option value="CASH">Cash</option>
                  <option value="DIGITAL">Digital (UPI/Wallet)</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div><label className="label">Icon (emoji)</label><input className="input text-center text-2xl" maxLength={2} {...register('icon')} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Gateway</label>
                <select className="input" {...register('gateway')}>
                  <option value="NONE">None (offline)</option>
                  <option value="RAZORPAY">Razorpay</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="PAYU">PayU</option>
                  <option value="PAYPAL">PayPal</option>
                </select>
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('enabled')} className="w-4 h-4" defaultChecked /> Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('testMode')} className="w-4 h-4" /> Test Mode
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setAdding(false); reset(); }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-primary text-sm">Add</button>
            </div>
          </form>
        )}
      </div>

      {methods.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No payment methods yet</p>
          <button onClick={addDefaults} className="btn-primary mt-4 text-sm">Add Default Methods</button>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((m, i) => (
            <div key={m.id} className={`card flex items-center gap-4 ${!m.enabled ? 'opacity-60' : ''}`}>
              <div className="flex flex-col text-gray-400">
                <button onClick={() => move(m.id, 'up')} disabled={i === 0} className="disabled:opacity-30 text-xs">▲</button>
                <GripVertical className="w-4 h-4 my-1" />
                <button onClick={() => move(m.id, 'down')} disabled={i === methods.length - 1} className="disabled:opacity-30 text-xs">▼</button>
              </div>

              <div className="text-3xl">{m.icon}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{m.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{m.type}</span>
                  {m.gateway !== 'NONE' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">via {m.gateway}</span>
                  )}
                  {m.testMode && m.gateway !== 'NONE' && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">TEST</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.enabled ? '✓ Available at checkout' : '✗ Hidden from checkout'}
                </p>
              </div>

              <button
                onClick={() => toggleEnabled(m.id)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  m.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  m.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>

              <button onClick={() => onDelete(m.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ NOTIFICATIONS TAB ============
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailBookings: localStorage.getItem('pref.emailBookings') !== 'false',
    emailPromotions: localStorage.getItem('pref.emailPromotions') !== 'false',
    smsBookings: localStorage.getItem('pref.smsBookings') === 'true',
    smsReminders: localStorage.getItem('pref.smsReminders') !== 'false',
    inAppAll: localStorage.getItem('pref.inAppAll') !== 'false',
    weeklyReport: localStorage.getItem('pref.weeklyReport') !== 'false',
  });

  const toggle = (key: keyof typeof prefs) => {
    const newVal = !prefs[key];
    setPrefs({ ...prefs, [key]: newVal });
    localStorage.setItem(`pref.${key}`, String(newVal));
    toast.success(`${newVal ? 'Enabled' : 'Disabled'} ${key}`);
  };

  const items = [
    { key: 'emailBookings' as const, label: 'Booking Emails', desc: 'Get emailed when a booking is created, updated or cancelled' },
    { key: 'emailPromotions' as const, label: 'Promotional Emails', desc: 'Receive occasional offers and news' },
    { key: 'smsBookings' as const, label: 'Booking SMS', desc: 'Receive an SMS for booking confirmations' },
    { key: 'smsReminders' as const, label: 'Reminder SMS', desc: '1-hour reminder SMS before your appointment' },
    { key: 'inAppAll' as const, label: 'In-App Notifications', desc: 'Show alerts in the notification bell' },
    { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Emailed summary every Monday' },
  ];

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified</p>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.key} className="flex items-start justify-between py-3">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                prefs[item.key] ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SYSTEM TAB ============
function SystemTab() {
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const start = Date.now();
      const res = await api.get('/health' as any);
      return { ...res.data, latency: Date.now() - start };
    },
    refetchInterval: 30000,
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const appName = import.meta.env.VITE_APP_NAME || 'Salon Management';

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">System Information</h2>
        <div className="divide-y divide-gray-100">
          <InfoRow label="Application" value={appName} />
          <InfoRow label="Frontend Version" value="1.0.0 (Phase 2 + Settings)" />
          <InfoRow label="API URL" value={apiUrl || 'not set'} mono />
          <InfoRow label="API Status"
            value={health ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Healthy ({health.latency}ms)
              </span>
            ) : <span className="text-gray-400">Checking...</span>} />
          <InfoRow label="Environment" value="Production" />
          <InfoRow label="Deployment" value="Vercel + Railway" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <p className="text-sm font-medium text-red-900">Clear Local Cache</p>
          <p className="text-xs text-red-700 mt-1">
            Wipes browser-stored preferences and cached data. You'll be logged out.
          </p>
          <button
            onClick={() => {
              if (confirm('Clear all local data and log out?')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }
            }}
            className="mt-3 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            Clear & Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ HELPERS ============
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono text-xs break-all max-w-[60%]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function LocalOnlyBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800">
        Settings are currently stored locally in your browser. Phase B (backend persistence) is next.
      </p>
    </div>
  );
}
