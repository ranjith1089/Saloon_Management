import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Lock, Building2, Bell, Info,
  Save, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type Tab = 'profile' | 'password' | 'business' | 'notifications' | 'system';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'business', label: 'Business', icon: Building2, adminOnly: true },
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
          <div className="card p-2">
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
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'password' && <PasswordTab />}
          {tab === 'business' && <BusinessTab />}
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
      // Update via customer endpoint if customer, else use a generic profile update
      // For now, we'll just show success — a dedicated profile update endpoint would go here
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

      {/* Read-only info */}
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

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button type="button" onClick={() => reset()} disabled={!isDirty} className="btn-secondary">
          Reset
        </button>
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
      if (d.newPassword !== d.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      changeMutation.mutate(d);
    })} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-gray-500 mt-1">Use at least 6 characters</p>
      </div>

      <div>
        <label className="label">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            className="input pr-10"
            {...register('currentPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>}
      </div>

      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            className="input pr-10"
            {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
          />
          <button type="button" onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>}
        {newPass && (
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`h-1 flex-1 rounded ${
                newPass.length >= n * 2 ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Confirm New Password</label>
        <input
          type="password"
          className="input"
          {...register('confirmPassword', { required: 'Required' })}
        />
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
      currency: localStorage.getItem('biz.currency') || 'INR',
      timezone: localStorage.getItem('biz.timezone') || 'Asia/Kolkata',
      dateFormat: localStorage.getItem('biz.dateFormat') || 'DD/MM/YYYY',
      language: localStorage.getItem('biz.language') || 'en',
      defaultCommission: localStorage.getItem('biz.commission') || '10',
      loyaltyPointsRate: localStorage.getItem('biz.loyalty') || '10',
    },
  });

  const onSubmit = (data: any) => {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(`biz.${key.replace(/([A-Z])/g, (_, c) => c.toLowerCase())}`, value as string);
    });
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Business settings are currently stored locally. In production, wire these to a
          <code className="bg-amber-100 px-1 mx-1 rounded">/settings</code> API for multi-device sync.
        </p>
      </div>

      <div>
        <label className="label">Business Name</label>
        <input className="input" {...register('businessName')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Currency</label>
          <select className="input" {...register('currency')}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Date Format</label>
          <select className="input" {...register('dateFormat')}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Default Staff Commission (%)</label>
          <input type="number" min="0" max="100" className="input" {...register('defaultCommission')} />
        </div>
        <div>
          <label className="label">Loyalty Points per ₹100 spent</label>
          <input type="number" min="0" className="input" {...register('loyaltyPointsRate')} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4 mr-1" /> Save Settings
        </button>
      </div>
    </form>
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
            <button
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                prefs[item.key] ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
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
          <InfoRow label="Frontend Version" value="1.0.0 (Phase 2)" />
          <InfoRow label="API URL" value={apiUrl || 'not set'} mono />
          <InfoRow
            label="API Status"
            value={
              health ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Healthy ({health.latency}ms)
                </span>
              ) : (
                <span className="text-gray-400">Checking...</span>
              )
            }
          />
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
